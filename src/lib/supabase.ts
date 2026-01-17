import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/services/SupabaseAdapter';
import { SupabaseAdapter } from '@/services/SupabaseAdapter';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create typed supabase client directly
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const supabaseAdapter = new SupabaseAdapter(supabaseUrl, supabaseAnonKey);
