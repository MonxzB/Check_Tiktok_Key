// client/src/lib/supabase.ts
// NOTE: Use globalThis singleton to prevent duplicate GoTrueClient instances
// when the module is bundled into both static and dynamic chunks by Vite.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được cấu hình.');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
const SINGLETON_KEY = '__ytlf_supabase_client__';

if (!g[SINGLETON_KEY]) {
  g[SINGLETON_KEY] = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ytlf-auth-token', // Explicit key prevents collision
    },
  });
}

export const supabase: SupabaseClient = g[SINGLETON_KEY];
