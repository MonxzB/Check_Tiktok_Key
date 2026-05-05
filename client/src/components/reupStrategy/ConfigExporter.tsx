// ============================================================
// components/reupStrategy/ConfigExporter.tsx — Phase 19
// ============================================================
import React, { useState } from 'react';
import { exportConfigAsJson } from '../../lib/reupAdvisor/configMapper.ts';
import type { Strategy } from '../../lib/reupAdvisor/strategyTypes.ts';

interface Props {
  strategy: Strategy;
}

export default function ConfigExporter({ strategy }: Props) {
  const [copied, setCopied] = useState(false);
  const json = exportConfigAsJson(strategy);

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reup-config-${strategy.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📋 Config JSON
        </span>
        <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.75rem' }} onClick={handleCopy}>
          {copied ? '✅ Đã copy' : '📋 Copy'}
        </button>
        <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.75rem' }} onClick={handleDownload}>
          💾 .json
        </button>
      </div>
      <pre style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
        overflowX: 'auto',
        maxHeight: 200,
        overflowY: 'auto',
        fontFamily: "'Courier New', monospace",
        lineHeight: 1.5,
        whiteSpace: 'pre',
      }}>
        {json}
      </pre>
    </div>
  );
}
