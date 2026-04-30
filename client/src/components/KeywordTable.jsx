import React, { useState, useMemo } from 'react';
import { scoreBadgeClass, recBadgeClass, formatNum } from './utils.js';
import { getFreshness, getFreshnessColor } from '../engine/dataMetadata.js';

const PAGE_SIZE = 50;

const COLS = [
  { key: 'keyword',        label: 'Keyword JP',      fixed: true },
  { key: 'vi',             label: 'Nghĩa VN',        fixed: true },
  { key: 'niche',          label: 'Niche',           fixed: true },
  { key: 'level',          label: 'Cấp độ',          fixed: true },
  { key: 'longFormScore',  label: 'LF Score',        fixed: true },
  { key: 'recommendation', label: 'Đề xuất',         fixed: true },
  { key: 'demand',         label: 'Demand',          fixed: false },
  { key: 'searchIntent',   label: 'Search Intent',   fixed: false },
  { key: 'topicDepth',     label: 'Topic Depth',     fixed: false },
  { key: 'smallChannel',   label: 'Small Ch.',       fixed: false },
  { key: 'evergreen',      label: 'Evergreen',       fixed: false },
  { key: 'seriesPotential',label: 'Series',          fixed: false },
  { key: 'longTailExp',    label: 'Long-tail',       fixed: false },
  { key: 'lowRisk',        label: 'Low Risk',        fixed: false },
  { key: 'longVideosFound',label: 'YT Long Videos',  yt: true },
  { key: 'avgViews',       label: 'Avg Views YT',    yt: true },
  { key: 'bestRatio',      label: 'Best Ratio',      yt: true },
  { key: 'smallOpp',       label: 'Kênh nhỏ cơ hội',yt: true },
  { key: 'freshness',      label: 'Freshness',       yt: true },
  { key: 'confidence',     label: 'Confidence',      yt: true },
  { key: 'reason',         label: 'Lý do',           fixed: false },
];

export default function KeywordTable({ keywords, filters, onSelectKeyword, onAnalyzeKeyword }) {
  const [sortCol, setSortCol] = useState('longFormScore');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let f = [...keywords];
    if (filters.minScore > 0) f = f.filter(k => k.longFormScore >= filters.minScore);
    if (filters.niche) f = f.filter(k => k.niche === filters.niche);
    if (filters.level) f = f.filter(k => k.level === filters.level);
    if (filters.intent === 'high') f = f.filter(k => k.searchIntent >= 10);
    if (filters.intent === 'med') f = f.filter(k => k.searchIntent >= 5 && k.searchIntent < 10);
    if (filters.evergreen === 'high') f = f.filter(k => k.evergreen >= 7);
    if (filters.evergreen === 'low') f = f.filter(k => k.evergreen < 5);
    if (filters.risk === 'safe') f = f.filter(k => k.lowRisk === 5);
    if (filters.risk === 'risky') f = f.filter(k => k.lowRisk < 3);
    if (filters.rec) f = f.filter(k => k.recommendation === filters.rec);

    f.sort((a, b) => {
      let va, vb;
      // Virtual columns from apiData
      if (sortCol === 'longVideosFound') { va = a.apiData?.longVideosFound ?? 0; vb = b.apiData?.longVideosFound ?? 0; }
      else if (sortCol === 'avgViews') { va = a.apiData?.avgLongVideoViews ?? 0; vb = b.apiData?.avgLongVideoViews ?? 0; }
      else if (sortCol === 'bestRatio') { va = a.apiData?.bestViewSubRatio ?? 0; vb = b.apiData?.bestViewSubRatio ?? 0; }
      else { va = a[sortCol]; vb = b[sortCol]; }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return f;
  }, [keywords, filters, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function renderCell(kw, col) {
    const api = kw.apiData || {};
    const meta = kw.metadata || {};
    switch (col.key) {
      case 'keyword':        return <td key={col.key} className="jp-text" onClick={() => onSelectKeyword(kw)} style={{ cursor:'pointer', fontWeight:600 }}>{kw.keyword}</td>;
      case 'recommendation': return <td key={col.key}><span className={`rec-badge ${recBadgeClass(kw.recommendation)}`}>{kw.recommendation}</span></td>;
      case 'longFormScore':  return <td key={col.key}><span className={`score-badge ${scoreBadgeClass(kw.longFormScore)}`}>{kw.longFormScore}</span></td>;
      case 'longVideosFound':return <td key={col.key} style={{ color: api.longVideosFound > 0 ? 'var(--green)' : 'var(--text-muted)' }}>{api.longVideosFound ?? '—'}</td>;
      case 'avgViews':       return <td key={col.key}>{api.avgLongVideoViews ? formatNum(api.avgLongVideoViews) : '—'}</td>;
      case 'bestRatio':      return <td key={col.key} style={{ color: 'var(--accent)' }}>{api.bestViewSubRatio ? api.bestViewSubRatio.toFixed(1) + 'x' : '—'}</td>;
      case 'smallOpp':       return <td key={col.key}>{api.hasSmallChannelOpportunity ? '✅' : api.longVideosFound > 0 ? '—' : ''}</td>;
      case 'freshness': {
        const fr = meta.freshnessStatus || (meta.collectedAt ? getFreshness(meta.collectedAt) : '—');
        return <td key={col.key} style={{ color: getFreshnessColor(fr), fontSize: '0.72rem' }}>{fr}</td>;
      }
      case 'confidence':     return <td key={col.key} style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{meta.confidenceLevel || '—'}</td>;
      case 'reason':         return <td key={col.key} style={{ maxWidth: 200, fontSize: '0.75rem', color: 'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{kw.reason}</td>;
      default:               return <td key={col.key}>{kw[col.key] ?? '—'}</td>;
    }
  }

  return (
    <section className="card">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h2 style={{ margin:0 }}>
          <span className="icon">📋</span> Bảng Keyword Long-Form
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>({filtered.length} kết quả)</span>
        </h2>
      </div>
      <div className="table-wrapper">
        <table>
          <colgroup>{COLS.map(c => <col key={c.key} />)}</colgroup>
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key}
                  onClick={() => handleSort(c.key)}
                  className={sortCol === c.key ? `sorted-${sortDir}` : ''}
                  style={c.yt ? { background: 'rgba(255,0,0,0.06)' } : {}}
                >
                  {c.label}
                </th>
              ))}
              <th style={{ background: 'rgba(0,229,255,0.06)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map(kw => (
              <tr key={kw.keyword} onClick={() => onSelectKeyword(kw)} style={{ cursor:'pointer' }}>
                {COLS.map(c => renderCell(kw, c))}
                <td onClick={e => { e.stopPropagation(); onAnalyzeKeyword(kw.keyword); }}>
                  <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                    ▶️ Phân tích
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          {safePage > 1 && <button className="page-btn" onClick={() => setPage(safePage - 1)}>‹</button>}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages)
            .map((p, i, arr) => (
              <React.Fragment key={p}>
                {i > 0 && arr[i-1] !== p - 1 && <span style={{ color: 'var(--text-muted)' }}>…</span>}
                <button className={`page-btn ${p === safePage ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              </React.Fragment>
            ))}
          {safePage < totalPages && <button className="page-btn" onClick={() => setPage(safePage + 1)}>›</button>}
        </div>
      )}
    </section>
  );
}
