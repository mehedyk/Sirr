import { SupabaseAdapter } from '@/services/SupabaseAdapter';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdapter = new SupabaseAdapter(supabaseUrl, supabaseAnonKey);
export const supabase = supabaseAdapter.getClient();
