import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function SignupPage({ onGoLogin }) {
  const { signUp } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Vui lòng điền đầy đủ thông tin.'); return; }
    if (password.length < 6)  { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    if (password !== confirm)  { setError('Mật khẩu xác nhận không khớp.'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setDone(true);
    } catch (err) {
      setError(err.message.includes('already registered')
        ? 'Email này đã được đăng ký. Vui lòng đăng nhập.'
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📧</div>
        <h2 style={{ color: 'var(--green)', marginBottom: 8 }}>Kiểm tra email của bạn!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
          Chúng tôi đã gửi link xác nhận đến <strong style={{ color: 'var(--accent)' }}>{email}</strong>.
          <br />Bấm vào link trong email để kích hoạt tài khoản.
        </p>
        <button className="btn btn-primary auth-btn" onClick={onGoLogin}>Quay lại đăng nhập</button>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎌</div>
        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Đăng ký miễn phí để dùng tool</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" value={email} autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" disabled={loading} />
          </div>
          <div className="auth-field">
            <label>Mật khẩu</label>
            <input type="password" value={password} autoComplete="new-password"
              onChange={e => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự" disabled={loading} />
          </div>
          <div className="auth-field">
            <label>Xác nhận mật khẩu</label>
            <input type="password" value={confirm} autoComplete="new-password"
              onChange={e => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu" disabled={loading} />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Đang tạo tài khoản...</> : '✨ Tạo tài khoản'}
          </button>
        </form>

        <div className="auth-links">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Đã có tài khoản?</span>
          <button className="auth-link" onClick={onGoLogin}>Đăng nhập ngay</button>
        </div>
      </div>
    </div>
  );
}
