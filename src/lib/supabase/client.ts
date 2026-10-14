import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
    return null;
  }

  // Ensure singleton instance in browser environment to prevent concurrent Web Lock deadlocks
  if (typeof window !== 'undefined') {
    if (!clientInstance) {
      clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return clientInstance;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
