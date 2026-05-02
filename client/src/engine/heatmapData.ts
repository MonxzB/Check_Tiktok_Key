// ============================================================
// engine/heatmapData.ts — Phase 8: Niche Heatmap data builder
// ============================================================
import type { Keyword, Niche } from '../types';

export interface NicheStats {
  niche: Niche;
  count: number;
  avgScore: number;
  topKeywords: Keyword[];
  color: string;
  /** Recharts Treemap: name + size required */
  name: string;
  size: number;
}

/** Map niche → emoji for display */
export const NICHE_EMOJI: Record<string, string> = {
  'AI / ChatGPT':     '🤖',
  'Excel / Office':   '📊',
  'Lập trình':        '💻',
  'Tiết kiệm':        '💰',
  'Công việc':        '💼',
  'Phỏng vấn':        '🎤',
  'Học tập':          '📚',
  'Tâm lý học':       '🧠',
  'Kiến thức / Fact': '🔍',
  'Văn hóa Nhật':     '🎌',
  '100均':            '🛒',
  'Sức khỏe':         '❤️',
  'Kinh doanh':       '📈',
};

function scoreToColor(avg: number): string {
  if (avg >= 80) return '#4ade80';   // green-400
  if (avg >= 65) return '#facc15';   // yellow-400
  if (avg >= 50) return '#fb923c';   // orange-400
  return '#f87171';                   // red-400
}

export function buildHeatmapData(keywords: Keyword[]): NicheStats[] {
  if (!keywords.length) return [];

  // Group by niche
  const groups = new Map<string, Keyword[]>();
  for (const kw of keywords) {
    const n = kw.niche || 'Other';
    if (!groups.has(n)) groups.set(n, []);
    groups.get(n)!.push(kw);
  }

  const stats: NicheStats[] = [];
  for (const [niche, kws] of groups.entries()) {
    const avgScore = kws.reduce((s, k) => s + (k.longFormScore || 0), 0) / kws.length;
    const topKeywords = [...kws]
      .sort((a, b) => b.longFormScore - a.longFormScore)
      .slice(0, 3);
    const color = scoreToColor(avgScore);
    stats.push({
      niche: niche as Niche,
      name: niche,
      count: kws.length,
      avgScore: Math.round(avgScore),
      topKeywords,
      color,
      size: kws.length, // Treemap sizes cells by this
    });
  }

  return stats.sort((a, b) => b.count - a.count);
}
