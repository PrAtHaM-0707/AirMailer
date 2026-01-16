import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getPool } from '../utils/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-change-this';

// GET /api/logs/get
router.get('/get', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization required' });
    }
    const token = authHeader.split(' ')[1];
    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Check if email is verified
    const pool = getPool();
    const userResult = await pool.query('SELECT email_verified FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0 || !userResult.rows[0].email_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Please verify your email to view logs.' });
    }

    const logsResult = await pool.query(
      `SELECT id, recipient AS to, 'Email Sent' AS subject, status, sent_at AS timestamp, 'msg_' || id AS messageId
       FROM email_logs
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT 50`,
      [userId]
    );
    res.status(200).json({ success: true, logs: logsResult.rows });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[LOGS ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Failed to fetch logs', error: errorMessage });
  }
});

export default router;