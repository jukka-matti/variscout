import * as d3 from 'd3';

/**
 * Result of statistical calculations for a dataset
 */
export interface StatsResult {
  /** Arithmetic mean of all values */
  mean: number;
  /** Sample standard deviation */
  stdDev: number;
  /** Upper Control Limit (mean + 3σ) */
  ucl: number;
  /** Lower Control Limit (mean - 3σ) */
  lcl: number;
  /** Process Capability index - requires both USL and LSL */
  cp?: number;
  /** Process Capability index accounting for centering */
  cpk?: number;
  /** Percentage of values outside specification limits */
  outOfSpecPercentage: number;
  /** Distribution across grade tiers (if grades defined) */
  gradeCounts?: { label: string; count: number; percentage: number; color: string }[];
}

/**
 * Calculate statistical metrics for quality analysis
 *
 * @param data - Array of numeric measurement values
 * @param usl - Upper Specification Limit (optional)
 * @param lsl - Lower Specification Limit (optional)
 * @param grades - Multi-tier grade definitions for classification (optional)
 * @returns StatsResult with mean, stdDev, control limits, capability indices, and grade counts
 *
 * @example
 * // Basic usage with specs
 * const stats = calculateStats([10, 12, 11, 13], 15, 8);
 * console.log(stats.cpk); // Process capability
 *
 * @example
 * // With grade tiers
 * const stats = calculateStats(values, undefined, undefined, [
 *   { max: 5, label: 'Grade A', color: '#22c55e' },
 *   { max: 10, label: 'Grade B', color: '#eab308' }
 * ]);
 */
export function calculateStats(
  data: number[],
  usl?: number,
  lsl?: number,
  grades?: { max: number; label: string; color: string }[]
): StatsResult {
  if (data.length === 0) {
    return { mean: 0, stdDev: 0, ucl: 0, lcl: 0, outOfSpecPercentage: 0 };
  }

  const mean = d3.mean(data) || 0;
  const stdDev = d3.deviation(data) || 0;

  // Simple I-Chart Control Limits (3-sigma)
  const ucl = mean + 3 * stdDev;
  const lcl = mean - 3 * stdDev;

  let cp: number | undefined;
  let cpk: number | undefined;

  if (usl !== undefined && lsl !== undefined) {
    cp = (usl - lsl) / (6 * stdDev);
    const cpu = (usl - mean) / (3 * stdDev);
    const cpl = (mean - lsl) / (3 * stdDev);
    cpk = Math.min(cpu, cpl);
  } else if (usl !== undefined) {
    cpk = (usl - mean) / (3 * stdDev);
  } else if (lsl !== undefined) {
    cpk = (mean - lsl) / (3 * stdDev);
  }

  const outOfSpec = data.filter(d => {
    if (usl !== undefined && d > usl) return true;
    if (lsl !== undefined && d < lsl) return true;
    return false;
  });

  const outOfSpecPercentage = (outOfSpec.length / data.length) * 100;

  // Calculate Grade Counts if grades exist
  let gradeCounts:
    | { label: string; count: number; percentage: number; color: string }[]
    | undefined;
  if (grades && grades.length > 0) {
    // Initialize counts
    const counts = new Map<string, number>();
    grades.forEach(g => counts.set(g.label, 0));

    // Count each data point
    data.forEach(val => {
      const grade = grades.find(g => val <= g.max);
      if (grade) {
        counts.set(grade.label, (counts.get(grade.label) || 0) + 1);
      } else {
        // Should technically be caught by last grade if it's high enough,
        // but if not, it falls into the last bucket or a "Below" bucket implied
        // For this logic, we'll attribute to the last grade if > all max
        const lastGrade = grades[grades.length - 1];
        counts.set(lastGrade.label, (counts.get(lastGrade.label) || 0) + 1);
      }
    });

    gradeCounts = grades.map(g => ({
      label: g.label,
      color: g.color,
      count: counts.get(g.label) || 0,
      percentage: ((counts.get(g.label) || 0) / data.length) * 100,
    }));
  }

  return {
    mean,
    stdDev,
    ucl,
    lcl,
    cp,
    cpk,
    outOfSpecPercentage,
    gradeCounts,
  };
}

/**
 * Calculate eta-squared (η²) effect size for one-way ANOVA
 *
 * Measures how much of the total variation in the outcome is explained
 * by the grouping factor. Higher values indicate stronger effect.
 *
 * @param data - Array of data objects with factor and outcome columns
 * @param factor - Column name for the grouping variable
 * @param outcome - Column name for the numeric outcome variable
 * @returns η² value between 0 and 1
 *
 * @example
 * const etaSq = getEtaSquared(data, 'Supplier', 'Weight');
 * // etaSq = 0.34 means 34% of weight variation is explained by supplier
 *
 * Interpretation:
 * - 0.01-0.06: Small effect
 * - 0.06-0.14: Medium effect
 * - > 0.14: Large effect
 */
export function getEtaSquared(data: any[], factor: string, outcome: string): number {
  // η² = SS_between / SS_total

  const totalMean = d3.mean(data, d => d[outcome]) || 0;
  const ssTotal = d3.sum(data, d => Math.pow(d[outcome] - totalMean, 2));

  const groups = d3.group(data, d => d[factor]);
  let ssBetween = 0;

  groups.forEach((groupData, key) => {
    const groupMean = d3.mean(groupData, d => d[outcome]) || 0;
    ssBetween += groupData.length * Math.pow(groupMean - totalMean, 2);
  });

  return ssTotal === 0 ? 0 : ssBetween / ssTotal;
}

/**
 * Data point for probability plot with confidence interval
 */
export interface ProbabilityPlotPoint {
  /** Original data value */
  value: number;
  /** Expected percentile using Blom's formula */
  expectedPercentile: number;
  /** Lower bound of 95% CI */
  lowerCI: number;
  /** Upper bound of 95% CI */
  upperCI: number;
}

/**
 * Calculate probability plot data with 95% confidence interval bands
 *
 * Uses Blom's formula for expected percentiles: p = (i - 0.375) / (n + 0.25)
 * CI bands are calculated using the standard error of the percentile
 *
 * @param data - Array of numeric values
 * @returns Array of points with value, expected percentile, and CI bounds
 */
export function calculateProbabilityPlotData(data: number[]): ProbabilityPlotPoint[] {
  if (data.length === 0) return [];

  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const mean = d3.mean(sorted) || 0;
  const stdDev = d3.deviation(sorted) || 1;

  return sorted.map((value, i) => {
    // Blom's formula for expected percentile
    const p = (i + 1 - 0.375) / (n + 0.25);
    const expectedPercentile = p * 100;

    // Z-score for this percentile
    const z = normalQuantile(p);

    // Standard error of percentile (approximation)
    const pdf = normalPDF(z);
    const se = pdf > 0 ? (stdDev * Math.sqrt((p * (1 - p)) / n)) / pdf : 0;

    // 95% CI
    const zCrit = 1.96;
    return {
      value,
      expectedPercentile,
      lowerCI: value - zCrit * se,
      upperCI: value + zCrit * se,
    };
  });
}

/**
 * Normal quantile function (inverse CDF)
 * Used to calculate the theoretical normal distribution line
 *
 * @param p - Probability (0 to 1)
 * @returns Z-score corresponding to the probability
 */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Rational approximation for normal quantile
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];

  const q = p < 0.5 ? p : 1 - p;
  const r = Math.sqrt(-2 * Math.log(q));

  let x =
    (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);

  return p < 0.5 ? -x : x;
}

/**
 * Normal probability density function
 * @param x - Z-score value
 * @returns PDF value at x
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
