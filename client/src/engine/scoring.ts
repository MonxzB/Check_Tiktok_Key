// ============================================================
// engine/scoring.ts — Legacy TikTok-era scoring (kept for compatibility)
// NOTE: New long-form scoring is in longFormScoring.ts
// ============================================================
import type { Niche } from '../types';
import { NICHE_HEAT, RISKY_MARKERS, TITLE_TEMPLATES } from './constants.js';

const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface LegacyKeyword {
  keyword: string;
  niche: Niche;
  level: 'Broad' | 'Mid-tail' | 'Long-tail';
  demand?: number;
  smallAccount?: number;
  series?: number;
  longtail?: number;
  retention?: number;
  risk?: number;
  finalScore?: number;
  recommendation?: string;
  reason?: string;
  subKeywords?: string[];
  exampleTitles?: string[];
  notes?: string;
}

function scoreDemand(kw: LegacyKeyword): number {
  let score = 8;
  const heat = NICHE_HEAT[kw.niche] || 12;
  score += Math.floor((heat - 12) * 1.5);
  const demandMods = ['おすすめ', 'ランキング', 'やり方', '使い方', '方法'];
  for (const m of demandMods) { if (kw.keyword.includes(m)) { score += 3; break; } }
  if (kw.level === 'Long-tail') score -= 2;
  if (kw.level === 'Mid-tail') score += 1;
  if (kw.level === 'Broad') score += 3;
  return clamp(score, 0, 20);
}

function scoreSmallAccount(kw: LegacyKeyword): number {
  let score = 10;
  if (kw.level === 'Broad') score -= 7;
  if (kw.level === 'Mid-tail') score += 2;
  if (kw.level === 'Long-tail') score += 6;
  if (kw.niche === 'AI / ChatGPT') score -= 2;
  return clamp(score, 0, 20);
}

function scoreSeries(kw: LegacyKeyword): number {
  let score = 7;
  const seriesMods = ['ランキング', 'おすすめ', 'やり方', '比較', 'TOP'];
  for (const m of seriesMods) { if (kw.keyword.includes(m)) { score += 4; break; } }
  if (kw.level === 'Long-tail') score += 2;
  if (kw.level === 'Mid-tail') score += 3;
  if (kw.level === 'Broad') score += 2;
  return clamp(score, 0, 15);
}

function scoreLongtail(kw: LegacyKeyword, allKws: LegacyKeyword[]): number {
  let score = 5;
  const branches = allKws.filter(k => k.keyword !== kw.keyword && k.keyword.includes(kw.keyword));
  score += Math.min(branches.length, 8);
  if (kw.level === 'Broad') score += 3;
  if (kw.level === 'Long-tail') score -= 2;
  return clamp(score, 0, 15);
}

function scoreRetention(kw: LegacyKeyword): number {
  let score = 5;
  if (/\d選|TOP|ランキング|比較/.test(kw.keyword)) score += 3;
  if (/注意|失敗|NG|やってはいけない/.test(kw.keyword)) score += 3;
  return clamp(score, 0, 15);
}

function scoreRisk(kw: LegacyKeyword): number {
  let score = 13;
  for (const marker of RISKY_MARKERS) {
    if (kw.keyword.includes(marker)) { score -= 8; break; }
  }
  if (kw.level === 'Broad') score -= 2;
  return clamp(score, 0, 15);
}

export function getRecommendation(score: number): string {
  if (score >= 85) return 'Ưu tiên test mạnh';
  if (score >= 70) return 'Có thể test';
  if (score >= 55) return 'Test nhẹ';
  if (score >= 40) return 'Cân nhắc';
  return 'Bỏ qua';
}

function generateReason(kw: LegacyKeyword): string {
  const parts: string[] = [];
  if ((kw.demand ?? 0) >= 14) parts.push('Nhu cầu cao');
  else if ((kw.demand ?? 0) >= 10) parts.push('Có nhu cầu');
  else parts.push('Nhu cầu thấp');
  if ((kw.smallAccount ?? 0) >= 14) parts.push('dễ chen cho acc nhỏ');
  else if ((kw.smallAccount ?? 0) <= 6) parts.push('khó cho acc nhỏ');
  if ((kw.series ?? 0) >= 10) parts.push('làm series dài được');
  if ((kw.retention ?? 0) >= 10) parts.push('giữ chân tốt');
  if ((kw.risk ?? 0) <= 7) parts.push('⚠️ rủi ro bản quyền');
  if (kw.level === 'Broad') parts.push('quá rộng, nên thu hẹp');
  return parts.join(', ') + '.';
}

function generateNotes(kw: LegacyKeyword): string {
  if ((kw.risk ?? 13) <= 5) return '⚠️ Rủi ro cao — cần kiểm tra nội dung gốc';
  if (kw.level === 'Broad') return '💡 Nên mở rộng thành long-tail';
  if ((kw.finalScore ?? 0) >= 80) return '🔥 Key tiềm năng cao';
  return '';
}

export function scoreKeywords(keywords: LegacyKeyword[]): LegacyKeyword[] {
  return keywords.map(kw => {
    const scored = { ...kw };
    scored.demand = scoreDemand(scored);
    scored.smallAccount = scoreSmallAccount(scored);
    scored.series = scoreSeries(scored);
    scored.longtail = scoreLongtail(scored, keywords);
    scored.retention = scoreRetention(scored);
    scored.risk = scoreRisk(scored);
    scored.finalScore = (scored.demand ?? 0) + (scored.smallAccount ?? 0) + (scored.series ?? 0) +
      (scored.longtail ?? 0) + (scored.retention ?? 0) + (scored.risk ?? 0);
    scored.recommendation = getRecommendation(scored.finalScore);
    scored.reason = generateReason(scored);
    scored.subKeywords = keywords
      .filter(k => k.keyword !== scored.keyword && k.keyword.startsWith(scored.keyword))
      .slice(0, 5)
      .map(k => k.keyword);
    scored.exampleTitles = shuffle(TITLE_TEMPLATES).slice(0, 3).map(t => t.replace('{kw}', scored.keyword));
    scored.notes = generateNotes(scored);
    return scored;
  });
}
