// ============================================================
// engine/longFormScoring.js — 8-dimension long-form scoring
// ============================================================
import {
  NICHE_HEAT, SEARCH_INTENT_BOOST, TOPIC_DEPTH_SIGNALS,
  RISKY_MARKERS, EVERGREEN_SIGNALS, TITLE_TEMPLATES, CHAPTER_TEMPLATES,
} from './constants.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 1. Long-Form Demand Score (0–20) ──────────────────────────
function scoreDemand(kw) {
  let score = 8;
  const heat = NICHE_HEAT[kw.niche] || 13;
  score += Math.round((heat - 13) * 1.2);
  // Broad keywords have higher raw demand
  if (kw.level === 'Broad') score += 3;
  if (kw.level === 'Mid-tail') score += 2;
  // API boost: if long videos have strong views
  if (kw.apiData?.avgLongVideoViews > 100000) score += 4;
  else if (kw.apiData?.avgLongVideoViews > 30000) score += 2;
  return clamp(score, 0, 20);
}

// ── 2. Search Intent Score (0–15) ────────────────────────────
function scoreSearchIntent(kw) {
  let score = 5;
  const kwLower = kw.keyword.toLowerCase();
  let boostCount = 0;
  for (const boost of SEARCH_INTENT_BOOST) {
    if (kwLower.includes(boost) || kw.keyword.includes(boost)) {
      boostCount++;
    }
  }
  score += Math.min(boostCount * 3, 10);
  return clamp(score, 0, 15);
}

// ── 3. Topic Depth Score (0–15) ───────────────────────────────
function scoreTopicDepth(kw) {
  let score = 6;
  const kwText = kw.keyword;
  for (const signal of TOPIC_DEPTH_SIGNALS) {
    if (kwText.includes(signal)) { score += 4; break; }
  }
  // Tutorial/guide niches have higher depth
  const deepNiches = ['AI / ChatGPT', 'Excel / Office', 'Lập trình', 'Học tập', 'Kinh doanh'];
  if (deepNiches.includes(kw.niche)) score += 3;
  // Long-tail → narrower topic → potentially deeper
  if (kw.level === 'Long-tail') score += 2;
  if (kw.level === 'Mid-tail') score += 1;
  return clamp(score, 0, 15);
}

// ── 4. Small Channel Opportunity Score (0–15) ─────────────────
function scoreSmallChannel(kw) {
  let score = 7;
  // Long-tail = easier for small channels
  if (kw.level === 'Long-tail') score += 5;
  if (kw.level === 'Mid-tail') score += 2;
  if (kw.level === 'Broad') score -= 4;
  // API signal
  if (kw.apiData?.hasSmallChannelOpportunity) score += 5;
  if (kw.apiData?.bestViewSubRatio >= 10) score += 3;
  else if (kw.apiData?.bestViewSubRatio >= 1) score += 1;
  return clamp(score, 0, 15);
}

// ── 5. Evergreen Score (0–10) ────────────────────────────────
function scoreEvergreen(kw) {
  let score = 5;
  const kwText = kw.keyword;
  for (const signal of EVERGREEN_SIGNALS) {
    if (kwText.includes(signal)) { score += 3; break; }
  }
  // Time-sensitive niches are less evergreen
  const trendyNiches = ['AI / ChatGPT'];
  const evergreenNiches = ['Excel / Office', 'Học tập', 'Tiết kiệm', 'Tâm lý học'];
  if (trendyNiches.includes(kw.niche)) score -= 1;
  if (evergreenNiches.includes(kw.niche)) score += 2;
  return clamp(score, 0, 10);
}

// ── 6. Series Potential Score (0–10) ─────────────────────────
function scoreSeriesPotential(kw) {
  let score = 4;
  const seriesSignals = ['ランキング', 'おすすめ', 'やり方', '比較', '活用法', '使い方'];
  for (const s of seriesSignals) {
    if (kw.keyword.includes(s)) { score += 3; break; }
  }
  const highSeriesNiches = ['AI / ChatGPT', 'Excel / Office', 'Lập trình', 'Tiết kiệm', 'Học tập'];
  if (highSeriesNiches.includes(kw.niche)) score += 2;
  if (kw.level === 'Broad') score += 2; // Broad → many episodes
  return clamp(score, 0, 10);
}

// ── 7. Long-Tail Expansion Score (0–10) ──────────────────────
function scoreLongTailExpansion(kw, allKws) {
  let score = 3;
  const branches = allKws.filter(k => k.keyword !== kw.keyword && k.keyword.includes(kw.keyword));
  score += Math.min(branches.length, 5);
  if (kw.level === 'Broad') score += 2;
  return clamp(score, 0, 10);
}

// ── 8. Low Risk Score (0–5) ──────────────────────────────────
function scoreLowRisk(kw) {
  let score = 5;
  const kwLower = kw.keyword.toLowerCase();
  for (const marker of RISKY_MARKERS) {
    if (kw.keyword.includes(marker) || kwLower.includes(marker.toLowerCase())) {
      score -= 4;
      break;
    }
  }
  // Check API data for risky channel signals
  if (kw.apiData?.hasRiskyChannels) score -= 2;
  return clamp(score, 0, 5);
}

// ── Recommendation ────────────────────────────────────────────
export function getRecommendation(score) {
  if (score >= 85) return 'Rất đáng làm long video';
  if (score >= 70) return 'Có thể làm long video';
  if (score >= 55) return 'Test nhẹ long video';
  if (score >= 40) return 'Cân nhắc';
  return 'Bỏ qua';
}

// ── Chapter Suggestions ───────────────────────────────────────
function guessChapterType(kw) {
  const k = kw.keyword;
  if (/比較/.test(k)) return 'comparison';
  if (/ランキング|TOP/.test(k)) return 'ranking';
  if (/使い方|やり方|方法|手順|ガイド|入門/.test(k)) return 'tutorial';
  return 'default';
}

export function generateChapters(kw) {
  const type = guessChapterType(kw);
  const base = CHAPTER_TEMPLATES[type] || CHAPTER_TEMPLATES.default;
  return base.map(ch => ch.replace('{kw}', kw.keyword));
}

// ── Title Suggestions ─────────────────────────────────────────
export function generateTitles(kw) {
  return shuffle(TITLE_TEMPLATES).slice(0, 3).map(t => t.replace('{kw}', kw.keyword));
}

// ── Reason Text ───────────────────────────────────────────────
function generateReason(kw) {
  const parts = [];
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

// ── Main Scoring Function ────────────────────────────────────
export function scoreLongFormKeywords(keywords) {
  return keywords.map(kw => {
    const scored = { ...kw };
    scored.demand          = scoreDemand(scored);
    scored.searchIntent    = scoreSearchIntent(scored);
    scored.topicDepth      = scoreTopicDepth(scored);
    scored.smallChannel    = scoreSmallChannel(scored);
    scored.evergreen       = scoreEvergreen(scored);
    scored.seriesPotential = scoreSeriesPotential(scored);
    scored.longTailExp     = scoreLongTailExpansion(scored, keywords);
    scored.lowRisk         = scoreLowRisk(scored);

    scored.longFormScore =
      scored.demand + scored.searchIntent + scored.topicDepth +
      scored.smallChannel + scored.evergreen + scored.seriesPotential +
      scored.longTailExp + scored.lowRisk;

    scored.recommendation = getRecommendation(scored.longFormScore);
    scored.reason         = generateReason(scored);
    scored.chapters       = generateChapters(scored);
    scored.suggestedTitles = generateTitles(scored);
    scored.subKeywords    = keywords
      .filter(k => k.keyword !== scored.keyword && k.keyword.startsWith(scored.keyword))
      .slice(0, 5)
      .map(k => k.keyword);

    return scored;
  });
}
