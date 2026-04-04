/**
 * Re-export useChartScale from @variscout/hooks
 * with Azure-specific store-backed wrapper
 */
import { useChartScale as useChartScaleBase, useFilteredData } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

export type { ChartScaleResult } from '@variscout/hooks';

/**
 * Hook for calculating optimal Y-axis scale for charts
 *
 * Reads from Zustand stores instead of DataContext.
 * For the context-injection version, use @variscout/hooks directly.
 */
export const useChartScale = () => {
  const { filteredData } = useFilteredData();
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const axisSettings = useProjectStore(s => s.axisSettings);

  return useChartScaleBase({
    filteredData,
    outcome,
    specs,
    axisSettings,
  });
};
