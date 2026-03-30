import { create } from 'zustand';
import type { Hypothesis } from '@variscout/core';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ImprovementHypothesis {
  id: string;
  text: string;
  causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
  factor?: string;
  ideas: NonNullable<Hypothesis['ideas']>;
  linkedFindingName?: string;
}

// ── State ───────────────────────────────────────────────────────────────────

interface ImprovementStoreState {
  /** Hypotheses with supported/partial status that have ideas */
  improvementHypotheses: ImprovementHypothesis[];
  /** Findings linked to any hypothesis with ideas */
  improvementLinkedFindings: Array<{ id: string; text: string }>;
  /** Set of selected idea IDs across all hypotheses */
  selectedIdeaIds: Set<string>;
  /** Projected Cpk map: finding ID -> projected Cpk */
  projectedCpkMap: Record<string, number>;
  /** Ideas that already have matching action items */
  convertedIdeaIds: Set<string>;
}

// ── Actions ─────────────────────────────────────────────────────────────────

interface ImprovementStoreActions {
  /**
   * Bulk sync all computed state from the orchestration hook.
   * Called by useImprovementOrchestration whenever dependencies change.
   */
  syncState: (state: {
    improvementHypotheses: ImprovementHypothesis[];
    improvementLinkedFindings: Array<{ id: string; text: string }>;
    selectedIdeaIds: Set<string>;
    projectedCpkMap: Record<string, number>;
    convertedIdeaIds: Set<string>;
  }) => void;
}

export type ImprovementStore = ImprovementStoreState & ImprovementStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useImprovementStore = create<ImprovementStore>(set => ({
  // Initial state
  improvementHypotheses: [],
  improvementLinkedFindings: [],
  selectedIdeaIds: new Set<string>(),
  projectedCpkMap: {},
  convertedIdeaIds: new Set<string>(),

  // Actions
  syncState: state => set(state),
}));
