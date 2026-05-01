import React, { useState, useEffect } from 'react';
import type { SyncStatus } from '../hooks/useKeywords.js';

interface SyncBadgeProps {
  syncStatus: SyncStatus;
}

export default function SyncBadge({ syncStatus }: SyncBadgeProps) {
  const [timeAgo, setTimeAgo] = useState('');

  // Update "X ago" label every 10s
  useEffect(() => {
    if (syncStatus.state !== 'synced' || !syncStatus.lastSyncedAt) return;
    const update = () => {
      const secs = Math.floor((Date.now() - syncStatus.lastSyncedAt!.getTime()) / 1000);
      if (secs < 5)   setTimeAgo('just now');
      else if (secs < 60)  setTimeAgo(`${secs}s ago`);
      else if (secs < 3600) setTimeAgo(`${Math.floor(secs / 60)}m ago`);
      else setTimeAgo(`${Math.floor(secs / 3600)}h ago`);
    };
    update();
    const t = setInterval(update, 10_000);
    return () => clearInterval(t);
  }, [syncStatus.lastSyncedAt, syncStatus.state]);

  const config = {
    loading: { color: 'var(--text-muted)', dot: '#888',    icon: '⏳', text: 'Loading...' },
    syncing: { color: 'var(--accent)',     dot: '#00e5ff', icon: '↑',  text: 'Syncing...' },
    synced:  { color: 'var(--green)',      dot: '#00e676', icon: '✓',  text: `Synced ${timeAgo}` },
    offline: { color: '#ffa726',           dot: '#ffa726', icon: '⚠', text: 'Offline' },
  }[syncStatus.state];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: '0.72rem', color: config.color,
      padding: '3px 8px', borderRadius: 12,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.06)',
      userSelect: 'none',
    }}>
      {/* Animated dot */}
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: config.dot,
        boxShadow: syncStatus.state === 'syncing' ? `0 0 6px ${config.dot}` : 'none',
        animation: syncStatus.state === 'syncing' ? 'pulse 1.2s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }} />
      <span style={{ fontWeight: 500 }}>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}
