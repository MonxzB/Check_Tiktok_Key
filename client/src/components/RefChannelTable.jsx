import React, { useState, useMemo } from 'react';
import { formatNum } from './utils.js';
import CustomSelect from './CustomSelect.jsx';

// ── Sweet spot presets ──────────────────────────────────────
const PRESETS = {
  none:       { label: 'Không áp dụng',    minSubs:0,     maxSubs:0,      minRatio:0 },
  micro:      { label: '🌱 Micro (<10K)',   minSubs:0,     maxSubs:10000,  minRatio:0.5 },
  sweetspot:  { label: '🎯 Sweet Spot',     minSubs:10000, maxSubs:500000, minRatio:1 },
  medium:     { label: '📈 Tầm trung',      minSubs:50000, maxSubs:1000000,minRatio:1 },
  any_ratio:  { label: '🔥 Ratio cao (≥3x)',minSubs:0,     maxSubs:0,      minRatio:3 },
};

// ── Niche competition analysis ──────────────────────────────
function analyzeCompetition(channels) {
  if (!channels.length) return null;
  const big    = channels.filter(c => c.subscriberCount > 500000).length;
  const medium = channels.filter(c => c.subscriberCount > 100000 && c.subscriberCount <= 500000).length;
  const small  = channels.filter(c => c.subscriberCount <= 100000).length;
  const avgSubs = channels.reduce((s,c) => s + c.subscriberCount, 0) / channels.length;
  const avgRatio = channels.reduce((s,c) => s + (c.bestViewSubRatio||0), 0) / channels.length;
  const difficulty = big > channels.length * 0.5 ? 'Rất khó' : big > channels.length * 0.3 ? 'Khó' : medium > channels.length * 0.5 ? 'Trung bình' : 'Dễ';
  const diffColor  = difficulty === 'Rất khó' ? 'var(--red)' : difficulty === 'Khó' ? 'var(--orange)' : difficulty === 'Trung bình' ? 'var(--yellow)' : 'var(--green)';
  return { big, medium, small, total:channels.length, avgSubs, avgRatio, difficulty, diffColor };
}

export default function RefChannelTable({ channels }) {
  const [sortCol, setSortCol]     = useState('fitScore');
  const [sortDir, setSortDir]     = useState('desc');
  const [hideRisky, setHideRisky] = useState(true);
  const [preset, setPreset]       = useState('none');
  const [maxSubs, setMaxSubs]     = useState(0);
  const [minSubs, setMinSubs]     = useState(0);
  const [minScore, setMinScore]   = useState(0);
  const [minRatio, setMinRatio]   = useState(0);
  const [search, setSearch]       = useState('');

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  function applyPreset(key) {
    setPreset(key);
    const p = PRESETS[key];
    setMinSubs(p.minSubs);
    setMaxSubs(p.maxSubs);
    setMinRatio(p.minRatio);
  }

  function resetAll() {
    setPreset('none'); setMinSubs(0); setMaxSubs(0);
    setMinScore(0); setMinRatio(0); setSearch(''); setHideRisky(true);
  }

  const comp = useMemo(() => analyzeCompetition(channels), [channels]);

  const sorted = useMemo(() => {
    let f = [...channels];
    if (hideRisky)    f = f.filter(c => !c.isRisky);
    if (minSubs > 0)  f = f.filter(c => c.subscriberCount >= minSubs);
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
  }, [channels, hideRisky, minSubs, maxSubs, minScore, minRatio, search, sortCol, sortDir]);

  const activeFilters = [hideRisky, minSubs > 0, maxSubs > 0, minScore > 0, minRatio > 0, search.trim()].filter(Boolean).length;

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
    { key: 'relatedLongVideos',label: 'Long Videos' },
    { key: 'bestVideoViews',   label: 'Best Video Views' },
    { key: 'bestViewSubRatio', label: 'Best View/Sub' },
    { key: 'fitScore',         label: 'Fit Score' },
    { key: 'recommendation',   label: 'Đề xuất' },
    { key: 'reason',           label: 'Lý do' },
  ];

  const scoreOpts = [
    { value:0, label:'Tất cả' }, { value:50, label:'50+ (Tốt)' },
    { value:70, label:'70+ (Rất tốt)' }, { value:85, label:'85+ (Xuất sắc)' },
  ];

  const subsOpts = [
    { value:0, label:'Không giới hạn' },
    { value:1000,    label:'1K+' },
    { value:10000,   label:'10K+' },
    { value:50000,   label:'50K+' },
    { value:100000,  label:'100K+' },
  ];

  const maxSubsOpts = [
    { value:0, label:'Không giới hạn' },
    { value:10000,   label:'≤ 10K (Micro)' },
    { value:50000,   label:'≤ 50K (Nhỏ)' },
    { value:100000,  label:'≤ 100K (Vừa)' },
    { value:500000,  label:'≤ 500K (Lớn)' },
    { value:1000000, label:'≤ 1M' },
  ];

  const ratioOpts = [
    { value:0,   label:'Tất cả' }, { value:0.5, label:'0.5x+' },
    { value:1,   label:'1x+ (Tốt)' }, { value:3, label:'3x+ (Rất tốt)' },
    { value:5,   label:'5x+ (Xuất sắc)' },
  ];

  return (
    <div>
      {/* ── Niche Competition Panel ── */}
      {comp && (
        <div style={{
          background:'var(--bg-secondary)', borderRadius:8, padding:'12px 16px',
          marginBottom:10, border:'1px solid var(--glass-border)',
          display:'flex', flexWrap:'wrap', gap:16, alignItems:'center',
        }}>
          <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>
            📊 Phân tích độ cạnh tranh
          </div>

          {/* Difficulty badge */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Độ khó:</span>
            <span style={{ fontWeight:700, color: comp.diffColor, fontSize:'0.9rem' }}>{comp.difficulty}</span>
          </div>

          {/* Channel size breakdown */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.75rem', background:'rgba(255,23,68,0.1)', color:'var(--red)', padding:'2px 8px', borderRadius:10 }}>
              🏆 Lớn (&gt; 500K): {comp.big}
            </span>
            <span style={{ fontSize:'0.75rem', background:'rgba(255,145,0,0.1)', color:'var(--orange)', padding:'2px 8px', borderRadius:10 }}>
              📈 Vừa: {comp.medium}
            </span>
            <span style={{ fontSize:'0.75rem', background:'rgba(0,230,118,0.1)', color:'var(--green)', padding:'2px 8px', borderRadius:10 }}>
              🌱 Nhỏ (≤100K): {comp.small}
            </span>
          </div>

          {/* Avg stats */}
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginLeft:'auto' }}>
            Sub TB: <strong style={{ color:'var(--text)' }}>{formatNum(Math.round(comp.avgSubs))}</strong>
            &nbsp;·&nbsp;
            Ratio TB: <strong style={{ color: comp.avgRatio >= 1 ? 'var(--green)' : 'var(--text)' }}>{comp.avgRatio.toFixed(1)}x</strong>
          </div>
        </div>
      )}

      {/* ── Quick Presets ── */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', alignSelf:'center' }}>Preset nhanh:</span>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key}
            className={`btn ${preset === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding:'4px 12px', fontSize:'0.78rem' }}
            onClick={() => applyPreset(key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'12px 14px', marginBottom:12, border:'1px solid var(--glass-border)' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>

          <div className="filter-group" style={{ flex:'2 1 160px', minWidth:0 }}>
            <label>🔍 Tìm tên kênh</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nhập tên kênh..."
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:6, color:'var(--text)', padding:'8px 12px', fontSize:'0.83rem', width:'100%' }} />
          </div>

          <div className="filter-group" style={{ flex:'1 1 130px', minWidth:0 }}>
            <label>👥 Sub tối thiểu</label>
            <CustomSelect value={minSubs} onChange={setMinSubs} options={subsOpts} placeholder="Không giới hạn" />
          </div>

          <div className="filter-group" style={{ flex:'1 1 130px', minWidth:0 }}>
            <label>👥 Sub tối đa</label>
            <CustomSelect value={maxSubs} onChange={setMaxSubs} options={maxSubsOpts} placeholder="Không giới hạn" />
          </div>

          <div className="filter-group" style={{ flex:'1 1 130px', minWidth:0 }}>
            <label>⭐ Fit Score tối thiểu</label>
            <CustomSelect value={minScore} onChange={setMinScore} options={scoreOpts} placeholder="Tất cả" />
          </div>

          <div className="filter-group" style={{ flex:'1 1 130px', minWidth:0 }}>
            <label>📈 View/Sub tối thiểu</label>
            <CustomSelect value={minRatio} onChange={setMinRatio} options={ratioOpts} placeholder="Tất cả" />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:6, paddingBottom:4, flexShrink:0 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', color:'var(--text-secondary)', cursor:'pointer', whiteSpace:'nowrap' }}>
              <input type="checkbox" checked={hideRisky} onChange={e => setHideRisky(e.target.checked)} />
              Ẩn kênh rủi ro
            </label>
          </div>

          {activeFilters > 0 && (
            <button className="btn btn-secondary" style={{ padding:'6px 14px', fontSize:'0.78rem', flexShrink:0 }} onClick={resetAll}>
              ✕ Reset ({activeFilters})
            </button>
          )}

          <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--text-muted)', paddingBottom:4, whiteSpace:'nowrap' }}>
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
            {sorted.map(ch => {
              const subSize = ch.subscriberCount > 500000 ? 'big' : ch.subscriberCount > 100000 ? 'medium' : 'small';
              const subColor = subSize === 'big' ? 'var(--red)' : subSize === 'medium' ? 'var(--orange)' : 'var(--green)';
              return (
                <tr key={ch.channelId} style={{ opacity: ch.isRisky ? 0.5 : 1 }}>
                  <td>
                    <a href={ch.channelUrl} target="_blank" rel="noreferrer"
                      style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>
                      {ch.channelTitle}
                    </a>
                    {ch.isSmallOpportunity && (
                      <span style={{ marginLeft:6, fontSize:'0.7rem', color:'var(--green)' }}>🎯</span>
                    )}
                  </td>
                  <td style={{ color: subColor, fontWeight:600 }}>{formatNum(ch.subscriberCount)}</td>
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
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:10 }}>
        ⚠️ Các kênh trên chỉ để học cấu trúc tiêu đề và cách triển khai chủ đề. Không copy hoặc reup nội dung.
      </p>
    </div>
  );
}
