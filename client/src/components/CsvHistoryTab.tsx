import React, { useRef } from 'react';
import type { Keyword, RefVideo, RefChannel } from '../types';
import type { ToastFn } from '../hooks/useToast.js';
import { exportKeywordsCSV, exportRefVideosCSV, exportRefChannelsCSV, downloadBlob } from '../engine/csvUtils.js';

interface CsvHistoryTabProps {
  keywords: Keyword[];
  refVideos: RefVideo[];
  refChannels: RefChannel[];
  onImport: (text: string) => void;
  toast: ToastFn;
  personalScoringEnabled?: boolean;
}

export default function CsvHistoryTab({ keywords, refVideos, refChannels, onImport, toast, personalScoringEnabled = false }: CsvHistoryTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) onImport(ev.target.result as string); };
    reader.readAsText(file, 'utf-8'); e.target.value = '';
  }

  function handleExportKeywords() {
    if (!keywords.length) { toast('Chưa có keyword', 'error'); return; }
    downloadBlob(exportKeywordsCSV(keywords, personalScoringEnabled), 'youtube_longform_keywords.csv');
    toast(`Đã xuất CSV keywords! (chế độ: ${personalScoringEnabled ? 'Personal Score' : 'LF Score'})`, 'success');
  }
  function handleExportVideos() {
    if (!refVideos.length) { toast('Chưa có reference videos', 'error'); return; }
    downloadBlob(exportRefVideosCSV(refVideos), 'youtube_ref_videos.csv');
    toast('Đã xuất CSV reference videos!', 'success');
  }
  function handleExportChannels() {
    if (!refChannels.length) { toast('Chưa có reference channels', 'error'); return; }
    downloadBlob(exportRefChannelsCSV(refChannels), 'youtube_ref_channels.csv');
    toast('Đã xuất CSV reference channels!', 'success');
  }

  const scored   = keywords.filter(k => k.longFormScore > 0);
  const withData = keywords.filter(k => (k.apiData?.longVideosFound ?? 0) > 0);

  const exportCards = [
    { title: 'Keywords Long-Form', desc: `${keywords.length} keywords với đầy đủ điểm số, chapters, metadata`, count: keywords.length, onClick: handleExportKeywords, filename: 'youtube_longform_keywords.csv' },
    { title: 'Reference Videos',   desc: `${refVideos.length} video tham khảo với thời lượng, views, fit score`,  count: refVideos.length,   onClick: handleExportVideos,   filename: 'youtube_ref_videos.csv'   },
    { title: 'Reference Channels', desc: `${refChannels.length} kênh tham khảo với subscribers, fit score`,        count: refChannels.length, onClick: handleExportChannels, filename: 'youtube_ref_channels.csv' },
  ];

  return (
    <div>
      <section className="card">
        <h2><span className="icon">📁</span> CSV / History</h2>

        <div className="stats-bar mb-6">
          {[
            { label: '📋 Keywords:',      val: keywords.length  },
            { label: '📊 Đã chấm điểm:', val: scored.length    },
            { label: '▶️ Đã có YT data:', val: withData.length  },
            { label: '🎬 Ref Videos:',    val: refVideos.length  },
            { label: '📺 Ref Channels:',  val: refChannels.length },
          ].map(s => (
            <div key={s.label} className="stat-chip">
              <span>{s.label}</span>
              <span className="stat-value">{s.val}</span>
            </div>
          ))}
        </div>

        <div className="csv-section">
          <h3>📥 Xuất dữ liệu</h3>
          <div className="grid gap-4 mt-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {exportCards.map(item => (
              <div key={item.title} className="rounded-lg p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="font-semibold mb-1.5">{item.title}</div>
                <div className="text-[0.8rem] text-text-secondary mb-3">{item.desc}</div>
                <button className="btn btn-primary w-full justify-center" onClick={item.onClick} disabled={item.count === 0}>
                  📥 Xuất {item.filename}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="csv-section mt-6">
          <h3>📤 Nhập dữ liệu từ CSV</h3>
          <p className="text-[0.83rem] text-text-secondary mb-3">
            Nhập file CSV keywords đã xuất trước đó. Các keyword chưa có sẽ được thêm vào danh sách hiện tại.
          </p>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            📂 Chọn file CSV keywords để nhập
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        <div className="mt-6 px-4 py-3.5 rounded-lg"
          style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
          <h3 className="text-[0.9rem] mb-2 text-accent">ℹ️ Về độ tươi dữ liệu</h3>
          <div className="text-[0.8rem] text-text-secondary leading-relaxed">
            <div>🟢 <strong>Fresh</strong> — Thu thập trong vòng 7 ngày qua</div>
            <div>🔵 <strong>Recent</strong> — Thu thập trong vòng 30 ngày qua</div>
            <div>🟡 <strong>Stale</strong> — Thu thập từ 30–90 ngày trước</div>
            <div>🔴 <strong>Very stale</strong> — Thu thập từ hơn 90 ngày trước</div>
          </div>
        </div>
      </section>
    </div>
  );
}
