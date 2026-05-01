import React, { useState, useMemo } from 'react';
import { formatNum } from './utils.js';

export default function RefVideoTable({ videos, keyword }) {
  const [sortCol, setSortCol]     = useState('longFormFitScore');
  const [sortDir, setSortDir]     = useState('desc');
  const [hideRisky, setHideRisky] = useState(true);
  const [minDuration, setMinDuration] = useState(0);
  const [minViews, setMinViews]   = useState(0);
  const [minScore, setMinScore]   = useState(0);
  const [search, setSearch]       = useState('');

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const sorted = useMemo(() => {
    let f = [...videos];
    if (hideRisky)    f = f.filter(v => !v.isRisky);
    if (minDuration > 0) f = f.filter(v => v.durationSec >= minDuration * 60);
    if (minViews > 0) f = f.filter(v => v.viewCount >= minViews);
    if (minScore > 0) f = f.filter(v => v.longFormFitScore >= minScore);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      f = f.filter(v => v.title?.toLowerCase().includes(q) || v.channelTitle?.toLowerCase().includes(q));
    }
    f.sort((a, b) => {
      let va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return f;
  }, [videos, hideRisky, minDuration, minViews, minScore, search, sortCol, sortDir]);

  const activeFilters = [hideRisky, minDuration > 0, minViews > 0, minScore > 0, search.trim()].filter(Boolean).length;

  if (!videos.length) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
      Chưa có video. Bấm "🔍 Phân tích" để tìm video long-form tham khảo.
    </div>
  );

  const COLS = [
    { key: 'title',            label: 'Tiêu đề Video' },
    { key: 'channelTitle',     label: 'Kênh Tham Khảo' },
    { key: 'durationFormatted',label: 'Thời lượng' },
    { key: 'viewCount',        label: 'Views' },
    { key: 'likeCount',        label: 'Likes' },
    { key: 'subscriberCount',  label: 'Subscribers' },
    { key: 'viewSubRatio',     label: 'View/Sub' },
    { key: 'longFormFitScore', label: 'Fit Score' },
    { key: 'publishedAt',      label: 'Ngày đăng' },
  ];

  return (
    <div>
      {/* ── Filter bar ── */}
      <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'12px 14px', marginBottom:12, border:'1px solid var(--glass-border)' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>

          {/* Search */}
          <div className="filter-group" style={{ flex:'1 1 200px', minWidth:160 }}>
            <label>🔍 Tìm tiêu đề / kênh</label>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nhập từ khoá..."
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:6, color:'var(--text)', padding:'6px 10px', fontSize:'0.83rem', width:'100%' }}
            />
          </div>

          {/* Min duration */}
          <div className="filter-group" style={{ minWidth:140 }}>
            <label>⏱ Thời lượng tối thiểu</label>
            <select value={minDuration} onChange={e => setMinDuration(+e.target.value)}>
              <option value={0}>Tất cả</option>
              <option value={5}>5 phút+</option>
              <option value={8}>8 phút+</option>
              <option value={10}>10 phút+</option>
              <option value={20}>20 phút+</option>
              <option value={30}>30 phút+</option>
            </select>
          </div>

          {/* Min views */}
          <div className="filter-group" style={{ minWidth:130 }}>
            <label>👁 Views tối thiểu</label>
            <select value={minViews} onChange={e => setMinViews(+e.target.value)}>
              <option value={0}>Tất cả</option>
              <option value={1000}>1K+</option>
              <option value={5000}>5K+</option>
              <option value={10000}>10K+</option>
              <option value={50000}>50K+</option>
              <option value={100000}>100K+</option>
            </select>
          </div>

          {/* Min fit score */}
          <div className="filter-group" style={{ minWidth:130 }}>
            <label>⭐ Fit Score tối thiểu</label>
            <select value={minScore} onChange={e => setMinScore(+e.target.value)}>
              <option value={0}>Tất cả</option>
              <option value={50}>50+ (Tốt)</option>
              <option value={70}>70+ (Rất tốt)</option>
              <option value={85}>85+ (Xuất sắc)</option>
            </select>
          </div>

          {/* Hide risky */}
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.83rem', color:'var(--text-secondary)', cursor:'pointer', alignSelf:'flex-end', paddingBottom:4 }}>
            <input type="checkbox" checked={hideRisky} onChange={e => setHideRisky(e.target.checked)} />
            Ẩn rủi ro
          </label>

          {/* Reset */}
          {activeFilters > 0 && (
            <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:'0.78rem', alignSelf:'flex-end' }}
              onClick={() => { setMinDuration(0); setMinViews(0); setMinScore(0); setSearch(''); setHideRisky(true); }}>
              ✕ Reset ({activeFilters})
            </button>
          )}

          <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--text-muted)', alignSelf:'flex-end', paddingBottom:4 }}>
            {sorted.length} / {videos.length} video
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)}
                  className={sortCol === c.key ? `sorted-${sortDir}` : ''}>
                  {c.label}
                </th>
              ))}
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(v => (
              <tr key={v.videoId} style={{ opacity: v.isRisky ? 0.5 : 1 }}>
                <td className="jp-text" style={{ maxWidth: 280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                  title={v.title}>{v.title}</td>
                <td style={{ whiteSpace:'nowrap' }}>
                  <a href={v.channelUrl} target="_blank" rel="noreferrer"
                    style={{ color:'var(--accent)', textDecoration:'none' }} onClick={e => e.stopPropagation()}>
                    {v.channelTitle}
                  </a>
                </td>
                <td style={{ color: 'var(--green)', whiteSpace:'nowrap' }}>{v.durationFormatted}</td>
                <td style={{ color:'var(--accent)' }}>{formatNum(v.viewCount)}</td>
                <td>{formatNum(v.likeCount)}</td>
                <td>{formatNum(v.subscriberCount)}</td>
                <td style={{ color: v.viewSubRatio >= 1 ? 'var(--green)' : 'var(--text-secondary)' }}>
                  {v.viewSubRatio?.toFixed(1)}x
                </td>
                <td>
                  <span className={`score-badge ${v.longFormFitScore >= 70 ? 'score-high' : v.longFormFitScore >= 50 ? 'score-med' : 'score-low'}`}>
                    {v.longFormFitScore}
                  </span>
                </td>
                <td style={{ fontSize:'0.75rem', whiteSpace:'nowrap' }}>{(v.publishedAt||'').split('T')[0]}</td>
                <td>
                  <a href={v.videoUrl} target="_blank" rel="noreferrer"
                    style={{ color:'#f00', textDecoration:'none', fontSize:'0.78rem', fontWeight:600 }}
                    onClick={e => e.stopPropagation()}>
                    ▶ Xem
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop: 10 }}>
        ⚠️ Các video trên chỉ là tham khảo cấu trúc tiêu đề và cách triển khai chủ đề. Không copy, reup hoặc sử dụng nội dung của video tham khảo.
      </p>
    </div>
  );
}
