import { create } from 'zustand';
import type { Hypothesis, IdeaImpact } from '@variscout/core';

// ── Types ───────────────────────────────────────────────────────────────────

export interface HypothesisDisplayData {
  text: string;
  status: string;
  factor?: string;
  level?: string;
  causeRole?: 'primary' | 'contributing';
}

export interface ProjectionTarget {
  hypothesisId: string;
  ideaId: string;
  ideaText: string;
  hypothesisText: string;
}

// ── State ───────────────────────────────────────────────────────────────────

interface InvestigationStoreState {
  /** All hypotheses (synced from useHypotheses hook) */
  hypotheses: Hypothesis[];
  /** Map of hypothesis ID to display data for FindingCard */
  hypothesesMap: Record<string, HypothesisDisplayData>;
  /** Computed idea impacts keyed by idea ID */
  ideaImpacts: Record<string, IdeaImpact | undefined>;
  /** Current projection target for What-If round-trip */
  projectionTarget: ProjectionTarget | null;
  /** Hypothesis ID to expand/scroll-to in the investigation tree (null = none) */
  expandedHypothesisId: string | null;
}

// ── Actions ─────────────────────────────────────────────────────────────────

interface InvestigationStoreActions {
  /**
   * Sync hypotheses from the useHypotheses hook into the store.
   * Called by useInvestigationOrchestration whenever hypotheses change.
   */
  syncHypotheses: (hypotheses: Hypothesis[]) => void;
  /** Sync the pre-computed hypotheses display map */
  syncHypothesesMap: (map: Record<string, HypothesisDisplayData>) => void;
  /** Sync the pre-computed idea impacts */
  syncIdeaImpacts: (impacts: Record<string, IdeaImpact | undefined>) => void;
  /** Set or clear the projection target for What-If round-trip */
  setProjectionTarget: (target: ProjectionTarget | null) => void;
  /** Expand and scroll-to a hypothesis in the investigation tree (null = clear) */
  expandToHypothesis: (id: string | null) => void;
}

export type InvestigationStore = InvestigationStoreState & InvestigationStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useInvestigationStore = create<InvestigationStore>(set => ({
  // Initial state
  hypotheses: [],
  hypothesesMap: {},
  ideaImpacts: {},
  projectionTarget: null,
  expandedHypothesisId: null,

  // Actions
  syncHypotheses: (hypotheses: Hypothesis[]) => set({ hypotheses }),
  syncHypothesesMap: (map: Record<string, HypothesisDisplayData>) => set({ hypothesesMap: map }),
  syncIdeaImpacts: (impacts: Record<string, IdeaImpact | undefined>) =>
    set({ ideaImpacts: impacts }),
  setProjectionTarget: (target: ProjectionTarget | null) => set({ projectionTarget: target }),
  expandToHypothesis: id => set({ expandedHypothesisId: id }),
}));
