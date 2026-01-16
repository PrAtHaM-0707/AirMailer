import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { getPool } from '../utils/db';

const router = Router();

// POST /api/email/send
router.post('/send', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'API key required in Authorization header' });
    }
    const apiKey = authHeader.split(' ')[1];
    const { to, subject, text, html } = req.body;
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ success: false, message: 'Recipient, subject, and message content required' });
    }
    if (subject.length > 255 || (text && text.length > 10000) || (html && html.length > 50000)) {
      return res.status(400).json({ success: false, message: 'Subject too long or content exceeds size limit' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || to.length > 254) {
      return res.status(400).json({ success: false, message: 'Invalid recipient email format or too long' });
    }
    let sanitizedHtml = html;
    if (html) {
      sanitizedHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '');
    }
    const pool = getPool();
    const keyResult = await pool.query('SELECT user_id FROM api_keys WHERE api_key = $1', [apiKey]);
    if (keyResult.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }
    const userId = keyResult.rows[0].user_id;
    const todayResult = await pool.query(
      `SELECT COUNT(*) AS count FROM email_logs WHERE user_id = $1 AND sent_at >= CURRENT_DATE AND status = 'success'`,
      [userId]
    );
    const sentToday = parseInt(todayResult.rows[0].count, 10);
    if (sentToday >= 10) {
      return res.status(429).json({ success: false, message: 'Daily limit reached' });
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({ from: process.env.GMAIL_USER, to, subject, text, html: sanitizedHtml });
    await pool.query('INSERT INTO email_logs (user_id, recipient, status) VALUES ($1, $2, $3)', [userId, to, 'success']);
    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SEND ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Send failed', error: errorMessage });
  }
});

export default router;