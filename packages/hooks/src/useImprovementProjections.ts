import { useMemo } from 'react';
import type { Question } from '@variscout/core/findings';

// ============================================================================
// Types
// ============================================================================

export interface HypothesisProjection {
  /** Factor column name for this hypothesis */
  factor: string;
  /** Projected Cpk after removing this factor's variation, if available */
  projectedCpk: number | undefined;
}

export interface UseImprovementProjectionsReturn {
  /**
   * Suspected-cause questions with their per-factor projected Cpk values.
   * Derived from questions with `causeRole === 'suspected-cause'` that have
   * a linked factor column.
   */
  hypotheses: HypothesisProjection[];
  /**
   * Combined projected Cpk — the maximum of all per-factor projections.
   * Returns `undefined` when no projections are available.
   */
  combinedProjectedCpk: number | undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Computes improvement projection summaries from question investigation state.
 *
 * Extracts suspected-cause questions and maps them to their projected Cpk
 * values so downstream components can display "what-if" improvement scenarios
 * without duplicating the memoization logic.
 *
 * @param questions - All questions from `useQuestionGeneration`
 * @param projectedCpkMap - Per-factor projected Cpk map from `useQuestionGeneration`
 * @returns `{ hypotheses, combinedProjectedCpk }`
 */
export function useImprovementProjections(
  questions: Question[],
  projectedCpkMap: Record<string, number>
): UseImprovementProjectionsReturn {
  const hypotheses = useMemo<HypothesisProjection[]>(() => {
    return questions
      .filter(q => q.causeRole === 'suspected-cause' && q.factor)
      .map(q => ({
        factor: q.factor!,
        projectedCpk: projectedCpkMap[q.factor!],
      }));
  }, [questions, projectedCpkMap]);

  const combinedProjectedCpk = useMemo<number | undefined>(() => {
    const values = Object.values(projectedCpkMap);
    return values.length > 0 ? Math.max(...values) : undefined;
  }, [projectedCpkMap]);

  return { hypotheses, combinedProjectedCpk };
}
