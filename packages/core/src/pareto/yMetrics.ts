/**
 * Pareto Y-axis metric registry + per-group computation.
 *
 * The Pareto chart has two pickers:
 *   - X axis (group-by): which column to stratify by
 *   - Y axis (weighted-by): how to score each group
 *
 * This module owns the Y-side type registry (`ParetoYMetricId`, `ParetoYMetric`,
 * `PARETO_Y_METRICS`) and the pure computation function `computeParetoY`.
 *
 * Architecture invariants (ADR-069):
 *   - B2: all returns are finite numbers — never NaN or Infinity.
 *   - No `Math.random`, no `Date.now()`, no I/O, no async.
 *   - Insufficient-data semantics are documented per metric in JSDoc.
 */

import { safeDivide } from '../stats/safeMath';
import { DEFAULT_CPK_TARGET } from '../capability/resolve';

// ============================================================================
// ID union
// ============================================================================

/**
 * All supported Pareto Y-axis metric identifiers.
 *
 * Grouped by primary mode lens:
 *   - defect:        count | cost | time
 *   - capability:    cpk-gap | percent-out-of-spec | mean-minus-target | cpk
 *   - performance:   percent-out-of-spec | cpk
 *   - yamazumi:      cycle-time | waste-time
 *   - process-flow:  step-duration | throughput
 *   - universal:     count (also the fallback for standard mode)
 */
export type ParetoYMetricId =
  | 'count'
  | 'cost'
  | 'time'
  | 'cpk-gap'
  | 'percent-out-of-spec'
  | 'mean-minus-target'
  | 'cpk'
  | 'cycle-time'
  | 'waste-time'
  | 'step-duration'
  | 'throughput';

// ============================================================================
// Registry shape
// ============================================================================

export interface ParetoYMetric {
  id: ParetoYMetricId;
  /**
   * Short label for the picker dropdown.
   * Keep ≤ 22 characters. Lowercase per VariScout convention.
   */
  label: string;
  /**
   * Optional longer description for tooltip / a11y.
   * May describe the unit or formula.
   */
  description?: string;
  /**
   * When true, a *smaller* value means a *worse* outcome (e.g., low Cpk is bad).
   * The Pareto chart uses this flag to determine sort direction so that the
   * worst-performing group always appears first.
   *
   * Default: false (larger = worse, standard Pareto sort descending by value).
   */
  smallerIsWorse?: boolean;
}

export const PARETO_Y_METRICS: Record<ParetoYMetricId, ParetoYMetric> = {
  count: {
    id: 'count',
    label: 'count',
    description: 'Number of rows in the group. Default metric for defect and standard modes.',
  },
  cost: {
    id: 'cost',
    label: 'cost (sum)',
    description: 'Sum of the cost column across all rows in the group.',
  },
  time: {
    id: 'time',
    label: 'downtime (sum)',
    description: 'Sum of the duration/downtime column across all rows in the group.',
  },
  'cpk-gap': {
    id: 'cpk-gap',
    label: 'Cpk gap',
    description:
      'How far the group Cpk falls below the target Cpk (max(0, cpkTarget − cpk)). ' +
      'Larger gap = worse capability.',
  },
  'percent-out-of-spec': {
    id: 'percent-out-of-spec',
    label: '% out of spec',
    description:
      'Percentage of rows outside [LSL, USL] (strictly less than LSL or greater than USL).',
  },
  'mean-minus-target': {
    id: 'mean-minus-target',
    label: '|mean − target|',
    description: 'Absolute deviation of the group mean from the specification target.',
  },
  cpk: {
    id: 'cpk',
    label: 'Cpk',
    description:
      'Process capability index for the group. ' +
      'A smaller Cpk means worse capability — sort ascending to surface worst groups first.',
    smallerIsWorse: true,
  },
  'cycle-time': {
    id: 'cycle-time',
    label: 'cycle time (sum)',
    description: 'Sum of the cycle-time column across all rows in the group.',
  },
  'waste-time': {
    id: 'waste-time',
    label: 'waste time (sum)',
    description: 'Sum of the waste-time column across all rows in the group.',
  },
  'step-duration': {
    id: 'step-duration',
    label: 'step duration (sum)',
    description: 'Sum of the step-duration column across all rows in the group.',
  },
  throughput: {
    id: 'throughput',
    label: 'throughput',
    description:
      'Count of rows divided by the active time-window denominator (units per time). ' +
      'Falls back to count when no denominator is supplied.',
  },
};

// ============================================================================
// Context
// ============================================================================

export interface ComputeParetoYContext {
  /**
   * Column name for the continuous outcome measurement.
   * Required for: percent-out-of-spec, cpk-gap, mean-minus-target, cpk.
   */
  outcomeColumn?: string;
  /**
   * Specification band for the outcome.
   * Required fields vary by metric — see per-metric docs below.
   */
  spec?: {
    lsl?: number;
    usl?: number;
    target?: number;
    /**
     * Target Cpk for capability gap computation.
     * Defaults to 1.33 when omitted.
     */
    cpkTarget?: number;
  };
  /** Cost column name for the 'cost' metric (defect mode). */
  costColumn?: string;
  /** Duration / downtime column name for the 'time' metric (defect mode). */
  durationColumn?: string;
  /** Cycle-time column name for the 'cycle-time' metric (yamazumi mode). */
  cycleTimeColumn?: string;
  /** Waste-time column name for the 'waste-time' metric (yamazumi mode). */
  wasteTimeColumn?: string;
  /** Step-duration column name for the 'step-duration' metric (process-flow mode). */
  stepDurationColumn?: string;
  /**
   * Denominator (length of the active time-window) for the 'throughput' metric.
   * Caller derives this from the active TimelineWindow.
   * When absent or ≤ 0, throughput falls back to count.
   */
  throughputWindowDenominator?: number;
}

// ============================================================================
// Internal helpers (not exported — use computeParetoY)
// ============================================================================

/**
 * Sum all finite values in the named column.
 * Non-finite values (NaN, ±Infinity, or missing key) are skipped silently.
 */
function sumColumn(rows: ReadonlyArray<Record<string, unknown>>, columnName: string): number {
  let total = 0;
  for (const row of rows) {
    const v = Number(row[columnName]);
    if (Number.isFinite(v)) total += v;
  }
  return total;
}

/**
 * Extract finite numeric values from the named column.
 * Used to build clean arrays for mean / σ computation.
 */
function finiteValues(rows: ReadonlyArray<Record<string, unknown>>, columnName: string): number[] {
  const result: number[] = [];
  for (const row of rows) {
    const v = Number(row[columnName]);
    if (Number.isFinite(v)) result.push(v);
  }
  return result;
}

/**
 * Sample mean (returns 0 when values is empty).
 * Stable enough for typical Pareto group sizes; no Welford needed.
 */
function sampleMean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/**
 * Sample standard deviation (N − 1 denominator).
 * Returns 0 when fewer than 2 values.
 */
function sampleStdev(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const mean = sampleMean(values);
  let ssq = 0;
  for (const v of values) {
    const d = v - mean;
    ssq += d * d;
  }
  return Math.sqrt(ssq / (values.length - 1));
}

/**
 * Compute Cpk for an array of finite numeric values given spec limits.
 * Uses sample stdev (N − 1) — consistent with `nodeCapability.ts`.
 *
 * Returns undefined when:
 *   - fewer than 2 values (can't estimate σ meaningfully)
 *   - σ = 0 (all values identical — capability is undefined)
 *   - neither LSL nor USL is provided
 *
 * Never returns NaN or Infinity (safeDivide guards division).
 */
function computeCpkForValues(
  values: readonly number[],
  spec: { lsl?: number; usl?: number }
): number | undefined {
  if (values.length < 2) return undefined;
  const sigma = sampleStdev(values);
  if (sigma === 0) return undefined;

  const mean = sampleMean(values);
  // 3σ spread: standard Cpk convention uses three-sigma capability bounds
  const threeS = 3 * sigma;

  const cpu = spec.usl !== undefined ? safeDivide(spec.usl - mean, threeS) : undefined;
  const cpl = spec.lsl !== undefined ? safeDivide(mean - spec.lsl, threeS) : undefined;

  if (cpu !== undefined && cpl !== undefined) return Math.min(cpu, cpl);
  return cpu ?? cpl;
}

// ============================================================================
// Public computation function
// ============================================================================

/**
 * Compute the Y value for a single Pareto group.
 *
 * ## Return semantics per metric
 *
 * | metric              | insufficient-data return | notes                              |
 * |---------------------|-------------------------|------------------------------------|
 * | count               | 0 (empty group)          | always well-defined                |
 * | cost                | 0                        | no finite rows → sum is 0          |
 * | time                | 0                        | no finite rows → sum is 0          |
 * | cycle-time          | 0                        | no finite rows → sum is 0          |
 * | waste-time          | 0                        | no finite rows → sum is 0          |
 * | step-duration       | 0                        | no finite rows → sum is 0          |
 * | percent-out-of-spec | 0                        | no numeric rows → 0%               |
 * | mean-minus-target   | 0                        | no numeric rows → |0 − target| = 0 |
 * | cpk-gap             | 0                        | < 2 numeric rows → gap = 0         |
 * | cpk                 | 0                        | < 2 numeric rows → 0               |
 * | throughput          | 0 (empty group)          | falls back to count when no denom  |
 *
 * ## Errors thrown
 * - Missing required context fields (e.g. `costColumn` for 'cost').
 * - Missing `outcomeColumn` for metrics that need it.
 * - Missing `spec.lsl` AND `spec.usl` for `percent-out-of-spec`.
 * - Missing `spec.target` for `mean-minus-target`.
 *
 * @pure No I/O, no randomness, no globals. Deterministic for any given inputs.
 * @returns A finite number. For most metrics ≥ 0; `cpk` may be negative when the mean is far outside spec. Never NaN or Infinity.
 */
export function computeParetoY(
  metricId: ParetoYMetricId,
  rowsForGroup: ReadonlyArray<Record<string, unknown>>,
  context: ComputeParetoYContext
): number {
  switch (metricId) {
    // -------------------------------------------------------------------------
    // count
    // -------------------------------------------------------------------------
    case 'count': {
      return rowsForGroup.length;
    }

    // -------------------------------------------------------------------------
    // cost (sum a cost column)
    // -------------------------------------------------------------------------
    case 'cost': {
      if (!context.costColumn) {
        throw new Error('computeParetoY: missing context.costColumn for metric "cost"');
      }
      return sumColumn(rowsForGroup, context.costColumn);
    }

    // -------------------------------------------------------------------------
    // time (sum a duration/downtime column)
    // -------------------------------------------------------------------------
    case 'time': {
      if (!context.durationColumn) {
        throw new Error('computeParetoY: missing context.durationColumn for metric "time"');
      }
      return sumColumn(rowsForGroup, context.durationColumn);
    }

    // -------------------------------------------------------------------------
    // cycle-time (sum)
    // -------------------------------------------------------------------------
    case 'cycle-time': {
      if (!context.cycleTimeColumn) {
        throw new Error('computeParetoY: missing context.cycleTimeColumn for metric "cycle-time"');
      }
      return sumColumn(rowsForGroup, context.cycleTimeColumn);
    }

    // -------------------------------------------------------------------------
    // waste-time (sum)
    // -------------------------------------------------------------------------
    case 'waste-time': {
      if (!context.wasteTimeColumn) {
        throw new Error('computeParetoY: missing context.wasteTimeColumn for metric "waste-time"');
      }
      return sumColumn(rowsForGroup, context.wasteTimeColumn);
    }

    // -------------------------------------------------------------------------
    // step-duration (sum)
    // -------------------------------------------------------------------------
    case 'step-duration': {
      if (!context.stepDurationColumn) {
        throw new Error(
          'computeParetoY: missing context.stepDurationColumn for metric "step-duration"'
        );
      }
      return sumColumn(rowsForGroup, context.stepDurationColumn);
    }

    // -------------------------------------------------------------------------
    // percent-out-of-spec
    // -------------------------------------------------------------------------
    case 'percent-out-of-spec': {
      if (!context.outcomeColumn) {
        throw new Error(
          'computeParetoY: missing context.outcomeColumn for metric "percent-out-of-spec"'
        );
      }
      const { lsl, usl } = context.spec ?? {};
      if (lsl === undefined && usl === undefined) {
        throw new Error(
          'computeParetoY: context.spec must include at least one of lsl/usl for metric "percent-out-of-spec"'
        );
      }
      const values = finiteValues(rowsForGroup, context.outcomeColumn);
      if (values.length === 0) return 0;

      let outOfSpec = 0;
      for (const v of values) {
        if (lsl !== undefined && v < lsl) {
          outOfSpec++;
          continue;
        }
        if (usl !== undefined && v > usl) {
          outOfSpec++;
        }
      }
      // safeDivide returns undefined for zero denominator — fall back to 0
      return safeDivide(outOfSpec * 100, values.length) ?? 0;
    }

    // -------------------------------------------------------------------------
    // cpk-gap
    // -------------------------------------------------------------------------
    case 'cpk-gap': {
      if (!context.outcomeColumn) {
        throw new Error('computeParetoY: missing context.outcomeColumn for metric "cpk-gap"');
      }
      const spec = context.spec ?? {};
      const cpkTarget = spec.cpkTarget ?? DEFAULT_CPK_TARGET;

      const values = finiteValues(rowsForGroup, context.outcomeColumn);
      if (values.length < 2) return 0;

      const cpk = computeCpkForValues(values, spec);
      if (cpk === undefined) return 0;

      return Math.max(0, cpkTarget - cpk);
    }

    // -------------------------------------------------------------------------
    // mean-minus-target
    // -------------------------------------------------------------------------
    case 'mean-minus-target': {
      if (!context.outcomeColumn) {
        throw new Error(
          'computeParetoY: missing context.outcomeColumn for metric "mean-minus-target"'
        );
      }
      const target = context.spec?.target;
      if (target === undefined) {
        throw new Error(
          'computeParetoY: context.spec.target is required for metric "mean-minus-target"'
        );
      }
      const values = finiteValues(rowsForGroup, context.outcomeColumn);
      if (values.length === 0) return 0;
      return Math.abs(sampleMean(values) - target);
    }

    // -------------------------------------------------------------------------
    // cpk  (raw value; smallerIsWorse = true)
    //
    // Insufficient-data sentinel: 0
    // Rationale: returning 0 keeps the value in the chart's numeric domain and
    // signals "not enough data" to the caller via a near-zero bar, which is
    // visually distinct from a healthy Cpk ≥ 1. The caller should guard on n
    // and annotate the bar if desired. We do NOT return Infinity / NaN.
    // -------------------------------------------------------------------------
    case 'cpk': {
      if (!context.outcomeColumn) {
        throw new Error('computeParetoY: missing context.outcomeColumn for metric "cpk"');
      }
      const values = finiteValues(rowsForGroup, context.outcomeColumn);
      if (values.length < 2) return 0;

      const cpk = computeCpkForValues(values, context.spec ?? {});
      if (cpk === undefined) return 0;
      // Cpk can be negative (mean far outside spec); that's a valid, meaningful
      // result — do not clamp. finiteOrUndefined guard is implicit in computeCpkForValues.
      return cpk;
    }

    // -------------------------------------------------------------------------
    // throughput
    // -------------------------------------------------------------------------
    case 'throughput': {
      const count = rowsForGroup.length;
      const denom = context.throughputWindowDenominator;
      if (denom !== undefined && denom > 0) {
        return safeDivide(count, denom) ?? count;
      }
      // No valid denominator — fall back to raw count.
      return count;
    }
  }
}
