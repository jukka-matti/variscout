import type { IChartDataPoint, StatsResult } from '@variscout/core';
import { formatTimeValue, lttb, type DataCellValue } from '@variscout/core';

/**
 * Shared hook to transform source data into IChartDataPoint[].
 * Applies LTTB decimation for large datasets when chartWidth is provided.
 */
export function useIChartData(
  sourceData: Record<string, unknown>[],
  outcome: string | null,
  stageColumn: string | null,
  timeColumn: string | null,
  /** Chart container width for LTTB threshold. If provided, decimates large datasets. */
  chartWidth?: number,
  /** Stats with control limits — used to force-include violation points in decimation */
  stats?: StatsResult | null
): IChartDataPoint[] {
  const fullData = (() => {
    if (!outcome) return [];
    return sourceData
      .map(
        (d, i): IChartDataPoint => ({
          x: i,
          y: Number(d[outcome]),
          stage: stageColumn ? String(d[stageColumn] ?? '') : undefined,
          timeValue: timeColumn ? formatTimeValue(d[timeColumn] as DataCellValue) : undefined,
          originalIndex: i,
        })
      )
      .filter(d => !isNaN(d.y));
  })();

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
