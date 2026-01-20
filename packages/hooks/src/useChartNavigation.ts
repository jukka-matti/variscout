import { useState, useCallback } from 'react';

/**
 * Default chart order for navigation
 */
export const DEFAULT_CHART_ORDER = ['ichart', 'boxplot', 'pareto'] as const;

export type ChartId = (typeof DEFAULT_CHART_ORDER)[number];

export interface UseChartNavigationOptions<T extends string = ChartId> {
  /** Initial focused chart (null = none focused) */
  initialFocus?: T | null;
  /** Order of charts for navigation */
  chartOrder?: readonly T[];
}

export interface UseChartNavigationReturn<T extends string = ChartId> {
  /** Currently focused chart (null = none) */
  focusedChart: T | null;
  /** Set the focused chart directly */
  setFocusedChart: (chart: T | null) => void;
  /** Navigate to the next chart in order */
  handleNextChart: () => void;
  /** Navigate to the previous chart in order */
  handlePrevChart: () => void;
  /** Exit focus mode (set focusedChart to null) */
  exitFocus: () => void;
}

/**
 * Hook for managing chart focus mode navigation.
 *
 * Provides carousel-style navigation between charts with next/prev/exit controls.
 * Useful for presentation and fullscreen chart modes.
 *
 * @param options - Configuration options
 * @returns Navigation state and handlers
 *
 * @example
 * ```tsx
 * const { focusedChart, handleNextChart, handlePrevChart, exitFocus } = useChartNavigation();
 *
 * // In focused view:
 * <button onClick={handlePrevChart}>←</button>
 * <button onClick={handleNextChart}>→</button>
 * <button onClick={exitFocus}>Exit</button>
 * ```
 */
export function useChartNavigation<T extends string = ChartId>(
  options: UseChartNavigationOptions<T> = {}
): UseChartNavigationReturn<T> {
  const { initialFocus = null, chartOrder = DEFAULT_CHART_ORDER as unknown as readonly T[] } =
    options;

  const [focusedChart, setFocusedChart] = useState<T | null>(initialFocus);

  const handleNextChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = chartOrder.indexOf(current);
      if (index === -1) return current;
      const nextIndex = (index + 1) % chartOrder.length;
      return chartOrder[nextIndex];
    });
  }, [chartOrder]);

  const handlePrevChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = chartOrder.indexOf(current);
      if (index === -1) return current;
      const prevIndex = (index - 1 + chartOrder.length) % chartOrder.length;
      return chartOrder[prevIndex];
    });
  }, [chartOrder]);

  const exitFocus = useCallback(() => {
    setFocusedChart(null);
  }, []);

  return {
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    exitFocus,
  };
}

export default useChartNavigation;
