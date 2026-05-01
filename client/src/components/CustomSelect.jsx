import React, { useState, useRef, useEffect } from 'react';

/**
 * CustomSelect — styled dropdown that matches the dark glassmorphism theme.
 * Props:
 *   value, onChange, options: [{ value, label }], placeholder
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = '-- Chọn --', style = {}, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'var(--glass)',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-sm)',
          color: selected ? 'var(--text)' : 'var(--text-muted)',
          padding: '8px 36px 8px 12px',
          fontSize: '0.85rem',
          fontFamily: "'Noto Sans JP','Inter',sans-serif",
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxShadow: open ? '0 0 0 3px var(--accent-glow)' : 'none',
        }}
      >
        {selected ? selected.label : placeholder}
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: 'transform 0.2s', color: 'var(--accent)', fontSize: '0.7rem', pointerEvents: 'none',
        }}>▼</span>
      </button>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          zIndex: 999,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          maxHeight: 320,
          overflowY: 'auto',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Placeholder option */}
          <div
            onClick={() => { onChange(''); setOpen(false); }}
            style={{
              padding: '9px 14px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              borderBottom: '1px solid var(--glass-border)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--glass)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {placeholder}
          </div>

          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '9px 14px',
                fontSize: '0.82rem',
                fontFamily: "'Noto Sans JP','Inter',sans-serif",
                color: opt.value === value ? 'var(--accent)' : 'var(--text)',
                cursor: 'pointer',
                background: opt.value === value ? 'var(--accent-glow)' : 'transparent',
                transition: 'background 0.15s',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'var(--glass)'; }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
