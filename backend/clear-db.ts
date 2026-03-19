import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function clearDatabase() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS email_logs CASCADE');
    await client.query('DROP TABLE IF EXISTS api_keys CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('✅ Database cleared successfully!');
    client.release();
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await pool.end();
  }
}

clearDatabase();