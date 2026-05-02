/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  // ── Disable Preflight to avoid conflict with existing index.css ──
  corePlugins: {
    preflight: false,
  },

  theme: {
    extend: {
      // ── Design tokens mapped from CSS variables ────────────────
      colors: {
        // Backgrounds
        'bg-primary':   '#060b18',
        'bg-secondary': '#0d1425',
        'bg-card':      'rgba(15,23,50,0.7)',
        'bg-elevated':  'rgba(20,30,65,0.85)',
        'glass':        'rgba(255,255,255,0.04)',

        // Brand
        accent:   '#00e5ff',
        accent2:  '#7c4dff',
        accent3:  '#ff4081',
        glow:     'rgba(0,229,255,0.15)',

        // Status
        'brand-green':  '#00e676',
        'brand-yellow': '#ffea00',
        'brand-orange': '#ff9100',
        'brand-red':    '#ff1744',

        // Text
        'text-base':      '#e8eaf6',
        'text-secondary': '#9fa8c7',
        'text-muted':     '#5c6480',

        // Border
        border:       'rgba(255,255,255,0.08)',
        'border-accent': 'rgba(0,229,255,0.35)',
      },

      fontFamily: {
        sans:   ['Inter', 'Noto Sans JP', 'sans-serif'],
        jp:     ['Noto Sans JP', 'Inter', 'sans-serif'],
        mono:   ['"Courier New"', 'monospace'],
      },

      borderRadius: {
        DEFAULT: '12px',
        sm:      '8px',
        pill:    '20px',
      },

      boxShadow: {
        'modal':  '0 32px 80px rgba(0,0,0,0.6)',
        'card':   '0 8px 32px rgba(0,0,0,0.4)',
        'accent': '0 6px 20px rgba(0,229,255,0.3)',
        'glow':   '0 0 0 3px rgba(0,229,255,0.15)',
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      // ── Backdrop blur ──────────────────────────────────────────
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
      },

      // ── Custom animations ──────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'modal-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95) translateY(20px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'toast-in': {
          '0%':   { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease',
        'modal-in': 'modal-in 0.25s ease',
        'toast-in': 'toast-in 0.3s ease',
        shimmer:    'shimmer 1.6s linear infinite',
      },
    },
  },

  plugins: [],
};
