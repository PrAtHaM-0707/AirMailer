import { Router, Request, Response } from 'express';
import { getPool } from '../utils/db';

const router = Router();

// GET /api/test-db (assuming it's GET, adjust if POST)
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    console.log('[TEST-DB] Endpoint started');
    const pool = getPool();
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) AS count FROM users');
    const count = result.rows[0].count;
    client.release();
    res.status(200).json({ success: true, message: 'Database connected successfully!', userCount: count, time: new Date().toISOString() });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[TEST-DB ERROR]', errorMessage);
    res.status(500).json({ success: false, error: 'Database connection failed', message: errorMessage, hint: 'Check logs' });
  }
});

export default router;