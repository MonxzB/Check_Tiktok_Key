// ============================================================
// hooks/useTiktokChannels.ts — CRUD state for TikTok channels
// Phase 18: TikTok Channel Manager
// ============================================================
import { useState, useCallback, useEffect } from 'react';
import type { TiktokChannel, PlainCredentials } from '../types';
import {
  fetchChannels,
  insertChannel,
  updateChannel,
  deleteChannel,
  encryptCredentials,
  decryptCredentials,
  logCredentialAccess,
  type AuditAction,
} from '../engine/tiktokChannels';

export interface UseTiktokChannelsReturn {
  channels: TiktokChannel[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addChannel: (
    ch: Omit<TiktokChannel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    creds?: PlainCredentials,
    key?: CryptoKey | null,
  ) => Promise<TiktokChannel>;
  editChannel: (
    id: string,
    patch: Partial<TiktokChannel>,
    credsPatch?: PlainCredentials,
    key?: CryptoKey | null,
  ) => Promise<void>;
  removeChannel: (id: string) => Promise<void>;
  revealCredentials: (
    channel: TiktokChannel,
    key: CryptoKey,
    action: AuditAction,
    userId: string,
  ) => Promise<PlainCredentials>;
}

export function useTiktokChannels(
  userId: string | null,
  workspaceId?: string | null,
): UseTiktokChannelsReturn {
  const [channels, setChannels] = useState<TiktokChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChannels(userId, workspaceId);
      setChannels(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, workspaceId]);

  useEffect(() => { void reload(); }, [reload]);

  const addChannel = useCallback(async (
    ch: Omit<TiktokChannel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    creds?: PlainCredentials,
    key?: CryptoKey | null,
  ): Promise<TiktokChannel> => {
    if (!userId) throw new Error('Not authenticated');

    let channelData = { ...ch };

    // Encrypt credentials before insert if key + creds provided
    if (creds && key) {
      const encPatch = await encryptCredentials(creds, key);
      channelData = { ...channelData, ...encPatch };
    }

    const created = await insertChannel(
      { ...channelData, workspaceId: workspaceId ?? channelData.workspaceId },
      userId,
    );
    setChannels(prev => [created, ...prev]);
    return created;
  }, [userId, workspaceId]);

  const editChannel = useCallback(async (
    id: string,
    patch: Partial<TiktokChannel>,
    credsPatch?: PlainCredentials,
    key?: CryptoKey | null,
  ): Promise<void> => {
    let fullPatch = { ...patch };
    if (credsPatch && key) {
      const encPatch = await encryptCredentials(credsPatch, key);
      fullPatch = { ...fullPatch, ...encPatch };
    }
    const updated = await updateChannel(id, fullPatch);
    setChannels(prev => prev.map(c => c.id === id ? updated : c));
  }, []);

  const removeChannel = useCallback(async (id: string): Promise<void> => {
    await deleteChannel(id);
    setChannels(prev => prev.filter(c => c.id !== id));
  }, []);

  const revealCredentials = useCallback(async (
    channel: TiktokChannel,
    key: CryptoKey,
    action: AuditAction,
    auditUserId: string,
  ): Promise<PlainCredentials> => {
    const creds = await decryptCredentials(channel, key);
    // Fire-and-forget audit log
    void logCredentialAccess({ userId: auditUserId, channelId: channel.id, action });
    return creds;
  }, []);

  return { channels, loading, error, reload, addChannel, editChannel, removeChannel, revealCredentials };
}
