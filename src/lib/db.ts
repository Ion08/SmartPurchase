import { createClient, SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabaseClient: SupabaseClient | undefined;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase environment variables are not set');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase =
  globalForSupabase.supabaseClient ??
  createClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseKey || 'placeholder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabaseClient = supabase;

// Type for query results to match pg library format
interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
}

// Execute a raw SQL query using Supabase RPC
// Note: You need to create this PostgreSQL function in Supabase:
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const { data, error } = await supabase.rpc('exec_sql', { 
    query: text, 
    params: params || [] 
  });
  
  if (error) {
    if (error.message.includes('function') && error.message.includes('does not exist')) {
      throw new Error(
        'Database connection error. Create the exec_sql function in Supabase, ' +
        'or use supabase.from("table").select() API directly.'
      );
    }
    throw new Error(`Query error: ${error.message}`);
  }
  
  return { rows: data || [] };
}

// Helper for single row queries (backward compatible)
export async function queryOne(text: string, params?: unknown[]): Promise<Record<string, unknown> | null> {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Helper for multiple rows (backward compatible)
export async function queryMany(text: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
  const result = await query(text, params);
  return result.rows;
}
