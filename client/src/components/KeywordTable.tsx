import React, { useState, useMemo, useEffect, type ReactNode } from 'react';
import type { Keyword, KeywordFilters } from '../types';
import { scoreBadgeClass, recBadgeClass, formatNum } from './utils.ts';
import { getFreshness, getFreshnessColor } from '../engine/dataMetadata.js';
import type { UseBulkAnalyzeReturn } from '../hooks/useBulkAnalyze.ts';
import type { UseCompareReturn } from '../hooks/useCompare.ts';
import BulkAnalyzeModal from './BulkAnalyzeModal.tsx';
import CompareModal from './CompareModal.tsx';
import { NoResultsFilterEmptyState } from './EmptyState.tsx';
import { usePersistentState } from '../hooks/usePersistentState.ts';
import { wsKey } from '../engine/storageKeys.ts';

const PAGE_SIZE = 50;

interface ColDef { key: string; label: string; fixed?: boolean; yt?: boolean; }
const COLS: ColDef[] = [
  { key: 'keyword',         label: 'Keyword JP',      fixed: true  },
  { key: 'vi',              label: 'Nghĩa VN',        fixed: true  },
  { key: 'niche',           label: 'Niche',           fixed: true  },
  { key: 'level',           label: 'Cấp độ',          fixed: true  },
  { key: 'longFormScore',   label: 'LF Score',        fixed: true  },
  { key: 'recommendation',  label: 'Đề xuất',         fixed: true  },
  { key: 'demand',          label: 'Demand',          fixed: false },
  { key: 'searchIntent',    label: 'Search Intent',   fixed: false },
  { key: 'topicDepth',      label: 'Topic Depth',     fixed: false },
  { key: 'smallChannel',    label: 'Small Ch.',       fixed: false },
  { key: 'evergreen',       label: 'Evergreen',       fixed: false },
  { key: 'seriesPotential', label: 'Series',          fixed: false },
  { key: 'longTailExp',     label: 'Long-tail',       fixed: false },
  { key: 'lowRisk',         label: 'Low Risk',        fixed: false },
  { key: 'longVideosFound', label: 'YT Long Videos',  yt: true },
  { key: 'avgViews',        label: 'Avg Views YT',    yt: true },
  { key: 'bestRatio',       label: 'Best Ratio',      yt: true },
  { key: 'smallOpp',        label: 'Kênh nhỏ cơ hội', yt: true },
  { key: 'freshness',       label: 'Freshness',       yt: true },
  { key: 'confidence',      label: 'Confidence',      yt: true },
  { key: 'collectedAt',     label: 'Cập nhật lúc',    yt: true },
  { key: 'reason',          label: 'Lý do',           fixed: false },
];

interface KeywordTableProps {
  keywords: Keyword[];
  filters: KeywordFilters;
  onSelectKeyword: (kw: Keyword) => void;
  onAnalyzeKeyword: (kw: string) => void;
  bulk?: UseBulkAnalyzeReturn;
  compare?: UseCompareReturn;
  trendBadges?: Record<string, string | null>;
  workspaceId?: string | null;
}

export default function KeywordTable({ keywords, filters, onSelectKeyword, onAnalyzeKeyword, bulk, compare, trendBadges, workspaceId }: KeywordTableProps) {
  const sortColKey = wsKey('sort_col', workspaceId);
  const sortDirKey = wsKey('sort_dir', workspaceId);

  const [sortCol, setSortCol] = usePersistentState(sortColKey, 'longFormScore');
  const [sortDir, setSortDir] = usePersistentState<'asc'|'desc'>(sortDirKey, 'desc');

  // One-time migration of global sort prefs into workspace-scoped key
  useEffect(() => {
    const migKey = wsKey('sort_migrated', workspaceId);
    if (localStorage.getItem(migKey)) return;
    const oldCol = localStorage.getItem('ytlf_sort_col');
    const oldDir = localStorage.getItem('ytlf_sort_dir');
    if (oldCol) try { localStorage.setItem(sortColKey, oldCol); } catch {}
    if (oldDir) try { localStorage.setItem(sortDirKey, oldDir); } catch {}
    localStorage.setItem(migKey, '1');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const [page,            setPage]            = useState(1);
  const [selected,        setSelected]        = useState<Set<string>>(new Set());
  const [showBulkModal,   setShowBulkModal]   = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== 0);

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let f = [...keywords];
    if (filters.minScore > 0)    f = f.filter(k => k.longFormScore >= filters.minScore);
    if (filters.niche)           f = f.filter(k => k.niche === filters.niche);
    if (filters.level)           f = f.filter(k => k.level === filters.level);
    if (filters.intent === 'high') f = f.filter(k => k.searchIntent >= 10);
    if (filters.intent === 'med')  f = f.filter(k => k.searchIntent >= 5 && k.searchIntent < 10);
    if (filters.evergreen === 'high') f = f.filter(k => k.evergreen >= 7);
    if (filters.evergreen === 'low')  f = f.filter(k => k.evergreen < 5);
    if (filters.risk === 'safe')  f = f.filter(k => k.lowRisk === 5);
    if (filters.risk === 'risky') f = f.filter(k => k.lowRisk < 3);
    if (filters.rec) f = f.filter(k => k.recommendation === filters.rec);

    f.sort((a, b) => {
      let va: unknown, vb: unknown;
      if (sortCol === 'longVideosFound') { va = a.apiData?.longVideosFound ?? 0; vb = b.apiData?.longVideosFound ?? 0; }
      else if (sortCol === 'avgViews')   { va = a.apiData?.avgLongVideoViews ?? 0; vb = b.apiData?.avgLongVideoViews ?? 0; }
      else if (sortCol === 'bestRatio')  { va = a.apiData?.bestViewSubRatio ?? 0; vb = b.apiData?.bestViewSubRatio ?? 0; }
      else { va = (a as unknown as Record<string, unknown>)[sortCol]; vb = (b as unknown as Record<string, unknown>)[sortCol]; }
      const sva = typeof va === 'string' ? va.toLowerCase() : va;
      const svb = typeof vb === 'string' ? vb.toLowerCase() : (vb ?? '');
      if (sva! < svb!) return sortDir === 'asc' ? -1 : 1;
      if (sva! > svb!) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return f;
  }, [keywords, filters, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageKeywords    = pageData.map(k => k.keyword);
  const allPageSelected = pageKeywords.length > 0 && pageKeywords.every(kw => selected.has(kw));

  function toggleSelectAll() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) pageKeywords.forEach(kw => next.delete(kw));
      else pageKeywords.forEach(kw => next.add(kw));
      return next;
    });
  }
  function toggleSelect(kw: string, e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();
    setSelected(prev => { const next = new Set(prev); if (next.has(kw)) next.delete(kw); else next.add(kw); return next; });
  }
  function handleBulkAnalyze() {
    if (!bulk) return;
    bulk.start([...selected].slice(0, 50));
    setShowBulkModal(true);
  }
  function handleClearSelection() { setSelected(new Set()); }

  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function preloadDetailTabs() {
    if (!canHover) return;
    import('./SeoTab.tsx').catch(() => null);
    import('./MonetizationTab.tsx').catch(() => null);
    import('./ThumbnailTab.tsx').catch(() => null);
  }

  function renderCell(kw: Keyword, col: ColDef): ReactNode {
    const api  = kw.apiData;
    const meta = kw.metadata;
    switch (col.key) {
      case 'keyword':
        return <td key={col.key} className="jp-text cursor-pointer font-semibold" onClick={() => onSelectKeyword(kw)}>{kw.keyword}</td>;
      case 'recommendation':
        return <td key={col.key}><span className={`rec-badge ${recBadgeClass(kw.recommendation)}`}>{kw.recommendation}</span></td>;
      case 'longFormScore':
        return <td key={col.key}><span className={`score-badge ${scoreBadgeClass(kw.longFormScore)}`}>{kw.longFormScore}</span></td>;
      case 'longVideosFound':
        return <td key={col.key} style={{ color: (api?.longVideosFound ?? 0) > 0 ? '#00e676' : '#5c6480' }}>{api?.longVideosFound ?? '—'}</td>;
      case 'avgViews':
        return <td key={col.key}>{api?.avgLongVideoViews ? formatNum(api.avgLongVideoViews) : '—'}</td>;
      case 'bestRatio':
        return <td key={col.key} className="text-accent">{api?.bestViewSubRatio ? api.bestViewSubRatio.toFixed(1) + 'x' : '—'}</td>;
      case 'smallOpp':
        return <td key={col.key}>{api?.hasSmallChannelOpportunity ? '✅' : (api?.longVideosFound ?? 0) > 0 ? '—' : ''}</td>;
      case 'freshness': {
        const fr = meta?.freshnessStatus || (meta?.collectedAt ? getFreshness(meta.collectedAt) : '—');
        return <td key={col.key} className="text-[0.72rem]" style={{ color: getFreshnessColor(fr as Parameters<typeof getFreshnessColor>[0]) }}>{fr}</td>;
      }
      case 'confidence':
        return <td key={col.key} className="text-[0.72rem] text-text-muted">{meta?.confidenceLevel || '—'}</td>;
      case 'collectedAt': {
        const ts = meta?.collectedAt;
        if (!ts) return <td key={col.key} className="text-[0.72rem] text-text-muted">—</td>;
        const d = new Date(ts);
        const label = `${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        return <td key={col.key} className="text-[0.72rem] text-text-muted whitespace-nowrap" title={d.toLocaleString('vi-VN')}>{label}</td>;
      }
      case 'reason':
        return <td key={col.key} className="text-[0.75rem] text-text-secondary truncate max-w-[200px]">{kw.reason}</td>;
      default:
        return <td key={col.key}>{(kw as unknown as Record<string, unknown>)[col.key] as ReactNode ?? '—'}</td>;
    }
  }

  return (
    <>
      <section className="card relative">
        <div className="flex justify-between items-center mb-3">
          <h2 className="m-0">
            <span className="icon">📋</span> Bảng Keyword Long-Form
            <span className="text-[0.8rem] text-text-muted font-normal ml-2">({filtered.length} kết quả)</span>
          </h2>
          {selected.size > 0 && (
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={handleClearSelection}>
              ✕ Bỏ chọn
            </button>
          )}
        </div>

        <div className="table-wrapper">
          <table>
            <colgroup>
              <col style={{ width: 36 }} />
              {compare && <col style={{ width: 50 }} />}
              {COLS.map(c => <col key={c.key} />)}
            </colgroup>
            <thead>
              <tr>
                <th className="text-center px-2" style={{ background: 'rgba(0,229,255,0.04)' }}>
                  <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll}
                    title="Chọn tất cả trang này"
                    style={{ cursor: 'pointer', accentColor: '#00e5ff', width: 14, height: 14 }} />
                </th>
                {compare && (
                  <th className="text-center text-[0.7rem] whitespace-nowrap px-1"
                    style={{ color: '#6366f1', background: 'rgba(99,102,241,0.06)' }}>🔍</th>
                )}
                {COLS.map(c => (
                  <th key={c.key} onClick={() => handleSort(c.key)}
                    className={sortCol === c.key ? `sorted-${sortDir}` : ''}
                    style={c.yt ? { background: 'rgba(255,0,0,0.06)' } : {}}>
                    {c.label}
                  </th>
                ))}
                <th className="text-center text-[0.7rem] whitespace-nowrap px-2"
                  style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.06)' }}>Trend</th>
                <th style={{ background: 'rgba(0,229,255,0.06)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(kw => (
                <tr key={kw.keyword} onClick={() => onSelectKeyword(kw)} onMouseEnter={preloadDetailTabs}
                  style={{ cursor: 'pointer', background: selected.has(kw.keyword) ? 'rgba(0,229,255,0.04)' : undefined }}>
                  {/* Bulk checkbox */}
                  <td className="text-center px-2" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(kw.keyword)} onChange={e => toggleSelect(kw.keyword, e)}
                      style={{ cursor: 'pointer', accentColor: '#00e5ff', width: 14, height: 14 }} />
                  </td>
                  {/* Compare checkbox */}
                  {compare && (
                    <td className="text-center px-1.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox"
                        checked={compare.isSelected(kw.keyword)}
                        onChange={() => compare.toggle(kw.keyword)}
                        disabled={!compare.isSelected(kw.keyword) && !compare.canAddMore}
                        title={!compare.canAddMore && !compare.isSelected(kw.keyword) ? 'Tối đa 4 keyword' : 'Thêm vào so sánh'}
                        style={{ accentColor: '#6366f1', width: 14, height: 14, cursor: (compare.isSelected(kw.keyword) || compare.canAddMore) ? 'pointer' : 'not-allowed' }} />
                    </td>
                  )}
                  {COLS.map(c => renderCell(kw, c))}
                  {/* Trend */}
                  <td className="text-center px-2" onClick={e => e.stopPropagation()}>
                    {trendBadges
                      ? <span title="Trend" className="text-[1.1rem]">{trendBadges[kw.keyword] ?? ''}</span>
                      : kw.metadata?.freshnessStatus === 'Old'
                        ? <span title="Data cũ" className="text-[0.75rem] text-text-muted">📉?</span>
                        : null}
                  </td>
                  <td onClick={e => { e.stopPropagation(); onAnalyzeKeyword(kw.keyword); }}>
                    <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>▶️ Phân tích</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && hasActiveFilters && (
          <NoResultsFilterEmptyState onReset={() => document.dispatchEvent(new CustomEvent('ytlf:reset-filters'))} />
        )}

        {totalPages > 1 && (
          <div className="pagination">
            {safePage > 1 && <button className="page-btn" onClick={() => setPage(safePage - 1)}>‹</button>}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i-1] !== p-1 && <span className="text-text-muted">…</span>}
                  <button className={`page-btn ${p === safePage ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                </React.Fragment>
              ))}
            {safePage < totalPages && <button className="page-btn" onClick={() => setPage(safePage + 1)}>›</button>}
          </div>
        )}
      </section>

      {/* Compare sticky toolbar */}
      {compare && compare.count >= 2 && (
        <div className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full animate-fade-in-up"
          style={{
            bottom: selected.size > 0 ? 88 : 24,
            background: '#0d1425',
            border: '1px solid #6366f1',
            boxShadow: '0 8px 40px rgba(99,102,241,0.25)',
            zIndex: 401,
          }}>
          <span className="text-[0.85rem] font-semibold" style={{ color: '#6366f1' }}>🔍 So sánh ({compare.count})</span>
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <button className="btn btn-primary rounded-full" style={{ padding: '6px 16px', fontSize: '0.82rem', background: '#6366f1', border: 'none' }}
            onClick={() => setShowCompareModal(true)}>Mở so sánh</button>
          <button className="btn btn-secondary rounded-full" style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            onClick={compare.clear}>✕</button>
        </div>
      )}

      {/* Bulk sticky toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full animate-fade-in-up"
          style={{
            background: '#0d1425',
            border: '1px solid #00e5ff',
            boxShadow: '0 8px 40px rgba(0,229,255,0.2)',
            zIndex: 400,
          }}>
          <span className="text-[0.85rem] font-semibold text-accent">✓ Đã chọn {selected.size} keyword</span>
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          {bulk && (
            <button className="btn btn-primary rounded-full" style={{ padding: '6px 16px', fontSize: '0.82rem' }}
              onClick={handleBulkAnalyze}>📊 Phân tích YouTube</button>
          )}
          <button className="btn btn-secondary rounded-full" style={{ padding: '6px 14px', fontSize: '0.82rem', color: '#ff1744' }}
            onClick={handleClearSelection}>✕</button>
        </div>
      )}

      {showBulkModal   && bulk    && <BulkAnalyzeModal bulk={bulk} onClose={() => setShowBulkModal(false)} />}
      {showCompareModal && compare && compare.count >= 2 && (
        <CompareModal keywords={keywords.filter(k => compare.compareIds.includes(k.keyword))} onClose={() => setShowCompareModal(false)} />
      )}
    </>
  );
}
