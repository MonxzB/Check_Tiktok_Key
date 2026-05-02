import React, { useState, useEffect } from 'react';
import type { Keyword, KeywordFilters } from './types';
import Header from './components/Header.js';
import Tabs from './components/Tabs.js';
import SeedInput from './components/SeedInput.js';
import ActionBar from './components/ActionBar.js';
import FilterBar from './components/FilterBar.js';
import StatsBar from './components/StatsBar.js';
import PanelGrid from './components/PanelGrid.js';
import BranchSection from './components/BranchSection.js';
import KeywordTable from './components/KeywordTable.js';
import DetailModal from './components/DetailModal.js';
import YoutubeTab from './components/YoutubeTab.js';
import CsvHistoryTab from './components/CsvHistoryTab.js';
import SettingsPanel from './components/SettingsPanel.js';
import MigrationBanner from './components/MigrationBanner.js';
import CompetitorTab from './components/CompetitorTab.tsx';
import { useBulkAnalyze } from './hooks/useBulkAnalyze.ts';
import { useCompare } from './hooks/useCompare.ts';
import { useTrackedChannels } from './hooks/useTrackedChannels.ts';
import NicheHeatmap from './components/NicheHeatmap.tsx';
import Toast from './components/Toast.js';
import { useToast } from './hooks/useToast.ts';
import { useKeywords } from './hooks/useKeywords.ts';
import { useYoutube } from './hooks/useYoutube.ts';
import { useSettings } from './hooks/useSettings.ts';
import { useWorkspaces } from './hooks/useWorkspaces.ts';
import { useAuth } from './hooks/useAuth.tsx';
import { useYoutubeConnection } from './hooks/useYoutubeConnection.ts';
import GapAnalysisTab from './components/GapAnalysisTab.tsx';
import { usePersonalScoring } from './hooks/usePersonalScoring.ts';
import { applyPersonalWeights } from './engine/personalizedScoring.ts';
import type { TabId } from './types';

const DEFAULT_FILTERS: KeywordFilters = {
  minScore: 0, niche: '', level: '', intent: '', evergreen: '', risk: '', rec: '',
};

export default function App() {
  const [activeTab, setActiveTab]   = useState<TabId>('keywords');
  const [selectedKw, setSelectedKw] = useState<Keyword | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters]       = useState<KeywordFilters>(DEFAULT_FILTERS);

  const { user }                                              = useAuth();
  const { toasts, toast }                                     = useToast();
  const { settings, updateSettings, resetSettings }           = useSettings();
  const workspaceProps                                        = useWorkspaces(user ?? null);
  const activeWorkspaceId = workspaceProps.activeWorkspace?.id ?? null;

  // Phase 3: workspaceId drives everything
  const {
    keywords, loading: kwLoading, syncStatus, hasMigrationPending, runMigration,
    expand, score, clear, exportCsv, importCsv, updateApiData, snapshots,
  } = useKeywords(toast, activeWorkspaceId);

  const bulk           = useBulkAnalyze(updateApiData, settings, toast);
  const compare        = useCompare();
  const tracker        = useTrackedChannels(activeWorkspaceId);
  const ytConn         = useYoutubeConnection(user?.id ?? null);
  const personalScoring = usePersonalScoring(user?.id ?? null);

  const { refVideos, refChannels, loading: ytLoading, serverConfigured, lastKeyword, analyzeKeyword, exportVideosCsv, exportChannelsCsv, checkStatus } = useYoutube(toast, updateApiData, settings);

  const hasResults = keywords.length > 0;

  // ── Ensure default workspace on first login ───────────────────
  useEffect(() => {
    if (!user) return;
    workspaceProps.ensureDefaultWorkspace(user);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check YouTube server when switching to YT tab ─────────────
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
    clear();
    setShowFilter(false);
    setFilters(DEFAULT_FILTERS);
  }

  function handleAnalyzeKeyword(kw: string) {
    setActiveTab('youtube');
    analyzeKeyword(kw);
  }

  /** Click heatmap cell → set/clear niche filter */
  function handleSelectNiche(niche: string) {
    if (niche) {
      setFilters(f => ({ ...f, niche }));
      setShowFilter(true);
    } else {
      setFilters(f => ({ ...f, niche: '' }));
    }
  }

  const activeFilters = showFilter ? filters : DEFAULT_FILTERS;
  const filteredForExport = keywords.filter(k => {
    if (activeFilters.minScore > 0 && k.longFormScore < activeFilters.minScore) return false;
    if (activeFilters.niche && k.niche !== activeFilters.niche) return false;
    if (activeFilters.level && k.level !== activeFilters.level) return false;
    return true;
  });

  // ── Apply personalized weights when enabled ──────────────────
  const displayKeywords = personalScoring.enabled
    ? keywords.map(kw => ({
        ...kw,
        longFormScore: applyPersonalWeights(kw, personalScoring.weights),
      }))
    : keywords;

  // ── Skeleton loading (no flash) ───────────────────────────────
  const showSkeleton = kwLoading && keywords.length === 0;

  return (
    <div className="container">
      <Header workspaceProps={workspaceProps} syncStatus={syncStatus} />
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Migration banner (one-time) */}
      {hasMigrationPending && activeWorkspaceId && (
        <MigrationBanner onMigrate={runMigration} />
      )}

      {/* Keywords Tab */}
      <div style={{ display: activeTab === 'keywords' ? 'block' : 'none' }}>
        <SeedInput onExpand={expand} />

        {showSkeleton && (
          <div style={{ padding: '24px 0', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span className="spinner" style={{ width: 14, height: 14 }} />
            Đang tải keyword từ cloud...
          </div>
        )}

        {!showSkeleton && hasResults && (
          <ActionBar
            onScore={score}
            onFilterToggle={handleFilterToggle}
            onExport={() => exportCsv(filteredForExport)}
            onImport={importCsv}
            onClear={handleClear}
          />
        )}
        {!showSkeleton && hasResults && showFilter && (
          <FilterBar filters={filters} setFilters={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
        )}
        {/* Phase 8: Niche Heatmap — above StatsBar */}
        {!showSkeleton && hasResults && (
          <NicheHeatmap
            keywords={displayKeywords}
            onSelectNiche={handleSelectNiche}
            activeNiche={activeFilters.niche || ''}
          />
        )}
        {!showSkeleton && hasResults && <StatsBar keywords={displayKeywords} />}
        {!showSkeleton && hasResults && <PanelGrid keywords={displayKeywords} onSelectKeyword={setSelectedKw} />}
        {!showSkeleton && hasResults && <BranchSection keywords={displayKeywords} />}
        {/* Resume bulk job banner */}
        {bulk.hasResumable && bulk.state.status === 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', marginBottom: 12, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 10, fontSize: '0.84rem' }}>
            <span>⏳ Có bulk job chưa hoàn thành từ lần trước.</span>
            <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: '0.8rem' }} onClick={bulk.resumeFromStorage}>▶️ Tiếp tục</button>
          </div>
        )}

        {!showSkeleton && hasResults && (
          <KeywordTable
            keywords={displayKeywords}
            filters={activeFilters}
            onSelectKeyword={setSelectedKw}
            onAnalyzeKeyword={handleAnalyzeKeyword}
            bulk={bulk}
            compare={compare}
          />
        )}
      </div>

      {/* YouTube Tab */}
      <div style={{ display: activeTab === 'youtube' ? 'block' : 'none' }}>
        <YoutubeTab
          keywords={keywords}
          refVideos={refVideos}
          refChannels={refChannels}
          loading={ytLoading}
          serverConfigured={serverConfigured ?? false}
          lastKeyword={lastKeyword}
          onAnalyze={analyzeKeyword}
          onExportVideos={exportVideosCsv}
          onExportChannels={exportChannelsCsv}
          settings={settings}
          onSaveKeys={keys => updateSettings({ apiKeys: keys, activeKeyIndex: 0 })}
          onTrackChannel={(ch: { channelId: string; channelTitle: string; channelUrl: string; subscriberCount: number }) =>
            tracker.addChannel({
              channelId: ch.channelId,
              channelTitle: ch.channelTitle,
              channelUrl: ch.channelUrl,
              subCount: ch.subscriberCount,
            }).then(() => toast(`⭐ Đã track: ${ch.channelTitle}`, 'success'))
          }
          trackedChannelIds={tracker.channels.map(c => c.channelId)}
        />
      </div>

      {/* CSV / History Tab */}
      <div style={{ display: activeTab === 'csv' ? 'block' : 'none' }}>
        <CsvHistoryTab
          keywords={keywords}
          refVideos={refVideos}
          refChannels={refChannels}
          onImport={importCsv}
          toast={toast}
        />
      </div>

      {/* Competitors Tab */}
      <div style={{ display: activeTab === 'competitors' ? 'block' : 'none' }}>
        <CompetitorTab
          tracker={tracker}
          keywords={keywords}
          settings={settings}
        />
      </div>

      {/* Gap Analysis Tab */}
      <div style={{ display: activeTab === 'gap' ? 'block' : 'none' }}>
        <GapAnalysisTab
          keywords={keywords}
          ytConn={ytConn}
          onAnalyzeKeyword={handleAnalyzeKeyword}
        />
      </div>

      {/* Settings Tab */}
      <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetSettings}
          personalScoring={personalScoring}
        />
      </div>

      {selectedKw && <DetailModal kw={selectedKw} onClose={() => setSelectedKw(null)} onAnalyze={handleAnalyzeKeyword} snapshots={snapshots} personalScoring={personalScoring} />}
      <Toast toasts={toasts} />
    </div>
  );
}
