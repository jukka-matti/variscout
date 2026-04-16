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
  trendDirection?: 'up' | 'stable' | 'down';
}

/**
 * Compute trend direction using split-half comparison.
 *
 * Splits the rate values into first and second halves and compares averages.
 * Requires at least 4 data points; returns undefined otherwise.
 *
 * @internal Exported for testing — prefer useDefectSummary for app code.
 */
export function computeTrendDirection(rates: number[]): 'up' | 'stable' | 'down' | undefined {
  if (rates.length < 4) return undefined;

  const mid = Math.floor(rates.length / 2);
  const firstHalf = rates.slice(0, mid);
  const secondHalf = rates.slice(mid);

  const avg = (arr: number[]): number => arr.reduce((sum, v) => sum + v, 0) / arr.length;

  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);

  if (secondAvg > firstAvg * 1.1) return 'up';
  if (secondAvg < firstAvg * 0.9) return 'down';
  return 'stable';
}

/**
 * Pure computation for DefectSummary props.
 *
 * @internal Exported for testing — prefer useDefectSummary for app code.
 */
export function computeDefectSummaryProps(
  defectResult: DefectTransformResult | null,
  defectMapping: DefectMapping | null
): DefectSummaryProps | null {
  if (!defectResult || defectResult.data.length === 0) return null;

  const rows = defectResult.data;
  const outcomeCol = defectResult.outcomeColumn;
  const countCol = 'DefectCount'; // always produced by computeDefectRates() for all data shapes
  const totalDefects = rows.reduce((sum, r) => sum + (Number(r[countCol]) || 0), 0);
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
      const count = Number(r[countCol]) || 1;
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

  // Trend direction via split-half comparison
  const rates = rows.map(r => Number(r[outcomeCol])).filter(Number.isFinite);
  const trendDirection = computeTrendDirection(rates);

  return {
    totalDefects,
    defectRate: avgRate,
    rateLabel: defectMapping?.unitsProducedColumn ? 'unit' : 'period',
    topDefectType,
    topDefectPercent,
    paretoCount80,
    totalTypes,
    trendDirection,
  };
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
  return useMemo(
    () => computeDefectSummaryProps(defectResult, defectMapping),
    [defectResult, defectMapping]
  );
}
