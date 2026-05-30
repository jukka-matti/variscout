import { useMemo } from 'react';
import type { Hypothesis } from '@variscout/core/findings';

// ============================================================================
// Types
// ============================================================================

export interface HypothesisProjection {
  /** Factor column name for this hypothesis (derived from findingIds → activeFilters) */
  factor: string;
  /** Projected Cpk after removing this factor's variation, if available */
  projectedCpk: number | undefined;
}

export interface UseImprovementProjectionsReturn {
  /**
   * Hypothesis hubs with their per-factor projected Cpk values.
   * Derived from hypotheses selected for improvement that have a linked factor.
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
 * Computes improvement projection summaries from hypothesis investigation state.
 *
 * Extracts hypotheses selected for improvement and maps them to their projected Cpk
 * values so downstream components can display "what-if" improvement scenarios
 * without duplicating the memoization logic.
 *
 * @param hubs - All Hypothesis hubs from the analyzeStore
 * @param projectedCpkMap - Per-factor projected Cpk map
 * @returns `{ hypotheses, combinedProjectedCpk }`
 */
export function useImprovementProjections(
  hubs: Hypothesis[],
  projectedCpkMap: Record<string, number>
): UseImprovementProjectionsReturn {
  const hypotheses = useMemo<HypothesisProjection[]>(() => {
    // Coarse gate: surface per-factor projections only while at least one hub
    // is selected for improvement and not refuted. Precise factor↔hub matching
    // is deferred to IM-5 (level-native contribution) — IM-1 only drops the
    // retired Question coupling.
    const hasActiveHub = hubs.some(h => h.selectedForImprovement && h.status !== 'refuted');
    if (!hasActiveHub) return [];
    return Object.entries(projectedCpkMap).map(([factor, projectedCpk]) => ({
      factor,
      projectedCpk,
    }));
  }, [hubs, projectedCpkMap]);

  const combinedProjectedCpk = useMemo<number | undefined>(() => {
    const values = Object.values(projectedCpkMap);
    return values.length > 0 ? Math.max(...values) : undefined;
  }, [projectedCpkMap]);

  return { hypotheses, combinedProjectedCpk };
}
