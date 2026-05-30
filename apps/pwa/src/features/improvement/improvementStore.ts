/**
 * ImprovementHypothesis type — shared between the orchestration hook and UI components.
 *
 * The Zustand store has been removed: all synced state is now returned from
 * useImprovementOrchestration directly.
 *
 * IM-1 (ADR-085): improvement ideas re-home onto `Hypothesis` (the suspected
 * cause they fix). The retired `Question` entity + `causeRole` are gone; the
 * badge derives from `Hypothesis.status`.
 */
import type { Hypothesis, HypothesisStatus } from '@variscout/core';

export interface ImprovementHypothesis {
  id: string;
  text: string;
  status?: HypothesisStatus;
  factor?: string;
  ideas: NonNullable<Hypothesis['ideas']>;
  linkedFindingName?: string;
  evidence?: { rSquaredAdj?: number; etaSquared?: number };
}
