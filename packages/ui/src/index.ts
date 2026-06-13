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
  type ColumnMappingConfirmPayload,
  type AnalysisBrief,
} from './components/ColumnMapping';
export { StageFiveModal, type StageFiveModalProps } from './components/StageFiveModal';
export { SelectionPanel, type SelectionPanelProps } from './components/SelectionPanel';
export { CaptureCard, type CaptureCardProps } from './components/CaptureCard';
export {
  EvidenceAnglePicker,
  type EvidenceAnglePickerProps,
} from './components/EvidenceAnglePicker';
export { DurabilityNudge, type DurabilityNudgeProps } from './components/DurabilityNudge';
export { CreateFactorModal, type CreateFactorModalProps } from './components/CreateFactorModal';
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
  type PerformanceSetupPanelChannelLimitProps,
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

// What-If Explorer (unified)
export {
  WhatIfExplorer,
  WhatIfExplorerPage,
  BasicEstimator,
  ModelInformedEstimator,
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
  ChannelAdjusterProps,
} from './components/WhatIfExplorer';

export { ErrorBoundary, type ErrorBoundaryProps } from './components/ErrorBoundary';
export {
  WorkflowNav,
  workflowTabs,
  type WorkflowNavProps,
  type WorkflowTab,
  type WorkflowTabId,
} from './components/WorkflowNav';
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
  AnalyzeSidebar,
  type AnalyzeSidebarProps,
  AnalyzeConclusion,
  type AnalyzeConclusionProps,
} from './components/FindingsWindow';

export {
  PIPanelBase,
  TargetDiscoveryCard,
  StagedComparisonCard,
  defaultStagedComparisonColorScheme,
  FactorIntelligencePanel,
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
  JournalTabContent,
  type JournalTabContentProps,
  type ConclusionCardProps,
  type Hypothesis,
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
  SpecEditor,
  specEditorDefaultColorScheme,
  type SpecEditorProps,
  type SpecEditorColorScheme,
} from './components/SpecEditor';

export {
  default as CharacteristicTypeSelector,
  type CharacteristicTypeSelectorProps,
} from './components/CharacteristicTypeSelector';

export { CpkTargetInput, type CpkTargetInputProps } from './components/CpkTargetInput';

export {
  CapabilityHistogram,
  type CapabilityHistogramProps,
} from './components/CapabilityHistogram';

export { ProbabilityPlot, type ProbabilityPlotProps } from './components/ProbabilityPlot';
export {
  ProbabilityPlotTooltip,
  type ProbabilityPlotTooltipProps,
} from './components/ProbabilityPlotTooltip';

export * from './components/AnalyzeWall';

// ModelDrawer (ER-3). The in-SVG ModelBuilderBand was deleted in Task 4 —
// `CapturedModelSnapshot` is now sourced from its canonical home in ModelDrawer
// (apps import it from `@variscout/ui`).
export { ModelDrawerBase } from './components/ModelDrawer';
export type {
  ModelDrawerBaseProps,
  ModelDrawerStats,
  CapturedModelSnapshot,
} from './components/ModelDrawer';

export {
  VerificationCard,
  type VerificationCardProps,
  type VerificationCardTab,
} from './components/VerificationCard';

export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedControlOption,
} from './components/SegmentedControl';

export { FilterContextBar, type FilterContextBarProps } from './components/FilterContextBar';

export { SurveyNotebookBase, type SurveyNotebookBaseProps } from './components/SurveyNotebookBase';

export {
  ControlForm,
  type ControlFormProps,
  type ControlRecordChangePatch,
  type ControlReviewLogInput,
} from './components/Control';
export {
  ControlVerificationBand,
  type ControlVerificationBandProps,
} from './components/ControlVerificationBand';
export { InboxDigest, type InboxDigestProps, type InboxDigestPrompt } from './components/Inbox';

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
  AnalyzePrompt,
  investigationPromptDefaultColorScheme,
  type AnalyzePromptProps,
  type AnalyzePromptColorScheme,
} from './components/AnalyzePrompt';

export {
  FindingsLog,
  FindingCard,
  FindingEditor,
  FindingStatusBadge,
  FindingComments,
  FindingBoardView,
  FindingsExportMenu,
  copyFindingsToClipboard,
  formatFindingsText,
  type FindingsLogProps,
  type FindingCardProps,
  type FindingEditorProps,
  type FindingStatusBadgeProps,
  type FindingCommentsProps,
  type FindingBoardViewProps,
  type FindingsExportMenuProps,
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
export { FactorStripBase, type FactorStripBaseProps } from './components/FactorStrip';

// Chart skeleton placeholder (one-rAF mount gate in the chart cards)
export { ChartSkeleton, type ChartSkeletonProps } from './components/ChartSkeleton';

// Findings callback types (shared by PWA and Azure dashboards)
export type {
  ChartObservationCaptureOptions,
  FindingsCallbacks,
  AzureFindingsCallbacks,
} from './types/findingsCallbacks';

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

// Evidence Map Sheets
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

// Timeline Window Picker (four-kind window selector for multi-level SCOUT)
export {
  TimelineWindowPicker,
  type TimelineWindowPickerProps,
} from './components/TimelineWindowPicker';

// Column Candidate Chip (FRAME b0 column-selection primitive — Y/X picker)
export {
  ColumnCandidateChip,
  type ColumnCandidateChipProps,
  type ColumnCandidateChipState,
} from './components/ColumnCandidateChip';

// Chip Rail (FRAME canvas unassigned-column drag rail)
export {
  ChipRail,
  ChipRailItem,
  type ChipRailEntry,
  type ChipRailProps,
  type ChipRailItemProps,
  type ChipRailItemRole,
} from './components/ChipRail';

// Auto Step Create Prompt (FRAME canvas dropped-chip confirmation)
export {
  AutoStepCreatePrompt,
  type AutoStepCreatePromptProps,
  type AutoStepCreatePromptPosition,
} from './components/AutoStepCreatePrompt';

export { StructuralToolbar, type StructuralToolbarProps } from './components/StructuralToolbar';

// Y Picker Section (FRAME b0 Y / outcome selection UI)
export {
  YPickerSection,
  type YPickerSectionProps,
  type YPickerSectionCandidate,
} from './components/YPickerSection';

// X Picker Section (FRAME b0 X / factor multi-selection UI)
export {
  XPickerSection,
  type XPickerSectionProps,
  type XCandidate,
} from './components/XPickerSection';

// Inline Spec Editor (FRAME b0 inline popover for setting USL/LSL/Target/Cpk target)
export {
  InlineSpecEditor,
  type InlineSpecEditorProps,
  type SpecValues,
  type SpecSuggestion,
} from './components/InlineSpecEditor';

// Process Steps Expander (FRAME b0 disclosure widget for opt-in process map authoring)
export {
  ProcessStepsExpander,
  type ProcessStepsExpanderProps,
} from './components/ProcessStepsExpander';

// See The Data CTA (FRAME b0 primary action — navigates to Analysis tab via parent)
export { SeeTheDataCta, type SeeTheDataCtaProps } from './components/SeeTheDataCta';

// FrameViewB0 (FRAME b0 lightweight render composition — Y/X pickers + spec + CTA)
export {
  FrameViewB0,
  type FrameViewB0Props,
  type FrameViewB0YCandidate,
} from './components/FrameViewB0';

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

export {
  ContextBadgesRow,
  MultiLinkPicker,
  type ContextBadgesRowProps,
  type ContextLinkGroup,
  type ContextLinkItem,
  type ContextSurfaceType,
  type MultiLinkPickerProps,
} from './components/CrossSurface';

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
  ReportImprovementSummary,
  type ReportImprovementSummaryProps,
  ReportCpkLearningLoop,
  type ReportCpkLearningLoopProps,
  ReportCapabilityKPIGrid,
  type ReportCapabilityKPIGridProps,
  ReportPerformanceKPIGrid,
  type ReportPerformanceKPIGridProps,
  ReportAnalyzeSummary,
  type ReportAnalyzeSummaryProps,
  ReportDefectKPIGrid,
  type ReportDefectKPIGridProps,
  IPOverviewReport,
  type IPOverviewReportProps,
  IPTechnicalReport,
  REPORT_METHODOLOGY_FOOTNOTE,
  type IPTechnicalReportProps,
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

// Preview Badge
export { PreviewBadge } from './components/PreviewBadge';

// Step Defect Indicator (per-step defect count badge — future step-card mounting)
export {
  StepDefectIndicator,
  type StepDefectIndicatorProps,
} from './components/StepDefectIndicator';

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

// Improvement Project workspace
export * from './components/WorkspaceProject';
export * from './components/ImprovementProject';
export * from './components/Control';
export * from './components/Inbox';

// Investigation Conclusion (Hub model)
export {
  HubComposer,
  type HubComposerProps,
  type HubComposerBranchFields,
  HubCard,
  type HubCardProps,
  SynthesisPrompt,
  type SynthesisPromptProps,
} from './components/AnalyzeConclusion';

// Process Health Bar
export { ProcessHealthBar, type ProcessHealthBarProps } from './components/ProcessHealthBar';

// Data Panel
export { DataPanelBase, type DataPanelBaseProps } from './components/DataPanel';

// Subgroup Capability
export {
  CapabilityMetricToggle,
  type CapabilityMetricToggleProps,
} from './components/CapabilityMetricToggle';
export {
  CapabilityCoachingPanel,
  type CapabilityCoachingPanelProps,
} from './components/CapabilityCoachingPanel';
export { SubgroupConfigPopover, type SubgroupConfigProps } from './components/SubgroupConfig';

// FRAME workspace — visual Process Map (ADR-070)
export { Canvas, type CanvasProps } from './components/Canvas';
export { navigateToExploreForChip } from './components/Canvas';
export type { ChipNavigationTarget } from './components/Canvas';
export { ExploreJumpButton } from './components/Canvas';
export { CanvasWorkspace, type CanvasWorkspaceProps } from './components/Canvas/CanvasWorkspace';

// Hooks
export { useGlossary, type UseGlossaryOptions, type UseGlossaryResult } from './hooks';

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

// Document Shelf (PI panel Docs tab)
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
export { SweetSpotCard, type SweetSpotCardProps } from './components/Analyze';

// Production-line-glance dashboard + filter strip
export {
  ProductionLineGlanceDashboard,
  ProductionLineGlanceFilterStrip,
} from './components/ProductionLineGlanceDashboard';
export type {
  ProductionLineGlanceDashboardProps,
  ProductionLineGlanceFilterStripProps,
} from './components/ProductionLineGlanceDashboard';

// Production-line-glance migration UX (B0 banner + mapping modal)
export {
  ProductionLineGlanceMigrationBanner,
  ProductionLineGlanceMigrationModal,
} from './components/ProductionLineGlanceMigration';
export type {
  ProductionLineGlanceMigrationBannerProps,
  ProductionLineGlanceMigrationModalProps,
  ProductionLineGlanceMigrationModalEntry,
  ProductionLineGlanceMigrationSuggestion,
} from './components/ProductionLineGlanceMigration';

// Hub Goal Form (framing layer Stage 1 — free-text narrative + scaffold chips)
export { HubGoalForm } from './components/HubGoalForm/HubGoalForm';
export type { HubGoalFormProps } from './components/HubGoalForm/HubGoalForm';

// Outcome Candidate Row (framing layer Stage 3 — inline per-candidate specs)
export { OutcomeCandidateRow } from './components/OutcomeCandidateRow/OutcomeCandidateRow';
export type {
  OutcomeCandidate,
  OutcomeCandidateRowProps,
} from './components/OutcomeCandidateRow/OutcomeCandidateRow';

// Primary Scope Dimensions Selector (framing layer Stage 3 sub-step)
export { PrimaryScopeDimensionsSelector } from './components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector';
export type {
  DimensionRow,
  PrimaryScopeDimensionsSelectorProps,
} from './components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector';

// Outcome No Match Banner (framing layer graceful degradation)
export { OutcomeNoMatchBanner } from './components/OutcomeNoMatchBanner/OutcomeNoMatchBanner';
export type { OutcomeNoMatchBannerProps } from './components/OutcomeNoMatchBanner/OutcomeNoMatchBanner';

// Canvas first-paint components (framing layer)
export { GoalBanner } from './components/GoalBanner/GoalBanner';
export type { GoalBannerProps } from './components/GoalBanner/GoalBanner';
export { OutcomePin } from './components/OutcomePin/OutcomePin';
export type { OutcomePinProps } from './components/OutcomePin/OutcomePin';

// Match summary card (framing layer — paste classification UX)
export { MatchSummaryCard } from './components/MatchSummaryCard';
export type {
  MatchSummaryCardProps,
  MatchSummaryActionChoice,
} from './components/MatchSummaryCard';
export type { ColumnShape } from './components/MatchSummaryCard/ColumnShapeSubSummary';
export { JoinKeySuggestion } from './components/MatchSummaryCard/JoinKeySuggestion';
export type { JoinKeySuggestionProps } from './components/MatchSummaryCard/JoinKeySuggestion';

// Canvas filter chips (framing layer — composable investigation filter state chips)
export { CanvasFilterChips } from './components/CanvasFilterChips';
export type { CanvasFilterChipsProps } from './components/CanvasFilterChips';

export { LogActionModal, RecentActivityPanel } from './components/QuickAction';
export type {
  LogActionModalProps,
  LogActionPayload,
  RecentActivityPanelProps,
} from './components/QuickAction';

// IP Detail workspace (Plan 2 — composition; Plans 3-5 fill content)
export * from './components/IPDetail';

// Home tab components (wedge V1 — pending invitations banner)
export * from './components/Home';

// Improve tab orchestration (wedge V1 top-level Improve tab)
export * from './components/Improve';

// Explore tab — Probability lens inflection-binning workflow (wedge V1 PR-CCJ-G1)
export * from './components/Explore/Probability/InflectionBinning';

// Explore tab — Scope chrome (SingleSelectPopover + FilterChipDropdown reuse, wedge V1 LV1-E)
export {
  ScopeChrome,
  ScopeChip,
  AddFilterButton,
  EmptyStateHint,
  PersistentScopeChip,
} from './components/Explore';
export type {
  ScopeChromeProps,
  ScopeChipProps,
  ScopeChipKind,
  AddFilterButtonProps,
  EmptyStateHintProps,
  PersistentScopeChipProps,
} from './components/Explore';

// Explore tab — the condition loop: ConditionPill (mint) + ScopeBar (show) (ER-4)
export { ConditionPillBase, ScopeBarBase } from './components/Explore';
export type { ConditionPillBaseProps, ScopeBarBaseProps } from './components/Explore';
// Explore tab — composition view (ER-5a — paired share bars per level, ⊕ compound condition)
export { CompositionViewBase } from './components/Explore';
export type { CompositionViewBaseProps } from './components/Explore';
export { SingleSelectPopover } from './components/SingleSelectPopover';
export type {
  SingleSelectPopoverProps,
  SingleSelectPopoverOption,
  SingleSelectPopoverNullOption,
} from './components/SingleSelectPopover';

// Shared confirm dialog primitive (wedge V1 PR-CCJ-H1)
export { ConfirmDialog, type ConfirmDialogProps } from './components/ConfirmDialog';
