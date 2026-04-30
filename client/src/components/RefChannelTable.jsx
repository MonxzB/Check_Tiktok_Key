import React, { useState, useMemo } from 'react';
import { formatNum } from './utils.js';

export default function RefChannelTable({ channels }) {
  const [sortCol, setSortCol] = useState('fitScore');
  const [sortDir, setSortDir] = useState('desc');
  const [hideRisky, setHideRisky] = useState(true);
  const [smallOnly, setSmallOnly] = useState(false);

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const sorted = useMemo(() => {
    let f = [...channels];
    if (hideRisky) f = f.filter(c => !c.isRisky);
    if (smallOnly) f = f.filter(c => c.isSmallOpportunity);
    f.sort((a, b) => {
      let va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return f;
  }, [channels, hideRisky, smallOnly, sortCol, sortDir]);

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
      <div className="filter-bar" style={{ marginBottom: 12, padding: '10px 0' }}>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem', color:'var(--text-secondary)', cursor:'pointer' }}>
          <input type="checkbox" checked={hideRisky} onChange={e => setHideRisky(e.target.checked)} />
          Ẩn kênh rủi ro
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem', color:'var(--text-secondary)', cursor:'pointer' }}>
          <input type="checkbox" checked={smallOnly} onChange={e => setSmallOnly(e.target.checked)} />
          Chỉ kênh nhỏ có cơ hội
        </label>
        <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--text-muted)' }}>
          {sorted.length} kênh tham khảo
        </span>
      </div>
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
