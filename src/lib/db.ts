import { Pool } from 'pg';

const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

// Helper function for queries
export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper for single row queries
export async function queryOne(text: string, params?: unknown[]) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Helper for multiple rows
export async function queryMany(text: string, params?: unknown[]) {
  const result = await query(text, params);
  return result.rows;
}
