import * as d3 from 'd3-array';
import type { ProbabilityPlotPoint } from '../types';
import { normalPDF } from './distributions';

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
