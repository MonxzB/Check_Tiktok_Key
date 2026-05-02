import React, { useState, useMemo } from 'react';
import type { RefVideo } from '../types';
import { formatNum } from './utils.js';
import CustomSelect from './CustomSelect.js';

interface RefVideoTableProps { videos: RefVideo[]; keyword?: string; }

export default function RefVideoTable({ videos, keyword }: RefVideoTableProps) {
  const [sortCol,     setSortCol]     = useState<string>('longFormFitScore');
  const [sortDir,     setSortDir]     = useState<'asc'|'desc'>('desc');
  const [hideRisky,   setHideRisky]   = useState(true);
  const [minDuration, setMinDuration] = useState<number>(0);
  const [minViews,    setMinViews]    = useState<number>(0);
  const [minScore,    setMinScore]    = useState<number>(0);
  const [search,      setSearch]      = useState('');

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const sorted = useMemo(() => {
    let f = [...videos];
    if (hideRisky)       f = f.filter(v => !v.isRisky);
    if (minDuration > 0) f = f.filter(v => v.durationSec >= minDuration * 60);
    if (minViews > 0)    f = f.filter(v => v.viewCount >= minViews);
    if (minScore > 0)    f = f.filter(v => v.longFormFitScore >= minScore);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      f = f.filter(v => v.title?.toLowerCase().includes(q) || v.channelTitle?.toLowerCase().includes(q));
    }
    f.sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sortCol] ?? 0;
      const vb = (b as unknown as Record<string, unknown>)[sortCol] ?? 0;
      const sva = typeof va === 'string' ? va.toLowerCase() : va;
      const svb = typeof vb === 'string' ? vb.toLowerCase() : vb;
      if (sva < svb) return sortDir === 'asc' ? -1 : 1;
      if (sva > svb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return f;
  }, [videos, hideRisky, minDuration, minViews, minScore, search, sortCol, sortDir]);

  const activeFilters = [hideRisky, minDuration > 0, minViews > 0, minScore > 0, search.trim()].filter(Boolean).length;

  if (!videos.length) return (
    <div className="text-center py-10 text-text-muted">
      Chưa có video. Bấm "🔍 Phân tích" để tìm video long-form tham khảo.
    </div>
  );

  const COLS = [
    { key: 'title',             label: 'Tiêu đề Video'  },
    { key: 'channelTitle',      label: 'Kênh Tham Khảo' },
    { key: 'durationFormatted', label: 'Thời lượng'     },
    { key: 'viewCount',         label: 'Views'          },
    { key: 'likeCount',         label: 'Likes'          },
    { key: 'subscriberCount',   label: 'Subscribers'    },
    { key: 'viewSubRatio',      label: 'View/Sub'       },
    { key: 'longFormFitScore',  label: 'Fit Score'      },
    { key: 'publishedAt',       label: 'Ngày đăng'      },
  ];

  const durationOpts = [{ value: 0, label: 'Tất cả' }, { value: 5, label: '5 phút+' }, { value: 8, label: '8 phút+' }, { value: 10, label: '10 phút+' }, { value: 20, label: '20 phút+' }, { value: 30, label: '30 phút+' }];
  const viewsOpts    = [{ value: 0, label: 'Tất cả' }, { value: 1000, label: '1K+' }, { value: 5000, label: '5K+' }, { value: 10000, label: '10K+' }, { value: 50000, label: '50K+' }, { value: 100000, label: '100K+' }];
  const scoreOpts    = [{ value: 0, label: 'Tất cả' }, { value: 50, label: '50+ (Tốt)' }, { value: 70, label: '70+ (Rất tốt)' }, { value: 85, label: '85+ (Xuất sắc)' }];

  return (
    <div>
      {/* Filter bar */}
      <div className="rounded-lg px-3.5 py-3 mb-3" style={{ background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex gap-2.5 flex-wrap items-end">
          <div className="filter-group min-w-0" style={{ flex: '2 1 160px' }}>
            <label>🔍 Tìm tiêu đề / kênh</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nhập từ khoá..." className="field-input text-[0.83rem]" />
          </div>
          <div className="filter-group min-w-0" style={{ flex: '1 1 130px' }}>
            <label>⏱ Thời lượng tối thiểu</label>
            <CustomSelect value={minDuration} onChange={v => setMinDuration(Number(v ?? 0))} options={durationOpts} placeholder="Tất cả" />
          </div>
          <div className="filter-group min-w-0" style={{ flex: '1 1 120px' }}>
            <label>👁 Views tối thiểu</label>
            <CustomSelect value={minViews} onChange={v => setMinViews(Number(v ?? 0))} options={viewsOpts} placeholder="Tất cả" />
          </div>
          <div className="filter-group min-w-0" style={{ flex: '1 1 130px' }}>
            <label>⭐ Fit Score tối thiểu</label>
            <CustomSelect value={minScore} onChange={v => setMinScore(Number(v ?? 0))} options={scoreOpts} placeholder="Tất cả" />
          </div>
          <label className="flex items-center gap-1.5 text-[0.83rem] text-text-secondary cursor-pointer pb-1 whitespace-nowrap shrink-0">
            <input type="checkbox" checked={hideRisky} onChange={e => setHideRisky(e.target.checked)} />
            Ẩn rủi ro
          </label>
          {activeFilters > 0 && (
            <button className="btn btn-secondary shrink-0" style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              onClick={() => { setMinDuration(0); setMinViews(0); setMinScore(0); setSearch(''); setHideRisky(true); }}>
              ✕ Reset ({activeFilters})
            </button>
          )}
          <span className="ml-auto text-[0.8rem] text-text-muted pb-1 whitespace-nowrap">
            {sorted.length} / {videos.length} video
          </span>
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
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(v => (
              <tr key={v.videoId} style={{ opacity: v.isRisky ? 0.5 : 1 }}>
                <td className="jp-text max-w-[280px] truncate" title={v.title}>{v.title}</td>
                <td className="whitespace-nowrap">
                  <a href={v.channelUrl} target="_blank" rel="noreferrer"
                    className="text-accent no-underline" onClick={e => e.stopPropagation()}>{v.channelTitle}</a>
                </td>
                <td className="whitespace-nowrap" style={{ color: '#00e676' }}>{v.durationFormatted}</td>
                <td className="text-accent">{formatNum(v.viewCount)}</td>
                <td>{formatNum(v.likeCount)}</td>
                <td>{formatNum(v.subscriberCount)}</td>
                <td style={{ color: v.viewSubRatio >= 1 ? '#00e676' : '#9fa8c7' }}>{v.viewSubRatio?.toFixed(1)}x</td>
                <td>
                  <span className={`score-badge ${v.longFormFitScore >= 70 ? 'score-high' : v.longFormFitScore >= 50 ? 'score-med' : 'score-low'}`}>
                    {v.longFormFitScore}
                  </span>
                </td>
                <td className="text-[0.75rem] whitespace-nowrap">{(v.publishedAt || '').split('T')[0]}</td>
                <td>
                  <a href={v.videoUrl} target="_blank" rel="noreferrer"
                    className="no-underline text-[0.78rem] font-semibold" style={{ color: '#f00' }}
                    onClick={e => e.stopPropagation()}>▶ Xem</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[0.72rem] text-text-muted mt-2.5">
        ⚠️ Các video trên chỉ là tham khảo cấu trúc tiêu đề và cách triển khai chủ đề. Không copy, reup hoặc sử dụng nội dung của video tham khảo.
      </p>
    </div>
  );
}
