// ============================================================
// components/MasterPasswordSetup.tsx — First-time vault setup
// Phase 18: TikTok Channel Manager
// ============================================================
import React, { useState } from 'react';

interface Props {
  userId: string;
  onSetup: (masterPassword: string, userId: string) => Promise<void>;
  onSkip?: () => void; // optional skip to Supabase Vault mode (future)
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
    try {
      await onSetup(pw, userId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>🔐</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>
          Thiết lập Master Password
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Master Password dùng để mã hóa tất cả credentials (password, token, cookie) của các channel TikTok.
          <br />
          <strong>Quan trọng:</strong> Nếu quên, credentials sẽ không thể khôi phục (zero-knowledge).
        </p>
      </div>

      <div style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 24,
        fontSize: '0.82rem', color: 'var(--text-secondary)',
      }}>
        ⚠️ <strong>Lưu ý bảo mật:</strong> Master Password KHÔNG lưu ở bất kỳ đâu.
        Mỗi phiên làm việc bạn sẽ cần nhập lại (sau khi đóng tab hoặc 15 phút không hoạt động).
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, marginBottom: 6 }}>
            Master Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
              required
              style={{ width: '100%', paddingRight: 40 }}
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
          {/* Strength indicator */}
          {pw && (
            <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
              {[8, 12, 16].map(threshold => (
                <div key={threshold} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: pw.length >= threshold
                    ? threshold === 8 ? '#f59e0b' : threshold === 12 ? '#22c55e' : '#3b82f6'
                    : 'var(--bg-elevated)',
                  transition: 'background 0.2s',
                }} />
              ))}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                {pw.length < 8 ? 'Yếu' : pw.length < 12 ? 'Trung bình' : pw.length < 16 ? 'Mạnh' : 'Rất mạnh'}
              </span>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, marginBottom: 6 }}>
            Xác nhận Master Password
          </label>
          <input
            type={show ? 'text' : 'password'}
            value={pwConf}
            onChange={e => setPwConf(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#ef4444', fontWeight: 500 }}>
            ❌ {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy}
          style={{ marginTop: 4, padding: '10px', fontWeight: 700 }}
        >
          {busy ? '⏳ Đang xử lý…' : '🔐 Thiết lập Vault'}
        </button>
      </form>

      {onSkip && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button className="btn" onClick={onSkip} style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Bỏ qua (sẽ dùng Supabase Vault, không zero-knowledge)
          </button>
        </div>
      )}
    </div>
  );
}
