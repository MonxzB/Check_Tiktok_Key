// ============================================================
// server/routes/oauthYoutube.ts — Phase 9: Google OAuth 2.0
// Endpoints:
//   GET  /api/oauth/youtube/auth-url  → returns Google OAuth URL
//   GET  /api/oauth/youtube/callback  → handles code, stores tokens, redirects
//   POST /api/oauth/youtube/disconnect → revokes & removes connection
//   GET  /api/oauth/youtube/videos    → fetches user channel video list
// ============================================================
import express, { type Request, type Response, type Router } from 'express';

const router: Router = express.Router();

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE = 'https://oauth2.googleapis.com/revoke';
const YT_API = 'https://www.googleapis.com/youtube/v3';

function getConfig() {
  return {
    clientId:     process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:  process.env.OAUTH_CALLBACK_URL || 'http://localhost:3001/api/oauth/youtube/callback',
    clientAppUrl: process.env.CLIENT_APP_URL || 'http://localhost:5173',
    supabaseUrl:  process.env.SUPABASE_URL || '',
    supabaseKey:  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
}

function isConfigured(): boolean {
  const c = getConfig();
  return !!(c.clientId && c.clientSecret && c.supabaseUrl && c.supabaseKey);
}

// ── Supabase REST helper (server-side, service role) ──────────
async function supabaseRpc(
  path: string,
  method: string,
  supabaseUrl: string,
  serviceKey: string,
  body?: object,
): Promise<unknown> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Supabase error ${res.status}: ${txt}`);
  }
  return res.json().catch(() => null);
}

// ── GET /api/oauth/youtube/status ─────────────────────────────
router.get('/status', (req: Request, res: Response) => {
  res.json({ configured: isConfigured() });
});

// ── GET /api/oauth/youtube/auth-url ──────────────────────────
// Query: ?user_id=<supabase_user_id>
router.get('/auth-url', (req: Request, res: Response) => {
  const { user_id } = req.query as { user_id?: string };
  if (!user_id) { res.status(400).json({ error: 'user_id required' }); return; }
  if (!isConfigured()) { res.status(503).json({ error: 'OAuth not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY to server .env' }); return; }

  const { clientId, callbackUrl } = getConfig();
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  callbackUrl,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/youtube.readonly',
    access_type:   'offline',
    prompt:        'consent',
    state:         user_id,
  });
  res.json({ url: `${GOOGLE_AUTH}?${params}` });
});

// ── GET /api/oauth/youtube/callback ──────────────────────────
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state: userId, error } = req.query as Record<string, string>;
  const { clientId, clientSecret, callbackUrl, clientAppUrl, supabaseUrl, supabaseKey } = getConfig();

  if (error) {
    res.redirect(`${clientAppUrl}?yt_oauth=error&msg=${encodeURIComponent(error)}`);
    return;
  }
  if (!code || !userId) {
    res.redirect(`${clientAppUrl}?yt_oauth=error&msg=missing_params`);
    return;
  }

  try {
    // 1. Exchange code → tokens
    const tokenRes = await fetch(GOOGLE_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: callbackUrl, grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json() as {
      access_token: string; refresh_token: string; expires_in: number;
    };
    if (!tokens.access_token) throw new Error('No access token');

    // 2. Get channel info
    const chRes = await fetch(
      `${YT_API}/channels?part=snippet,statistics&mine=true&key=`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    const chData = await chRes.json() as {
      items?: Array<{
        id: string;
        snippet: { title: string; thumbnails?: { default?: { url: string } } };
        statistics?: { subscriberCount?: string };
      }>
    };
    const ch = chData.items?.[0];
    if (!ch) throw new Error('No channel found');

    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    // 3. Store in Supabase
    await supabaseRpc('user_youtube_connections', 'POST', supabaseUrl, supabaseKey, {
      user_id:          userId,
      channel_id:       ch.id,
      channel_title:    ch.snippet.title,
      channel_thumb:    ch.snippet.thumbnails?.default?.url || '',
      subscriber_count: parseInt(ch.statistics?.subscriberCount || '0'),
      refresh_token:    tokens.refresh_token || '',
      access_token:     tokens.access_token,
      token_expires_at: expiresAt,
      updated_at:       new Date().toISOString(),
    });

    res.redirect(`${clientAppUrl}?yt_oauth=success&channel=${encodeURIComponent(ch.snippet.title)}`);
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[OAuth callback error]', msg);
    res.redirect(`${clientAppUrl}?yt_oauth=error&msg=${encodeURIComponent(msg)}`);
  }
});

// ── POST /api/oauth/youtube/disconnect ───────────────────────
// Body: { user_id, access_token }
router.post('/disconnect', async (req: Request, res: Response) => {
  const { user_id, access_token } = req.body as { user_id?: string; access_token?: string };
  if (!user_id) { res.status(400).json({ error: 'user_id required' }); return; }

  const { supabaseUrl, supabaseKey } = getConfig();
  try {
    // Revoke token
    if (access_token) {
      await fetch(`${GOOGLE_REVOKE}?token=${access_token}`, { method: 'POST' }).catch(() => {});
    }
    // Delete from Supabase
    await supabaseRpc(
      `user_youtube_connections?user_id=eq.${user_id}`,
      'DELETE', supabaseUrl, supabaseKey,
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/oauth/youtube/videos ────────────────────────────
// Query: ?user_id=<id>&max=50
router.get('/videos', async (req: Request, res: Response) => {
  const { user_id, max = '50' } = req.query as Record<string, string>;
  if (!user_id) { res.status(400).json({ error: 'user_id required' }); return; }

  const { supabaseUrl, supabaseKey } = getConfig();
  try {
    // Get access_token from Supabase
    const rows = await supabaseRpc(
      `user_youtube_connections?user_id=eq.${user_id}&select=access_token,refresh_token,channel_id,token_expires_at`,
      'GET', supabaseUrl, supabaseKey,
    ) as Array<{ access_token: string; refresh_token: string; channel_id: string; token_expires_at: string }>;

    if (!rows?.length) { res.status(404).json({ error: 'No connection found' }); return; }
    const conn = rows[0];

    // Check if token expired, refresh if needed
    let accessToken = conn.access_token;
    if (conn.token_expires_at && new Date(conn.token_expires_at) <= new Date()) {
      const { clientId, clientSecret } = getConfig();
      const rfRes = await fetch(GOOGLE_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId, client_secret: clientSecret,
          refresh_token: conn.refresh_token, grant_type: 'refresh_token',
        }),
      });
      const rfData = await rfRes.json() as { access_token?: string; expires_in?: number };
      if (rfData.access_token) {
        accessToken = rfData.access_token;
        await supabaseRpc(
          `user_youtube_connections?user_id=eq.${user_id}`,
          'PATCH', supabaseUrl, supabaseKey,
          { access_token: accessToken, token_expires_at: new Date(Date.now() + (rfData.expires_in ?? 3600) * 1000).toISOString(), updated_at: new Date().toISOString() },
        );
      }
    }

    // Fetch uploads playlist
    const chRes = await fetch(
      `${YT_API}/channels?part=contentDetails&mine=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const chData = await chRes.json() as {
      items?: Array<{ contentDetails: { relatedPlaylists: { uploads: string } } }>
    };
    const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) { res.json({ videos: [] }); return; }

    // Fetch playlist items
    const plRes = await fetch(
      `${YT_API}/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${Math.min(parseInt(max), 50)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const plData = await plRes.json() as {
      items?: Array<{
        snippet: {
          title: string;
          resourceId: { videoId: string };
          publishedAt: string;
          thumbnails?: { medium?: { url: string } };
        }
      }>
    };

    const videos = (plData.items ?? []).map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title:   item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
    }));

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
