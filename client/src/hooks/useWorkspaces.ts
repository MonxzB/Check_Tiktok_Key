// ============================================================
// hooks/useWorkspaces.ts — Supabase-backed workspace CRUD
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import type { User } from '../types';
import type { Workspace, WorkspaceInsert } from '../types';

const LOCAL_KEY = 'ytlf_active_workspace';

export interface UseWorkspacesReturn {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  createWorkspace: (insert: Omit<WorkspaceInsert, 'user_id'>) => Promise<Workspace | null>;
  switchWorkspace: (id: string) => void;
  updateWorkspace: (id: string, patch: Partial<Pick<Workspace, 'name' | 'description' | 'niche' | 'color'>>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  ensureDefaultWorkspace: (user: User) => Promise<Workspace | null>;
}

export function useWorkspaces(user: User | null): UseWorkspacesReturn {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);

  // Load workspaces when user changes
  useEffect(() => {
    if (!user) { setWorkspaces([]); setActiveWorkspace(null); return; }
    let cancelled = false;
    setLoading(true);

    supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled || error) { setLoading(false); return; }
        const list = (data ?? []).map(dbToWorkspace);
        setWorkspaces(list);

        // Restore last active workspace or use default
        const lastId = localStorage.getItem(LOCAL_KEY);
        const last = list.find(w => w.id === lastId);
        const def  = list.find(w => w.isDefault) ?? list[0] ?? null;
        setActiveWorkspace(last ?? def);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  const ensureDefaultWorkspace = useCallback(async (u: User): Promise<Workspace | null> => {
    // Called after first login — create default workspace if none exists
    const { data: existing } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', u.id)
      .limit(1);

    if (existing && existing.length > 0) return dbToWorkspace(existing[0]);

    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        user_id: u.id,
        name: 'Default',
        description: 'Workspace mặc định',
        color: '#00e5ff',
        is_default: true,
      })
      .select()
      .single();

    if (error || !data) return null;
    const ws = dbToWorkspace(data);
    setWorkspaces([ws]);
    setActiveWorkspace(ws);
    return ws;
  }, []);

  const createWorkspace = useCallback(async (
    insert: Omit<WorkspaceInsert, 'user_id'>
  ): Promise<Workspace | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ ...insert, user_id: user.id })
      .select()
      .single();

    if (error || !data) return null;
    const ws = dbToWorkspace(data);
    setWorkspaces(prev => [...prev, ws]);
    return ws;
  }, [user]);

  const switchWorkspace = useCallback((id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    setActiveWorkspace(ws);
    localStorage.setItem(LOCAL_KEY, id);
  }, [workspaces]);

  const updateWorkspace = useCallback(async (
    id: string,
    patch: Partial<Pick<Workspace, 'name' | 'description' | 'niche' | 'color'>>
  ): Promise<void> => {
    const { error } = await supabase
      .from('workspaces')
      .update({
        name: patch.name,
        description: patch.description,
        niche: patch.niche,
        color: patch.color,
      })
      .eq('id', id);

    if (error) return;
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
    setActiveWorkspace(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  }, []);

  const deleteWorkspace = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) return;
    const remaining = workspaces.filter(w => w.id !== id);
    setWorkspaces(remaining);
    if (activeWorkspace?.id === id) {
      const next = remaining[0] ?? null;
      setActiveWorkspace(next);
      if (next) localStorage.setItem(LOCAL_KEY, next.id);
    }
  }, [workspaces, activeWorkspace]);

  return {
    workspaces, activeWorkspace, loading,
    createWorkspace, switchWorkspace, updateWorkspace, deleteWorkspace,
    ensureDefaultWorkspace,
  };
}

// ── DB row → Workspace ────────────────────────────────────────
function dbToWorkspace(row: Record<string, unknown>): Workspace {
  return {
    id:          String(row.id),
    name:        String(row.name),
    description: row.description ? String(row.description) : undefined,
    niche:       row.niche       ? String(row.niche) as Workspace['niche'] : undefined,
    color:       String(row.color ?? '#00e5ff'),
    isDefault:   Boolean(row.is_default),
    createdAt:   String(row.created_at),
    updatedAt:   String(row.updated_at),
  };
}
