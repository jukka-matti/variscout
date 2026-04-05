import { create } from 'zustand';

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

// ── Pure computation functions (used by orchestration hook) ─────────────────

import type { Question, IdeaImpact, ProcessContext, StatsResult } from '@variscout/core';
import { computeIdeaImpact } from '@variscout/core';

/** Build a lookup map from Question[] to display data keyed by question ID. */
export function buildQuestionsMap(questions: Question[]): Record<string, QuestionDisplayData> {
  const map: Record<string, QuestionDisplayData> = {};
  for (const q of questions) {
    map[q.id] = {
      text: q.text,
      status: q.status,
      factor: q.factor,
      level: q.level,
      causeRole: q.causeRole,
    };
  }
  return map;
}

/** Build a lookup map of idea impacts keyed by idea ID. */
export function buildIdeaImpacts(
  questions: Question[],
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

  for (const q of questions) {
    if (q.ideas) {
      for (const idea of q.ideas) {
        impacts[idea.id] = computeIdeaImpact(idea, target, currentStats);
      }
    }
  }
  return impacts;
}

// ── State ───────────────────────────────────────────────────────────────────

interface InvestigationStoreState {
  /** Current projection target for What-If round-trip */
  projectionTarget: ProjectionTarget | null;
  /** Question ID to expand/scroll-to in the investigation tree (null = none) */
  expandedQuestionId: string | null;
}

// ── Actions ─────────────────────────────────────────────────────────────────

interface InvestigationStoreActions {
  /** Set or clear the projection target for What-If round-trip */
  setProjectionTarget: (target: ProjectionTarget | null) => void;
  /** Expand and scroll-to a question in the investigation tree (null = clear) */
  expandToQuestion: (id: string | null) => void;
}

export type InvestigationStore = InvestigationStoreState & InvestigationStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useInvestigationFeatureStore = create<InvestigationStore>(set => ({
  // Initial state
  projectionTarget: null,
  expandedQuestionId: null,

  // Actions
  setProjectionTarget: (target: ProjectionTarget | null) => set({ projectionTarget: target }),
  expandToQuestion: id => set({ expandedQuestionId: id }),
}));
