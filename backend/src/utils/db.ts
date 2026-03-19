import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!connectionString) {
    throw new Error('Database connection string not found. Please set POSTGRES_URL or DATABASE_URL environment variable.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10, 
      min: 2,  
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, 
      query_timeout: 10000, 
      statement_timeout: 10000, 
      idle_in_transaction_session_timeout: 10000, 
    });

    pool.on('error', (err) => {
      // Neon DB aggressively closes idle connections. 
      // We just log it as a warning instead of a massive stack trace.
      console.warn(`[DB WARNING] Idle client disconnected: ${err.message}`);
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}