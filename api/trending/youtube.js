// api/trending/youtube.js — Vercel Serverless Function
// Phase 17: Trending Keywords Popup
// Mirrors server/routes/trending.ts but as a Vercel serverless handler.
// POST /api/trending/youtube?regionCode=JP&language=ja
// Body: { apiKeys?: string[] }

// ── In-memory cache (persists across warm invocations) ─────────
const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ── Stop words per language ────────────────────────────────────
const STOP_WORDS = {
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

// ── Tokenize title → candidate keywords ───────────────────────
function tokenizeTitle(title, lang) {
  const clean = title.replace(/[^\p{L}\p{N}\s]/gu, ' ').toLowerCase().trim();
  if (lang === 'ja' || lang === 'ko') {
    const tokens = [];
    const words = clean.split(/\s+/).filter(Boolean);
    for (const word of words) {
      if (word.length >= 2) tokens.push(word);
      for (let i = 0; i < word.length - 1; i++) {
        if (i + 2 <= word.length) tokens.push(word.slice(i, i + 2));
        if (i + 3 <= word.length) tokens.push(word.slice(i, i + 3));
      }
    }
    return tokens;
  }
  return clean.split(/\s+/).filter(w => w.length >= 3);
}

// ── Extract top-N keywords from video list ─────────────────────
function extractKeywords(videos, lang, topN = 10) {
  const stopWords = STOP_WORDS[lang] ?? STOP_WORDS['en'];
  const freq = new Map();

  for (const video of videos) {
    const views = parseInt(video.statistics?.viewCount ?? '0', 10);
    const tokens = tokenizeTitle(video.snippet.title, lang);
    for (const token of tokens) {
      if (stopWords.has(token) || token.length < 2) continue;
      const existing = freq.get(token) ?? { count: 0, totalViews: 0, titles: [] };
      existing.count += 1;
      existing.totalViews += views;
      if (existing.titles.length < 3 && !existing.titles.includes(video.snippet.title)) {
        existing.titles.push(video.snippet.title);
      }
      freq.set(token, existing);
    }
  }

  const scored = [...freq.entries()]
    .filter(([, v]) => v.count >= 2)
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

// ── Handler ────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Health check
  if (req.method === 'GET') {
    return res.json({ status: 'ok', message: 'Trending endpoint ready. Use POST with body { apiKeys }.' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const regionCode = req.query?.regionCode ?? 'JP';
  const language   = req.query?.language   ?? 'ja';
  const cacheKey   = `${regionCode}:${language}`;

  // Check in-memory cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return res.json({ keywords: cached.keywords, fromCache: true });
  }

  // Resolve API key: user-supplied keys take priority over env var
  const { apiKeys } = req.body ?? {};
  const userKeys = (apiKeys ?? []).filter(k => typeof k === 'string' && k.trim());
  const serverKey = process.env.YT_API_KEY;
  const allKeys = [...userKeys, ...(serverKey ? [serverKey] : [])];

  if (allKeys.length === 0) {
    return res.status(503).json({ error: 'No YouTube API key available. Add one in Settings.' });
  }

  const BASE = 'https://www.googleapis.com/youtube/v3';
  let lastError = 'Unknown error';

  for (const apiKey of allKeys) {
    try {
      const url = new URL(`${BASE}/videos`);
      url.searchParams.set('key', apiKey.trim());
      url.searchParams.set('part', 'snippet,statistics');
      url.searchParams.set('chart', 'mostPopular');
      url.searchParams.set('regionCode', regionCode);
      url.searchParams.set('maxResults', '50');
      if (language !== 'en') url.searchParams.set('relevanceLanguage', language);

      const ytRes = await fetch(url.toString());
      const data = await ytRes.json();

      if (data.error) {
        lastError = data.error.message ?? 'YouTube API error';
        if (data.error.code === 403) continue; // quota — try next key
        return res.status(400).json({ error: lastError });
      }

      const videos = data.items ?? [];
      const keywords = extractKeywords(videos, language);

      cache.set(cacheKey, { keywords, fetchedAt: Date.now() });
      return res.json({ keywords, fromCache: false, videoCount: videos.length });

    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ error: lastError });
}
