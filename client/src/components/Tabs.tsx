import React from 'react';
import type { TabId } from '../types';

interface TabDefinition {
  id: TabId;
  label: string;
}

const ALL_TABS: TabDefinition[] = [
  { id: 'keywords',    label: '📋 Long-Form Keywords' },
  { id: 'youtube',     label: '▶️ YouTube Research' },
  { id: 'csv',         label: '📁 CSV / History' },
  { id: 'competitors', label: '👥 Competitors' },
  { id: 'gap',         label: '🎯 Gap Analysis' },
  { id: 'calendar',   label: '📅 Calendar' },
  { id: 'tiktok',     label: '📱 TikTok Channels' },
  { id: 'settings',   label: '⚙️ Cài đặt' },
];

interface TabsProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  hideCalendar?: boolean;
}

export default function Tabs({ activeTab, setActiveTab, hideCalendar }: TabsProps) {
  const tabs = hideCalendar ? ALL_TABS.filter(t => t.id !== 'calendar') : ALL_TABS;
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => setActiveTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
