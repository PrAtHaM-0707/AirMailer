import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigrations() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Running schema.sql...');
    const schemaSQL = fs.readFileSync('./schema.sql', 'utf8');

    // Execute the entire schema as one query
    console.log('Executing database schema...');
    await client.query(schemaSQL);

    console.log('✅ Database schema created successfully!');
    client.release();
  } catch (error) {
    console.error('❌ Error creating database schema:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();