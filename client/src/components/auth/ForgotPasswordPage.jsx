import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function ForgotPasswordPage({ onGoLogin }) {
  const { resetPassword } = useAuth();
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [done, setDone]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Vui lòng nhập email.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔑</div>
        <h2 style={{ color: 'var(--green)', marginBottom: 8 }}>Đã gửi link đặt lại!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
          Kiểm tra email <strong style={{ color: 'var(--accent)' }}>{email}</strong> và bấm vào link để đặt lại mật khẩu.
          <br /><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Link có hiệu lực trong 24 giờ.</span>
        </p>
        <button className="btn btn-primary auth-btn" onClick={onGoLogin}>Quay lại đăng nhập</button>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Lấy lại mật khẩu</h1>
        <p className="auth-subtitle">Nhập email để nhận link đặt lại mật khẩu</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email đăng ký</label>
            <input type="email" value={email} autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" disabled={loading} />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Đang gửi...</> : '📧 Gửi link đặt lại'}
          </button>
        </form>

        <div className="auth-links">
          <button className="auth-link" onClick={onGoLogin}>← Quay lại đăng nhập</button>
        </div>
      </div>
    </div>
  );
}
