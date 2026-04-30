import React, { useRef } from 'react';
import { exportKeywordsCSV, exportRefVideosCSV, exportRefChannelsCSV, downloadBlob } from '../engine/csvUtils.js';

export default function CsvHistoryTab({ keywords, refVideos, refChannels, onImport, toast }) {
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImport(ev.target.result);
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  function handleExportKeywords() {
    if (!keywords.length) { toast('Chưa có keyword', 'error'); return; }
    downloadBlob(exportKeywordsCSV(keywords), 'youtube_longform_keywords.csv');
    toast('Đã xuất CSV keywords!', 'success');
  }
  function handleExportVideos() {
    if (!refVideos.length) { toast('Chưa có reference videos', 'error'); return; }
    downloadBlob(exportRefVideosCSV(refVideos), 'youtube_ref_videos.csv');
    toast('Đã xuất CSV reference videos!', 'success');
  }
  function handleExportChannels() {
    if (!refChannels.length) { toast('Chưa có reference channels', 'error'); return; }
    downloadBlob(exportRefChannelsCSV(refChannels), 'youtube_ref_channels.csv');
    toast('Đã xuất CSV reference channels!', 'success');
  }

  const scored = keywords.filter(k => k.longFormScore > 0);
  const withData = keywords.filter(k => k.apiData?.longVideosFound > 0);

  return (
    <div>
      <section className="card">
        <h2><span className="icon">📁</span> CSV / History</h2>

        {/* Summary */}
        <div className="stats-bar" style={{ marginBottom: 24 }}>
          <div className="stat-chip">
            <span>📋 Keywords đã tạo:</span>
            <span className="stat-value">{keywords.length}</span>
          </div>
          <div className="stat-chip">
            <span>📊 Đã chấm điểm:</span>
            <span className="stat-value">{scored.length}</span>
          </div>
          <div className="stat-chip">
            <span>▶️ Đã có YT data:</span>
            <span className="stat-value">{withData.length}</span>
          </div>
          <div className="stat-chip">
            <span>🎬 Ref Videos:</span>
            <span className="stat-value">{refVideos.length}</span>
          </div>
          <div className="stat-chip">
            <span>📺 Ref Channels:</span>
            <span className="stat-value">{refChannels.length}</span>
          </div>
        </div>

        {/* Export section */}
        <div className="csv-section">
          <h3>📥 Xuất dữ liệu</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16, marginTop:12 }}>
            {[
              {
                title: 'Keywords Long-Form',
                desc: `${keywords.length} keywords với đầy đủ 28 cột điểm số, chapters, metadata`,
                count: keywords.length,
                onClick: handleExportKeywords,
                filename: 'youtube_longform_keywords.csv',
              },
              {
                title: 'Reference Videos',
                desc: `${refVideos.length} video tham khảo với thời lượng, views, fit score`,
                count: refVideos.length,
                onClick: handleExportVideos,
                filename: 'youtube_ref_videos.csv',
              },
              {
                title: 'Reference Channels',
                desc: `${refChannels.length} kênh tham khảo với subscribers, fit score, cơ hội`,
                count: refChannels.length,
                onClick: handleExportChannels,
                filename: 'youtube_ref_channels.csv',
              },
            ].map(item => (
              <div key={item.title} style={{
                background:'var(--glass)', border:'1px solid var(--glass-border)',
                borderRadius:'var(--radius-sm)', padding:16,
              }}>
                <div style={{ fontWeight:600, marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:12 }}>{item.desc}</div>
                <button
                  className="btn btn-primary"
                  style={{ width:'100%', justifyContent:'center' }}
                  onClick={item.onClick}
                  disabled={item.count === 0}
                >
                  📥 Xuất {item.filename}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Import section */}
        <div className="csv-section" style={{ marginTop:24 }}>
          <h3>📤 Nhập dữ liệu từ CSV</h3>
          <p style={{ fontSize:'0.83rem', color:'var(--text-secondary)', marginBottom:12 }}>
            Nhập file CSV keywords đã xuất trước đó. Các keyword chưa có sẽ được thêm vào danh sách hiện tại.
          </p>
          <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>
            📂 Chọn file CSV keywords để nhập
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {/* Data freshness info */}
        <div style={{
          marginTop:24, padding:'14px 16px', background:'rgba(0,229,255,0.05)',
          border:'1px solid rgba(0,229,255,0.15)', borderRadius:'var(--radius-sm)',
        }}>
          <h3 style={{ fontSize:'0.9rem', marginBottom:8, color:'var(--accent)' }}>ℹ️ Về độ tươi dữ liệu</h3>
          <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.7 }}>
            <div>🟢 <strong>Fresh</strong> — Thu thập trong vòng 7 ngày qua</div>
            <div>🔵 <strong>Recent</strong> — Thu thập trong vòng 30 ngày qua</div>
            <div>🟡 <strong>Stale</strong> — Thu thập từ 30–90 ngày trước</div>
            <div>🔴 <strong>Very stale</strong> — Thu thập từ hơn 90 ngày trước</div>
          </div>
          <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:8 }}>
            Để refresh dữ liệu, chọn keyword và bấm "Phân tích bằng YouTube API" lại.
          </p>
        </div>
      </section>
    </div>
  );
}
