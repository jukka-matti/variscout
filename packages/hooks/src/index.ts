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

// Drill Path
export { useDrillPath, type DrillStep, type UseDrillPathReturn } from './useDrillPath';

// Finding Creation Utilities
export { buildFindingContext, buildFindingSource } from './findingCreation';

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
export type { ViolinDataMap, UseBoxplotDataResult } from './useBoxplotData';
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

// Findings (scouting report)
export { useFindings, type UseFindingsOptions, type UseFindingsReturn } from './useFindings';

// Hypotheses (causal theories linked to findings)
export {
  useHypotheses,
  MAX_HYPOTHESIS_DEPTH,
  MAX_CHILDREN_PER_PARENT,
  MAX_TOTAL_HYPOTHESES,
  type ChildrenSummary,
  type UseHypothesesOptions,
  type UseHypothesesReturn,
} from './useHypotheses';

// Chart Wrapper Data Hooks (shared computation for app chart wrappers)
export {
  useBoxplotWrapperData,
  type UseBoxplotWrapperDataOptions,
  type UseBoxplotWrapperDataResult,
} from './useBoxplotWrapperData';

export {
  useIChartWrapperData,
  type UseIChartWrapperDataOptions,
  type UseIChartWrapperDataResult,
} from './useIChartWrapperData';

export {
  useParetoChartData,
  type UseParetoChartDataOptions,
  type UseParetoChartDataResult,
} from './useParetoChartData';

export {
  useDashboardComputedData,
  type UseDashboardComputedDataOptions,
  type UseDashboardComputedDataResult,
} from './useDashboardComputedData';

// Dashboard Charts Base (shared composition hook)
export {
  useDashboardChartsBase,
  type UseDashboardChartsBaseOptions,
  type UseDashboardChartsBaseResult,
} from './useDashboardChartsBase';

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

// AI Context
export { useAIContext, type UseAIContextOptions, type UseAIContextReturn } from './useAIContext';

// Narration
export {
  useNarration,
  type UseNarrationOptions,
  type UseNarrationReturn,
  type NarrationStatus,
} from './useNarration';

// Chart Insights
export {
  useChartInsights,
  type UseChartInsightsOptions,
  type UseChartInsightsReturn,
  type DeterministicData,
} from './useChartInsights';

// AI CoScout
export { useAICoScout, type UseAICoScoutOptions, type UseAICoScoutReturn } from './useAICoScout';

// Knowledge Search
export {
  useKnowledgeSearch,
  type KnowledgeResult,
  type DocumentResult,
  type UseKnowledgeSearchOptions,
  type UseKnowledgeSearchReturn,
} from './useKnowledgeSearch';
