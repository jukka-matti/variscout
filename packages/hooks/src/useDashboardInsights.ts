/**
 * Shared hook to compute chart insight chips for both PWA and Azure dashboards.
 *
 * Encapsulates the four useChartInsights calls (ichart, boxplot, pareto, stats),
 * the handleCpkClick callback, and the isCapabilityMode derivation that were
 * previously duplicated across both Dashboard components.
 */

import { useCallback, useMemo } from 'react';
import {
  getNelsonRule2Sequences,
  getNelsonRule3Sequences,
  getNextDrillFactor,
} from '@variscout/core';
import type { StatsResult, SpecLimits, AIContext, DataRow, SubgroupConfig } from '@variscout/core';
import { useChartInsights, type UseChartInsightsReturn } from './useChartInsights';
import {
  useCapabilityIChartData,
  type UseCapabilityIChartDataResult,
} from './useCapabilityIChartData';
import type { DisplayOptions } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseDashboardInsightsOptions {
  /** Current stats result */
  stats: StatsResult | null;
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Active outcome column name */
  outcome: string | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Cpk target threshold */
  cpkTarget: number | undefined;
  /** Factor η² map (factor name -> η² percentage 0-100) */
  factorVariations: Map<string, number>;
  /** Currently selected boxplot factor */
  boxplotFactor: string;
  /** Currently selected Pareto factor */
  paretoFactor: string;
  /** Display options (for capability mode detection) */
  displayOptions: DisplayOptions;
  /** Setter for display options (for handleCpkClick) */
  setDisplayOptions: (options: DisplayOptions) => void;
  /** Subgroup configuration for capability I-Chart */
  subgroupConfig: SubgroupConfig;
  /** Whether AI is enabled (false for PWA) */
  aiEnabled?: boolean;
  /** AI context (null for PWA) */
  aiContext?: AIContext | null;
  /** AI fetch function (undefined for PWA) */
  fetchChartInsight?: (userPrompt: string) => Promise<string>;
}

export interface UseDashboardInsightsReturn {
  /** I-Chart insight chip data */
  ichartInsight: UseChartInsightsReturn;
  /** Boxplot insight chip data */
  boxplotInsight: UseChartInsightsReturn;
  /** Pareto insight chip data */
  paretoInsight: UseChartInsightsReturn;
  /** Stats panel insight chip data */
  statsInsight: UseChartInsightsReturn;
  /** Callback to activate capability mode on I-Chart */
  handleCpkClick: (() => void) | undefined;
  /** Whether I-Chart is in capability mode */
  isCapabilityMode: boolean;
  /** Capability data for stats panel target count */
  capabilityData: UseCapabilityIChartDataResult;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboardInsights({
  stats,
  filteredData,
  outcome,
  specs,
  cpkTarget,
  factorVariations,
  boxplotFactor,
  paretoFactor,
  displayOptions,
  setDisplayOptions,
  subgroupConfig,
  aiEnabled = false,
  aiContext,
  fetchChartInsight,
}: UseDashboardInsightsOptions): UseDashboardInsightsReturn {
  // Capability mode detection
  const isCapabilityMode = displayOptions.standardIChartMetric === 'capability';

  const capabilityData = useCapabilityIChartData({
    filteredData,
    outcome: outcome ?? '',
    specs,
    subgroupConfig,
    cpkTarget,
    enabled: isCapabilityMode,
  });

  const handleCpkClick = useCallback(() => {
    setDisplayOptions({ ...displayOptions, standardIChartMetric: 'capability' });
  }, [displayOptions, setDisplayOptions]);

  // --- I-Chart insight ---
  const ichartInsight = useChartInsights({
    chartType: 'ichart',
    aiEnabled,
    aiContext: aiContext ?? null,
    fetchInsight: fetchChartInsight,
    deterministicData: useMemo(() => {
      if (!stats || !filteredData.length || !outcome) return {};
      const values = filteredData
        .map(r => {
          const v = r[outcome];
          return typeof v === 'number' ? v : parseFloat(String(v));
        })
        .filter(v => !isNaN(v));
      const sequences = getNelsonRule2Sequences(values, stats.mean);
      const rule3Sequences = getNelsonRule3Sequences(values);
      const ooc = values.filter(v => v > stats.ucl || v < stats.lcl).length;
      return {
        nelsonSequences: sequences,
        nelsonRule3Sequences: rule3Sequences,
        outOfControlCount: ooc,
        totalPoints: values.length,
      };
    }, [filteredData, outcome, stats]),
  });

  // --- Boxplot insight ---
  const boxplotInsight = useChartInsights({
    chartType: 'boxplot',
    aiEnabled,
    aiContext: aiContext ?? null,
    fetchInsight: fetchChartInsight,
    deterministicData: useMemo(
      () => ({
        factorVariations,
        currentFactor: boxplotFactor,
        nextDrillFactor: getNextDrillFactor(factorVariations, boxplotFactor),
      }),
      [factorVariations, boxplotFactor]
    ),
  });

  // --- Pareto insight ---
  // Note: per-category contribution data was removed with Total SS metric.
  // Pareto deterministic insights are currently AI-only; no per-category η² available.
  const paretoInsight = useChartInsights({
    chartType: 'pareto',
    aiEnabled,
    aiContext: aiContext ?? null,
    fetchInsight: fetchChartInsight,
    deterministicData: useMemo(
      () => ({
        categoryContributions: undefined,
        categoryCount: 0,
        paretoFactor,
      }),
      [paretoFactor]
    ),
  });

  // --- Stats insight ---
  const statsInsight = useChartInsights({
    chartType: 'stats',
    aiEnabled,
    aiContext: aiContext ?? null,
    fetchInsight: fetchChartInsight,
    deterministicData: useMemo(
      () => ({
        cpk: stats?.cpk,
        cp: stats?.cp,
        cpkTarget,
        passRate: stats ? 100 - stats.outOfSpecPercentage : undefined,
        hasSpecs: !!(specs?.usl !== undefined || specs?.lsl !== undefined),
      }),
      [stats, specs, cpkTarget]
    ),
  });

  return {
    ichartInsight,
    boxplotInsight,
    paretoInsight,
    statsInsight,
    handleCpkClick: !isCapabilityMode ? handleCpkClick : undefined,
    isCapabilityMode,
    capabilityData,
  };
}
