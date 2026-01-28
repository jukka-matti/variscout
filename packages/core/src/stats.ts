import * as d3 from 'd3';
import type {
  DataRow,
  StatsResult,
  GradeTier,
  ProbabilityPlotPoint,
  ConformanceResult,
  AnovaResult,
  AnovaGroup,
  RegressionResult,
  LinearFit,
  QuadraticFit,
  GageRRResult,
  GageRRInteraction,
  SpecLimits,
  StagedStatsResult,
  StageBoundary,
  StageOrderMode,
  MultiRegressionOptions,
  MultiRegressionResult,
  CoefficientResult,
  RegressionTerm,
  VIFWarning,
} from './types';
import { toNumericValue } from './types';
import { transpose, multiply, inverse, multiplyVector, diagonal } from './matrix';

// Re-export types for convenience
export type {
  StatsResult,
  ProbabilityPlotPoint,
  ConformanceResult,
  AnovaResult,
  AnovaGroup,
  RegressionResult,
  LinearFit,
  QuadraticFit,
  GageRRResult,
  GageRRInteraction,
  StagedStatsResult,
  StageBoundary,
  StageOrderMode,
  MultiRegressionOptions,
  MultiRegressionResult,
  CoefficientResult,
  RegressionTerm,
  VIFWarning,
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
 * @param data - Array of data rows with factor and outcome columns
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
export function getEtaSquared(data: DataRow[], factor: string, outcome: string): number {
  // η² = SS_between / SS_total

  const totalMean = d3.mean(data, d => toNumericValue(d[outcome])) || 0;
  const ssTotal = d3.sum(data, d => {
    const val = toNumericValue(d[outcome]);
    return val !== undefined ? Math.pow(val - totalMean, 2) : 0;
  });

  const groups = d3.group(data, d => d[factor]);
  let ssBetween = 0;

  groups.forEach(groupData => {
    const groupMean = d3.mean(groupData, d => toNumericValue(d[outcome])) || 0;
    ssBetween += groupData.length * Math.pow(groupMean - totalMean, 2);
  });

  return ssTotal === 0 ? 0 : ssBetween / ssTotal;
}

/**
 * Calculate probability plot data with 95% confidence interval bands
 *
 * Uses Median Rank (Benard) formula for expected percentiles: p = (i - 0.3) / (n + 0.4)
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
    // Median Rank (Benard) formula - Minitab default
    const p = (i + 1 - 0.3) / (n + 0.4);
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
 * Normal quantile function (inverse CDF) - Acklam's algorithm
 * Used to calculate the theoretical normal distribution line
 *
 * @param p - Probability (0 to 1)
 * @returns Z-score corresponding to the probability
 */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Coefficients for rational approximation (Acklam's algorithm)
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number, x: number;

  if (p < pLow) {
    // Lower tail
    q = Math.sqrt(-2 * Math.log(p));
    x =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    // Central region
    q = p - 0.5;
    r = q * q;
    x =
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    // Upper tail
    q = Math.sqrt(-2 * Math.log(1 - p));
    x =
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  return x;
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

/**
 * Calculate p-value from t-distribution (two-tailed)
 * Used for testing significance of regression slope
 *
 * @param t - t-statistic value
 * @param df - Degrees of freedom
 * @returns Two-tailed p-value
 */
function tDistributionPValue(t: number, df: number): number {
  if (df <= 0) return 1;
  if (!isFinite(t)) return 0;

  // Use relationship between t-distribution and F-distribution
  // t² with df degrees of freedom = F(1, df)
  const f = t * t;
  return fDistributionPValue(f, 1, df);
}

/**
 * Calculate linear regression fit using least squares
 *
 * @param points - Array of {x, y} data points
 * @returns LinearFit with slope, intercept, R², and p-value
 */
function calculateLinearFit(points: Array<{ x: number; y: number }>): LinearFit {
  const n = points.length;

  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, pValue: 1, isSignificant: false };
  }

  // Calculate means
  const xMean = d3.mean(points, p => p.x) || 0;
  const yMean = d3.mean(points, p => p.y) || 0;

  // Calculate sums for least squares
  let ssXX = 0; // Sum of (x - xMean)²
  let ssXY = 0; // Sum of (x - xMean)(y - yMean)
  let ssYY = 0; // Sum of (y - yMean)²

  points.forEach(p => {
    const dx = p.x - xMean;
    const dy = p.y - yMean;
    ssXX += dx * dx;
    ssXY += dx * dy;
    ssYY += dy * dy;
  });

  // Guard against division by zero
  if (ssXX === 0) {
    return { slope: 0, intercept: yMean, rSquared: 0, pValue: 1, isSignificant: false };
  }

  // Calculate slope and intercept
  const slope = ssXY / ssXX;
  const intercept = yMean - slope * xMean;

  // Calculate R² (coefficient of determination)
  const ssRes = points.reduce((sum, p) => {
    const predicted = slope * p.x + intercept;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);

  const rSquared = ssYY > 0 ? 1 - ssRes / ssYY : 0;

  // Calculate t-statistic for slope significance
  // t = slope / SE(slope), where SE(slope) = sqrt(MSE / ssXX)
  const mse = ssRes / (n - 2);
  const seSlope = Math.sqrt(mse / ssXX);

  // Handle perfect or near-perfect correlation (ssRes ≈ 0)
  // When residuals are essentially zero, the relationship is significant
  const isPerfectFit = ssRes < 1e-10 && rSquared > 0.999;
  const tStat = seSlope > 0 ? Math.abs(slope) / seSlope : isPerfectFit ? Infinity : 0;

  // Calculate p-value (two-tailed)
  // For perfect fit, p-value is essentially 0
  const pValue = isPerfectFit ? 0 : n > 2 ? tDistributionPValue(tStat, n - 2) : 1;
  const isSignificant = pValue < 0.05 || isPerfectFit;

  return { slope, intercept, rSquared, pValue, isSignificant };
}

/**
 * Calculate quadratic regression fit: y = a*x² + b*x + c
 * Uses normal equations solved via matrix operations
 *
 * @param points - Array of {x, y} data points
 * @returns QuadraticFit or null if calculation fails
 */
function calculateQuadraticFit(points: Array<{ x: number; y: number }>): QuadraticFit | null {
  const n = points.length;

  if (n < 3) return null;

  // Build sums for normal equations
  let sumX = 0,
    sumX2 = 0,
    sumX3 = 0,
    sumX4 = 0;
  let sumY = 0,
    sumXY = 0,
    sumX2Y = 0;

  points.forEach(p => {
    const x = p.x;
    const x2 = x * x;
    sumX += x;
    sumX2 += x2;
    sumX3 += x2 * x;
    sumX4 += x2 * x2;
    sumY += p.y;
    sumXY += x * p.y;
    sumX2Y += x2 * p.y;
  });

  // Solve 3x3 system using Cramer's rule
  // [sumX4  sumX3  sumX2] [a]   [sumX2Y]
  // [sumX3  sumX2  sumX ] [b] = [sumXY ]
  // [sumX2  sumX   n    ] [c]   [sumY  ]

  const det =
    sumX4 * (sumX2 * n - sumX * sumX) -
    sumX3 * (sumX3 * n - sumX * sumX2) +
    sumX2 * (sumX3 * sumX - sumX2 * sumX2);

  if (Math.abs(det) < 1e-10) return null;

  const detA =
    sumX2Y * (sumX2 * n - sumX * sumX) -
    sumX3 * (sumXY * n - sumX * sumY) +
    sumX2 * (sumXY * sumX - sumX2 * sumY);

  const detB =
    sumX4 * (sumXY * n - sumX * sumY) -
    sumX2Y * (sumX3 * n - sumX * sumX2) +
    sumX2 * (sumX3 * sumY - sumXY * sumX2);

  const detC =
    sumX4 * (sumX2 * sumY - sumX * sumXY) -
    sumX3 * (sumX3 * sumY - sumX2 * sumXY) +
    sumX2Y * (sumX3 * sumX - sumX2 * sumX2);

  const a = detA / det;
  const b = detB / det;
  const c = detC / det;

  // Calculate R² for quadratic fit
  const yMean = sumY / n;
  let ssRes = 0;
  let ssTot = 0;

  points.forEach(p => {
    const predicted = a * p.x * p.x + b * p.x + c;
    ssRes += Math.pow(p.y - predicted, 2);
    ssTot += Math.pow(p.y - yMean, 2);
  });

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Calculate optimum (vertex of parabola: x = -b/2a)
  let optimumX: number | null = null;
  let optimumType: 'peak' | 'valley' | null = null;

  if (Math.abs(a) > 1e-10) {
    optimumX = -b / (2 * a);
    optimumType = a < 0 ? 'peak' : 'valley';

    // Only report optimum if it's within or near the data range
    const xMin = d3.min(points, p => p.x) || 0;
    const xMax = d3.max(points, p => p.x) || 0;
    const range = xMax - xMin;

    if (optimumX < xMin - range * 0.5 || optimumX > xMax + range * 0.5) {
      optimumX = null;
      optimumType = null;
    }
  }

  return { a, b, c, rSquared, optimumX, optimumType };
}

/**
 * Get star rating (1-5) based on R² value
 */
function getStrengthRating(rSquared: number): 1 | 2 | 3 | 4 | 5 {
  if (rSquared >= 0.9) return 5;
  if (rSquared >= 0.7) return 4;
  if (rSquared >= 0.5) return 3;
  if (rSquared >= 0.3) return 2;
  return 1;
}

/**
 * Generate plain-language insight for regression results
 */
function generateRegressionInsight(
  linear: LinearFit,
  quadratic: QuadraticFit | null,
  recommendedFit: 'linear' | 'quadratic' | 'none',
  xColumn: string,
  yColumn: string
): string {
  // Handle quadratic first (may have weak linear but strong quadratic)
  if (recommendedFit === 'quadratic' && quadratic && quadratic.optimumX !== null) {
    const optType = quadratic.optimumType === 'peak' ? 'maximum' : 'minimum';
    return `${optType.charAt(0).toUpperCase() + optType.slice(1)} ${yColumn} at ${xColumn} ≈ ${quadratic.optimumX.toFixed(1)}`;
  }

  if (recommendedFit === 'none') {
    return `No significant relationship between ${xColumn} and ${yColumn}`;
  }

  // Linear relationship
  const direction = linear.slope > 0 ? 'Higher' : 'Lower';
  const effect = linear.slope > 0 ? 'higher' : 'lower';
  return `${direction} ${xColumn} → ${effect} ${yColumn}`;
}

/**
 * Calculate regression analysis for X-Y relationship
 *
 * Performs both linear and quadratic regression, recommends the best fit,
 * and generates plain-language insights.
 *
 * @param data - Array of data records
 * @param xColumn - Column name for predictor (X) variable
 * @param yColumn - Column name for outcome (Y) variable
 * @returns RegressionResult with fits, recommendation, and insight
 *
 * @example
 * const result = calculateRegression(data, 'Temperature', 'Yield');
 * if (result?.recommendedFit === 'quadratic') {
 *   console.log(`Optimum at ${result.quadratic?.optimumX}`);
 * }
 */
export function calculateRegression<T extends Record<string, unknown>>(
  data: T[],
  xColumn: string,
  yColumn: string
): RegressionResult | null {
  // Extract numeric pairs
  const points: Array<{ x: number; y: number }> = [];

  data.forEach(row => {
    const x = Number(row[xColumn]);
    const y = Number(row[yColumn]);

    if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
      points.push({ x, y });
    }
  });

  // Need at least 3 points for meaningful regression
  if (points.length < 3) return null;

  // Calculate linear fit
  const linear = calculateLinearFit(points);

  // Calculate quadratic fit (need at least 4 points for meaningful quadratic)
  const quadratic = points.length >= 4 ? calculateQuadraticFit(points) : null;

  // Determine recommended fit
  let recommendedFit: 'linear' | 'quadratic' | 'none' = 'none';

  // Check if quadratic is strong even if linear isn't
  const quadraticIsStrong = quadratic && quadratic.rSquared >= 0.5;

  if (quadratic && quadratic.rSquared > linear.rSquared + 0.05 && quadraticIsStrong) {
    // Recommend quadratic if it improves R² by at least 5% AND is reasonably strong
    recommendedFit = 'quadratic';
  } else if (linear.isSignificant) {
    recommendedFit = 'linear';
  } else {
    recommendedFit = 'none';
  }

  // Get strength rating based on best R²
  const bestRSquared =
    quadratic && recommendedFit === 'quadratic' ? quadratic.rSquared : linear.rSquared;
  const strengthRating = getStrengthRating(bestRSquared);

  // Generate insight
  const insight = generateRegressionInsight(linear, quadratic, recommendedFit, xColumn, yColumn);

  return {
    xColumn,
    yColumn,
    n: points.length,
    points,
    linear,
    quadratic,
    recommendedFit,
    strengthRating,
    insight,
  };
}

/**
 * Calculate Gage R&R (Measurement System Analysis) using ANOVA method
 *
 * Performs a two-way ANOVA with interaction to decompose total variation
 * into Part-to-Part, Operator, Interaction, and Equipment (Repeatability) components.
 *
 * @param data - Array of measurement records
 * @param partColumn - Column name for Part identifier
 * @param operatorColumn - Column name for Operator identifier
 * @param measurementColumn - Column name for measurement values
 * @returns GageRRResult with variance components and %GRR
 *
 * @example
 * const result = calculateGageRR(data, 'Part_ID', 'Operator', 'Measurement');
 * if (result?.verdict === 'excellent') {
 *   console.log('Measurement system is capable');
 * }
 */
export function calculateGageRR<T extends Record<string, unknown>>(
  data: T[],
  partColumn: string,
  operatorColumn: string,
  measurementColumn: string
): GageRRResult | null {
  if (data.length === 0) return null;

  // Extract unique parts and operators
  const parts = [...new Set(data.map(row => String(row[partColumn])))].filter(
    p => p !== 'undefined'
  );
  const operators = [...new Set(data.map(row => String(row[operatorColumn])))].filter(
    o => o !== 'undefined'
  );

  const partCount = parts.length;
  const operatorCount = operators.length;

  // Need at least 2 parts and 2 operators
  if (partCount < 2 || operatorCount < 2) return null;

  // Group measurements by Part × Operator
  const cells: Map<string, number[]> = new Map();

  data.forEach(row => {
    const part = String(row[partColumn]);
    const operator = String(row[operatorColumn]);
    const value = Number(row[measurementColumn]);

    if (part === 'undefined' || operator === 'undefined' || isNaN(value)) return;

    const key = `${part}|${operator}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(value);
  });

  // Verify balanced design (equal replicates per cell)
  const replicateCounts = [...cells.values()].map(v => v.length);
  if (replicateCounts.length === 0) return null;

  const replicates = replicateCounts[0];
  const isBalanced = replicateCounts.every(r => r === replicates);

  // Need at least 2 replicates
  if (replicates < 2) return null;

  // For unbalanced designs, use minimum replicates (simplified approach)
  const effectiveReplicates = isBalanced ? replicates : Math.min(...replicateCounts);

  const totalMeasurements = data.filter(
    row =>
      String(row[partColumn]) !== 'undefined' &&
      String(row[operatorColumn]) !== 'undefined' &&
      !isNaN(Number(row[measurementColumn]))
  ).length;

  // Calculate cell means for interaction data
  const interactionData: GageRRInteraction[] = [];
  const cellMeans: Map<string, number> = new Map();

  cells.forEach((values, key) => {
    const [part, operator] = key.split('|');
    const mean = d3.mean(values) || 0;
    cellMeans.set(key, mean);
    interactionData.push({ part, operator, mean });
  });

  // Calculate marginal means
  const partMeans: Map<string, number> = new Map();
  const operatorMeans: Map<string, number> = new Map();

  parts.forEach(part => {
    const values: number[] = [];
    operators.forEach(op => {
      const key = `${part}|${op}`;
      const cellVals = cells.get(key);
      if (cellVals) values.push(...cellVals);
    });
    partMeans.set(part, d3.mean(values) || 0);
  });

  operators.forEach(op => {
    const values: number[] = [];
    parts.forEach(part => {
      const key = `${part}|${op}`;
      const cellVals = cells.get(key);
      if (cellVals) values.push(...cellVals);
    });
    operatorMeans.set(op, d3.mean(values) || 0);
  });

  // Grand mean
  const allValues: number[] = [];
  cells.forEach(values => allValues.push(...values));
  const grandMean = d3.mean(allValues) || 0;

  // Two-way ANOVA calculations
  const n = partCount; // number of parts
  const k = operatorCount; // number of operators
  const r = effectiveReplicates; // replicates per cell

  // Sum of Squares
  // SS_Part = k * r * Σ(part_mean - grand_mean)²
  let ssPart = 0;
  parts.forEach(part => {
    const diff = (partMeans.get(part) || 0) - grandMean;
    ssPart += diff * diff;
  });
  ssPart *= k * r;

  // SS_Operator = n * r * Σ(operator_mean - grand_mean)²
  let ssOperator = 0;
  operators.forEach(op => {
    const diff = (operatorMeans.get(op) || 0) - grandMean;
    ssOperator += diff * diff;
  });
  ssOperator *= n * r;

  // SS_Interaction = r * Σ(cell_mean - part_mean - operator_mean + grand_mean)²
  let ssInteraction = 0;
  parts.forEach(part => {
    operators.forEach(op => {
      const key = `${part}|${op}`;
      const cellMean = cellMeans.get(key) || 0;
      const partMean = partMeans.get(part) || 0;
      const opMean = operatorMeans.get(op) || 0;
      const diff = cellMean - partMean - opMean + grandMean;
      ssInteraction += diff * diff;
    });
  });
  ssInteraction *= r;

  // SS_Error (Repeatability) = ΣΣΣ(x_ijk - cell_mean)²
  let ssError = 0;
  cells.forEach((values, key) => {
    const cellMean = cellMeans.get(key) || 0;
    values.forEach(v => {
      ssError += Math.pow(v - cellMean, 2);
    });
  });

  // Degrees of freedom
  const dfPart = n - 1;
  const dfOperator = k - 1;
  const dfInteraction = (n - 1) * (k - 1);
  const dfError = n * k * (r - 1);

  // Mean Squares
  const msPart = dfPart > 0 ? ssPart / dfPart : 0;
  const msOperator = dfOperator > 0 ? ssOperator / dfOperator : 0;
  const msInteraction = dfInteraction > 0 ? ssInteraction / dfInteraction : 0;
  const msError = dfError > 0 ? ssError / dfError : 0;

  // Variance Components (using Expected Mean Squares)
  // E[MSE] = σ²_error
  // E[MS_interaction] = σ²_error + r * σ²_interaction
  // E[MS_operator] = σ²_error + r * σ²_interaction + n * r * σ²_operator
  // E[MS_part] = σ²_error + r * σ²_interaction + k * r * σ²_part

  const varRepeatability = msError;
  const varInteraction = Math.max(0, (msInteraction - msError) / r);
  const varOperator = Math.max(0, (msOperator - msInteraction) / (n * r));
  const varPart = Math.max(0, (msPart - msInteraction) / (k * r));

  // Reproducibility = Operator + Interaction
  const varReproducibility = varOperator + varInteraction;

  // GRR = Repeatability + Reproducibility
  const varGRR = varRepeatability + varReproducibility;

  // Total = Part + GRR
  const varTotal = varPart + varGRR;

  // Calculate % contributions (based on σ, using %Study Variation method)
  // %SV = (σ_component / σ_total) × 100
  const sigmaTotal = Math.sqrt(varTotal);
  const sigmaPart = Math.sqrt(varPart);
  const sigmaRepeatability = Math.sqrt(varRepeatability);
  const sigmaReproducibility = Math.sqrt(varReproducibility);
  const sigmaGRR = Math.sqrt(varGRR);

  const pctPart = sigmaTotal > 0 ? (sigmaPart / sigmaTotal) * 100 : 0;
  const pctRepeatability = sigmaTotal > 0 ? (sigmaRepeatability / sigmaTotal) * 100 : 0;
  const pctReproducibility = sigmaTotal > 0 ? (sigmaReproducibility / sigmaTotal) * 100 : 0;
  const pctGRR = sigmaTotal > 0 ? (sigmaGRR / sigmaTotal) * 100 : 0;

  // Determine verdict based on %GRR
  // AIAG guidelines: <10% excellent, 10-30% may be acceptable, >30% unacceptable
  let verdict: 'excellent' | 'marginal' | 'unacceptable';
  let verdictText: string;

  if (pctGRR < 10) {
    verdict = 'excellent';
    verdictText = 'Measurement system is acceptable';
  } else if (pctGRR <= 30) {
    verdict = 'marginal';
    verdictText = 'May be acceptable depending on application';
  } else {
    verdict = 'unacceptable';
    verdictText = 'Measurement system needs improvement';
  }

  return {
    partCount,
    operatorCount,
    replicates: effectiveReplicates,
    totalMeasurements,
    varPart,
    varOperator,
    varInteraction,
    varRepeatability,
    varReproducibility,
    varGRR,
    varTotal,
    pctPart,
    pctRepeatability,
    pctReproducibility,
    pctGRR,
    verdict,
    verdictText,
    interactionData,
  };
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
 * @param grades - Optional grade tiers for classification
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
  stageOrder?: string[],
  grades?: GradeTier[]
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
      const stats = calculateStats(values, specs.usl, specs.lsl, grades);
      stageStats.set(stage, stats);
    }
  });

  // Filter out empty stages from order
  const nonEmptyOrder = order.filter(stage => stageStats.has(stage));

  if (nonEmptyOrder.length === 0) return null;

  // Calculate overall stats for reference
  const allValues: number[] = [];
  stageGroups.forEach(values => allValues.push(...values));
  const overallStats = calculateStats(allValues, specs.usl, specs.lsl, grades);

  return {
    stages: stageStats,
    stageOrder: nonEmptyOrder,
    overallStats,
  };
}

/**
 * Detect Nelson Rule 2 violations: 9+ consecutive points on same side of center line
 *
 * Returns the indices of all points that are part of a run of 9 or more
 * consecutive points above or below the mean (center line).
 *
 * @param values - Array of numeric measurement values
 * @param mean - The center line value (typically the process mean)
 * @returns Set of indices that are part of a Nelson Rule 2 violation
 *
 * @example
 * const violations = getNelsonRule2ViolationPoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0);
 * // Returns Set containing indices 0-9 (all above mean of 0)
 */
export function getNelsonRule2ViolationPoints(values: number[], mean: number): Set<number> {
  const violations = new Set<number>();

  if (values.length < 9) return violations;

  // Track current run
  let runStart = 0;
  let runSide: 'above' | 'below' | null = null;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const currentSide: 'above' | 'below' | null =
      value > mean ? 'above' : value < mean ? 'below' : null;

    // Points exactly on the mean break the run
    if (currentSide === null || currentSide !== runSide) {
      // Check if previous run was long enough (9+)
      if (runSide !== null && i - runStart >= 9) {
        for (let j = runStart; j < i; j++) {
          violations.add(j);
        }
      }
      // Start new run
      runStart = i;
      runSide = currentSide;
    }
  }

  // Check final run
  if (runSide !== null && values.length - runStart >= 9) {
    for (let j = runStart; j < values.length; j++) {
      violations.add(j);
    }
  }

  return violations;
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
    const startX = Math.min(...xValues);
    const endX = Math.max(...xValues);

    boundaries.push({
      name: stageName,
      startX,
      endX,
      stats: stageStats,
    });
  });

  return boundaries;
}

// ============================================================================
// Multiple Regression (GLM) Implementation
// ============================================================================

/**
 * Build dummy variables for a categorical column using reference coding
 * Creates k-1 dummy variables for k levels, with the first level as reference
 *
 * @param data - Data rows
 * @param column - Column name to encode
 * @param validRows - Indices of valid rows
 * @returns Object with dummy column names, values matrix, and level info
 */
function buildDummyVariables<T extends Record<string, unknown>>(
  data: T[],
  column: string,
  validRows: number[]
): {
  dummyNames: string[];
  dummyValues: number[][];
  levels: string[];
  referenceLevel: string;
} {
  // Get unique levels, sorted for consistency
  const levels = [...new Set(validRows.map(i => String(data[i][column])))].sort();

  if (levels.length < 2) {
    return { dummyNames: [], dummyValues: [], levels, referenceLevel: levels[0] || '' };
  }

  // First level is reference (omitted)
  const referenceLevel = levels[0];
  const nonRefLevels = levels.slice(1);

  const dummyNames = nonRefLevels.map(level => `${column}_${level}`);
  const dummyValues: number[][] = validRows.map(i => {
    const value = String(data[i][column]);
    return nonRefLevels.map(level => (value === level ? 1 : 0));
  });

  return { dummyNames, dummyValues, levels, referenceLevel };
}

/**
 * Build the full design matrix with continuous, categorical, and interaction terms
 */
function buildFullDesignMatrix<T extends Record<string, unknown>>(
  data: T[],
  yColumn: string,
  xColumns: string[],
  options: MultiRegressionOptions = {}
): {
  X: number[][];
  Y: number[];
  terms: RegressionTerm[];
  termNames: string[];
  n: number;
  validRows: number[];
} | null {
  const { categoricalColumns = [], includeInteractions = false } = options;

  // Separate continuous and categorical columns
  const continuousCols = xColumns.filter(c => !categoricalColumns.includes(c));
  const categoryCols = xColumns.filter(c => categoricalColumns.includes(c));

  // First pass: find valid rows (all required columns have valid values)
  const validRows: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Check Y value
    const yVal = Number(row[yColumn]);
    if (isNaN(yVal) || !isFinite(yVal)) continue;

    // Check continuous X values
    let valid = true;
    for (const col of continuousCols) {
      const val = Number(row[col]);
      if (isNaN(val) || !isFinite(val)) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;

    // Check categorical values exist
    for (const col of categoryCols) {
      const val = row[col];
      if (val === null || val === undefined || val === '') {
        valid = false;
        break;
      }
    }
    if (!valid) continue;

    validRows.push(i);
  }

  if (validRows.length < xColumns.length + 2) {
    // Need at least p + 2 observations for meaningful regression
    return null;
  }

  // Build design matrix
  const terms: RegressionTerm[] = [];
  const termNames: string[] = [];
  const X: number[][] = validRows.map(() => [1]); // Start with intercept column

  // Add continuous predictors
  for (const col of continuousCols) {
    terms.push({
      columns: [col],
      label: col,
      type: 'continuous',
    });
    termNames.push(col);

    validRows.forEach((rowIdx, i) => {
      X[i].push(Number(data[rowIdx][col]));
    });
  }

  // Add categorical predictors (dummy-encoded)
  const dummyInfo: Map<string, { names: string[]; levels: string[]; referenceLevel: string }> =
    new Map();

  for (const col of categoryCols) {
    const { dummyNames, dummyValues, levels, referenceLevel } = buildDummyVariables(
      data,
      col,
      validRows
    );

    dummyInfo.set(col, { names: dummyNames, levels, referenceLevel });

    for (let d = 0; d < dummyNames.length; d++) {
      terms.push({
        columns: [col],
        label: dummyNames[d],
        type: 'categorical',
        level: levels[d + 1], // +1 because reference is skipped
        referenceLevel,
      });
      termNames.push(dummyNames[d]);

      validRows.forEach((_, i) => {
        X[i].push(dummyValues[i][d]);
      });
    }
  }

  // Add interaction terms if requested
  if (includeInteractions && xColumns.length >= 2) {
    // Only add continuous × continuous interactions for now
    for (let i = 0; i < continuousCols.length; i++) {
      for (let j = i + 1; j < continuousCols.length; j++) {
        const col1 = continuousCols[i];
        const col2 = continuousCols[j];
        const interactionName = `${col1} × ${col2}`;

        terms.push({
          columns: [col1, col2],
          label: interactionName,
          type: 'interaction',
        });
        termNames.push(interactionName);

        validRows.forEach((rowIdx, k) => {
          const val1 = Number(data[rowIdx][col1]);
          const val2 = Number(data[rowIdx][col2]);
          X[k].push(val1 * val2);
        });
      }
    }

    // Add continuous × categorical interactions
    for (const contCol of continuousCols) {
      for (const catCol of categoryCols) {
        const info = dummyInfo.get(catCol);
        if (!info) continue;

        for (let d = 0; d < info.names.length; d++) {
          const level = info.levels[d + 1];
          const interactionName = `${contCol} × ${catCol}_${level}`;

          terms.push({
            columns: [contCol, catCol],
            label: interactionName,
            type: 'interaction',
            level,
            referenceLevel: info.referenceLevel,
          });
          termNames.push(interactionName);

          validRows.forEach((rowIdx, k) => {
            const contVal = Number(data[rowIdx][contCol]);
            const catVal = String(data[rowIdx][catCol]) === level ? 1 : 0;
            X[k].push(contVal * catVal);
          });
        }
      }
    }
  }

  // Extract Y values
  const Y = validRows.map(i => Number(data[i][yColumn]));

  return { X, Y, terms, termNames, n: validRows.length, validRows };
}

/**
 * Calculate VIF (Variance Inflation Factor) for each predictor
 * VIF = 1 / (1 - R²) where R² is from regressing that predictor on all others
 */
function calculateVIF(X: number[][]): number[] {
  const n = X.length;
  const p = X[0].length - 1; // Exclude intercept

  if (p < 2) return []; // VIF not meaningful with single predictor

  const vifs: number[] = [];

  // For each predictor (excluding intercept at index 0)
  for (let j = 1; j <= p; j++) {
    // Extract predictor j as response
    const yj = X.map(row => row[j]);

    // Build design matrix with all other predictors
    const Xother: number[][] = X.map(row => {
      const newRow = [1]; // Intercept
      for (let k = 1; k <= p; k++) {
        if (k !== j) newRow.push(row[k]);
      }
      return newRow;
    });

    // Calculate R² for this regression
    const XtX = multiply(transpose(Xother), Xother);
    if (!XtX) {
      vifs.push(Infinity);
      continue;
    }

    const XtXinv = inverse(XtX);
    if (!XtXinv) {
      vifs.push(Infinity);
      continue;
    }

    const XtY = multiplyVector(transpose(Xother), yj);
    if (!XtY) {
      vifs.push(Infinity);
      continue;
    }

    const beta = multiplyVector(XtXinv, XtY);
    if (!beta) {
      vifs.push(Infinity);
      continue;
    }

    // Calculate R²
    const yMean = yj.reduce((a, b) => a + b, 0) / n;
    let ssTot = 0;
    let ssRes = 0;

    for (let i = 0; i < n; i++) {
      const predicted = Xother[i].reduce((sum, xVal, k) => sum + xVal * beta[k], 0);
      ssTot += Math.pow(yj[i] - yMean, 2);
      ssRes += Math.pow(yj[i] - predicted, 2);
    }

    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    const vif = r2 < 1 ? 1 / (1 - r2) : Infinity;
    vifs.push(vif);
  }

  return vifs;
}

/**
 * Get VIF warnings based on severity thresholds
 */
function getVIFWarnings(vifs: number[], termNames: string[]): VIFWarning[] {
  const warnings: VIFWarning[] = [];

  vifs.forEach((vif, i) => {
    if (vif >= 5) {
      let severity: 'moderate' | 'high' | 'severe';
      let suggestion: string;

      if (vif >= 10) {
        severity = 'severe';
        suggestion = `Consider removing ${termNames[i]} or combining with correlated predictors`;
      } else if (vif >= 7) {
        severity = 'high';
        suggestion = `${termNames[i]} is highly correlated with other predictors`;
      } else {
        severity = 'moderate';
        suggestion = `${termNames[i]} shows some correlation with other predictors`;
      }

      warnings.push({
        term: termNames[i],
        vif,
        severity,
        suggestion,
      });
    }
  });

  return warnings;
}

/**
 * Get strength rating (1-5) based on adjusted R² value
 */
function getAdjustedRSquaredRating(adjR2: number): 1 | 2 | 3 | 4 | 5 {
  if (adjR2 >= 0.9) return 5;
  if (adjR2 >= 0.7) return 4;
  if (adjR2 >= 0.5) return 3;
  if (adjR2 >= 0.3) return 2;
  return 1;
}

/**
 * Generate plain-language insight for multiple regression results
 */
function generateMultiRegressionInsight(result: {
  yColumn: string;
  isSignificant: boolean;
  adjustedRSquared: number;
  coefficients: CoefficientResult[];
  topPredictors: string[];
  hasCollinearity: boolean;
}): string {
  if (!result.isSignificant) {
    return `No significant relationship found for ${result.yColumn}`;
  }

  const sigCoeffs = result.coefficients.filter(c => c.isSignificant);
  if (sigCoeffs.length === 0) {
    return `Model is significant overall but no individual predictors stand out`;
  }

  // Find the strongest predictor by standardized coefficient
  const strongest = [...sigCoeffs].sort(
    (a, b) => Math.abs(b.standardized) - Math.abs(a.standardized)
  )[0];

  const direction = strongest.coefficient > 0 ? 'increases' : 'decreases';
  const effect = Math.abs(strongest.coefficient).toFixed(2);

  let insight = `${strongest.term} ${direction} ${result.yColumn} by ${effect} per unit`;

  if (result.topPredictors.length > 1) {
    insight += `. Top predictors: ${result.topPredictors.slice(0, 3).join(', ')}`;
  }

  if (result.hasCollinearity) {
    insight += ' (multicollinearity detected)';
  }

  return insight;
}

/**
 * Calculate multiple regression analysis using Ordinary Least Squares (OLS)
 *
 * Fits a General Linear Model: Y = β₀ + β₁X₁ + β₂X₂ + ... + ε
 *
 * Supports:
 * - Multiple continuous predictors
 * - Categorical predictors (dummy-encoded)
 * - Two-way interaction terms
 * - VIF diagnostics for multicollinearity
 *
 * @param data - Array of data records
 * @param yColumn - Column name for response (Y) variable
 * @param xColumns - Column names for predictor (X) variables
 * @param options - Optional settings for categorical encoding, interactions
 * @returns MultiRegressionResult with coefficients, fit statistics, and diagnostics
 *
 * @example
 * // Basic multiple regression with continuous predictors
 * const result = calculateMultipleRegression(data, 'Yield', ['Temperature', 'Pressure']);
 *
 * @example
 * // With categorical predictor and interactions
 * const result = calculateMultipleRegression(data, 'Yield', ['Temperature', 'Machine'], {
 *   categoricalColumns: ['Machine'],
 *   includeInteractions: true
 * });
 */
export function calculateMultipleRegression<T extends Record<string, unknown>>(
  data: T[],
  yColumn: string,
  xColumns: string[],
  options: MultiRegressionOptions = {}
): MultiRegressionResult | null {
  // Validate inputs
  if (data.length === 0 || xColumns.length === 0) return null;

  // Build design matrix
  const design = buildFullDesignMatrix(data, yColumn, xColumns, options);
  if (!design) return null;

  const { X, Y, terms, termNames, n } = design;
  const p = terms.length; // Number of predictors (excluding intercept)

  // Need sufficient degrees of freedom
  if (n <= p + 1) return null;

  // OLS: β̂ = (X'X)⁻¹X'Y
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  if (!XtX) return null;

  const XtXinv = inverse(XtX);
  if (!XtXinv) return null;

  const XtY = multiplyVector(Xt, Y);
  if (!XtY) return null;

  const beta = multiplyVector(XtXinv, XtY);
  if (!beta) return null;

  const intercept = beta[0];

  // Calculate fitted values and residuals
  const yMean = Y.reduce((a, b) => a + b, 0) / n;
  let ssTot = 0;
  let ssRes = 0;
  let ssReg = 0;

  const fitted: number[] = [];
  for (let i = 0; i < n; i++) {
    let yHat = 0;
    for (let j = 0; j < X[i].length; j++) {
      yHat += X[i][j] * beta[j];
    }
    fitted.push(yHat);

    ssTot += Math.pow(Y[i] - yMean, 2);
    ssRes += Math.pow(Y[i] - yHat, 2);
    ssReg += Math.pow(yHat - yMean, 2);
  }

  // R² and Adjusted R²
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - p - 1);

  // Mean Square Error
  const dfRes = n - p - 1;
  const mse = dfRes > 0 ? ssRes / dfRes : 0;
  const rmse = Math.sqrt(mse);

  // F-statistic for overall model significance
  const dfReg = p;
  const msReg = dfReg > 0 ? ssReg / dfReg : 0;
  const fStatistic = mse > 0 ? msReg / mse : 0;
  const pValueF = fDistributionPValue(fStatistic, dfReg, dfRes);
  const isSignificant = pValueF < 0.05;

  // Calculate standard errors and t-statistics for each coefficient
  // SE(β̂) = sqrt(MSE * diag((X'X)⁻¹))
  const diagonalXtXinv = diagonal(XtXinv);

  // Calculate standardized coefficients (need predictor std devs)
  const xStdDevs: number[] = [1]; // Placeholder for intercept
  for (let j = 1; j <= p; j++) {
    const xCol = X.map(row => row[j]);
    const xMean = xCol.reduce((a, b) => a + b, 0) / n;
    const variance = xCol.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / (n - 1);
    xStdDevs.push(Math.sqrt(variance));
  }
  const yStdDev = Math.sqrt(ssTot / (n - 1));

  const coefficients: CoefficientResult[] = [];
  for (let j = 0; j < p; j++) {
    const coef = beta[j + 1]; // +1 to skip intercept
    const se = Math.sqrt(mse * diagonalXtXinv[j + 1]);
    const tStat = se > 0 ? coef / se : 0;
    const pValue = se > 0 ? tDistributionPValue(tStat, dfRes) : 1;

    // Standardized coefficient: β* = β × (sx / sy)
    const standardized =
      yStdDev > 0 && xStdDevs[j + 1] > 0 ? coef * (xStdDevs[j + 1] / yStdDev) : 0;

    coefficients.push({
      term: termNames[j],
      coefficient: coef,
      stdError: se,
      tStatistic: tStat,
      pValue,
      isSignificant: pValue < 0.05,
      standardized,
      termInfo: terms[j],
    });
  }

  // Calculate VIF for multicollinearity detection
  const vifs = calculateVIF(X);
  vifs.forEach((vif, i) => {
    if (i < coefficients.length) {
      coefficients[i].vif = vif;
    }
  });

  const vifWarnings = getVIFWarnings(vifs, termNames);
  const hasCollinearity = vifWarnings.some(w => w.severity === 'severe');

  // Top predictors by absolute standardized coefficient
  const topPredictors = [...coefficients]
    .filter(c => c.isSignificant)
    .sort((a, b) => Math.abs(b.standardized) - Math.abs(a.standardized))
    .map(c => c.term)
    .slice(0, 5);

  const strengthRating = getAdjustedRSquaredRating(adjustedRSquared);

  const insight = generateMultiRegressionInsight({
    yColumn,
    isSignificant,
    adjustedRSquared,
    coefficients,
    topPredictors,
    hasCollinearity,
  });

  return {
    yColumn,
    xColumns,
    terms,
    n,
    p,
    rSquared,
    adjustedRSquared,
    fStatistic,
    pValue: pValueF,
    isSignificant,
    rmse,
    intercept,
    coefficients,
    vifWarnings,
    hasCollinearity,
    insight,
    topPredictors,
    strengthRating,
  };
}
