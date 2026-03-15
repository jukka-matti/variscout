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
  whatIfPageDefaultColorScheme,
  type WhatIfPageColorScheme,
  type WhatIfPageBaseProps,
} from './components/WhatIfPage';

export {
  ErrorBoundary,
  errorBoundaryDefaultColorScheme,
  type ErrorBoundaryProps,
  type ErrorBoundaryColorScheme,
} from './components/ErrorBoundary';
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
  statsPanelDefaultColorScheme,
  type StatsPanelBaseProps,
  type StatsPanelColorScheme,
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

export {
  FilterContextBar,
  filterContextBarDefaultColorScheme,
  type FilterContextBarProps,
  type FilterContextBarColorScheme,
} from './components/FilterContextBar';

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
  type FocusedViewOverlayProps,
  type FocusedChartCardProps,
  type DashboardChartCardProps,
  type DashboardGridProps,
} from './components/DashboardBase';

// Settings Panel
export { SettingsPanelBase, type SettingsPanelBaseProps } from './components/SettingsPanel';

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
  CoScoutMessages,
  type CoScoutMessagesProps,
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

// Hooks
export {
  useIsMobile,
  BREAKPOINTS,
  useGlossary,
  type UseGlossaryOptions,
  type UseGlossaryResult,
} from './hooks';
