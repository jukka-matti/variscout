/**
 * React hook that wraps computeDefectRates() for reactive defect data aggregation.
 *
 * Re-aggregates automatically when filtered data or mapping changes.
 */

import { useMemo } from 'react';
import type { DataRow, AnalysisMode, DefectMapping } from '@variscout/core';
import type { DefectTransformResult } from '@variscout/core';
import { computeDefectRates } from '@variscout/core';

/**
 * Transform raw defect data into aggregated rates, reactively.
 *
 * @param filteredData - Current filtered data rows
 * @param defectMapping - Defect column mapping (null if not configured)
 * @param analysisMode - Current analysis mode
 * @returns Aggregated defect data, or null if not in defect mode
 */
export function useDefectTransform(
  filteredData: DataRow[],
  defectMapping: DefectMapping | null,
  analysisMode: AnalysisMode
): DefectTransformResult | null {
  return useMemo(() => {
    if (analysisMode !== 'defect' || !defectMapping) return null;
    return computeDefectRates(filteredData, defectMapping);
  }, [filteredData, defectMapping, analysisMode]);
}
