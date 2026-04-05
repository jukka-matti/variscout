import { create } from 'zustand';
import type { Question } from '@variscout/core';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ImprovementQuestion {
  id: string;
  text: string;
  causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
  factor?: string;
  ideas: NonNullable<Question['ideas']>;
  linkedFindingName?: string;
}

// ── State ───────────────────────────────────────────────────────────────────

interface ImprovementStoreState {
  /** Questions with answered/investigating status that have ideas */
  improvementQuestions: ImprovementQuestion[];
  /** Findings linked to any question with ideas */
  improvementLinkedFindings: Array<{ id: string; text: string }>;
  /** Set of selected idea IDs across all questions */
  selectedIdeaIds: Set<string>;
  /** Projected Cpk map: finding ID -> projected Cpk */
  projectedCpkMap: Record<string, number>;
  /** Ideas that already have matching action items */
  convertedIdeaIds: Set<string>;
  /** Active improvement view: plan (default) or track */
  activeImprovementView: 'plan' | 'track';
  /** ID of idea highlighted via matrix↔card bidirectional navigation */
  highlightedIdeaId: string | null;
}

// ── Actions ─────────────────────────────────────────────────────────────────

interface ImprovementStoreActions {
  /**
   * Bulk sync all computed state from the orchestration hook.
   * Called by useImprovementOrchestration whenever dependencies change.
   */
  syncState: (state: {
    improvementQuestions: ImprovementQuestion[];
    improvementLinkedFindings: Array<{ id: string; text: string }>;
    selectedIdeaIds: Set<string>;
    projectedCpkMap: Record<string, number>;
    convertedIdeaIds: Set<string>;
  }) => void;
  /** Switch between plan and track views */
  setActiveImprovementView: (view: 'plan' | 'track') => void;
  /** Set highlighted idea ID for bidirectional matrix↔card navigation */
  setHighlightedIdeaId: (id: string | null) => void;
}

export type ImprovementStore = ImprovementStoreState & ImprovementStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useImprovementFeatureStore = create<ImprovementStore>(set => ({
  // Initial state
  improvementQuestions: [],
  improvementLinkedFindings: [],
  selectedIdeaIds: new Set<string>(),
  projectedCpkMap: {},
  convertedIdeaIds: new Set<string>(),
  activeImprovementView: 'plan',
  highlightedIdeaId: null,

  // Actions
  syncState: state => set(state),
  setActiveImprovementView: view => set({ activeImprovementView: view }),
  setHighlightedIdeaId: id => set({ highlightedIdeaId: id }),
}));
