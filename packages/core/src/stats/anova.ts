import * as d3 from 'd3-array';
import type { DataRow, AnovaResult, AnovaGroup } from '../types';
import { toNumericValue } from '../types';
import { fDistributionPValue } from './distributions';

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
