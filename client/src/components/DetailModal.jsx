import React from 'react';
import { scoreColor, recBadgeClass } from './utils.js';
import { getFreshness, getFreshnessColor } from '../engine/dataMetadata.js';

export default function DetailModal({ kw, onClose }) {
  if (!kw) return null;

  const scores = [
    { label: 'Demand',           value: kw.demand,          max: 20, desc: 'Video long-form cho key này có views tốt không?' },
    { label: 'Search Intent',    value: kw.searchIntent,    max: 15, desc: 'Người xem tìm kiếm giải thích, hướng dẫn, so sánh?' },
    { label: 'Topic Depth',      value: kw.topicDepth,      max: 15, desc: 'Chủ đề đủ sâu cho video 5–20+ phút không?' },
    { label: 'Small Channel',    value: kw.smallChannel,    max: 15, desc: 'Kênh nhỏ/trung có cơ hội với keyword này không?' },
    { label: 'Evergreen',        value: kw.evergreen,       max: 10, desc: 'Chủ đề còn có giá trị sau nhiều tháng không?' },
    { label: 'Series Potential', value: kw.seriesPotential, max: 10, desc: 'Có thể làm nhiều video theo series không?' },
    { label: 'Long-tail Exp.',   value: kw.longTailExp,     max: 10, desc: 'Có thể mở rộng ra nhiều sub-topic không?' },
    { label: 'Low Risk',         value: kw.lowRisk,         max: 5,  desc: '5 = an toàn bản quyền, 0 = rủi ro cao' },
  ];

  const api = kw.apiData || {};
  const meta = kw.metadata || {};
  const freshness = meta.freshnessStatus || (meta.collectedAt ? getFreshness(meta.collectedAt) : null);

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="jp-text">{kw.keyword}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
          {kw.vi} — <strong style={{ color: 'var(--accent)' }}>{kw.niche}</strong> — {kw.level}
        </p>
        <span className={`rec-badge ${recBadgeClass(kw.recommendation)}`}>{kw.recommendation}</span>

        {/* Score Grid */}
        <div className="detail-grid" style={{ marginTop: 20 }}>
          {scores.map(s => (
            <div key={s.label} className="detail-item">
              <div className="label">{s.label} (/{s.max})</div>
              <div className="value" style={{ color: scoreColor(s.value, s.max) }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
            </div>
          ))}
          <div className="detail-item" style={{ gridColumn: 'span 2', textAlign: 'center' }}>
            <div className="label">Long-Form Score Tổng</div>
            <div className="value" style={{ fontSize: '2rem', color: scoreColor(kw.longFormScore, 100) }}>
              {kw.longFormScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
        </div>

        {/* YouTube API Data */}
        {api.longVideosFound > 0 && (
          <div className="detail-sub">
            <h3>▶️ Dữ liệu YouTube</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              {[
                ['Long video tìm thấy', api.longVideosFound],
                ['Avg views / video', api.avgLongVideoViews ? Math.round(api.avgLongVideoViews/1000) + 'k' : '—'],
                ['Best view/sub ratio', api.bestViewSubRatio ? api.bestViewSubRatio.toFixed(1) + 'x' : '—'],
                ['Kênh nhỏ cơ hội', api.hasSmallChannelOpportunity ? '✅ Có' : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ background: 'var(--glass)', padding: '6px 10px', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{val}</div>
                </div>
              ))}
            </div>
            {api.refChannels?.length > 0 && (
              <p style={{ fontSize: '0.78rem', marginTop: 8, color: 'var(--text-secondary)' }}>
                Kênh tham khảo: <strong>{api.refChannels.slice(0,3).join(', ')}</strong>
              </p>
            )}
          </div>
        )}

        {/* Suggested Chapters */}
        {kw.chapters?.length > 0 && (
          <div className="detail-sub">
            <h3>🎬 Gợi ý Chapters (tiếng Nhật)</h3>
            <ol style={{ paddingLeft: 20 }}>
              {kw.chapters.map((ch, i) => (
                <li key={i} className="jp-text" style={{ padding: '3px 0', fontSize: '0.88rem', color: 'var(--text)' }}>{ch}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Suggested Titles */}
        {kw.suggestedTitles?.length > 0 && (
          <div className="detail-sub">
            <h3>✏️ Gợi ý Tiêu đề (nội dung gốc)</h3>
            <ul>
              {kw.suggestedTitles.map((t, i) => (
                <li key={i} className="jp-text" style={{ padding: '4px 0', fontSize: '0.88rem' }}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sub Keywords */}
        {kw.subKeywords?.length > 0 && (
          <div className="detail-sub">
            <h3>🔀 Sub-keywords liên quan</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {kw.subKeywords.map(s => (
                <span key={s} className="seed-tag jp-text" style={{ fontSize: '0.8rem' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Data Metadata */}
        {(freshness || meta.confidenceLevel) && (
          <div className="detail-sub" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12, marginTop: 12 }}>
            <h3>📊 Metadata dữ liệu</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8, fontSize: '0.78rem' }}>
              {[
                ['Nguồn dữ liệu', meta.dataSourcesUsed || 'Rule-based'],
                ['Thu thập lúc', meta.collectedAt ? new Date(meta.collectedAt).toLocaleDateString('vi-VN') : '—'],
                ['Freshness', freshness || '—'],
                ['Confidence', meta.confidenceLevel || '—'],
                ['Time window', meta.timeWindowDays ? meta.timeWindowDays + ' ngày' : '—'],
                ['Region', meta.regionCode || 'JP'],
              ].map(([k, v]) => (
                <div key={k} style={{ color: 'var(--text-muted)' }}>
                  <span>{k}: </span>
                  <span style={{ color: k === 'Freshness' ? getFreshnessColor(v) : 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis */}
        {kw.reason && (
          <div className="detail-sub">
            <h3>📝 Phân tích</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{kw.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
