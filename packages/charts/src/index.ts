/**
 * @variscout/charts - Shared chart components
 *
 * Props-based chart components for use across PWA and Excel Add-in.
 * All charts accept data via props rather than context, enabling
 * platform-agnostic usage.
 */

// Types
export type {
  BaseChartProps,
  SpecLimits,
  GradeTier,
  StagedStatsResult,
  StageBoundary,
  ChannelResult,
  CpkThresholds,
  IChartDataPoint,
  IChartProps,
  BoxplotGroupInput,
  BoxplotGroupData,
  BoxplotProps,
  ParetoDataPoint,
  ParetoChartProps,
  CapabilityHistogramProps,
  ProbabilityPlotProps,
  ChartSourceBarProps,
  ChartMargins,
  ChartFonts,
  YAxisDomain,
  PerformanceIChartProps,
  PerformanceBoxplotProps,
  PerformanceParetoProps,
  PerformanceCapabilityProps,
} from './types';

export type { ScatterPlotProps } from './ScatterPlot';
export type { GageRRChartProps } from './GageRRChart';
export type { InteractionPlotProps } from './InteractionPlot';

// Helper functions
export { calculateBoxplotStats } from './types';

// Color constants
export {
  chartColors,
  chromeColors,
  operatorColors,
  getChromeColors,
  getDocumentTheme,
  type ChartColor,
  type ChromeColor,
  type ChromeColorValues,
} from './colors';

// Theme hook
export { useChartTheme, type ChartThemeColors } from './useChartTheme';

// Responsive utilities
export {
  getResponsiveMargins,
  getResponsiveFonts,
  getScaledFonts,
  getResponsiveTickCount,
  getBreakpoints,
  type ChartType,
} from './responsive';

// Layout hook
export { useChartLayout, type UseChartLayoutOptions, type ChartLayout } from './hooks';

// Interaction hooks
export { useChartTooltip, type UseChartTooltipReturn } from './hooks';
export {
  useSelectionState,
  selectionOpacity,
  type UseSelectionStateOptions,
  type UseSelectionStateReturn,
} from './hooks';
export {
  useMultiSelection,
  type UseMultiSelectionOptions,
  type UseMultiSelectionResult,
  type BrushExtent,
} from './hooks/useMultiSelection';

// Interaction styles
export {
  interactionStyles,
  getInteractionClass,
  interactionInlineStyles,
  hoverOpacity,
} from './styles/interactionStyles';

// Accessibility utilities
export {
  getInteractiveA11yProps,
  getDataPointA11yProps,
  getBarA11yProps,
  getBoxplotA11yProps,
  getScatterPointA11yProps,
  type InteractiveA11yProps,
} from './utils/accessibility';

// Shared components
export { ChartTooltip, getTooltipStyle, type ChartTooltipProps } from './components/ChartTooltip';

export {
  getYAxisTickLabelProps,
  getXAxisTickLabelProps,
  getTickLabelProps,
  getAxisLabelProps,
  getYAxisLabelX,
  getAxisLabelOffset,
  type TickLabelStyle,
} from './components/ChartAxis';

export {
  SpecLimitLine,
  VerticalSpecLimitLine,
  type SpecLimitLineProps,
  type VerticalSpecLimitLineProps,
  type LimitType,
} from './components/SpecLimitLine';

// Chart components
export { default as IChart, IChartBase } from './IChart';
export { default as Boxplot, BoxplotBase } from './Boxplot';
export { default as BoxplotStatsTable, type BoxplotStatsTableProps } from './BoxplotStatsTable';
export { default as ParetoChart, ParetoChartBase } from './ParetoChart';
export { default as CapabilityHistogram, CapabilityHistogramBase } from './CapabilityHistogram';
export { default as ProbabilityPlot, ProbabilityPlotBase } from './ProbabilityPlot';
export { default as ScatterPlot, ScatterPlotBase } from './ScatterPlot';
export { default as GageRRChart, GageRRChartBase } from './GageRRChart';
export { default as InteractionPlot, InteractionPlotBase } from './InteractionPlot';
export { default as ChartSourceBar, getSourceBarHeight } from './ChartSourceBar';
export { default as ChartLegend, type ChartLegendProps } from './ChartLegend';

// Investigation Mindmap (drilldown + interaction spatial view)
export {
  default as InvestigationMindmap,
  InvestigationMindmapBase,
  type InvestigationMindmapProps,
  type MindmapNode,
  type MindmapEdge,
  type MindmapMode,
  type CategoryData,
  type NarrativeStep,
} from './InvestigationMindmap';

// Performance chart components
export { default as PerformanceIChart, PerformanceIChartBase } from './PerformanceIChart';
export { default as PerformanceBoxplot, PerformanceBoxplotBase } from './PerformanceBoxplot';
export { default as PerformancePareto, PerformanceParetoBase } from './PerformancePareto';
export {
  default as PerformanceCapability,
  PerformanceCapabilityBase,
} from './PerformanceCapability';

// UI Components
export {
  default as EditableChartTitle,
  type EditableChartTitleProps,
} from './components/EditableChartTitle';

export { default as ChartCard, type ChartCardProps } from './components/ChartCard';
