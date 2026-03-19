import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { getPool } from '../utils/db';
import { z } from 'zod';
import { hashApiKey } from '../utils/hash';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const router = Router();

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 1000, 
  message: { success: false, message: 'Too many email requests from this IP, please try again later.' }
});

const sendEmailSchema = z.object({
  to: z.string().email('Invalid recipient email format').max(254, 'Email too long'),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject too long'),
  text: z.string().max(10000, 'Text exceeds size limit').optional(),
  html: z.string().max(50000, 'HTML exceeds size limit').optional(),
}).refine(data => data.text || data.html, {
  message: "Either text or html content must be provided",
  path: ["text"]
});

// POST /api/email/send
router.post('/send', emailLimiter, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'API key required in Authorization header' });
    }
    const apiKey = authHeader.split(' ')[1];
    const hashedApiKey = hashApiKey(apiKey);
    
    const parseResult = sendEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, message: parseResult.error.issues[0].message });
    }
    
    // Explicitly handle html and text fallback to handle the TS undefined checking correctly later
    const { to, subject, text, html } = parseResult.data;

    let sanitizedHtml = html;
    if (html) {
      sanitizedHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '');
    }
    const pool = getPool();
    const keyResult = await pool.query('SELECT user_id FROM api_keys WHERE api_key = $1', [hashedApiKey]);
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
    const errorMessage = err instanceof Error ? err.stack || err.message : 'Unknown error';
    logger.error('[SEND ERROR]', { error: errorMessage });
    res.status(500).json({ success: false, message: 'Send failed', error: errorMessage });
  }
});

export default router;