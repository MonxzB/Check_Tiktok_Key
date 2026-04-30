import React from 'react';

export default function SettingsPanel({ settings, onUpdate, onReset }) {
  function f(key, val) { onUpdate({ [key]: val }); }

  return (
    <div>
      <section className="card">
        <h2><span className="icon">⚙️</span> Cài đặt</h2>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:24 }}>

          {/* YouTube API */}
          <div className="settings-group">
            <h3>🔒 YouTube API</h3>
            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:8 }}>
              API Key được lưu bảo mật trong <code>server/.env</code>, không lộ ra trình duyệt.
            </p>
            <pre style={{
              background:'var(--bg-secondary)', padding:12, borderRadius:8,
              fontSize:'0.8rem', color:'var(--green)', border:'1px solid var(--glass-border)',
            }}>
{`# server/.env
YT_API_KEY=your_key_here
PORT=3001`}
            </pre>
            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:8 }}>
              Quota: ~3–5 API calls / 1 lần phân tích. Daily free quota: 10,000 units.
            </p>
          </div>

          {/* Search Settings */}
          <div className="settings-group">
            <h3>🔍 Cài đặt Tìm kiếm</h3>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Thời lượng long-form tối thiểu</label>
              <select value={settings.minDurationMin} onChange={e => f('minDurationMin', +e.target.value)}>
                <option value={5}>5 phút</option>
                <option value={8}>8 phút (mặc định)</option>
                <option value={10}>10 phút</option>
                <option value={20}>20 phút</option>
              </select>
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Time window (ngày)</label>
              <select value={settings.timeWindowDays} onChange={e => f('timeWindowDays', +e.target.value)}>
                <option value={30}>30 ngày</option>
                <option value={90}>90 ngày</option>
                <option value={180}>180 ngày (mặc định)</option>
                <option value={365}>365 ngày</option>
                <option value={3650}>Toàn thời gian</option>
              </select>
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Max results / keyword</label>
              <select value={settings.maxResults} onChange={e => f('maxResults', +e.target.value)}>
                <option value={10}>10</option>
                <option value={25}>25 (mặc định)</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Thứ tự kết quả</label>
              <select value={settings.orderBy} onChange={e => f('orderBy', e.target.value)}>
                <option value="relevance">Relevance (mặc định)</option>
                <option value="viewCount">View Count</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>

          {/* Region & Language */}
          <div className="settings-group">
            <h3>🌏 Region &amp; Language</h3>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Region Code</label>
              <select value={settings.regionCode} onChange={e => f('regionCode', e.target.value)}>
                <option value="JP">JP — Nhật Bản (mặc định)</option>
                <option value="US">US — Mỹ</option>
                <option value="VN">VN — Việt Nam</option>
              </select>
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Language Code</label>
              <select value={settings.languageCode} onChange={e => f('languageCode', e.target.value)}>
                <option value="ja">ja — Tiếng Nhật (mặc định)</option>
                <option value="en">en — Tiếng Anh</option>
                <option value="vi">vi — Tiếng Việt</option>
              </select>
            </div>

            <div className="filter-group" style={{ marginBottom:12 }}>
              <label>Cache duration (ngày)</label>
              <select value={settings.cacheDays} onChange={e => f('cacheDays', +e.target.value)}>
                <option value={1}>1 ngày</option>
                <option value={7}>7 ngày (mặc định)</option>
                <option value={30}>30 ngày</option>
              </select>
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
