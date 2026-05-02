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
  const [open,       setOpen]       = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Workspace | null>(null);
  const ref = useRef<HTMLDivElement>(null);

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
    await onUpdate(editTarget.id, { name: data.name, description: data.description, niche: data.niche as import('../types').Niche | undefined, color: data.color });
  }

  async function handleDelete(ws: Workspace, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Xóa workspace "${ws.name}"? Tất cả keyword sẽ bị xóa!`)) return;
    await onDelete(ws.id);
    setOpen(false);
  }

  if (loading) return (
    <div className="flex items-center gap-1.5 text-[0.8rem] text-text-muted">
      <span className="spinner" style={{ width: 12, height: 12 }} /> Đang tải...
    </div>
  );

  const langFlag = (code: string) => LANGUAGE_OPTIONS.find(o => o.code === code)?.flag;

  return (
    <>
      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-[0.83rem] font-medium transition-all duration-150"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8eaf6' }}
        >
          <span className="rounded-full shrink-0" style={{ width: 10, height: 10, background: activeWorkspace?.color ?? '#00e5ff' }} />
          <span className="max-w-[140px] truncate">{activeWorkspace?.name ?? 'Chọn workspace'}</span>
          {activeWorkspace?.contentLanguage && (
            <span className="text-[0.85rem] shrink-0">{langFlag(activeWorkspace.contentLanguage)}</span>
          )}
          {activeWorkspace?.niche && (
            <span className="text-[0.7rem] px-1.5 py-px rounded-full shrink-0 text-text-muted"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              {activeWorkspace.niche}
            </span>
          )}
          <span className="text-text-muted text-[0.75rem]">{open ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full mt-1.5 left-0 z-[500] rounded-[10px] overflow-hidden min-w-[240px] max-w-[300px]"
            style={{ background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>

            {/* Workspace list */}
            <div className="max-h-[280px] overflow-y-auto">
              {workspaces.map(ws => {
                const isActive = activeWorkspace?.id === ws.id;
                return (
                  <div key={ws.id}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors duration-100"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isActive ? 'rgba(0,229,255,0.08)' : 'transparent'; }}
                    onClick={() => { onSwitch(ws.id); setOpen(false); }}
                  >
                    <span className="rounded-full shrink-0" style={{ width: 10, height: 10, background: ws.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[0.86rem] font-semibold truncate">
                        {ws.name}
                        {ws.contentLanguage && (
                          <span className="text-[0.8rem]" title={LANGUAGE_OPTIONS.find(o => o.code === ws.contentLanguage)?.name}>
                            {langFlag(ws.contentLanguage)}
                          </span>
                        )}
                      </div>
                      {ws.niche && <div className="text-[0.72rem] text-text-muted">{ws.niche}</div>}
                    </div>
                    {isActive && <span className="text-accent text-[0.78rem]">✓</span>}
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        className="bg-transparent border-none cursor-pointer text-text-muted text-[0.8rem] px-1 py-0.5 rounded transition-colors hover:text-accent"
                        onClick={e => { e.stopPropagation(); setEditTarget(ws); setOpen(false); }}
                        title="Chỉnh sửa">✏️</button>
                      {!ws.isDefault && (
                        <button
                          className="bg-transparent border-none cursor-pointer text-[0.8rem] px-1 py-0.5 rounded"
                          style={{ color: '#ff1744' }}
                          onClick={e => handleDelete(ws, e)}
                          title="Xóa workspace">🗑️</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create new */}
            <button
              onClick={() => { setShowCreate(true); setOpen(false); }}
              className="w-full px-3.5 py-2.5 border-0 cursor-pointer text-[0.84rem] font-semibold text-left text-accent transition-colors duration-100 hover:opacity-80"
              style={{ background: 'rgba(0,229,255,0.06)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              ＋ Tạo workspace mới
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <WorkspaceModal mode="create" onSave={handleCreate} onClose={() => setShowCreate(false)} />
      )}
      {editTarget && (
        <WorkspaceModal mode="edit" initial={editTarget} onSave={handleUpdate} onClose={() => setEditTarget(null)} />
      )}
    </>
  );
}
