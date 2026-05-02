import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import { AuthProvider } from './hooks/useAuth.js';
import AuthGate from './components/auth/AuthGate.js';

// ── Task 3.2: Sentry — only active in production builds ────────
// Setup via Vercel Marketplace (vercel.com/integrations/sentry)
// Required env vars (set in Vercel dashboard):
//   VITE_SENTRY_DSN          — from Sentry project settings
//   VITE_VERCEL_GIT_COMMIT_SHA — auto-injected by Vercel
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then(Sentry => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN as string,
      integrations: [Sentry.browserTracingIntegration()],
      // Sample 10% of transactions — adjust based on quota
      tracesSampleRate: 0.1,
      // Release tracking with Vercel git SHA
      release: (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined)
        ?? 'local',
      environment: import.meta.env.MODE,
      // Only send errors from our own domain, not browser extensions
      allowUrls: [/https:\/\/.+\.vercel\.app/, /localhost/],
    });
  }).catch(() => null); // Fail silently — never break the app for monitoring
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate>
        <App />
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>
);
