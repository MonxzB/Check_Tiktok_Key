import React from 'react';
import type { RefChannel } from '../types';
import { scoreColor, recBadgeClass, formatNum } from './utils.js';

export default function YtDetailModal({ channel: ch, onClose }: { channel: RefChannel; onClose: () => void }) {
  if (!ch) return null;

  const stats = [
    { label: 'Subscribers',    value: formatNum(ch.subscriberCount) },
    { label: 'Tổng Views',     value: formatNum(ch.viewCount) },
    { label: 'Số Video',       value: formatNum(ch.videoCount) },
    { label: 'View/Sub Ratio', value: ch.bestViewSubRatio.toFixed(2) },
  ];

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="jp-text pr-10">{ch.channelTitle}</h2>
        <a href={ch.channelUrl} target="_blank" rel="noreferrer"
          className="text-accent text-[0.9rem] no-underline hover:opacity-75 transition-opacity">
          Mở kênh trên YouTube ↗
        </a>

        <div className="detail-grid mt-5">
          {stats.map(d => (
            <div key={d.label} className="detail-item">
              <div className="label">{d.label}</div>
              <div className="value">{d.value}</div>
            </div>
          ))}
          <div className="detail-item text-center" style={{ gridColumn: 'span 2' }}>
            <div className="label">Điểm Fit Tham Khảo</div>
            <div className="value text-[1.6rem]" style={{ color: scoreColor(ch.fitScore, 100) }}>
              {ch.fitScore}/100
            </div>
            <span className={`rec-badge ${recBadgeClass(ch.recommendation)}`}>{ch.recommendation}</span>
          </div>
        </div>

        {ch.bestVideoTitle && (
          <div className="detail-sub">
            <h3>🎬 Video Liên Quan Nổi Bật</h3>
            <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="jp-text font-semibold text-[1.1rem] mb-2">{ch.bestVideoTitle}</div>
              <div className="text-[0.85rem] text-text-secondary">
                Views: <strong className="text-accent">{formatNum(ch.bestVideoViews)}</strong>
              </div>
              {ch.bestVideoUrl && (
                <a href={ch.bestVideoUrl} target="_blank" rel="noreferrer"
                  className="inline-block mt-2 px-3 py-1 rounded text-[0.8rem] font-semibold text-white no-underline"
                  style={{ background: '#f00' }}>
                  Xem trên YouTube
                </a>
              )}
            </div>
          </div>
        )}

        {ch.isRisky && (
          <div className="mt-3 p-2 rounded text-[0.85rem]"
            style={{ color: '#ff1744', background: 'rgba(255,0,0,0.1)' }}>
            ⚠️ CẢNH BÁO: Kênh này có dấu hiệu chứa nội dung reup, anime, phim ảnh.
            Tuyệt đối KHÔNG reup/copy video. Chỉ tham khảo cách đặt tiêu đề.
          </div>
        )}
      </div>
    </div>
  );
}
