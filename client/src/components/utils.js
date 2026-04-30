// Shared UI utility functions
export function scoreBadgeClass(score) {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-med';
  if (score >= 40) return 'score-low';
  return 'score-bad';
}

export function recBadgeClass(rec) {
  // Long-form recommendations
  if (rec === 'Rất đáng làm long video') return 'rec-1';
  if (rec === 'Có thể làm long video')   return 'rec-2';
  if (rec === 'Test nhẹ long video')     return 'rec-3';
  if (rec === 'Kênh tham khảo tốt')     return 'rec-2';
  if (rec === 'Tham khảo được')          return 'rec-3';
  // Legacy TikTok (fallback)
  if (rec === 'Ưu tiên test mạnh') return 'rec-1';
  if (rec === 'Có thể test')       return 'rec-2';
  if (rec === 'Test nhẹ')          return 'rec-3';
  if (rec === 'Cân nhắc')          return 'rec-4';
  return 'rec-5';
}

export function scoreColor(value, max) {
  const pct = value / max;
  if (pct >= 0.8) return 'var(--green)';
  if (pct >= 0.6) return 'var(--accent)';
  if (pct >= 0.4) return 'var(--yellow)';
  if (pct >= 0.2) return 'var(--orange)';
  return 'var(--red)';
}

export function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}
