// ============================================================
// components/TiktokChannelDetailModal.tsx — Phase 18 (Tailwind)
// 5-tab detail view for a single TikTok channel
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

// ── Credential row ─────────────────────────────────────────────
interface CredRowProps {
  label: string;
  value: string | undefined;
  action: AuditAction;
  hasEncrypted: boolean;
  vaultKey: CryptoKey | null;
  onReveal: (action: AuditAction) => Promise<void>;
}
function CredRow({ label, value, action, hasEncrypted, vaultKey, onReveal }: CredRowProps) {
  const [show,   setShow]   = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [copied, setCopied] = useState(false);

  const display = value != null ? (show ? value : '••••••••') : (hasEncrypted ? '[Cần mở khóa]' : '—');

  async function handleToggle() {
    if (!show && value == null && hasEncrypted && vaultKey) {
      setBusy(true); await onReveal(action); setBusy(false);
    }
    setShow(s => !s);
  }
  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => { navigator.clipboard.writeText('').catch(() => {}); setCopied(false); }, 30_000);
  }

  return (
    <div className="flex items-center gap-2.5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="shrink-0 w-40 text-[0.82rem] text-text-muted">{label}</span>
      <span className="flex-1 text-[0.85rem] break-all" style={{ fontFamily: show ? 'monospace' : 'inherit', color: value ? 'inherit' : '#5c6480' }}>
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
  const [ch,        setCh]        = useState<TiktokChannel>(channel);
  const [creds,     setCreds]     = useState<PlainCredentials>({});
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');

  const handleReveal = useCallback(async (action: AuditAction) => {
    if (!vaultKey) return;
    const decrypted = await revealCredentials(ch, vaultKey, action, userId);
    setCreds(decrypted);
  }, [ch, vaultKey, revealCredentials, userId]);

  const handleTabChange = useCallback(async (tab: DetailTab) => {
    setActiveTab(tab);
    if (tab === 'credentials' && vaultKey && Object.keys(creds).length === 0) {
      await handleReveal('view_password');
    }
  }, [vaultKey, creds, handleReveal]);

  async function handleSave(patch: Partial<TiktokChannel>) {
    setSaving(true); setSaveMsg('');
    try {
      await editChannel(ch.id, patch);
      setCh(prev => ({ ...prev, ...patch }));
      setSaveMsg('✅ Đã lưu');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (e) { setSaveMsg(`❌ ${(e as Error).message}`); }
    finally { setSaving(false); }
  }

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'overview',    label: '📊 Overview' },
    { id: 'targeting',   label: '🎯 Targeting' },
    { id: 'credentials', label: '🔒 Credentials' },
    { id: 'technical',   label: '⚙️ Technical' },
    { id: 'performance', label: '📈 Performance' },
  ];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full flex flex-col rounded-xl overflow-hidden"
        style={{
          maxWidth: 680, maxHeight: '90vh', width: '95vw',
          background: '#0d1425',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 shrink-0">
          <div>
            <h2 className="m-0 mb-0.5 text-[1.1rem] font-bold">{ch.channelName}</h2>
            <a href={ch.channelUrl} target="_blank" rel="noreferrer"
              className="text-[0.8rem] text-text-muted no-underline hover:opacity-75">
              @{ch.username} ↗
            </a>
          </div>
          <button className="btn" onClick={onClose} style={{ fontSize: '1.1rem', padding: '4px 10px', lineHeight: 1 }}>✕</button>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 px-6 shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              className="px-3 py-1.5 bg-transparent border-0 cursor-pointer text-[0.83rem] whitespace-nowrap transition-colors duration-150"
              style={{
                fontWeight: activeTab === t.id ? 700 : 400,
                color: activeTab === t.id ? '#00e5ff' : '#5c6480',
                borderBottom: activeTab === t.id ? '2px solid #00e5ff' : '2px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Overview ─────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2.5 flex-wrap items-center">
                <span className="text-[0.82rem] font-semibold">Status:</span>
                <select value={ch.status} onChange={e => handleSave({ status: e.target.value as TiktokChannelStatus })}
                  style={{ fontSize: '0.82rem', padding: '4px 8px' }}>
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {saveMsg && <span className="text-[0.78rem]">{saveMsg}</span>}
              </div>

              <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))' }}>
                {[
                  { label: 'Followers',   value: fmt(ch.followersCount) },
                  { label: 'Following',   value: fmt(ch.followingCount) },
                  { label: 'Videos',      value: fmt(ch.videosCount) },
                  { label: 'Total Likes', value: fmt(ch.totalLikes) },
                  { label: 'Avg Views',   value: fmt(ch.avgViews) },
                  { label: 'Engagement',  value: ch.engagementRate ? `${ch.engagementRate}%` : '—' },
                ].map(s => (
                  <div key={s.label} className="rounded-lg px-3.5 py-2.5 text-center"
                    style={{ background: 'rgba(20,30,65,0.85)' }}>
                    <div className="text-[0.72rem] text-text-muted mb-1">{s.label}</div>
                    <div className="font-bold text-[1.05rem]">{s.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[0.82rem] font-semibold mb-1.5">Notes</label>
                <textarea defaultValue={ch.notes ?? ''} rows={3}
                  onBlur={e => { if (e.target.value !== (ch.notes ?? '')) handleSave({ notes: e.target.value || null }); }}
                  className="w-full box-border resize-y" placeholder="Ghi chú về strategy, kế hoạch…" />
              </div>
            </div>
          )}

          {/* ── Targeting ────────────────────────── */}
          {activeTab === 'targeting' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[0.82rem] font-semibold mb-1.5">Niche</label>
                <input className="w-full box-border" defaultValue={ch.niche ?? ''}
                  onBlur={e => handleSave({ niche: e.target.value || null })} placeholder="AI, Finance, Health…" />
              </div>
              <div>
                <label className="block text-[0.82rem] font-semibold mb-1.5">Target Keywords (mỗi dòng 1 keyword)</label>
                <textarea className="w-full box-border resize-y font-mono text-[0.85rem]"
                  defaultValue={ch.targetKeywords.join('\n')} rows={5}
                  onBlur={e => handleSave({ targetKeywords: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.82rem] font-semibold mb-1.5">Ngôn ngữ</label>
                  <select className="w-full box-border" value={ch.language ?? ''} onChange={e => handleSave({ language: (e.target.value || null) as typeof ch.language })}>
                    <option value="">— Chọn —</option>
                    <option value="ja">🇯🇵 Japanese</option>
                    <option value="ko">🇰🇷 Korean</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="vi">🇻🇳 Vietnamese</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.82rem] font-semibold mb-1.5">Posting frequency</label>
                  <select className="w-full box-border" value={ch.postingFrequency ?? ''} onChange={e => handleSave({ postingFrequency: (e.target.value || null) as typeof ch.postingFrequency })}>
                    <option value="">— Chọn —</option>
                    <option value="daily">Daily</option>
                    <option value="3x_week">3x / tuần</option>
                    <option value="weekly">Weekly</option>
                    <option value="irregular">Không đều</option>
                  </select>
                </div>
              </div>
              {saveMsg && <p className="m-0 text-[0.82rem]">{saveMsg}</p>}
            </div>
          )}

          {/* ── Credentials ──────────────────────── */}
          {activeTab === 'credentials' && (
            !vaultKey ? (
              <div className="text-center py-8 text-text-muted">
                <div className="text-4xl mb-3">🔒</div>
                <p>Vault chưa mở khóa. Đóng modal và nhập Master Password.</p>
              </div>
            ) : (
              <div>
                <p className="text-[0.78rem] text-text-muted mb-3">
                  🔒 Credentials được mã hóa AES-256-GCM. Click 👁️ để xem • Click 📋 để copy (auto-clear sau 30s).
                  Mỗi lần xem được ghi vào audit log.
                </p>
                {([
                  { label: 'Email',           field: 'email'          as keyof PlainCredentials, encKey: 'encryptedEmail'          as keyof TiktokChannel, action: 'view_password' as AuditAction },
                  { label: 'Secondary Email', field: 'secondaryEmail' as keyof PlainCredentials, encKey: 'encryptedSecondaryEmail' as keyof TiktokChannel, action: 'view_password' as AuditAction },
                  { label: 'Password',        field: 'password'       as keyof PlainCredentials, encKey: 'encryptedPassword'       as keyof TiktokChannel, action: 'view_password' as AuditAction },
                  { label: 'Token',           field: 'token'          as keyof PlainCredentials, encKey: 'encryptedToken'          as keyof TiktokChannel, action: 'view_token'    as AuditAction },
                  { label: 'Phone',           field: 'phone'          as keyof PlainCredentials, encKey: 'encryptedPhone'          as keyof TiktokChannel, action: 'view_password' as AuditAction },
                ] as const).map(row => (
                  <CredRow key={row.field} label={row.label}
                    value={creds[row.field] as string | undefined}
                    action={row.action} hasEncrypted={!!ch[row.encKey]}
                    vaultKey={vaultKey} onReveal={handleReveal} />
                ))}
                <CredRow label="Cookie" value={creds.cookie} action="view_cookie"
                  hasEncrypted={!!ch.encryptedCookie} vaultKey={vaultKey} onReveal={handleReveal} />
                {(creds.recoveryCodes || ch.encryptedRecoveryCodes) && (
                  <div className="py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[0.82rem] text-text-muted">Recovery Codes</span>
                    {creds.recoveryCodes && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {creds.recoveryCodes.map((c, i) => (
                          <code key={i} className="rounded px-2 py-0.5 text-[0.8rem]"
                            style={{ background: 'rgba(20,30,65,0.85)' }}>{c}</code>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* ── Technical ────────────────────────── */}
          {activeTab === 'technical' && (
            <div className="flex flex-col gap-3">
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
                <div key={r.label} className="flex gap-3 items-start">
                  <span className="shrink-0 w-44 text-[0.82rem] text-text-muted">{r.label}</span>
                  <span className="font-mono text-[0.82rem] break-all">{r.value || '—'}</span>
                </div>
              ))}
              <div>
                <label className="block text-[0.82rem] font-semibold mb-1.5">User Agent</label>
                <textarea className="w-full box-border font-mono text-[0.75rem] resize-y"
                  defaultValue={ch.userAgent ?? ''} rows={2}
                  onBlur={e => handleSave({ userAgent: e.target.value || null })} />
              </div>
            </div>
          )}

          {/* ── Performance ──────────────────────── */}
          {activeTab === 'performance' && (
            <div className="text-center py-8 text-text-muted">
              <div className="text-4xl mb-3">📈</div>
              <p className="font-semibold">Performance tracking</p>
              <p className="text-[0.85rem]">
                Cập nhật metrics (followers, views, engagement) qua phần Overview.
                <br />Tính năng performance chart đang trong roadmap.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3.5 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {saveMsg && <span className="text-[0.82rem]">{saveMsg}</span>}
          <div className="ml-auto flex gap-2 items-center">
            {saving && <span className="spinner" style={{ width: 16, height: 16 }} />}
            <button className="btn" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
