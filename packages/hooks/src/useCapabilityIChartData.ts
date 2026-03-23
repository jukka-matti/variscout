/**
 * useCapabilityIChartData - Transform raw data into dual-series I-Chart data
 * for subgroup capability analysis (Cp and Cpk per subgroup).
 *
 * Follows useYamazumiIChartData pattern: groups data, computes metric,
 * returns IChartDataPoint[] for the existing IChart component.
 */
import type {
  DataRow,
  IChartDataPoint,
  StatsResult,
  SubgroupConfig,
  SubgroupCapabilityResult,
} from '@variscout/core';
import {
  groupDataIntoSubgroups,
  calculateSubgroupCapability,
  calculateSeriesControlLimits,
} from '@variscout/core';

export interface UseCapabilityIChartDataOptions {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Outcome column name */
  outcome: string;
  /** Specification limits */
  specs: { usl?: number; lsl?: number };
  /** Subgroup configuration */
  subgroupConfig: SubgroupConfig;
  /** Cpk target threshold (undefined = not set) */
  cpkTarget?: number;
}

export interface UseCapabilityIChartDataResult {
  /** Cpk data points for I-Chart (primary series) */
  cpkData: IChartDataPoint[];
  /** Cp data points for I-Chart (secondary series) */
  cpData: IChartDataPoint[];
  /** Synthetic StatsResult for Cpk control limits */
  cpkStats: StatsResult | null;
  /** Synthetic StatsResult for Cp control limits */
  cpStats: StatsResult | null;
  /** Raw results for export/table */
  subgroupResults: SubgroupCapabilityResult[];
  /** Number of subgroups meeting cpkTarget (undefined if no target set) */
  subgroupsMeetingTarget?: number;
}

/**
 * Build a synthetic StatsResult from capability series control limits.
 * This allows IChartBase to render control limit lines using its existing stats prop.
 */
function buildSyntheticStats(
  limits: { mean: number; stdDev: number; ucl: number; lcl: number; n: number } | null
): StatsResult | null {
  if (!limits) return null;
  return {
    mean: limits.mean,
    median: limits.mean, // Approximate; not critical for control chart display
    stdDev: limits.stdDev,
    sigmaWithin: limits.stdDev,
    mrBar: 0,
    ucl: limits.ucl,
    lcl: limits.lcl,
    outOfSpecPercentage: 0,
  };
}

export function useCapabilityIChartData({
  filteredData,
  outcome,
  specs,
  subgroupConfig,
  cpkTarget,
}: UseCapabilityIChartDataOptions): UseCapabilityIChartDataResult {
  const empty: UseCapabilityIChartDataResult = {
    cpkData: [],
    cpData: [],
    cpkStats: null,
    cpStats: null,
    subgroupResults: [],
  };

  if (!outcome || filteredData.length === 0) return empty;
  if (specs.usl === undefined && specs.lsl === undefined) return empty;

  const subgroups = groupDataIntoSubgroups(filteredData, outcome, subgroupConfig);
  if (subgroups.length === 0) return empty;

  const results = calculateSubgroupCapability(subgroups, specs);

  // Build I-Chart data points
  const cpkData: IChartDataPoint[] = [];
  const cpData: IChartDataPoint[] = [];
  const cpkValues: number[] = [];
  const cpValues: number[] = [];

  for (const r of results) {
    if (r.cpk !== undefined) {
      cpkData.push({
        x: r.index,
        y: r.cpk,
        originalIndex: r.index,
        stage: r.label,
      });
      cpkValues.push(r.cpk);
    }

    if (r.cp !== undefined) {
      cpData.push({
        x: r.index,
        y: r.cp,
        originalIndex: r.index,
        stage: r.label,
      });
      cpValues.push(r.cp);
    }
  }

  const cpkLimits = calculateSeriesControlLimits(cpkValues);
  const cpLimits = calculateSeriesControlLimits(cpValues);

  // Count subgroups meeting target (when cpkTarget is set)
  const subgroupsMeetingTarget =
    cpkTarget !== undefined ? cpkValues.filter(v => v >= cpkTarget).length : undefined;

  return {
    cpkData,
    cpData,
    cpkStats: buildSyntheticStats(cpkLimits),
    cpStats: buildSyntheticStats(cpLimits),
    subgroupResults: results,
    subgroupsMeetingTarget,
  };
}
