// ============================================================
// server/routes/youtube.ts — Long-form YouTube API proxy
// ============================================================
import express, {
  type Request, type Response, type Router,
} from 'express';

const router: Router = express.Router();

// ── In-memory cache ───────────────────────────────────────────
interface CacheEntry<T> { data: T; ts: number; }
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
}

// ── Types ─────────────────────────────────────────────────────
interface AnalyzeRequestBody {
  keyword?: string;
  apiKeys?: string[];
  minDurationMin?: number;
  timeWindowDays?: number;
  maxResults?: number;
  orderBy?: string;
  regionCode?: string;
  languageCode?: string;
}

interface YtSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
  };
}

interface YtVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails: { duration: string };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

interface YtChannelItem {
  id: string;
  snippet: { title: string };
  statistics: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
}

interface RawVideo {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  durationSec: number;
  durationFormatted: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isShort: boolean;
  videoUrl: string;
}

interface ChannelInfo {
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

// ── Helpers ───────────────────────────────────────────────────
const BASE = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  apiKey: string,
): Promise<unknown> {
  const url = new URL(BASE + path);
  url.searchParams.set('key', apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
  }
  return res.json();
}

function parseDuration(str: string): number {
  if (!str) return 0;
  const m = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

function formatDuration(sec: number): string {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function isShort(durationSec: number, title = '', description = ''): boolean {
  if (durationSec > 0 && durationSec <= 60) return true;
  const text = (title + ' ' + description).toLowerCase();
  return /#shorts|#short\b/.test(text);
}

const RISKY = ['アニメ','ドラマ','映画','アイドル','スポーツ','テレビ','TV','芸能人','漫画全話','切り抜き','名場面','転載'];
function detectRisky(title = '', description = '', channelTitle = ''): boolean {
  const text = title + ' ' + description + ' ' + channelTitle;
  return RISKY.some(r => text.includes(r));
}

function computeLongFormFitScore(
  viewCount: number, subscriberCount: number, durationSec: number, minDurationSec: number,
): number {
  let score = 50;
  if (durationSec >= minDurationSec * 2) score += 15;
  else if (durationSec >= minDurationSec) score += 5;
  const ratio = subscriberCount > 0 ? viewCount / subscriberCount : 0;
  if (ratio >= 5) score += 20;
  else if (ratio >= 1) score += 10;
  else if (ratio >= 0.5) score += 5;
  if (viewCount >= 100000) score += 10;
  else if (viewCount >= 30000) score += 5;
  return Math.min(score, 100);
}

function computeChannelFitScore(
  subscriberCount: number, longVideosFound: number, bestViewSubRatio: number,
): number {
  let score = 50;
  if (subscriberCount > 0 && subscriberCount <= 10000 && bestViewSubRatio >= 5) score += 30;
  else if (subscriberCount <= 100000 && bestViewSubRatio >= 1) score += 20;
  if (longVideosFound >= 5) score += 10;
  else if (longVideosFound >= 2) score += 5;
  return Math.min(score, 100);
}

// ── GET /api/youtube/status ───────────────────────────────────
router.get('/status', (req: Request, res: Response) => {
  const configured = !!process.env.YT_API_KEY;
  res.json({ configured, message: configured ? '🔑 YouTube API Key đã cấu hình' : '⚠️ Chưa cấu hình YT_API_KEY' });
});

// ── POST /api/youtube/status (with user keys) ─────────────────
router.post('/status', (req: Request, res: Response) => {
  const { apiKeys } = req.body as { apiKeys?: string[] };
  const userKeys = (apiKeys ?? []).filter((k: string) => k?.trim());
  const configured = !!process.env.YT_API_KEY || userKeys.length > 0;
  res.json({ configured, message: configured ? '🔑 API Key đã cấu hình' : '⚠️ Chưa cấu hình API Key' });
});

// ── POST /api/youtube/analyze ─────────────────────────────────
router.post('/analyze', async (req: Request, res: Response) => {
  const {
    keyword,
    apiKeys,
    minDurationMin = 8,
    timeWindowDays = 180,
    maxResults = 25,
    orderBy = 'relevance',
    regionCode = 'JP',
    languageCode = 'ja',
  } = req.body as AnalyzeRequestBody;

  if (!keyword) { res.status(400).json({ error: 'Cần truyền keyword' }); return; }

  // Determine which API key to use: user keys first, then server env key
  const userKeys = (apiKeys ?? []).filter(k => k?.trim());
  const serverKey = process.env.YT_API_KEY;
  const allKeys = [...userKeys, ...(serverKey ? [serverKey] : [])];

  if (!allKeys.length) { res.status(503).json({ error: 'Chưa có API Key. Vui lòng cài đặt API Key.' }); return; }

  const minDurationSec = (minDurationMin as number) * 60;
  const cacheKey = `${keyword}|${minDurationMin}|${timeWindowDays}|${orderBy}|${regionCode}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) { res.json({ ...(cached as object), fromCache: true }); return; }

  // Try each key until one works
  let lastError: string = 'Unknown error';
  let usedKeyIdx = -1;

  for (let i = 0; i < allKeys.length; i++) {
    const apiKey = allKeys[i];
    try {
      const publishedAfter = (timeWindowDays as number) < 3650
        ? new Date(Date.now() - (timeWindowDays as number) * 86400000).toISOString()
        : undefined;

      // Step 1: Search
      const searchData = await ytFetch('/search', {
        part: 'snippet', q: keyword, type: 'video',
        regionCode, relevanceLanguage: languageCode,
        maxResults, order: orderBy, publishedAfter,
      }, apiKey) as { items?: YtSearchItem[] };

      const videoIds = (searchData.items ?? []).map(item => item.id.videoId).filter(Boolean);
      if (!videoIds.length) {
        res.json({ videos: [], channels: [], summary: { longVideosFound: 0 } });
        return;
      }

      // Step 2: Video details
      const videoData = await ytFetch('/videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoIds.join(','),
      }, apiKey) as { items?: YtVideoItem[] };

      const channelIds = new Set<string>();
      const rawVideos: RawVideo[] = (videoData.items ?? []).map(item => {
        const dur = parseDuration(item.contentDetails?.duration);
        const snippet = item.snippet ?? {};
        const stats = item.statistics ?? {};
        channelIds.add(snippet.channelId);
        return {
          videoId: item.id,
          title: snippet.title || '',
          description: (snippet.description || '').slice(0, 200),
          channelId: snippet.channelId,
          channelTitle: snippet.channelTitle || '',
          publishedAt: snippet.publishedAt || '',
          durationSec: dur,
          durationFormatted: formatDuration(dur),
          viewCount: parseInt(stats.viewCount || '0'),
          likeCount: parseInt(stats.likeCount || '0'),
          commentCount: parseInt(stats.commentCount || '0'),
          isShort: isShort(dur, snippet.title, snippet.description),
          videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        };
      });

      // Step 3: Filter shorts
      const longVideos = rawVideos.filter(v => !v.isShort && v.durationSec >= minDurationSec);

      // Step 4: Channel details
      const channelMap: Record<string, ChannelInfo> = {};
      if (channelIds.size > 0) {
        const chData = await ytFetch('/channels', {
          part: 'snippet,statistics',
          id: [...channelIds].join(','),
        }, apiKey) as { items?: YtChannelItem[] };
        for (const ch of (chData.items ?? [])) {
          channelMap[ch.id] = {
            channelId: ch.id,
            channelTitle: ch.snippet?.title || '',
            channelUrl: `https://www.youtube.com/channel/${ch.id}`,
            subscriberCount: parseInt(ch.statistics?.subscriberCount || '0'),
            viewCount: parseInt(ch.statistics?.viewCount || '0'),
            videoCount: parseInt(ch.statistics?.videoCount || '0'),
          };
        }
      }

      // Step 5: Enrich videos
      const refVideos = longVideos.map(v => {
        const ch = channelMap[v.channelId] ?? ({} as Partial<ChannelInfo>);
        const sub = ch.subscriberCount || 1;
        const ratio = v.viewCount / sub;
        const isRisky = detectRisky(v.title, v.description, v.channelTitle);
        return {
          keyword,
          ...v,
          subscriberCount: sub,
          channelUrl: ch.channelUrl || `https://www.youtube.com/channel/${v.channelId}`,
          viewSubRatio: parseFloat(ratio.toFixed(2)),
          longFormFitScore: computeLongFormFitScore(v.viewCount, sub, v.durationSec, minDurationSec),
          riskNotes: isRisky ? 'Có dấu hiệu nội dung rủi ro' : '',
          isRisky,
        };
      }).sort((a, b) => b.longFormFitScore - a.longFormFitScore);

      // Step 6: Build channels
      const channelVideoMap: Record<string, typeof refVideos> = {};
      for (const v of refVideos) {
        if (!channelVideoMap[v.channelId]) channelVideoMap[v.channelId] = [];
        channelVideoMap[v.channelId].push(v);
      }

      const refChannels = Object.values(channelMap)
        .map(ch => {
          const chVideos = channelVideoMap[ch.channelId] ?? [];
          const sortedVideos = [...chVideos].sort((a, b) => b.viewCount - a.viewCount);
          const bestVideo = sortedVideos[0];
          const bestRatio = bestVideo ? bestVideo.viewSubRatio : 0;
          const isSmall = ch.subscriberCount > 0 && ch.subscriberCount <= 100000;
          const isRisky = chVideos.some(v => v.isRisky);
          const fitScore = computeChannelFitScore(ch.subscriberCount, chVideos.length, bestRatio);
          return {
            keyword,
            ...ch,
            relatedLongVideos: chVideos.length,
            bestVideoTitle: bestVideo?.title || '',
            bestVideoUrl: bestVideo?.videoUrl || '',
            bestVideoViews: bestVideo?.viewCount || 0,
            bestViewSubRatio: bestRatio,
            fitScore,
            recommendation: fitScore >= 70 ? 'Kênh tham khảo tốt' : fitScore >= 50 ? 'Tham khảo được' : 'Ít phù hợp',
            reason: isSmall
              ? `Kênh nhỏ (${(ch.subscriberCount/1000).toFixed(1)}k sub), ratio ${bestRatio.toFixed(1)}`
              : `Kênh lớn (${(ch.subscriberCount/1000).toFixed(0)}k sub)`,
            riskNotes: isRisky ? 'Một số video có dấu hiệu rủi ro' : '',
            isRisky,
            isSmallOpportunity: isSmall && bestRatio >= 1,
          };
        })
        .filter(ch => ch.relatedLongVideos > 0)
        .sort((a, b) => b.fitScore - a.fitScore);

      // Step 7: Summary
      const avgViews = refVideos.length > 0
        ? refVideos.reduce((s, v) => s + v.viewCount, 0) / refVideos.length : 0;
      const bestRatio = refVideos.reduce((max, v) => Math.max(max, v.viewSubRatio), 0);

      const summary = {
        longVideosFound: refVideos.length,
        avgLongVideoViews: Math.round(avgViews),
        bestViewSubRatio: parseFloat(bestRatio.toFixed(2)),
        hasSmallChannelOpportunity: refChannels.some(ch => ch.isSmallOpportunity),
        hasRiskyChannels: refChannels.some(ch => ch.isRisky),
        refChannels: refChannels.slice(0, 5).map(ch => ch.channelTitle),
        refVideoTitles: refVideos.slice(0, 5).map(v => v.title),
        collectedAt: new Date().toISOString(),
        timeWindowDays, regionCode, languageCode,
      };

      usedKeyIdx = i;
      const result = { videos: refVideos, channels: refChannels, summary, usedKeyIdx };
      cacheSet(cacheKey, result);
      res.json(result);
      return;

    } catch (err) {
      lastError = (err as Error).message;
      console.error(`[YouTube] Key #${i} failed:`, lastError);
    }
  }

  res.status(500).json({ error: lastError });
});

export default router;
