// ============================================================
// components/TiktokChannelsTab.tsx — Phase 18 (Tailwind)
// TikTok Channel Manager: table view + CRUD + vault gate
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import type { TiktokChannel, TiktokChannelStatus, PlainCredentials } from '../types';
import type { UseTiktokChannelsReturn } from '../hooks/useTiktokChannels';
import type { UseMasterPasswordReturn } from '../hooks/useMasterPassword';
import MasterPasswordSetup from './MasterPasswordSetup';
import MasterPasswordPrompt from './MasterPasswordPrompt';
import { isCryptoSupported } from '../engine/encryption';

// ── Status config ─────────────────────────────────────────────
const STATUS_BADGE: Record<TiktokChannelStatus, { label: string; color: string; bg: string }> = {
  active:       { label: '🟢 Active',       color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  warming_up:   { label: '🔵 Warming up',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  warning:      { label: '🟡 Warning',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  shadowbanned: { label: '🟠 Shadowbanned', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  banned:       { label: '🔴 Banned',       color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  paused:       { label: '⚪ Paused',       color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  archived:     { label: '🗃️ Archived',     color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
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

// ── Add Channel Modal ──────────────────────────────────────────
interface AddModalProps {
  onClose: () => void;
  onSave: (ch: Omit<TiktokChannel,'id'|'userId'|'createdAt'|'updatedAt'>, creds: PlainCredentials, key: CryptoKey | null) => Promise<void>;
  vaultKey: CryptoKey | null;
}

function AddChannelModal({ onClose, onSave, vaultKey }: AddModalProps) {
  const [channelName, setChannelName] = useState('');
  const [username,    setUsername]    = useState('');
  const [channelUrl,  setChannelUrl]  = useState('');
  const [niche,       setNiche]       = useState('');
  const [language,    setLanguage]    = useState<'ja'|'ko'|'en'|'vi'|'other'>('ja');
  const [status,      setStatus]      = useState<TiktokChannelStatus>('active');
  const [followers,   setFollowers]   = useState('');
  const [notes,       setNotes]       = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [err,         setErr]         = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim() || !username.trim()) { setErr('Cần nhập tên channel và @username'); return; }
    setBusy(true); setErr('');
    try {
      const ch: Omit<TiktokChannel,'id'|'userId'|'createdAt'|'updatedAt'> = {
        channelName: channelName.trim(),
        username: username.trim().replace(/^@/, ''),
        channelUrl: channelUrl.trim() || `https://www.tiktok.com/@${username.trim().replace(/^@/,'')}`,
        niche: niche || null, language, status,
        followersCount: parseInt(followers) || 0,
        followingCount: 0, videosCount: 0, totalLikes: 0, avgViews: 0,
        targetKeywords: [], tags: [], isMonetized: false, isCreatorFund: false,
        notes: notes || null, priority: 0,
      };
      const creds: PlainCredentials = {};
      if (email.trim())    creds.email    = email.trim();
      if (password.trim()) creds.password = password.trim();
      await onSave(ch, creds, vaultKey);
      onClose();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full rounded-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: 580, background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold m-0">📱 Thêm TikTok Channel</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {/* Name + Username */}
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-[0.82rem] font-semibold mb-1.5">Tên channel *</label>
              <input className="w-full box-border" value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="My TikTok Channel" required />
            </div>
            <div className="min-w-0">
              <label className="block text-[0.82rem] font-semibold mb-1.5">@Username *</label>
              <input className="w-full box-border" value={username} onChange={e => setUsername(e.target.value)} placeholder="@handle" required />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-[0.82rem] font-semibold mb-1.5">Channel URL</label>
            <input className="w-full box-border" value={channelUrl} onChange={e => setChannelUrl(e.target.value)} placeholder="https://www.tiktok.com/@handle" />
          </div>

          {/* Niche + Lang + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="min-w-0">
              <label className="block text-[0.82rem] font-semibold mb-1.5">Niche</label>
              <input className="w-full box-border" value={niche} onChange={e => setNiche(e.target.value)} placeholder="AI, Finance…" />
            </div>
            <div className="min-w-0">
              <label className="block text-[0.82rem] font-semibold mb-1.5">Ngôn ngữ</label>
              <select className="w-full box-border" value={language} onChange={e => setLanguage(e.target.value as typeof language)}>
                <option value="ja">🇯🇵 Japanese</option>
                <option value="ko">🇰🇷 Korean</option>
                <option value="en">🇺🇸 English</option>
                <option value="vi">🇻🇳 Vietnamese</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="min-w-0">
              <label className="block text-[0.82rem] font-semibold mb-1.5">Status</label>
              <select className="w-full box-border" value={status} onChange={e => setStatus(e.target.value as TiktokChannelStatus)}>
                {Object.entries(STATUS_BADGE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Followers */}
          <div className="max-w-[200px]">
            <label className="block text-[0.82rem] font-semibold mb-1.5">Followers hiện tại</label>
            <input className="w-full box-border" type="number" value={followers} onChange={e => setFollowers(e.target.value)} placeholder="0" min="0" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[0.82rem] font-semibold mb-1.5">Notes</label>
            <textarea className="w-full box-border resize-y" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Ghi chú về strategy, kế hoạch…" />
          </div>

          {/* Credentials */}
          <div className="pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="flex items-center gap-1.5 m-0 mb-3 text-[0.82rem] font-semibold text-text-muted">
              🔒 Credentials
              {!vaultKey && <span className="text-amber-400 font-normal">— Vault chưa mở khóa, credentials sẽ không được mã hóa</span>}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-[0.82rem] mb-1.5">Email đăng nhập</label>
                <input className="w-full box-border" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="account@email.com" autoComplete="off" />
              </div>
              <div className="min-w-0">
                <label className="block text-[0.82rem] mb-1.5">Password</label>
                <div className="relative w-full">
                  <input className="w-full box-border pr-10" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(s=>!s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base text-text-muted p-0">
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
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
  const { channels, loading, error: loadError, addChannel } = tiktokChannels;
  const { state: vaultState, key: vaultKey, failedAttempts, setup, unlock } = masterPw;

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLang,   setFilterLang]   = useState('');
  const [showAdd,      setShowAdd]      = useState(false);

  const filtered = useMemo(() => {
    return channels.filter(ch => {
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
    });
  }, [channels, filterStatus, filterLang, search]);

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

  // ── Vault gates ────────────────────────────────────────────
  if (!isCryptoSupported()) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">🚫</div>
        <p className="font-semibold">Trình duyệt không hỗ trợ Web Crypto API</p>
        <p className="text-[0.85rem] text-text-muted">Vui lòng dùng Chrome, Firefox hoặc Safari phiên bản mới.</p>
      </div>
    );
  }
  if (vaultState === 'loading') {
    return <div className="p-10 text-center"><span className="spinner" style={{ width: 24, height: 24 }} /></div>;
  }
  if (vaultState === 'first_time' && userId) {
    return <div className="px-4 py-6"><MasterPasswordSetup userId={userId} onSetup={setup} /></div>;
  }
  if (vaultState === 'locked' && userId) {
    return <div className="px-4 py-6"><MasterPasswordPrompt userId={userId} failedAttempts={failedAttempts} onUnlock={unlock} /></div>;
  }

  // ── Main UI ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Tổng channel',   value: stats.total,                   icon: '📱' },
          { label: 'Active',         value: stats.active,                  icon: '🟢' },
          { label: 'Cần chú ý',     value: stats.warning,                 icon: '🟡' },
          { label: 'Banned',         value: stats.banned,                  icon: '🔴' },
          { label: 'Tổng followers', value: fmt(stats.totalFollowers),     icon: '👥' },
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
        <input
          placeholder="🔍 Tìm channel, username, niche…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="box-border" style={{ flex: '1 1 200px', maxWidth: 320 }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 130 }}>
          <option value="">Tất cả status</option>
          {Object.entries(STATUS_BADGE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterLang} onChange={e => setFilterLang(e.target.value)} style={{ minWidth: 120 }}>
          <option value="">Tất cả ngôn ngữ</option>
          <option value="ja">🇯🇵 Japanese</option>
          <option value="ko">🇰🇷 Korean</option>
          <option value="en">🇺🇸 English</option>
          <option value="vi">🇻🇳 Vietnamese</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button className="btn text-[0.82rem]" onClick={masterPw.lock} title="Khoá vault ngay">🔒 Khoá vault</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ Thêm channel</button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <div className="text-center py-6"><span className="spinner" style={{ width: 20, height: 20 }} /></div>}
      {loadError && <p className="text-red-400 text-[0.85rem]">❌ {loadError}</p>}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-text-muted">
          {channels.length === 0
            ? <><div className="text-4xl mb-3">📱</div><p>Chưa có channel nào. Nhấn <strong>➕ Thêm channel</strong> để bắt đầu.</p></>
            : <p>Không tìm thấy channel khớp điều kiện lọc.</p>
          }
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.84rem]">
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                {['Status','Channel','Ngôn ngữ','Followers','Engagement','Last post','Target keywords','Actions'].map(h => (
                  <th key={h} className="px-3 py-2 font-semibold text-text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ch => {
                const badge = STATUS_BADGE[ch.status];
                return (
                  <tr key={ch.id}
                    className="cursor-pointer transition-colors duration-100"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                    onClick={() => onSelectChannel(ch)}>
                    <td className="px-3 py-2.5">
                      <span className="rounded-md px-2 py-0.5 text-[0.75rem] font-semibold whitespace-nowrap"
                        style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold">{ch.channelName}</div>
                      <div className="text-[0.75rem] text-text-muted">@{ch.username}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {ch.language === 'ja' ? '🇯🇵' : ch.language === 'ko' ? '🇰🇷' : ch.language === 'en' ? '🇺🇸' : ch.language === 'vi' ? '🇻🇳' : '—'}
                      {ch.niche && <span className="ml-1.5 text-[0.75rem] text-text-muted">{ch.niche}</span>}
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{fmt(ch.followersCount)}</td>
                    <td className="px-3 py-2.5">{ch.engagementRate != null ? `${ch.engagementRate}%` : '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-text-muted text-[0.78rem]">{relTime(ch.lastPostAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {ch.targetKeywords.slice(0, 3).map(k => (
                          <span key={k} className="rounded px-1.5 py-0.5 text-[0.72rem]"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>{k}</span>
                        ))}
                        {ch.targetKeywords.length > 3 && (
                          <span className="text-[0.72rem] text-text-muted">+{ch.targetKeywords.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <button className="btn" style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                        onClick={e => { e.stopPropagation(); onSelectChannel(ch); }}>Xem</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddChannelModal onClose={() => setShowAdd(false)} onSave={handleAddSave} vaultKey={vaultKey} />
      )}
    </div>
  );
}
