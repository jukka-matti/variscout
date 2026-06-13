/**
 * Scope-level contribution helpers (IM-5, ADR-088 #3/#4).
 *
 * Two — and only two — valid answers to "how much of the problem does this
 * drilled {factor=level} condition account for", NEITHER a multiplied-η² chain:
 *
 *  1. `computeScopeWhatIfProjection` — the actionable cross-lens number. It
 *     directly applies `simulateOverallImpact` (the canonical What-If engine,
 *     a *simulation*) after partitioning rawData via `evaluateCondition` — so
 *     ALL ConditionLeaf ops (eq/in/neq/lt/lte/gt/gte/between) are honoured.
 *     Returns the projected overall Cpk. No parallel projector is built.
 *
 *  2. `computeConditionCoverage` — a descriptive *prevalence* fact: the % of
 *     rows that satisfy the AND of the condition's leaves via `evaluateCondition`.
 *     NOT exploration coverage (`computeCoverage().exploredPercent` is a
 *     different quantity) and NOT an inferential variance share.
 *
 * Names are deliberately chosen to avoid the cross-investigation aggregation
 * tripwire (`architecture.noCrossInvestigationAggregation.test.ts`): no
 * aggregate/global/portfolio/rollup/combine/crossInvestigation stems. Both
 * helpers stay within ONE homogeneous outcome/spec context (ADR-073) — they are
 * within-context, never a portfolio aggregate.
 */

import type { DataRow, SpecLimits } from '../types';
import type { ConditionLeaf } from '../findings/hypothesisCondition';
import {
  evaluateCondition,
  type DataRow as EvalDataRow,
} from '../findings/hypothesisConditionEvaluator';
import { simulateOverallImpact } from './simulation';
import { calculateStats } from '../stats/basic';
import { toNumericValue } from '../types';

/** Minimum rows in complement for a meaningful simulation. Mirrors projection.ts. */
const MIN_COMPLEMENT_COUNT = 2;

/**
 * Wrap a flat list of ConditionLeaf predicates as a single AND condition
 * recognised by `evaluateCondition`. A single leaf is still wrapped in an `and`
 * node so the calling code is uniform and the evaluator handles the trivial case.
 */
function predicatesToAndCondition(predicates: ConditionLeaf[]) {
  return { kind: 'and' as const, children: predicates };
}

/**
 * Project the overall Cpk that would result if the scope's drilled condition
 * were "fixed" to match the complement — the What-If "if-fixed" number.
 *
 * Partitions rawData into (subset, complement) using `evaluateCondition` so ALL
 * ConditionLeaf ops (eq/in/neq/lt/lte/gt/gte/between) narrow the subset
 * correctly. The "fix" simulation is `simulateOverallImpact(subsetStats,
 * complementStats, complementStats, specs)` — identical to the
 * `computeCumulativeProjection` single-finding path.
 *
 * Returns `null` when:
 * - predicates list is empty (no condition to fix)
 * - specs are absent (Cpk requires at least one limit)
 * - subset is empty (condition matches nothing — no fix possible)
 * - subset is the whole dataset (complement empty — no reference distribution)
 * - rawData has fewer than 2 rows (insufficient data)
 * - complement has fewer than MIN_COMPLEMENT_COUNT rows
 *
 * @param predicates - The scope's flat AND of ConditionLeaf conditions (any op).
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
  if (predicates.length === 0) return null;
  if (!specs || (specs.usl === undefined && specs.lsl === undefined)) return null;
  if (rawData.length < 2) return null;

  const andCond = predicatesToAndCondition(predicates);
  const subset = rawData.filter(row => evaluateCondition(andCond, row as EvalDataRow));
  const complement = rawData.filter(row => !evaluateCondition(andCond, row as EvalDataRow));

  // No fix possible: nothing matches, or the condition covers the whole dataset.
  if (subset.length === 0) return null;
  if (complement.length < MIN_COMPLEMENT_COUNT) return null;

  // Extract numeric outcome values.
  const subsetValues = subset
    .map(r => toNumericValue(r[outcome]))
    .filter((v): v is number => v !== undefined);
  const compValues = complement
    .map(r => toNumericValue(r[outcome]))
    .filter((v): v is number => v !== undefined);

  if (subsetValues.length === 0 || compValues.length < MIN_COMPLEMENT_COUNT) return null;

  const mean = (vals: number[]): number => vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = (vals: number[], m: number): number =>
    vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length;

  const subMean = mean(subsetValues);
  const subStdDev = Math.sqrt(variance(subsetValues, subMean));
  const compMean = mean(compValues);
  const compStdDev = Math.sqrt(variance(compValues, compMean));

  // "Fix" = bring subset distribution up to complement performance.
  const impact = simulateOverallImpact(
    { mean: subMean, stdDev: subStdDev, count: subsetValues.length },
    { mean: compMean, stdDev: compStdDev, count: compValues.length },
    { mean: compMean, stdDev: compStdDev },
    specs
  );

  return impact.projectedOverall.cpk ?? null;
}

/**
 * Descriptive prevalence: the % of rows (0–100) that satisfy the AND of the
 * condition's leaves as evaluated by `evaluateCondition` — ALL ConditionLeaf
 * ops (eq/in/neq/lt/lte/gt/gte/between) are honoured.
 *
 * Empty condition or empty dataset → 0 (no division by zero).
 */
export function computeConditionCoverage(predicates: ConditionLeaf[], rawData: DataRow[]): number {
  if (rawData.length === 0) return 0;
  if (predicates.length === 0) return 0;

  const andCond = predicatesToAndCondition(predicates);
  const matchCount = rawData.filter(row => evaluateCondition(andCond, row as EvalDataRow)).length;

  return (matchCount / rawData.length) * 100;
}

/** The Wall problem-condition card's observed Cpk + out-of-spec count over the scoped subset. */
export interface ScopeProblemStats {
  /**
   * Observed Cpk of the scoped subset (σ_within), `undefined` when no spec limit
   * is set, when the subset is empty, or when σ_within is 0 (all identical). The
   * Wall card renders "no specs set" when this is `undefined` with no spec limits.
   */
  cpk: number | undefined;
  /** Count of scoped rows that fall outside the spec limits (0 when no specs). */
  events: number;
  /** Numeric-valued row count the stats were computed over (the scoped subset). */
  n: number;
}

/**
 * Compute the Wall problem-condition card's OBSERVED Cpk + out-of-spec count over
 * exactly the subset the card represents: `rawData` narrowed to the scope's
 * predicates (the same `evaluateCondition` partition `computeConditionCoverage`
 * and `computeScopeWhatIfProjection` use). Empty `predicates` → the full series
 * (no active scope). This MUST drive the card's Cpk because a condition/range
 * drill writes `analysisScopeStore.conditionLeaves` only — NOT
 * `projectStore.filters` — so `useAnalysisStats` (which reads filters) stays
 * full-series and would report the WRONG (wider) Cpk for the displayed condition.
 *
 * Distinct from `computeScopeWhatIfProjection` (the if-fixed PROJECTED Cpk): this
 * is the descriptive OBSERVED capability of the scoped rows as-is. `cpk` is
 * `undefined` when no spec limit is set (the no-specs honesty case) so the card
 * renders "no specs set" rather than "Cpk 0.00".
 *
 * @param predicates - The scope's flat AND of ConditionLeaf conditions (any op); empty = full series.
 * @param rawData    - The full dataset the card's coverage/whatIf also read.
 * @param outcome    - The numeric Y column the scope sharpens.
 * @param specs      - Spec limits for the outcome (Cpk requires at least one).
 */
export function computeScopeProblemStats(
  predicates: ConditionLeaf[],
  rawData: DataRow[],
  outcome: string,
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>
): ScopeProblemStats {
  const subset =
    predicates.length === 0
      ? rawData
      : rawData.filter(row =>
          evaluateCondition(predicatesToAndCondition(predicates), row as EvalDataRow)
        );

  const values = subset
    .map(r => toNumericValue(r[outcome]))
    .filter((v): v is number => v !== undefined);

  if (values.length === 0) return { cpk: undefined, events: 0, n: 0 };

  const stats = calculateStats(values, specs?.usl, specs?.lsl);
  const hasSpecs = specs?.usl !== undefined || specs?.lsl !== undefined;
  const events = hasSpecs ? Math.round((stats.outOfSpecPercentage / 100) * values.length) : 0;

  return { cpk: stats.cpk, events, n: values.length };
}
