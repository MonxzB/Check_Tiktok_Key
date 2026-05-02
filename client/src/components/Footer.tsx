// ============================================================
// components/Footer.tsx — App footer
// ============================================================
import React from 'react';

const VERSION = 'v3.2.1';

const LINKS = {
  PRODUCT: [
    { label: 'Features',  href: '#' },
    { label: 'Roadmap',   href: '#' },
    { label: 'Changelog', href: '#' },
    { label: 'Status',    href: '#' },
  ],
  RESOURCES: [
    { label: 'Documentation', href: '#' },
    { label: 'Tutorials',     href: '#' },
    { label: 'Blog',          href: '#' },
    { label: 'Discord',       href: '#' },
  ],
  LEGAL: [
    { label: 'Terms',       href: '#' },
    { label: 'Privacy',     href: '#' },
    { label: 'DMCA',        href: '#' },
    { label: 'Open source', href: '#' },
  ],
};

// Social icons as inline SVG to avoid external deps
function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.03-.06z"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{
      marginTop: '3rem',
      background: 'rgba(8,12,28,0.95)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 0' }}>
        {/* Main grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
          gap: '2rem',
          paddingBottom: '2rem',
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#4f46e5,#00e5ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>🎌</div>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>YT Long-Form</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 220 }}>
              Crafted for creators chasing the long game.
            </p>
            <p style={{ fontSize: '0.8rem', color: '#4a5270', margin: 0, fontStyle: 'italic' }}>
              一期一会 · ichigo ichie
            </p>
          </div>

          {/* Link columns */}
          {(Object.entries(LINKS) as [string, { label: string; href: string }[]][]).map(([section, items]) => (
            <div key={section}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                color: '#4a5270', textTransform: 'uppercase', marginBottom: 14, marginTop: 0,
              }}>{section}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(item => (
                  <li key={item.label}>
                    <a href={item.href} style={{
                      fontSize: '0.875rem', color: '#94a3b8',
                      textDecoration: 'none', transition: 'color 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                    >{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: '0.8rem', color: '#4a5270' }}>
            {VERSION} · Free forever · Made with{' '}
            <span style={{ color: '#f43f5e' }}>❤️</span>
            {' '}in Vietnam
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: <GithubIcon />,  href: 'https://github.com',    label: 'GitHub'   },
              { icon: <TiktokIcon />,  href: 'https://tiktok.com',    label: 'TikTok'   },
              { icon: <XIcon />,       href: 'https://x.com',         label: 'X'        },
              { icon: <YoutubeIcon />, href: 'https://youtube.com',   label: 'YouTube'  },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                aria-label={s.label}
                style={{
                  width: 34, height: 34, borderRadius: 8, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#4a5270', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#00e5ff';
                  e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)';
                  e.currentTarget.style.background = 'rgba(0,229,255,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#4a5270';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
