import React from 'react';
import type { ToastItem } from '../types';

interface ToastProps {
  toasts: ToastItem[];
}

export default function Toast({ toasts }: ToastProps) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
