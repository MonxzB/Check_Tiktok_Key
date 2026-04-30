import React from 'react';
import { APP_NOTICE } from '../engine/constants.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Header() {
  const { user, signOut } = useAuth();
  return (
    <header className="header">
      <h1>🎌 YouTube Long-Form Key Finder</h1>
      <p>Tìm &amp; chấm điểm keyword YouTube long-form tiếng Nhật cho nội dung gốc</p>
      <div className="notice-banner">{APP_NOTICE}</div>
      {user && (
        <div className="auth-user-bar">
          <span className="auth-email">👤 {user.email}</span>
          <button className="btn btn-secondary auth-logout-btn" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}

