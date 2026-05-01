// ============================================================
// server/index.ts — Express server entry point
// ============================================================
import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import youtubeRouter from './routes/youtube.js';
import channelTrackerRouter from './routes/channelTracker.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// Routes
app.use('/api/youtube', youtubeRouter);
app.use('/api/youtube', channelTrackerRouter);
// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    ytApiConfigured: !!process.env.YT_API_KEY,
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  if (!process.env.YT_API_KEY) {
    console.warn('⚠️  YT_API_KEY chưa được cấu hình trong .env');
  } else {
    console.log('🔑 YouTube API Key: đã cấu hình');
  }
});
