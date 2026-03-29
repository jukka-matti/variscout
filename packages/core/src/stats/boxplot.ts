import type {
  BoxplotGroupInput,
  BoxplotGroupData,
  BoxplotSortBy,
  BoxplotSortDirection,
  SpecLimits,
} from '../types';
import { inferCharacteristicType } from '../types';

/**
 * Calculate boxplot statistics from raw values
 *
 * Computes the five-number summary (min, Q1, median, Q3, max) plus mean,
 * standard deviation, and outliers using the 1.5×IQR rule.
 *
 * @param input - Object with group name and array of numeric values
 * @returns BoxplotGroupData with calculated statistics
 *
 * @example
 * const stats = calculateBoxplotStats({ group: 'Batch A', values: [10, 12, 11, 15, 14] });
 * // stats.median = 12, stats.mean = 12.4, stats.q1 = 10.5, stats.q3 = 14.5
 */
export function calculateBoxplotStats(input: BoxplotGroupInput): BoxplotGroupData {
  const sorted = [...input.values].sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 0) {
    return {
      key: input.group,
      values: [],
      min: 0,
      max: 0,
      q1: 0,
      median: 0,
      mean: 0,
      q3: 0,
      outliers: [],
      stdDev: 0,
    };
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  // Q1 and Q3 using linear interpolation
  const q1Index = (n - 1) * 0.25;
  const q3Index = (n - 1) * 0.75;

  const q1 =
    sorted[Math.floor(q1Index)] +
    (q1Index % 1) * (sorted[Math.ceil(q1Index)] - sorted[Math.floor(q1Index)]);
  const q3 =
    sorted[Math.floor(q3Index)] +
    (q3Index % 1) * (sorted[Math.ceil(q3Index)] - sorted[Math.floor(q3Index)]);

  // Outliers: points beyond 1.5 * IQR
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);

  // Calculate mean
  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;

  // Calculate standard deviation
  const sumSquaredDiff = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
  const stdDev = n > 1 ? Math.sqrt(sumSquaredDiff / (n - 1)) : 0;

  return {
    key: input.group,
    values: input.values,
    min: Math.max(min, lowerFence),
    max: Math.min(max, upperFence),
    q1,
    median,
    mean,
    q3,
    outliers,
    stdDev,
  };
}

/**
 * Sort boxplot group data by the given criterion and direction.
 * Returns a new sorted array (no mutation).
 *
 * @param data - Array of BoxplotGroupData to sort
 * @param sortBy - Sort criterion: 'name' (alphabetical), 'mean', or 'spread' (IQR)
 * @param direction - 'asc' (ascending) or 'desc' (descending)
 * @returns New sorted array
 */
export function sortBoxplotData(
  data: BoxplotGroupData[],
  sortBy: BoxplotSortBy = 'name',
  direction: BoxplotSortDirection = 'asc'
): BoxplotGroupData[] {
  const dir = direction === 'asc' ? 1 : -1;
  return [...data].sort((a, b) => {
    switch (sortBy) {
      case 'mean':
        return (a.mean - b.mean) * dir;
      case 'spread':
        return (a.q3 - a.q1 - (b.q3 - b.q1)) * dir;
      case 'name':
      default:
        return a.key.localeCompare(b.key) * dir;
    }
  });
}

/** Minimum pixels per boxplot category (box + padding) */
export const MIN_BOX_STEP = 50;

/**
 * Calculate maximum visible boxplot categories from container width.
 */
export function getMaxBoxplotCategories(innerWidth: number): number {
  return Math.max(2, Math.floor(innerWidth / MIN_BOX_STEP));
}

/**
 * Priority criterion label for the current selection mode.
 */
export type BoxplotPriorityCriterion = 'mean' | 'spread' | 'distance' | 'name';

/**
 * Select which boxplot categories to show when there are more than maxCount.
 *
 * Uses specs-aware priority:
 * - smaller-is-better (USL only): highest median first (worst performers)
 * - larger-is-better (LSL only): lowest median first (worst performers)
 * - nominal/target: farthest from target first
 * - no specs: highest IQR first (most variation)
 *
 * Sort override: when sortBy is explicitly set, it takes precedence.
 *
 * @returns Ordered array of category keys to show
 */
export function selectBoxplotCategories(
  data: BoxplotGroupData[],
  maxCount: number,
  specs: SpecLimits,
  sortBy: BoxplotSortBy = 'name',
  sortDirection: BoxplotSortDirection = 'desc'
): { categories: string[]; criterion: BoxplotPriorityCriterion } {
  if (data.length <= maxCount) {
    return { categories: data.map(d => d.key), criterion: 'name' };
  }

  // Determine priority criterion
  let criterion: BoxplotPriorityCriterion;
  let ranked: BoxplotGroupData[];

  if (sortBy !== 'name') {
    // Sort override: user explicitly chose a sort criterion
    criterion = sortBy === 'mean' ? 'mean' : 'spread';
    ranked = sortBoxplotData(data, sortBy, sortDirection);
  } else {
    // Specs-aware priority
    const charType = inferCharacteristicType(specs);
    const target =
      specs.target ??
      (specs.lsl !== undefined && specs.usl !== undefined
        ? (specs.lsl + specs.usl) / 2
        : undefined);

    if (charType === 'smaller') {
      // Highest median = worst → sort descending by median
      criterion = 'mean';
      ranked = [...data].sort((a, b) => b.median - a.median);
    } else if (charType === 'larger') {
      // Lowest median = worst → sort ascending by median
      criterion = 'mean';
      ranked = [...data].sort((a, b) => a.median - b.median);
    } else if (target !== undefined) {
      // Farthest from target = worst
      criterion = 'distance';
      ranked = [...data].sort((a, b) => Math.abs(b.median - target) - Math.abs(a.median - target));
    } else {
      // No specs: most variation (IQR) first
      criterion = 'spread';
      ranked = [...data].sort((a, b) => b.q3 - b.q1 - (a.q3 - a.q1));
    }
  }

  return {
    categories: ranked.slice(0, maxCount).map(d => d.key),
    criterion,
  };
}
