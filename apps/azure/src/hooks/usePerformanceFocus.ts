import { useState, useCallback, useEffect } from 'react';

export type FocusedChart = 'ichart' | 'boxplot' | null;

const CHART_ORDER: FocusedChart[] = ['ichart', 'boxplot'];

export interface UsePerformanceFocusReturn {
  focusedChart: FocusedChart;
  setFocusedChart: (chart: FocusedChart) => void;
  handleNextChart: () => void;
  handlePrevChart: () => void;
}

export function usePerformanceFocus(): UsePerformanceFocusReturn {
  const [focusedChart, setFocusedChart] = useState<FocusedChart>(null);

  const handleNextChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = CHART_ORDER.indexOf(current);
      const nextIndex = (index + 1) % CHART_ORDER.length;
      return CHART_ORDER[nextIndex];
    });
  }, []);

  const handlePrevChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = CHART_ORDER.indexOf(current);
      const prevIndex = (index - 1 + CHART_ORDER.length) % CHART_ORDER.length;
      return CHART_ORDER[prevIndex];
    });
  }, []);

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
