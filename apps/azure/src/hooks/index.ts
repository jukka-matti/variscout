/**
 * Hooks barrel export for Azure app
 */

// Filter Navigation
export {
  useFilterNavigation,
  type UseFilterNavigationOptions,
  type UseFilterNavigationReturn,
} from './useFilterNavigation';

export { useChartScale } from './useChartScale';
export { useDataIngestion } from './useDataIngestion';

export {
  usePerformanceFocus,
  type FocusedChart as PerformanceFocusedChart,
  type UsePerformanceFocusReturn,
} from './usePerformanceFocus';

export { useDrillConfirmation, type UseDrillConfirmationReturn } from './useDrillConfirmation';

export { useControlViolations } from '@variscout/hooks';
export { useDataMerge } from './useDataMerge';
export { useEditorAI, type UseEditorAIOptions, type UseEditorAIReturn } from './useEditorAI';
export {
  useFindingsOrchestration,
  type UseFindingsOrchestrationReturn,
} from './useFindingsOrchestration';

export {
  useDashboardCharts,
  type UseDashboardChartsProps,
  type UseDashboardChartsResult,
  type FocusedChart,
} from './useDashboardCharts';

// Re-exported directly from @variscout/hooks (no Azure wrapper needed)
export {
  useVariationTracking,
  type VariationTrackingResult,
  type FilterChipData,
  useResponsiveChartMargins,
  useResponsiveChartFonts,
  useResponsiveTickCount,
  useResponsiveBreakpoints,
  type ChartMargins,
  type ChartFonts,
  type ChartType,
} from '@variscout/hooks';
