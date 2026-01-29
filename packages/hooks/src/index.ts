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
} from './types';

// Data State Hook (shared DataContext logic)
export {
  useDataState,
  type UseDataStateOptions,
  type DataState,
  type DataActions,
} from './useDataState';

// Chart Scale
export { useChartScale, default as useChartScaleDefault } from './useChartScale';

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

// Variation Tracking
export {
  useVariationTracking,
  type VariationTrackingResult,
  type FilterChipData,
} from './useVariationTracking';

// Keyboard Navigation
export { useKeyboardNavigation, type KeyboardNavigationOptions } from './useKeyboardNavigation';

// Data Analysis Hooks
export { useAvailableOutcomes } from './useAvailableOutcomes';
export { useAvailableStageColumns, type StageColumnOptions } from './useAvailableStageColumns';

// Chart Navigation
export {
  useChartNavigation,
  DEFAULT_CHART_ORDER,
  type ChartId,
  type UseChartNavigationOptions,
  type UseChartNavigationReturn,
} from './useChartNavigation';

// Clipboard
export {
  useClipboardCopy,
  type UseClipboardCopyOptions,
  type UseClipboardCopyReturn,
} from './useClipboardCopy';

// Dashboard Props Types
export type {
  AnalysisView,
  HighlightIntensity,
  DashboardModeProps,
  DashboardEmbedProps,
  DashboardPerformanceProps,
  DashboardInteractionProps,
  DashboardSpecEditorProps,
  DashboardProps,
  AzureDashboardProps,
} from './types/dashboardProps';

// Column Classification
export {
  useColumnClassification,
  type ColumnClassificationOptions,
  type ColumnClassification,
} from './useColumnClassification';

// Regression State
export {
  useRegressionState,
  type RegressionMode,
  type UseRegressionStateOptions,
  type UseRegressionStateReturn,
} from './useRegressionState';

// Data Ingestion
export {
  useDataIngestion,
  type DataIngestionActions,
  type UseDataIngestionOptions,
  type UseDataIngestionReturn,
} from './useDataIngestion';
