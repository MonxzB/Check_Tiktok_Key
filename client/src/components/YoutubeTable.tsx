import React, { useState, useMemo } from 'react';
import type { RefChannel } from '../types';
import { scoreBadgeClass, recBadgeClass, formatNum } from './utils.js';
import YtDetailModal from './YtDetailModal.js';

interface ColDef {
  key: keyof RefChannel | 'topVideoTitle' | 'topVideoViews';
  label: string;
}

const YT_COLS: ColDef[] = [
  { key: 'keyword',         label: 'Keyword' },
  { key: 'channelTitle',    label: 'Tên Kênh' },
  { key: 'subscriberCount', label: 'Subscribers' },
  { key: 'viewCount',       label: 'Tổng Views' },
  { key: 'videoCount',      label: 'Số Video' },
  { key: 'topVideoTitle',   label: 'Video Liên Quan' },
  { key: 'topVideoViews',   label: 'Views Video' },
  { key: 'bestViewSubRatio', label: 'View/Sub' },
  { key: 'fitScore',        label: 'Điểm Fit' },
  { key: 'recommendation',  label: 'Đề xuất' },
  { key: 'reason',          label: 'Lý do' },
];

interface YtFilters {
  minScore: string | number;
  sub: string;
  ratio: string;
  recent: string;
  hideRisky: boolean;
  smallOnly: boolean;
}

interface YoutubeTableProps {
  channels: RefChannel[];
  ytFilters: YtFilters;
  setYtFilters: React.Dispatch<React.SetStateAction<YtFilters>>;
}

export default function YoutubeTable({ channels, ytFilters, setYtFilters }: YoutubeTableProps) {
  const [sortCol, setSortCol] = useState<string>('fitScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedChannel, setSelectedChannel] = useState<RefChannel | null>(null);

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const filtered = useMemo(() => {
    let f = [...channels];
    const minScore = parseInt(String(ytFilters.minScore)) || 0;
    if (minScore > 0) f = f.filter(c => c.fitScore >= minScore);
    if (ytFilters.sub === 'small') f = f.filter(c => c.subscriberCount < 10000);
    else if (ytFilters.sub === 'med') f = f.filter(c => c.subscriberCount >= 10000 && c.subscriberCount <= 100000);
    else if (ytFilters.sub === 'large') f = f.filter(c => c.subscriberCount > 100000);
    if (ytFilters.ratio === 'high') f = f.filter(c => c.bestViewSubRatio > 1.0);
    else if (ytFilters.ratio === 'med') f = f.filter(c => c.bestViewSubRatio > 0.5);
    if (ytFilters.hideRisky) f = f.filter(c => !c.isRisky);
    if (ytFilters.smallOnly) f = f.filter(c => c.isSmallOpportunity);

    f.sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sortCol];
      const vb = (b as unknown as Record<string, unknown>)[sortCol];
      const sva = typeof va === 'string' ? va.toLowerCase() : va;
      const svb = typeof vb === 'string' ? vb.toLowerCase() : vb;
      if (sva! < svb!) return sortDir === 'asc' ? -1 : 1;
      if (sva! > svb!) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return f;
  }, [channels, ytFilters, sortCol, sortDir]);

  return (
    <>
      <section className="card">
        <h2>
          <span className="icon">📺</span> Danh sách Kênh Tham Khảo{' '}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
            ({filtered.length} kênh)
          </span>
        </h2>
        <div className="table-wrapper">
          <table>
            <colgroup>{YT_COLS.map(c => <col key={c.key} />)}</colgroup>
            <thead>
              <tr>
                {YT_COLS.map(c => (
                  <th
                    key={c.key}
                    onClick={() => handleSort(c.key)}
                    className={sortCol === c.key ? `sorted-${sortDir}` : ''}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ch => (
                <tr key={ch.channelId} style={{ cursor: 'pointer' }} onClick={() => setSelectedChannel(ch)}>
                  <td className="jp-text">{ch.keyword}</td>
                  <td style={{ fontWeight: 600 }}>{ch.channelTitle}</td>
                  <td>{formatNum(ch.subscriberCount)}</td>
                  <td>{formatNum(ch.viewCount)}</td>
                  <td>{formatNum(ch.videoCount)}</td>
                  <td className="jp-text">{ch.bestVideoTitle}</td>
                  <td style={{ color: 'var(--accent)' }}>{formatNum(ch.bestVideoViews)}</td>
                  <td>{ch.bestViewSubRatio.toFixed(2)}</td>
                  <td><span className={`score-badge ${scoreBadgeClass(ch.fitScore)}`}>{ch.fitScore}</span></td>
                  <td><span className={`rec-badge ${recBadgeClass(ch.recommendation)}`}>{ch.recommendation}</span></td>
                  <td style={{ fontSize: '0.75rem' }}>{ch.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedChannel && (
        <YtDetailModal channel={selectedChannel} onClose={() => setSelectedChannel(null)} />
      )}
    </>
  );
}
