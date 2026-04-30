import React, { useState } from 'react';
import RefVideoTable from './RefVideoTable.jsx';
import RefChannelTable from './RefChannelTable.jsx';
import CustomSelect from './CustomSelect.jsx';

export default function YoutubeTab({
  keywords, refVideos, refChannels, loading, serverConfigured,
  lastKeyword, onAnalyze, onExportVideos, onExportChannels, settings,
}) {
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('videos');

  const topKeywords = [...keywords]
    .filter(k => k.longFormScore >= 40)
    .sort((a, b) => b.longFormScore - a.longFormScore)
    .slice(0, 100);

  const kwOptions = topKeywords.map(k => ({
    value: k.keyword,
    label: `${k.keyword} (${k.longFormScore}đ)`,
  }));

  const estimatedCalls = Math.ceil((settings?.maxResults ?? 25) / 50) * 3 + 1; // search + videos + channels

  return (
    <div>
      <section className="card">
        <h2><span className="icon">▶️</span> Phân tích YouTube Long-Form</h2>

        {serverConfigured === false && (
          <div style={{
            background:'rgba(255,100,0,0.12)', border:'1px solid rgba(255,100,0,0.3)',
            borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:'0.85rem', color:'var(--orange)',
          }}>
            ⚠️ Server chưa cấu hình <code>YT_API_KEY</code>. Tạo file <code>server/.env</code> với <code>YT_API_KEY=...</code> rồi restart server.
          </div>
        )}

        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <div className="filter-group" style={{ flex:1, maxWidth:440 }}>
            <label>Chọn Keyword để phân tích</label>
            <CustomSelect
              value={selectedKeyword}
              onChange={setSelectedKeyword}
              options={kwOptions}
              placeholder="-- Chọn keyword --"
              style={{ width:'100%', maxWidth:440 }}
            />
          </div>
          <button
            className="btn btn-primary" style={{ alignSelf:'flex-end' }}
            onClick={() => onAnalyze(selectedKeyword)}
            disabled={loading || !selectedKeyword}
          >
            {loading
              ? <><span className="spinner" /> Đang phân tích...</>
              : '🔍 Phân tích bằng YouTube API'}
          </button>
          {!loading && selectedKeyword && (
            <span style={{ alignSelf:'flex-end', fontSize:'0.75rem', color:'var(--text-muted)' }}>
              ~{estimatedCalls} API calls
            </span>
          )}
        </div>

        {/* Export buttons */}
        {(refVideos.length > 0 || refChannels.length > 0) && (
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            {lastKeyword && (
              <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', alignSelf:'center' }}>
                Kết quả cho: <strong className="jp-text" style={{ color:'var(--accent)' }}>{lastKeyword}</strong>
              </span>
            )}
            <button className="btn btn-secondary" style={{ marginLeft:'auto' }} onClick={onExportVideos} disabled={!refVideos.length}>
              📥 Xuất CSV Videos
            </button>
            <button className="btn btn-secondary" onClick={onExportChannels} disabled={!refChannels.length}>
              📥 Xuất CSV Channels
            </button>
          </div>
        )}

        {/* Settings quick summary */}
        <div style={{ marginTop:10, fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', gap:16 }}>
          <span>⏱ Min duration: <strong>{settings?.minDurationMin ?? 8} phút</strong></span>
          <span>📅 Time window: <strong>{settings?.timeWindowDays ?? 180} ngày</strong></span>
          <span>🌏 Region: <strong>{settings?.regionCode ?? 'JP'}</strong></span>
          <span>📊 Max results: <strong>{settings?.maxResults ?? 25}</strong></span>
        </div>
      </section>

      {/* Results sub-tabs */}
      {(refVideos.length > 0 || refChannels.length > 0) && (
        <section className="card">
          <div style={{ display:'flex', gap:0, marginBottom:16, borderBottom:'1px solid var(--glass-border)' }}>
            {[
              { id:'videos',   label:`🎬 Video Tham Khảo (${refVideos.length})` },
              { id:'channels', label:`📺 Kênh Tham Khảo (${refChannels.length})` },
            ].map(t => (
              <button key={t.id}
                className={`tab-btn ${activeSubTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveSubTab(t.id)}
                style={{ fontSize:'0.88rem' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeSubTab === 'videos' && <RefVideoTable videos={refVideos} keyword={lastKeyword} />}
          {activeSubTab === 'channels' && <RefChannelTable channels={refChannels} />}
        </section>
      )}
    </div>
  );
}
