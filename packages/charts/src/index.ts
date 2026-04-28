/**
 * @variscout/charts - Shared chart components
 *
 * Props-based chart components for use across PWA and Azure App.
 * All charts accept data via props rather than context, enabling
 * platform-agnostic usage.
 */

// Types
export type {
  HighlightColor,
  BaseChartProps,
  SpecLimits,
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
  ScatterFitProps,
  CapabilityBoxplotProps,
  CapabilityBoxplotNode,
  StepErrorParetoProps,
  StepErrorParetoStep,
  CapabilityGapTrendChartProps,
} from './types';

// Color constants
export {
  chartColors,
  chromeColors,
  operatorColors,
  stageColors,
  getChromeColors,
  type ChartColor,
  type ChromeColor,
  type ChromeColorValues,
} from './colors';

// Theme hook
export { useChartTheme, getDocumentFontScale, type ChartThemeColors } from './useChartTheme';

// Responsive utilities
export {
  getResponsiveMargins,
  getResponsiveFonts,
  getScaledFonts,
  getResponsiveTickCount,
  getBreakpoints,
  type ChartType,
} from './responsive';

// Interaction hooks
export { useChartTooltip, type UseChartTooltipReturn } from './hooks';
export {
  useSelectionState,
  selectionOpacity,
  type UseSelectionStateOptions,
  type UseSelectionStateReturn,
} from './hooks';

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

export { SpecLimitLine, type SpecLimitLineProps, type LimitType } from './components/SpecLimitLine';

// Branding
export { default as ChartSignature, type ChartSignatureProps } from './ChartSignature';

// Chart components
export { default as IChart, IChartBase } from './IChart';
export { default as Boxplot, BoxplotBase, MIN_BOXPLOT_VALUES } from './Boxplot';
export { default as BoxplotStatsTable, type BoxplotStatsTableProps } from './BoxplotStatsTable';
export { default as ParetoChart, ParetoChartBase, computeRankDeltas } from './ParetoChart';
export { default as CapabilityHistogram, CapabilityHistogramBase } from './CapabilityHistogram';
export { default as ProbabilityPlot, ProbabilityPlotBase } from './ProbabilityPlot';
export { default as ChartSourceBar, getSourceBarHeight } from './ChartSourceBar';
export { default as ChartLegend, type ChartLegendProps } from './ChartLegend';

// Yamazumi chart components
export { default as YamazumiChart, YamazumiChartBase } from './YamazumiChart';
export type { YamazumiChartProps } from './types';

// Evidence Map components
export { EvidenceMap, EvidenceMapBase } from './EvidenceMap';
export type {
  EvidenceMapBaseProps,
  FactorNodeData,
  RelationshipEdgeData,
  OutcomeNodeData,
  EquationData,
  CausalEdgeData,
  ConvergencePointData,
  RelationshipType,
} from './EvidenceMap';

// Investigation Wall components
export * from './InvestigationWall';

// ScatterFit chart component
export { default as ScatterFit, ScatterFitBase } from './ScatterFit';

// Performance chart components
export { default as PerformanceIChart, PerformanceIChartBase } from './PerformanceIChart';
export { default as PerformanceBoxplot, PerformanceBoxplotBase } from './PerformanceBoxplot';
export { default as PerformancePareto, PerformanceParetoBase } from './PerformancePareto';
export {
  default as PerformanceCapability,
  PerformanceCapabilityBase,
} from './PerformanceCapability';

// Production-line-glance chart components (Plan B)
export {
  default as CapabilityGapTrendChart,
  CapabilityGapTrendChartBase,
} from './CapabilityGapTrendChart';
export { default as CapabilityBoxplot, CapabilityBoxplotBase } from './CapabilityBoxplot';
export { default as StepErrorPareto, StepErrorParetoBase } from './StepErrorPareto';
