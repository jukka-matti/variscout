import { useState, useCallback, useEffect } from 'react';

export interface UseFocusedChartNavReturn<T extends string> {
  focusedChart: T | null;
  setFocusedChart: (chart: T | null) => void;
  handleNextChart: () => void;
  handlePrevChart: () => void;
}

/**
 * Shared keyboard-navigable focused chart hook.
 *
 * Arrow keys cycle through the chart order, Escape exits focus mode.
 * Used by PWA (ichart/boxplot/pareto) and Azure (ichart/boxplot).
 */
export function useFocusedChartNav<T extends string>(
  chartOrder: readonly T[]
): UseFocusedChartNavReturn<T> {
  const [focusedChart, setFocusedChart] = useState<T | null>(null);

  const handleNextChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = chartOrder.indexOf(current);
      const nextIndex = (index + 1) % chartOrder.length;
      return chartOrder[nextIndex];
    });
  }, [chartOrder]);

  const handlePrevChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = chartOrder.indexOf(current);
      const prevIndex = (index - 1 + chartOrder.length) % chartOrder.length;
      return chartOrder[prevIndex];
    });
  }, [chartOrder]);

  useEffect(() => {
    if (!focusedChart) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusedChart(null);
      } else if (e.key === 'ArrowRight') {
        handleNextChart();
      } else if (e.key === 'ArrowLeft') {
        handlePrevChart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedChart, handleNextChart, handlePrevChart]);

  return { focusedChart, setFocusedChart, handleNextChart, handlePrevChart };
}
