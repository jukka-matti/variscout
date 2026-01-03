import * as d3 from 'd3';
import type {
  StatsResult,
  GradeTier,
  ProbabilityPlotPoint,
  ConformanceResult,
  AnovaResult,
  AnovaGroup,
} from './types';

// Re-export types for convenience
export type {
  StatsResult,
  ProbabilityPlotPoint,
  ConformanceResult,
  AnovaResult,
  AnovaGroup,
} from './types';

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
  grades?: GradeTier[]
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

  groups.forEach(groupData => {
    const groupMean = d3.mean(groupData, d => d[outcome]) || 0;
    ssBetween += groupData.length * Math.pow(groupMean - totalMean, 2);
  });

  return ssTotal === 0 ? 0 : ssBetween / ssTotal;
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

  // Filter out non-numeric, NaN, and Infinity values
  const validData = data.filter(v => typeof v === 'number' && isFinite(v) && !isNaN(v));
  if (validData.length === 0) return [];

  const n = validData.length;
  const sorted = [...validData].sort((a, b) => a - b);
  const stdDev = d3.deviation(sorted) || 1;

  return sorted.map((value, i) => {
    // Blom's formula for expected percentile
    const p = (i + 1 - 0.375) / (n + 0.25);
    const expectedPercentile = p * 100;

    // Z-score for this percentile
    const z = normalQuantile(p);

    // Standard error of percentile (approximation)
    const pdf = normalPDF(z);
    const rawSe = pdf > 0 ? (stdDev * Math.sqrt((p * (1 - p)) / n)) / pdf : 0;
    // Cap SE at 10x stdDev to prevent CI explosion from tiny PDF values at extremes
    const se = Math.min(rawSe, stdDev * 10);

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

/**
 * Calculate conformance statistics against specification limits
 *
 * @param values - Array of numeric measurement values
 * @param usl - Upper Specification Limit (optional)
 * @param lsl - Lower Specification Limit (optional)
 * @returns ConformanceResult with pass/fail counts and percentages
 *
 * @example
 * const result = calculateConformance([10, 12, 14, 16], 15, 9);
 * // { pass: 3, failUsl: 1, failLsl: 0, total: 4, passRate: 75 }
 */
export function calculateConformance(
  values: number[],
  usl?: number,
  lsl?: number
): ConformanceResult {
  let pass = 0;
  let failUsl = 0;
  let failLsl = 0;

  values.forEach(val => {
    if (usl !== undefined && val > usl) {
      failUsl++;
    } else if (lsl !== undefined && val < lsl) {
      failLsl++;
    } else {
      pass++;
    }
  });

  const total = values.length;
  return {
    pass,
    failUsl,
    failLsl,
    total,
    passRate: total > 0 ? (pass / total) * 100 : 0,
  };
}

/**
 * Group data by a factor column and extract outcome values
 *
 * @param data - Array of data records
 * @param factorColumn - Column name for grouping
 * @param outcomeColumn - Column name for numeric outcome values
 * @returns Map with factor values as keys and arrays of outcome values
 *
 * @example
 * const groups = groupDataByFactor(data, 'Supplier', 'Weight');
 * // Map { 'Supplier A' => [10, 12, 11], 'Supplier B' => [14, 15] }
 */
export function groupDataByFactor<T extends Record<string, unknown>>(
  data: T[],
  factorColumn: string,
  outcomeColumn: string
): Map<string, number[]> {
  const groups = new Map<string, number[]>();

  data.forEach(row => {
    const factorValue = String(row[factorColumn] ?? 'Unknown');
    const outcomeValue = Number(row[outcomeColumn]);

    if (!isNaN(outcomeValue)) {
      if (!groups.has(factorValue)) {
        groups.set(factorValue, []);
      }
      groups.get(factorValue)!.push(outcomeValue);
    }
  });

  return groups;
}

/**
 * Incomplete beta function using continued fraction approximation
 * Used for F-distribution CDF calculation
 */
function incompleteBeta(a: number, b: number, x: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use continued fraction approximation
  const maxIterations = 200;
  const epsilon = 1e-10;

  // Calculate the log of the beta coefficient
  const logBeta = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - logBeta) / a;

  // Lentz's algorithm for continued fraction
  let f = 1;
  let c = 1;
  let d = 0;

  for (let m = 0; m <= maxIterations; m++) {
    // Calculate the numerator
    let numerator: number;
    if (m === 0) {
      numerator = 1;
    } else if (m % 2 === 0) {
      const k = m / 2;
      numerator = (k * (b - k) * x) / ((a + 2 * k - 1) * (a + 2 * k));
    } else {
      const k = (m - 1) / 2;
      numerator = -((a + k) * (a + b + k) * x) / ((a + 2 * k) * (a + 2 * k + 1));
    }

    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;

    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    const delta = c * d;
    f *= delta;

    if (Math.abs(delta - 1) < epsilon) break;
  }

  return front * (f - 1);
}

/**
 * Log gamma function using Lanczos approximation
 */
function lnGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  }

  x -= 1;
  let sum = c[0];
  for (let i = 1; i < g + 2; i++) {
    sum += c[i] / (x + i);
  }

  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum);
}

/**
 * Calculate p-value from F-distribution
 *
 * @param f - F-statistic value
 * @param df1 - Degrees of freedom numerator (between groups)
 * @param df2 - Degrees of freedom denominator (within groups)
 * @returns P-value (probability of observing F >= f under null hypothesis)
 */
function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0) return 1;
  if (!isFinite(f)) return 0;

  // Use the relationship between F-distribution and incomplete beta function
  // P(F > f) = I_x(df2/2, df1/2) where x = df2 / (df2 + df1 * f)
  const x = df2 / (df2 + df1 * f);
  return incompleteBeta(df2 / 2, df1 / 2, x);
}

/**
 * Calculate one-way ANOVA for comparing group means
 *
 * Tests whether there are statistically significant differences between
 * the means of two or more groups. Mathematically equivalent to t-test
 * when there are exactly 2 groups.
 *
 * @param data - Array of data records with factor and outcome columns
 * @param outcomeColumn - Column name for the numeric outcome variable
 * @param factorColumn - Column name for the categorical grouping variable
 * @returns AnovaResult with F-statistic, p-value, and plain-language insight
 *
 * @example
 * const result = calculateAnova(data, 'CycleTime', 'Shift');
 * if (result?.isSignificant) {
 *   console.log(result.insight); // "Shift A is fastest (24.3 min average)"
 * }
 */
export function calculateAnova<T extends Record<string, unknown>>(
  data: T[],
  outcomeColumn: string,
  factorColumn: string
): AnovaResult | null {
  // Group data by factor
  const groups = groupDataByFactor(data, factorColumn, outcomeColumn);

  // Need at least 2 groups for comparison
  if (groups.size < 2) return null;

  // Calculate group statistics
  const groupStats: AnovaGroup[] = [];
  let totalN = 0;
  let grandSum = 0;

  groups.forEach((values, name) => {
    if (values.length === 0) return;

    const n = values.length;
    const mean = d3.mean(values) || 0;
    const stdDev = d3.deviation(values) || 0;

    groupStats.push({ name, n, mean, stdDev });
    totalN += n;
    grandSum += d3.sum(values) || 0;
  });

  // Need at least 2 valid groups
  if (groupStats.length < 2 || totalN < 3) return null;

  const grandMean = grandSum / totalN;
  const k = groupStats.length; // Number of groups

  // Calculate Sum of Squares Between (SSB) and Within (SSW)
  let ssb = 0;
  let ssw = 0;

  groupStats.forEach(group => {
    // SSB: sum of n_i * (mean_i - grand_mean)^2
    ssb += group.n * Math.pow(group.mean - grandMean, 2);

    // SSW: sum of (n_i - 1) * variance_i
    // variance = stdDev^2
    ssw += (group.n - 1) * Math.pow(group.stdDev, 2);
  });

  // Degrees of freedom
  const dfBetween = k - 1;
  const dfWithin = totalN - k;

  // Guard against division by zero
  if (dfBetween <= 0 || dfWithin <= 0 || ssw === 0) return null;

  // Mean squares
  const msb = ssb / dfBetween;
  const msw = ssw / dfWithin;

  // F-statistic
  const fStatistic = msb / msw;

  // P-value from F-distribution
  const pValue = fDistributionPValue(fStatistic, dfBetween, dfWithin);

  // Significance at α = 0.05
  const isSignificant = pValue < 0.05;

  // Effect size (eta-squared)
  const sst = ssb + ssw;
  const etaSquared = sst > 0 ? ssb / sst : 0;

  // Generate plain-language insight
  const insight = generateAnovaInsight(groupStats, isSignificant, outcomeColumn);

  return {
    groups: groupStats,
    ssb,
    ssw,
    dfBetween,
    dfWithin,
    msb,
    msw,
    fStatistic,
    pValue,
    isSignificant,
    etaSquared,
    insight,
  };
}

/**
 * Generate a plain-language insight from ANOVA results
 */
function generateAnovaInsight(
  groups: AnovaGroup[],
  isSignificant: boolean,
  outcomeName: string
): string {
  if (!isSignificant) {
    return 'No significant difference between groups';
  }

  // Find the group with highest and lowest mean
  const sorted = [...groups].sort((a, b) => a.mean - b.mean);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];

  // Determine if higher or lower is "better" based on common outcome names
  const lowerIsBetter = /time|defect|error|reject|delay|cost|waste/i.test(outcomeName);

  if (lowerIsBetter) {
    return `${lowest.name} is best (${lowest.mean.toFixed(1)} avg)`;
  } else {
    return `${highest.name} is best (${highest.mean.toFixed(1)} avg)`;
  }
}
