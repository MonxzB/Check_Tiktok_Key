// ============================================================
// lib/reupAdvisor/configMapper.ts — Phase 19
// Maps Strategy → external video editor tool JSON format
// ============================================================
import type { Strategy, CutConfig } from './strategyTypes.ts';

// External tool config format
export interface ExternalToolConfig {
  version: '1.0';
  strategy: string;
  output_type: string;
  clips: ExternalClipConfig[];
  global: {
    trim_start_s: number;
    trim_end_s: number;
    audio_swap: boolean;
    duet_enabled: boolean;
    duet_layout?: string;
    bg_category?: string;
  };
  break_cut?: {
    keep_s: number;
    skip_s: number;
  };
  metadata: {
    estimated_clips: number;
    safety_score: number;
    generated_at: string;
  };
}

export interface ExternalClipConfig {
  index: number;
  start_s?: number;
  end_s?: number;
  duration_s: number;
  overlay_text?: string;
}

export function mapStrategyToExternalConfig(strategy: Strategy): ExternalToolConfig {
  const cfg: CutConfig = strategy.config;

  const clips: ExternalClipConfig[] = Array.from(
    { length: strategy.estimatedClips },
    (_, i) => ({
      index: i + 1,
      duration_s: cfg.durationPerPart,
      overlay_text: cfg.customText?.[i] ?? undefined,
      ...(cfg.selectRange?.enabled
        ? { start_s: cfg.selectRange.fromSecond, end_s: cfg.selectRange.toSecond }
        : {}),
    }),
  );

  return {
    version: '1.0',
    strategy: strategy.id,
    output_type: strategy.outputType,
    clips,
    global: {
      trim_start_s: cfg.trimStart,
      trim_end_s: cfg.trimEnd,
      audio_swap: cfg.audioSwap,
      duet_enabled: cfg.duet.enabled,
      ...(cfg.duet.enabled
        ? { duet_layout: cfg.duet.layout, bg_category: cfg.duet.bgVideoCategory }
        : {}),
    },
    ...(cfg.breakCut.enabled
      ? { break_cut: { keep_s: cfg.breakCut.keep, skip_s: cfg.breakCut.skip } }
      : {}),
    metadata: {
      estimated_clips: strategy.estimatedClips,
      safety_score: strategy.safetyScore,
      generated_at: new Date().toISOString(),
    },
  };
}

export function exportConfigAsJson(strategy: Strategy): string {
  return JSON.stringify(mapStrategyToExternalConfig(strategy), null, 2);
}
