/**
 * useWallBackgroundJobs — background best-subsets pipeline + CoScout emit
 *
 * Subscribes to `projectStore.rawData`/`outcome` and `investigationStore.suspectedCauses`
 * and, after a 2000ms debounce, runs `detectBestSubsetsCandidates(rows, outcome,
 * allColumns, citedColumns)`. Results are emitted into `aiStore.wallSuggestions`
 * via `upsertWallSuggestion` under a stable id (`'best-subsets'`) so repeated
 * debounced runs replace the entry rather than stack up. When the detector
 * returns `[]`, the entry is cleared.
 *
 * # Emit-target decision (Phase 9.2 deviation note)
 *
 * The original plan line said "extend aiStore with a new message kind
 * 'suggestion'". `aiStore.coscoutMessages` is strictly typed as
 * `UseAICoScoutReturn['messages']` — the external hook's message shape.
 * Extending that external union would cross a package boundary and pollute
 * every CoScout consumer with a new variant for a single background pipeline.
 *
 * Instead, this hook emits via a dedicated `aiStore.wallSuggestions: WallSuggestion[]`
 * field with shape `{ kind: 'suggestion', id, source, candidates, emittedAt }`.
 * The CoScout panel can render these alongside the message list without
 * needing the upstream type to change. This is minimal (one field, three
 * small actions: upsert / dismiss / clear) and matches existing aiStore
 * patterns (`suggestedQuestions`, `actionProposals`).
 *
 * # Column universe
 *
 * `allColumns` is derived from `Object.keys(rows[0])` minus the outcome
 * column. The detector itself gates on `rows.length < minRows` (default 10),
 * so short bursts of data immediately after upload are safely no-op.
 */

import { useEffect } from 'react';
import { detectBestSubsetsCandidates } from '@variscout/core';
import { collectReferencedColumns } from '@variscout/core';
import { useProjectStore, useInvestigationStore } from '@variscout/stores';
import { useAIStore } from '../ai/aiStore';

/** Stable id used so repeated debounced runs replace the same entry. */
const SUGGESTION_ID = 'best-subsets';

/** Debounce window for the detector run (ms). */
const DEBOUNCE_MS = 2000;

function deriveAllColumns(rows: Record<string, unknown>[], outcome: string): string[] {
  if (rows.length === 0) return [];
  const first = rows[0];
  return Object.keys(first).filter(col => col !== outcome);
}

function computeCitedColumns(
  suspectedCauses: ReturnType<typeof useInvestigationStore.getState>['suspectedCauses']
): string[] {
  const cited = new Set<string>();
  for (const hub of suspectedCauses) {
    const condition = hub.condition;
    if (!condition) continue;
    for (const col of collectReferencedColumns(condition)) {
      cited.add(col);
    }
  }
  return [...cited];
}

/**
 * Hook entry point. Call at the top level of a Wall-aware workspace component.
 * Idempotent and self-cleans on unmount.
 */
export function useWallBackgroundJobs(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const scheduleRun = (): void => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        if (cancelled) return;

        const projectState = useProjectStore.getState();
        const investigationState = useInvestigationStore.getState();
        const aiActions = useAIStore.getState();

        const rows = projectState.rawData;
        const outcome = projectState.outcome;
        if (!outcome || rows.length === 0) {
          return;
        }

        const allColumns = deriveAllColumns(rows, outcome);
        if (allColumns.length === 0) return;

        const citedColumns = computeCitedColumns(investigationState.suspectedCauses);

        const candidates = detectBestSubsetsCandidates(rows, outcome, allColumns, citedColumns);

        if (candidates.length === 0) {
          aiActions.dismissWallSuggestion(SUGGESTION_ID);
          return;
        }

        aiActions.upsertWallSuggestion({
          kind: 'suggestion',
          id: SUGGESTION_ID,
          source: 'best-subsets',
          candidates,
          emittedAt: Date.now(),
        });
      }, DEBOUNCE_MS);
    };

    // Project store — fires on any field change; we filter to rawData/outcome.
    const unsubscribeProject = useProjectStore.subscribe((state, prev) => {
      if (state.rawData !== prev.rawData || state.outcome !== prev.outcome) {
        scheduleRun();
      }
    });

    // Investigation store — fires on any change; filter to suspectedCauses.
    const unsubscribeInvestigation = useInvestigationStore.subscribe((state, prev) => {
      if (state.suspectedCauses !== prev.suspectedCauses) {
        scheduleRun();
      }
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      unsubscribeProject();
      unsubscribeInvestigation();
    };
  }, []);
}
