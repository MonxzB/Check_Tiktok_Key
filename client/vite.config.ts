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
