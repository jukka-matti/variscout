/**
 * Pre-computed chart data for sample datasets
 *
 * This module provides pre-calculated statistics and chart-ready data
 * for use in the marketing website where we don't want to run
 * calculations at runtime.
 */

import { calculateStats } from '@variscout/core';
import { calculateBoxplotStats } from '@variscout/charts';
import { SAMPLES, getSample } from '../samples';
import type {
  ComputedChartData,
  IChartPoint,
  BoxplotGroup,
  ParetoItem,
  PrecomputedStats,
} from '../types';

/**
 * Compute I-Chart data points from a sample dataset
 */
export function computeIChartData(
  data: Record<string, unknown>[],
  outcomeKey: string
): IChartPoint[] {
  return data
    .map((row, index) => {
      const value = Number(row[outcomeKey]);
      if (isNaN(value)) return null;
      return {
        x: index,
        y: value,
        originalIndex: index,
      };
    })
    .filter((point): point is IChartPoint => point !== null);
}

/**
 * Compute Boxplot data grouped by a factor
 */
export function computeBoxplotData(
  data: Record<string, unknown>[],
  outcomeKey: string,
  factorKey: string
): BoxplotGroup[] {
  // Group data by factor
  const groups = new Map<string, number[]>();

  for (const row of data) {
    const factor = String(row[factorKey] ?? 'Unknown');
    const value = Number(row[outcomeKey]);
    if (isNaN(value)) continue;

    if (!groups.has(factor)) {
      groups.set(factor, []);
    }
    groups.get(factor)!.push(value);
  }

  // Convert to boxplot format using the charts helper
  const result: BoxplotGroup[] = [];

  for (const [key, values] of groups) {
    if (values.length === 0) continue;

    // Use the charts helper with correct input format
    const stats = calculateBoxplotStats({ group: key, values });
    // Calculate mean separately (not included in BoxplotGroupData)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    result.push({
      key: stats.key,
      values: stats.values,
      min: stats.min,
      max: stats.max,
      q1: stats.q1,
      median: stats.median,
      q3: stats.q3,
      outliers: stats.outliers,
      mean,
    });
  }

  return result;
}

/**
 * Compute Pareto data (frequency counts with cumulative percentage)
 */
export function computeParetoData(
  data: Record<string, unknown>[],
  factorKey: string
): ParetoItem[] {
  // Count occurrences
  const counts = new Map<string, number>();

  for (const row of data) {
    const factor = String(row[factorKey] ?? 'Unknown');
    counts.set(factor, (counts.get(factor) || 0) + 1);
  }

  // Sort by count descending
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  // Calculate cumulative
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  let cumulative = 0;

  return sorted.map(([key, value]) => {
    cumulative += value;
    return {
      key,
      value,
      cumulative,
      cumulativePercentage: (cumulative / total) * 100,
    };
  });
}

/**
 * Compute statistics for a sample dataset
 */
export function computeStats(
  data: Record<string, unknown>[],
  outcomeKey: string,
  specs: { usl?: number; lsl?: number; target?: number }
): PrecomputedStats {
  const values = data.map(row => Number(row[outcomeKey])).filter(v => !isNaN(v));

  if (values.length === 0) {
    return {
      n: 0,
      mean: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      ucl: 0,
      lcl: 0,
      outOfSpecPercentage: 0,
    };
  }

  // Calculate basic stats
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Use core stats calculation
  const stats = calculateStats(values, specs.usl, specs.lsl);

  return {
    n,
    mean: stats.mean,
    stdDev: stats.stdDev,
    min,
    max,
    ucl: stats.ucl,
    lcl: stats.lcl,
    cp: stats.cp,
    cpk: stats.cpk,
    outOfSpecPercentage: stats.outOfSpecPercentage,
  };
}

/**
 * Get fully computed chart data for a sample
 */
export function getComputedData(urlKey: string): ComputedChartData | undefined {
  const sample = getSample(urlKey);
  if (!sample) return undefined;

  const { data, config } = sample;
  const { outcome, factors, specs } = config;

  return {
    urlKey,
    ichartData: computeIChartData(data, outcome),
    boxplotData: factors.length > 0 ? computeBoxplotData(data, outcome, factors[0]) : [],
    paretoData: factors.length > 0 ? computeParetoData(data, factors[0]) : [],
    stats: computeStats(data, outcome, specs),
    specs,
  };
}

/**
 * Pre-computed data cache (computed on first access)
 */
const computedCache = new Map<string, ComputedChartData>();

/**
 * Get computed data with caching
 */
export function getCachedComputedData(urlKey: string): ComputedChartData | undefined {
  if (!computedCache.has(urlKey)) {
    const computed = getComputedData(urlKey);
    if (computed) {
      computedCache.set(urlKey, computed);
    }
  }
  return computedCache.get(urlKey);
}
