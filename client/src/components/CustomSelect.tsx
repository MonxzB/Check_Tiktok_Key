import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SelectOption {
  value: string | number | null;
  label: string;
}

interface DropPos {
  top: number;
  left: number;
  width: number;
}

interface CustomSelectProps {
  value: string | number | null | undefined;
  onChange: (value: string | number | null) => void;
  options?: SelectOption[];
  placeholder?: string;
  style?: React.CSSProperties;
}

/**
 * CustomSelect — styled dropdown using React Portal to escape stacking contexts
 * (backdrop-filter on .card creates a new stacking context that clips absolute children)
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = '-- Chọn --',
  style = {},
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<DropPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('custom-select-portal');
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!open) return;
    function update() {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width });
    }
    setOpen(o => !o);
  }

  const selected = options.find(o => String(o.value) === String(value));
  const hasRealValue = selected && selected.value !== '' && selected.value !== null && selected.value !== undefined;

  const dropdown = open && createPortal(
    <div
      id="custom-select-portal"
      style={{
        position: 'absolute',
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 99999,
        background: '#0d1425',
        border: '1px solid rgba(0,229,255,0.4)',
        borderRadius: 8,
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        maxHeight: 280,
        overflowY: 'auto',
        backdropFilter: 'none',
      }}
    >
      {options.map((opt, i) => {
        const isSelected = String(opt.value) === String(value) ||
          (opt.value === '' && (value === '' || value === null || value === undefined));
        const isReset = opt.value === '' || opt.value === null;
        return (
          <div
            key={String(opt.value) + i}
            onMouseDown={e => {
              e.preventDefault();
              onChange(opt.value);
              setOpen(false);
            }}
            style={{
              padding: '9px 14px',
              fontSize: '0.82rem',
              fontFamily: "'Noto Sans JP','Inter',sans-serif",
              color: isSelected ? 'var(--accent)' : isReset ? '#9fa8c7' : '#e8eaf6',
              cursor: 'pointer',
              background: isSelected ? 'rgba(0,229,255,0.1)' : 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: isSelected ? 600 : 400,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(0,229,255,0.1)' : 'transparent'; }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>,
    document.body
  );

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(0,229,255,0.6)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8,
          color: hasRealValue ? '#e8eaf6' : '#9fa8c7',
          padding: '8px 36px 8px 12px',
          fontSize: '0.85rem',
          fontFamily: "'Noto Sans JP','Inter',sans-serif",
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxShadow: open ? '0 0 0 3px rgba(0,229,255,0.15)' : 'none',
        }}
      >
        {selected ? selected.label : placeholder}
        <span style={{
          position: 'absolute', right: 12, top: '50%',
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: 'transform 0.2s', color: 'rgba(0,229,255,0.8)', fontSize: '0.65rem', pointerEvents: 'none',
        }}>▼</span>
      </button>
      {dropdown}
    </div>
  );
}
