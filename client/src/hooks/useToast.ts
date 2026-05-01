// ============================================================
// hooks/useToast.ts
// ============================================================
import { useState, useCallback } from 'react';
import type { ToastItem, ToastFn, ToastType } from '../types';
export type { ToastFn } from '../types';

let toastId = 0;

export interface UseToastReturn {
  toasts: ToastItem[];
  toast: ToastFn;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback<ToastFn>((message: string, type: ToastType = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, toast };
}
