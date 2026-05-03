import type { FindingContext, FindingSource, DataRow, SpecLimits } from '@variscout/core';
import { calculateStats } from '@variscout/core';
import { useSessionStore } from '@variscout/stores';
import type { DrillStep } from './useDrillPath';

/**
 * Builds a FindingContext from current filter/data state.
 * Shared by handlePinFinding and handleAddChartObservation in both PWA and Azure.
 */
export function buildFindingContext(
  filters: Record<string, (string | number)[]>,
  filteredData: DataRow[],
  outcome: string,
  specs: SpecLimits | undefined,
  drillPath: DrillStep[]
): FindingContext {
  const values = filteredData.map(r => Number(r[outcome])).filter(v => !isNaN(v));
  let stats: FindingContext['stats'];

  if (values.length > 0) {
    const computed = calculateStats(values, specs?.usl, specs?.lsl);
    stats = {
      mean: computed.mean,
      median: computed.median,
      samples: values.length,
      cpk: computed.cpk,
    };
  }

  return {
    activeFilters: { ...filters },
    cumulativeScope:
      drillPath.length > 0 ? drillPath[drillPath.length - 1].cumulativeScope * 100 : null,
    stats,
  };
}

/**
 * Builds a FindingSource from chart context menu parameters.
 *
 * Snapshots the current `timeLens` from `useSessionStore.getState()` at the
 * moment of recording so the lens can be restored on replay — even if the
 * user changes the lens before revisiting this finding.
 */
export function buildFindingSource(
  chartType: 'boxplot' | 'pareto' | 'ichart',
  categoryKey?: string,
  anchorX?: number,
  anchorY?: number
): FindingSource {
  const timeLens = useSessionStore.getState().timeLens;
  if (chartType === 'ichart') {
    return { chart: 'ichart', anchorX: anchorX ?? 0, anchorY: anchorY ?? 0, timeLens };
  }
  return { chart: chartType, category: categoryKey ?? '', timeLens };
}
