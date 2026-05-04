import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

interface SignupPageProps {
  onGoLogin: () => void;
}

// ── 6-box OTP Input ───────────────────────────────────────────
const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
}

function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first empty box on mount
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function handleChange(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1); // only last digit
    const next = [...value];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < OTP_LENGTH - 1) {
      refs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const next = [...value];
        next[idx] = '';
        onChange(next);
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      refs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill('');
    [...text].forEach((ch, i) => { next[i] = ch; });
    onChange(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          disabled={disabled}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          style={{
            width: 46,
            height: 54,
            textAlign: 'center',
            fontSize: '1.4rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            letterSpacing: 0,
            borderRadius: 10,
            border: value[idx]
              ? '2px solid var(--accent, #00e5ff)'
              : '2px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: value[idx] ? '0 0 0 3px rgba(0,229,255,0.15)' : 'none',
            caretColor: 'var(--accent, #00e5ff)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--accent, #00e5ff)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.15)';
          }}
          onBlur={e => {
            if (!value[idx]) {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        />
      ))}
    </div>
  );
}

// ── Resend cooldown hook ──────────────────────────────────────
function useResendCooldown(seconds = 60) {
  const [remaining, setRemaining] = useState(0);

  function start() { setRemaining(seconds); }

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining(r => r <= 1 ? 0 : r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  return { remaining, start, canResend: remaining === 0 };
}

// ── Main component ────────────────────────────────────────────
export default function SignupPage({ onGoLogin }: SignupPageProps) {
  const { signUp, verifyOtp } = useAuth();

  // Step 1 state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);

  // Step 2 state
  const [step,    setStep]    = useState<1 | 2>(1);
  const [otp,     setOtp]     = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpCode = otp.join('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const cooldown = useResendCooldown(60);

  // ── Step 1: Register ───────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password)      { setError('Vui lòng điền đầy đủ thông tin.'); return; }
    if (password.length < 6)      { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    if (password !== confirm)     { setError('Mật khẩu xác nhận không khớp.'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setStep(2);
      cooldown.start();
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg.includes('already registered')
        ? 'Email này đã được đăng ký. Vui lòng đăng nhập.'
        : msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (otpCode.length < OTP_LENGTH) { setError('Vui lòng nhập đủ 6 chữ số.'); return; }
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otpCode);
      // verifyOtp thành công → AuthProvider tự cập nhật user → AuthGate render App
    } catch (err) {
      const msg = (err as Error).message;
      setError(
        msg.toLowerCase().includes('expired')   ? 'Mã OTP đã hết hạn. Vui lòng gửi lại.' :
        msg.toLowerCase().includes('invalid')   ? 'Mã OTP không đúng. Hãy kiểm tra lại.' :
        msg
      );
      setOtp(Array(OTP_LENGTH).fill(''));
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (!cooldown.canResend) return;
    setError('');
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setOtp(Array(OTP_LENGTH).fill(''));
      cooldown.start();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [cooldown, email, password, signUp]);

  // ═══════════════════════════════════════════════════════════
  // STEP 2 — OTP verification screen
  // ═══════════════════════════════════════════════════════════
  if (step === 2) return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Icon + heading */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 8 }}>📬</div>
          <h1 className="auth-title" style={{ marginBottom: 6 }}>Xác nhận email</h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
            Mã xác nhận 6 chữ số đã được gửi đến<br />
            <strong style={{ color: 'var(--accent, #00e5ff)' }}>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify}>
          {/* OTP boxes */}
          <div style={{ marginBottom: 20 }}>
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* Verify button */}
          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading || otpCode.length < OTP_LENGTH}
          >
            {loading
              ? <><span className="spinner" /> Đang xác nhận...</>
              : '✅ Xác nhận'}
          </button>
        </form>

        {/* Resend + back */}
        <div className="auth-links" style={{ flexDirection: 'column', gap: 8, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>
              Không nhận được mã?
            </span>
            <button
              className="auth-link"
              onClick={handleResend}
              disabled={!cooldown.canResend || loading}
              style={{ opacity: cooldown.canResend ? 1 : 0.5 }}
            >
              {cooldown.remaining > 0
                ? `Gửi lại (${cooldown.remaining}s)`
                : 'Gửi lại mã'}
            </button>
          </div>
          <button
            className="auth-link"
            style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)' }}
            onClick={() => { setStep(1); setError(''); setOtp(Array(OTP_LENGTH).fill('')); }}
          >
            ← Sửa email / Quay lại
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // STEP 1 — Registration form
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
