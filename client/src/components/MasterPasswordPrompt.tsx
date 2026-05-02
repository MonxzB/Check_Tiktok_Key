// ============================================================
// components/MasterPasswordPrompt.tsx — Re-auth after lock
// Phase 18: TikTok Channel Manager
// ============================================================
import React, { useState, useEffect } from 'react';

interface Props {
  userId: string;
  failedAttempts: number;
  onUnlock: (masterPassword: string, userId: string) => Promise<boolean>;
  onForgot?: () => void;
}

const COOLDOWN_SECS = 30; // cooldown after 3 failed attempts

export default function MasterPasswordPrompt({
  userId, failedAttempts, onUnlock, onForgot,
}: Props) {
  const [pw,       setPw]       = useState('');
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining

  // Trigger 30s cooldown after every 3rd failed attempt
  useEffect(() => {
    if (failedAttempts > 0 && failedAttempts % 3 === 0) {
      setCooldown(COOLDOWN_SECS);
    }
  }, [failedAttempts]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(prev => {
      if (prev <= 1) { clearInterval(t); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setError('');
    setBusy(true);
    try {
      const ok = await onUnlock(pw, userId);
      if (!ok) {
        setError(`Sai mật khẩu. Còn ${2 - ((failedAttempts) % 3)} lần trước khi bị khóa tạm.`);
        setPw('');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '2.8rem', marginBottom: 14 }}>🔒</div>
      <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>Vault bị khóa</h2>
      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
        Nhập Master Password để giải mã credentials
      </p>

      {cooldown > 0 ? (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '20px', marginBottom: 16,
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>
            🚫 Quá nhiều lần thử sai
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Thử lại sau <strong>{cooldown}s</strong>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Master Password"
              autoFocus
              autoComplete="current-password"
              required
              style={{ width: '100%', paddingRight: 40 }}
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
                color: 'var(--text-muted)',
              }}
            >
              {show ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#ef4444', textAlign: 'left', fontWeight: 500 }}>
              ❌ {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !pw}
            style={{ padding: '10px', fontWeight: 700 }}
          >
            {busy ? '⏳ Đang xác thực…' : '🔓 Mở khóa'}
          </button>
        </form>
      )}

      {onForgot && (
        <button
          className="btn"
          onClick={onForgot}
          style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}
        >
          Quên Master Password? (Xóa tất cả credentials)
        </button>
      )}
    </div>
  );
}
