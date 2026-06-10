import { useMemo } from 'react';
import { computeSustainmentComparison } from '@variscout/core';
import type { ControlRecord, DataRow, SpecLimits, SustainmentComparison } from '@variscout/core';

export interface UseSustainmentComparisonOptions {
  rows: DataRow[];
  timeColumn?: string | null;
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>;
  record?: ControlRecord | null;
  defectCategoryColumn?: string;
}

export function useSustainmentComparison({
  rows,
  timeColumn,
  specs,
  record,
  defectCategoryColumn,
}: UseSustainmentComparisonOptions): SustainmentComparison | null {
  return useMemo(() => {
    if (!record) return null;
    return computeSustainmentComparison({
      rows,
      timeColumn: timeColumn ?? null,
      improvementDate: record.improvementDate,
      baseline: record.baseline,
      specs,
      defectCategoryColumn,
    });
  }, [defectCategoryColumn, record, rows, specs, timeColumn]);
}
