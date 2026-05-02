import React, { useState, useMemo } from 'react';
import type { RefChannel } from '../types';
import { formatNum } from './utils.js';
import CustomSelect from './CustomSelect.js';

interface Preset { label: string; minSubs: number; maxSubs: number; minRatio: number; }
const PRESETS: Record<string, Preset> = {
  none:      { label: 'Không áp dụng',     minSubs: 0,     maxSubs: 0,       minRatio: 0 },
  micro:     { label: '🌱 Micro (<10K)',    minSubs: 0,     maxSubs: 10000,   minRatio: 0.5 },
  sweetspot: { label: '🎯 Sweet Spot',      minSubs: 10000, maxSubs: 500000,  minRatio: 1 },
  medium:    { label: '📈 Tầm trung',       minSubs: 50000, maxSubs: 1000000, minRatio: 1 },
  any_ratio: { label: '🔥 Ratio cao (≥3x)', minSubs: 0,     maxSubs: 0,       minRatio: 3 },
};

function analyzeCompetition(channels: RefChannel[]) {
  if (!channels.length) return null;
  const big    = channels.filter(c => c.subscriberCount > 500000).length;
  const medium = channels.filter(c => c.subscriberCount > 100000 && c.subscriberCount <= 500000).length;
  const small  = channels.filter(c => c.subscriberCount <= 100000).length;
  const avgSubs  = channels.reduce((s, c) => s + c.subscriberCount, 0) / channels.length;
  const avgRatio = channels.reduce((s, c) => s + (c.bestViewSubRatio || 0), 0) / channels.length;
  const difficulty = big > channels.length * 0.5 ? 'Rất khó' : big > channels.length * 0.3 ? 'Khó' : medium > channels.length * 0.5 ? 'Trung bình' : 'Dễ';
  const diffColor  = difficulty === 'Rất khó' ? '#ff1744' : difficulty === 'Khó' ? '#ff9100' : difficulty === 'Trung bình' ? '#ffea00' : '#00e676';
  return { big, medium, small, total: channels.length, avgSubs, avgRatio, difficulty, diffColor };
}

interface RefChannelTableProps {
  channels: RefChannel[];
  onTrack?: (ch: { channelId: string; channelTitle: string; channelUrl: string; subscriberCount: number }) => void;
  trackedIds?: string[];
}

export default function RefChannelTable({ channels, onTrack, trackedIds = [] }: RefChannelTableProps) {
  const [sortCol,   setSortCol]   = useState('fitScore');
  const [sortDir,   setSortDir]   = useState<'asc'|'desc'>('desc');
  const [hideRisky, setHideRisky] = useState(true);
  const [preset,    setPreset]    = useState('none');
  const [maxSubs,   setMaxSubs]   = useState(0);
  const [minSubs,   setMinSubs]   = useState(0);
  const [minScore,  setMinScore]  = useState(0);
  const [minRatio,  setMinRatio]  = useState(0);
  const [search,    setSearch]    = useState('');

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }
  function applyPreset(key: string) {
    setPreset(key);
    const p = PRESETS[key];
    setMinSubs(p.minSubs); setMaxSubs(p.maxSubs); setMinRatio(p.minRatio);
  }
  function resetAll() {
    setPreset('none'); setMinSubs(0); setMaxSubs(0); setMinScore(0); setMinRatio(0); setSearch(''); setHideRisky(true);
  }

  const comp   = useMemo(() => analyzeCompetition(channels), [channels]);
  const sorted = useMemo(() => {
    let f = [...channels];
    if (hideRisky)    f = f.filter(c => !c.isRisky);
    if (minSubs > 0)  f = f.filter(c => c.subscriberCount >= minSubs);
    if (maxSubs > 0)  f = f.filter(c => c.subscriberCount <= maxSubs);
    if (minScore > 0) f = f.filter(c => c.fitScore >= minScore);
    if (minRatio > 0) f = f.filter(c => c.bestViewSubRatio >= minRatio);
    if (search.trim()) { const q = search.trim().toLowerCase(); f = f.filter(c => c.channelTitle?.toLowerCase().includes(q)); }
    f.sort((a, b) => {
      const va = (a as unknown as Record<string,unknown>)[sortCol] ?? 0;
      const vb = (b as unknown as Record<string,unknown>)[sortCol] ?? 0;
      const sva = typeof va === 'string' ? va.toLowerCase() : va;
      const svb = typeof vb === 'string' ? vb.toLowerCase() : vb;
      if (sva < svb) return sortDir === 'asc' ? -1 : 1;
      if (sva > svb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return f;
  }, [channels, hideRisky, minSubs, maxSubs, minScore, minRatio, search, sortCol, sortDir]);

  const activeFilters = [hideRisky, minSubs > 0, maxSubs > 0, minScore > 0, minRatio > 0, search.trim()].filter(Boolean).length;

  if (!channels.length) return (
    <div className="text-center py-10 text-text-muted">Chưa có kênh tham khảo. Hãy phân tích keyword bằng YouTube API.</div>
  );

  const COLS = [
    { key: 'channelTitle',     label: 'Tên Kênh'        },
    { key: 'subscriberCount',  label: 'Subscribers'      },
    { key: 'viewCount',        label: 'Tổng Views'       },
    { key: 'videoCount',       label: 'Số Video'         },
    { key: 'relatedLongVideos',label: 'Long Videos'      },
    { key: 'bestVideoViews',   label: 'Best Video Views' },
    { key: 'bestViewSubRatio', label: 'Best View/Sub'    },
    { key: 'fitScore',         label: 'Fit Score'        },
    { key: 'recommendation',   label: 'Đề xuất'          },
    { key: 'reason',           label: 'Lý do'            },
  ];

  const scoreOpts   = [{ value: 0, label: 'Tất cả' }, { value: 50, label: '50+ (Tốt)' }, { value: 70, label: '70+ (Rất tốt)' }, { value: 85, label: '85+ (Xuất sắc)' }];
  const subsOpts    = [{ value: 0, label: 'Không giới hạn' }, { value: 1000, label: '1K+' }, { value: 10000, label: '10K+' }, { value: 50000, label: '50K+' }, { value: 100000, label: '100K+' }];
  const maxSubsOpts = [{ value: 0, label: 'Không giới hạn' }, { value: 10000, label: '≤ 10K (Micro)' }, { value: 50000, label: '≤ 50K (Nhỏ)' }, { value: 100000, label: '≤ 100K (Vừa)' }, { value: 500000, label: '≤ 500K (Lớn)' }, { value: 1000000, label: '≤ 1M' }];
  const ratioOpts   = [{ value: 0, label: 'Tất cả' }, { value: 0.5, label: '0.5x+' }, { value: 1, label: '1x+ (Tốt)' }, { value: 3, label: '3x+ (Rất tốt)' }, { value: 5, label: '5x+ (Xuất sắc)' }];

  return (
    <div>
      {/* Competition Panel */}
      {comp && (
        <div className="rounded-lg px-4 py-3 mb-2.5 flex flex-wrap gap-4 items-center"
          style={{ background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[0.78rem] text-text-muted font-semibold uppercase tracking-wide">📊 Phân tích độ cạnh tranh</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.75rem] text-text-muted">Độ khó:</span>
            <span className="font-bold text-[0.9rem]" style={{ color: comp.diffColor }}>{comp.difficulty}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[0.75rem] px-2 py-0.5 rounded-[10px]" style={{ background: 'rgba(255,23,68,0.1)', color: '#ff1744' }}>🏆 Lớn (&gt;500K): {comp.big}</span>
            <span className="text-[0.75rem] px-2 py-0.5 rounded-[10px]" style={{ background: 'rgba(255,145,0,0.1)', color: '#ff9100' }}>📈 Vừa: {comp.medium}</span>
            <span className="text-[0.75rem] px-2 py-0.5 rounded-[10px]" style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676' }}>🌱 Nhỏ (≤100K): {comp.small}</span>
          </div>
          <div className="text-[0.75rem] text-text-muted ml-auto">
            Sub TB: <strong className="text-white">{formatNum(Math.round(comp.avgSubs))}</strong>
            &nbsp;·&nbsp;
            Ratio TB: <strong style={{ color: comp.avgRatio >= 1 ? '#00e676' : '#e8eaf6' }}>{comp.avgRatio.toFixed(1)}x</strong>
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="flex gap-1.5 flex-wrap mb-2.5">
        <span className="text-[0.75rem] text-text-muted self-center">Preset nhanh:</span>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} className={`btn ${preset === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={() => applyPreset(key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg px-3.5 py-3 mb-3" style={{ background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex gap-2.5 flex-wrap items-end">
          <div className="filter-group min-w-0" style={{ flex: '2 1 160px' }}>
            <label>🔍 Tìm tên kênh</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nhập tên kênh..." className="field-input text-[0.83rem]" />
          </div>
          <div className="filter-group min-w-0" style={{ flex: '1 1 130px' }}>
            <label>👥 Sub tối thiểu</label>
            <CustomSelect value={minSubs} onChange={v => setMinSubs(Number(v ?? 0))} options={subsOpts} placeholder="Không giới hạn" />
          </div>
          <div className="filter-group min-w-0" style={{ flex: '1 1 130px' }}>
            <label>👥 Sub tối đa</label>
            <CustomSelect value={maxSubs} onChange={v => setMaxSubs(Number(v ?? 0))} options={maxSubsOpts} placeholder="Không giới hạn" />
          </div>
          <div className="filter-group min-w-0" style={{ flex: '1 1 130px' }}>
            <label>⭐ Fit Score tối thiểu</label>
            <CustomSelect value={minScore} onChange={v => setMinScore(Number(v ?? 0))} options={scoreOpts} placeholder="Tất cả" />
          </div>
          <div className="filter-group min-w-0" style={{ flex: '1 1 130px' }}>
            <label>📈 View/Sub tối thiểu</label>
            <CustomSelect value={minRatio} onChange={v => setMinRatio(Number(v ?? 0))} options={ratioOpts} placeholder="Tất cả" />
          </div>
          <div className="flex flex-col gap-1.5 pb-1 shrink-0">
            <label className="flex items-center gap-1.5 text-[0.82rem] text-text-secondary cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={hideRisky} onChange={e => setHideRisky(e.target.checked)} />
              Ẩn kênh rủi ro
            </label>
          </div>
          {activeFilters > 0 && (
            <button className="btn btn-secondary shrink-0" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={resetAll}>
              ✕ Reset ({activeFilters})
            </button>
          )}
          <span className="ml-auto text-[0.8rem] text-text-muted pb-1 whitespace-nowrap">{sorted.length} / {channels.length} kênh</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)} className={sortCol === c.key ? `sorted-${sortDir}` : ''}>{c.label}</th>
              ))}
              {onTrack && <th className="text-center whitespace-nowrap" style={{ background: 'rgba(99,102,241,0.06)' }}>Track</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map(ch => {
              const subSize  = ch.subscriberCount > 500000 ? 'big' : ch.subscriberCount > 100000 ? 'medium' : 'small';
              const subColor = subSize === 'big' ? '#ff1744' : subSize === 'medium' ? '#ff9100' : '#00e676';
              return (
                <tr key={ch.channelId} style={{ opacity: ch.isRisky ? 0.5 : 1 }}>
                  <td>
                    <a href={ch.channelUrl} target="_blank" rel="noreferrer" className="text-accent no-underline font-semibold">{ch.channelTitle}</a>
                    {ch.isSmallOpportunity && <span className="ml-1.5 text-[0.7rem] text-green-400">🎯</span>}
                  </td>
                  <td className="font-semibold" style={{ color: subColor }}>{formatNum(ch.subscriberCount)}</td>
                  <td>{formatNum(ch.viewCount)}</td>
                  <td>{formatNum(ch.videoCount)}</td>
                  <td className="text-center text-accent">{ch.relatedLongVideos}</td>
                  <td className="text-accent">{formatNum(ch.bestVideoViews)}</td>
                  <td style={{ color: ch.bestViewSubRatio >= 1 ? '#00e676' : '#9fa8c7' }}>{ch.bestViewSubRatio?.toFixed(1)}x</td>
                  <td>
                    <span className={`score-badge ${ch.fitScore >= 70 ? 'score-high' : ch.fitScore >= 50 ? 'score-med' : 'score-low'}`}>{ch.fitScore}</span>
                  </td>
                  <td className="text-[0.78rem] text-text-secondary">{ch.recommendation}</td>
                  <td className="text-[0.75rem] text-text-muted max-w-[200px] truncate">{ch.reason}</td>
                  {onTrack && (
                    <td className="text-center px-2 py-1">
                      {trackedIds.includes(ch.channelId) ? (
                        <span className="text-[0.75rem] font-semibold" style={{ color: '#6366f1' }}>✓ Tracking</span>
                      ) : (
                        <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                          onClick={e => { e.stopPropagation(); onTrack(ch); }}>⭐ Track</button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[0.72rem] text-text-muted mt-2.5">
        ⚠️ Các kênh trên chỉ để học cấu trúc tiêu đề và cách triển khai chủ đề. Không copy hoặc reup nội dung.
      </p>
    </div>
  );
}
