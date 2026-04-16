/**
 * useDefectSummary — Compute DefectSummary props from transformed defect data.
 *
 * Extracts the ~45-line computation from Dashboard into a reusable hook,
 * following the orchestration layer pattern.
 */

import { useMemo } from 'react';
import type { DefectTransformResult, DefectMapping } from '@variscout/core';

export interface DefectSummaryProps {
  totalDefects: number;
  defectRate: number;
  rateLabel: string;
  topDefectType?: string;
  topDefectPercent?: number;
  paretoCount80?: number;
  totalTypes?: number;
}

/**
 * Derive DefectSummary display props from defect transform output.
 *
 * @param defectResult - Output of useDefectTransform (null when not in defect mode)
 * @param defectMapping - Column mapping configuration (null when unconfigured)
 * @returns Props for DefectSummary component, or null if data is unavailable
 */
export function useDefectSummary(
  defectResult: DefectTransformResult | null,
  defectMapping: DefectMapping | null
): DefectSummaryProps | null {
  return useMemo(() => {
    if (!defectResult || defectResult.data.length === 0) return null;

    const rows = defectResult.data;
    const outcomeCol = defectResult.outcomeColumn;
    const totalDefects = rows.reduce((sum, r) => sum + (Number(r['DefectCount']) || 0), 0);
    const avgRate = rows.reduce((sum, r) => sum + (Number(r[outcomeCol]) || 0), 0) / rows.length;

    // Top defect type from DefectType column
    const defectTypeCol = defectMapping?.defectTypeColumn;
    let topDefectType: string | undefined;
    let topDefectPercent: number | undefined;
    let paretoCount80: number | undefined;
    let totalTypes: number | undefined;

    if (defectTypeCol) {
      const typeCounts = new Map<string, number>();
      for (const r of rows) {
        const dt = String(r[defectTypeCol] ?? '');
        const count = Number(r['DefectCount']) || 1;
        typeCounts.set(dt, (typeCounts.get(dt) ?? 0) + count);
      }
      const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
      totalTypes = sorted.length;
      if (sorted.length > 0) {
        topDefectType = sorted[0][0];
        topDefectPercent = totalDefects > 0 ? (sorted[0][1] / totalDefects) * 100 : 0;
      }
      // 80/20 rule
      let cumul = 0;
      let count80 = 0;
      for (const [, count] of sorted) {
        cumul += count;
        count80++;
        if (cumul >= totalDefects * 0.8) break;
      }
      paretoCount80 = count80;
    }

    return {
      totalDefects,
      defectRate: avgRate,
      rateLabel: defectMapping?.unitsProducedColumn ? 'unit' : 'period',
      topDefectType,
      topDefectPercent,
      paretoCount80,
      totalTypes,
    };
  }, [defectResult, defectMapping]);
}
