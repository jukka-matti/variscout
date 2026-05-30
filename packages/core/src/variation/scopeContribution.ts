/**
 * Scope-level contribution helpers (IM-5, ADR-088 #3/#4).
 *
 * Two — and only two — valid answers to "how much of the problem does this
 * drilled {factor=level} condition account for", NEITHER a multiplied-η² chain:
 *
 *  1. `computeScopeWhatIfProjection` — the actionable cross-lens number. It REUSES
 *     `computeCumulativeProjection` (the canonical What-If engine, a *simulation*)
 *     by feeding it the scope's condition as a single `activeFilters` entry, and
 *     returns the projected overall Cpk. No parallel projector is built.
 *
 *  2. `computeConditionCoverage` — a descriptive *prevalence* fact: the % of rows
 *     that satisfy the AND of the condition's leaves. NOT exploration coverage
 *     (`computeCoverage().exploredPercent` is a different quantity) and NOT an
 *     inferential variance share.
 *
 * Names are deliberately chosen to avoid the cross-investigation aggregation
 * tripwire (`architecture.noCrossInvestigationAggregation.test.ts`): no
 * aggregate/global/portfolio/rollup/combine/crossInvestigation stems. Both
 * helpers stay within ONE homogeneous outcome/spec context (ADR-073) — they are
 * within-context, never a portfolio aggregate.
 */

import type { DataRow, SpecLimits } from '../types';
import type { ConditionLeaf } from '../findings/hypothesisCondition';
import { computeCumulativeProjection } from './projection';

/**
 * Reduce a flat AND of condition leaves to the equality-membership map the
 * What-If engine consumes (`Record<column, (string|number)[]>`).
 *
 * Only `eq` and `in` leaves carry an equality-membership semantics; comparison /
 * range leaves (`lt`/`lte`/`gt`/`gte`/`between`/`neq`) are dropped — scope capture
 * is equality-membership only, mirroring `buildConditionFromCategoricalFilters`.
 * Multiple `eq` leaves on the same column union their values.
 */
function leavesToActiveFilters(predicates: ConditionLeaf[]): Record<string, (string | number)[]> {
  const filters: Record<string, (string | number)[]> = {};
  for (const leaf of predicates) {
    let values: (string | number)[] | null = null;
    if (leaf.op === 'eq') {
      values = [leaf.value as string | number];
    } else if (leaf.op === 'in') {
      values = (leaf.value as string[] | number[]).slice();
    }
    if (!values || values.length === 0) continue;
    const existing = filters[leaf.column];
    filters[leaf.column] = existing ? [...existing, ...values] : values;
  }
  return filters;
}

/**
 * Project the overall Cpk that would result if the scope's drilled condition
 * were "fixed" to match the complement — the What-If "if-fixed" number.
 *
 * Pure pass-through to `computeCumulativeProjection` with a single-element
 * `findingFilters` built from the scope condition. Returns the projected overall
 * Cpk, or `null` when the engine declines (no specs, empty condition, subset is
 * the whole dataset, insufficient complement, etc.).
 *
 * @param predicates - The scope's flat AND of `{factor=level}` leaves.
 * @param rawData    - The full unfiltered dataset (one homogeneous outcome).
 * @param outcome    - The numeric Y column the scope sharpens.
 * @param specs      - Spec limits for the outcome (Cpk requires at least one).
 */
export function computeScopeWhatIfProjection(
  predicates: ConditionLeaf[],
  rawData: DataRow[],
  outcome: string,
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>
): number | null {
  const activeFilters = leavesToActiveFilters(predicates);
  if (Object.keys(activeFilters).length === 0) return null;
  const projection = computeCumulativeProjection([{ activeFilters }], rawData, outcome, specs);
  return projection ? projection.projectedCpk : null;
}

/**
 * Descriptive prevalence: the % of rows (0–100) that satisfy the AND of the
 * condition's equality-membership leaves. A prevalence fact, not a share.
 *
 * Empty condition or empty dataset → 0 (no division by zero). Comparison/range
 * leaves are dropped, matching `computeScopeWhatIfProjection`'s mapping.
 */
export function computeConditionCoverage(predicates: ConditionLeaf[], rawData: DataRow[]): number {
  if (rawData.length === 0) return 0;
  const activeFilters = leavesToActiveFilters(predicates);
  if (Object.keys(activeFilters).length === 0) return 0;

  const matchCount = rawData.reduce((count, row) => {
    const matches = Object.entries(activeFilters).every(([column, values]) => {
      const cell = row[column];
      if (cell === undefined || cell === null) return false;
      return values.includes(cell as string | number);
    });
    return matches ? count + 1 : count;
  }, 0);

  return (matchCount / rawData.length) * 100;
}
