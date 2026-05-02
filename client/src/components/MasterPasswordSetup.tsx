// ============================================================
// components/MasterPasswordSetup.tsx — First-time vault setup
// Phase 18: TikTok Channel Manager (Tailwind)
// ============================================================
import React, { useState } from 'react';

interface Props {
  userId: string;
  onSetup: (masterPassword: string, userId: string) => Promise<void>;
  onSkip?: () => void;
}

export default function MasterPasswordSetup({ userId, onSetup, onSkip }: Props) {
  const [pw,     setPw]     = useState('');
  const [pwConf, setPwConf] = useState('');
  const [show,   setShow]   = useState(false);
  const [error,  setError]  = useState('');
  const [busy,   setBusy]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (pw.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return; }
    if (pw !== pwConf)  { setError('Mật khẩu xác nhận không khớp.'); return; }
    setBusy(true);
    try { await onSetup(pw, userId); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  const strength = pw.length < 8 ? 'Yếu' : pw.length < 12 ? 'Trung bình' : pw.length < 16 ? 'Mạnh' : 'Rất mạnh';

  return (
    <div className="max-w-[460px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="text-5xl mb-3">🔐</div>
        <h2 className="text-xl font-bold mb-2">Thiết lập Master Password</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Master Password dùng để mã hóa tất cả credentials (password, token, cookie) của các channel TikTok.
          <br />
          <strong>Quan trọng:</strong> Nếu quên, credentials sẽ không thể khôi phục (zero-knowledge).
        </p>
      </div>

      {/* Warning box */}
      <div className="rounded-[10px] px-4 py-3 mb-6 text-sm text-text-secondary"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
        ⚠️ <strong>Lưu ý bảo mật:</strong> Master Password KHÔNG lưu ở bất kỳ đâu.
        Mỗi phiên làm việc bạn sẽ cần nhập lại (sau khi đóng tab hoặc 15 phút không hoạt động).
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Password field */}
        <div>
          <label className="block text-[0.83rem] font-semibold mb-1.5">Master Password</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
              required
              className="w-full box-border pr-10"
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base text-text-muted p-0">
              {show ? '🙈' : '👁️'}
            </button>
          </div>
          {/* Strength bar */}
          {pw && (
            <div className="mt-1.5 flex items-center gap-1">
              {[8, 12, 16].map(threshold => (
                <div key={threshold} className="flex-1 h-[3px] rounded-sm transition-colors duration-200"
                  style={{
                    background: pw.length >= threshold
                      ? threshold === 8 ? '#f59e0b' : threshold === 12 ? '#22c55e' : '#3b82f6'
                      : 'rgba(255,255,255,0.06)',
                  }} />
              ))}
              <span className="text-[0.7rem] text-text-muted ml-1">{strength}</span>
            </div>
          )}
        </div>

        {/* Confirm field */}
        <div>
          <label className="block text-[0.83rem] font-semibold mb-1.5">Xác nhận Master Password</label>
          <input
            type={show ? 'text' : 'password'}
            value={pwConf}
            onChange={e => setPwConf(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            required
            className="w-full box-border"
          />
        </div>

        {error && <p className="m-0 text-[0.82rem] text-red-400 font-medium">❌ {error}</p>}

        <button type="submit" className="btn btn-primary mt-1 py-2.5 font-bold justify-center w-full" disabled={busy}>
          {busy ? '⏳ Đang xử lý…' : '🔐 Thiết lập Vault'}
        </button>
      </form>

      {onSkip && (
        <div className="mt-5 text-center">
          <button className="btn text-[0.78rem] text-text-muted" onClick={onSkip}>
            Bỏ qua (sẽ dùng Supabase Vault, không zero-knowledge)
          </button>
        </div>
      )}
    </div>
  );
}
