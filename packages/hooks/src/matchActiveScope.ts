/**
 * matchActiveScopeId — find the EXISTING ProblemStatementScope whose predicate
 * set equals the live categorical drill, scoped to a project + outcome.
 *
 * This is the shared lookup behind the ER-2 strip's scope what-if write-through.
 * Both apps' Dashboards drill into a condition; when that drill matches a scope
 * the analyst already created on the Analyze tab, selecting a strip chip should
 * refresh that scope's stored what-if number (`recomputeScopeWhatIf`). The match
 * is read-only — this helper NEVER creates a scope (ER-4 owns creation).
 *
 * The matching mirrors AnalyzeView.tsx:167-178 / AnalyzeWorkspace.tsx:262-273
 * verbatim (predicateSetKey over buildConditionFromCategoricalFilters), extracted
 * so the strip wiring stays identical across PWA + Azure.
 *
 * PWA keys by String(canvasViewportHubId) (threaded from App.tsx); Azure keys by
 * workspaceProject.id ?? DEFAULT_PROCESS_HUB_ID; both must match what AnalyzeView/
 * AnalyzeWorkspace writes scopes under.
 */

import {
  buildConditionFromCategoricalFilters,
  predicateSetKey,
  type ProblemStatementScope,
  type CategoricalFilterInput,
} from '@variscout/core';

export interface MatchActiveScopeArgs {
  /** Live categorical drill chips (analysisScopeStore.categoricalFilters). */
  categoricalFilters: ReadonlyArray<CategoricalFilterInput>;
  /** Active outcome (Y). Null/empty → no match. */
  outcome: string | null | undefined;
  /** Project id key (String(canvasViewportHubId) / scopeProjectId sentinel). */
  scopeProjectId: string;
  /** All known scopes (useAnalyzeStore.scopes). */
  scopes: ReadonlyArray<ProblemStatementScope>;
}

/**
 * Returns the id of the live-drill-matching scope, or null when there is no
 * active drill / outcome or no existing scope matches. Pure — no store reads.
 */
export function matchActiveScopeId({
  categoricalFilters,
  outcome,
  scopeProjectId,
  scopes,
}: MatchActiveScopeArgs): string | null {
  if (!outcome) return null;
  const predicates = buildConditionFromCategoricalFilters(categoricalFilters);
  if (predicates.length === 0) return null;
  const key = predicateSetKey(predicates);
  const match = scopes.find(
    scope =>
      !scope.deletedAt &&
      scope.projectId === scopeProjectId &&
      scope.outcome === outcome &&
      predicateSetKey(scope.predicates) === key
  );
  return match?.id ?? null;
}
