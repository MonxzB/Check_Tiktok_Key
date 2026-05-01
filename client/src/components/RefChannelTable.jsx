import React, { useState, useMemo } from 'react';
import { formatNum } from './utils.js';

export default function RefChannelTable({ channels }) {
  const [sortCol, setSortCol]   = useState('fitScore');
  const [sortDir, setSortDir]   = useState('desc');
  const [hideRisky, setHideRisky] = useState(true);
  const [smallOnly, setSmallOnly] = useState(false);
  const [maxSubs, setMaxSubs]   = useState(0);
  const [minScore, setMinScore] = useState(0);
  const [minRatio, setMinRatio] = useState(0);
  const [search, setSearch]     = useState('');

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const sorted = useMemo(() => {
    let f = [...channels];
    if (hideRisky)    f = f.filter(c => !c.isRisky);
    if (smallOnly)    f = f.filter(c => c.isSmallOpportunity);
    if (maxSubs > 0)  f = f.filter(c => c.subscriberCount <= maxSubs);
    if (minScore > 0) f = f.filter(c => c.fitScore >= minScore);
    if (minRatio > 0) f = f.filter(c => c.bestViewSubRatio >= minRatio);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      f = f.filter(c => c.channelTitle?.toLowerCase().includes(q));
    }
    f.sort((a, b) => {
      let va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return f;
  }, [channels, hideRisky, smallOnly, maxSubs, minScore, minRatio, search, sortCol, sortDir]);

  const activeFilters = [hideRisky, smallOnly, maxSubs > 0, minScore > 0, minRatio > 0, search.trim()].filter(Boolean).length;

  if (!channels.length) return (
    <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>
      Chưa có kênh tham khảo. Hãy phân tích keyword bằng YouTube API.
    </div>
  );

  const COLS = [
    { key: 'channelTitle',     label: 'Tên Kênh' },
    { key: 'subscriberCount',  label: 'Subscribers' },
    { key: 'viewCount',        label: 'Tổng Views' },
    { key: 'videoCount',       label: 'Số Video' },
    { key: 'relatedLongVideos',label: 'Long Videos Tìm Thấy' },
    { key: 'bestVideoViews',   label: 'Best Video Views' },
    { key: 'bestViewSubRatio', label: 'Best View/Sub' },
    { key: 'fitScore',         label: 'Fit Score' },
    { key: 'recommendation',   label: 'Đề xuất' },
    { key: 'reason',           label: 'Lý do' },
  ];

  return (
    <div>
      {/* ── Filter bar ── */}
      <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'12px 14px', marginBottom:12, border:'1px solid var(--glass-border)' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>

          {/* Search */}
          <div className="filter-group" style={{ flex:'1 1 180px', minWidth:150 }}>
            <label>🔍 Tìm tên kênh</label>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nhập tên kênh..."
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:6, color:'var(--text)', padding:'6px 10px', fontSize:'0.83rem', width:'100%' }}
            />
          </div>

          {/* Max subscribers */}
          <div className="filter-group" style={{ minWidth:140 }}>
            <label>👥 Sub tối đa</label>
            <select value={maxSubs} onChange={e => setMaxSubs(+e.target.value)}>
              <option value={0}>Tất cả</option>
              <option value={10000}>≤ 10K (Micro)</option>
              <option value={50000}>≤ 50K (Nhỏ)</option>
              <option value={100000}>≤ 100K (Vừa)</option>
              <option value={500000}>≤ 500K (Lớn)</option>
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

          {/* Min View/Sub ratio */}
          <div className="filter-group" style={{ minWidth:130 }}>
            <label>📈 View/Sub tối thiểu</label>
            <select value={minRatio} onChange={e => setMinRatio(+e.target.value)}>
              <option value={0}>Tất cả</option>
              <option value={0.5}>0.5x+</option>
              <option value={1}>1x+ (Tốt)</option>
              <option value={3}>3x+ (Rất tốt)</option>
              <option value={5}>5x+ (Xuất sắc)</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, alignSelf:'flex-end', paddingBottom:4 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', color:'var(--text-secondary)', cursor:'pointer' }}>
              <input type="checkbox" checked={hideRisky} onChange={e => setHideRisky(e.target.checked)} />
              Ẩn kênh rủi ro
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', color:'var(--green)', cursor:'pointer' }}>
              <input type="checkbox" checked={smallOnly} onChange={e => setSmallOnly(e.target.checked)} />
              🎯 Chỉ kênh nhỏ cơ hội
            </label>
          </div>

          {/* Reset */}
          {activeFilters > 0 && (
            <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:'0.78rem', alignSelf:'flex-end' }}
              onClick={() => { setMaxSubs(0); setMinScore(0); setMinRatio(0); setSearch(''); setHideRisky(true); setSmallOnly(false); }}>
              ✕ Reset ({activeFilters})
            </button>
          )}

          <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--text-muted)', alignSelf:'flex-end', paddingBottom:4 }}>
            {sorted.length} / {channels.length} kênh
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
            </tr>
          </thead>
          <tbody>
            {sorted.map(ch => (
              <tr key={ch.channelId} style={{ opacity: ch.isRisky ? 0.5 : 1 }}>
                <td>
                  <a href={ch.channelUrl} target="_blank" rel="noreferrer"
                    style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>
                    {ch.channelTitle}
                  </a>
                  {ch.isSmallOpportunity && (
                    <span style={{ marginLeft:6, fontSize:'0.7rem', color:'var(--green)' }}>🎯 Kênh nhỏ cơ hội</span>
                  )}
                </td>
                <td>{formatNum(ch.subscriberCount)}</td>
                <td>{formatNum(ch.viewCount)}</td>
                <td>{formatNum(ch.videoCount)}</td>
                <td style={{ color:'var(--accent)', textAlign:'center' }}>{ch.relatedLongVideos}</td>
                <td style={{ color:'var(--accent)' }}>{formatNum(ch.bestVideoViews)}</td>
                <td style={{ color: ch.bestViewSubRatio >= 1 ? 'var(--green)' : 'var(--text-secondary)' }}>
                  {ch.bestViewSubRatio?.toFixed(1)}x
                </td>
                <td>
                  <span className={`score-badge ${ch.fitScore >= 70 ? 'score-high' : ch.fitScore >= 50 ? 'score-med' : 'score-low'}`}>
                    {ch.fitScore}
                  </span>
                </td>
                <td style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{ch.recommendation}</td>
                <td style={{ fontSize:'0.75rem', color:'var(--text-muted)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {ch.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:10 }}>
        ⚠️ Các kênh trên chỉ để học cấu trúc tiêu đề và cách triển khai chủ đề. Không copy hoặc reup nội dung.
      </p>
    </div>
  );
}
