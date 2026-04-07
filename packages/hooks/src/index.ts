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

// Journal Entries (chronological investigation timeline)
export { useJournalEntries, type JournalEntry } from './useJournalEntries';

// Questions (investigation questions linked to findings)
export {
  useQuestions,
  MAX_QUESTION_DEPTH,
  MAX_CHILDREN_PER_PARENT,
  MAX_TOTAL_QUESTIONS,
  type ChildrenSummary,
  type UseQuestionsOptions,
  type UseQuestionsReturn,
} from './useQuestions';

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

// Probability Plot Data Hook
export { useProbabilityPlotData } from './useProbabilityPlotData';

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
  LeanProjectionFields,
} from './useProcessProjection';

// Async Stats Hook (Worker bridge)
export {
  useAsyncStats,
  type UseAsyncStatsOptions,
  type UseAsyncStatsResult,
} from './useAsyncStats';

// Hub Computations (shared evidence + projection memos)
export { useHubComputations, type UseHubComputationsReturn } from './useHubComputations';

// Improvement Projections (suspected-cause × projected-Cpk summaries)
export {
  useImprovementProjections,
  type UseImprovementProjectionsReturn,
  type SuspectedCauseProjection,
} from './useImprovementProjections';

// Scoped Models (model scoping for What-If Explorer)
export { useScopedModels, type UseScopedModelsReturn, type ModelScope } from './useScopedModels';

// What-If References (benchmark markers for What-If Explorer)
export {
  useWhatIfReferences,
  type WhatIfReference,
  type UseWhatIfReferencesOptions,
} from './useWhatIfReferences';

// CoScout props assembly (shared props for CoScoutPanelBase)
export {
  useCoScoutProps,
  type UseCoScoutPropsOptions,
  type UseCoScoutPropsReturn,
  type CoScoutAIOrchSlice,
  type CoScoutResizeConfig,
  type CoScoutActionProposalsSlice,
} from './useCoScoutProps';

// Question Generation (Factor Intelligence → questions pipeline)
export {
  useQuestionGeneration,
  type UseQuestionGenerationOptions,
  type UseQuestionGenerationReturn,
} from './useQuestionGeneration';

// Problem Statement (Watson's 3 questions auto-synthesis)
export {
  useProblemStatement,
  type UseProblemStatementOptions,
  type UseProblemStatementReturn,
  type LocationFactor,
} from './useProblemStatement';

// Suspected Cause Hubs (named mechanism groupings for investigation synthesis)
export {
  useSuspectedCauses,
  type UseSuspectedCausesOptions,
  type UseSuspectedCausesReturn,
} from './useSuspectedCauses';

// Question Reactivity (drill-down factor → active question lookup)
export { useQuestionReactivity } from './useQuestionReactivity';

// Visual Grounding (CoScout REF marker highlight lifecycle)
export {
  useVisualGrounding,
  resolveHighlightTarget,
  GLOW_DURATION_MS,
  SETTLED_DURATION_MS,
  type HighlightPhase,
  type HighlightAction,
} from './useVisualGrounding';

// Document Shelf (KB document management — Team tier + preview gate)
export {
  useDocumentShelf,
  type DocumentInfo,
  type UseDocumentShelfOptions,
  type UseDocumentShelfReturn,
} from './useDocumentShelf';

// HMW Prompts (How Might We prompt generation for brainstorm modal)
export { useHMWPrompts } from './useHMWPrompts';

// Brainstorm Session (collaborative HMW brainstorm — SSE client + lifecycle)
export { useBrainstormSession, type UseBrainstormSessionReturn } from './useBrainstormSession';

// Brainstorm Detect (poll for active sessions — Team plan auto-detect)
export { useBrainstormDetect, type UseBrainstormDetectReturn } from './useBrainstormDetect';

// Evidence Map Data (layered visualization computation)
export {
  useEvidenceMapData,
  type UseEvidenceMapDataOptions,
  type UseEvidenceMapDataReturn,
  type FactorNodeData,
  type RelationshipEdgeData,
  type OutcomeNodeData,
  type EquationData,
  type CausalEdgeData,
  type ConvergencePointData,
} from './useEvidenceMapData';

// Evidence Map Timeline (report view replay animation)
export {
  useEvidenceMapTimeline,
  type TimelineFrame,
  type UseEvidenceMapTimelineOptions,
  type UseEvidenceMapTimelineReturn,
} from './useEvidenceMapTimeline';

// Popout Channel (BroadcastChannel cross-window sync)
export {
  usePopoutChannel,
  writeHydrationData,
  type PopoutMessage,
  type UsePopoutChannelOptions,
  type UsePopoutChannelReturn,
} from './usePopoutChannel';

// Popout Message Contracts (typed messages for each popout window)
export {
  HYDRATION_KEYS,
  type FindingsSyncData,
  type FindingsSyncMessage,
  type FindingsActionMessage,
  type FindingsAction,
  type ImprovementSyncData,
  type ImprovementSyncMessage,
  type ImprovementActionMessage,
  type ImprovementAction,
  type EvidenceMapSyncData,
  type EvidenceMapSyncMessage,
  type FactorSelectedMessage,
  type WindowLifecycleMessage,
  type PopoutMessageType,
} from './popoutMessages';

// Derived hooks (store-first state access)
export { useFilteredData, type FilteredDataResult } from './useFilteredData';
export { useAnalysisStats, type AnalysisStatsResult } from './useAnalysisStats';
export { useStagedAnalysis, type StagedAnalysisResult } from './useStagedAnalysis';
export { usePerformanceAnalysis } from './usePerformanceAnalysis';
export { useYDomain, type YDomainResult } from './useYDomain';
export { useSpecsForMeasure } from './useSpecsForMeasure';
export { useProjectActions, type ProjectActionsResult } from './useProjectActions';
