/**
 * @variscout/hooks
 *
 * Shared React hooks for VariScout applications.
 * These hooks use context injection pattern for portability across apps.
 */

// Types - Context interfaces
export type {
  ChartScaleContext,
  ChartScaleResult,
  FilterNavigationContext,
  VariationTrackingContext,
  DataContextInterface,
} from './types';

// Types - Persistence (for shared DataContext)
export type {
  DisplayOptions,
  ChartTitles,
  ParetoMode,
  ParetoAggregation,
  AnalysisState,
  SavedProject,
  PersistenceAdapter,
  DebouncedFunction,
  DataQualityReport,
  ParetoRow,
  ScaleMode,
  HighlightColor,
  ChartAnnotation,
  ViewState,
} from './types';

// Data State Hook (shared DataContext logic)
export {
  useDataState,
  type UseDataStateOptions,
  type DataState,
  type DataActions,
} from './useDataState';

// Chart Scale
export { useChartScale } from './useChartScale';

// Responsive Chart Utilities
export {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
  useResponsiveTickCount,
  useResponsiveBreakpoints,
  type ChartMargins,
  type ChartFonts,
  type ChartType,
} from './useResponsiveChartMargins';

// Filter Navigation
export {
  useFilterNavigation,
  type UseFilterNavigationOptions,
  type UseFilterNavigationReturn,
} from './useFilterNavigation';

// Filter Utilities (pure functions for URL/history parsing)
export {
  buildFilterStackFromUrl,
  buildFilterStackFromState,
  type HistoryState,
} from './filterUtils';

// Variation Tracking
export {
  useVariationTracking,
  type VariationTrackingResult,
  type FilterChipData,
} from './useVariationTracking';

// Keyboard Navigation
export { useKeyboardNavigation, type KeyboardNavigationOptions } from './useKeyboardNavigation';

// Column Classification
export {
  useColumnClassification,
  type ColumnClassificationOptions,
  type ColumnClassification,
} from './useColumnClassification';

// Data Ingestion
export {
  useDataIngestion,
  type DataIngestionActions,
  type DataIngestionConfig,
  type UseDataIngestionOptions,
  type UseDataIngestionReturn,
} from './useDataIngestion';

// Drill Path (Investigation Mindmap)
export { useDrillPath, type DrillStep, type UseDrillPathReturn } from './useDrillPath';

// Mindmap State (Investigation Mindmap computation)
export {
  useMindmapState,
  type UseMindmapStateOptions,
  type UseMindmapStateReturn,
} from './useMindmapState';

// Tier (Azure Marketplace licensing)
export { useTier, type UseTierResult, type ChannelWarningMessage } from './useTier';

// Data Table Utilities
export {
  useDataTablePagination,
  type UseDataTablePaginationReturn,
} from './useDataTablePagination';

export { useHighlightFade, type UseHighlightFadeReturn } from './useHighlightFade';

export { useResizablePanel, type UseResizablePanelReturn } from './useResizablePanel';

// Chart Data Hooks (shared computation for app wrappers)
export { useBoxplotData } from './useBoxplotData';
export { useIChartData } from './useIChartData';

// Focused Chart Navigation
export { useFocusedChartNav, type UseFocusedChartNavReturn } from './useFocusedChartNav';

// Control Violations
export { useControlViolations } from './useControlViolations';

// Annotations (right-click context menu)
export { useAnnotations } from './useAnnotationMode';

// Chart Copy
export {
  useChartCopy,
  EXPORT_SIZES,
  type UseChartCopyOptions,
  type UseChartCopyReturn,
} from './useChartCopy';

// Theme State
export {
  useThemeState,
  CHART_FONT_SCALES,
  type ThemeMode,
  type ChartFontScale,
  type ThemeConfig,
  type UseThemeStateOptions,
  type UseThemeStateReturn,
} from './useThemeState';
