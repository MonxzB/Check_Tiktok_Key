import React from 'react';

const TABS = [
  { id: 'keywords',  label: '📋 Long-Form Keywords' },
  { id: 'youtube',   label: '▶️ YouTube Research' },
  { id: 'csv',       label: '📁 CSV / History' },
  { id: 'settings',  label: '⚙️ Cài đặt' },
];

export default function Tabs({ activeTab, setActiveTab }) {
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
