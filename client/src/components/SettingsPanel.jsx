import React, { useState, useEffect } from 'react';
import { getQuotaInfo } from '../engine/quotaTracker.js';
import CustomSelect from './CustomSelect.jsx';

export default function SettingsPanel({ settings, onUpdate, onReset }) {
  function f(key, val) { onUpdate({ [key]: val }); }

  // ── API Key management ──────────────────────────────────────
  const [keyInput, setKeyInput] = useState((settings.apiKeys ?? []).join('\n'));
  const [keyStatus, setKeyStatus] = useState('idle'); // idle | saving | saved | error
  const [quotaInfo, setQuotaInfo] = useState([]);

  // Refresh quota display every time component renders or keys change
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
    setKeyInput('');
    onUpdate({ apiKeys: [], activeKeyIndex: 0 });
    setKeyStatus('idle');
  }

  const savedKeys = (settings.apiKeys ?? []).filter(k => k.trim());

  return (
    <div>
      <section className="card">
        <h2><span className="icon">⚙️</span> Cài đặt</h2>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:24 }}>

          {/* ── YouTube API Keys ── */}
          <div className="settings-group settings-group--full">
            <h3>🔑 YouTube API Keys của bạn</h3>
            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:10 }}>
              Nhập mỗi API key trên 1 dòng. Khi key 1 hết quota (10,000 units/ngày), hệ thống tự chuyển sang key 2...
            </p>

            <textarea
              value={keyInput}
              onChange={e => { setKeyInput(e.target.value); setKeyStatus('idle'); }}
              placeholder={'AIzaSy...(key 1)\nAIzaSy...(key 2)\nAIzaSy...(key 3)'}
              rows={4}
              style={{
                width:'100%', background:'rgba(255,255,255,0.04)',
                border:'1px solid var(--glass-border)', borderRadius:8,
                color:'var(--text)', padding:'10px 14px', fontSize:'0.83rem',
                fontFamily:'monospace', resize:'vertical', boxSizing:'border-box',
                lineHeight:1.7,
              }}
            />

            <div style={{ display:'flex', gap:10, marginTop:10, alignItems:'center' }}>
              <button className="btn btn-primary" onClick={handleSaveKeys} style={{ padding:'8px 20px' }}>
                {keyStatus === 'saving' ? '⏳ Đang lưu...' : keyStatus === 'saved' ? '✅ Đã lưu!' : '💾 Lưu keys'}
              </button>
              {savedKeys.length > 0 && (
                <button className="btn btn-secondary" onClick={handleClearKeys} style={{ padding:'8px 16px' }}>
                  🗑️ Xoá tất cả
                </button>
              )}
              <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
                {savedKeys.length > 0 ? `${savedKeys.length} key đã lưu` : 'Chưa có key nào'}
              </span>
            </div>

            {/* ── Quota Display ── */}
            {quotaInfo.length > 0 && (
              <div style={{ marginTop:16 }}>
                <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:8, fontWeight:600 }}>
                  📊 Quota hôm nay (ước tính)
                </p>
                {quotaInfo.map((q, i) => (
                  <div key={i} style={{
                    background:'var(--bg-secondary)', borderRadius:8, padding:'10px 14px',
                    marginBottom:8, border:'1px solid var(--glass-border)',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'var(--accent)' }}>
                        Key #{i+1}: <span style={{ color:'var(--text-muted)' }}>{q.masked}</span>
                      </span>
                      <span style={{ fontSize:'0.78rem', color: q.exhausted ? 'var(--red)' : q.pct > 70 ? '#ffa726' : 'var(--green)' }}>
                        {q.exhausted ? '🔴 Hết quota' : q.pct > 70 ? '🟡 Sắp hết' : '🟢 Còn dùng được'}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:4, height:6, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:4, transition:'width 0.4s',
                        width: `${q.pct}%`,
                        background: q.exhausted ? 'var(--red)' : q.pct > 70 ? '#ffa726' : 'var(--accent)',
                      }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:'0.72rem', color:'var(--text-muted)' }}>
                      <span>Đã dùng: <strong style={{ color:'var(--text)' }}>{q.used.toLocaleString()}</strong> units</span>
                      <span>Còn lại: <strong style={{ color:'var(--text)' }}>{q.remaining.toLocaleString()}</strong> / {q.limit.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}>
                  * Ước tính ~150 units/lần phân tích. Quota reset lúc 00:00 UTC mỗi ngày.
                </p>
              </div>
            )}

            {savedKeys.length === 0 && (
              <div style={{
                marginTop:12, padding:'10px 14px', borderRadius:8,
                background:'rgba(0,229,255,0.06)', border:'1px solid rgba(0,229,255,0.15)',
              }}>
                <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                  💡 Lấy API key miễn phí tại{' '}
                  <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer"
                    style={{ color:'var(--accent)' }}>console.cloud.google.com</a>
                  {' '}→ Enable <strong>YouTube Data API v3</strong> → Credentials → Create API Key.
                  <br />Mỗi key cho phép <strong>10,000 units/ngày</strong> miễn phí.
                </p>
              </div>
            )}
          </div>

          {/* ── Search Settings ── */}
          <div className="settings-group">
            <h3>🔍 Cài đặt Tìm kiếm</h3>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Thời lượng long-form tối thiểu</label>
              <CustomSelect
                value={settings.minDurationMin}
                onChange={v => f('minDurationMin', v)}
                options={[
                  { value:5,  label:'5 phút' },
                  { value:8,  label:'8 phút (mặc định)' },
                  { value:10, label:'10 phút' },
                  { value:20, label:'20 phút' },
                ]}
                placeholder="Chọn..."
              />
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Time window (ngày)</label>
              <CustomSelect
                value={settings.timeWindowDays}
                onChange={v => f('timeWindowDays', v)}
                options={[
                  { value:30,   label:'30 ngày' },
                  { value:90,   label:'90 ngày' },
                  { value:180,  label:'180 ngày (mặc định)' },
                  { value:365,  label:'365 ngày' },
                  { value:3650, label:'Toàn thời gian' },
                ]}
                placeholder="Chọn..."
              />
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Max results / keyword</label>
              <CustomSelect
                value={settings.maxResults}
                onChange={v => f('maxResults', v)}
                options={[
                  { value:10, label:'10' },
                  { value:25, label:'25 (mặc định)' },
                  { value:50, label:'50' },
                ]}
                placeholder="Chọn..."
              />
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Thứ tự kết quả</label>
              <CustomSelect
                value={settings.orderBy}
                onChange={v => f('orderBy', v)}
                options={[
                  { value:'relevance', label:'Relevance (mặc định)' },
                  { value:'viewCount', label:'View Count' },
                  { value:'date',      label:'Date' },
                ]}
                placeholder="Chọn..."
              />
            </div>
          </div>

          {/* ── Region & Language ── */}
          <div className="settings-group">
            <h3>🌏 Region &amp; Language</h3>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Region Code</label>
              <CustomSelect
                value={settings.regionCode}
                onChange={v => f('regionCode', v)}
                options={[
                  { value:'JP', label:'JP — Nhật Bản (mặc định)' },
                  { value:'US', label:'US — Mỹ' },
                  { value:'VN', label:'VN — Việt Nam' },
                ]}
                placeholder="Chọn..."
              />
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Language Code</label>
              <CustomSelect
                value={settings.languageCode}
                onChange={v => f('languageCode', v)}
                options={[
                  { value:'ja', label:'ja — Tiếng Nhật (mặc định)' },
                  { value:'en', label:'en — Tiếng Anh' },
                  { value:'vi', label:'vi — Tiếng Việt' },
                ]}
                placeholder="Chọn..."
              />
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Cache duration (ngày)</label>
              <CustomSelect
                value={settings.cacheDays}
                onChange={v => f('cacheDays', v)}
                options={[
                  { value:1,  label:'1 ngày' },
                  { value:7,  label:'7 ngày (mặc định)' },
                  { value:30, label:'30 ngày' },
                ]}
                placeholder="Chọn..."
              />
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:12 }}>
              <input type="checkbox" checked={settings.hideRisky} onChange={e => f('hideRisky', e.target.checked)} />
              Ẩn kênh/video rủi ro theo mặc định
            </label>
          </div>
        </div>

        <div style={{ marginTop:24, display:'flex', gap:12, justifyContent:'flex-end', borderTop:'1px solid var(--glass-border)', paddingTop:16 }}>
          <button className="btn btn-secondary" onClick={onReset}>↺ Reset về mặc định</button>
        </div>

        {/* Notice */}
        <div style={{
          marginTop:16, padding:'12px 16px',
          background:'rgba(0,230,118,0.05)', border:'1px solid rgba(0,230,118,0.15)', borderRadius:8,
        }}>
          <p style={{ fontSize:'0.82rem', color:'var(--green)' }}>
            ⚠️ Tool này chỉ dùng để nghiên cứu keyword, video tham khảo và kênh tham khảo cho nội dung gốc long-form.
            Điểm số chỉ đúng theo dữ liệu được lấy tại thời điểm phân tích. Luôn tạo nội dung gốc của riêng bạn.
          </p>
        </div>
      </section>
    </div>
  );
}
