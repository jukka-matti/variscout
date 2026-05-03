import { useMemo } from 'react';
import { calculateProbabilityPlotData } from '@variscout/core/stats';
import { andersonDarlingTest } from '@variscout/core/stats';
import { applyTimeLens } from '@variscout/core';
import type { ProbabilityPlotSeries, DataRow } from '@variscout/core';
import * as d3 from 'd3-array';
import { useSessionStore } from '@variscout/stores';

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
 *
 * Reads `timeLens` from `useSessionStore` and applies `applyTimeLens` to
 * both `rows` and the aligned `values` slice before computing series. Task 3 wiring.
 */
export function useProbabilityPlotData({
  values,
  factorColumn,
  rows,
}: UseProbabilityPlotDataOptions): ProbabilityPlotSeries[] {
  const timeLens = useSessionStore(s => s.timeLens);

  /**
   * When rows are present, apply the lens to them and re-slice values to match.
   * values[i] is the numeric outcome for rows[i], so the same index window applies.
   * When rows are absent (single-series, values-only path), apply the lens to a
   * synthetic index array and use it to slice values.
   */
  const { lensedValues, lensedRows } = useMemo(() => {
    if (!rows || rows.length === 0) {
      // values-only path: build synthetic rows, apply lens, extract slice
      const syntheticRows = values.map((v, i) => ({ __idx: i, __v: v }));
      const sliced = applyTimeLens(syntheticRows, timeLens, '__idx');
      return {
        lensedValues: sliced.map(r => r.__v),
        lensedRows: undefined,
      };
    }
    const sliced = applyTimeLens(rows, timeLens, '');
    // Determine which original indices were kept so we can slice values in sync.
    // applyTimeLens returns a contiguous slice, so we can compute the offset.
    const startIdx = rows.indexOf(sliced[0] ?? rows[rows.length]);
    const safeStart = startIdx < 0 ? 0 : startIdx;
    return {
      lensedValues: values.slice(safeStart, safeStart + sliced.length),
      lensedRows: sliced,
    };
  }, [values, rows, timeLens]);

  return useMemo(() => {
    if (lensedValues.length === 0) return [];

    // No factor or no rows → single series
    if (!factorColumn || !lensedRows || lensedRows.length === 0) {
      return [
        buildSeries(
          'All',
          lensedValues,
          Array.from({ length: lensedValues.length }, (_, i) => i)
        ),
      ];
    }

    // Group by factor level
    const groups = new Map<string, { vals: number[]; indices: number[] }>();

    for (let i = 0; i < lensedRows.length; i++) {
      const row = lensedRows[i];
      const factorValue = row[factorColumn];
      if (factorValue == null) continue;

      const key = String(factorValue);
      const numVal = lensedValues[i];
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
  }, [lensedValues, factorColumn, lensedRows]);
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
