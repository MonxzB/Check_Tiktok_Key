import React from 'react';
import type { SyncStatus } from '../hooks/useKeywords.js';

export default function SyncBadge({ syncStatus }: { syncStatus: SyncStatus }) {
  const [timeAgo, setTimeAgo] = React.useState('');

  React.useEffect(() => {
    if (syncStatus.state !== 'synced' || !syncStatus.lastSyncedAt) return;
    const update = () => {
      const secs = Math.floor((Date.now() - syncStatus.lastSyncedAt!.getTime()) / 1000);
      if (secs < 5) setTimeAgo('just now');
      else if (secs < 60) setTimeAgo(`${secs}s ago`);
      else if (secs < 3600) setTimeAgo(`${Math.floor(secs / 60)}m ago`);
      else setTimeAgo(`${Math.floor(secs / 3600)}h ago`);
    };
    update();
    const t = setInterval(update, 10_000);
    return () => clearInterval(t);
  }, [syncStatus.lastSyncedAt, syncStatus.state]);

  const cfg = {
    loading: { color: '#5c6480', dot: '#888',    icon: '⏳', text: 'Loading...' },
    syncing: { color: '#00e5ff', dot: '#00e5ff', icon: '↑',  text: 'Syncing...' },
    synced:  { color: '#00e676', dot: '#00e676', icon: '✓',  text: `Synced ${timeAgo}` },
    offline: { color: '#ffa726', dot: '#ffa726', icon: '⚠',  text: 'Offline' },
  }[syncStatus.state];

  return (
    <div className="flex items-center gap-1.5 text-[0.72rem] px-2 py-0.5 rounded-full select-none"
      style={{ color: cfg.color, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="rounded-full shrink-0 inline-block"
        style={{
          width: 6, height: 6,
          background: cfg.dot,
          boxShadow: syncStatus.state === 'syncing' ? `0 0 6px ${cfg.dot}` : 'none',
        }} />
      <span className="font-medium">{cfg.icon}</span>
      <span>{cfg.text}</span>
    </div>
  );
}
