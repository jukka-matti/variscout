/**
 * useReingestAutoLink — the IM-3 / CS-11 reactive cascade hook (SHARED by Azure + PWA).
 *
 * Subscribes to `useProjectStore.rawData` and, after a debounce, runs the core-pure
 * auto-link engine and SURFACES its pending-match descriptors via `onPendingMatches`.
 *
 * # De-automation (CS-11 — "tool assists, analyst decides")
 *
 * The hook is READ-COMPUTE-SURFACE ONLY. It performs ZERO writes: it does NOT inject
 * auto-Findings into `useAnalyzeStore`, does NOT dispatch any link/status `HubAction`,
 * and does NOT advance plan status. Instead it computes the engine's
 * `pendingMatches` (pure `(plan, column)` descriptors) and hands them to the host via
 * `onPendingMatches`. The host (Tasks 5/6) renders an analyst-confirm prompt and, when
 * the analyst confirms, performs the writes on its own path. This replaces the prior
 * silent auto-link cascade (direct `setState` Finding injection + dispatch loop).
 *
 * # Two-app symmetry (LOCKED #6)
 *
 * This single hook is the shared surfacer. Azure + PWA each mount it with their own
 * `HubRepository` singleton (`azureHubRepository` / `pwaHubRepository`). The
 * Azure-has-mergeRows / PWA-doesn't asymmetry is neutralized: BOTH apps funnel
 * every data transition through `setRawData`, so a single `rawData`-change
 * subscription covers append, replace, backfill, overlap, and first-load alike.
 *
 * # Append vs replace (LOCKED #3 / #4) — derived from the column delta
 *
 * The hook keys off the COLUMN-UNIVERSE delta, not the `MatchSummaryActionChoice`:
 *   - columns that APPEARED (added) → APPEND-cascade: run the matcher and surface
 *     pending matches (the analyst decides whether to link).
 *   - columns that DISAPPEARED (removed) → REPLACE re-evaluation: compute
 *     missing-column flags (FLAG, never delete). The badge itself renders reactively
 *     from `conditionHasMissingColumn` in WallCanvas; the hook surfaces the report
 *     via `onMissingColumns` for logging/telemetry ONLY (telemetry-only contract —
 *     see the REPLACE branch below).
 * A single re-ingest can do both at once (some columns added, some removed).
 *
 * # DEDUP (in-session, column-delta only)
 *
 * The subscription re-fires on every `rawData` change, so the hook short-circuits when
 * the column universe is unchanged (`addedColumns.length === 0`): a column is only
 * "new" once per session. The engine's `pendingMatches` carry a deterministic
 * `id` (`${planId}:${column}`) so the HOST can dedup/dismiss across re-fires and
 * across sessions — the hook itself holds no dismissal state (that is host state,
 * Task 6).
 *
 * # AUTO-LINK IS RE-INGEST-ONLY (link-at-creation boundary)
 *
 * The cascade fires exclusively on rawData changes (re-ingests). A plan created AFTER
 * the current column universe is already present will NOT be surfaced until a fresh
 * re-ingest changes the column universe (no link-at-creation path). This is
 * intentional: link-at-creation would require a separate plan-creation subscription
 * with different semantics. The analyst can trigger a re-ingest (or re-load the same
 * file) to pick up plans created against already-present columns.
 */

import { useEffect } from 'react';
import { useProjectStore, useAnalyzeStore } from '@variscout/stores';
import {
  computeReingestAutoLink,
  computeMissingColumnFlags,
  type MissingColumnFlags,
  type ReingestPendingMatch,
} from '@variscout/core/autoLink';
import type { HubRepository } from '@variscout/core/persistence';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

/** Default debounce window (ms) — mirrors `useWallBackgroundJobs`. */
const DEFAULT_DEBOUNCE_MS = 2000;

export interface UseReingestAutoLinkOptions {
  /** Override the debounce window (tests pass a small value). */
  debounceMs?: number;
  /**
   * Called with the REPLACE-cascade missing-column report whenever a re-ingest
   * removes a column referenced by a hypothesis condition. Report-only — the hook
   * never deletes. Defaults to a console.info breadcrumb when omitted.
   */
  onMissingColumns?: (flags: MissingColumnFlags) => void;
  /**
   * Called with the engine's pending-match descriptors whenever a re-ingest adds
   * columns that one or more MeasurementPlans named. The host renders these as an
   * analyst-confirm prompt and performs any link/status writes from the analyst's
   * confirm path — the hook NEVER writes. Each descriptor carries a deterministic
   * `id` (`${planId}:${column}`) so the host can dedup/dismiss across re-fires.
   * Not called on a no-op run (empty `pendingMatches`).
   */
  onPendingMatches?: (matches: ReingestPendingMatch[]) => void;
}

/**
 * Column universe of a row set: the UNION of all keys across ALL rows.
 *
 * Using only `rows[0]` would silently miss columns that appear in later rows but
 * not the first (sparse rows after a merge/backfill/overlap ingestion). Union-key
 * scanning matches the `collectColumnNames` logic in `parsingProfile.ts` and
 * prevents false-negative auto-links (a column present in rows 2..N but absent in
 * row 0 would be invisible to the APPEND-cascade if we only checked `rows[0]`).
 */
function columnsOf(rows: ReadonlyArray<Record<string, unknown>>): string[] {
  if (rows.length === 0) return [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      seen.add(key);
    }
  }
  return Array.from(seen);
}

/** Load all live plans across the investigation's hypotheses (the established pattern). */
async function loadActivePlans(
  repository: HubRepository,
  hypothesisIds: readonly string[]
): Promise<MeasurementPlan[]> {
  if (hypothesisIds.length === 0) return [];
  const perHypothesis = await Promise.all(
    hypothesisIds.map(id => repository.measurementPlans.listByHypothesis(id))
  );
  return perHypothesis.flat();
}

/**
 * Mount the reactive auto-link cascade for the given repository.
 *
 * @param repository - the app's `HubRepository` singleton (azure/pwa). When
 *   `null`/`undefined` the hook is inert (no subscription) — lets callers gate on
 *   readiness without violating the rules-of-hooks.
 */
export function useReingestAutoLink(
  repository: HubRepository | null | undefined,
  options: UseReingestAutoLinkOptions = {}
): void {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, onMissingColumns, onPendingMatches } = options;

  useEffect(() => {
    if (!repository) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    // Prior column universe — seeded from current data so the first reactive
    // change computes a real delta rather than treating every existing column
    // as "new" on mount.
    let priorColumns = new Set<string>(columnsOf(useProjectStore.getState().rawData));

    const runCascade = async (): Promise<void> => {
      if (cancelled) return;

      const projectState = useProjectStore.getState();
      const rows = projectState.rawData;
      const currentColumnsList = columnsOf(rows);
      const currentColumns = new Set(currentColumnsList);

      // Column-universe delta (set logic).
      const addedColumns = currentColumnsList.filter(c => !priorColumns.has(c));
      const removedColumns = [...priorColumns].filter(c => !currentColumns.has(c));
      // Commit the new baseline immediately so re-fires diff against current truth.
      priorColumns = currentColumns;

      if (addedColumns.length === 0 && removedColumns.length === 0) return;

      const analyzeState = useAnalyzeStore.getState();
      const hypotheses = analyzeState.hypotheses;

      // --- REPLACE re-evaluation: columns removed → flag (never delete) ---
      //
      // TELEMETRY-ONLY CONTRACT: this branch surfaces the missing-column report via
      // `onMissingColumns` (logging/telemetry) but does NOT persist a missing-column
      // record or dispatch any HubAction. The durable no-silent-orphan guarantee (spec
      // §7.2) is provided by the REACTIVE WallCanvas badge (`conditionHasMissingColumn`
      // in WallCanvas.tsx), not by this hook. IM-3 is intentionally non-destructive
      // on the REPLACE path — see decision-log 2026-05-30 IM-3 entry.
      //
      // TEARDOWN GUARD: when rawData → [] (full teardown / clear), `removedColumns`
      // would equal ALL prior columns — this is a teardown, not a replace-orphan event.
      // Skip the missing-column check entirely when `currentColumns` is empty.
      if (removedColumns.length > 0 && currentColumns.size > 0) {
        const flags = computeMissingColumnFlags(hypotheses, currentColumns);
        if (flags.hypothesisIds.length > 0) {
          if (onMissingColumns) {
            onMissingColumns(flags);
          } else {
            console.info(
              '[auto-link] re-ingest removed columns; hypotheses referencing absent columns (flag, not delete):',
              flags.hypothesisIds
            );
          }
        }
      }

      // --- APPEND-cascade: columns added → match + SURFACE pending matches ---
      //
      // CS-11: read-compute-surface only. We compute the engine's pending-match
      // descriptors and hand them to the host via `onPendingMatches`; the hook writes
      // NOTHING (no Finding injection, no link/status dispatch, no status advance).
      // The host renders the analyst-confirm prompt and performs confirmed writes.
      if (addedColumns.length === 0) return;

      const hypothesisIds = hypotheses.map(h => h.id);
      const plans = await loadActivePlans(repository, hypothesisIds);
      if (cancelled || plans.length === 0) return;

      const result = computeReingestAutoLink({
        newColumns: addedColumns,
        plans,
      });

      if (cancelled || result.pendingMatches.length === 0) return;

      onPendingMatches?.(result.pendingMatches);
    };

    const scheduleRun = (): void => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        void runCascade();
      }, debounceMs);
    };

    const unsubscribe = useProjectStore.subscribe((state, prev) => {
      if (state.rawData !== prev.rawData) scheduleRun();
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe();
    };
  }, [repository, debounceMs, onMissingColumns, onPendingMatches]);
}
