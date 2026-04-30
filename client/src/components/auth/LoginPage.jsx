import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function LoginPage({ onGoSignup, onGoForgot }) {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Vui lòng điền đầy đủ email và mật khẩu.'); return; }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // onAuthStateChange sẽ tự cập nhật user → AuthGate chuyển sang App
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email hoặc mật khẩu không đúng.'
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎌</div>
        <h1 className="auth-title">YouTube Long-Form Key Finder</h1>
        <p className="auth-subtitle">Đăng nhập để tiếp tục</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email" value={email} autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          <div className="auth-field">
            <label>Mật khẩu</label>
            <input
              type="password" value={password} autoComplete="current-password"
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Đang đăng nhập...</> : '🔐 Đăng nhập'}
          </button>
        </form>

        <div className="auth-links">
          <button className="auth-link" onClick={onGoForgot}>Quên mật khẩu?</button>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <button className="auth-link" onClick={onGoSignup}>Tạo tài khoản mới</button>
        </div>
      </div>
    </div>
  );
}
