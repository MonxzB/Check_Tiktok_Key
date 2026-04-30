import React from 'react';
import { scoreBadgeClass, recBadgeClass } from './utils.js';

export default function PanelGrid({ keywords, onSelectKeyword }) {
  const top10 = [...keywords].sort((a, b) => b.longFormScore - a.longFormScore).slice(0, 10);
  const risky = keywords
    .filter(k => k.lowRisk <= 1 || k.longFormScore < 40 || k.level === 'Broad')
    .sort((a, b) => a.longFormScore - b.longFormScore)
    .slice(0, 10);

  return (
    <div className="panel-grid">
      <section className="card">
        <h2><span className="icon">🔥</span> Top 10 nên làm trước</h2>
        {top10.map(kw => (
          <div key={kw.keyword} className="kw-card" onClick={() => onSelectKeyword(kw)}>
            <div className="kw-name jp-text">{kw.keyword}</div>
            <div className="kw-meta">
              <span className={`score-badge ${scoreBadgeClass(kw.longFormScore)}`}>{kw.longFormScore}</span>
              <span className={`rec-badge ${recBadgeClass(kw.recommendation)}`}>{kw.recommendation}</span>
              <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{kw.vi}</span>
            </div>
            {kw.apiData?.longVideosFound > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 2 }}>
                ▶️ {kw.apiData.longVideosFound} video long-form | avg {(kw.apiData.avgLongVideoViews/1000).toFixed(0)}k views
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="card">
        <h2><span className="icon">⚠️</span> Keyword nên né</h2>
        {risky.map(kw => (
          <div key={kw.keyword} className="kw-card danger" onClick={() => onSelectKeyword(kw)}>
            <div className="kw-name jp-text">{kw.keyword}</div>
            <div className="kw-meta" style={{ fontSize: '0.78rem' }}>{kw.reason}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
