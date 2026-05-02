import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
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
// Phase 16: UX Polish
import { KeywordTableSkeleton, StatsBarSkeleton } from './components/Skeleton.tsx';
import { NoKeywordsEmptyState } from './components/EmptyState.tsx';
import { usePersistentState } from './hooks/usePersistentState.ts';
// Phase 13: Content Calendar — lazy to isolate any potential crashes
import CalendarErrorBoundary from './components/CalendarErrorBoundary.tsx';
const ContentCalendarTab = lazy(() => import('./components/ContentCalendarTab.tsx'));

const DEFAULT_FILTERS: KeywordFilters = {
  minScore: 0, niche: '', level: '', intent: '', evergreen: '', risk: '', rec: '',
};

const VALID_TABS: TabId[] = ['keywords', 'youtube', 'csv', 'settings', 'competitors', 'gap', 'calendar'];

export default function App() {
  const [activeTab, setActiveTabRaw] = usePersistentState<TabId>('ytlf_active_tab', 'keywords');
  // Guard against stale/invalid tab values in localStorage
  const activeTab_ = VALID_TABS.includes(activeTab) ? activeTab : 'keywords';
  const setActiveTab = useCallback((tab: TabId) => setActiveTabRaw(tab), [setActiveTabRaw]);

  const [selectedKw, setSelectedKw] = useState<Keyword | null>(null);
  const [showFilter, setShowFilter] = usePersistentState<boolean>('ytlf_show_filter', false);
  const [filters, setFilters]       = usePersistentState<KeywordFilters>('ytlf_filters', DEFAULT_FILTERS);

  const { user }                                              = useAuth();
  const { toasts, toast }                                     = useToast();
  const { settings, updateSettings, resetSettings }           = useSettings();
  const workspaceProps                                        = useWorkspaces(user ?? null);
  const activeWorkspaceId = workspaceProps.activeWorkspace?.id ?? null;

  const {
    keywords, loading: kwLoading, syncStatus, hasMigrationPending, runMigration,
    expand, score, clear, exportCsv, importCsv, updateApiData, snapshots,
  } = useKeywords(toast, activeWorkspaceId, workspaceProps.activeWorkspace);

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
    if (activeTab_ === 'youtube') checkStatus();
  }, [activeTab_, checkStatus]);

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

  function handleSelectNiche(niche: string) {
    if (niche) {
      setFilters(f => ({ ...f, niche }));
      setShowFilter(true);
    } else {
      setFilters(f => ({ ...f, niche: '' }));
    }
  }

  // Phase 16.9: global keyboard shortcuts + cross-component events
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'Escape' && selectedKw) { setSelectedKw(null); return; }
      if (isInput) return;
      if (e.key === 'F' && e.shiftKey && activeTab_ === 'keywords' && keywords.length > 0) {
        e.preventDefault(); handleFilterToggle();
      }
      if (e.key === 'r' && activeTab_ === 'keywords' && showFilter) {
        e.preventDefault(); setFilters(DEFAULT_FILTERS);
      }
    }
    function handleResetFilters() {
      setFilters(DEFAULT_FILTERS);
      setShowFilter(false);
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('ytlf:reset-filters', handleResetFilters);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('ytlf:reset-filters', handleResetFilters);
    };
  }, [selectedKw, activeTab_, keywords.length, showFilter]);

  const activeFilters = showFilter ? filters : DEFAULT_FILTERS;
  const filteredForExport = keywords.filter(k => {
    if (activeFilters.minScore > 0 && k.longFormScore < activeFilters.minScore) return false;
    if (activeFilters.niche && k.niche !== activeFilters.niche) return false;
    if (activeFilters.level && k.level !== activeFilters.level) return false;
    return true;
  });

  const displayKeywords = personalScoring.enabled
    ? keywords.map(kw => ({
        ...kw,
        longFormScore: applyPersonalWeights(kw, personalScoring.weights),
      }))
    : keywords;

  const showSkeleton = kwLoading && keywords.length === 0;

  const is = (tab: TabId) => activeTab_ === tab ? 'block' : 'none';

  return (
    <div className="container">
      <Header workspaceProps={workspaceProps} syncStatus={syncStatus} />
      <Tabs activeTab={activeTab_} setActiveTab={setActiveTab} />

      {/* Migration banner (one-time) */}
      {hasMigrationPending && activeWorkspaceId && (
        <MigrationBanner onMigrate={runMigration} />
      )}

      {/* Keywords Tab */}
      <div style={{ display: is('keywords') }}>
        <SeedInput onExpand={expand} activeWorkspace={workspaceProps.activeWorkspace} />

        {/* 16.5 Proper skeleton */}
        {showSkeleton && (
          <div style={{ marginTop: 8 }}>
            <StatsBarSkeleton />
            <KeywordTableSkeleton rows={6} />
          </div>
        )}

        {!showSkeleton && hasResults && (
          <ActionBar
            onScore={score}
            onFilterToggle={handleFilterToggle}
            onExport={() => exportCsv(filteredForExport)}
            onImport={importCsv}
            onClear={handleClear}
            showFilter={showFilter}
          />
        )}
        {!showSkeleton && hasResults && showFilter && (
          <FilterBar filters={filters} setFilters={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
        )}
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

        {/* 16.6 Empty state when no keywords and not loading */}
        {!showSkeleton && !hasResults && <NoKeywordsEmptyState />}

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
      <div style={{ display: is('youtube') }}>
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
      <div style={{ display: is('csv') }}>
        <CsvHistoryTab
          keywords={keywords}
          refVideos={refVideos}
          refChannels={refChannels}
          onImport={importCsv}
          toast={toast}
        />
      </div>

      {/* Competitors Tab */}
      <div style={{ display: is('competitors') }}>
        <CompetitorTab
          tracker={tracker}
          keywords={keywords}
          settings={settings}
        />
      </div>

      {/* Gap Analysis Tab */}
      <div style={{ display: is('gap') }}>
        <GapAnalysisTab
          keywords={keywords}
          ytConn={ytConn}
          onAnalyzeKeyword={handleAnalyzeKeyword}
        />
      </div>

      {/* Content Calendar Tab — Phase 13 */}
      <div style={{ display: is('calendar') }}>
        <CalendarErrorBoundary>
          <Suspense fallback={
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ width: 20, height: 20 }} />
            </div>
          }>
            <ContentCalendarTab keywords={displayKeywords} />
          </Suspense>
        </CalendarErrorBoundary>
      </div>

      {/* Settings Tab */}
      <div style={{ display: is('settings') }}>
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetSettings}
          personalScoring={personalScoring}
        />
      </div>

      {selectedKw && <DetailModal kw={selectedKw} onClose={() => setSelectedKw(null)} onAnalyze={handleAnalyzeKeyword} snapshots={snapshots} personalScoring={personalScoring} refVideos={lastKeyword === selectedKw.keyword ? refVideos : []} />}
      <Toast toasts={toasts} />
    </div>
  );
}
