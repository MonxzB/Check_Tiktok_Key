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

  // Match by value; empty string means "all/reset" — still show the option's label
  const selected = options.find(o => String(o.value) === String(value));

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
          color: (selected && selected.value !== '') ? 'var(--text)' : 'var(--text-muted)',
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
          zIndex: 9999,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          maxHeight: 280,
          overflowY: 'auto',
          backdropFilter: 'blur(12px)',
        }}>
          {options.map((opt, i) => {
            const isSelected = opt.value === value || (opt.value === '' && !value);
            const isReset = opt.value === '';
            return (
              <div
                key={String(opt.value) + i}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontFamily: "'Noto Sans JP','Inter',sans-serif",
                  color: isSelected ? 'var(--accent)' : isReset ? 'var(--text-muted)' : 'var(--text)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-glow)' : 'transparent',
                  transition: 'background 0.15s',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: isSelected ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
