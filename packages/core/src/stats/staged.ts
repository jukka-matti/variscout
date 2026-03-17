import type {
  SpecLimits,
  StatsResult,
  StagedStatsResult,
  StageBoundary,
  StageOrderMode,
} from '../types';
import { calculateStats } from './basic';
import { safeMin, safeMax } from '../utils/minmax';

// ============================================================================
// Staged Comparison Types
// ============================================================================

/** A single stage in a comparison, with its stats and position */
export interface StagedComparisonStage {
  name: string;
  stats: StatsResult;
  index: number; // 0 = baseline, n-1 = current
}

/** Quantified deltas between first and last stage */
export interface StagedComparisonDeltas {
  /** last.mean - first.mean */
  meanShift: number;
  /** last.stdDev / first.stdDev (< 1 = improved) */
  variationRatio: number;
  /** last.cpk - first.cpk (null if no specs) */
  cpkDelta: number | null;
  /** last passRate - first passRate (null if no specs) */
  passRateDelta: number | null;
  /** first.outOfSpecPercentage - last.outOfSpecPercentage (positive = improved) */
  outOfSpecReduction: number;
}

/** Color coding direction for each delta */
export type DeltaColor = 'green' | 'red' | 'amber';

/** Full comparison result between stages */
export interface StagedComparison {
  stages: StagedComparisonStage[];
  deltas: StagedComparisonDeltas;
  colorCoding: Record<keyof StagedComparisonDeltas, DeltaColor>;
}

// ============================================================================
// Staged Comparison Logic
// ============================================================================

/** Threshold below which changes are considered negligible (amber) */
const AMBER_THRESHOLD = 0.05;

/**
 * Compute color coding for a delta metric.
 * Green = improved, red = degraded, amber = change within threshold.
 */
function colorForDelta(
  value: number | null,
  higherIsBetter: boolean,
  threshold: number = AMBER_THRESHOLD
): DeltaColor {
  if (value === null) return 'amber';
  const abs = Math.abs(value);
  if (abs < threshold) return 'amber';
  if (higherIsBetter) return value > 0 ? 'green' : 'red';
  return value < 0 ? 'green' : 'red';
}

/**
 * Calculate comparison metrics between the first and last stage.
 *
 * @param stagedStats - Result from calculateStatsByStage()
 * @returns StagedComparison with per-stage data and deltas, or null if < 2 stages
 *
 * @example
 * const comparison = calculateStagedComparison(stagedStats);
 * if (comparison) {
 *   console.log(comparison.deltas.cpkDelta); // +0.43
 *   console.log(comparison.colorCoding.cpkDelta); // 'green'
 * }
 */
export function calculateStagedComparison(stagedStats: StagedStatsResult): StagedComparison | null {
  const { stages: stageMap, stageOrder } = stagedStats;

  if (stageOrder.length < 2) return null;

  // Build ordered stage array
  const stages: StagedComparisonStage[] = stageOrder
    .map((name, index) => {
      const stats = stageMap.get(name);
      if (!stats) return null;
      return { name, stats, index };
    })
    .filter((s): s is StagedComparisonStage => s !== null);

  if (stages.length < 2) return null;

  const first = stages[0].stats;
  const last = stages[stages.length - 1].stats;

  // Compute deltas
  const meanShift = last.mean - first.mean;
  const variationRatio = first.stdDev !== 0 ? last.stdDev / first.stdDev : 1;

  const hasCpk = first.cpk !== undefined && last.cpk !== undefined;
  const cpkDelta = hasCpk ? last.cpk! - first.cpk! : null;

  const firstPassRate = 100 - first.outOfSpecPercentage;
  const lastPassRate = 100 - last.outOfSpecPercentage;
  const hasSpecs =
    first.outOfSpecPercentage !== 0 ||
    last.outOfSpecPercentage !== 0 ||
    first.cpk !== undefined ||
    last.cpk !== undefined;
  const passRateDelta = hasSpecs ? lastPassRate - firstPassRate : null;
  const outOfSpecReduction = first.outOfSpecPercentage - last.outOfSpecPercentage;

  const deltas: StagedComparisonDeltas = {
    meanShift,
    variationRatio,
    cpkDelta,
    passRateDelta,
    outOfSpecReduction,
  };

  // Color coding
  const colorCoding: StagedComparison['colorCoding'] = {
    meanShift: colorForDelta(
      meanShift,
      false,
      Math.abs(first.mean) * AMBER_THRESHOLD || AMBER_THRESHOLD
    ),
    variationRatio: colorForDelta(variationRatio - 1, false, AMBER_THRESHOLD),
    cpkDelta: colorForDelta(cpkDelta, true, AMBER_THRESHOLD),
    passRateDelta: colorForDelta(passRateDelta, true, AMBER_THRESHOLD * 100),
    outOfSpecReduction: colorForDelta(outOfSpecReduction, true, AMBER_THRESHOLD * 100),
  };

  return { stages, deltas, colorCoding };
}

/**
 * Determine the order of stages based on the data
 *
 * Auto-detection logic:
 * - If all stage values are numeric or match patterns like "Stage 1", "Phase 2" → numerical order
 * - Otherwise → first occurrence order (preserve original data sequence)
 *
 * @param stageValues - Array of stage values in original data order
 * @param mode - Override mode: 'auto' (default) or 'data-order'
 * @returns Ordered array of unique stage names
 *
 * @example
 * determineStageOrder(['2', '1', '3', '1'], 'auto');
 * // Returns: ['1', '2', '3'] (numeric detected)
 *
 * @example
 * determineStageOrder(['Before', 'After', 'Before'], 'auto');
 * // Returns: ['Before', 'After'] (first occurrence)
 */
export function determineStageOrder(
  stageValues: string[],
  mode: StageOrderMode = 'auto'
): string[] {
  // Get unique values preserving first occurrence order
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const val of stageValues) {
    if (!seen.has(val)) {
      seen.add(val);
      unique.push(val);
    }
  }

  if (unique.length === 0) return [];

  // Handle explicit data-order mode (preserve as-in-data sequence)
  if (mode === 'data-order') {
    return unique;
  }

  // Auto-detect mode
  // Check if all values are numeric or match numeric patterns
  const numericPattern = /^(stage|phase|batch|period|run)?\s*\d+$/i;
  const allNumeric = unique.every(
    s => /^\d+(\.\d+)?$/.test(s.trim()) || numericPattern.test(s.trim())
  );

  if (allNumeric) {
    // Sort numerically by extracting the number
    return [...unique].sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const numB = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return numA - numB;
    });
  }

  // Default to first occurrence order
  return unique;
}

/**
 * Sort data by stage, grouping all items from each stage together
 *
 * Within each stage, the original data order is preserved (stable sort).
 * This enables I-Charts with stages to display data sequentially by stage.
 *
 * @param data - Array of data records
 * @param stageColumn - Column name containing stage identifiers
 * @param stageOrder - Ordered list of stage names (from determineStageOrder)
 * @returns New array sorted by stage, with original order preserved within stages
 *
 * @example
 * const data = [
 *   { id: 1, stage: 'B', value: 10 },
 *   { id: 2, stage: 'A', value: 20 },
 *   { id: 3, stage: 'B', value: 30 },
 * ];
 * sortDataByStage(data, 'stage', ['A', 'B']);
 * // Returns: [{ id: 2, stage: 'A' }, { id: 1, stage: 'B' }, { id: 3, stage: 'B' }]
 */
export function sortDataByStage<T extends Record<string, unknown>>(
  data: T[],
  stageColumn: string,
  stageOrder: string[]
): T[] {
  if (data.length === 0 || stageOrder.length === 0) return [...data];

  // Create a map for O(1) stage order lookup
  const orderMap = new Map(stageOrder.map((stage, idx) => [stage, idx]));

  // Stable sort: use original index as tiebreaker
  const indexed = data.map((item, originalIndex) => ({ item, originalIndex }));

  indexed.sort((a, b) => {
    const stageA = String(a.item[stageColumn] ?? '');
    const stageB = String(b.item[stageColumn] ?? '');

    const orderA = orderMap.get(stageA) ?? Infinity;
    const orderB = orderMap.get(stageB) ?? Infinity;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Preserve original order within the same stage
    return a.originalIndex - b.originalIndex;
  });

  return indexed.map(({ item }) => item);
}

/**
 * Calculate statistics separately for each stage
 *
 * Divides data into stages and calculates independent control limits for each.
 * Used for I-Charts with stages to show process changes over time.
 *
 * @param data - Array of data records
 * @param outcomeColumn - Column name for the numeric measurement values
 * @param stageColumn - Column name for the stage identifier
 * @param specs - Specification limits (USL, LSL, target)
 * @param stageOrder - Optional pre-determined stage order (otherwise auto-detected)
 * @returns StagedStatsResult with per-stage stats and overall stats
 *
 * @example
 * const result = calculateStatsByStage(data, 'Weight', 'Batch', { usl: 100, lsl: 90 });
 * result.stages.get('Batch1')?.mean; // Mean for Batch1
 * result.stageOrder; // ['Batch1', 'Batch2', 'Batch3']
 */
export function calculateStatsByStage<T extends Record<string, unknown>>(
  data: T[],
  outcomeColumn: string,
  stageColumn: string,
  specs: SpecLimits,
  stageOrder?: string[]
): StagedStatsResult | null {
  if (data.length === 0) return null;

  // Extract stage values and determine order
  const stageValues = data.map(row => String(row[stageColumn] ?? ''));
  const order = stageOrder ?? determineStageOrder(stageValues);

  if (order.length === 0) return null;

  // Group data by stage
  const stageGroups = new Map<string, number[]>();
  order.forEach(stage => stageGroups.set(stage, []));

  data.forEach(row => {
    const stage = String(row[stageColumn] ?? '');
    const value = Number(row[outcomeColumn]);

    if (!isNaN(value) && stageGroups.has(stage)) {
      stageGroups.get(stage)!.push(value);
    }
  });

  // Calculate stats for each stage
  const stageStats = new Map<string, StatsResult>();

  order.forEach(stage => {
    const values = stageGroups.get(stage) ?? [];
    if (values.length > 0) {
      const stats = calculateStats(values, specs.usl, specs.lsl);
      stageStats.set(stage, stats);
    }
  });

  // Filter out empty stages from order
  const nonEmptyOrder = order.filter(stage => stageStats.has(stage));

  if (nonEmptyOrder.length === 0) return null;

  // Calculate overall stats for reference
  const allValues: number[] = [];
  stageGroups.forEach(values => allValues.push(...values));
  const overallStats = calculateStats(allValues, specs.usl, specs.lsl);

  return {
    stages: stageStats,
    stageOrder: nonEmptyOrder,
    overallStats,
  };
}

/**
 * Calculate stage boundaries for chart rendering
 *
 * Given sorted data with stage information, returns the X-axis boundaries
 * for each stage to enable drawing of control limits and dividers.
 *
 * @param data - Array of data points with stage property (should be sorted by stage)
 * @param stagedStats - The calculated staged stats result
 * @returns Array of StageBoundary objects for chart rendering
 *
 * @example
 * const boundaries = getStageBoundaries(sortedData, stagedStats);
 * // [{ name: 'Stage1', startX: 0, endX: 9, stats: {...} }, ...]
 */
export function getStageBoundaries(
  data: Array<{ x: number; stage?: string }>,
  stagedStats: StagedStatsResult
): StageBoundary[] {
  const boundaries: StageBoundary[] = [];

  stagedStats.stageOrder.forEach(stageName => {
    const stageStats = stagedStats.stages.get(stageName);
    if (!stageStats) return;

    // Find min and max X for this stage
    const stagePoints = data.filter(d => d.stage === stageName);
    if (stagePoints.length === 0) return;

    const xValues = stagePoints.map(d => d.x);
    const startX = safeMin(xValues);
    const endX = safeMax(xValues);

    boundaries.push({
      name: stageName,
      startX,
      endX,
      stats: stageStats,
    });
  });

  return boundaries;
}
