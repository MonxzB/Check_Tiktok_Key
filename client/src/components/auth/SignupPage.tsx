import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

interface SignupPageProps {
  onGoLogin: () => void;
}

// ── Main component ────────────────────────────────────────────
export default function SignupPage({ onGoLogin }: SignupPageProps) {
  const { signUp } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  // ── Register ─────────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password)  { setError('Vui lòng điền đầy đủ thông tin.'); return; }
    if (password.length < 6)  { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    if (password !== confirm)  { setError('Mật khẩu xác nhận không khớp.'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      // Confirm email đã tắt → session tự tạo → AuthGate tự redirect
      setSuccess(true);
    } catch (err) {
      const msg = (err as Error).message ?? '';
      const status = (err as { status?: number }).status;
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('Email này đã được đăng ký. Vui lòng đăng nhập.');
      } else if (status === 500 || msg.toLowerCase().includes('server error')) {
        setError('Máy chủ xác thực gặp sự cố. Vui lòng thử lại sau vài phút.');
      } else {
        setError(msg || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SUCCESS — Đăng ký xong, đang tự đăng nhập
  // ═══════════════════════════════════════════════════════════
  if (success) return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <h1 className="auth-title" style={{ marginBottom: 8 }}>Đăng ký thành công!</h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Tài khoản <strong style={{ color: 'var(--accent, #00e5ff)' }}>{email}</strong> đã được tạo.<br />
            Đang đăng nhập vào ứng dụng...
          </p>
          <div style={{ marginTop: 20 }}>
            <span className="spinner" style={{ display: 'inline-block' }} />
          </div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN — Registration form
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎌</div>
        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Đăng ký miễn phí để dùng tool</p>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email" value={email} autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" disabled={loading}
            />
          </div>
          <div className="auth-field">
            <label>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password}
                autoComplete="new-password"
                onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                disabled={loading}
                style={{ paddingRight: 36 }}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowPw(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '1rem',
                  color: 'var(--text-muted)',
                  padding: 0, lineHeight: 1,
                }}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password" value={confirm} autoComplete="new-password"
              onChange={e => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu" disabled={loading}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading
              ? <><span className="spinner" /> Đang tạo tài khoản...</>
              : '✨ Tạo tài khoản'}
          </button>
        </form>

        <div className="auth-links">
          <span className="text-text-muted" style={{ fontSize: '0.85rem' }}>Đã có tài khoản?</span>
          <button className="auth-link" onClick={onGoLogin}>Đăng nhập ngay</button>
        </div>
      </div>
    </div>
  );
}
