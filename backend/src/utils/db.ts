import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Global pool configuration for better performance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!connectionString) {
    throw new Error('Database connection string not found. Please set POSTGRES_URL or DATABASE_URL environment variable.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      // Connection pooling settings
      max: 10, // Maximum number of clients in the pool
      min: 2,  // Minimum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
      query_timeout: 10000, // Abort queries after 10 seconds
      statement_timeout: 10000, // Abort statements after 10 seconds
      idle_in_transaction_session_timeout: 10000, // Terminate idle transactions after 10 seconds
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
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