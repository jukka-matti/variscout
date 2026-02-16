import type { BoxplotGroupInput, BoxplotGroupData } from '../types';

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
