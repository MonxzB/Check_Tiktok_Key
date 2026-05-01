// api/youtube/status.js — Vercel Serverless Function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Accept user-provided keys from POST body
  const userKeys = (req.body?.apiKeys ?? []).filter(k => typeof k === 'string' && k.trim());

  // Determine which keys to check
  const serverKey = process.env.YT_API_KEY;
  const keysToCheck = userKeys.length > 0 ? userKeys : (serverKey ? [serverKey] : []);

  if (keysToCheck.length === 0) {
    return res.json({ configured: false, message: '⚠️ Chưa có API key nào được cấu hình', keyCount: 0 });
  }

  // Test each key with a minimal quota call (1 unit)
  const results = await Promise.all(keysToCheck.map(async (key, idx) => {
    try {
      const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${key}`;
      const r = await fetch(testUrl);
      const d = await r.json();
      if (d.error) {
        const reason = d.error.errors?.[0]?.reason ?? d.error.message;
        return { idx, key: maskKey(key), valid: false, reason };
      }
      return { idx, key: maskKey(key), valid: true };
    } catch {
      return { idx, key: maskKey(key), valid: false, reason: 'network_error' };
    }
  }));

  const validCount = results.filter(r => r.valid).length;
  return res.json({
    configured: validCount > 0,
    message: validCount > 0
      ? `✅ ${validCount}/${keysToCheck.length} API key hợp lệ`
      : '❌ Không có key hợp lệ',
    keyCount: keysToCheck.length,
    validCount,
    results,
    usingServerKey: userKeys.length === 0 && !!serverKey,
  });
}

function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 4) + '…' + key.slice(-4);
}
