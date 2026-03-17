/**
 * useSnapshotData — Computes filtered data and stats for a finding snapshot.
 *
 * Given raw data, an outcome column, spec limits, and a set of active filters,
 * returns the filtered rows, extracted numeric values, and calculated stats.
 * Memoized to avoid redundant computation on unchanged inputs.
 */

import { useMemo } from 'react';
import { calculateStats } from '@variscout/core';
import type { DataRow, StatsResult, SpecLimits } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export interface UseSnapshotDataOptions {
  /** Full raw dataset (all rows, unfiltered) */
  rawData: DataRow[];
  /** Column name for the numeric outcome measurement */
  outcome: string;
  /** Specification limits used for capability calculations */
  specs: SpecLimits;
  /** Active filters: column name → allowed values */
  activeFilters: Record<string, (string | number)[]>;
}

export interface UseSnapshotDataReturn {
  /** Rows passing all activeFilters */
  filteredData: DataRow[];
  /** Calculated statistics over the filtered numeric values */
  stats: StatsResult;
  /** Numeric outcome values extracted from filteredData */
  values: number[];
}

// ============================================================================
// Hook
// ============================================================================

export function useSnapshotData({
  rawData,
  outcome,
  specs,
  activeFilters,
}: UseSnapshotDataOptions): UseSnapshotDataReturn {
  return useMemo(() => {
    // Filter rows: every active filter column must include the row's value.
    const filterEntries = Object.entries(activeFilters);

    const filteredData =
      filterEntries.length === 0
        ? rawData
        : rawData.filter(row =>
            filterEntries.every(([col, allowedValues]) => {
              if (allowedValues.length === 0) return true;
              const cell = row[col];
              // Use loose equality so string '3' matches number 3 if needed,
              // but check both types explicitly for correctness.
              return allowedValues.some(v => v === cell || String(v) === String(cell));
            })
          );

    // Extract numeric outcome values.
    const values: number[] = [];
    for (const row of filteredData) {
      const cell = row[outcome];
      if (typeof cell === 'number' && isFinite(cell) && !isNaN(cell)) {
        values.push(cell);
      } else if (typeof cell === 'string') {
        const parsed = parseFloat(cell);
        if (isFinite(parsed) && !isNaN(parsed)) {
          values.push(parsed);
        }
      }
    }

    const stats = calculateStats(values, specs.usl, specs.lsl);

    return { filteredData, stats, values };
  }, [rawData, outcome, specs, activeFilters]);
}
