import { create } from 'zustand';
import type { Hypothesis, IdeaImpact, ProcessContext, StatsResult } from '@variscout/core';
import { computeIdeaImpact } from '@variscout/core';

export interface ProjectionTarget {
  /** The hypothesis whose idea is being projected (IM-1: re-keyed from questionId). */
  hypothesisId: string;
  ideaId: string;
  ideaText: string;
  /** The hypothesis name shown in the What-If header. */
  hypothesisText: string;
}

export interface AnalyzeFeatureStoreState {
  /** Current projection target for What-If round-trip. */
  projectionTarget: ProjectionTarget | null;
  /** Hypothesis ID to expand/scroll-to in the Wall (null = none). */
  expandedHypothesisId: string | null;
}

export interface AnalyzeFeatureStoreActions {
  /** Set or clear the projection target for What-If round-trip. */
  setProjectionTarget: (target: ProjectionTarget | null) => void;
  /** Expand and scroll-to a hypothesis in the Wall (null = clear). */
  expandToHypothesis: (id: string | null) => void;
}

export type AnalyzeFeatureStore = AnalyzeFeatureStoreState & AnalyzeFeatureStoreActions;

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

export function createAnalyzeFeatureStore() {
  return create<AnalyzeFeatureStore>(set => ({
    projectionTarget: null,
    expandedHypothesisId: null,
    setProjectionTarget: (target: ProjectionTarget | null) => set({ projectionTarget: target }),
    expandToHypothesis: id => set({ expandedHypothesisId: id }),
  }));
}
