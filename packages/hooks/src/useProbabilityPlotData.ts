import { useMemo } from 'react';
import { calculateProbabilityPlotData } from '@variscout/core/stats';
import { andersonDarlingTest } from '@variscout/core/stats';
import type { ProbabilityPlotSeries, DataRow } from '@variscout/core';
import * as d3 from 'd3-array';

const AD_MIN_SAMPLE = 7;

interface UseProbabilityPlotDataOptions {
  /** All data rows (unfiltered by factor — filtering happens here) */
  values: number[];
  /** Factor column name (if any) */
  factorColumn?: string;
  /** All data rows for factor grouping */
  rows?: DataRow[];
}

/**
 * Computes probability plot series data, one per factor level.
 * Without a factor, returns a single "All" series.
 *
 * Handles:
 * - Grouping values by factor level
 * - Computing probability plot points per group (Benard formula)
 * - Mean, stdDev, n per group
 * - Anderson-Darling normality test per group (null when n < 7)
 * - Original row indices for cross-chart brush highlighting
 */
export function useProbabilityPlotData({
  values,
  factorColumn,
  rows,
}: UseProbabilityPlotDataOptions): ProbabilityPlotSeries[] {
  return useMemo(() => {
    if (values.length === 0) return [];

    // No factor or no rows → single series
    if (!factorColumn || !rows || rows.length === 0) {
      return [
        buildSeries(
          'All',
          values,
          Array.from({ length: values.length }, (_, i) => i)
        ),
      ];
    }

    // Group by factor level
    const groups = new Map<string, { vals: number[]; indices: number[] }>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const factorValue = row[factorColumn];
      if (factorValue == null) continue;

      const key = String(factorValue);
      const numVal = values[i];
      if (typeof numVal !== 'number' || !isFinite(numVal)) continue;

      let group = groups.get(key);
      if (!group) {
        group = { vals: [], indices: [] };
        groups.set(key, group);
      }
      group.vals.push(numVal);
      group.indices.push(i);
    }

    const series: ProbabilityPlotSeries[] = [];
    for (const [key, group] of groups) {
      if (group.vals.length < 2) continue; // Need at least 2 points for a line
      series.push(buildSeries(key, group.vals, group.indices));
    }

    return series;
  }, [values, factorColumn, rows]);
}

function buildSeries(
  key: string,
  vals: number[],
  originalIndices: number[]
): ProbabilityPlotSeries {
  const points = calculateProbabilityPlotData(vals);
  const mean = d3.mean(vals) ?? 0;
  const stdDev = d3.deviation(vals) ?? 0;
  const adResult = vals.length >= AD_MIN_SAMPLE ? andersonDarlingTest(vals) : null;

  return {
    key,
    points,
    mean,
    stdDev,
    n: vals.length,
    adTestPValue: adResult?.pValue ?? null,
    originalIndices,
  };
}
