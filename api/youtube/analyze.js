// api/youtube/analyze.js — Vercel Serverless Function
// Ported from server/routes/youtube.js, using native fetch (Node 18+)

// ── In-memory cache (persists across warm invocations) ────────
const cache = new Map();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) { cache.set(key, { data, ts: Date.now() }); }

// ── Helpers ───────────────────────────────────────────────────
const BASE = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(path, params) {
  const url = new URL(BASE + path);
  url.searchParams.set('key', process.env.YT_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
  }
  return res.json();
}

function parseDuration(str) {
  if (!str) return 0;
  const m = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

function formatDuration(sec) {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function isShort(durationSec, title = '', description = '') {
  if (durationSec > 0 && durationSec <= 60) return true;
  return /#shorts|#short\b/.test((title + ' ' + description).toLowerCase());
}

const RISKY = ['アニメ','ドラマ','映画','アイドル','スポーツ','テレビ','TV','芸能人','漫画全話','切り抜き','名場面','転載'];
function detectRisky(title = '', description = '', channelTitle = '') {
  const text = title + ' ' + description + ' ' + channelTitle;
  return RISKY.some(r => text.includes(r));
}

function computeLongFormFitScore({ viewCount, subscriberCount, durationSec, minDurationSec }) {
  let score = 50;
  if (durationSec >= minDurationSec * 2) score += 15;
  else if (durationSec >= minDurationSec) score += 5;
  const ratio = subscriberCount > 0 ? viewCount / subscriberCount : 0;
  if (ratio >= 5) score += 20; else if (ratio >= 1) score += 10; else if (ratio >= 0.5) score += 5;
  if (viewCount >= 100000) score += 10; else if (viewCount >= 30000) score += 5;
  return Math.min(score, 100);
}

function computeChannelFitScore({ subscriberCount, longVideosFound, bestViewSubRatio }) {
  let score = 50;
  if (subscriberCount > 0 && subscriberCount <= 10000 && bestViewSubRatio >= 5) score += 30;
  else if (subscriberCount <= 100000 && bestViewSubRatio >= 1) score += 20;
  if (longVideosFound >= 5) score += 10; else if (longVideosFound >= 2) score += 5;
  return Math.min(score, 100);
}

// ── Handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.YT_API_KEY) return res.status(503).json({ error: 'Server chưa cấu hình YT_API_KEY' });

  const {
    keyword, minDurationMin = 8, timeWindowDays = 180,
    maxResults = 25, orderBy = 'relevance', regionCode = 'JP', languageCode = 'ja',
  } = req.body || {};

  if (!keyword) return res.status(400).json({ error: 'Cần truyền keyword' });

  const minDurationSec = minDurationMin * 60;
  const cacheKey = `${keyword}|${minDurationMin}|${timeWindowDays}|${orderBy}|${regionCode}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const publishedAfter = timeWindowDays < 3650
      ? new Date(Date.now() - timeWindowDays * 86400000).toISOString()
      : undefined;

    const searchData = await ytFetch('/search', {
      part: 'snippet', q: keyword, type: 'video',
      regionCode, relevanceLanguage: languageCode,
      maxResults, order: orderBy, publishedAfter,
    });

    const videoIds = (searchData.items || []).map(i => i.id.videoId).filter(Boolean);
    if (!videoIds.length) return res.json({ videos: [], channels: [], summary: { longVideosFound: 0 } });

    const videoData = await ytFetch('/videos', { part: 'snippet,contentDetails,statistics', id: videoIds.join(',') });

    const channelIds = new Set();
    const rawVideos = (videoData.items || []).map(item => {
      const dur = parseDuration(item.contentDetails?.duration);
      const snippet = item.snippet || {};
      const stats = item.statistics || {};
      channelIds.add(snippet.channelId);
      return {
        videoId: item.id, title: snippet.title || '',
        description: (snippet.description || '').slice(0, 200),
        channelId: snippet.channelId, channelTitle: snippet.channelTitle || '',
        publishedAt: snippet.publishedAt || '', durationSec: dur,
        durationFormatted: formatDuration(dur),
        viewCount: parseInt(stats.viewCount || 0), likeCount: parseInt(stats.likeCount || 0),
        commentCount: parseInt(stats.commentCount || 0),
        isShort: isShort(dur, snippet.title, snippet.description),
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
      };
    });

    const longVideos = rawVideos.filter(v => !v.isShort && v.durationSec >= minDurationSec);

    let channelMap = {};
    if (channelIds.size > 0) {
      const chData = await ytFetch('/channels', { part: 'snippet,statistics', id: [...channelIds].join(',') });
      for (const ch of (chData.items || [])) {
        channelMap[ch.id] = {
          channelId: ch.id, channelTitle: ch.snippet?.title || '',
          channelUrl: `https://www.youtube.com/channel/${ch.id}`,
          subscriberCount: parseInt(ch.statistics?.subscriberCount || 0),
          viewCount: parseInt(ch.statistics?.viewCount || 0),
          videoCount: parseInt(ch.statistics?.videoCount || 0),
        };
      }
    }

    const refVideos = longVideos.map(v => {
      const ch = channelMap[v.channelId] || {};
      const sub = ch.subscriberCount || 1;
      const ratio = v.viewCount / sub;
      const isRisky = detectRisky(v.title, v.description, v.channelTitle);
      return {
        keyword, ...v, subscriberCount: sub,
        channelUrl: ch.channelUrl || `https://www.youtube.com/channel/${v.channelId}`,
        viewSubRatio: parseFloat(ratio.toFixed(2)),
        longFormFitScore: computeLongFormFitScore({ viewCount: v.viewCount, subscriberCount: sub, durationSec: v.durationSec, minDurationSec }),
        riskNotes: isRisky ? 'Có dấu hiệu nội dung rủi ro' : '',
        isRisky,
      };
    }).sort((a, b) => b.longFormFitScore - a.longFormFitScore);

    const channelVideoMap = {};
    for (const v of refVideos) {
      if (!channelVideoMap[v.channelId]) channelVideoMap[v.channelId] = [];
      channelVideoMap[v.channelId].push(v);
    }

    const refChannels = Object.values(channelMap).map(ch => {
      const chVideos = channelVideoMap[ch.channelId] || [];
      const bestVideo = [...chVideos].sort((a, b) => b.viewCount - a.viewCount)[0];
      const bestRatio = bestVideo ? bestVideo.viewSubRatio : 0;
      const isSmall = ch.subscriberCount > 0 && ch.subscriberCount <= 100000;
      const isRisky = chVideos.some(v => v.isRisky);
      const fitScore = computeChannelFitScore({ subscriberCount: ch.subscriberCount, longVideosFound: chVideos.length, bestViewSubRatio: bestRatio });
      return {
        keyword, ...ch, relatedLongVideos: chVideos.length,
        bestVideoTitle: bestVideo?.title || '', bestVideoUrl: bestVideo?.videoUrl || '',
        bestVideoViews: bestVideo?.viewCount || 0, bestViewSubRatio: bestRatio,
        fitScore, recommendation: fitScore >= 70 ? 'Kênh tham khảo tốt' : fitScore >= 50 ? 'Tham khảo được' : 'Ít phù hợp',
        reason: isSmall ? `Kênh nhỏ (${(ch.subscriberCount/1000).toFixed(1)}k sub), ratio ${bestRatio.toFixed(1)}` : `Kênh lớn (${(ch.subscriberCount/1000).toFixed(0)}k sub)`,
        riskNotes: isRisky ? 'Một số video có dấu hiệu rủi ro' : '',
        isRisky, isSmallOpportunity: isSmall && bestRatio >= 1,
      };
    }).filter(ch => ch.relatedLongVideos > 0).sort((a, b) => b.fitScore - a.fitScore);

    const avgViews = refVideos.length > 0 ? refVideos.reduce((s, v) => s + v.viewCount, 0) / refVideos.length : 0;
    const bestRatio = refVideos.reduce((max, v) => Math.max(max, v.viewSubRatio), 0);

    const summary = {
      longVideosFound: refVideos.length, avgLongVideoViews: Math.round(avgViews),
      bestViewSubRatio: parseFloat(bestRatio.toFixed(2)),
      hasSmallChannelOpportunity: refChannels.some(ch => ch.isSmallOpportunity),
      hasRiskyChannels: refChannels.some(ch => ch.isRisky),
      refChannels: refChannels.slice(0,5).map(ch => ch.channelTitle),
      refVideoTitles: refVideos.slice(0,5).map(v => v.title),
      collectedAt: new Date().toISOString(), timeWindowDays, regionCode, languageCode,
    };

    const result = { videos: refVideos, channels: refChannels, summary };
    cacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[YouTube Analyze Error]', err.message);
    res.status(500).json({ error: err.message });
  }
}
