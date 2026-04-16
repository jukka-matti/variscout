// Components
export { HelpTooltip, type HelpTooltipProps, type TooltipPosition } from './components/HelpTooltip';
export { ChartCard, type ChartCardProps, type ChartId } from './components/ChartCard';
export {
  MeasureColumnSelector,
  type MeasureColumnSelectorProps,
} from './components/MeasureColumnSelector';
export {
  PerformanceDetectedModal,
  type PerformanceDetectedModalProps,
} from './components/PerformanceDetectedModal';
export {
  CapabilitySuggestionModal,
  type CapabilitySuggestionModalProps,
} from './components/CapabilitySuggestionModal';
export { CausalLinkCreator, type CausalLinkCreatorProps } from './components/CausalLinkCreator';
export { DataQualityBanner, type DataQualityBannerProps } from './components/DataQualityBanner';
export {
  ColumnMapping,
  type ColumnMappingProps,
  type AnalysisBrief,
} from './components/ColumnMapping';
export { SelectionPanel, type SelectionPanelProps } from './components/SelectionPanel';
export { CreateFactorModal, type CreateFactorModalProps } from './components/CreateFactorModal';
export { UpgradePrompt, type UpgradePromptProps } from './components/UpgradePrompt';
export { AnovaResults, type AnovaResultsProps } from './components/AnovaResults';
export {
  YAxisPopover,
  yAxisPopoverDefaultColorScheme,
  type YAxisPopoverProps,
  type YAxisPopoverColorScheme,
} from './components/YAxisPopover';
export {
  PerformanceSetupPanelBase,
  performanceSetupPanelDefaultColorScheme,
  performanceSetupPanelPwaColorScheme,
  type PerformanceSetupPanelBaseProps,
  type PerformanceSetupPanelColorScheme,
  type PerformanceSetupPanelTierProps,
  type ChannelValidation,
} from './components/PerformanceSetupPanel';
export type { FilterChipData } from './components/filterTypes';
export {
  FilterChipDropdown,
  filterChipDropdownDefaultColorScheme,
  type FilterChipDropdownProps,
  type FilterChipDropdownColorScheme,
} from './components/FilterChipDropdown';
export {
  FilterBreadcrumb,
  filterBreadcrumbDefaultColorScheme,
  type FilterBreadcrumbProps,
  type FilterBreadcrumbColorScheme,
} from './components/FilterBreadcrumb';
export {
  Slider,
  sliderDefaultColorScheme,
  type SliderColorScheme,
  type SliderProps,
} from './components/Slider';

export {
  LeanDistributionPreview,
  type LeanDistributionPreviewProps,
  type LeanActivity,
} from './components/WhatIfSimulator';

// What-If Explorer (unified)
export {
  WhatIfExplorer,
  WhatIfExplorerPage,
  BasicEstimator,
  ModelInformedEstimator,
  ActivityReducer,
  ChannelAdjuster,
  computePresets,
  whatIfSimulatorDefaultColorScheme,
} from './components/WhatIfExplorer';
export type {
  WhatIfExplorerProps,
  WhatIfExplorerPageProps,
  WhatIfExplorerReferenceContext,
  WhatIfSimulatorColorScheme,
  ModelScope,
  WhatIfReference,
  WhatIfProcessStats,
  WhatIfProjectionContext,
  WhatIfComplementStats,
  SimulatorPreset as WhatIfSimulatorPreset,
  ModelInformedEstimatorProps,
  BasicEstimatorProps,
  ActivityReducerProps,
  ChannelAdjusterProps,
} from './components/WhatIfExplorer';

export { ErrorBoundary, type ErrorBoundaryProps } from './components/ErrorBoundary';
export {
  AxisEditor,
  axisEditorDefaultColorScheme,
  type AxisEditorProps,
  type AxisEditorColorScheme,
} from './components/AxisEditor';
export {
  FactorSelector,
  factorSelectorDefaultColorScheme,
  type FactorSelectorProps,
  type FactorSelectorColorScheme,
} from './components/FactorSelector';

export {
  FindingsWindow,
  openFindingsPopout,
  updateFindingsPopout,
  InvestigationSidebar,
  type InvestigationSidebarProps,
  QuestionChecklist,
  type QuestionChecklistProps,
  InvestigationConclusion,
  type InvestigationConclusionProps,
} from './components/FindingsWindow';

export {
  PIPanelBase,
  TargetDiscoveryCard,
  StagedComparisonCard,
  defaultStagedComparisonColorScheme,
  FactorIntelligencePanel,
  QuestionsTabView,
  QuestionsTabContent,
  QuestionRow,
  ConclusionCard,
  EquationDisplay,
  formatEquation,
  StatsTabContent,
  JournalTabView,
  JournalEntryRow,
  type PIPanelBaseProps,
  type PITab,
  type ComplementInsight,
  type TargetDiscoveryCardProps,
  type StagedComparisonCardProps,
  type StagedComparisonColorScheme,
  type FactorIntelligencePanelProps,
  type EquationDisplayProps,
  type StatsTabContentProps,
  type QuestionsTabViewProps,
  type QuestionsTabContentProps,
  JournalTabContent,
  type JournalTabContentProps,
  type QuestionRowProps,
  type ConclusionCardProps,
  type SuspectedCause,
  QuestionInputModal,
  type QuestionInputModalProps,
  QuestionLinkModal,
  type QuestionLinkModalProps,
  type JournalTabViewProps,
  type JournalEntryRowProps,
  type PIOverflowView,
  type PITabConfig,
  type PIOverflowItem,
} from './components/ProcessIntelligencePanel';

export {
  ManualEntryBase,
  ManualEntrySetupBase,
  type ManualEntryBaseProps,
  type ManualEntryConfig,
  type ManualEntrySetupBaseProps,
} from './components/ManualEntry';

export {
  SpecsPopover,
  specsPopoverDefaultColorScheme,
  type SpecsPopoverProps,
  type SpecsPopoverColorScheme,
} from './components/SpecsPopover';

export {
  SpecEditor,
  specEditorDefaultColorScheme,
  type SpecEditorProps,
  type SpecEditorColorScheme,
} from './components/SpecEditor';

export {
  default as CharacteristicTypeSelector,
  type CharacteristicTypeSelectorProps,
} from './components/CharacteristicTypeSelector';

export {
  CapabilityHistogram,
  type CapabilityHistogramProps,
} from './components/CapabilityHistogram';

export { ProbabilityPlot, type ProbabilityPlotProps } from './components/ProbabilityPlot';
export {
  ProbabilityPlotTooltip,
  type ProbabilityPlotTooltipProps,
} from './components/ProbabilityPlotTooltip';

export { VerificationCard, type VerificationCardProps } from './components/VerificationCard';

export { FilterContextBar, type FilterContextBarProps } from './components/FilterContextBar';

export {
  BoxplotDisplayToggle,
  boxplotDisplayToggleDefaultColorScheme,
  type BoxplotDisplayToggleProps,
  type BoxplotDisplayToggleColorScheme,
} from './components/BoxplotDisplayToggle';

export {
  ChartAnnotationLayer,
  type ChartAnnotationLayerProps,
  type HighlightColor as UIHighlightColor,
} from './components/ChartAnnotationLayer';

export {
  AnnotationContextMenu,
  type AnnotationContextMenuProps,
} from './components/AnnotationContextMenu';

export {
  DataTableBase,
  type DataTableBaseProps,
  DataTableModalBase,
  type DataTableModalBaseProps,
} from './components/DataTable';

export {
  ChartDownloadMenu,
  chartDownloadMenuDefaultColorScheme,
  type ChartDownloadMenuProps,
  type ChartDownloadMenuColorScheme,
} from './components/ChartExportMenu';

export {
  InvestigationPrompt,
  investigationPromptDefaultColorScheme,
  type InvestigationPromptProps,
  type InvestigationPromptColorScheme,
} from './components/InvestigationPrompt';

export {
  FindingsLog,
  FindingCard,
  FindingEditor,
  FindingStatusBadge,
  FindingComments,
  FindingBoardView,
  FindingsExportMenu,
  QuestionTreeView,
  QuestionNode,
  copyFindingsToClipboard,
  formatFindingsText,
  type FindingsLogProps,
  type FindingCardProps,
  type FindingEditorProps,
  type FindingStatusBadgeProps,
  type FindingCommentsProps,
  type FindingBoardViewProps,
  type FindingsExportMenuProps,
  type QuestionTreeViewProps,
  type QuestionNodeProps,
} from './components/FindingsLog';

export {
  QuestionLinkPrompt,
  type QuestionLinkPromptProps,
} from './components/FindingsLog/QuestionLinkPrompt';

export {
  default as PasteScreenBase,
  pasteScreenDefaultColorScheme,
  type PasteScreenBaseProps,
  type PasteScreenColorScheme,
} from './components/PasteScreen';

// Dashboard building blocks
export {
  FocusedViewOverlay,
  FocusedChartCard,
  DashboardChartCard,
  DashboardGrid,
  DashboardLayoutBase,
  type FocusedViewOverlayProps,
  type FocusedChartCardProps,
  type DashboardChartCardProps,
  type DashboardGridProps,
  type DashboardLayoutBaseProps,
  type DashboardAnnotations,
  type DashboardChartFindings,
} from './components/DashboardBase';

// Findings callback types (shared by PWA and Azure dashboards)
export type { FindingsCallbacks, AzureFindingsCallbacks } from './types/findingsCallbacks';

// Settings Panel
export {
  SettingsPanelBase,
  type SettingsPanelBaseProps,
  ThemeToggle,
  type ThemeToggleProps,
  type ThemeMode as UIThemeMode,
} from './components/SettingsPanel';

// Findings Panel
export {
  FindingsPanelBase,
  type FindingsPanelBaseProps,
  type FindingsPanelResizeConfig,
  BriefHeader,
  type BriefHeaderProps,
  FindingDetailPanel,
  type FindingDetailPanelProps,
} from './components/FindingsPanel';

// Editable Chart Title
export { EditableChartTitle, type EditableChartTitleProps } from './components/EditableChartTitle';

// Chart Wrappers
export { IChartWrapperBase, type IChartWrapperBaseProps } from './components/IChartWrapper';

export { BoxplotWrapperBase, type BoxplotWrapperBaseProps } from './components/BoxplotWrapper';

export {
  ParetoChartWrapperBase,
  type ParetoChartWrapperBaseProps,
} from './components/ParetoChartWrapper';

// Presentation View
export {
  PresentationViewBase,
  type PresentationViewBaseProps,
} from './components/PresentationView';

// Mobile Category Sheet
export {
  MobileCategorySheet,
  type MobileCategorySheetProps,
  type MobileCategorySheetData,
} from './components/MobileCategorySheet';

// Evidence Map Sheets (mobile bottom sheets for factor nodes and relationship edges)
export {
  EvidenceMapNodeSheet,
  type EvidenceMapNodeSheetProps,
  EvidenceMapEdgeSheet,
  type EvidenceMapEdgeSheetProps,
} from './components/EvidenceMapSheet';

// Evidence Map Context Menu (right-click actions for factor nodes and relationship edges)
export { NodeContextMenu, type NodeContextMenuProps } from './components/EvidenceMapContextMenu';
export { EdgeContextMenu, type EdgeContextMenuProps } from './components/EvidenceMapContextMenu';

// Evidence Map Defect Type Selector (pill tabs for defect mode views)
export {
  DefectTypeSelector,
  type DefectTypeSelectorProps,
} from './components/EvidenceMap/DefectTypeSelector';

// Evidence Map Insufficient Data State (empty state when defect type lacks data)
export {
  InsufficientDataState,
  type InsufficientDataStateProps,
} from './components/EvidenceMap/InsufficientDataState';

// Evidence Map Edge Detail Card (desktop floating card for relationship edge clicks)
export { EdgeDetailCard, type EdgeDetailCardProps } from './components/EvidenceMap/EdgeDetailCard';

// Evidence Map Edge Mini Chart (adaptive boxplot/scatter for edge detail card)
export {
  EdgeMiniChart,
  type EdgeMiniChartProps,
  type FactorDataType,
  type MiniChartType,
  getChartType,
} from './components/EvidenceMap/EdgeMiniChart';

// Evidence Map Cross-Type Rendering (radial factor layout for defect cross-type view)
export {
  CrossTypeEvidenceMap,
  type CrossTypeEvidenceMapProps,
} from './components/EvidenceMap/CrossTypeEvidenceMap';

// Mobile Tab Bar
export { MobileTabBar, type MobileTabBarProps, type MobileTab } from './components/MobileTabBar';

// Focused Chart View
export {
  FocusedChartViewBase,
  type FocusedChartViewBaseProps,
  type FocusedChartNavigation,
  type ChartExportProps,
  type FilterContextProps as FocusedFilterContextProps,
  type IChartSectionProps,
  type BoxplotSectionProps,
  type ParetoSectionProps,
  type FocusedChartType,
} from './components/FocusedChartViewBase';

// Report View
export {
  ReportViewBase,
  reportViewBaseDefaultColorScheme,
  ReportSection,
  reportSectionDefaultColorScheme,
  ReportStepMarker,
  ReportKPIGrid,
  reportKPIGridDefaultColorScheme,
  ReportChartSnapshot,
  reportChartSnapshotDefaultColorScheme,
  VerificationEvidenceBase,
  verificationEvidenceDefaultColorScheme,
  type ReportViewBaseProps,
  type ReportViewBaseColorScheme,
  type ReportSectionProps,
  type ReportSectionColorScheme,
  type ReportStepMarkerProps,
  type ReportKPIGridProps,
  type ReportKPIGridColorScheme,
  type ReportChartSnapshotProps,
  type ReportChartSnapshotColorScheme,
  type VerificationEvidenceBaseProps,
  type VerificationEvidenceColorScheme,
  ReportQuestionSummary,
  type ReportQuestionSummaryProps,
  ReportImprovementSummary,
  type ReportImprovementSummaryProps,
  ReportCpkLearningLoop,
  type ReportCpkLearningLoopProps,
  ReportYamazumiKPIGrid,
  type ReportYamazumiKPIGridProps,
  ReportCapabilityKPIGrid,
  type ReportCapabilityKPIGridProps,
  ReportPerformanceKPIGrid,
  type ReportPerformanceKPIGridProps,
  ReportActivityBreakdown,
  type ReportActivityBreakdownProps,
  ReportInvestigationSummary,
  type ReportInvestigationSummaryProps,
  ReportDefectKPIGrid,
  type ReportDefectKPIGridProps,
} from './components/ReportView';

// Report Evidence Map
export { ReportEvidenceMap, type ReportEvidenceMapProps } from './components/ReportEvidenceMap';

// Services
export {
  errorService,
  type ErrorSeverity,
  type ErrorContext,
  type ErrorLogEntry,
  type ErrorNotificationHandler,
} from './services';

// AI Components
export { NarrativeBar, type NarrativeBarProps } from './components/NarrativeBar';
export {
  ProcessDescriptionField,
  type ProcessDescriptionFieldProps,
} from './components/ProcessDescriptionField';

// Chart Insight Chip
export { ChartInsightChip, type ChartInsightChipProps } from './components/ChartInsightChip';

// CoScout Panel
export {
  CoScoutPanelBase,
  type CoScoutPanelBaseProps,
  type CoScoutPanelResizeConfig,
  type AIContextSummary,
  CoScoutMessages,
  type CoScoutMessagesProps,
  ActionProposalCard,
  type ActionProposalCardProps,
  SessionClosePrompt,
  type SessionClosePromptProps,
  type SessionClosePromptItem,
} from './components/CoScoutPanel';

// CoScout Inline
export { CoScoutInline, type CoScoutInlineProps } from './components/CoScoutInline';

// CoScout Visual Grounding
export { RefLink, type RefLinkProps } from './components/CoScoutPanel/RefLink';

// Investigation Phase Badge
export {
  InvestigationPhaseBadge,
  type InvestigationPhaseBadgeProps,
} from './components/InvestigationPhaseBadge';

// Preview Badge
export { PreviewBadge } from './components/PreviewBadge';

// AI Onboarding Tooltip
export {
  AIOnboardingTooltip,
  type AIOnboardingTooltipProps,
} from './components/AIOnboardingTooltip';

// Improvement Plan workspace
export {
  SynthesisCard,
  type SynthesisCardProps,
  IdeaGroupCard,
  type IdeaGroupCardProps,
  ImprovementSummaryBar,
  type ImprovementSummaryBarProps,
  ImprovementWorkspaceBase,
  type ImprovementWorkspaceBaseProps,
  ImprovementContextPanel,
  type ImprovementContextPanelProps,
  type CauseSummary,
  PrioritizationMatrix,
  DEFAULT_PRESETS,
  type PrioritizationMatrixProps,
  type MatrixIdea,
  type MatrixDimension,
  type MatrixPreset,
  VerificationSection,
  type VerificationSectionProps,
  type VerificationData,
  OutcomeSection,
  type OutcomeSectionProps,
  type OutcomeValue,
  ActionTrackerSection,
  type ActionTrackerSectionProps,
  type TrackedAction,
  PlanRecap,
  type PlanRecapProps,
  type SelectedIdea,
  TrackView,
  type TrackViewProps,
  VerificationPrompt,
  type VerificationPromptProps,
  CauseSummaryCards,
  type CauseSummaryCardsProps,
  type CauseSummaryCardData,
  AddActionDialog,
  type AddActionDialogProps,
  BrainstormModal,
  type BrainstormModalProps,
} from './components/ImprovementPlan';

// Yamazumi Components
export {
  YamazumiDetectedModal,
  type YamazumiDetectedModalProps,
} from './components/YamazumiDetectedModal';
export {
  YamazumiIChartMetricToggle,
  YamazumiParetoModeDropdown,
  type YamazumiIChartMetricToggleProps,
  type YamazumiParetoModeDropdownProps,
} from './components/YamazumiDisplayToggle';
export { YamazumiSummaryBar, type YamazumiSummaryBarProps } from './components/YamazumiSummaryBar';

// Investigation Conclusion (Hub model)
export {
  HubComposer,
  type HubComposerProps,
  HubCard,
  type HubCardProps,
  SynthesisPrompt,
  type SynthesisPromptProps,
} from './components/InvestigationConclusion';

// Process Health Bar
export { ProcessHealthBar, type ProcessHealthBarProps } from './components/ProcessHealthBar';

// Data Panel
export { DataPanelBase, type DataPanelBaseProps } from './components/DataPanel';

// Subgroup Capability
export {
  CapabilityMetricToggle,
  type CapabilityMetricToggleProps,
} from './components/CapabilityMetricToggle';
export { SubgroupConfigPopover, type SubgroupConfigProps } from './components/SubgroupConfig';

// Hooks
export {
  useIsMobile,
  BREAKPOINTS,
  useGlossary,
  type UseGlossaryOptions,
  type UseGlossaryResult,
} from './hooks';

// Context
export {
  ThemeProvider,
  useTheme,
  DENSITY_CONFIG,
  type ThemeMode,
  type DensityPreset,
  type ThemeConfig,
} from './context/ThemeContext';

// Factor Preview Overlay (Evidence Map embryonic preview)
export {
  FactorPreviewOverlay,
  type FactorPreviewOverlayProps,
} from './components/FactorPreviewOverlay';

// Document Shelf (Team tier — PI panel Docs tab)
export {
  DocumentShelfBase,
  DocumentRow,
  DocumentDropZone,
  AutoIndexSummary,
  type DocumentShelfBaseProps,
  type DocumentRowProps,
  type DocumentDropZoneProps,
  type AutoIndexSummaryProps,
  type DocumentInfo,
  type AutoIndexSummaryData,
} from './components/DocumentShelf';

// Defect Components
export {
  DefectDetectedModal,
  type DefectDetectedModalProps,
} from './components/DefectDetectedModal';
export { DefectSummary, type DefectSummaryProps } from './components/DefectSummary';

// Investigation components (regression sweet spot, etc.)
export { SweetSpotCard, type SweetSpotCardProps } from './components/Investigation';
