/**
 * useCapabilityBoxplotData - Transform subgroup capability results into
 * boxplot-compatible data grouped by factor.
 *
 * Shows Cpk (or Cp) distribution per factor level on the boxplot.
 */
import type { DataRow, SubgroupConfig, BoxplotGroupData } from '@variscout/core';
import {
  groupDataIntoSubgroups,
  calculateSubgroupCapability,
  calculateBoxplotStats,
} from '@variscout/core';

export interface UseCapabilityBoxplotDataOptions {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Outcome column name */
  outcome: string;
  /** Specification limits */
  specs: { usl?: number; lsl?: number };
  /** Subgroup configuration */
  subgroupConfig: SubgroupConfig;
  /** Factor column for grouping (optional) */
  factor?: string;
  /** Which metric to show: 'cp' or 'cpk' */
  metric: 'cp' | 'cpk';
}

export function useCapabilityBoxplotData({
  filteredData,
  outcome,
  specs,
  subgroupConfig,
  factor,
  metric,
}: UseCapabilityBoxplotDataOptions): BoxplotGroupData[] {
  if (!outcome || filteredData.length === 0) return [];
  if (specs.usl === undefined && specs.lsl === undefined) return [];

  const subgroups = groupDataIntoSubgroups(filteredData, outcome, subgroupConfig);
  if (subgroups.length === 0) return [];

  const results = calculateSubgroupCapability(subgroups, specs);

  // Extract valid metric values with their subgroup data
  const entries = results
    .map((r, idx) => ({ value: r[metric], subgroup: subgroups[idx] }))
    .filter(
      (e): e is { value: number; subgroup: (typeof subgroups)[0] } => e.value !== undefined
    );

  if (entries.length === 0) return [];

  if (!factor) {
    // No factor: single group with all capability values
    const values = entries.map(e => e.value);
    const groupLabel = metric === 'cpk' ? 'Cpk' : 'Cp';
    return [calculateBoxplotStats({ group: groupLabel, values })];
  }

  // Group capability values by factor
  // For each subgroup, determine its factor value from the subgroup's rows
  const factorGroups = new Map<string, number[]>();

  for (const entry of entries) {
    // Determine factor value: most common value in subgroup's rows
    const factorValue = getMostCommonFactorValue(entry.subgroup.rows, factor);
    if (!factorValue) continue;

    let group = factorGroups.get(factorValue);
    if (!group) {
      group = [];
      factorGroups.set(factorValue, group);
    }
    group.push(entry.value);
  }

  // Convert to BoxplotGroupData via calculateBoxplotStats (one per group)
  return Array.from(factorGroups.entries()).map(([name, values]) =>
    calculateBoxplotStats({ group: name, values })
  );
}

/**
 * Get the most common factor value from a set of rows.
 * Used to assign a subgroup to a factor level.
 */
function getMostCommonFactorValue(rows: DataRow[], factor: string): string | null {
  if (rows.length === 0) return null;

  const counts = new Map<string, number>();
  for (const row of rows) {
    const val = String(row[factor] ?? '');
    if (!val) continue;
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }

  let maxCount = 0;
  let maxVal: string | null = null;
  for (const [val, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxVal = val;
    }
  }
  return maxVal;
}
