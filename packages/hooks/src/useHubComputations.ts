/**
 * useHubComputations - Shared hub evidence and projection memos
 *
 * Extracts the identical hub evidence/projection computation blocks from
 * EditorDashboardView.tsx and InvestigationWorkspace.tsx into a single
 * shared hook.
 *
 * Computes:
 * - hubEvidences: Map of hub id → SuspectedCauseEvidence (R²adj-based)
 * - worstLevels: Record of factor → worst level string (for projection)
 * - hubProjections: Map of hub id → HubProjection (predicted improvement)
 */
import { useMemo } from 'react';

import { computeHubEvidence, computeHubProjection } from '@variscout/core/findings';
import type { BestSubsetsResult } from '@variscout/core/stats';
import type { HubProjection, SuspectedCauseEvidence } from '@variscout/core/findings';
import type { Question } from '@variscout/core';
import { resolveMode } from '@variscout/core/strategy';
import { useInvestigationStore } from '@variscout/stores';
import { useProjectStore } from '@variscout/stores';

export interface UseHubComputationsReturn {
  /** Evidence summary per hub (undefined when no hubs exist) */
  hubEvidences: Map<string, SuspectedCauseEvidence> | undefined;
  /** Worst factor levels derived from best-subsets level effects */
  worstLevels: Record<string, string>;
  /** Projection per hub (undefined when no hubs or no best-subsets result) */
  hubProjections: Map<string, HubProjection> | undefined;
}

/**
 * Computes hub evidence and projection memos shared across dashboard and
 * investigation workspace views.
 *
 * @param bestSubsets - Best subsets regression result, or null if unavailable
 * @param questions - All questions currently in scope
 */
export function useHubComputations(
  bestSubsets: BestSubsetsResult | null,
  questions: Question[]
): UseHubComputationsReturn {
  const hubs = useInvestigationStore(s => s.suspectedCauses);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const specs = useProjectStore(s => s.specs);

  const resolved = resolveMode(analysisMode);

  const hubEvidences = useMemo(() => {
    if (hubs.length === 0) return undefined;

    const evidenceMode: SuspectedCauseEvidence['mode'] =
      resolved === 'capability'
        ? 'capability'
        : resolved === 'performance'
          ? 'performance'
          : resolved === 'yamazumi'
            ? 'yamazumi'
            : 'standard';

    const map = new Map<string, SuspectedCauseEvidence>();
    for (const hub of hubs) {
      map.set(hub.id, computeHubEvidence(hub, questions, bestSubsets, evidenceMode));
    }
    return map;
  }, [hubs, questions, bestSubsets, resolved]);

  const worstLevels = useMemo((): Record<string, string> => {
    if (!bestSubsets) return {};

    const worst: Record<string, string> = {};
    for (const subset of bestSubsets.subsets) {
      for (const factor of subset.factors) {
        if (worst[factor]) continue;
        const effects = subset.levelEffects.get(factor);
        if (!effects) continue;

        let worstLevel: string | undefined;
        let worstEffect = -Infinity;
        for (const [level, effect] of effects.entries()) {
          if (Math.abs(effect) > worstEffect) {
            worstEffect = Math.abs(effect);
            worstLevel = level;
          }
        }
        if (worstLevel) worst[factor] = worstLevel;
      }
    }
    return worst;
  }, [bestSubsets]);

  const hubProjections = useMemo(() => {
    if (hubs.length === 0 || !bestSubsets) return undefined;

    const map = new Map<string, HubProjection>();
    for (const hub of hubs) {
      const proj = computeHubProjection(hub, questions, bestSubsets, worstLevels, specs);
      if (proj) map.set(hub.id, proj);
    }
    return map;
  }, [hubs, questions, bestSubsets, worstLevels, specs]);

  return { hubEvidences, worstLevels, hubProjections };
}
