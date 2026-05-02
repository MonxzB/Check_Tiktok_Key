import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Sentry plugin is only active when SENTRY_AUTH_TOKEN is present (CI / Vercel)
// Set in Vercel dashboard: Settings → Environment Variables → SENTRY_AUTH_TOKEN
const sentryPlugin = process.env.SENTRY_AUTH_TOKEN
  ? [sentryVitePlugin({
      org:     process.env.SENTRY_ORG     ?? 'ytlf',
      project: process.env.SENTRY_PROJECT ?? 'ytlf-client',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { assets: './dist/**' },
      release: { name: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local' },
    })]
  : [];

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...sentryPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Task 2.2: Fix GoTrueClient root cause
         *
         * Root cause: Vite was splitting @supabase/supabase-js across the main
         * bundle AND dynamic import chunks → two instances → duplicate GoTrueClient.
         *
         * Fix: force ALL supabase packages into one dedicated 'supabase' chunk.
         * Because it's a single named chunk, Vite guarantees exactly one copy.
         * The globalThis singleton hack in lib/supabase.ts is no longer needed.
         *
         * Chunk strategy:
         *   supabase  → @supabase/* (single instance guarantee)
         *   recharts  → recharts + d3-* (large dataviz libs)
         *   vendor    → everything else in node_modules
         *   [lazy tabs remain as their own chunks via dynamic import]
         */
        manualChunks(id) {
          if (
            id.includes('@supabase/supabase-js') ||
            id.includes('@supabase/auth-js') ||
            id.includes('@supabase/realtime') ||
            id.includes('@supabase/postgrest') ||
            id.includes('@supabase/storage') ||
            id.includes('@supabase/functions')
          ) {
            return 'supabase';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'recharts';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // App code stays in the main chunk (returned undefined)
        },
      },
    },
    chunkSizeWarningLimit: 800,
    // Source maps required for Sentry to decode minified stack traces.
    // Hidden = maps uploaded to Sentry but NOT served to end users.
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? 'hidden' : false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}));
