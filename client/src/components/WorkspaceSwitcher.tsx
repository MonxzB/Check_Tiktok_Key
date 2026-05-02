import React, { useState, useRef, useEffect } from 'react';
import type { Workspace, WorkspaceInsert } from '../types';
import WorkspaceModal from './WorkspaceModal.js';
import type { UseWorkspacesReturn } from '../hooks/useWorkspaces.js';
import { LANGUAGE_OPTIONS } from '../engine/languages/index.js';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  onCreate: UseWorkspacesReturn['createWorkspace'];
  onSwitch: UseWorkspacesReturn['switchWorkspace'];
  onUpdate: UseWorkspacesReturn['updateWorkspace'];
  onDelete: UseWorkspacesReturn['deleteWorkspace'];
}

export default function WorkspaceSwitcher({
  workspaces, activeWorkspace, loading, onCreate, onSwitch, onUpdate, onDelete,
}: WorkspaceSwitcherProps) {
  const [open, setOpen]           = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Workspace | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleCreate(data: Omit<WorkspaceInsert, 'user_id'>) {
    const ws = await onCreate(data);
    if (ws) onSwitch(ws.id);
  }

  async function handleUpdate(data: Omit<WorkspaceInsert, 'user_id'>) {
    if (!editTarget) return;
    await onUpdate(editTarget.id, {
      name: data.name,
      description: data.description,
      niche: data.niche as import('../types').Niche | undefined,
      color: data.color,
    });
  }

  async function handleDelete(ws: Workspace, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Xóa workspace "${ws.name}"? Tất cả keyword sẽ bị xóa!`)) return;
    await onDelete(ws.id);
    setOpen(false);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
      <span className="spinner" style={{ width: 12, height: 12 }} />
      Đang tải...
    </div>
  );

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        {/* Trigger button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            borderRadius: 8, cursor: 'pointer', color: 'var(--text)',
            fontSize: '0.83rem', fontWeight: 500, transition: 'all 0.15s',
          }}
        >
          {/* Color dot */}
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeWorkspace?.color ?? '#00e5ff', flexShrink: 0 }} />
          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeWorkspace?.name ?? 'Chọn workspace'}
          </span>
          {/* Language flag */}
          {activeWorkspace?.contentLanguage && (
            <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>
              {LANGUAGE_OPTIONS.find(o => o.code === activeWorkspace.contentLanguage)?.flag}
            </span>
          )}
          {activeWorkspace?.niche && (
            <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 8, color: 'var(--text-muted)', flexShrink: 0 }}>
              {activeWorkspace.niche}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{open ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 500,
            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
            borderRadius: 10, minWidth: 240, maxWidth: 300,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
          }}>
            {/* Workspace list */}
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {workspaces.map(ws => (
                <div
                  key={ws.id}
                  onClick={() => { onSwitch(ws.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    cursor: 'pointer', borderBottom: '1px solid var(--glass-border)',
                    background: activeWorkspace?.id === ws.id ? 'rgba(0,229,255,0.08)' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (activeWorkspace?.id !== ws.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = activeWorkspace?.id === ws.id ? 'rgba(0,229,255,0.08)' : 'transparent'; }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: ws.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {ws.name}
                      {ws.contentLanguage && (
                        <span style={{ fontSize: '0.8rem' }} title={LANGUAGE_OPTIONS.find(o => o.code === ws.contentLanguage)?.name}>
                          {LANGUAGE_OPTIONS.find(o => o.code === ws.contentLanguage)?.flag}
                        </span>
                      )}
                    </div>
                    {ws.niche && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ws.niche}</div>}
                  </div>
                  {activeWorkspace?.id === ws.id && <span style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>✓</span>}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2px 4px', borderRadius: 4 }}
                      onClick={e => { e.stopPropagation(); setEditTarget(ws); setOpen(false); }}
                      title="Chỉnh sửa"
                    >✏️</button>
                    {!ws.isDefault && (
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.8rem', padding: '2px 4px', borderRadius: 4 }}
                        onClick={e => handleDelete(ws, e)}
                        title="Xóa workspace"
                      >🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Create new */}
            <button
              onClick={() => { setShowCreate(true); setOpen(false); }}
              style={{
                width: '100%', padding: '10px 14px', background: 'rgba(0,229,255,0.06)',
                border: 'none', borderTop: '1px solid var(--glass-border)',
                color: 'var(--accent)', cursor: 'pointer', fontSize: '0.84rem',
                fontWeight: 600, textAlign: 'left', transition: 'background 0.12s',
              }}
            >
              ＋ Tạo workspace mới
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <WorkspaceModal
          mode="create"
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editTarget && (
        <WorkspaceModal
          mode="edit"
          initial={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
