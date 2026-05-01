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
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('videos');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const topKeywords = [...keywords]
    .filter(k => k.longFormScore >= 40)
    .sort((a, b) => b.longFormScore - a.longFormScore)
    .slice(0, 100);

  const kwOptions = topKeywords.map(k => ({
    value: k.keyword,
    label: `${k.keyword} (${k.longFormScore}đ)`,
  }));

  const hasKeys = (settings?.apiKeys ?? []).filter(k => k.trim()).length > 0;
  const estimatedCalls = Math.ceil((settings?.maxResults ?? 25) / 50) * 3 + 1;

  function handleAnalyzeClick() {
    if (!selectedKeyword) return;
    if (!hasKeys) {
      setShowKeyModal(true);
      return;
    }
    onAnalyze(selectedKeyword);
  }

  function handleModalSave(keys: string[]) {
    onSaveKeys(keys);
    setShowKeyModal(false);
    setTimeout(() => onAnalyze(selectedKeyword), 100);
  }

  return (
    <div>
      <section className="card">
        <h2><span className="icon">▶️</span> Phân tích YouTube Long-Form</h2>

        <div className="yt-analyze-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
          <div className="filter-group" style={{ flex: '1 1 220px', minWidth: 0 }}>
            <label>Chọn Keyword để phân tích</label>
            <CustomSelect
              value={selectedKeyword}
              onChange={v => setSelectedKeyword(String(v ?? ''))}
              options={kwOptions}
              placeholder="-- Chọn keyword --"
            />
          </div>

          <button
            className="btn btn-primary" style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
            onClick={handleAnalyzeClick}
            disabled={loading || !selectedKeyword}
          >
            {loading
              ? <><span className="spinner" /> Đang phân tích...</>
              : '🔍 Phân tích'}
          </button>

          {!loading && selectedKeyword && hasKeys && (
            <span style={{ alignSelf: 'flex-end', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              ~{estimatedCalls} API calls
            </span>
          )}
        </div>

        {!hasKeys && (
          <div style={{ background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: '0.82rem', color: '#ffa726', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Chưa có API key. Bấm <strong>🔍 Phân tích</strong> để nhập key, hoặc vào <strong>⚙️ Cài đặt</strong> để thêm.
          </div>
        )}

        {(refVideos.length > 0 || refChannels.length > 0) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {lastKeyword && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                Kết quả cho: <strong className="jp-text" style={{ color: 'var(--accent)' }}>{lastKeyword}</strong>
              </span>
            )}
            <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={onExportVideos} disabled={!refVideos.length}>
              📥 Xuất CSV Videos
            </button>
            <button className="btn btn-secondary" onClick={onExportChannels} disabled={!refChannels.length}>
              📥 Xuất CSV Channels
            </button>
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>⏱ Min duration: <strong>{settings?.minDurationMin ?? 8} phút</strong></span>
          <span>📅 Time window: <strong>{settings?.timeWindowDays ?? 180} ngày</strong></span>
          <span>🌏 Region: <strong>{settings?.regionCode ?? 'JP'}</strong></span>
          <span>📊 Max results: <strong>{settings?.maxResults ?? 25}</strong></span>
          {hasKeys && (
            <span>🔑 Keys: <strong style={{ color: 'var(--green)' }}>{(settings?.apiKeys ?? []).filter(k => k.trim()).length} key</strong></span>
          )}
        </div>
      </section>

      {(refVideos.length > 0 || refChannels.length > 0) && (
        <section className="card">
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
            {([
              { id: 'videos',   label: `🎬 Video Tham Khảo (${refVideos.length})` },
              { id: 'channels', label: `📺 Kênh Tham Khảo (${refChannels.length})` },
            ] as { id: SubTab; label: string }[]).map(t => (
              <button key={t.id}
                className={`tab-btn ${activeSubTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveSubTab(t.id)}
                style={{ fontSize: '0.88rem' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeSubTab === 'videos' && <RefVideoTable videos={refVideos} keyword={lastKeyword} />}
          {activeSubTab === 'channels' && (
            <RefChannelTable
              channels={refChannels}
              onTrack={onTrackChannel}
              trackedIds={trackedChannelIds}
            />
          )}
        </section>
      )}

      {showKeyModal && (
        <ApiKeyModal
          onSave={handleModalSave}
          onCancel={() => setShowKeyModal(false)}
        />
      )}
    </div>
  );
}
