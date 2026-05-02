// ============================================================
// server/routes/trending.ts — YouTube Trending Keywords endpoint
// Phase 17: Trending popup
//
// POST /api/trending/youtube?regionCode=JP&language=ja
// Body: { apiKeys?: string[] }
//
// Fetches YouTube mostPopular videos → extracts keywords from titles
// Cache: in-memory 6h TTL (+ optional Supabase cache, same TTL)
// Cost: 1 YouTube API unit per fetch (videos.list chart=mostPopular)
// ============================================================
import express, { type Request, type Response, type Router } from 'express';

const router: Router = express.Router();

// ── In-memory cache ───────────────────────────────────────────
interface TrendingCacheEntry {
  keywords: TrendingKeyword[];
  fetchedAt: number;
}
const cache = new Map<string, TrendingCacheEntry>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ── Types ─────────────────────────────────────────────────────
interface TrendingKeyword {
  keyword: string;
  score: number;
  rank: number;
  sampleVideoTitles: string[];
}

interface YtVideoSnippet {
  title: string;
  description?: string;
  channelTitle?: string;
  publishedAt?: string;
}
interface YtVideoStatistics {
  viewCount?: string;
  likeCount?: string;
}
interface YtVideoItem {
  id: string;
  snippet: YtVideoSnippet;
  statistics: YtVideoStatistics;
}
interface YtVideosResponse {
  items?: YtVideoItem[];
  error?: { message?: string; code?: number };
}

// ── Stop words per language ───────────────────────────────────
const STOP_WORDS: Record<string, Set<string>> = {
  ja: new Set(['の','に','は','を','が','で','と','も','な','か','へ','より','から','まで',
    'この','その','あの','する','した','して','いる','ある','なる','れる','られる',
    'これ','それ','あれ','どの','どれ','こと','もの','ところ','なの','です','ます']),
  ko: new Set(['의','에','는','을','가','에서','와','과','도','로','으로','이','그','저',
    '것','수','하다','있다','없다','되다','이다','한','한국','대한']),
  en: new Set(['the','a','an','in','on','at','to','for','of','and','or','but','is','was',
    'are','were','be','been','has','have','had','do','does','did','will','would',
    'can','could','this','that','these','those','with','from','by','as','it','its']),
  vi: new Set(['và','của','là','có','được','cho','trong','với','không','một','này','đó',
    'các','đã','sẽ','bị','tôi','bạn','họ','chúng','những','người','năm','về']),
};

// ── Tokenize a video title → candidate keywords ───────────────
function tokenizeTitle(title: string, lang: string): string[] {
  // Remove special chars, lowercase
  const clean = title.replace(/[^\p{L}\p{N}\s]/gu, ' ').toLowerCase().trim();

  // For CJK languages, use character n-grams (2-4 chars) as pseudo-tokens
  if (lang === 'ja' || lang === 'ko') {
    const tokens: string[] = [];
    const words = clean.split(/\s+/).filter(Boolean);
    for (const word of words) {
      if (word.length >= 2) tokens.push(word);
      // Also add 2-char and 3-char substrings for CJK
      for (let i = 0; i < word.length - 1; i++) {
        if (i + 2 <= word.length) tokens.push(word.slice(i, i + 2));
        if (i + 3 <= word.length) tokens.push(word.slice(i, i + 3));
      }
    }
    return tokens;
  }

  // Latin: split by whitespace
  return clean.split(/\s+/).filter(w => w.length >= 3);
}

// ── Extract top-N keywords from video list ────────────────────
function extractKeywords(
  videos: YtVideoItem[],
  lang: string,
  topN = 10,
): TrendingKeyword[] {
  const stopWords = STOP_WORDS[lang] ?? STOP_WORDS['en'];
  const freq = new Map<string, { count: number; totalViews: number; titles: string[] }>();

  for (const video of videos) {
    const views = parseInt(video.statistics?.viewCount ?? '0', 10);
    const tokens = tokenizeTitle(video.snippet.title, lang);

    for (const token of tokens) {
      if (stopWords.has(token)) continue;
      if (token.length < 2) continue;
      const existing = freq.get(token) ?? { count: 0, totalViews: 0, titles: [] };
      existing.count += 1;
      existing.totalViews += views;
      if (existing.titles.length < 3 && !existing.titles.includes(video.snippet.title)) {
        existing.titles.push(video.snippet.title);
      }
      freq.set(token, existing);
    }
  }

  // Score = frequency * log(totalViews + 1), normalized to 0-100
  const scored = [...freq.entries()]
    .filter(([, v]) => v.count >= 2) // at least 2 occurrences
    .map(([keyword, v]) => ({
      keyword,
      rawScore: v.count * Math.log(v.totalViews + 1),
      titles: v.titles,
    }))
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, topN);

  if (scored.length === 0) return [];

  const maxScore = scored[0].rawScore;
  return scored.map((s, i) => ({
    keyword: s.keyword,
    score: Math.round((s.rawScore / maxScore) * 100),
    rank: i + 1,
    sampleVideoTitles: s.titles,
  }));
}

// ── Route ─────────────────────────────────────────────────────
// POST so API keys can be sent in body (not query string)
router.post('/youtube', async (req: Request, res: Response) => {
  const regionCode = (req.query['regionCode'] as string | undefined) ?? 'JP';
  const language   = (req.query['language']   as string | undefined) ?? 'ja';
  const { apiKeys } = req.body as { apiKeys?: string[] };

  const cacheKey = `${regionCode}:${language}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    res.json({ keywords: cached.keywords, fromCache: true });
    return;
  }

  // Resolve API key
  const userKeys = (apiKeys ?? []).filter((k: string) => k?.trim());
  const serverKey = process.env.YT_API_KEY;
  const allKeys = [...userKeys, ...(serverKey ? [serverKey] : [])];

  if (allKeys.length === 0) {
    res.status(503).json({ error: 'No YouTube API key available. Add one in Settings.' });
    return;
  }

  const BASE = 'https://www.googleapis.com/youtube/v3';
  let lastError = 'Unknown error';

  for (const apiKey of allKeys) {
    try {
      const url = new URL(`${BASE}/videos`);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('part', 'snippet,statistics');
      url.searchParams.set('chart', 'mostPopular');
      url.searchParams.set('regionCode', regionCode);
      url.searchParams.set('maxResults', '50');
      if (language !== 'en') url.searchParams.set('relevanceLanguage', language);

      const ytRes = await fetch(url.toString());
      const data = await ytRes.json() as YtVideosResponse;

      if (data.error) {
        lastError = data.error.message ?? 'YouTube API error';
        if (data.error.code === 403) continue; // quota exhausted, try next key
        res.status(400).json({ error: lastError });
        return;
      }

      const videos = data.items ?? [];
      const keywords = extractKeywords(videos, language);

      cache.set(cacheKey, { keywords, fetchedAt: Date.now() });
      res.json({ keywords, fromCache: false, videoCount: videos.length });
      return;

    } catch (err) {
      lastError = (err as Error).message;
    }
  }

  res.status(500).json({ error: lastError });
});

// GET: health check (for client to verify endpoint exists)
router.get('/youtube', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Trending endpoint ready. Use POST with body { apiKeys }.' });
});

export default router;
