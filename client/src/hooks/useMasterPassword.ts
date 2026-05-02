// ============================================================
// hooks/useMasterPassword.ts — Zero-knowledge vault key management
// Phase 18: TikTok Channel Manager
//
// Flow:
//   First time → MasterPasswordSetup component → deriveKey() → createCanary()
//               → saveMasterPasswordRecord() → persistKeyToSession()
//   Subsequent → MasterPasswordPrompt → deriveKey() → verifyCanary()
//               → persistKeyToSession()
//   Auto-lock  → 15min of no mousemove/keydown → clearKeyFromSession(), key=null
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import {
  deriveKey, createCanary, verifyCanary,
  persistKeyToSession, restoreKeyFromSession, clearKeyFromSession,
  generateSalt, isCryptoSupported,
} from '../engine/encryption';
import {
  fetchMasterPasswordRecord,
  saveMasterPasswordRecord,
} from '../engine/tiktokChannels';

const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export type MasterPasswordState =
  | 'loading'       // checking sessionStorage + Supabase
  | 'unsupported'   // browser lacks Web Crypto API
  | 'first_time'    // no record in DB — need setup
  | 'locked'        // record exists, key not in session
  | 'unlocked';     // key in memory

export interface UseMasterPasswordReturn {
  state: MasterPasswordState;
  isUnlocked: boolean;
  key: CryptoKey | null;
  failedAttempts: number;
  /** Setup: call on first-time setup with chosen master password */
  setup: (masterPassword: string, userId: string) => Promise<void>;
  /** Unlock: call on re-auth prompt with entered master password */
  unlock: (masterPassword: string, userId: string) => Promise<boolean>;
  /** Manually lock the vault */
  lock: () => void;
}

export function useMasterPassword(): UseMasterPasswordReturn {
  const [state, setState] = useState<MasterPasswordState>('loading');
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // ── Restore key from sessionStorage on mount ───────────────
  useEffect(() => {
    if (!isCryptoSupported()) {
      setState('unsupported');
      return;
    }
    restoreKeyFromSession().then(restored => {
      if (restored) {
        setKey(restored);
        setState('unlocked');
      } else {
        // Will be resolved to first_time or locked once user provides userId
        setState('locked');
      }
    });
  }, []);

  // ── Activity-based auto-lock ───────────────────────────────
  useEffect(() => {
    if (state !== 'unlocked' || !key) return;

    let timer: ReturnType<typeof setTimeout>;

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        clearKeyFromSession();
        setKey(null);
        setState('locked');
      }, LOCK_TIMEOUT_MS);
    }

    resetTimer();
    document.addEventListener('mousemove', resetTimer, { passive: true });
    document.addEventListener('keydown',   resetTimer, { passive: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', resetTimer);
      document.removeEventListener('keydown',   resetTimer);
    };
  }, [state, key]);

  // ── Setup (first time) ────────────────────────────────────
  const setup = useCallback(async (masterPassword: string, userId: string) => {
    const salt = generateSalt();
    const derivedKey = await deriveKey(masterPassword, salt);
    const canary = await createCanary(derivedKey);
    await saveMasterPasswordRecord(userId, salt, canary.ciphertext, canary.iv);
    await persistKeyToSession(derivedKey);
    setKey(derivedKey);
    setState('unlocked');
    setFailedAttempts(0);
  }, []);

  // ── Unlock (re-auth) ──────────────────────────────────────
  const unlock = useCallback(async (masterPassword: string, userId: string): Promise<boolean> => {
    const record = await fetchMasterPasswordRecord(userId);
    if (!record) {
      setState('first_time');
      return false;
    }
    const derivedKey = await deriveKey(masterPassword, record.salt);
    const valid = await verifyCanary(derivedKey, record.canary_ciphertext, record.canary_iv);
    if (!valid) {
      setFailedAttempts(prev => prev + 1);
      return false;
    }
    await persistKeyToSession(derivedKey);
    setKey(derivedKey);
    setState('unlocked');
    setFailedAttempts(0);
    return true;
  }, []);

  // ── Manual lock ───────────────────────────────────────────
  const lock = useCallback(() => {
    clearKeyFromSession();
    setKey(null);
    setState('locked');
  }, []);

  // ── Check first_time vs locked when userId becomes available ──
  // Components call checkFirstTime(userId) when mounting TikTok tab
  const checkFirstTime = useCallback(async (userId: string) => {
    if (state !== 'locked') return;
    const record = await fetchMasterPasswordRecord(userId);
    if (!record) setState('first_time');
  }, [state]);

  // Expose checkFirstTime via a side-channel: if state=locked and we don't
  // yet know if it's first_time, callers should invoke unlock() with any
  // string — the record check inside will set first_time automatically.
  void checkFirstTime; // referenced for future use

  return { state, isUnlocked: state === 'unlocked', key, failedAttempts, setup, unlock, lock };
}
