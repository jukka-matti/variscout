import { useFocusedChartNav, type UseFocusedChartNavReturn } from '@variscout/hooks';

export type FocusedChart = 'ichart' | 'boxplot';

const CHART_ORDER: readonly FocusedChart[] = ['ichart', 'boxplot'];

export type UsePerformanceFocusReturn = UseFocusedChartNavReturn<FocusedChart>;

export function usePerformanceFocus(): UsePerformanceFocusReturn {
  return useFocusedChartNav(CHART_ORDER);
}
