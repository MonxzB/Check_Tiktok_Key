import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

interface ForgotPasswordPageProps {
  onGoLogin: () => void;
}

export default function ForgotPasswordPage({ onGoLogin }: ForgotPasswordPageProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Vui lòng nhập email.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div className="auth-page">
      <div className="auth-card text-center">
        <div className="text-5xl mb-3">🔑</div>
        <h2 className="text-green-400 mb-2">Đã gửi link đặt lại!</h2>
        <p className="text-text-secondary mb-6 leading-relaxed">
          Kiểm tra email <strong className="text-accent">{email}</strong> và bấm vào link để đặt lại mật khẩu.
          <br /><span className="text-[0.82rem] text-text-muted">Link có hiệu lực trong 24 giờ.</span>
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
