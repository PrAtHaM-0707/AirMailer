import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { getPool } from '../utils/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-change-this';

// GET /api/keys/get
router.get('/get', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Check if email is verified
    const pool = getPool();
    const userResult = await pool.query('SELECT email_verified FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0 || !userResult.rows[0].email_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Please verify your email to access API keys.' });
    }

    const keyResult = await pool.query('SELECT api_key FROM api_keys WHERE user_id = $1', [userId]);
    if (keyResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }
    res.status(200).json({ success: true, apiKey: keyResult.rows[0].api_key });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[GET-API-KEY ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Failed to retrieve API key', error: errorMessage });
  }
});

// POST /api/keys/regenerate
router.post('/regenerate', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Check if email is verified
    const pool = getPool();
    const userResult = await pool.query('SELECT email_verified, password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0 || !userResult.rows[0].email_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Please verify your email to regenerate API keys.' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required for security' });
    }

    const passwordMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    await pool.query('DELETE FROM api_keys WHERE user_id = $1', [userId]);
    const newApiKey = `am_${uuidv4()}`;
    await pool.query('INSERT INTO api_keys (user_id, api_key) VALUES ($1, $2)', [userId, newApiKey]);
    res.status(200).json({ success: true, message: 'API key regenerated successfully!', newApiKey });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[REGENERATE ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Failed to regenerate key', error: errorMessage });
  }
});

export default router;