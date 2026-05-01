// ============================================================
// server/routes/channelTracker.ts — Phase 7 competitor endpoint
// POST /api/youtube/channel-videos
// ============================================================
import express, { type Request, type Response, type Router } from 'express';

const router: Router = express.Router();
const BASE = 'https://www.googleapis.com/youtube/v3';

interface ChannelVideosBody {
  channelIds: string[];
  apiKeys?: string[];
  maxPerChannel?: number;
}

interface YtSearchItem {
  id: { videoId?: string };
  snippet: {
    title: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    thumbnails?: { medium?: { url: string }; default?: { url: string } };
  };
}

interface YtVideoDetail {
  id: string;
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
}

function parseDuration(str: string): number {
  if (!str) return 0;
  const m = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

async function ytFetch(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  apiKey: string,
): Promise<unknown> {
  const url = new URL(BASE + path);
  url.searchParams.set('key', apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
  }
  return res.json();
}

// ── POST /api/youtube/channel-videos ─────────────────────────
router.post('/channel-videos', async (req: Request, res: Response) => {
  const { channelIds, apiKeys, maxPerChannel = 10 } = req.body as ChannelVideosBody;

  if (!channelIds?.length) {
    res.status(400).json({ error: 'channelIds required' });
    return;
  }

  const userKeys = (apiKeys ?? []).filter(k => k?.trim());
  const serverKey = process.env.YT_API_KEY;
  const allKeys = [...userKeys, ...(serverKey ? [serverKey] : [])];

  if (!allKeys.length) {
    res.status(503).json({ error: 'No API key configured' });
    return;
  }

  const apiKey = allKeys[0];
  const allVideos: object[] = [];

  for (const channelId of channelIds) {
    try {
      // Search recent videos by channelId
      const searchData = await ytFetch('/search', {
        part: 'snippet',
        channelId,
        type: 'video',
        order: 'date',
        maxResults: maxPerChannel,
      }, apiKey) as { items?: YtSearchItem[] };

      const items = searchData.items ?? [];
      const videoIds = items.map(i => i.id.videoId).filter(Boolean) as string[];

      if (!videoIds.length) continue;

      // Fetch video details for duration + views
      const detailData = await ytFetch('/videos', {
        part: 'contentDetails,statistics',
        id: videoIds.join(','),
      }, apiKey) as { items?: YtVideoDetail[] };

      const detailMap: Record<string, YtVideoDetail> = {};
      for (const d of (detailData.items ?? [])) {
        detailMap[d.id] = d;
      }

      for (const item of items) {
        const vid = item.id.videoId;
        if (!vid) continue;
        const detail = detailMap[vid];
        const durationSec = detail ? parseDuration(detail.contentDetails.duration) : 0;
        const viewCount = detail ? parseInt(detail.statistics.viewCount || '0') : 0;
        const thumb =
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`;

        allVideos.push({
          channelId,
          videoId: vid,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          viewCount,
          durationSec,
          thumbnailUrl: thumb,
          videoUrl: `https://www.youtube.com/watch?v=${vid}`,
        });
      }
    } catch (err) {
      console.error(`[ChannelTracker] Channel ${channelId} failed:`, (err as Error).message);
    }
  }

  // Sort all videos by date desc
  allVideos.sort((a, b) =>
    new Date((b as { publishedAt: string }).publishedAt).getTime() -
    new Date((a as { publishedAt: string }).publishedAt).getTime()
  );

  res.json({ videos: allVideos });
});

export default router;
