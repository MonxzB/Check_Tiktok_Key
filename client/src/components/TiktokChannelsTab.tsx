// ============================================================
// components/TiktokChannelsTab.tsx — Phase 18 (Tailwind)
// TikTok Channel Manager: table view + CRUD + vault gate
// Inline credential columns with per-row decrypt + toggle
// ============================================================
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { TiktokChannel, TiktokChannelStatus, PlainCredentials } from '../types';
import type { UseTiktokChannelsReturn } from '../hooks/useTiktokChannels';
import type { UseMasterPasswordReturn } from '../hooks/useMasterPassword';
import MasterPasswordSetup from './MasterPasswordSetup';
import MasterPasswordPrompt from './MasterPasswordPrompt';
import { isCryptoSupported } from '../engine/encryption';
import { decryptCredentials } from '../engine/tiktokChannels';

// ── Paste-import parser ───────────────────────────────────────
// Supported format: username|tiktokPassword|email|emailPassword|cookie
// Parts are detected by heuristics — order can vary.
interface ParsedLine {
  raw: string;
  username: string;
  channelName: string;
  email: string;
  password: string;       // email/hotmail password
  userPass: string;       // TikTok login password
  cookie: string;         // full cookie string
  secondaryEmail: string;
  valid: boolean;
  error?: string;
}

function isCookieStr(s: string): boolean {
  return (
    s.length > 80 &&
    (s.includes('tt_csrf_token') || s.includes('sessionid') ||
     s.includes('ttwid') || s.includes('sid_tt') ||
     (s.includes(';') && s.includes('=')))
  );
}
function isEmail(s: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}
function isUsername(s: string): boolean {
  // TikTok username: no spaces, no @, reasonable length
  return s.length >= 3 && s.length <= 50 && !s.includes('@') && !s.includes('=') && !s.includes(';');
}

export function parsePastedLine(line: string): ParsedLine {
  const result: ParsedLine = {
    raw: line, username: '', channelName: '', email: '',
    password: '', userPass: '', cookie: '', secondaryEmail: '', valid: false,
  };
  const parts = line.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) { result.error = 'Cần ít nhất 2 trường cách nhau bởi |'; return result; }

  // Separate cookie from short fields first
  const cookiePart = parts.find(isCookieStr) ?? '';
  const otherParts = parts.filter(p => p !== cookiePart);

  const emails = otherParts.filter(isEmail);
  const nonEmailShort = otherParts.filter(p => !isEmail(p) && p.length <= 60);

  // email[0] = primary (hotmail), email[1] = secondary
  result.email = emails[0] ?? '';
  result.secondaryEmail = emails[1] ?? '';

  // First non-email short string = username, rest = passwords
  const [usernameGuess, ...passwords] = nonEmailShort;
  result.username = (usernameGuess ?? '').replace(/^@/, '');
  result.channelName = result.username;
  // If 2 passwords: first = TikTok password, second = email password
  // If 1 password: treat as TikTok password (more common)
  if (passwords.length >= 2) {
    result.userPass  = passwords[0];  // TikTok login pw
    result.password  = passwords[1];  // Hotmail pw
  } else if (passwords.length === 1) {
    result.userPass  = passwords[0];
  }
  result.cookie = cookiePart;

  if (!result.username) { result.error = 'Không tìm thấy username'; return result; }
  result.valid = true;
  return result;
}

export function parsePastedText(text: string): ParsedLine[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(parsePastedLine);
}

// ── Paste Import Modal ────────────────────────────────────────
interface PasteImportModalProps {
  onClose: () => void;
  onSave: (ch: Omit<TiktokChannel,'id'|'userId'|'createdAt'|'updatedAt'>, creds: PlainCredentials, key: CryptoKey | null) => Promise<void>;
  vaultKey: CryptoKey | null;
}
function PasteImportModal({ onClose, onSave, vaultKey }: PasteImportModalProps) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [err, setErr] = useState('');
  const [step, setStep] = useState<'paste'|'preview'>('paste');

  function handleParse() {
    const lines = parsePastedText(text);
    if (!lines.length) { setErr('Không có dòng nào hợp lệ'); return; }
    setParsed(lines); setStep('preview'); setErr('');
  }

  async function handleImport() {
    setBusy(true); setErr(''); setDone(0);
    const validRows = parsed.filter(p => p.valid);
    for (const row of validRows) {
      try {
        const ch: Omit<TiktokChannel,'id'|'userId'|'createdAt'|'updatedAt'> = {
          channelName: row.channelName || row.username,
          username: row.username,
          channelUrl: `https://www.tiktok.com/@${row.username}`,
          uuid: null, channelId: null, niche: null, language: 'ja', status: 'active',
          followersCount: 0, followingCount: 0, videosCount: 0, totalLikes: 0, avgViews: 0,
          targetKeywords: [], tags: [], isMonetized: false, isCreatorFund: false,
          notes: null, priority: 0,
        };
        const creds: PlainCredentials = {};
        if (row.email)         creds.email    = row.email;
        if (row.password)      creds.password = row.password;
        if (row.userPass)      creds.token    = `[UserPass]${row.userPass}`;
        if (row.cookie)        creds.cookie   = row.cookie;
        if (row.secondaryEmail) creds.secondaryEmail = row.secondaryEmail;
        await onSave(ch, creds, vaultKey);
        setDone(d => d + 1);
      } catch(e) { setErr((e as Error).message); }
    }
    setBusy(false);
    if (!err) onClose();
  }

  const validCount = parsed.filter(p => p.valid).length;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full rounded-xl p-6" style={{ maxWidth: 780, maxHeight: '90vh', overflow: 'auto', background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold m-0">📋 Import hàng loạt từ clipboard</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        {step === 'paste' && (
          <>
            <p className="text-[0.8rem] text-text-muted mb-3">
              Paste dữ liệu theo định dạng <code className="bg-[rgba(255,255,255,0.07)] px-1 rounded">username|tiktokPassword|email|emailPassword|cookie</code>, mỗi tài khoản một dòng.
              Hệ thống tự nhận dạng các trường theo thứ tự và kiểu dữ liệu.
            </p>
            <textarea
              className="field-input w-full font-mono text-[0.75rem] resize-y"
              rows={10}
              placeholder={`user7288051187522|5kK!jfey31AbM|giayeetram1396@outlook.com|ZN89To0GFm|tt_csrf_token=...\nuser9876543210|AnotherPw!|account2@hotmail.com|Pw2|sessionid=...`}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            {err && <p className="text-red-400 text-[0.8rem] mt-2">❌ {err}</p>}
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn" onClick={onClose}>Huỷ</button>
              <button className="btn btn-primary" onClick={handleParse} disabled={!text.trim()}>📊 Phân tích →</button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <p className="text-[0.82rem] mb-3">
              Tìm thấy <strong>{parsed.length}</strong> dòng — <strong className="text-green-400">{validCount} hợp lệ</strong>{parsed.length - validCount > 0 && <span className="text-red-400"> / {parsed.length - validCount} lỗi</span>}.
              {!vaultKey && <span className="text-amber-400 ml-2">⚠️ Vault chưa mở — credentials sẽ không được mã hóa.</span>}
            </p>
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.07)', maxHeight: 320 }}>
              <table className="w-full border-collapse text-[0.75rem]">
                <thead>
                  <tr style={{ background: 'rgba(15,23,50,0.9)', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                    {['#','Status','Username','Email','TikTok PW','Cookie'].map(h => (
                      <th key={h} className="px-2 py-2 text-left font-semibold text-text-muted uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-2 py-1.5 text-text-muted">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        {row.valid
                          ? <span className="text-green-400">✅</span>
                          : <span className="text-red-400" title={row.error}>❌</span>}
                      </td>
                      <td className="px-2 py-1.5 font-semibold">{row.username || '—'}</td>
                      <td className="px-2 py-1.5 text-text-muted">{row.email || '—'}</td>
                      <td className="px-2 py-1.5 font-mono">{row.userPass ? '••••••••' : '—'}</td>
                      <td className="px-2 py-1.5">
                        {row.cookie ? <span className="text-cyan-400 text-[0.7rem]">{row.cookie.substring(0, 30)}…</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {err && <p className="text-red-400 text-[0.8rem] mt-2">❌ {err}</p>}
            {busy && <p className="text-text-muted text-[0.8rem] mt-2">⏳ Đang lưu {done}/{validCount}…</p>}
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn" onClick={() => setStep('paste')}>← Sửa lại</button>
              <button className="btn" onClick={onClose}>Huỷ</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={busy || validCount === 0}>
                {busy ? `⏳ ${done}/${validCount}…` : `💾 Import ${validCount} channel`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


const STATUS_BADGE: Record<TiktokChannelStatus, { label: string; color: string; bg: string }> = {
  active:       { label: '🟢 Hoạt động',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  warming_up:   { label: '🔵 Khởi động',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  warning:      { label: '🟡 Cảnh báo',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  shadowbanned: { label: '🟠 Shadow ban',    color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  banned:       { label: '🔴 Bị cấm',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  paused:       { label: '⚪ Tạm dừng',      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  archived:     { label: '🗃️ Lưu trữ',      color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function relTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 7)  return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

// ── Inline credential cell ────────────────────────────────────
function CredCell({ value, masked = true }: { value: string | undefined; masked?: boolean }) {
  const [show, setShow] = useState(false);
  if (!value) return <span className="text-text-muted text-[0.72rem]">—</span>;
  return (
    <span className="flex items-center gap-1 min-w-0">
      <span className="font-mono text-[0.72rem] truncate max-w-[130px]" style={{ color: '#e2e8f0' }}>
        {(masked && !show) ? '••••••••' : value}
      </span>
      {masked && (
        <button onClick={e => { e.stopPropagation(); setShow(s => !s); }}
          className="text-[0.68rem] shrink-0 text-text-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0">
          {show ? '🙈' : '👁'}
        </button>
      )}
      <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(value).catch(() => {}); }}
        className="text-[0.68rem] shrink-0 text-text-muted hover:text-cyan-400 transition-colors bg-transparent border-none cursor-pointer p-0"
        title="Copy">📋</button>
    </span>
  );
}

// ── Per-row decrypted creds ───────────────────────────────────
function useRowCreds(channel: TiktokChannel, vaultKey: CryptoKey | null) {
  const [creds, setCreds] = useState<PlainCredentials | null>(null);

  useEffect(() => {
    if (!vaultKey) { setCreds(null); return; }
    decryptCredentials(channel, vaultKey)
      .then(c => setCreds(c))
      .catch(() => setCreds(null));
  }, [channel.id, vaultKey]);

  return creds;
}

// ── Channel row ───────────────────────────────────────────────
function ChannelRow({ ch, vaultKey, onSelectChannel, onDelete }: {
  ch: TiktokChannel;
  vaultKey: CryptoKey | null;
  onSelectChannel: (ch: TiktokChannel) => void;
  onDelete: (ch: TiktokChannel) => void;
}) {
  const creds = useRowCreds(ch, vaultKey);
  const badge = STATUS_BADGE[ch.status];

  // Strip [UserPass] prefix for display
  const tiktokPw = creds?.token?.startsWith('[UserPass]')
    ? creds.token.slice(10)
    : (creds?.token ?? undefined);

  return (
    <tr
      className="transition-colors duration-100"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      {/* Trạng thái */}
      <td className="px-2 py-2 whitespace-nowrap">
        <span className="rounded-md px-1.5 py-0.5 text-[0.72rem] font-semibold"
          style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
      </td>
      {/* Tên kênh */}
      <td className="px-2 py-2 whitespace-nowrap">
        <div className="font-semibold text-[0.82rem]">{ch.channelName}</div>
        <div className="text-[0.72rem] text-text-muted">@{ch.username}</div>
      </td>
      {/* Mật khẩu TikTok */}
      <td className="px-2 py-2"><CredCell value={tiktokPw} masked={true} /></td>
      {/* Email */}
      <td className="px-2 py-2"><CredCell value={creds?.email} masked={false} /></td>
      {/* Mật khẩu email */}
      <td className="px-2 py-2"><CredCell value={creds?.password} masked={true} /></td>
      {/* Token/Cookie */}
      <td className="px-2 py-2"><CredCell value={creds?.cookie} masked={true} /></td>
      {/* Email phụ */}
      <td className="px-2 py-2"><CredCell value={creds?.secondaryEmail} masked={false} /></td>
      {/* Ghi chú */}
      <td className="px-2 py-2 text-text-muted text-[0.75rem] max-w-[140px] truncate" title={ch.notes ?? ''}>
        {ch.notes || '—'}
      </td>
      {/* Thao tác */}
      <td className="px-2 py-2">
        <div className="flex gap-1.5">
          <button className="btn text-[0.72rem]" style={{ padding: '2px 8px' }}
            onClick={e => { e.stopPropagation(); onSelectChannel(ch); }}>Xem</button>
          <button
            className="btn text-[0.72rem]"
            style={{ padding: '2px 8px', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
            onClick={e => { e.stopPropagation(); onDelete(ch); }}
            title="Xóa channel"
          >🗑</button>
        </div>
      </td>
    </tr>
  );
}

// ── Add Channel Modal ─────────────────────────────────────────
interface AddModalProps {
  onClose: () => void;
  onSave: (ch: Omit<TiktokChannel,'id'|'userId'|'createdAt'|'updatedAt'>, creds: PlainCredentials, key: CryptoKey | null) => Promise<void>;
  vaultKey: CryptoKey | null;
}

function AddChannelModal({ onClose, onSave, vaultKey }: AddModalProps) {
  const [channelName,    setChannelName]    = useState('');
  const [username,       setUsername]       = useState('');
  const [channelUrl,     setChannelUrl]     = useState('');
  const [niche,          setNiche]          = useState('');
  const [language,       setLanguage]       = useState<'ja'|'ko'|'en'|'vi'|'other'>('ja');
  const [status,         setStatus]         = useState<TiktokChannelStatus>('active');
  const [followers,      setFollowers]      = useState('');
  const [notes,          setNotes]          = useState('');
  const [uuid,           setUuid]           = useState('');
  // Credentials
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [userPass,       setUserPass]       = useState('');
  const [token,          setToken]          = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [showPw,         setShowPw]         = useState(false);
  const [showUserPw,     setShowUserPw]     = useState(false);
  const [showToken,      setShowToken]      = useState(false);
  const [busy,           setBusy]           = useState(false);
  const [err,            setErr]            = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim() || !username.trim()) { setErr('Cần nhập tên channel và @username'); return; }
    setBusy(true); setErr('');
    try {
      const cleanUsername = username.trim().replace(/^@/, '');
      const ch: Omit<TiktokChannel,'id'|'userId'|'createdAt'|'updatedAt'> = {
        channelName: channelName.trim(),
        username: cleanUsername,
        channelUrl: channelUrl.trim() || `https://www.tiktok.com/@${cleanUsername}`,
        uuid: uuid.trim() || null,
        niche: niche || null, language, status,
        followersCount: parseInt(followers) || 0,
        followingCount: 0, videosCount: 0, totalLikes: 0, avgViews: 0,
        targetKeywords: [], tags: [], isMonetized: false, isCreatorFund: false,
        notes: notes || null, priority: 0,
      };
      const creds: PlainCredentials = {};
      if (email.trim())          creds.email          = email.trim();
      if (password.trim())       creds.password       = password.trim();
      if (userPass.trim())       creds.token          = `[UserPass]${userPass.trim()}`;
      if (token.trim())          creds.cookie         = token.trim();
      if (secondaryEmail.trim()) creds.secondaryEmail = secondaryEmail.trim();
      await onSave(ch, creds, vaultKey);
      onClose();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  const PasswordField = ({ label, value, onChange, show, onToggle, placeholder = '••••••••' }: {
    label: string; value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void; placeholder?: string;
  }) => (
    <div>
      <label className="block text-[0.82rem] mb-1.5 text-text-secondary">{label}</label>
      <div className="relative">
        <input className="field-input pr-10 font-mono" type={show ? 'text' : 'password'}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete="new-password" />
        <button type="button" onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base text-text-muted p-0">
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full rounded-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: 620, background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold m-0">📱 Thêm TikTok Channel</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">Tên channel *</label>
              <input className="field-input" value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="My TikTok Channel" required />
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">@Username *</label>
              <input className="field-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="@handle" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">UUID / TikTok ID</label>
              <input className="field-input font-mono text-[0.82rem]" value={uuid} onChange={e => setUuid(e.target.value)} placeholder="6837291048..." />
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">Channel URL</label>
              <input className="field-input" value={channelUrl} onChange={e => setChannelUrl(e.target.value)} placeholder="https://tiktok.com/@handle" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">Niche</label>
              <input className="field-input" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Fishing, Travel…" />
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">Ngôn ngữ</label>
              <select className="field-select" value={language} onChange={e => setLanguage(e.target.value as typeof language)}>
                <option value="ja">🇯🇵 Japanese</option>
                <option value="ko">🇰🇷 Korean</option>
                <option value="en">🇺🇸 English</option>
                <option value="vi">🇻🇳 Vietnamese</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">Status</label>
              <select className="field-select" value={status} onChange={e => setStatus(e.target.value as TiktokChannelStatus)}>
                {Object.entries(STATUS_BADGE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">Followers</label>
              <input className="field-input" type="number" value={followers} onChange={e => setFollowers(e.target.value)} placeholder="0" min="0" />
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold mb-1.5 text-text-secondary">Notes</label>
              <textarea className="field-input resize-none" value={notes} onChange={e => setNotes(e.target.value)} rows={1} placeholder="Ghi chú…" />
            </div>
          </div>

          {/* Credentials section */}
          <div className="pt-3.5 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="flex items-center gap-1.5 m-0 text-[0.82rem] font-semibold text-text-muted">
              🔒 Credentials (mã hóa AES-256)
              {!vaultKey && <span className="text-amber-400 font-normal">— Vault chưa mở</span>}
            </p>

            {/* Email + Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.82rem] mb-1.5 text-text-secondary">📧 Email (Hotmail)</label>
                <input className="field-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="account@hotmail.com" autoComplete="off" />
              </div>
              <PasswordField label="🔑 Password" value={password}
                onChange={setPassword} show={showPw} onToggle={() => setShowPw(s=>!s)} />
            </div>

            {/* UserPass + Token */}
            <div className="grid grid-cols-2 gap-3">
              <PasswordField label="👤 UserPass (mật khẩu TikTok)" value={userPass}
                onChange={setUserPass} show={showUserPw} onToggle={() => setShowUserPw(s=>!s)} placeholder="Mật khẩu đăng nhập TikTok" />
              <PasswordField label="🍪 Token / Cookie" value={token}
                onChange={setToken} show={showToken} onToggle={() => setShowToken(s=>!s)} placeholder="eyJ..." />
            </div>

            {/* Secondary Email */}
            <div>
              <label className="block text-[0.82rem] mb-1.5 text-text-secondary">📨 Secondary Email</label>
              <input className="field-input" type="email" value={secondaryEmail}
                onChange={e => setSecondaryEmail(e.target.value)} placeholder="backup@gmail.com" autoComplete="off" />
            </div>
          </div>

          {err && <p className="m-0 text-[0.82rem] text-red-400">❌ {err}</p>}
          <div className="flex gap-2.5 justify-end pt-1">
            <button type="button" className="btn" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? '⏳ Đang lưu…' : '💾 Lưu channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────
interface Props {
  userId: string | null;
  workspaceId: string | null;
  masterPw: UseMasterPasswordReturn;
  tiktokChannels: UseTiktokChannelsReturn;
  onSelectChannel: (ch: TiktokChannel) => void;
}

export default function TiktokChannelsTab({ userId, workspaceId, masterPw, tiktokChannels, onSelectChannel }: Props) {
  const { channels, loading, error: loadError, addChannel, removeChannel } = tiktokChannels;
  const [deleteTarget, setDeleteTarget] = useState<TiktokChannel | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await removeChannel(deleteTarget.id); } finally {
      setDeleting(false); setDeleteTarget(null);
    }
  }
  const { state: vaultState, key: vaultKey, failedAttempts, setup, unlock } = masterPw;
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLang,   setFilterLang]   = useState('');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showPaste,    setShowPaste]    = useState(false);

  const filtered = useMemo(() =>
    channels.filter(ch => {
      if (filterStatus && ch.status !== filterStatus) return false;
      if (filterLang   && ch.language !== filterLang) return false;
      if (search) {
        const q = search.toLowerCase();
        return ch.channelName.toLowerCase().includes(q)
          || ch.username.toLowerCase().includes(q)
          || (ch.niche ?? '').toLowerCase().includes(q)
          || ch.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    }), [channels, filterStatus, filterLang, search]);

  const stats = useMemo(() => ({
    total:          channels.length,
    active:         channels.filter(c => c.status === 'active').length,
    warning:        channels.filter(c => c.status === 'warning' || c.status === 'shadowbanned').length,
    banned:         channels.filter(c => c.status === 'banned').length,
    totalFollowers: channels.reduce((s, c) => s + c.followersCount, 0),
  }), [channels]);

  const handleAddSave = useCallback(async (
    ch: Omit<TiktokChannel,'id'|'userId'|'createdAt'|'updatedAt'>,
    creds: PlainCredentials,
    key: CryptoKey | null,
  ) => {
    await addChannel({ ...ch, workspaceId }, creds, key ?? undefined);
  }, [addChannel, workspaceId]);

  if (!isCryptoSupported()) return (
    <div className="p-8 text-center">
      <div className="text-4xl mb-3">🚫</div>
      <p className="font-semibold">Trình duyệt không hỗ trợ Web Crypto API</p>
    </div>
  );
  if (vaultState === 'loading') return <div className="p-10 text-center"><span className="spinner" style={{ width: 24, height: 24 }} /></div>;
  if (vaultState === 'first_time' && userId) return <div className="px-4 py-6"><MasterPasswordSetup userId={userId} onSetup={setup} /></div>;
  if (vaultState === 'locked' && userId) return <div className="px-4 py-6"><MasterPasswordPrompt userId={userId} failedAttempts={failedAttempts} onUnlock={unlock} /></div>;

  const HEADERS = ['Trạng thái','Tên kênh','Mật khẩu TikTok','Email','Mật khẩu email','Token/Cookie','Email phụ','Ghi chú','Thao tác'];

  return (
    <div className="flex flex-col gap-3">
      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Tổng kênh',      value: stats.total,               icon: '📱' },
          { label: 'Hoạt động',     value: stats.active,              icon: '🟢' },
          { label: 'Cần chú ý',    value: stats.warning,             icon: '🟡' },
          { label: 'Bị cấm',        value: stats.banned,              icon: '🔴' },
          { label: 'Tổng followers', value: fmt(stats.totalFollowers), icon: '👥' },
        ].map(s => (
          <div key={s.label} className="rounded-[10px] px-4 py-2.5 min-w-[120px]"
            style={{ background: 'rgba(15,23,50,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[0.72rem] text-text-muted mb-0.5">{s.icon} {s.label}</div>
            <div className="font-bold text-[1.1rem]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2.5 flex-wrap items-center">
        <input placeholder="🔍 Tìm channel, username, niche…" value={search}
          onChange={e => setSearch(e.target.value)} className="field-input"
          style={{ flex: '1 1 200px', maxWidth: 320, width: 'auto' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="field-select" style={{ minWidth: 130, width: 'auto' }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_BADGE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
          className="field-select" style={{ minWidth: 120, width: 'auto' }}>
          <option value="">Tất cả ngôn ngữ</option>
          <option value="ja">🇯🇵 Japanese</option><option value="ko">🇰🇷 Korean</option>
          <option value="en">🇺🇸 English</option><option value="vi">🇻🇳 Vietnamese</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button className="btn text-[0.82rem]" onClick={masterPw.lock}>🔒 Khoá vault</button>
          <button className="btn btn-secondary text-[0.82rem]" onClick={() => setShowPaste(true)}>📋 Import</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ Thêm channel</button>
        </div>
      </div>

      {loading && <div className="text-center py-6"><span className="spinner" style={{ width: 20, height: 20 }} /></div>}
      {loadError && <p className="text-red-400 text-[0.85rem]">❌ {loadError}</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-text-muted">
          {channels.length === 0
            ? <><div className="text-4xl mb-3">📱</div><p>Chưa có channel nào. Nhấn <strong>➕ Thêm channel</strong> để bắt đầu.</p></>
            : <p>Không tìm thấy channel khớp điều kiện lọc.</p>}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full border-collapse text-[0.82rem]">
            <thead>
              <tr style={{ background: 'rgba(15,23,50,0.9)', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                {HEADERS.map(h => (
                  <th key={h} className="px-2 py-2.5 font-semibold text-text-muted whitespace-nowrap text-left text-[0.75rem] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ch => (
                <ChannelRow key={ch.id} ch={ch} vaultKey={vaultKey} onSelectChannel={onSelectChannel} onDelete={setDeleteTarget} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddChannelModal onClose={() => setShowAdd(false)} onSave={handleAddSave} vaultKey={vaultKey} />}
      {showPaste && <PasteImportModal onClose={() => setShowPaste(false)} onSave={handleAddSave} vaultKey={vaultKey} />}

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="rounded-xl p-6 w-full" style={{ maxWidth: 420, background: '#0d1425', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-3xl mb-3 text-center">🗑️</div>
            <h3 className="text-center font-bold text-[1rem] mb-2">Xác nhận xóa channel</h3>
            <p className="text-center text-[0.85rem] text-text-muted mb-1">
              Bạn chắc chắn muốn xóa <strong className="text-white">@{deleteTarget.username}</strong>?
            </p>
            <p className="text-center text-[0.75rem] text-red-400 mb-5">
              Tất cả credentials đã mã hóa sẽ bị xóa vĩnh viễn. Không thể khôi phục.
            </p>
            <div className="flex gap-2.5 justify-center">
              <button className="btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>Huỷ</button>
              <button
                className="btn"
                style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)', color: '#ef4444' }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? '⏳ Đang xóa…' : '🗑 Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
