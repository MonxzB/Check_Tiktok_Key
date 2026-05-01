import React, { useState, useEffect } from 'react';
import type { Workspace, WorkspaceInsert, Niche } from '../types';

const NICHE_OPTIONS: Niche[] = [
  'AI / ChatGPT', 'Excel / Office', 'Lập trình', 'Tiết kiệm', 'Công việc',
  'Phỏng vấn', 'Học tập', 'Tâm lý học', 'Kiến thức / Fact',
  'Văn hóa Nhật', '100均', 'Sức khỏe', 'Kinh doanh',
];

const COLOR_OPTIONS = [
  '#00e5ff', '#7c4dff', '#ff6d00', '#00e676', '#ff4081',
  '#ffd740', '#40c4ff', '#f44336', '#69f0ae', '#e040fb',
];

interface WorkspaceModalProps {
  mode: 'create' | 'edit';
  initial?: Workspace;
  onSave: (data: Omit<WorkspaceInsert, 'user_id'>) => Promise<void>;
  onClose: () => void;
}

export default function WorkspaceModal({ mode, initial, onSave, onClose }: WorkspaceModalProps) {
  const [name, setName]           = useState(initial?.name ?? '');
  const [description, setDesc]    = useState(initial?.description ?? '');
  const [niche, setNiche]         = useState<string>(initial?.niche ?? '');
  const [color, setColor]         = useState(initial?.color ?? '#00e5ff');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Tên workspace không được trống.'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        niche: niche || undefined,
        color,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: 'var(--text)' }}>
          {mode === 'create' ? '✨ Tạo workspace mới' : '✏️ Chỉnh sửa workspace'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div className="auth-field">
            <label>Tên workspace *</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: AI Tools Research" disabled={loading}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text)', padding: '9px 14px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div className="auth-field">
            <label>Mô tả (tùy chọn)</label>
            <input
              type="text" value={description} onChange={e => setDesc(e.target.value)}
              placeholder="Mô tả ngắn về mục đích workspace" disabled={loading}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text)', padding: '9px 14px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Niche */}
          <div className="auth-field">
            <label>Niche chính</label>
            <select
              value={niche} onChange={e => setNiche(e.target.value)} disabled={loading}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text)', padding: '9px 14px', fontSize: '0.9rem', width: '100%', cursor: 'pointer' }}
            >
              <option value="">— Chọn niche —</option>
              {NICHE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Màu đại diện</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2, transition: 'transform 0.15s', transform: color === c ? 'scale(1.15)' : 'scale(1)' }}
                />
              ))}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 100 }}>
              {loading ? <><span className="spinner" /> Đang lưu...</> : mode === 'create' ? '✨ Tạo' : '💾 Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
