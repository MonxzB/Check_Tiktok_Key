// client/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được cấu hình.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,       // Giữ đăng nhập qua localStorage
    autoRefreshToken: true,     // Tự refresh JWT
    detectSessionInUrl: true,   // Bắt magic link từ URL (reset password)
  },
});
