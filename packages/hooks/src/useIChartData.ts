import { useMemo } from 'react';
import type { IChartDataPoint, StatsResult } from '@variscout/core';
import { formatTimeValue, lttb, type DataCellValue, applyTimeLens } from '@variscout/core';
import { usePreferencesStore } from '@variscout/stores';

/**
 * Shared hook to transform source data into IChartDataPoint[].
 * Applies LTTB decimation for large datasets when chartWidth is provided.
 *
 * Reads `timeLens` from `usePreferencesStore` and filters `sourceData` through
 * `applyTimeLens` before computing chart points.
 */
export function useIChartData(
  sourceData: Record<string, unknown>[],
  outcome: string | null,
  stageColumn: string | null,
  timeColumn: string | null,
  /** Chart container width for LTTB threshold. If provided, decimates large datasets. */
  chartWidth?: number,
  /** Stats with control limits — used to force-include violation points in decimation */
  stats?: StatsResult | null,
  /** Factor column names — values included in tooltip display */
  factors?: string[]
): IChartDataPoint[] {
  const timeLens = usePreferencesStore(s => s.timeLens);

  const lensedData = useMemo(
    // timeColumn unused in current applyTimeLens (rows pre-sorted upstream); see applyTimeLens docstring.
    () => applyTimeLens(sourceData, timeLens, timeColumn ?? ''),
    [sourceData, timeLens, timeColumn]
  );

  const fullData = useMemo(() => {
    if (!outcome) return [];
    return lensedData
      .map(
        (d, i): IChartDataPoint => ({
          x: i,
          y: Number(d[outcome]),
          stage: stageColumn ? String(d[stageColumn] ?? '') : undefined,
          timeValue: timeColumn ? formatTimeValue(d[timeColumn] as DataCellValue) : undefined,
          originalIndex: i,
          factorValues:
            factors && factors.length > 0
              ? Object.fromEntries(factors.map(f => [f, d[f] != null ? String(d[f]) : '']))
              : undefined,
        })
      )
      .filter(d => !isNaN(d.y));
  }, [lensedData, outcome, stageColumn, timeColumn, factors]);

  // Apply LTTB decimation for large datasets
  if (!chartWidth || fullData.length <= chartWidth * 2) return fullData;

  // Find violation points to force-include
  const forceInclude = new Set<number>();
  if (stats?.ucl !== undefined && stats?.lcl !== undefined) {
    fullData.forEach(p => {
      if (p.y > stats.ucl || p.y < stats.lcl) {
        if (p.originalIndex !== undefined) forceInclude.add(p.originalIndex);
      }
    });
  }

  return lttb(fullData, chartWidth * 2, forceInclude.size > 0 ? forceInclude : undefined);
}
