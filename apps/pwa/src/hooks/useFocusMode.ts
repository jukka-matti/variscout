import { useState, useCallback, useEffect } from 'react';

const CHART_ORDER = ['ichart', 'boxplot', 'pareto'] as const;
type FocusedChart = (typeof CHART_ORDER)[number] | null;

export interface UseFocusModeReturn {
  focusedChart: FocusedChart;
  setFocusedChart: (chart: FocusedChart) => void;
  handleNextChart: () => void;
  handlePrevChart: () => void;
}

export function useFocusMode(): UseFocusModeReturn {
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
