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
export { DataQualityBanner, type DataQualityBannerProps } from './components/DataQualityBanner';
export {
  ColumnMapping,
  type ColumnMappingProps,
  type AnalysisBrief,
} from './components/ColumnMapping';
export { SelectionPanel, type SelectionPanelProps } from './components/SelectionPanel';
export { CreateFactorModal, type CreateFactorModalProps } from './components/CreateFactorModal';
export { UpgradePrompt, type UpgradePromptProps } from './components/UpgradePrompt';
export {
  AnovaResults,
  anovaDefaultColorScheme,
  type AnovaResultsProps,
  type AnovaResultsColorScheme,
} from './components/AnovaResults';
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
export {
  VariationBar,
  variationBarDefaultColorScheme,
  type VariationBarProps,
  type VariationBarColorScheme,
} from './components/VariationBar';
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
  WhatIfSimulator,
  whatIfSimulatorDefaultColorScheme,
  type WhatIfSimulatorColorScheme,
  type WhatIfSimulatorProps,
  type SimulatorPreset,
  type WhatIfSimulatorHandle,
} from './components/WhatIfSimulator';

export {
  WhatIfPageBase,
  computePresets,
  whatIfPageDefaultColorScheme,
  type WhatIfPageColorScheme,
  type WhatIfPageBaseProps,
} from './components/WhatIfPage';

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
  FINDINGS_SYNC_KEY,
  FINDINGS_ACTION_KEY,
  type FindingsSyncData,
  type FindingsAction,
  InvestigationSidebar,
  type InvestigationSidebarProps,
} from './components/FindingsWindow';

export {
  StatsPanelBase,
  StatsSummaryPanel,
  TargetDiscoveryCard,
  StagedComparisonCard,
  defaultStagedComparisonColorScheme,
  type StatsPanelBaseProps,
  type StatsPanelTab,
  type ComplementInsight,
  type TargetDiscoveryCardProps,
  type StatsSummaryPanelProps,
  type StagedComparisonCardProps,
  type StagedComparisonColorScheme,
} from './components/StatsPanel';

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
  HypothesisTreeView,
  HypothesisNode,
  copyFindingsToClipboard,
  formatFindingsText,
  type FindingsLogProps,
  type FindingCardProps,
  type FindingEditorProps,
  type FindingStatusBadgeProps,
  type FindingCommentsProps,
  type FindingBoardViewProps,
  type FindingsExportMenuProps,
  type HypothesisTreeViewProps,
  type HypothesisNodeProps,
} from './components/FindingsLog';

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
  ReportHypothesisSummary,
  type ReportHypothesisSummaryProps,
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
} from './components/ReportView';

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
  CHART_FONT_SCALES,
  type ThemeMode,
  type ChartFontScale,
  type ThemeConfig,
} from './context/ThemeContext';
