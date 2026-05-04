// client/src/hooks/useAuth.tsx
import {
  useState, useEffect, useCallback, useRef,
  createContext, useContext,
  type ReactNode,
} from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';

// ── Session timeout: 5 hours ───────────────────────────────────
const SESSION_DURATION_MS = 5 * 60 * 60 * 1000; // 5h
const LOGIN_TS_KEY = 'ytlf_login_ts';

function recordLoginTime() {
  try { localStorage.setItem(LOGIN_TS_KEY, String(Date.now())); } catch {}
}
function clearLoginTime() {
  try { localStorage.removeItem(LOGIN_TS_KEY); } catch {}
}
function isSessionExpired(): boolean {
  try {
    const ts = localStorage.getItem(LOGIN_TS_KEY);
    if (!ts) return false; // no record = first load, let Supabase decide
    return Date.now() - parseInt(ts, 10) > SESSION_DURATION_MS;
  } catch { return false; }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check session expiry every minute
  function startExpiryWatcher(signOutFn: () => Promise<void>) {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(async () => {
      if (isSessionExpired()) {
        clearInterval(timerRef.current!);
        clearLoginTime();
        await signOutFn();
      }
    }, 60_000); // check every 60s
  }

  function stopExpiryWatcher() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  const doSignOut = useCallback(async () => {
    stopExpiryWatcher();
    clearLoginTime();
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 4000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        if (isSessionExpired()) {
          // Session timestamp found but expired — sign out silently
          clearLoginTime();
          supabase.auth.signOut().catch(() => {});
          setUser(null);
        } else {
          setUser(session.user);
          startExpiryWatcher(doSignOut);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // Refresh token không còn hợp lệ → xóa token cũ, logout im lặng
        if (event === 'TOKEN_REFRESHED' && !session) {
          clearLoginTime();
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          stopExpiryWatcher();
          setLoading(false);
          return;
        }
        if (event === 'SIGNED_OUT') {
          clearLoginTime();
          setUser(null);
          stopExpiryWatcher();
          setLoading(false);
          return;
        }
        if (session?.user) {
          setUser(session.user);
          startExpiryWatcher(doSignOut);
        } else {
          setUser(null);
          stopExpiryWatcher();
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
      stopExpiryWatcher();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    recordLoginTime();          // ← stamp login time on success
    startExpiryWatcher(doSignOut);
    return data;
  }, [doSignOut]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = doSignOut;

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw error;
    recordLoginTime();
    startExpiryWatcher(doSignOut);
  }, [doSignOut]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
