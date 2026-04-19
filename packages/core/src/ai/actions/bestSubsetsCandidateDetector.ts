/**
 * Best-subsets candidate detector — uncited columns that meaningfully
 * improve R²adj versus a cited-columns-only baseline.
 *
 * Used by the Investigation Wall background pipeline to proactively surface
 * potentially influential columns the user has not yet cited in any hub's
 * HypothesisCondition.
 *
 * Deterministic: for a given `(rows, ctsColumn, allColumns, citedColumns, …)`
 * the returned candidate list is identical across calls.
 *
 * Numeric safety (ADR-069 / three-boundary): returns finite numbers only.
 * Any non-finite R²adj emitted by the stats layer is filtered out here so the
 * downstream UI never renders NaN / Infinity.
 *
 * @module bestSubsetsCandidateDetector
 */

import type { DataRow } from '../../types';
import { computeBestSubsets } from '../../stats';

// ============================================================================
// Public types
// ============================================================================

/**
 * A single candidate subset whose R²adj beats the cited-only baseline
 * by more than `minImprovement`.
 */
export interface BestSubsetsCandidate {
  /** Factor columns making up the subset that improved R²adj. */
  columns: string[];
  /** R²adj of the candidate subset. */
  rSquaredAdj: number;
  /** R²adj improvement over the best cited-only baseline subset. */
  improvementOverBaseline: number;
}

// ============================================================================
// Defaults
// ============================================================================

/** Minimum row count below which we decline to run best-subsets. */
const DEFAULT_MIN_ROWS = 10;

/**
 * Minimum absolute R²adj improvement a candidate must contribute over the
 * cited-only baseline to be surfaced to the user.
 */
const DEFAULT_MIN_IMPROVEMENT = 0.1;

// ============================================================================
// Helpers
// ============================================================================

function isFiniteNumber(v: number | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Compute the best R²adj achievable using only the cited columns. Returns 0
 * when there are no cited columns (no baseline to beat) or when the subset
 * solver returns nothing usable.
 */
function computeCitedBaseline(
  rows: DataRow[],
  ctsColumn: string,
  citedColumns: readonly string[]
): number {
  if (citedColumns.length === 0) return 0;

  const result = computeBestSubsets(rows, ctsColumn, [...citedColumns]);
  if (!result || result.subsets.length === 0) return 0;

  // subsets is already sorted by rSquaredAdj desc.
  const best = result.subsets[0].rSquaredAdj;
  return isFiniteNumber(best) ? best : 0;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Identify subsets of **uncited** columns whose R²adj exceeds the best
 * cited-only baseline by at least `minImprovement`.
 *
 * @param rows           Raw analysis rows.
 * @param ctsColumn      Critical-to-satisfy outcome column (y).
 * @param allColumns     All candidate factor columns available to the analysis.
 * @param citedColumns   Columns already cited by some hub's condition.
 * @param minRows        Minimum row count (default 10). Below this, returns [].
 * @param minImprovement Minimum absolute R²adj improvement required
 *                       (default 0.10 = 10 percentage points).
 * @returns Candidate subsets sorted by R²adj descending. Never contains
 *          NaN / Infinity.
 */
export function detectBestSubsetsCandidates(
  rows: DataRow[],
  ctsColumn: string,
  allColumns: readonly string[],
  citedColumns: readonly string[],
  minRows: number = DEFAULT_MIN_ROWS,
  minImprovement: number = DEFAULT_MIN_IMPROVEMENT
): BestSubsetsCandidate[] {
  // Gate 1: insufficient data.
  if (rows.length < minRows) return [];

  // Gate 2: empty universe of columns.
  if (allColumns.length === 0) return [];

  const citedSet = new Set(citedColumns);
  const uncitedColumns = allColumns.filter(col => !citedSet.has(col));
  if (uncitedColumns.length === 0) return [];

  // Baseline: best R²adj achievable from cited columns alone.
  const baseline = computeCitedBaseline(rows, ctsColumn, citedColumns);

  // Threshold a candidate must clear.
  const threshold = baseline + minImprovement;

  // Evaluate uncited columns only.
  const uncitedResult = computeBestSubsets(rows, ctsColumn, uncitedColumns);
  if (!uncitedResult || uncitedResult.subsets.length === 0) return [];

  const candidates: BestSubsetsCandidate[] = [];
  for (const subset of uncitedResult.subsets) {
    const r2adj = subset.rSquaredAdj;
    if (!isFiniteNumber(r2adj)) continue;
    if (r2adj <= threshold) continue;

    const improvement = r2adj - baseline;
    if (!isFiniteNumber(improvement)) continue;

    candidates.push({
      columns: [...subset.factors],
      rSquaredAdj: r2adj,
      improvementOverBaseline: improvement,
    });
  }

  // Stable sort by R²adj descending so consumers get a useful order.
  candidates.sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);
  return candidates;
}
