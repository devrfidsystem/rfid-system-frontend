import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export type { Session } from '@supabase/supabase-js';

export const getSupabaseSession = () => supabase.auth.getSession();
export const signOutSupabase = () => supabase.auth.signOut();
