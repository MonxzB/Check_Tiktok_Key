import React, { useState, useEffect } from 'react';
import type { QuotaInfo } from '../engine/quotaTracker.js';
import type { ExtendedSettings } from '../hooks/useSettings.js';
import type { OrderBy, RegionCode, LanguageCode } from '../types';
import { getQuotaInfo } from '../engine/quotaTracker.js';
import CustomSelect from './CustomSelect.js';
import { useYoutubeConnection } from '../hooks/useYoutubeConnection.ts';
import { useAuth } from '../hooks/useAuth.tsx';
import { formatNum } from './utils.ts';
import type { UsePersonalScoringReturn } from '../hooks/usePersonalScoring.ts';
import { SCORE_KEYS, DEFAULT_WEIGHTS } from '../engine/personalizedScoring.ts';

interface SettingsPanelProps {
  settings: ExtendedSettings;
  onUpdate: (partial: Partial<ExtendedSettings>) => void;
  onReset: () => void;
  personalScoring?: UsePersonalScoringReturn;
}
interface QuotaDisplay extends QuotaInfo { key: string; masked: string; }

export default function SettingsPanel({ settings, onUpdate, onReset, personalScoring }: SettingsPanelProps) {
  const { user } = useAuth();
  const ytConn   = useYoutubeConnection(user?.id ?? null);

  function f<K extends keyof ExtendedSettings>(key: K, val: ExtendedSettings[K]) {
    onUpdate({ [key]: val } as Partial<ExtendedSettings>);
  }

  const [keyInput,  setKeyInput]  = useState((settings.apiKeys ?? []).join('\n'));
  const [keyStatus, setKeyStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [quotaInfo, setQuotaInfo] = useState<QuotaDisplay[]>([]);

  useEffect(() => {
    const keys = (settings.apiKeys ?? []).filter(k => k.trim());
    setQuotaInfo(keys.map(k => ({ key: k, masked: k.slice(0,4) + '…' + k.slice(-4), ...getQuotaInfo(k) })));
  }, [settings.apiKeys]);

  function handleSaveKeys() {
    const keys = keyInput.split('\n').map(k => k.trim()).filter(Boolean);
    setKeyStatus('saving');
    onUpdate({ apiKeys: keys, activeKeyIndex: 0 });
    setTimeout(() => setKeyStatus('saved'), 600);
  }

  function handleClearKeys() {
    if (!confirm('Xoá tất cả API keys đã lưu?')) return;
    setKeyInput(''); onUpdate({ apiKeys: [], activeKeyIndex: 0 }); setKeyStatus('idle');
  }

  const savedKeys = (settings.apiKeys ?? []).filter(k => k.trim());

  return (
    <div>
      <section className="card">
        <h2><span className="icon">⚙️</span> Cài đặt</h2>
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>

          {/* ── API Keys ─────────────────────────────── */}
          <div className="settings-group settings-group--full">
            <h3>🔑 YouTube API Keys</h3>
            <p className="text-[0.82rem] text-text-secondary mb-2.5">
              Mỗi key trên 1 dòng. Hết quota sẽ tự chuyển sang key tiếp theo.
            </p>
            <textarea value={keyInput}
              onChange={e => { setKeyInput(e.target.value); setKeyStatus('idle'); }}
              placeholder={'AIzaSy...(key 1)\nAIzaSy...(key 2)'}
              rows={4}
              className="w-full box-border font-mono text-[0.83rem] resize-y leading-relaxed rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8eaf6', padding: '10px 14px' }}
            />
            <div className="flex gap-2.5 mt-2.5 items-center">
              <button className="btn btn-primary" onClick={handleSaveKeys} style={{ padding: '8px 20px' }}>
                {keyStatus === 'saving' ? '⏳ Đang lưu...' : keyStatus === 'saved' ? '✅ Đã lưu!' : '💾 Lưu keys'}
              </button>
              {savedKeys.length > 0 && (
                <button className="btn btn-secondary" onClick={handleClearKeys} style={{ padding: '8px 16px' }}>🗑️ Xoá tất cả</button>
              )}
              <span className="text-[0.8rem] text-text-muted">
                {savedKeys.length > 0 ? `${savedKeys.length} key đã lưu` : 'Chưa có key nào'}
              </span>
            </div>

            {quotaInfo.length > 0 && (
              <div className="mt-4">
                <p className="text-[0.78rem] text-text-secondary mb-2 font-semibold">📊 Quota hôm nay</p>
                {quotaInfo.map((q, i) => {
                  const statusColor = q.exhausted ? '#ff1744' : q.pct > 70 ? '#ffa726' : '#00e676';
                  const barBg       = q.exhausted ? '#ff1744' : q.pct > 70 ? '#ffa726' : '#00e5ff';
                  return (
                    <div key={i} className="rounded-lg px-3.5 py-2.5 mb-2"
                      style={{ background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex justify-between mb-1.5">
                        <span className="font-mono text-[0.8rem] text-accent">
                          Key #{i+1}: <span className="text-text-muted">{q.masked}</span>
                        </span>
                        <span className="text-[0.78rem]" style={{ color: statusColor }}>
                          {q.exhausted ? '🔴 Hết quota' : q.pct > 70 ? '🟡 Sắp hết' : '🟢 OK'}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-sm transition-all duration-300" style={{ width: `${q.pct}%`, background: barBg }} />
                      </div>
                      <div className="flex justify-between mt-1 text-[0.72rem] text-text-muted">
                        <span>Đã dùng: <strong className="text-text-base">{q.used.toLocaleString()}</strong></span>
                        <span>Còn: <strong className="text-text-base">{q.remaining.toLocaleString()}</strong> / {q.limit.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Search Settings ───────────────────── */}
          <div className="settings-group">
            <h3>🔍 Cài đặt Tìm kiếm</h3>
            {[
              { label: 'Thời lượng tối thiểu', key: 'minDurationMin' as const, opts: [{ value: 5, label: '5 phút' }, { value: 8, label: '8 phút (mặc định)' }, { value: 10, label: '10 phút' }, { value: 20, label: '20 phút' }] },
              { label: 'Time window (ngày)',    key: 'timeWindowDays'  as const, opts: [{ value: 30, label: '30 ngày' }, { value: 90, label: '90 ngày' }, { value: 180, label: '180 ngày (mặc định)' }, { value: 365, label: '365 ngày' }, { value: 3650, label: 'Toàn thời gian' }] },
              { label: 'Max results / keyword', key: 'maxResults'      as const, opts: [{ value: 10, label: '10' }, { value: 25, label: '25 (mặc định)' }, { value: 50, label: '50' }] },
            ].map(({ label, key, opts }) => (
              <div key={key} className="filter-group mb-3">
                <label>{label}</label>
                <CustomSelect value={settings[key]} onChange={v => f(key, Number(v ?? opts[0].value))} options={opts} placeholder="Chọn..." />
              </div>
            ))}
            <div className="filter-group mb-3">
              <label>Thứ tự kết quả</label>
              <CustomSelect value={settings.orderBy} onChange={v => f('orderBy', String(v ?? 'relevance') as OrderBy)}
                options={[{ value: 'relevance', label: 'Relevance (mặc định)' }, { value: 'viewCount', label: 'View Count' }, { value: 'date', label: 'Date' }]} placeholder="Chọn..." />
            </div>
          </div>

          {/* ── Region & Language ─────────────────── */}
          <div className="settings-group">
            <h3>🌏 Region &amp; Language</h3>
            <div className="filter-group mb-3">
              <label>Region Code</label>
              <CustomSelect value={settings.regionCode} onChange={v => f('regionCode', String(v ?? 'JP') as RegionCode)}
                options={[{ value: 'JP', label: 'JP — Nhật Bản' }, { value: 'US', label: 'US — Mỹ' }, { value: 'VN', label: 'VN — Việt Nam' }]} placeholder="Chọn..." />
            </div>
            <div className="filter-group mb-3">
              <label>Language Code</label>
              <CustomSelect value={settings.languageCode} onChange={v => f('languageCode', String(v ?? 'ja') as LanguageCode)}
                options={[{ value: 'ja', label: 'ja — Tiếng Nhật' }, { value: 'en', label: 'en — Tiếng Anh' }, { value: 'vi', label: 'vi — Tiếng Việt' }]} placeholder="Chọn..." />
            </div>
            <div className="filter-group mb-3">
              <label>Cache duration (ngày)</label>
              <CustomSelect value={settings.cacheDays} onChange={v => f('cacheDays', Number(v ?? 7))}
                options={[{ value: 1, label: '1 ngày' }, { value: 7, label: '7 ngày (mặc định)' }, { value: 30, label: '30 ngày' }]} placeholder="Chọn..." />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-[0.85rem] text-text-secondary mt-3">
              <input type="checkbox" checked={settings.hideRisky} onChange={e => f('hideRisky', e.target.checked)} />
              Ẩn kênh/video rủi ro theo mặc định
            </label>
          </div>
        </div>

        {/* ── YouTube Channel ─────────────────────── */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-[0.88rem] font-bold mb-3">🔗 YouTube Channel (Gap Analysis)</h3>
          {ytConn.loading ? (
            <div className="text-text-muted text-[0.82rem] flex items-center gap-1.5">
              <span className="spinner" style={{ width: 12, height: 12 }} /> Đang kiểm tra...
            </div>
          ) : ytConn.connection ? (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg"
              style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.2)' }}>
              {ytConn.connection.channelThumb && (
                <img src={ytConn.connection.channelThumb} alt="" className="w-9 h-9 rounded-full" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-accent text-[0.88rem]">▶️ {ytConn.connection.channelTitle}</div>
                <div className="text-[0.72rem] text-text-muted">{formatNum(ytConn.connection.subscriberCount)} subscribers</div>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 12px', color: '#ff1744' }}
                onClick={ytConn.disconnect}>Disconnect</button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 16px' }}
                onClick={ytConn.connect} disabled={ytConn.connecting || !ytConn.oauthConfigured}>
                {ytConn.connecting ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Đang kết nối...</> : '🔗 Connect YouTube Channel'}
              </button>
              {!ytConn.oauthConfigured && (
                <span className="text-[0.72rem] text-amber-400">⚠️ Server chưa cấu hình OAuth</span>
              )}
            </div>
          )}
        </div>

        {/* ── Personalized Scoring ─────────────────── */}
        {personalScoring && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[0.88rem] font-bold m-0">🧠 Personalized Scoring (ML-lite)</h3>
              <label className="flex items-center gap-2 cursor-pointer text-[0.82rem]"
                style={{ color: personalScoring.enabled ? '#00e5ff' : '#5c6480' }}>
                <input type="checkbox" checked={personalScoring.enabled} onChange={e => personalScoring.setEnabled(e.target.checked)} />
                {personalScoring.enabled ? 'Bật' : 'Tắt'}
              </label>
            </div>

            <div className="text-[0.8rem] text-text-muted mb-2.5">
              {personalScoring.needMore > 0 ? (
                <span>⏳ Cần <strong className="text-accent">{personalScoring.needMore}</strong> feedback nữa để bắt đầu train · Hiện có: {personalScoring.feedbacks.filter(f => f.made_video && f.performance).length}</span>
              ) : (
                <span>✅ Đủ {personalScoring.feedbacks.filter(f => f.made_video && f.performance).length} feedback — sẵn sàng train!</span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[0.78rem]">
                <thead>
                  <tr className="text-text-muted">
                    <th className="text-left px-2 py-1">Dimension</th>
                    <th className="text-center px-2 py-1">Default</th>
                    <th className="text-center px-2 py-1">Current</th>
                    <th className="text-left px-2 py-1">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {SCORE_KEYS.map(key => {
                    const w     = personalScoring.weights[key];
                    const pct   = ((w - 0.5) / 1.0) * 100;
                    const color = w > 1.05 ? '#4ade80' : w < 0.95 ? '#f87171' : '#60a5fa';
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-2 py-1 text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                        <td className="text-center px-2 py-1 text-text-muted">{DEFAULT_WEIGHTS[key].toFixed(1)}</td>
                        <td className="text-center px-2 py-1 font-semibold" style={{ color }}>{w.toFixed(3)}</td>
                        <td className="px-2 py-1">
                          <div className="relative rounded-sm" style={{ height: 6, background: 'rgba(255,255,255,0.08)', width: 80 }}>
                            <div className="absolute left-0 top-0 h-full rounded-sm transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
                            <div className="absolute top-[-1px] h-[8px]" style={{ left: '50%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mt-3">
              <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                onClick={personalScoring.retrain} disabled={personalScoring.training || personalScoring.needMore > 0}>
                {personalScoring.training ? <><span className="spinner" style={{ width: 11, height: 11 }} /> Training...</> : '🧠 Re-train weights'}
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                onClick={personalScoring.resetWeights}>
                ↺ Reset về default
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button className="btn btn-secondary" onClick={onReset}>↺ Reset về mặc định</button>
        </div>
        <div className="mt-4 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)' }}>
          <p className="text-[0.82rem]" style={{ color: '#00e676' }}>
            ⚠️ Tool chỉ dùng để nghiên cứu keyword. Luôn tạo nội dung gốc của riêng bạn.
          </p>
        </div>
      </section>
    </div>
  );
}
