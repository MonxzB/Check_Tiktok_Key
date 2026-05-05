// ============================================================
// api/reup-advisor/index.js — Vercel Serverless Function
// POST /api/reup-advisor
// Fetches YouTube video metadata, returns VideoMeta object
// ============================================================

const BASE_YT = 'https://www.googleapis.com/youtube/v3';

// ISO 8601 duration → seconds
function parseDuration(str) {
  if (!str) return 0;
  const m = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

// YouTube category ID → name
const CATEGORY_NAMES = {
  '1': 'Film & Animation', '2': 'Autos & Vehicles', '10': 'Music',
  '15': 'Pets & Animals', '17': 'Sports', '19': 'Travel & Events',
  '20': 'Gaming', '22': 'People & Blogs', '23': 'Comedy',
  '24': 'Entertainment', '25': 'News & Politics', '26': 'Howto & Style',
  '27': 'Education', '28': 'Science & Technology', '29': 'Nonprofits & Activism',
};

// Detect official artist channel from channel title heuristics
function detectOfficialArtist(channelTitle = '', tags = []) {
  const lower = channelTitle.toLowerCase();
  const officialMarkers = ['official', 'vevo', 'records', 'music', 'band'];
  return officialMarkers.some(m => lower.includes(m));
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { videoId } = req.body || {};
  if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
    return res.status(400).json({ error: 'Cần truyền videoId hợp lệ (11 ký tự)' });
  }

  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'YT_API_KEY chưa được cấu hình trên server' });
  }

  try {
    // Fetch video details (1 API unit)
    const videoUrl = `${BASE_YT}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      const err = await videoRes.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || 'YouTube API error' });
    }
    const videoData = await videoRes.json();
    const item = videoData.items?.[0];
    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy video. Có thể video là private hoặc đã bị xóa.' });
    }

    const snippet = item.snippet || {};
    const stats = item.statistics || {};
    const duration = parseDuration(item.contentDetails?.duration);
    const categoryId = snippet.categoryId || '0';
    const tags = (snippet.tags || []).slice(0, 10); // limit to 10 tags

    // Fetch channel subscriber count (1 API unit)
    let channelSubs = 0;
    if (snippet.channelId) {
      const chUrl = `${BASE_YT}/channels?part=statistics&id=${snippet.channelId}&key=${apiKey}`;
      const chRes = await fetch(chUrl);
      if (chRes.ok) {
        const chData = await chRes.json();
        channelSubs = parseInt(chData.items?.[0]?.statistics?.subscriberCount || '0');
      }
    }

    const videoMeta = {
      videoId,
      title: snippet.title || '',
      duration,
      category: CATEGORY_NAMES[categoryId] || 'Unknown',
      categoryId,
      viewCount: parseInt(stats.viewCount || '0'),
      likeCount: parseInt(stats.likeCount || '0'),
      commentCount: parseInt(stats.commentCount || '0'),
      publishedAt: snippet.publishedAt || new Date().toISOString(),
      channelId: snippet.channelId || '',
      channelTitle: snippet.channelTitle || '',
      channelSubs,
      tags,
      hasTranscript: false, // YouTube API doesn't expose this directly
      isOfficialArtist: detectOfficialArtist(snippet.channelTitle, tags),
    };

    return res.json({ videoMeta });

  } catch (err) {
    console.error('[reup-advisor] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
