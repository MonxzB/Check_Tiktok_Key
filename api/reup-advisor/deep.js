// ============================================================
// api/reup-advisor/deep.js — Vercel Serverless Function
// POST /api/reup-advisor/deep
// Server-side Gemini call to avoid exposing GEMINI_API_KEY in client
// ============================================================

const SYSTEM_PROMPT = `Bạn là chuyên gia reup video YouTube. Phân tích metadata video và đề xuất chiến lược cắt/edit.
Trả về JSON hợp lệ theo schema sau (không có text ngoài JSON):
{"primaryRecommendation":"shorts"|"longform"|"both","confidence":number(0-100),"copyrightRisk":number(1-10),"strategies":[{"id":string,"name":string,"emoji":string,"outputType":"shorts"|"longform"|"mixed"|"duet","estimatedClips":number,"estimatedClipDuration":number,"config":{"trimStart":number,"trimEnd":number,"parts":number,"durationPerPart":number,"breakCut":{"enabled":boolean,"keep":number,"skip":number},"duet":{"enabled":boolean,"layout":"top-bottom","bgVideoCategory":string},"audioSwap":boolean,"customText":[]},"pros":[string],"cons":[string],"safetyScore":number,"effortScore":number,"recommendedFor":[string],"reasoning":string,"rank":number}]}
Trả đúng 3-4 strategies. Ưu tiên an toàn bản quyền.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY chưa được cấu hình. Thêm vào Vercel Environment Variables.',
    });
  }

  const { videoMeta } = req.body || {};
  if (!videoMeta || !videoMeta.videoId) {
    return res.status(400).json({ error: 'Cần truyền videoMeta' });
  }

  // Build compact message to minimize tokens
  const m = videoMeta;
  const userMsg = `Video: dur=${m.duration}s, cat=${m.category}(${m.categoryId}), views=${m.viewCount}, subs=${m.channelSubs}, tags=${(m.tags || []).slice(0, 5).join(',')}, official=${m.isOfficialArtist}`;

  const model = 'gemini-2.0-flash-lite';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1200,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || `Gemini error: ${geminiRes.status}` });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) return res.status(502).json({ error: 'Gemini trả về response rỗng' });

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.strategies) || parsed.strategies.length === 0) {
      return res.status(502).json({ error: 'Gemini không trả về strategies' });
    }

    return res.json({
      ...parsed,
      strategies: parsed.strategies.map((s, i) => ({ ...s, rank: i + 1 })),
      generatedBy: 'llm',
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[reup-advisor/deep] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
