import React from 'react';
import type { TabId } from '../types';

interface TabDefinition {
  id: TabId;
  label: string;
}

const TABS: TabDefinition[] = [
  { id: 'keywords',    label: '📋 Long-Form Keywords' },
  { id: 'youtube',     label: '▶️ YouTube Research' },
  { id: 'csv',         label: '📁 CSV / History' },
  { id: 'competitors', label: '👥 Competitors' },
  { id: 'gap',         label: '🎯 Gap Analysis' },
  { id: 'settings',   label: '⚙️ Cài đặt' },
];

interface TabsProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  return (
    <div className="tabs">
      {TABS.map(t => (
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
