import * as d3 from 'd3';
import type { StatsResult, GradeTier } from '../types';

/**
 * d2 unbiasing constant for moving range span of 2 (individuals / I-MR chart).
 * Used to estimate σ_within from the mean moving range: σ_within = MR̄ / d2
 *
 * VariScout always uses subgroup size n=1 (individuals) because the data model
 * is flat rows of individual measurements, not rational subgroups. With n=1,
 * the moving range span is 2, giving d2 = 1.128.
 *
 * For reference, Minitab's d2 constants for other subgroup sizes:
 *   n=2 → 1.128, n=3 → 1.693, n=4 → 2.059, n=5 → 2.326
 *
 * Note: Data must be in time/production order for the moving range to be
 * meaningful. Shuffled data inflates MR̄ and overestimates σ_within.
 */
const D2 = 1.128;

/**
 * Calculate within-subgroup standard deviation from moving range
 *
 * In SPC, σ_within (estimated from the moving range) captures short-term,
 * inherent process variation. This is used for I-MR chart control limits
 * and Cp/Cpk capability indices.
 *
 * Formula: σ_within = MR̄ / d2, where MR̄ = mean(|x_i - x_{i-1}|), d2 = 1.128
 *
 * @param data - Array of numeric measurement values in time order
 * @returns Object with sigmaWithin and mrBar values
 *
 * @example
 * const { sigmaWithin, mrBar } = calculateMovingRangeSigma([10, 12, 11, 13, 10]);
 * // MR = [2, 1, 2, 3], MR̄ = 2.0, σ_within = 2.0 / 1.128 ≈ 1.773
 */
export function calculateMovingRangeSigma(data: number[]): {
  sigmaWithin: number;
  mrBar: number;
} {
  if (data.length < 2) {
    // Fallback: single point or empty — use overall σ (which will be 0)
    const stdDev = d3.deviation(data) || 0;
    return { sigmaWithin: stdDev, mrBar: 0 };
  }

  let sumMR = 0;
  for (let i = 1; i < data.length; i++) {
    sumMR += Math.abs(data[i] - data[i - 1]);
  }
  const mrBar = sumMR / (data.length - 1);
  const sigmaWithin = mrBar / D2;

  return { sigmaWithin, mrBar };
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
  grades?: GradeTier[]
): StatsResult {
  if (data.length === 0) {
    return { mean: 0, stdDev: 0, sigmaWithin: 0, mrBar: 0, ucl: 0, lcl: 0, outOfSpecPercentage: 0 };
  }

  const mean = d3.mean(data) || 0;
  const stdDev = d3.deviation(data) || 0; // σ_overall
  const { sigmaWithin, mrBar } = calculateMovingRangeSigma(data);

  // I-Chart Control Limits use σ_within (MR̄/d2)
  const ucl = mean + 3 * sigmaWithin;
  const lcl = mean - 3 * sigmaWithin;

  let cp: number | undefined;
  let cpk: number | undefined;

  // Cp/Cpk use σ_within (short-term capability, industry standard)
  if (usl !== undefined && lsl !== undefined) {
    cp = (usl - lsl) / (6 * sigmaWithin);
    const cpu = (usl - mean) / (3 * sigmaWithin);
    const cpl = (mean - lsl) / (3 * sigmaWithin);
    cpk = Math.min(cpu, cpl);
  } else if (usl !== undefined) {
    cpk = (usl - mean) / (3 * sigmaWithin);
  } else if (lsl !== undefined) {
    cpk = (mean - lsl) / (3 * sigmaWithin);
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
    sigmaWithin,
    mrBar,
    ucl,
    lcl,
    cp,
    cpk,
    outOfSpecPercentage,
    gradeCounts,
  };
}
