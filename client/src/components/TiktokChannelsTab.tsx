// ============================================================
// components/TiktokChannelsTab.tsx — Phase 18
// TikTok Channel Manager: table view + CRUD + vault gate
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import type { TiktokChannel, TiktokChannelStatus, PlainCredentials } from '../types';
import type { UseTiktokChannelsReturn } from '../hooks/useTiktokChannels';
import type { UseMasterPasswordReturn } from '../hooks/useMasterPassword';
import MasterPasswordSetup from './MasterPasswordSetup';
import MasterPasswordPrompt from './MasterPasswordPrompt';
import { isCryptoSupported } from '../engine/encryption';

// ── Status display ─────────────────────────────────────────────
const STATUS_BADGE: Record<TiktokChannelStatus, { label: string; color: string; bg: string }> = {
  active:      { label: '🟢 Active',       color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  warming_up:  { label: '🔵 Warming up',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  warning:     { label: '🟡 Warning',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  shadowbanned:{ label: '🟠 Shadowbanned', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  banned:      { label: '🔴 Banned',       color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  paused:      { label: '⚪ Paused',       color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  archived:    { label: '🗃️ Archived',     color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
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
interface AddChannelModalProps {
  onClose: () => void;
  onSave: (
    ch: Omit<TiktokChannel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    creds: PlainCredentials,
    key: CryptoKey | null,
  ) => Promise<void>;
  vaultKey: CryptoKey | null;
}

function AddChannelModal({ onClose, onSave, vaultKey }: AddChannelModalProps) {
  const [channelName, setChannelName] = useState('');
  const [username,    setUsername]    = useState('');
  const [channelUrl,  setChannelUrl]  = useState('');
  const [niche,       setNiche]       = useState('');
  const [language,    setLanguage]    = useState<'ja'|'ko'|'en'|'vi'|'other'>('ja');
  const [status,      setStatus]      = useState<TiktokChannelStatus>('active');
  const [followers,   setFollowers]   = useState('');
  const [notes,       setNotes]       = useState('');
  // Credentials (only if vault key available)
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim() || !username.trim()) { setErr('Cần nhập tên channel và @username'); return; }
    setBusy(true); setErr('');
    try {
      const ch: Omit<TiktokChannel, 'id'|'userId'|'createdAt'|'updatedAt'> = {
        channelName: channelName.trim(),
        username: username.trim().replace(/^@/, ''),
        channelUrl: channelUrl.trim() || `https://www.tiktok.com/@${username.trim().replace(/^@/,'')}`,
        niche: niche || null,
        language,
        status,
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>➕ Thêm TikTok Channel</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Tên channel *</label>
              <input value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="My TikTok Channel" required />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>@Username *</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="@handle" required />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Channel URL</label>
            <input value={channelUrl} onChange={e => setChannelUrl(e.target.value)} placeholder="https://www.tiktok.com/@handle" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Niche</label>
              <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="AI, Finance…" />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Ngôn ngữ</label>
              <select value={language} onChange={e => setLanguage(e.target.value as typeof language)}>
                <option value="ja">🇯🇵 Japanese</option>
                <option value="ko">🇰🇷 Korean</option>
                <option value="en">🇺🇸 English</option>
                <option value="vi">🇻🇳 Vietnamese</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as TiktokChannelStatus)}>
                {Object.entries(STATUS_BADGE).map(([k,v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Followers hiện tại</label>
            <input type="number" value={followers} onChange={e => setFollowers(e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Ghi chú về strategy…" style={{ resize: 'vertical' }} />
          </div>

          {/* Credentials section — only if vault unlocked */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              🔒 Credentials {!vaultKey && <span style={{ color: '#f59e0b' }}>(Vault chưa mở khóa — sẽ không encrypt)</span>}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.82rem', display: 'block', marginBottom: 4 }}>Email đăng nhập</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="account@email.com" autoComplete="off" />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', display: 'block', marginBottom: 4 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" style={{ paddingRight: 36 }} />
                  <button type="button" onClick={() => setShowPw(s=>!s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {err && <p style={{ margin: 0, fontSize: '0.82rem', color: '#ef4444' }}>❌ {err}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? '⏳ Đang lưu…' : '💾 Lưu channel'}</button>
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

  const [search,   setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLang,   setFilterLang]   = useState('');
  const [showAdd,  setShowAdd]  = useState(false);

  // Filter + search
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

  // Stats
  const stats = useMemo(() => ({
    total:   channels.length,
    active:  channels.filter(c => c.status === 'active').length,
    warning: channels.filter(c => c.status === 'warning' || c.status === 'shadowbanned').length,
    banned:  channels.filter(c => c.status === 'banned').length,
    totalFollowers: channels.reduce((s, c) => s + c.followersCount, 0),
  }), [channels]);

  const handleAddSave = useCallback(async (
    ch: Omit<TiktokChannel, 'id'|'userId'|'createdAt'|'updatedAt'>,
    creds: PlainCredentials,
    key: CryptoKey | null,
  ) => {
    await addChannel({ ...ch, workspaceId }, creds, key ?? undefined);
  }, [addChannel, workspaceId]);

  // ── Vault gate ─────────────────────────────────────────────
  if (!isCryptoSupported()) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚫</div>
        <p style={{ fontWeight: 600 }}>Trình duyệt không hỗ trợ Web Crypto API</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vui lòng dùng Chrome, Firefox hoặc Safari phiên bản mới.</p>
      </div>
    );
  }

  if (vaultState === 'loading') {
    return <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ width: 24, height: 24 }} /></div>;
  }

  if (vaultState === 'first_time' && userId) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <MasterPasswordSetup userId={userId} onSetup={setup} />
      </div>
    );
  }

  if ((vaultState === 'locked') && userId) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <MasterPasswordPrompt userId={userId} failedAttempts={failedAttempts} onUnlock={unlock} />
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng channel', value: stats.total, icon: '📱' },
          { label: 'Active',        value: stats.active,  icon: '🟢' },
          { label: 'Cần chú ý',    value: stats.warning, icon: '🟡' },
          { label: 'Banned',        value: stats.banned,  icon: '🔴' },
          { label: 'Tổng followers',value: fmt(stats.totalFollowers), icon: '👥' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 16px', minWidth: 120,
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{s.icon} {s.label}</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="🔍 Tìm channel, username, niche…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', maxWidth: 320 }}
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn" onClick={masterPw.lock} title="Khoá vault ngay" style={{ fontSize: '0.82rem' }}>🔒 Khoá vault</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ Thêm channel</button>
        </div>
      </div>

      {/* Table */}
      {loading && <div style={{ textAlign: 'center', padding: 24 }}><span className="spinner" style={{ width: 20, height: 20 }} /></div>}
      {loadError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>❌ {loadError}</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          {channels.length === 0
            ? <><div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📱</div><p>Chưa có channel nào. Nhấn <strong>➕ Thêm channel</strong> để bắt đầu.</p></>
            : <p>Không tìm thấy channel khớp điều kiện lọc.</p>
          }
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                {['Status','Channel','Ngôn ngữ','Followers','Engagement','Last post','Target keywords','Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ch => {
                const badge = STATUS_BADGE[ch.status];
                return (
                  <tr key={ch.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                    onClick={() => onSelectChannel(ch)}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600 }}>{ch.channelName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{ch.username}</div>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {ch.language === 'ja' ? '🇯🇵' : ch.language === 'ko' ? '🇰🇷' : ch.language === 'en' ? '🇺🇸' : ch.language === 'vi' ? '🇻🇳' : '—'}
                      {ch.niche && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ch.niche}</span>}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{fmt(ch.followersCount)}</td>
                    <td style={{ padding: '10px 12px' }}>{ch.engagementRate != null ? `${ch.engagementRate}%` : '—'}</td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{relTime(ch.lastPostAt)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {ch.targetKeywords.slice(0, 3).map(k => (
                          <span key={k} style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: '1px 6px', fontSize: '0.72rem' }}>{k}</span>
                        ))}
                        {ch.targetKeywords.length > 3 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{ch.targetKeywords.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button className="btn" style={{ fontSize: '0.75rem', padding: '3px 10px' }} onClick={e => { e.stopPropagation(); onSelectChannel(ch); }}>
                        Xem
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Channel Modal */}
      {showAdd && (
        <AddChannelModal
          onClose={() => setShowAdd(false)}
          onSave={handleAddSave}
          vaultKey={vaultKey}
        />
      )}
    </div>
  );
}
