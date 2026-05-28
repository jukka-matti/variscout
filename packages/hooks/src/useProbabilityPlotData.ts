import { useMemo } from 'react';
import { calculateProbabilityPlotData } from '@variscout/core/stats';
import { andersonDarlingTest } from '@variscout/core/stats';
import { timeLensIndices } from '@variscout/core';
import type { ProbabilityPlotSeries, DataRow } from '@variscout/core';
import * as d3 from 'd3-array';
import { usePreferencesStore } from '@variscout/stores';
import { augmentLensedRowsWithDerived } from './factorListUtils';

const AD_MIN_SAMPLE = 7;

interface UseProbabilityPlotDataOptions {
  /** All data rows (unfiltered by factor — filtering happens here) */
  values: number[];
  /** Factor column name (if any) */
  factorColumn?: string;
  /** All data rows for factor grouping */
  rows?: DataRow[];
  /**
   * G1 Task 4: derived categorical columns keyed by column name.
   * When `factorColumn` refers to a derived column (e.g. `Reactor_temp_bin`),
   * the raw `rows` won't have that key. Providing this map causes each row to be
   * augmented with its derived value before grouping.
   * Backward compat: absent or empty → identical to before.
   */
  categoricalValuesByColumn?: Record<string, (string | null)[]>;
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
 * Reads `timeLens` from `usePreferencesStore` and applies integer-index math
 * via `timeLensIndices` to both `rows` and the aligned `values` slice before
 * computing series. This avoids object-reference equality bugs (indexOf) and
 * correctly handles defect-mode-style calls where rows and values are parallel
 * but distinct arrays.
 */
export function useProbabilityPlotData({
  values,
  factorColumn,
  rows,
  categoricalValuesByColumn,
}: UseProbabilityPlotDataOptions): ProbabilityPlotSeries[] {
  const timeLens = usePreferencesStore(s => s.timeLens);

  /**
   * When rows are present, derive [start, end) from the lens against rows.length
   * and slice both arrays identically — pure integer math, no reference tricks.
   *
   * When rows are absent (values-only path), derive indices against values.length
   * instead, then slice values directly.
   *
   * G1 Task 4: after slicing, augment lensedRows with derived categorical
   * columns so that factorColumn can refer to a derived key (e.g. Reactor_temp_bin).
   * Augmentation is index-aligned: categoricalValuesByColumn[col][start+i] →
   * lensedRows[i]. The start offset is threaded from timeLensIndices.
   */
  const { lensedValues, lensedRows } = useMemo(() => {
    if (!rows || rows.length === 0) {
      // values-only path: apply lens indices against values length directly.
      const { start, end } = timeLensIndices(values.length, timeLens);
      return {
        lensedValues: values.slice(start, end),
        lensedRows: undefined,
      };
    }
    // rows+values path: both are parallel arrays of the same length; use a
    // single [start,end) derived from rows.length to slice both identically.
    const { start, end } = timeLensIndices(rows.length, timeLens);
    const slicedRows = rows.slice(start, end);
    return {
      lensedValues: values.slice(start, end),
      lensedRows: augmentLensedRowsWithDerived(slicedRows, categoricalValuesByColumn, start),
    };
  }, [values, rows, timeLens, categoricalValuesByColumn]);

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
