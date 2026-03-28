import { useFocusedChartNav, type UseFocusedChartNavReturn } from '@variscout/hooks';

const CHART_ORDER = ['ichart', 'boxplot', 'pareto', 'histogram', 'probability-plot'] as const;
type FocusedChart = (typeof CHART_ORDER)[number];

export type UseFocusModeReturn = UseFocusedChartNavReturn<FocusedChart>;

export function useFocusMode(): UseFocusModeReturn {
  return useFocusedChartNav(CHART_ORDER);
}
