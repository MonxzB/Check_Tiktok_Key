import React, { useState } from 'react';
import type { Keyword, RefVideo, RefChannel } from '../types';
import type { ExtendedSettings } from '../hooks/useSettings.js';
import RefVideoTable from './RefVideoTable.js';
import RefChannelTable from './RefChannelTable.js';
import CustomSelect from './CustomSelect.js';
import ApiKeyModal from './ApiKeyModal.js';

interface YoutubeTabProps {
  keywords: Keyword[];
  refVideos: RefVideo[];
  refChannels: RefChannel[];
  loading: boolean;
  serverConfigured: boolean;
  lastKeyword: string;
  onAnalyze: (kw: string) => void;
  onExportVideos: () => void;
  onExportChannels: () => void;
  settings: ExtendedSettings;
  onSaveKeys: (keys: string[]) => void;
  onTrackChannel?: (ch: { channelId: string; channelTitle: string; channelUrl: string; subscriberCount: number }) => void;
  trackedChannelIds?: string[];
}

type SubTab = 'videos' | 'channels';

export default function YoutubeTab({
  keywords, refVideos, refChannels, loading, serverConfigured,
  lastKeyword, onAnalyze, onExportVideos, onExportChannels, settings, onSaveKeys,
  onTrackChannel, trackedChannelIds = [],
}: YoutubeTabProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [activeSubTab,    setActiveSubTab]    = useState<SubTab>('videos');
  const [showKeyModal,    setShowKeyModal]    = useState(false);

  const topKeywords = [...keywords]
    .filter(k => k.longFormScore >= 40)
    .sort((a, b) => b.longFormScore - a.longFormScore)
    .slice(0, 100);

  const kwOptions       = topKeywords.map(k => ({ value: k.keyword, label: `${k.keyword} (${k.longFormScore}đ)` }));
  const hasKeys         = (settings?.apiKeys ?? []).filter(k => k.trim()).length > 0;
  const estimatedCalls  = Math.ceil((settings?.maxResults ?? 25) / 50) * 3 + 1;

  function handleAnalyzeClick() {
    if (!selectedKeyword) return;
    if (!hasKeys) { setShowKeyModal(true); return; }
    onAnalyze(selectedKeyword);
  }
  function handleModalSave(keys: string[]) {
    onSaveKeys(keys); setShowKeyModal(false);
    setTimeout(() => onAnalyze(selectedKeyword), 100);
  }

  return (
    <div>
      <section className="card">
        <h2><span className="icon">▶️</span> Phân tích YouTube Long-Form</h2>

        <div className="flex flex-wrap gap-3 items-end mb-3">
          <div className="filter-group min-w-0" style={{ flex: '1 1 220px' }}>
            <label>Chọn Keyword để phân tích</label>
            <CustomSelect value={selectedKeyword} onChange={v => setSelectedKeyword(String(v ?? ''))}
              options={kwOptions} placeholder="-- Chọn keyword --" />
          </div>
          <button className="btn btn-primary self-end whitespace-nowrap"
            onClick={handleAnalyzeClick} disabled={loading || !selectedKeyword}>
            {loading ? <><span className="spinner" /> Đang phân tích...</> : '🔍 Phân tích'}
          </button>
          {!loading && selectedKeyword && hasKeys && (
            <span className="self-end text-[0.75rem] text-text-muted whitespace-nowrap">
              ~{estimatedCalls} API calls
            </span>
          )}
        </div>

        {!hasKeys && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg mb-3 text-[0.82rem] text-[#ffa726]"
            style={{ background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.25)' }}>
            ⚠️ Chưa có API key. Bấm <strong>🔍 Phân tích</strong> để nhập key, hoặc vào <strong>⚙️ Cài đặt</strong> để thêm.
          </div>
        )}

        {(refVideos.length > 0 || refChannels.length > 0) && (
          <div className="flex gap-2 mt-2">
            {lastKeyword && (
              <span className="text-[0.82rem] text-text-muted self-center">
                Kết quả cho: <strong className="jp-text text-accent">{lastKeyword}</strong>
              </span>
            )}
            <button className="btn btn-secondary ml-auto" onClick={onExportVideos} disabled={!refVideos.length}>📥 Xuất CSV Videos</button>
            <button className="btn btn-secondary" onClick={onExportChannels} disabled={!refChannels.length}>📥 Xuất CSV Channels</button>
          </div>
        )}

        <div className="mt-2.5 text-[0.75rem] text-text-muted flex gap-4 flex-wrap">
          <span>⏱ Min duration: <strong>{settings?.minDurationMin ?? 8} phút</strong></span>
          <span>📅 Time window: <strong>{settings?.timeWindowDays ?? 180} ngày</strong></span>
          <span>🌏 Region: <strong>{settings?.regionCode ?? 'JP'}</strong></span>
          <span>📊 Max results: <strong>{settings?.maxResults ?? 25}</strong></span>
          {hasKeys && (
            <span>🔑 Keys: <strong className="text-green-400">{(settings?.apiKeys ?? []).filter(k => k.trim()).length} key</strong></span>
          )}
        </div>
      </section>

      {(refVideos.length > 0 || refChannels.length > 0) && (
        <section className="card">
          <div className="flex gap-0 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {([
              { id: 'videos',   label: `🎬 Video Tham Khảo (${refVideos.length})` },
              { id: 'channels', label: `📺 Kênh Tham Khảo (${refChannels.length})` },
            ] as { id: SubTab; label: string }[]).map(t => (
              <button key={t.id} className={`tab-btn ${activeSubTab === t.id ? 'active' : ''} text-[0.88rem]`}
                onClick={() => setActiveSubTab(t.id)}>{t.label}</button>
            ))}
          </div>
          {activeSubTab === 'videos'   && <RefVideoTable videos={refVideos} keyword={lastKeyword} />}
          {activeSubTab === 'channels' && <RefChannelTable channels={refChannels} onTrack={onTrackChannel} trackedIds={trackedChannelIds} />}
        </section>
      )}

      {showKeyModal && <ApiKeyModal onSave={handleModalSave} onCancel={() => setShowKeyModal(false)} />}
    </div>
  );
}
