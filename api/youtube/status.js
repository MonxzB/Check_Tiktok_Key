// api/youtube/status.js — Vercel Serverless Function
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const configured = !!process.env.YT_API_KEY;
  res.json({
    configured,
    message: configured ? '🔑 YouTube API Key đã cấu hình' : '⚠️ Chưa cấu hình YT_API_KEY',
  });
}
