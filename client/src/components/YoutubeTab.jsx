import React, { useState } from 'react';
import RefVideoTable from './RefVideoTable.jsx';
import RefChannelTable from './RefChannelTable.jsx';
import CustomSelect from './CustomSelect.jsx';
import ApiKeyModal from './ApiKeyModal.jsx';

export default function YoutubeTab({
  keywords, refVideos, refChannels, loading, serverConfigured,
  lastKeyword, onAnalyze, onExportVideos, onExportChannels, settings, onSaveKeys,
}) {
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('videos');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const topKeywords = [...keywords]
    .filter(k => k.longFormScore >= 40)
    .sort((a, b) => b.longFormScore - a.longFormScore)
    .slice(0, 100);

  const kwOptions = topKeywords.map(k => ({
    value: k.keyword,
    label: `${k.keyword} (${k.longFormScore}đ)`,
  }));

  const hasKeys = (settings?.apiKeys ?? []).filter(k => k.trim()).length > 0;
  const estimatedCalls = Math.ceil((settings?.maxResults ?? 25) / 50) * 3 + 1;

  function handleAnalyzeClick() {
    if (!selectedKeyword) return;
    if (!hasKeys) {
      // No API key configured → show popup
      setShowKeyModal(true);
      return;
    }
    onAnalyze(selectedKeyword);
  }

  function handleModalSave(keys) {
    onSaveKeys(keys);          // save to settings
    setShowKeyModal(false);
    // small delay to let settings update propagate
    setTimeout(() => onAnalyze(selectedKeyword), 100);
  }

  return (
    <div>
      <section className="card">
        <h2><span className="icon">▶️</span> Phân tích YouTube Long-Form</h2>

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
            onClick={handleAnalyzeClick}
            disabled={loading || !selectedKeyword}
          >
            {loading
              ? <><span className="spinner" /> Đang phân tích...</>
              : '🔍 Phân tích'}
          </button>

          {!loading && selectedKeyword && hasKeys && (
            <span style={{ alignSelf:'flex-end', fontSize:'0.75rem', color:'var(--text-muted)' }}>
              ~{estimatedCalls} API calls
            </span>
          )}
        </div>

        {/* Key status */}
        {!hasKeys && (
          <div style={{
            background:'rgba(255,170,0,0.08)', border:'1px solid rgba(255,170,0,0.25)',
            borderRadius:8, padding:'8px 14px', marginBottom:12,
            fontSize:'0.82rem', color:'#ffa726', display:'flex', alignItems:'center', gap:8,
          }}>
            ⚠️ Chưa có API key. Bấm <strong>🔍 Phân tích</strong> để nhập key, hoặc vào <strong>⚙️ Cài đặt</strong> để thêm.
          </div>
        )}

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
        <div style={{ marginTop:10, fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', gap:16, flexWrap:'wrap' }}>
          <span>⏱ Min duration: <strong>{settings?.minDurationMin ?? 8} phút</strong></span>
          <span>📅 Time window: <strong>{settings?.timeWindowDays ?? 180} ngày</strong></span>
          <span>🌏 Region: <strong>{settings?.regionCode ?? 'JP'}</strong></span>
          <span>📊 Max results: <strong>{settings?.maxResults ?? 25}</strong></span>
          {hasKeys && (
            <span>🔑 Keys: <strong style={{ color:'var(--green)' }}>{(settings?.apiKeys ?? []).filter(k=>k.trim()).length} key</strong></span>
          )}
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

      {/* API Key Modal */}
      {showKeyModal && (
        <ApiKeyModal
          onSave={handleModalSave}
          onCancel={() => setShowKeyModal(false)}
        />
      )}
    </div>
  );
}
