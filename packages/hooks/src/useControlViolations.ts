import { useMemo } from 'react';
import { calculateStats, getNelsonRule2ViolationPoints } from '@variscout/core';
import type { SpecLimits, DataRow } from '@variscout/core';

/**
 * Computes control and spec limit violations for DataPanel annotations.
 *
 * Returns a Map<rowIndex, string[]> with violation descriptions,
 * or undefined when insufficient data.
 */
export function useControlViolations(
  filteredData: DataRow[],
  outcome: string | null,
  specs: SpecLimits
): Map<number, string[]> | undefined {
  return useMemo(() => {
    if (!outcome || filteredData.length === 0) return undefined;

    const map = new Map<number, string[]>();

    const values = filteredData
      .map(row => {
        const val = row[outcome];
        return typeof val === 'number' ? val : parseFloat(String(val));
      })
      .filter(v => !isNaN(v));

    if (values.length === 0) return undefined;

    const stats = calculateStats(values);

    filteredData.forEach((row, index) => {
      const val = row[outcome];
      const numValue = typeof val === 'number' ? val : parseFloat(String(val));
      if (isNaN(numValue)) return;

      const violations: string[] = [];

      if (numValue > stats.ucl) {
        violations.push('Special Cause: Above UCL');
      } else if (numValue < stats.lcl) {
        violations.push('Special Cause: Below LCL');
      }

      if (specs.usl !== undefined && numValue > specs.usl) {
        violations.push('Above USL');
      }
      if (specs.lsl !== undefined && numValue < specs.lsl) {
        violations.push('Below LSL');
      }

      if (violations.length > 0) {
        map.set(index, violations);
      }
    });

    const nelsonViolations = getNelsonRule2ViolationPoints(values, stats.mean);
    nelsonViolations.forEach(index => {
      const existing = map.get(index) || [];
      if (!existing.some(v => v.includes('Nelson Rule 2'))) {
        existing.push('Special Cause: Nelson Rule 2 (9 consecutive points on same side of mean)');
        map.set(index, existing);
      }
    });

    return map;
  }, [filteredData, outcome, specs]);
}
