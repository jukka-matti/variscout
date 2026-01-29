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
  useVariationTracking,
  type VariationTrackingResult,
  type FilterChipData,
} from './useVariationTracking';
export {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
  useResponsiveTickCount,
  useResponsiveBreakpoints,
  type ChartMargins,
  type ChartFonts,
  type ChartType,
} from './useResponsiveChartMargins';
