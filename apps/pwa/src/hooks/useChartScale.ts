/**
 * Re-export useChartScale from @variscout/hooks
 * with PWA-specific context wrapper
 */
import { useChartScale as useChartScaleBase } from '@variscout/hooks';
import { useData } from '../context/DataContext';

export type { ChartScaleResult } from '@variscout/hooks';

/**
 * Hook for calculating optimal Y-axis scale for charts
 *
 * Automatically uses the PWA's DataContext.
 * For the context-injection version, use @variscout/hooks directly.
 */
export const useChartScale = () => {
  const { filteredData, outcome, specs, grades, axisSettings } = useData();

  return useChartScaleBase({
    filteredData,
    outcome,
    specs,
    grades,
    axisSettings,
  });
};
