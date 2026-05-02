// ============================================================
// hooks/usePersistentState.ts — Phase 16.10: Persistent UI State
// Saves/restores state from localStorage. Falls back gracefully.
// ============================================================
import { useState, useEffect, useCallback } from 'react';

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Drop-in replacement for useState that automatically persists value.
 * Only synchronizes on mount (not across tabs — use useSyncedState for that).
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setStateInternal] = useState<T>(() => safeRead(key, initialValue));

  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setStateInternal(prev => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      safeWrite(key, next);
      return next;
    });
  }, [key]);

  return [state, setState];
}

/**
 * Persist any value to localStorage whenever it changes.
 * Use this when state is managed elsewhere (e.g. via a reducer).
 */
export function useLocalPersist<T>(key: string, value: T): void {
  useEffect(() => {
    safeWrite(key, value);
  }, [key, value]);
}

/**
 * Restore a single value from localStorage.
 * Returns undefined if not found.
 */
export function useLocalRestore<T>(key: string): T | undefined {
  const [value] = useState<T | undefined>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  });
  return value;
}
