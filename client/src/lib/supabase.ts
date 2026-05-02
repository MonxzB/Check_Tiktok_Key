/**
 * lib/supabase.ts
 *
 * Task 2.2: Supabase singleton — clean implementation.
 *
 * The globalThis hack was a band-aid for Vite splitting @supabase/* across
 * multiple chunks. That root cause is now fixed in vite.config.ts via
 * manualChunks → all @supabase/* packages land in one 'supabase' chunk.
 *
 * This file is now a simple, idiomatic Supabase client initializer.
 * storageKey is still set to prevent collisions with other Supabase apps
 * running on the same localhost origin during development.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    /**
     * Custom storage key prevents token collisions when multiple Supabase
     * projects are running on the same origin (e.g. localhost dev).
     */
    storageKey: 'ytlf-auth-token',
    persistSession: true,
    autoRefreshToken: true,
  },
});
