import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Prefer .ts/.tsx over .js/.jsx so stubs correctly resolve to TS implementations
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    rollupOptions: {
      output: {
        // Put shared deps in a vendor chunk; supabase always in main bundle to avoid dual-init
        manualChunks(id) {
          // Force supabase into main bundle so singleton works across static+dynamic imports
          if (id.includes('/lib/supabase')) return undefined; // stays in main
          // Split recharts into its own chunk (large lib)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'recharts';
          // Vendor chunk for other large node_modules
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
    // Raise warning threshold to 800 kB
    chunkSizeWarningLimit: 800,
  },
  // Dev proxy — only active in local dev, not in production build
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
