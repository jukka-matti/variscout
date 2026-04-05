/**
 * ImprovementQuestion type — shared between the orchestration hook and UI components.
 *
 * The Zustand store has been removed: all synced state is now returned from
 * useImprovementOrchestration, and UI state (activeImprovementView, highlightedIdeaId)
 * lives in panelsStore.
 */
import type { Question } from '@variscout/core';

export interface ImprovementQuestion {
  id: string;
  text: string;
  causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
  factor?: string;
  ideas: NonNullable<Question['ideas']>;
  linkedFindingName?: string;
}
