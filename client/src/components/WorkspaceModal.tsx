import React, { useState, useEffect } from 'react';
import type { Workspace, WorkspaceInsert, Niche, ContentLanguage } from '../types';
import { LANGUAGE_OPTIONS } from '../engine/languages/index.js';

const NICHE_OPTIONS: Niche[] = [
  'AI / ChatGPT', 'Excel / Office', 'Lập trình', 'Tiết kiệm', 'Công việc',
  'Phỏng vấn', 'Học tập', 'Tâm lý học', 'Kiến thức / Fact',
  'Văn hóa Nhật', '100均', 'Sức khỏe', 'Kinh doanh',
];
const COLOR_OPTIONS = [
  '#00e5ff','#7c4dff','#ff6d00','#00e676','#ff4081',
  '#ffd740','#40c4ff','#f44336','#69f0ae','#e040fb',
];

interface WorkspaceModalProps {
  mode: 'create' | 'edit';
  initial?: Workspace;
  onSave: (data: Omit<WorkspaceInsert, 'user_id'>) => Promise<void>;
  onClose: () => void;
}

export default function WorkspaceModal({ mode, initial, onSave, onClose }: WorkspaceModalProps) {
  const [name, setName]       = useState(initial?.name ?? '');
  const [description, setDesc]= useState(initial?.description ?? '');
  const [niche, setNiche]     = useState<string>(initial?.niche ?? '');
  const [color, setColor]     = useState(initial?.color ?? '#00e5ff');
  const [lang, setLang]       = useState<ContentLanguage>(initial?.contentLanguage ?? 'ja');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const isEdit = mode === 'edit';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Tên workspace không được trống.'); return; }
    setLoading(true); setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, niche: niche || undefined, color, content_language: lang });
      onClose();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-xl p-7"
        style={{ maxWidth: 460, background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-5">
          {mode === 'create' ? '✨ Tạo workspace mới' : '✏️ Chỉnh sửa workspace'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Name */}
          <div className="auth-field">
            <label>Tên workspace *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: AI Tools Japan" disabled={loading}
              className="w-full box-border" />
          </div>

          {/* Description */}
          <div className="auth-field">
            <label>Mô tả (tùy chọn)</label>
            <input type="text" value={description} onChange={e => setDesc(e.target.value)}
              placeholder="Mô tả ngắn về mục đích workspace" disabled={loading}
              className="w-full box-border" />
          </div>

          {/* Language */}
          <div className="auth-field">
            <label className="flex items-center gap-1.5">
              🌐 Ngôn ngữ nội dung
              {isEdit && (
                <span className="text-[0.72rem] text-text-muted px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  Không thể đổi sau khi tạo
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGE_OPTIONS.map(opt => (
                <button key={opt.code} type="button" disabled={loading || isEdit}
                  onClick={() => setLang(opt.code)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.85rem] transition-all duration-150"
                  style={{
                    border: lang === opt.code ? '2px solid #00e5ff' : '2px solid rgba(255,255,255,0.08)',
                    background: lang === opt.code ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.03)',
                    fontWeight: lang === opt.code ? 600 : 400,
                    opacity: isEdit ? 0.6 : 1,
                    cursor: isEdit ? 'not-allowed' : 'pointer',
                  }}>
                  <span className="text-lg">{opt.flag}</span>
                  {opt.name}
                  {lang === opt.code && <span className="ml-auto text-accent">✓</span>}
                </button>
              ))}
            </div>
            {isEdit && <p className="mt-1 text-[0.75rem] text-text-muted">💡 Để thay đổi ngôn ngữ, hãy tạo workspace mới.</p>}
          </div>

          {/* Niche */}
          <div className="auth-field">
            <label>Niche chính</label>
            <select value={niche} onChange={e => setNiche(e.target.value)} disabled={loading}
              className="w-full box-border cursor-pointer">
              <option value="">— Chọn niche —</option>
              {NICHE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[0.82rem] text-text-secondary mb-2">Màu đại diện</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="rounded-full p-0 cursor-pointer transition-transform duration-150"
                  style={{
                    width: 28, height: 28, background: c,
                    border: color === c ? '3px solid white' : '2px solid transparent',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }} />
              ))}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="flex gap-2.5 justify-end mt-1">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
            <button type="submit" className="btn btn-primary min-w-[100px] justify-center" disabled={loading}>
              {loading ? <><span className="spinner" /> Đang lưu...</> : mode === 'create' ? '✨ Tạo' : '💾 Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
