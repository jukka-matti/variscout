import { useMemo } from 'react';
import type { IChartDataPoint } from '@variscout/charts';
import { formatTimeValue, type DataCellValue } from '@variscout/core';

/**
 * Shared hook to transform source data into IChartDataPoint[].
 * Used by both PWA and Azure IChart wrappers.
 */
export function useIChartData(
  sourceData: Record<string, unknown>[],
  outcome: string | null,
  stageColumn: string | null,
  timeColumn: string | null
): IChartDataPoint[] {
  return useMemo(() => {
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
  }, [sourceData, outcome, stageColumn, timeColumn]);
}
