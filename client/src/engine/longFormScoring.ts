// ============================================================
// engine/longFormScoring.ts — 8-dimension long-form scoring (Phase 11: multi-language)
// ============================================================
import type { Keyword, Niche } from '../types';
import type { LanguagePack } from './languages/index';
import { getLanguagePack } from './languages/index';
import { NICHE_HEAT } from './constants.js';

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

// ── Niche heat (merge global default + pack override) ─────────
function getNicheHeat(niche: Niche, pack: LanguagePack): number {
  if (pack.nicheHeatOverride && pack.nicheHeatOverride[niche] !== undefined) {
    return pack.nicheHeatOverride[niche]!;
  }
  return NICHE_HEAT[niche] || 13;
}

// ── 1. Long-Form Demand Score (0–20) ──────────────────────────
function scoreDemand(kw: Keyword, pack: LanguagePack): number {
  let score = 8;
  const heat = getNicheHeat(kw.niche, pack);
  score += Math.round((heat - 13) * 1.2);
  if (kw.level === 'Broad') score += 3;
  if (kw.level === 'Mid-tail') score += 2;
  if (kw.apiData?.avgLongVideoViews != null && kw.apiData.avgLongVideoViews > 100000) score += 4;
  else if (kw.apiData?.avgLongVideoViews != null && kw.apiData.avgLongVideoViews > 30000) score += 2;
  return clamp(score, 0, 20);
}

// ── 2. Search Intent Score (0–15) ────────────────────────────
function scoreSearchIntent(kw: Keyword, pack: LanguagePack): number {
  let score = 5;
  const kwLower = kw.keyword.toLowerCase();
  let boostCount = 0;
  for (const boost of pack.searchIntentBoost) {
    if (kwLower.includes(boost.toLowerCase()) || kw.keyword.includes(boost)) boostCount++;
  }
  score += Math.min(boostCount * 3, 10);
  return clamp(score, 0, 15);
}

// ── 3. Topic Depth Score (0–15) ───────────────────────────────
function scoreTopicDepth(kw: Keyword, pack: LanguagePack): number {
  let score = 6;
  for (const signal of pack.topicDepthSignals) {
    if (kw.keyword.includes(signal)) { score += 4; break; }
  }
  const deepNiches: Niche[] = ['AI / ChatGPT', 'Excel / Office', 'Lập trình', 'Học tập', 'Kinh doanh'];
  if (deepNiches.includes(kw.niche)) score += 3;
  if (kw.level === 'Long-tail') score += 2;
  if (kw.level === 'Mid-tail') score += 1;
  return clamp(score, 0, 15);
}

// ── 4. Small Channel Opportunity Score (0–15) ─────────────────
function scoreSmallChannel(kw: Keyword): number {
  let score = 7;
  if (kw.level === 'Long-tail') score += 5;
  if (kw.level === 'Mid-tail') score += 2;
  if (kw.level === 'Broad') score -= 4;
  if (kw.apiData?.hasSmallChannelOpportunity) score += 5;
  if (kw.apiData?.bestViewSubRatio != null && kw.apiData.bestViewSubRatio >= 10) score += 3;
  else if (kw.apiData?.bestViewSubRatio != null && kw.apiData.bestViewSubRatio >= 1) score += 1;
  return clamp(score, 0, 15);
}

// ── 5. Evergreen Score (0–10) ────────────────────────────────
function scoreEvergreen(kw: Keyword, pack: LanguagePack): number {
  let score = 5;
  for (const signal of pack.evergreenMarkers) {
    if (kw.keyword.includes(signal)) { score += 3; break; }
  }
  const trendyNiches: Niche[] = ['AI / ChatGPT'];
  const evergreenNiches: Niche[] = ['Excel / Office', 'Học tập', 'Tiết kiệm', 'Tâm lý học'];
  if (trendyNiches.includes(kw.niche)) score -= 1;
  if (evergreenNiches.includes(kw.niche)) score += 2;
  return clamp(score, 0, 10);
}

// ── 6. Series Potential Score (0–10) ─────────────────────────
function scoreSeriesPotential(kw: Keyword, pack: LanguagePack): number {
  let score = 4;
  // Use pack suffixes as series signals
  const seriesSignals = pack.longFormSuffixes.slice(0, 6);
  for (const s of seriesSignals) {
    if (kw.keyword.includes(s)) { score += 3; break; }
  }
  const highSeriesNiches: Niche[] = ['AI / ChatGPT', 'Excel / Office', 'Lập trình', 'Tiết kiệm', 'Học tập'];
  if (highSeriesNiches.includes(kw.niche)) score += 2;
  if (kw.level === 'Broad') score += 2;
  return clamp(score, 0, 10);
}

// ── 7. Long-Tail Expansion Score (0–10) ──────────────────────
function scoreLongTailExpansion(kw: Keyword, allKws: Keyword[]): number {
  let score = 3;
  const branches = allKws.filter(k => k.keyword !== kw.keyword && k.keyword.includes(kw.keyword));
  score += Math.min(branches.length, 5);
  if (kw.level === 'Broad') score += 2;
  return clamp(score, 0, 10);
}

// ── 8. Low Risk Score (0–5) ──────────────────────────────────
function scoreLowRisk(kw: Keyword, pack: LanguagePack): number {
  let score = 5;
  const kwLower = kw.keyword.toLowerCase();
  for (const marker of pack.riskyMarkers) {
    if (kw.keyword.includes(marker) || kwLower.includes(marker.toLowerCase())) {
      score -= 4;
      break;
    }
  }
  if (kw.apiData?.hasRiskyChannels) score -= 2;
  return clamp(score, 0, 5);
}

// ── Recommendation ────────────────────────────────────────────
export function getRecommendation(score: number): string {
  if (score >= 85) return 'Rất đáng làm long video';
  if (score >= 70) return 'Có thể làm long video';
  if (score >= 55) return 'Test nhẹ long video';
  if (score >= 40) return 'Cân nhắc';
  return 'Bỏ qua';
}

// ── Chapter Suggestions ───────────────────────────────────────
type ChapterType = 'tutorial' | 'comparison' | 'ranking' | 'default';

function guessChapterType(kw: Keyword, pack: LanguagePack): ChapterType {
  const k = kw.keyword;
  // Language-agnostic heuristics
  if (/比較|비교|comparison|compare/i.test(k)) return 'comparison';
  if (/ランキング|TOP|랭킹|ranking|best \d/i.test(k)) return 'ranking';
  if (pack.topicDepthSignals.some(s => k.includes(s))) return 'tutorial';
  return 'default';
}

export function generateChapters(kw: Keyword, pack: LanguagePack): string[] {
  const type = guessChapterType(kw, pack);
  const base = pack.chapterTemplates[type] || pack.chapterTemplates.default;
  return base.map(ch => ch.replace('{kw}', kw.keyword));
}

// ── Title Suggestions ─────────────────────────────────────────
export function generateTitles(kw: Keyword, pack: LanguagePack): string[] {
  return shuffle(pack.titleTemplates).slice(0, 3).map(t => t.replace('{kw}', kw.keyword));
}

// ── Reason Text ───────────────────────────────────────────────
function generateReason(kw: Keyword): string {
  const parts: string[] = [];
  if (kw.demand >= 14) parts.push('Nhu cầu cao');
  else if (kw.demand >= 8) parts.push('Có nhu cầu');
  else parts.push('Nhu cầu thấp');
  if (kw.searchIntent >= 10) parts.push('search intent rõ ràng');
  if (kw.topicDepth >= 10) parts.push('chủ đề đủ sâu');
  if (kw.smallChannel >= 10) parts.push('cơ hội cho kênh nhỏ');
  if (kw.evergreen >= 7) parts.push('chủ đề evergreen');
  if (kw.lowRisk <= 1) parts.push('⚠️ rủi ro bản quyền');
  if (kw.level === 'Broad') parts.push('quá rộng, nên thu hẹp');
  return parts.join(', ') + '.';
}

// ── Main Scoring Function (with LanguagePack) ────────────────
export function scoreLongFormKeywords(
  keywords: Keyword[],
  packOrCode?: LanguagePack | string,
): Keyword[] {
  // Resolve pack: accept LanguagePack object, language code string, or default JA
  let pack: LanguagePack;
  if (!packOrCode) {
    pack = getLanguagePack('ja');
  } else if (typeof packOrCode === 'string') {
    pack = getLanguagePack(packOrCode as Parameters<typeof getLanguagePack>[0]);
  } else {
    pack = packOrCode;
  }

  return keywords.map(kw => {
    const scored: Keyword = { ...kw };
    scored.demand          = scoreDemand(scored, pack);
    scored.searchIntent    = scoreSearchIntent(scored, pack);
    scored.topicDepth      = scoreTopicDepth(scored, pack);
    scored.smallChannel    = scoreSmallChannel(scored);
    scored.evergreen       = scoreEvergreen(scored, pack);
    scored.seriesPotential = scoreSeriesPotential(scored, pack);
    scored.longTailExp     = scoreLongTailExpansion(scored, keywords);
    scored.lowRisk         = scoreLowRisk(scored, pack);

    scored.longFormScore =
      scored.demand + scored.searchIntent + scored.topicDepth +
      scored.smallChannel + scored.evergreen + scored.seriesPotential +
      scored.longTailExp + scored.lowRisk;

    scored.recommendation = getRecommendation(scored.longFormScore);
    scored.reason         = generateReason(scored);
    scored.chapters       = generateChapters(scored, pack);
    scored.suggestedTitles = generateTitles(scored, pack);
    scored.subKeywords    = keywords
      .filter(k => k.keyword !== scored.keyword && k.keyword.startsWith(scored.keyword))
      .slice(0, 5)
      .map(k => k.keyword);

    return scored;
  });
}
