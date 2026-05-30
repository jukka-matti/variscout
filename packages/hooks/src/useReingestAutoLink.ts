/**
 * useReingestAutoLink — the IM-3 reactive cascade hook (SHARED by Azure + PWA).
 *
 * Subscribes to `useProjectStore.rawData` and, after a debounce, runs the
 * core-pure auto-link engine and EXECUTES its actions:
 *   - dispatches `MEASUREMENT_PLAN_LINK_FINDING` + `MEASUREMENT_PLAN_UPDATE`
 *     through the injected `HubRepository` (Dexie-backed in both apps),
 *   - injects the bare auto-Findings into `useAnalyzeStore` (the runtime source of
 *     truth for findings in BOTH apps — Azure `applyAction` treats `FINDING_*` as a
 *     no-op, so the cascade does NOT dispatch finding actions).
 *
 * # Two-app symmetry (LOCKED #6)
 *
 * This single hook is the entire executor. Azure + PWA each mount it with their own
 * `HubRepository` singleton (`azureHubRepository` / `pwaHubRepository`). The
 * Azure-has-mergeRows / PWA-doesn't asymmetry is neutralized: BOTH apps funnel
 * every data transition through `setRawData`, so a single `rawData`-change
 * subscription covers append, replace, backfill, overlap, and first-load alike.
 *
 * # Append vs replace (LOCKED #3 / #4) — derived from the column delta
 *
 * The hook keys off the COLUMN-UNIVERSE delta, not the `MatchSummaryActionChoice`:
 *   - columns that APPEARED (added) → APPEND-cascade: run the matcher + auto-link
 *     (preserve everything; never orphan).
 *   - columns that DISAPPEARED (removed) → REPLACE re-evaluation: compute
 *     missing-column flags (FLAG, never delete). The badge itself renders reactively
 *     from `conditionHasMissingColumn` in WallCanvas; the hook surfaces the report
 *     via `onMissingColumns` for logging/telemetry ONLY (telemetry-only contract —
 *     see the REPLACE branch below).
 * A single re-ingest can do both at once (some columns added, some removed).
 *
 * # IDEMPOTENCY (the #1 risk)
 *
 * The subscription re-fires on every `rawData` change, so a re-run on identical
 * data must NOT double-add findings or re-progress status:
 *   1. The engine mints CONTENT-DERIVED finding ids (`mintAutoLinkFindingId(planId,
 *      column)`), stable across runs.
 *   2. Before injecting, the hook drops any `findingsToAdd` whose id already exists
 *      in `useAnalyzeStore.findings` → no duplicate finding.
 *   3. `MEASUREMENT_PLAN_LINK_FINDING` is idempotent in the reducer (re-linking the
 *      same id is a no-op).
 *   4. The status bump fires only for `planned` plans, so a plan already
 *      `in-progress` is never re-progressed even though it re-matches.
 *
 * # AUTO-LINK IS RE-INGEST-ONLY (link-at-creation boundary)
 *
 * The auto-link cascade fires exclusively on rawData changes (re-ingests). A plan
 * created AFTER the current column universe is already present will NOT be auto-linked
 * until a fresh re-ingest changes the column universe (no link-at-creation path).
 * This is intentional: link-at-creation would require a separate plan-creation
 * subscription with different idempotency semantics. The analyst can trigger a
 * re-ingest (or re-load the same file) to pick up plans created against already-present
 * columns.
 *
 * # CROSS-SESSION IDEMPOTENCY NOTE
 *
 * The in-session duplicate-finding guard (step 2 above) depends on the auto-Finding
 * being present in `useAnalyzeStore.findings` when the hook re-fires. In Azure, the
 * `applyAction` path treats `FINDING_*` as a no-op (ADR-085), so findings survive only
 * while the store is live. After a full page reload the store is re-hydrated from the
 * blob, which means the auto-Finding must have been committed to the analyze blob before
 * the session ended for the cross-session idempotency guarantee to hold. Do not overstate
 * this guarantee: it is best-effort across sessions, strong within a session.
 */

import { useEffect } from 'react';
import { useProjectStore, useAnalyzeStore } from '@variscout/stores';
import {
  computeReingestAutoLink,
  computeMissingColumnFlags,
  mintAutoLinkFindingId,
  type MissingColumnFlags,
} from '@variscout/core/autoLink';
import type { HubRepository } from '@variscout/core/persistence';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { Finding } from '@variscout/core';

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
   * Called AFTER the APPEND-cascade dispatches at least one plan link or status
   * action (i.e. the cascade actually wrote something — not fired on a no-op run).
   *
   * Use this to invalidate any UI state that reads MeasurementPlans directly from
   * IndexedDB but is NOT keyed on the hypothesis-id list. Without this callback,
   * a plan's status advance (`planned → in-progress`) or a new `linkedFindingIds`
   * entry written to Dexie will be stale in any `wallMeasurementPlans` state that
   * only reloads on hypothesis-list changes.
   *
   * Both apps wire this to bump a refresh nonce that is included in the
   * `wallMeasurementPlans` load-effect deps so that `listByHypothesis` re-fires
   * across all hypotheses and the Wall reflects the updated plan status.
   */
  onPlansChanged?: () => void;
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
  const { debounceMs = DEFAULT_DEBOUNCE_MS, onMissingColumns, onPlansChanged } = options;

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

      // --- APPEND-cascade: columns added → match + auto-link (preserve all) ---
      if (addedColumns.length === 0) return;

      const hypothesisIds = hypotheses.map(h => h.id);
      const plans = await loadActivePlans(repository, hypothesisIds);
      if (cancelled || plans.length === 0) return;

      const result = computeReingestAutoLink({
        newColumns: addedColumns,
        plans,
        // Bare observation: no active drill scope threaded here (LOCKED #5).
        activeScopeFilters: {},
        investigationId: hypotheses[0]?.investigationId ?? 'general-unassigned',
        minters: {
          mintFindingId: mintAutoLinkFindingId,
          now: () => Date.now(),
        },
      });

      if (result.findingsToAdd.length === 0) return;

      // Idempotency gate: re-read findings AT EXECUTION TIME and drop ids already
      // present (a prior debounced run, a reload, or a manual link). Stable ids make
      // this a reliable set-membership check.
      const existingIds = new Set(useAnalyzeStore.getState().findings.map(f => f.id));
      const novelFindings: Finding[] = result.findingsToAdd.filter(f => !existingIds.has(f.id));

      if (novelFindings.length > 0) {
        useAnalyzeStore.setState(state => ({
          // Prepend to match `addFinding`'s newest-first ordering.
          findings: [...novelFindings, ...state.findings],
        }));
      }

      // Link + status actions are dispatched regardless (both are idempotent at the
      // reducer/guard level), so a plan linked by a prior run stays consistent even
      // if the finding was deduped above.
      for (const action of [...result.linkActions, ...result.statusActions]) {
        if (cancelled) return;
        await repository.dispatch(action);
      }

      // Notify the app that plans have been written (link + status actions dispatched).
      // Without this callback, any `wallMeasurementPlans` state keyed only on the
      // hypothesis-id list will not see the plan status advance (planned → in-progress)
      // because the cascade does NOT change the hypothesis-id list. The app increments
      // a nonce to force a re-read of `listByHypothesis` across all hypotheses.
      if (!cancelled) {
        onPlansChanged?.();
      }
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
  }, [repository, debounceMs, onMissingColumns, onPlansChanged]);
}
