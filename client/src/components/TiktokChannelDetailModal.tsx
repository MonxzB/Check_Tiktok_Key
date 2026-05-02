// ============================================================
// components/TiktokChannelDetailModal.tsx — Phase 18
// 5-tab detail view for a single TikTok channel
// Tabs: Overview | Targeting | Credentials | Technical | Performance
// ============================================================
import React, { useState, useCallback } from 'react';
import type { TiktokChannel, TiktokChannelStatus, PlainCredentials } from '../types';
import type { UseTiktokChannelsReturn } from '../hooks/useTiktokChannels';
import type { AuditAction } from '../engine/tiktokChannels';

type DetailTab = 'overview' | 'targeting' | 'credentials' | 'technical' | 'performance';

const STATUS_OPTS: { value: TiktokChannelStatus; label: string }[] = [
  { value: 'active',       label: '🟢 Active' },
  { value: 'warming_up',   label: '🔵 Warming up' },
  { value: 'warning',      label: '🟡 Warning' },
  { value: 'shadowbanned', label: '🟠 Shadowbanned' },
  { value: 'banned',       label: '🔴 Banned' },
  { value: 'paused',       label: '⚪ Paused' },
  { value: 'archived',     label: '🗃️ Archived' },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`;
  return String(n);
}

// ── Credential field row ──────────────────────────────────────
interface CredRowProps {
  label: string;
  value: string | undefined;
  action: AuditAction;
  hasEncrypted: boolean;
  vaultKey: CryptoKey | null;
  onReveal: (action: AuditAction) => Promise<void>;
}
function CredRow({ label, value, action, hasEncrypted, vaultKey, onReveal }: CredRowProps) {
  const [show,  setShow]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [copied, setCopied] = useState(false);

  const display = value != null ? (show ? value : '••••••••') : (hasEncrypted ? '[Cần mở khóa]' : '—');

  async function handleToggle() {
    if (!show && value == null && hasEncrypted && vaultKey) {
      setBusy(true);
      await onReveal(action);
      setBusy(false);
    }
    setShow(s => !s);
  }

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    // Auto-clear clipboard after 30s
    setTimeout(() => {
      navigator.clipboard.writeText('').catch(() => {});
      setCopied(false);
    }, 30_000);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 160, fontSize: '0.82rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, fontFamily: show ? 'monospace' : 'inherit', fontSize: '0.85rem', wordBreak: 'break-all', color: value ? 'inherit' : 'var(--text-muted)' }}>
        {busy ? '⏳ Đang giải mã…' : display}
      </span>
      {hasEncrypted && vaultKey && (
        <button className="btn" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={handleToggle}>
          {show ? '🙈' : '👁️'}
        </button>
      )}
      {show && value && (
        <button className="btn" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={handleCopy} title="Copy (auto-clear sau 30s)">
          {copied ? '✅' : '📋'}
        </button>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
interface Props {
  channel: TiktokChannel;
  vaultKey: CryptoKey | null;
  userId: string;
  tiktokChannels: UseTiktokChannelsReturn;
  onClose: () => void;
}

export default function TiktokChannelDetailModal({ channel, vaultKey, userId, tiktokChannels, onClose }: Props) {
  const { editChannel, revealCredentials } = tiktokChannels;
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [ch, setCh] = useState<TiktokChannel>(channel);
  const [creds, setCreds] = useState<PlainCredentials>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleReveal = useCallback(async (action: AuditAction) => {
    if (!vaultKey) return;
    const decrypted = await revealCredentials(ch, vaultKey, action, userId);
    setCreds(decrypted);
  }, [ch, vaultKey, revealCredentials, userId]);

  // Reveal all creds when entering Credentials tab
  const handleTabChange = useCallback(async (tab: DetailTab) => {
    setActiveTab(tab);
    if (tab === 'credentials' && vaultKey && Object.keys(creds).length === 0) {
      await handleReveal('view_password');
    }
  }, [vaultKey, creds, handleReveal]);

  async function handleSave(patch: Partial<TiktokChannel>) {
    setSaving(true);
    setSaveMsg('');
    try {
      await editChannel(ch.id, patch);
      setCh(prev => ({ ...prev, ...patch }));
      setSaveMsg('✅ Đã lưu');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (e) {
      setSaveMsg(`❌ ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'overview',     label: '📊 Overview' },
    { id: 'targeting',    label: '🎯 Targeting' },
    { id: 'credentials',  label: '🔒 Credentials' },
    { id: 'technical',    label: '⚙️ Technical' },
    { id: 'performance',  label: '📈 Performance' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: '1.1rem', fontWeight: 700 }}>{ch.channelName}</h2>
            <a href={ch.channelUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              @{ch.username} ↗
            </a>
          </div>
          <button className="btn" onClick={onClose} style={{ fontSize: '1.1rem', lineHeight: 1, padding: '4px 10px' }}>✕</button>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 16, flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === t.id ? 700 : 400,
                color: activeTab === t.id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap', fontSize: '0.83rem', transition: 'color 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Overview ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, marginRight: 4 }}>Status:</span>
                <select value={ch.status} onChange={e => handleSave({ status: e.target.value as TiktokChannelStatus })} style={{ fontSize: '0.82rem', padding: '4px 8px' }}>
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {saveMsg && <span style={{ fontSize: '0.78rem' }}>{saveMsg}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
                {[
                  { label: 'Followers', value: fmt(ch.followersCount) },
                  { label: 'Following', value: fmt(ch.followingCount) },
                  { label: 'Videos', value: fmt(ch.videosCount) },
                  { label: 'Total Likes', value: fmt(ch.totalLikes) },
                  { label: 'Avg Views', value: fmt(ch.avgViews) },
                  { label: 'Engagement', value: ch.engagementRate ? `${ch.engagementRate}%` : '—' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea
                  defaultValue={ch.notes ?? ''}
                  rows={3}
                  onBlur={e => { if (e.target.value !== (ch.notes ?? '')) handleSave({ notes: e.target.value || null }); }}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Ghi chú về strategy, kế hoạch…"
                />
              </div>
            </div>
          )}

          {/* ── Targeting ────────────────────────────────── */}
          {activeTab === 'targeting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Niche</label>
                <input defaultValue={ch.niche ?? ''} onBlur={e => handleSave({ niche: e.target.value || null })} placeholder="AI, Finance, Health…" />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Target Keywords (mỗi dòng 1 keyword)</label>
                <textarea
                  defaultValue={ch.targetKeywords.join('\n')}
                  rows={5}
                  onBlur={e => handleSave({ targetKeywords: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Ngôn ngữ</label>
                  <select value={ch.language ?? ''} onChange={e => handleSave({ language: (e.target.value || null) as typeof ch.language })}>
                    <option value="">— Chọn —</option>
                    <option value="ja">🇯🇵 Japanese</option>
                    <option value="ko">🇰🇷 Korean</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="vi">🇻🇳 Vietnamese</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Posting frequency</label>
                  <select value={ch.postingFrequency ?? ''} onChange={e => handleSave({ postingFrequency: (e.target.value || null) as typeof ch.postingFrequency })}>
                    <option value="">— Chọn —</option>
                    <option value="daily">Daily</option>
                    <option value="3x_week">3x / tuần</option>
                    <option value="weekly">Weekly</option>
                    <option value="irregular">Không đều</option>
                  </select>
                </div>
              </div>
              {saveMsg && <p style={{ margin: 0, fontSize: '0.82rem' }}>{saveMsg}</p>}
            </div>
          )}

          {/* ── Credentials ──────────────────────────────── */}
          {activeTab === 'credentials' && (
            <div>
              {!vaultKey ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
                  <p>Vault chưa mở khóa. Đóng modal và nhập Master Password.</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    🔒 Credentials được mã hóa AES-256-GCM. Click 👁️ để xem • Click 📋 để copy (auto-clear sau 30s).
                    Mỗi lần xem được ghi vào audit log.
                  </p>
                  {[
                    { label: 'Email',          field: 'email'          as keyof PlainCredentials, encKey: 'encryptedEmail'          as keyof TiktokChannel, action: 'view_password' as AuditAction },
                    { label: 'Secondary Email',field: 'secondaryEmail' as keyof PlainCredentials, encKey: 'encryptedSecondaryEmail' as keyof TiktokChannel, action: 'view_password' as AuditAction },
                    { label: 'Password',       field: 'password'       as keyof PlainCredentials, encKey: 'encryptedPassword'       as keyof TiktokChannel, action: 'view_password' as AuditAction },
                    { label: 'Token',          field: 'token'          as keyof PlainCredentials, encKey: 'encryptedToken'          as keyof TiktokChannel, action: 'view_token'    as AuditAction },
                    { label: 'Phone',          field: 'phone'          as keyof PlainCredentials, encKey: 'encryptedPhone'          as keyof TiktokChannel, action: 'view_password' as AuditAction },
                  ].map(row => (
                    <CredRow
                      key={row.field}
                      label={row.label}
                      value={creds[row.field] as string | undefined}
                      action={row.action}
                      hasEncrypted={!!ch[row.encKey]}
                      vaultKey={vaultKey}
                      onReveal={handleReveal}
                    />
                  ))}
                  {/* Cookie */}
                  <CredRow label="Cookie" value={creds.cookie} action="view_cookie" hasEncrypted={!!ch.encryptedCookie} vaultKey={vaultKey} onReveal={handleReveal} />
                  {/* Recovery codes */}
                  {(creds.recoveryCodes || ch.encryptedRecoveryCodes) && (
                    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Recovery Codes</span>
                      {creds.recoveryCodes && (
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {creds.recoveryCodes.map((c, i) => (
                            <code key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: '2px 8px', fontSize: '0.8rem' }}>{c}</code>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Technical ────────────────────────────────── */}
          {activeTab === 'technical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'UUID',               value: ch.uuid },
                { label: 'Channel ID',         value: ch.channelId },
                { label: 'Proxy URL',          value: ch.proxyUrl },
                { label: 'Proxy Country',      value: ch.proxyCountry },
                { label: 'Device Fingerprint', value: ch.deviceFingerprint },
                { label: 'Encryption method',  value: ch.encryptionMethod },
                { label: 'Created',            value: ch.createdAt ? new Date(ch.createdAt).toLocaleString() : '—' },
                { label: 'Last updated',       value: ch.updatedAt ? new Date(ch.updatedAt).toLocaleString() : '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 180, fontSize: '0.82rem', color: 'var(--text-muted)', flexShrink: 0 }}>{r.label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all' }}>{r.value || '—'}</span>
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>User Agent</label>
                <textarea defaultValue={ch.userAgent ?? ''} rows={2} onBlur={e => handleSave({ userAgent: e.target.value || null })} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }} />
              </div>
            </div>
          )}

          {/* ── Performance ──────────────────────────────── */}
          {activeTab === 'performance' && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📈</div>
              <p style={{ fontWeight: 600 }}>Performance tracking</p>
              <p style={{ fontSize: '0.85rem' }}>
                Cập nhật metrics (followers, views, engagement) qua phần Overview.
                <br />Tính năng performance chart đang trong roadmap.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {saveMsg && <span style={{ fontSize: '0.82rem' }}>{saveMsg}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {saving && <span className="spinner" style={{ width: 16, height: 16 }} />}
            <button className="btn" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
