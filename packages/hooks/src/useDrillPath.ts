import { useMemo } from 'react';
import {
  type FilterAction,
  type DataRow,
  getEtaSquared,
  calculateStats,
  applyFilters,
  filterStackToFilters,
  toNumericValue,
} from '@variscout/core';

/**
 * A single step in the drill-down investigation path
 */
export interface DrillStep {
  /** Factor/column name that was drilled */
  factor: string;
  /** The value(s) selected for this factor */
  values: (string | number)[];
  /** Display label for breadcrumb */
  label: string;
  /** Timestamp from the filter action */
  timestamp: number;
  /** η² of this factor at the point of drilling (0–1) */
  etaSquared: number;
  /** Running product of all η² values up to this step (0–1) */
  cumulativeEtaSquared: number;
  /** Mean of the outcome before this filter was applied */
  meanBefore: number;
  /** Mean of the outcome after this filter was applied */
  meanAfter: number;
  /** Cpk before this filter (undefined if no specs) */
  cpkBefore: number | undefined;
  /** Cpk after this filter (undefined if no specs) */
  cpkAfter: number | undefined;
  /** Row count before this filter */
  countBefore: number;
  /** Row count after this filter */
  countAfter: number;
}

export interface UseDrillPathReturn {
  /** Ordered list of drill steps */
  drillPath: DrillStep[];
  /** Cumulative variation percentage (0–100) or null if no drills */
  cumulativeVariationPct: number | null;
}

/**
 * Extract numeric outcome values from data rows
 */
function getOutcomeValues(data: DataRow[], outcome: string): number[] {
  const values: number[] = [];
  for (const row of data) {
    const num = toNumericValue(row[outcome]);
    if (num !== undefined) {
      values.push(num);
    }
  }
  return values;
}

/**
 * Hook that retrospectively computes drill path statistics
 *
 * Iterates the filterStack, progressively filtering rawData, computing
 * η², mean, and Cpk at each step. Recalculates only when filterStack
 * or rawData changes.
 *
 * @param rawData - Original unfiltered data
 * @param filterStack - Current filter navigation stack
 * @param outcome - The outcome/measurement column name
 * @param specs - Optional specification limits for Cpk calculation
 */
export function useDrillPath(
  rawData: DataRow[],
  filterStack: FilterAction[],
  outcome: string | null,
  specs?: { usl?: number; lsl?: number }
): UseDrillPathReturn {
  return useMemo(() => {
    if (!outcome || rawData.length < 2 || filterStack.length === 0) {
      return { drillPath: [], cumulativeVariationPct: null };
    }

    const drillPath: DrillStep[] = [];
    let currentData = rawData;
    let cumulativeEtaSquared = 1;

    // Only process filter-type actions that have a factor
    const filterActions = filterStack.filter(
      (a): a is FilterAction & { factor: string } => a.type === 'filter' && a.factor !== undefined
    );

    for (const action of filterActions) {
      const factor = action.factor;

      // Skip if not enough data to compute stats
      if (currentData.length < 2) break;

      // Compute η² for this factor at current data level
      const etaSquared = getEtaSquared(currentData, factor, outcome);

      // Stats before applying this filter
      const valuesBefore = getOutcomeValues(currentData, outcome);
      const statsBefore =
        valuesBefore.length > 0 ? calculateStats(valuesBefore, specs?.usl, specs?.lsl) : null;

      // Apply this filter
      const stepFilters = { [factor]: action.values };
      const nextData = applyFilters(currentData, stepFilters);

      // Stats after applying this filter
      const valuesAfter = getOutcomeValues(nextData, outcome);
      const statsAfter =
        valuesAfter.length > 0 ? calculateStats(valuesAfter, specs?.usl, specs?.lsl) : null;

      // Update cumulative η²
      cumulativeEtaSquared *= etaSquared;

      drillPath.push({
        factor,
        values: action.values,
        label: action.label,
        timestamp: action.timestamp,
        etaSquared,
        cumulativeEtaSquared,
        meanBefore: statsBefore?.mean ?? 0,
        meanAfter: statsAfter?.mean ?? 0,
        cpkBefore: statsBefore?.cpk,
        cpkAfter: statsAfter?.cpk,
        countBefore: currentData.length,
        countAfter: nextData.length,
      });

      currentData = nextData;
    }

    const cumulativeVariationPct =
      drillPath.length > 0 ? drillPath[drillPath.length - 1].cumulativeEtaSquared * 100 : null;

    return { drillPath, cumulativeVariationPct };
  }, [rawData, filterStack, outcome, specs]);
}

export default useDrillPath;
