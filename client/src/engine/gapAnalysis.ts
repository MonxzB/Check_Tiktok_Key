// ============================================================
// engine/gapAnalysis.ts — Phase 9: Gap Analysis engine
// ============================================================
import type { Keyword } from '../types';

export type GapStatus = 'covered' | 'partial' | 'opportunity';

export interface GapResult {
  keyword: Keyword;
  status: GapStatus;
  matchedVideo?: { videoId: string; title: string };
  similarityScore: number; // 0–1
}

export interface MyVideo {
  videoId: string;
  title: string;
  publishedAt?: string;
  viewCount?: number;
}

// ── Japanese/CJK-aware tokenizer ─────────────────────────────
function tokenizeJP(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  // Split on whitespace and common delimiters
  const parts = lower.split(/[\s　【】「」『』【】・、。,!！?？：:\/\\|\-_~#@]+/).filter(Boolean);
  // Also extract CJK character runs (each 2+ char run as a token)
  const cjkRuns = [...lower.matchAll(/[\u3000-\u9fff\uff00-\uffef]{2,}/g)].map(m => m[0]);
  return [...new Set([...parts, ...cjkRuns])].filter(t => t.length >= 2);
}

function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) { if (setB.has(t)) intersection++; }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Main export ───────────────────────────────────────────────
export function analyzeGap(keywords: Keyword[], myVideos: MyVideo[]): GapResult[] {
  return keywords.map(kw => {
    const kwTokens = tokenizeJP(kw.keyword);

    let bestScore = 0;
    let bestVideo: MyVideo | null = null;

    for (const video of myVideos) {
      const titleTokens = tokenizeJP(video.title);
      const score = jaccardSimilarity(kwTokens, titleTokens);
      if (score > bestScore) { bestScore = score; bestVideo = video; }
    }

    const status: GapStatus =
      bestScore >= 0.5 ? 'covered' :
      bestScore >= 0.2 ? 'partial' :
      'opportunity';

    return {
      keyword: kw,
      status,
      matchedVideo: bestVideo
        ? { videoId: bestVideo.videoId, title: bestVideo.title }
        : undefined,
      similarityScore: parseFloat(bestScore.toFixed(3)),
    };
  });
}

// Convenience: filter to just opportunities
export function getOpportunities(results: GapResult[], minScore = 0): GapResult[] {
  return results
    .filter(r => r.status === 'opportunity' && r.keyword.longFormScore >= minScore)
    .sort((a, b) => b.keyword.longFormScore - a.keyword.longFormScore);
}
