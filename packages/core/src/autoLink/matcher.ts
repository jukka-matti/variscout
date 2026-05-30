/**
 * IM-3 auto-link matcher (core-pure).
 *
 * Joins newly-available dataset columns to the MeasurementPlans that named them.
 * A plan "wants" a column when the column appears in any of:
 *   - `plan.neededFactors` (stratifiers / covariates — dataset column names),
 *   - `plan.primaryFactor` (the primary X),
 *   - a leaf column of `plan.scope` (the captured WHERE drill-chips).
 *
 * Reuses `collectReferencedColumns` from `findings/hypothesisCondition` so the
 * scope-leaf join uses the same column-walk the rest of the domain uses.
 *
 * PLANS ONLY (LOCKED #1): the matcher never touches the ProblemStatementScope /
 * Hypothesis graph — that re-evaluation is deferred to IM-4.
 */

import type { MeasurementPlan } from '../measurementPlan/types';
import {
  collectReferencedColumns,
  type HypothesisCondition,
  type ConditionLeaf,
} from '../findings/hypothesisCondition';

/** One matched (plan, column) pair. A plan can match more than one new column. */
export interface PlanColumnMatch {
  plan: MeasurementPlan;
  /** The newly-available dataset column that the plan named. */
  matchedColumn: string;
}

/**
 * Wrap a plan's flat `scope` leaves into an AND condition so we can reuse the
 * domain's `collectReferencedColumns` walk. Empty scope → an empty AND (no
 * referenced columns).
 */
function andWrapScope(scope: ConditionLeaf[]): HypothesisCondition {
  return { kind: 'and', children: scope };
}

/**
 * Collect every dataset column a single plan references across its three
 * column-bearing fields. Deduplicated.
 */
export function columnsReferencedByPlan(plan: MeasurementPlan): Set<string> {
  const cols = new Set<string>();
  if (plan.primaryFactor) cols.add(plan.primaryFactor);
  for (const f of plan.neededFactors) cols.add(f);
  for (const c of collectReferencedColumns(andWrapScope(plan.scope ?? []))) {
    cols.add(c);
  }
  return cols;
}

/**
 * Match newly-available columns to the plans that named them.
 *
 * Pure + deterministic: the result order follows `plans` order, then the
 * `newColumns` order within each plan. A plan that names two of the new columns
 * yields two match rows (one per matched column) — the engine dedupes downstream
 * so this never double-progresses a plan's status.
 *
 * Soft-deleted plans (`deletedAt !== null`) are skipped — a retired plan must not
 * auto-progress.
 */
export function matchColumnsToPlans(
  newColumns: readonly string[],
  plans: readonly MeasurementPlan[]
): PlanColumnMatch[] {
  const matches: PlanColumnMatch[] = [];
  if (newColumns.length === 0) return matches;

  for (const plan of plans) {
    if (plan.deletedAt !== null) continue;
    const wanted = columnsReferencedByPlan(plan);
    if (wanted.size === 0) continue;
    for (const col of newColumns) {
      if (wanted.has(col)) {
        matches.push({ plan, matchedColumn: col });
      }
    }
  }
  return matches;
}
