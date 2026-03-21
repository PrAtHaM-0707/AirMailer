import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { getPool } from '../utils/db';
import { z } from 'zod';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { BrevoClient } from '@getbrevo/brevo'; // ✅ FIXED IMPORT

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
    
    const parseResult = sendEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, message: parseResult.error.issues[0].message });
    }
    
    const { to, subject, text, html } = parseResult.data;

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

    // ✅ FIXED BREVO IMPLEMENTATION
    if (process.env.EMAIL_PROVIDER === 'brevo' && process.env.BREVO_API_KEY) {
      logger.info(`[SEND IN PROGRESS] Attempting to send email via Brevo API`, { fromUserId: userId, to });
      const client = new BrevoClient({
        apiKey: process.env.BREVO_API_KEY
      });

      await client.transactionalEmails.sendTransacEmail({
        sender: {
          name: 'AirMailer API',
          email: process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || ''
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: sanitizedHtml,
        textContent: text
      });

      logger.info('[EMAIL SENT] API email sent successfully via Brevo API', { to, subject, userId, timestamp: new Date().toISOString() });

    } else {
      logger.info(`[SEND IN PROGRESS] Attempting to send email via Nodemailer`, { fromUserId: userId, to });
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        logger: true,
        debug: true
      });

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text,
        html: sanitizedHtml
      });

      logger.info('[EMAIL SENT] API email sent successfully via Nodemailer SMTP', { to, userId });
    }

    await pool.query(
      'INSERT INTO email_logs (user_id, recipient, subject, status) VALUES ($1, $2, $3, $4)',
      [userId, to, subject, 'success']
    );

    res.status(200).json({ success: true, message: 'Email sent' });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.stack || err.message : 'Unknown error';
    logger.error('[SEND ERROR] API email failed to send', { error: errorMessage, stack: err instanceof Error ? err.stack : undefined });
    res.status(500).json({ success: false, message: 'Send failed', error: errorMessage });
  }
});

export default router;