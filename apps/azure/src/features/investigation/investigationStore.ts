import { create } from 'zustand';
import type { Question, IdeaImpact, SuspectedCause } from '@variscout/core';

// ── Types ───────────────────────────────────────────────────────────────────

export interface QuestionDisplayData {
  text: string;
  status: string;
  factor?: string;
  level?: string;
  causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
}

export interface ProjectionTarget {
  questionId: string;
  ideaId: string;
  ideaText: string;
  questionText: string;
}

// ── State ───────────────────────────────────────────────────────────────────

interface InvestigationStoreState {
  /** All questions (synced from useQuestions hook) */
  questions: Question[];
  /** Map of question ID to display data for FindingCard */
  questionsMap: Record<string, QuestionDisplayData>;
  /** Computed idea impacts keyed by idea ID */
  ideaImpacts: Record<string, IdeaImpact | undefined>;
  /** Current projection target for What-If round-trip */
  projectionTarget: ProjectionTarget | null;
  /** Question ID to expand/scroll-to in the investigation tree (null = none) */
  expandedQuestionId: string | null;
  /** Suspected cause hubs (synced from useSuspectedCauses hook) */
  suspectedCauses: SuspectedCause[];
}

// ── Actions ─────────────────────────────────────────────────────────────────

interface InvestigationStoreActions {
  /**
   * Sync questions from the useQuestions hook into the store.
   * Called by useInvestigationOrchestration whenever questions change.
   */
  syncQuestions: (questions: Question[]) => void;
  /** Sync the pre-computed questions display map */
  syncQuestionsMap: (map: Record<string, QuestionDisplayData>) => void;
  /** Sync the pre-computed idea impacts */
  syncIdeaImpacts: (impacts: Record<string, IdeaImpact | undefined>) => void;
  /** Set or clear the projection target for What-If round-trip */
  setProjectionTarget: (target: ProjectionTarget | null) => void;
  /** Expand and scroll-to a question in the investigation tree (null = clear) */
  expandToQuestion: (id: string | null) => void;
  /**
   * Sync suspected cause hubs from useSuspectedCauses hook.
   * Called by useInvestigationOrchestration whenever hubs change.
   */
  syncSuspectedCauses: (hubs: SuspectedCause[]) => void;
}

export type InvestigationStore = InvestigationStoreState & InvestigationStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useInvestigationFeatureStore = create<InvestigationStore>(set => ({
  // Initial state
  questions: [],
  questionsMap: {},
  ideaImpacts: {},
  projectionTarget: null,
  expandedQuestionId: null,
  suspectedCauses: [],

  // Actions
  syncQuestions: (questions: Question[]) => set({ questions }),
  syncQuestionsMap: (map: Record<string, QuestionDisplayData>) => set({ questionsMap: map }),
  syncIdeaImpacts: (impacts: Record<string, IdeaImpact | undefined>) =>
    set({ ideaImpacts: impacts }),
  setProjectionTarget: (target: ProjectionTarget | null) => set({ projectionTarget: target }),
  expandToQuestion: id => set({ expandedQuestionId: id }),
  syncSuspectedCauses: (hubs: SuspectedCause[]) => set({ suspectedCauses: hubs }),
}));
