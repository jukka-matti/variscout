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
export { useBoxplotData, STAGE_SEPARATOR } from './useBoxplotData';
export type { ViolinDataMap, UseBoxplotDataResult, StageInfo } from './useBoxplotData';
export { useBoxplotCategoryLimit } from './useBoxplotCategoryLimit';
export type {
  UseBoxplotCategoryLimitOptions,
  UseBoxplotCategoryLimitReturn,
} from './useBoxplotCategoryLimit';
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

// Locale State
export {
  useLocaleState,
  type UseLocaleStateOptions,
  type UseLocaleStateReturn,
} from './useLocaleState';

// Translation
export { useTranslation, type UseTranslationReturn } from './useTranslation';

// Theme State
export {
  useThemeState,
  DENSITY_CONFIG,
  type ThemeMode,
  type DensityPreset,
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

// Report Sections
export {
  useReportSections,
  type ReportSectionDescriptor,
  type ReportType,
  type ReportSectionId,
  type SectionStatus,
  type UseReportSectionsOptions,
  type UseReportSectionsReturn,
  type ReportWorkspace,
  type AudienceMode,
} from './useReportSections';

// Scroll Spy
export { useScrollSpy, type UseScrollSpyOptions, type UseScrollSpyReturn } from './useScrollSpy';

// Tooltip Positioning
export {
  useTooltipPosition,
  type TooltipDirection,
  type UseTooltipPositionOptions,
  type TooltipPositionResult,
} from './useTooltipPosition';

// Snapshot Data
export {
  useSnapshotData,
  type UseSnapshotDataOptions,
  type UseSnapshotDataReturn,
} from './useSnapshotData';

// Copy Utilities
export { copySectionAsHTML } from './copyUtils';

// Filter Handlers (Dashboard shared callbacks)
export {
  useFilterHandlers,
  type UseFilterHandlersOptions,
  type UseFilterHandlersReturn,
} from './useFilterHandlers';

// Create Factor Modal (Dashboard shared modal state)
export {
  useCreateFactorModal,
  type UseCreateFactorModalOptions,
  type UseCreateFactorModalReturn,
} from './useCreateFactorModal';

// Journey Phase (AI tool gating)
export { useJourneyPhase, detectEntryScenario } from './useJourneyPhase';

// Verification Charts (Report Step 5 staged evidence)
export {
  useVerificationCharts,
  type VerificationChartId,
  type VerificationChartOption,
  type UseVerificationChartsOptions,
  type UseVerificationChartsReturn,
} from './useVerificationCharts';

// Yamazumi Data Hooks
export { useYamazumiChartData, type UseYamazumiChartDataOptions } from './useYamazumiChartData';
export { useYamazumiIChartData, type UseYamazumiIChartDataOptions } from './useYamazumiIChartData';
export {
  useYamazumiParetoData,
  type UseYamazumiParetoDataOptions,
  type UseYamazumiParetoDataReturn,
} from './useYamazumiParetoData';

// Subgroup Capability Data Hooks
export {
  useCapabilityIChartData,
  type UseCapabilityIChartDataOptions,
  type UseCapabilityIChartDataResult,
} from './useCapabilityIChartData';
export {
  useCapabilityBoxplotData,
  type UseCapabilityBoxplotDataOptions,
} from './useCapabilityBoxplotData';

// Dashboard Insights (shared chart insight computation)
export {
  useDashboardInsights,
  type UseDashboardInsightsOptions,
  type UseDashboardInsightsReturn,
} from './useDashboardInsights';

// Process Projection (Phase 2 toolbar intelligence)
export {
  useProcessProjection,
  type UseProcessProjectionOptions,
  type UseProcessProjectionReturn,
} from './useProcessProjection';
export type {
  ProcessProjection,
  CenteringOpportunity,
  SpecSuggestion,
} from './useProcessProjection';

// Async Stats Hook (Worker bridge)
export {
  useAsyncStats,
  type UseAsyncStatsOptions,
  type UseAsyncStatsResult,
} from './useAsyncStats';
