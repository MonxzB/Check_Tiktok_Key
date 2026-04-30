import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import SeedInput from './components/SeedInput.jsx';
import ActionBar from './components/ActionBar.jsx';
import FilterBar from './components/FilterBar.jsx';
import StatsBar from './components/StatsBar.jsx';
import PanelGrid from './components/PanelGrid.jsx';
import BranchSection from './components/BranchSection.jsx';
import KeywordTable from './components/KeywordTable.jsx';
import DetailModal from './components/DetailModal.jsx';
import YoutubeTab from './components/YoutubeTab.jsx';

import CsvHistoryTab from './components/CsvHistoryTab.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Toast from './components/Toast.jsx';
import { useToast } from './hooks/useToast.js';
import { useKeywords } from './hooks/useKeywords.js';
import { useYoutube } from './hooks/useYoutube.js';
import { useSettings } from './hooks/useSettings.js';

const DEFAULT_FILTERS = { minScore: 0, niche: '', level: '', intent: '', evergreen: '', risk: '', rec: '' };

export default function App() {
  const [activeTab, setActiveTab] = useState('keywords');
  const [selectedKw, setSelectedKw] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const { toasts, toast } = useToast();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { keywords, expand, score, clear, exportCsv, importCsv, updateApiData } = useKeywords(toast);
  const {
    refVideos, refChannels, loading, serverConfigured, lastKeyword,
    analyzeKeyword, exportVideosCsv, exportChannelsCsv, checkStatus,
  } = useYoutube(toast, updateApiData, settings);

  const hasResults = keywords.length > 0;

  useEffect(() => {
    if (activeTab === 'youtube') checkStatus();
  }, [activeTab, checkStatus]);

  function handleFilterToggle() {
    if (!keywords.length) { toast('Chưa có keyword nào', 'error'); return; }
    setFilters({ minScore: 70, niche: '', level: '', intent: 'high', evergreen: '', risk: '', rec: '' });
    setShowFilter(true);
    toast('Đã lọc key đáng làm (điểm ≥70, search intent cao)', 'success');
  }

  function handleClear() {
    if (!confirm('Xoá tất cả keyword đã tạo?')) return;
    clear();
    setShowFilter(false);
    setFilters(DEFAULT_FILTERS);
  }

  function handleAnalyzeKeyword(kw) {
    setActiveTab('youtube');
    analyzeKeyword(kw);
  }

  const activeFilters = showFilter ? filters : DEFAULT_FILTERS;
  const filteredForExport = keywords.filter(k => {
    if (activeFilters.minScore > 0 && k.longFormScore < activeFilters.minScore) return false;
    if (activeFilters.niche && k.niche !== activeFilters.niche) return false;
    if (activeFilters.level && k.level !== activeFilters.level) return false;
    return true;
  });

  return (
    <div className="container">
      <Header />
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── TAB: Long-Form Keywords ── */}
      <div style={{ display: activeTab === 'keywords' ? 'block' : 'none' }}>
        <SeedInput onExpand={expand} />

        {hasResults && (
          <ActionBar
            onScore={score}
            onFilterToggle={handleFilterToggle}
            onExport={() => exportCsv(filteredForExport)}
            onImport={importCsv}
            onClear={handleClear}
          />
        )}

        {hasResults && showFilter && (
          <FilterBar filters={filters} setFilters={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
        )}

        {hasResults && <StatsBar keywords={keywords} />}
        {hasResults && <PanelGrid keywords={keywords} onSelectKeyword={setSelectedKw} />}
        {hasResults && <BranchSection keywords={keywords} />}
        {hasResults && (
          <KeywordTable
            keywords={keywords}
            filters={activeFilters}
            onSelectKeyword={setSelectedKw}
            onAnalyzeKeyword={handleAnalyzeKeyword}
          />
        )}
      </div>

      {/* ── TAB: YouTube Research ── */}
      <div style={{ display: activeTab === 'youtube' ? 'block' : 'none' }}>
        <YoutubeTab
          keywords={keywords}
          refVideos={refVideos}
          refChannels={refChannels}
          loading={loading}
          serverConfigured={serverConfigured}
          lastKeyword={lastKeyword}
          onAnalyze={analyzeKeyword}
          onExportVideos={exportVideosCsv}
          onExportChannels={exportChannelsCsv}
          settings={settings}
        />
      </div>



      {/* ── TAB: CSV / History ── */}
      <div style={{ display: activeTab === 'csv' ? 'block' : 'none' }}>
        <CsvHistoryTab
          keywords={keywords}
          refVideos={refVideos}
          refChannels={refChannels}
          onImport={importCsv}
          toast={toast}
        />
      </div>

      {/* ── TAB: Settings ── */}
      <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetSettings}
        />
      </div>

      {/* ── MODALS ── */}
      {selectedKw && <DetailModal kw={selectedKw} onClose={() => setSelectedKw(null)} />}

      <Toast toasts={toasts} />
    </div>
  );
}
