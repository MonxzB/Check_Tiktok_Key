import React from 'react';
import type { RefChannel } from '../types';
import { scoreColor, recBadgeClass, formatNum } from './utils.js';

interface YtDetailModalProps {
  channel: RefChannel;
  onClose: () => void;
}

export default function YtDetailModal({ channel: ch, onClose }: YtDetailModalProps) {
  if (!ch) return null;

  const data = [
    { label: 'Subscribers',    value: formatNum(ch.subscriberCount) },
    { label: 'Tổng Views',     value: formatNum(ch.viewCount) },
    { label: 'Số Video',       value: formatNum(ch.videoCount) },
    { label: 'View/Sub Ratio', value: ch.bestViewSubRatio.toFixed(2) },
  ];

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="jp-text">{ch.channelTitle}</h2>
        <a
          href={ch.channelUrl}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--accent)', fontSize: '0.9rem', textDecoration: 'none' }}
        >
          Mở kênh trên YouTube ↗
        </a>

        <div className="detail-grid" style={{ marginTop: 20 }}>
          {data.map(d => (
            <div key={d.label} className="detail-item">
              <div className="label">{d.label}</div>
              <div className="value">{d.value}</div>
            </div>
          ))}
          <div className="detail-item" style={{ gridColumn: 'span 2', textAlign: 'center' }}>
            <div className="label">Điểm Fit Tham Khảo</div>
            <div className="value" style={{ fontSize: '1.6rem', color: scoreColor(ch.fitScore, 100) }}>
              {ch.fitScore}/100
            </div>
            <div>
              <span className={`rec-badge ${recBadgeClass(ch.recommendation)}`}>{ch.recommendation}</span>
            </div>
          </div>
        </div>

        {ch.bestVideoTitle && (
          <div className="detail-sub">
            <h3>🎬 Video Liên Quan Nổi Bật</h3>
            <div style={{ background: 'var(--glass)', padding: 12, borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
              <div className="jp-text" style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>
                {ch.bestVideoTitle}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Views: <strong style={{ color: 'var(--accent)' }}>{formatNum(ch.bestVideoViews)}</strong>
              </div>
              {ch.bestVideoUrl && (
                <a
                  href={ch.bestVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block', marginTop: 8, color: '#fff',
                    textDecoration: 'none', background: '#f00',
                    padding: '4px 12px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600,
                  }}
                >
                  Xem trên YouTube
                </a>
              )}
            </div>
          </div>
        )}

        {ch.isRisky && (
          <div style={{
            color: 'var(--red)', padding: 8, background: 'rgba(255,0,0,0.1)',
            borderRadius: 4, marginTop: 12, fontSize: '0.85rem',
          }}>
            ⚠️ CẢNH BÁO: Kênh này có dấu hiệu chứa nội dung reup, anime, phim ảnh.
            Tuyệt đối KHÔNG reup/copy video. Chỉ tham khảo cách đặt tiêu đề.
          </div>
        )}
      </div>
    </div>
  );
}
