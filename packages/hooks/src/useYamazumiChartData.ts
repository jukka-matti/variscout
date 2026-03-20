/**
 * useYamazumiChartData - Transform raw data rows into YamazumiBarData[]
 *
 * Shared hook for Yamazumi chart wrappers in both PWA and Azure apps.
 * Calls computeYamazumiData() from @variscout/core.
 */
import { useMemo } from 'react';
import type { DataRow, YamazumiColumnMapping, YamazumiBarData } from '@variscout/core';
import { computeYamazumiData } from '@variscout/core';

export interface UseYamazumiChartDataOptions {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Column role mapping */
  mapping: YamazumiColumnMapping | null;
}

/**
 * Compute Yamazumi bar data from filtered data and column mapping.
 * Returns empty array if mapping is null.
 */
export function useYamazumiChartData({
  filteredData,
  mapping,
}: UseYamazumiChartDataOptions): YamazumiBarData[] {
  return useMemo(() => {
    if (!mapping) return [];
    return computeYamazumiData(filteredData, mapping);
  }, [filteredData, mapping]);
}
