/**
 * Hooks barrel export for Azure app
 */

export { useDrillDown, type UseDrillDownReturn } from './useDrillDown';
export { useChartScale } from './useChartScale';
export { useDataIngestion } from './useDataIngestion';
export { useVariationTracking, type VariationTrackingResult } from './useVariationTracking';
export {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
  useResponsiveTickCount,
  useResponsiveBreakpoints,
  type ChartMargins,
  type ChartFonts,
  type ChartType,
} from './useResponsiveChartMargins';
