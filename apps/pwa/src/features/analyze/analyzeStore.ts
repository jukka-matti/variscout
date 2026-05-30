import { create } from 'zustand';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ProjectionTarget {
  /** The hypothesis whose idea is being projected (IM-1: re-keyed from questionId). */
  hypothesisId: string;
  ideaId: string;
  ideaText: string;
  /** The hypothesis name shown in the What-If header. */
  hypothesisText: string;
}

// ── Pure computation functions (used by orchestration hook) ─────────────────

import type { Hypothesis, IdeaImpact, ProcessContext, StatsResult } from '@variscout/core';
import { computeIdeaImpact } from '@variscout/core';

/**
 * Build a lookup map of idea impacts keyed by idea ID. Ideas now live on
 * `Hypothesis.ideas` (IM-1, ADR-085) — the retired Question entity no longer
 * carries them.
 */
export function buildIdeaImpacts(
  hypotheses: Hypothesis[],
  processContext: ProcessContext | undefined,
  stats: StatsResult | null
): Record<string, IdeaImpact | undefined> {
  const impacts: Record<string, IdeaImpact | undefined> = {};
  const target =
    processContext?.targetMetric && processContext?.targetValue !== undefined
      ? {
          metric: processContext.targetMetric,
          value: processContext.targetValue,
          direction: processContext.targetDirection ?? 'minimize',
        }
      : undefined;
  const currentStats = stats
    ? { mean: stats.mean, sigma: stats.stdDev, cpk: stats.cpk }
    : undefined;

  for (const h of hypotheses) {
    if (h.ideas) {
      for (const idea of h.ideas) {
        impacts[idea.id] = computeIdeaImpact(idea, target, currentStats);
      }
    }
  }
  return impacts;
}

// ── State ───────────────────────────────────────────────────────────────────

interface AnalyzeStoreState {
  /** Current projection target for What-If round-trip */
  projectionTarget: ProjectionTarget | null;
  /** Hypothesis ID to expand/scroll-to in the Wall (null = none) */
  expandedHypothesisId: string | null;
}

// ── Actions ─────────────────────────────────────────────────────────────────

interface AnalyzeStoreActions {
  /** Set or clear the projection target for What-If round-trip */
  setProjectionTarget: (target: ProjectionTarget | null) => void;
  /** Expand and scroll-to a hypothesis in the Wall (null = clear) */
  expandToHypothesis: (id: string | null) => void;
}

export type AnalyzeStore = AnalyzeStoreState & AnalyzeStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useAnalyzeFeatureStore = create<AnalyzeStore>(set => ({
  // Initial state
  projectionTarget: null,
  expandedHypothesisId: null,

  // Actions
  setProjectionTarget: (target: ProjectionTarget | null) => set({ projectionTarget: target }),
  expandToHypothesis: id => set({ expandedHypothesisId: id }),
}));
