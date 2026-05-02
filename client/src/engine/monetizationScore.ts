// ============================================================
// engine/monetizationScore.ts — Phase 14: Monetization Score
// Estimates ad revenue potential & channel monetization readiness
// for a keyword based on existing LF scores and niche data.
// ============================================================
import type { Keyword } from '../types';
import type { ContentLanguage } from './languages/index';

// ── Types ─────────────────────────────────────────────────────

export interface MonetizationDimension {
  key: string;
  label: string;
  value: number;   // 0–100
  weight: number;  // Contribution weight (sum to 1.0)
  tip: string;     // Short explanation
}

export interface MonetizationResult {
  totalScore: number;       // 0–100
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  tierColor: string;
  dimensions: MonetizationDimension[];
  estimatedCpm: CpmRange;   // Estimated CPM in USD
  recommendations: string[];
  readyForMonetization: boolean; // Score >= 60
}

export interface CpmRange {
  low: number;
  high: number;
  currency: 'USD';
}

// ── CPM estimates by language/market ─────────────────────────
// Source: rough estimates from public YouTube CPM data (2024-2025)
const MARKET_CPM: Record<ContentLanguage, CpmRange> = {
  ja: { low: 4.0,  high: 12.0, currency: 'USD' },
  ko: { low: 2.5,  high: 8.0,  currency: 'USD' },
  en: { low: 3.0,  high: 15.0, currency: 'USD' },
  vi: { low: 0.5,  high: 2.5,  currency: 'USD' },
};

// ── Niche CPM multipliers ─────────────────────────────────────
// Finance/investing niches pay 2-5× more than entertainment
const NICHE_CPM_MULTIPLIER: Record<string, number> = {
  // High-value niches
  'Finance':      3.5,
  'Investment':   4.0,
  'Business':     3.0,
  'Technology':   2.5,
  'Health':       2.0,
  'Real Estate':  3.5,
  // Mid-value
  'Education':    1.8,
  'Productivity': 1.6,
  'Cooking':      1.2,
  'Travel':       1.4,
  'Lifestyle':    1.0,
  // Lower-value
  'Entertainment': 0.7,
  'Gaming':        0.8,
  'Music':         0.6,
};

// ── Scoring logic ─────────────────────────────────────────────

function getDemandScore(kw: Keyword): number {
  // Demand score from LF engine (0–20) → normalized 0–100
  return Math.round((kw.demand / 20) * 100);
}

function getEvergreenScore(kw: Keyword): number {
  return Math.round((kw.evergreen / 10) * 100);
}

function getSeriesPotentialScore(kw: Keyword): number {
  return Math.round((kw.seriesPotential / 10) * 100);
}

function getTopicDepthScore(kw: Keyword): number {
  return Math.round((kw.topicDepth / 15) * 100);
}

function getViewsScore(kw: Keyword): number {
  const avgViews = kw.apiData?.avgLongVideoViews ?? 0;
  // ≥100k = 100, ≥50k = 75, ≥20k = 50, ≥5k = 30, <5k = 10
  if (avgViews >= 100_000) return 100;
  if (avgViews >= 50_000)  return 75;
  if (avgViews >= 20_000)  return 55;
  if (avgViews >= 5_000)   return 35;
  if (avgViews > 0)        return 20;
  return 0; // No data
}

function getLowRiskScore(kw: Keyword): number {
  return Math.round((kw.lowRisk / 5) * 100);
}

function getNicheMultiplier(niche: string): number {
  // Try exact match first, then partial
  if (NICHE_CPM_MULTIPLIER[niche]) return NICHE_CPM_MULTIPLIER[niche];
  for (const [key, val] of Object.entries(NICHE_CPM_MULTIPLIER)) {
    if (niche.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return 1.0; // Default
}

function scoreToTier(score: number): MonetizationResult['tier'] {
  if (score >= 85) return 'S';
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

const TIER_COLORS: Record<MonetizationResult['tier'], string> = {
  S: '#4ade80',
  A: '#00e5ff',
  B: '#facc15',
  C: '#fb923c',
  D: '#f87171',
};

function buildRecommendations(
  kw: Keyword,
  dims: MonetizationDimension[],
  lang: ContentLanguage,
): string[] {
  const recs: string[] = [];
  const weak = dims.filter(d => d.value < 40).map(d => d.key);

  if (weak.includes('demand')) {
    recs.push('🔍 Nhu cầu tìm kiếm thấp — thử thêm số liệu, nghiên cứu case study để tăng giá trị nội dung.');
  }
  if (weak.includes('evergreen')) {
    recs.push('📅 Chủ đề dễ lỗi thời — kết hợp với angle "timeless" (hướng dẫn cơ bản, giải thích khái niệm).');
  }
  if (weak.includes('views')) {
    recs.push('👁 Chưa có dữ liệu views — phân tích YouTube để xem tiềm năng thực tế của keyword này.');
  }
  if (weak.includes('series')) {
    recs.push('📺 Tiềm năng series thấp — khó duy trì thu nhập ổn định. Xem xét kết hợp với keyword liên quan.');
  }
  if (kw.lowRisk < 3) {
    recs.push('⚠️ Rủi ro bản quyền cao — kiểm tra kỹ trước khi sử dụng âm nhạc hoặc clip bên thứ ba.');
  }
  if (lang === 'vi') {
    recs.push('🇻🇳 CPM thị trường VN thấp hơn JP/EN ~5-10× — cân nhắc tạo nội dung song ngữ hoặc target từ khoá Anh.');
  }
  if (recs.length === 0) {
    recs.push('✅ Keyword này có tiềm năng monetization tốt! Tập trung vào chất lượng thumbnail và tiêu đề để tối đa CTR.');
  }
  return recs;
}

// ── Main function ─────────────────────────────────────────────

export function calculateMonetizationScore(
  kw: Keyword,
  lang: ContentLanguage = 'ja',
): MonetizationResult {
  const dims: MonetizationDimension[] = [
    {
      key: 'demand',
      label: 'Search Demand',
      value: getDemandScore(kw),
      weight: 0.25,
      tip: 'Nhu cầu tìm kiếm từ người dùng — keyword được search nhiều sẽ có view cao hơn.',
    },
    {
      key: 'views',
      label: 'Avg Views (YT)',
      value: getViewsScore(kw),
      weight: 0.20,
      tip: 'Trung bình views/video từ dữ liệu YouTube API — ảnh hưởng trực tiếp đến doanh thu.',
    },
    {
      key: 'evergreen',
      label: 'Evergreen',
      value: getEvergreenScore(kw),
      weight: 0.20,
      tip: 'Nội dung evergreen tích lũy views theo thời gian = thu nhập thụ động dài hạn.',
    },
    {
      key: 'series',
      label: 'Series Potential',
      value: getSeriesPotentialScore(kw),
      weight: 0.15,
      tip: 'Tiềm năng làm nhiều video liên tiếp — subscriber retention và channel authority.',
    },
    {
      key: 'depth',
      label: 'Topic Depth',
      value: getTopicDepthScore(kw),
      weight: 0.10,
      tip: 'Nội dung chuyên sâu thu hút viewer có mua sắm ý định cao → CPM tốt hơn.',
    },
    {
      key: 'risk',
      label: 'Copyright Safety',
      value: getLowRiskScore(kw),
      weight: 0.10,
      tip: 'Video an toàn bản quyền không bị claim → doanh thu không bị chia sẻ.',
    },
  ];

  const totalScore = Math.round(
    dims.reduce((sum, d) => sum + d.value * d.weight, 0),
  );

  const tier = scoreToTier(totalScore);
  const baseCpm = MARKET_CPM[lang] ?? MARKET_CPM.ja;
  const nicheMultiplier = getNicheMultiplier(kw.niche ?? '');

  const estimatedCpm: CpmRange = {
    low:  Math.round(baseCpm.low  * nicheMultiplier * 10) / 10,
    high: Math.round(baseCpm.high * nicheMultiplier * 10) / 10,
    currency: 'USD',
  };

  return {
    totalScore,
    tier,
    tierColor: TIER_COLORS[tier],
    dimensions: dims,
    estimatedCpm,
    recommendations: buildRecommendations(kw, dims, lang),
    readyForMonetization: totalScore >= 60,
  };
}

// ── Batch ranking ─────────────────────────────────────────────

export interface MonetizationRanking {
  keyword: Keyword;
  result: MonetizationResult;
}

export function rankByMonetization(
  keywords: Keyword[],
  lang: ContentLanguage = 'ja',
  limit = 20,
): MonetizationRanking[] {
  return keywords
    .map(kw => ({ keyword: kw, result: calculateMonetizationScore(kw, lang) }))
    .sort((a, b) => b.result.totalScore - a.result.totalScore)
    .slice(0, limit);
}
