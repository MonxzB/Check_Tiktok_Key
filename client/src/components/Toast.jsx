import React, { useEffect } from 'react';

export default function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
