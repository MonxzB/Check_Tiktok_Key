import React from 'react';

function mode(arr) {
  const freq = {};
  for (const v of arr) freq[v] = (freq[v] || 0) + 1;
  let best = '', bestN = 0;
  for (const k in freq) { if (freq[k] > bestN) { bestN = freq[k]; best = k; } }
  return best;
}

export default function StatsBar({ keywords }) {
  const scored = keywords.filter(k => k.longFormScore > 0);
  const avg = scored.length
    ? Math.round(scored.reduce((s, k) => s + k.longFormScore, 0) / scored.length)
    : 0;
  const topNiche = mode(scored.map(k => k.niche));
  const goodCount = scored.filter(k => k.longFormScore >= 70).length;
  const withApiData = scored.filter(k => k.apiData?.longVideosFound > 0).length;

  return (
    <div className="stats-bar">
      <div className="stat-chip">
        <span>📊 Tổng keyword:</span>
        <span className="stat-value">{keywords.length}</span>
      </div>
      <div className="stat-chip">
        <span>⭐ Điểm TB:</span>
        <span className="stat-value">{avg}</span>
      </div>
      <div className="stat-chip">
        <span>🔥 Đáng làm (≥70):</span>
        <span className="stat-value">{goodCount}</span>
      </div>
      <div className="stat-chip">
        <span>▶️ Đã có YT data:</span>
        <span className="stat-value">{withApiData}</span>
      </div>
      <div className="stat-chip">
        <span>🏷️ Niche phổ biến:</span>
        <span className="stat-value">{topNiche || '—'}</span>
      </div>
    </div>
  );
}
