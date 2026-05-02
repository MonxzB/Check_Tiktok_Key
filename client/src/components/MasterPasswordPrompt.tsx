// ============================================================
// components/MasterPasswordPrompt.tsx — Re-auth after lock
// Phase 18: TikTok Channel Manager (Tailwind)
// ============================================================
import React, { useState, useEffect } from 'react';

interface Props {
  userId: string;
  failedAttempts: number;
  onUnlock: (masterPassword: string, userId: string) => Promise<boolean>;
  onForgot?: () => void;
}

const COOLDOWN_SECS = 30;

export default function MasterPasswordPrompt({ userId, failedAttempts, onUnlock, onForgot }: Props) {
  const [pw,       setPw]       = useState('');
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (failedAttempts > 0 && failedAttempts % 3 === 0) setCooldown(COOLDOWN_SECS);
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
    setError(''); setBusy(true);
    try {
      const ok = await onUnlock(pw, userId);
      if (!ok) {
        setError(`Sai mật khẩu. Còn ${2 - (failedAttempts % 3)} lần trước khi bị khóa tạm.`);
        setPw('');
      }
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-[400px] mx-auto px-6 py-8 text-center">
      <div className="text-5xl mb-3.5">🔒</div>
      <h2 className="text-lg font-bold mb-2">Vault bị khóa</h2>
      <p className="text-[0.83rem] text-text-muted mb-6 leading-relaxed">
        Nhập Master Password để giải mã credentials
      </p>

      {cooldown > 0 ? (
        <div className="rounded-[10px] p-5 mb-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="m-0 text-[0.9rem] text-red-400 font-semibold">🚫 Quá nhiều lần thử sai</p>
          <p className="mt-2 m-0 text-[0.82rem] text-text-muted">
            Thử lại sau <strong>{cooldown}s</strong>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Master Password"
              autoFocus
              autoComplete="current-password"
              required
              disabled={busy}
              className="w-full box-border pr-10"
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base text-text-muted p-0">
              {show ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <p className="m-0 text-[0.82rem] text-red-400 text-left font-medium">❌ {error}</p>
          )}

          <button type="submit" className="btn btn-primary py-2.5 font-bold w-full justify-center"
            disabled={busy || !pw}>
            {busy ? '⏳ Đang xác thực…' : '🔓 Mở khóa'}
          </button>
        </form>
      )}

      {onForgot && (
        <button className="btn mt-4 text-[0.78rem] text-text-muted" onClick={onForgot}>
          Quên Master Password? (Xóa tất cả credentials)
        </button>
      )}
    </div>
  );
}
