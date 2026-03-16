/**
 * useDashboardComputedData - Shared derived data for Dashboard hooks
 *
 * Extracts four identical useMemos from both PWA and Azure useDashboardCharts:
 * - availableOutcomes: numeric columns suitable as outcome
 * - availableStageColumns: columns with 2-10 unique values for staging
 * - anovaResult: ANOVA calculation for current boxplot factor
 * - boxplotData: grouped and sorted boxplot data for stats tables
 */
import { useMemo } from 'react';
import { calculateAnova, sortBoxplotData, calculateBoxplotStats } from '@variscout/core';
import type {
  AnovaResult,
  DataRow,
  BoxplotGroupData,
  BoxplotSortBy,
  BoxplotSortDirection,
} from '@variscout/core';

export interface UseDashboardComputedDataOptions {
  /** Full unfiltered dataset */
  rawData: DataRow[];
  /** Currently filtered dataset */
  filteredData: DataRow[];
  /** Selected outcome column */
  outcome: string | null;
  /** Selected boxplot factor column */
  boxplotFactor: string;
  /** Boxplot sort criterion */
  boxplotSortBy?: BoxplotSortBy;
  /** Boxplot sort direction */
  boxplotSortDirection?: BoxplotSortDirection;
  /** Pre-computed boxplot data from useBoxplotData — skips redundant calculation when provided */
  precomputedBoxplotData?: BoxplotGroupData[];
}

export interface UseDashboardComputedDataResult {
  /** Numeric columns available as outcome measures */
  availableOutcomes: string[];
  /** Columns suitable as stage groupings (2-10 unique values) */
  availableStageColumns: string[];
  /** ANOVA result for current boxplot factor vs outcome */
  anovaResult: AnovaResult | null;
  /** Grouped and sorted boxplot data */
  boxplotData: BoxplotGroupData[];
}

export function useDashboardComputedData({
  rawData,
  filteredData,
  outcome,
  boxplotFactor,
  boxplotSortBy,
  boxplotSortDirection,
  precomputedBoxplotData,
}: UseDashboardComputedDataOptions): UseDashboardComputedDataResult {
  // Computed: available outcome columns (numeric)
  const availableOutcomes = useMemo(() => {
    if (rawData.length === 0) return [];
    const row = rawData[0];
    return Object.keys(row).filter(key => typeof row[key] === 'number');
  }, [rawData]);

  // Computed: available stage columns (2-10 unique values)
  const availableStageColumns = useMemo(() => {
    if (rawData.length === 0) return [];
    const candidates: string[] = [];
    const columns = Object.keys(rawData[0] || {});

    for (const col of columns) {
      if (col === outcome) continue;

      const uniqueValues = new Set<string>();
      for (const row of rawData) {
        const val = row[col];
        if (val !== undefined && val !== null && val !== '') {
          uniqueValues.add(String(val));
        }
        if (uniqueValues.size > 10) break;
      }

      if (uniqueValues.size >= 2 && uniqueValues.size <= 10) {
        candidates.push(col);
      }
    }

    return candidates;
  }, [rawData, outcome]);

  // Computed: ANOVA result
  const anovaResult: AnovaResult | null = useMemo(() => {
    if (!outcome || !boxplotFactor || filteredData.length === 0) return null;
    return calculateAnova(filteredData, outcome, boxplotFactor);
  }, [filteredData, outcome, boxplotFactor]);

  // Computed: boxplot data (skip when pre-computed data is provided)
  const boxplotData: BoxplotGroupData[] = useMemo(() => {
    if (precomputedBoxplotData) {
      return sortBoxplotData(precomputedBoxplotData, boxplotSortBy, boxplotSortDirection);
    }
    if (!outcome || !boxplotFactor || filteredData.length === 0) return [];

    const groups = new Map<string, number[]>();
    for (const row of filteredData) {
      const key = String(row[boxplotFactor] ?? '');
      const value = Number(row[outcome]);
      if (!isNaN(value)) {
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(value);
      }
    }

    const unsorted = Array.from(groups.entries()).map(([group, values]) =>
      calculateBoxplotStats({ group, values })
    );
    return sortBoxplotData(unsorted, boxplotSortBy, boxplotSortDirection);
  }, [
    filteredData,
    outcome,
    boxplotFactor,
    boxplotSortBy,
    boxplotSortDirection,
    precomputedBoxplotData,
  ]);

  return {
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,
  };
}
