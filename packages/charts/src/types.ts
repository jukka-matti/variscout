/**
 * Shared types for @variscout/charts
 * Props-based chart components for use across PWA and Azure App
 */

import type React from 'react';
import type {
  StatsResult,
  SpecLimits,
  StagedStatsResult,
  StageBoundary,
  ChannelResult,
  CpkThresholds,
  BoxplotGroupInput,
  BoxplotGroupData,
  ChartMargins,
  ChartFonts,
  IChartDataPoint,
  ParetoDataPoint,
  ProbabilityPlotSeries,
} from '@variscout/core';
import type { HighlightColor } from '@variscout/core/ui-types';

// Re-export data point types from core (canonical source)
export type { IChartDataPoint, ParetoDataPoint } from '@variscout/core';

export type { HighlightColor } from '@variscout/core/ui-types';

// Re-export types from core for convenience
export type {
  SpecLimits,
  StagedStatsResult,
  StageBoundary,
  ChannelResult,
  CpkThresholds,
  BoxplotGroupInput,
  BoxplotGroupData,
  ChartMargins,
  ChartFonts,
};

/**
 * Y-axis domain override for locking scale to full dataset
 */
export interface YAxisDomain {
  min: number;
  max: number;
}

/**
 * Common props shared by all chart components
 */
export interface BaseChartProps {
  /** Container width in pixels */
  parentWidth: number;
  /** Container height in pixels */
  parentHeight: number;
  /** Show branding footer bar */
  showBranding?: boolean;
  /** Custom branding text (defaults to tier-based text) */
  brandingText?: string;
}

/**
 * I-Chart (Individual Control Chart) props
 */
export interface IChartProps extends BaseChartProps {
  /** Data points with x (index), y (value), and optional stage */
  data: IChartDataPoint[];
  /** Statistical results (mean, stdDev, ucl, lcl) - used when not staged */
  stats: StatsResult | null;
  /** Staged statistics - when provided, renders per-stage control limits */
  stagedStats?: StagedStatsResult;
  /** Specification limits */
  specs: SpecLimits;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Axis settings for manual scaling */
  axisSettings?: { min?: number; max?: number };
  /** Override Y-axis domain (for locking scale to full dataset) */
  yDomainOverride?: YAxisDomain;
  /** Callback when a point is clicked */
  onPointClick?: (index: number, originalIndex?: number) => void;
  /** Enable brush selection (Minitab-style multi-point selection) */
  enableBrushSelection?: boolean;
  /** Currently selected point indices (for cross-chart sync) */
  selectedPoints?: Set<number>;
  /** Callback when brush selection changes (new selection indices) */
  onSelectionChange?: (indices: Set<number>) => void;
  /** Sample size for branding bar */
  sampleSize?: number;
  /** Show Minitab-style labels next to limit lines (default: true) */
  showLimitLabels?: boolean;
  /** Callback when a spec limit label is clicked (for editing) */
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  /** Callback when Y-axis area is clicked (for editing scale) */
  onYAxisClick?: (event?: React.MouseEvent) => void;
  /** Highlighted point index for bi-directional sync (e.g., from data panel selection) */
  highlightedPointIndex?: number | null;
  /** Show color-coded legend explaining point colors (default: false) */
  showLegend?: boolean;
  /** Legend display mode: educational (variation learning) or practical (action-oriented) */
  legendMode?: 'educational' | 'practical';
  /** Secondary data series (e.g., Cp alongside Cpk in capability mode) */
  secondaryData?: IChartDataPoint[];
  /** Stats for secondary series (mean, UCL, LCL) */
  secondaryStats?: StatsResult | null;
  /** Label for primary series (e.g., "Cpk") */
  primaryLabel?: string;
  /** Label for secondary series (e.g., "Cp") */
  secondaryLabel?: string;
  /** Override the target line label (default: translated "Tgt") */
  targetLabel?: string;
}

/**
 * Boxplot chart props
 */
export interface BoxplotProps extends BaseChartProps {
  /** Grouped data for boxplot */
  data: BoxplotGroupData[];
  /** Specification limits */
  specs: SpecLimits;
  /** Y-axis label */
  yAxisLabel?: string;
  /** X-axis label (factor name) */
  xAxisLabel?: string;
  /** Override Y-axis domain (for locking scale to full dataset) */
  yDomainOverride?: YAxisDomain;
  /** Currently selected groups */
  selectedGroups?: string[];
  /** Callback when a box is clicked */
  onBoxClick?: (key: string) => void;
  /** Sample size for branding bar */
  sampleSize?: number;
  /** Callback when Y-axis label area is clicked (for editing) */
  onYAxisClick?: () => void;
  /** Callback when X-axis label area is clicked (for editing) */
  onXAxisClick?: () => void;
  /** Custom tick formatter for X-axis (e.g., value labels) */
  xTickFormat?: (value: string) => string;
  /** Show violin (density) overlay behind box elements (default: false) */
  showViolin?: boolean;
  /** Pre-computed KDE violin data (category key → density points). When provided, skips internal KDE computation. */
  violinData?: Map<string, Array<{ value: number; count: number }>>;
  /** Highlighted categories with annotation colors (category key → color) */
  highlightedCategories?: Record<string, HighlightColor>;
  /** Callback when a box is right-clicked (for annotation context menu) */
  onBoxContextMenu?: (key: string, event: React.MouseEvent) => void;
  /** Per-key fill color overrides (key → hex). Priority: highlightedCategories > fillOverrides > selection > default */
  fillOverrides?: Record<string, string>;
  /** Draw thin dashed vertical separator lines between every N boxes (for staged grouping) */
  groupSize?: number;
  /** Optional horizontal reference line (e.g., Cpk target in capability mode) */
  targetLine?: {
    value: number;
    color: string;
    label?: string;
  };
  /** Subset of category keys to render (adaptive limit). When provided, data is filtered to these. */
  visibleCategories?: string[];
  /** Total number of categories before filtering (for overflow indicator) */
  totalCategories?: number;
  /** Callback when overflow indicator is clicked */
  onOverflowClick?: () => void;
}

/**
 * Pareto chart props
 */
export interface ParetoChartProps extends BaseChartProps {
  /** Pareto data with counts and cumulative percentages */
  data: ParetoDataPoint[];
  /** Total count for percentage calculations */
  totalCount: number;
  /** X-axis label (factor name) */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Currently selected bars */
  selectedBars?: string[];
  /** Callback when a bar is clicked */
  onBarClick?: (key: string) => void;
  /** Callback when Y-axis label area is clicked (for editing) */
  onYAxisClick?: () => void;
  /** Callback when X-axis label area is clicked (for editing) */
  onXAxisClick?: () => void;
  /** Comparison data for ghost bars behind regular bars (key → expected value) */
  comparisonData?: Map<string, number>;
  /** Custom tooltip content renderer. Replaces default tooltip when provided. */
  tooltipContent?: (data: ParetoDataPoint) => React.ReactNode;
  /** Highlighted categories with annotation colors (category key → color) */
  highlightedCategories?: Record<string, HighlightColor>;
  /** Callback when a bar is right-clicked (for annotation context menu) */
  onBarContextMenu?: (key: string, event: React.MouseEvent) => void;
  /** Show rank change indicators when comparisonData is present */
  showRankChange?: boolean;
  /** Key used for the "Others" aggregated bar (rendered in muted style) */
  othersKey?: string;
}

/**
 * Capability histogram props
 */
export interface CapabilityHistogramProps extends BaseChartProps {
  /** Raw numeric values */
  data: number[];
  /** Specification limits */
  specs: SpecLimits;
  /** Mean value for reference line */
  mean: number;
  /** Override X-axis domain (for locking scale to full dataset) - data values axis */
  xDomainOverride?: YAxisDomain;
}

/**
 * Probability plot props — multi-series with brush and annotation support
 */
export interface ProbabilityPlotProps extends BaseChartProps {
  /** Series data (one per factor level, or single "All" series) */
  series: ProbabilityPlotSeries[];
  /** Optional custom margin override */
  marginOverride?: { top: number; right: number; bottom: number; left: number };
  /** Optional custom font sizes override */
  fontsOverride?: ChartFonts;
  /** Currently selected point indices (for brush selection) */
  selectedPoints?: Set<number>;
  /** Callback when brush selection changes */
  onSelectionChange?: (indices: Set<number>) => void;
  /** Right-click context menu callback (anchorX 0-1, anchorY 0-1, optional series key) */
  onChartContextMenu?: (anchorX: number, anchorY: number, seriesKey?: string) => void;
  /** Series hover callback for tooltip */
  onSeriesHover?: (
    series: ProbabilityPlotSeries | null,
    position: { x: number; y: number }
  ) => void;
}

/**
 * Chart source bar props
 */
export interface ChartSourceBarProps {
  /** Width of the bar */
  width: number;
  /** Top position */
  top: number;
  /** Left position (default 0) */
  left?: number;
  /** Sample size to display */
  n?: number;
  /** Override branding text */
  brandingText?: string;
  /** Accent color (default blue) */
  accentColor?: string;
  /** Force show branding (overrides tier check) */
  forceShow?: boolean;
  /** Font size for branding text (from responsive fonts) */
  fontSize?: number;
}

// ============================================================================
// Performance Chart Types
// ============================================================================

/**
 * PerformanceIChart props - I-Chart for capability metrics (Cpk/Cp)
 */
export interface PerformanceIChartProps extends BaseChartProps {
  /** Channel results with Cpk values */
  channels: ChannelResult[];
  /** Currently selected measure/channel */
  selectedMeasure?: string | null;
  /** Callback when a channel point is clicked */
  onChannelClick?: (channelId: string) => void;
  /** Which capability metric to display: 'cpk' (default), 'cp', or 'both' */
  capabilityMetric?: 'cp' | 'cpk' | 'both';
  /** User-defined Cpk/Cp target line (default: 1.33) */
  cpkTarget?: number;
  /** Custom Cpk thresholds for health classification (defaults to industry standards) */
  cpkThresholds?: CpkThresholds;
}

/**
 * PerformanceBoxplot props - Distribution comparison for channels
 */
export interface PerformanceBoxplotProps extends BaseChartProps {
  /** Channel results with values for boxplot calculation */
  channels: ChannelResult[];
  /** Specification limits for reference lines */
  specs: SpecLimits;
  /** Currently selected measure/channel (shows only this channel when set) */
  selectedMeasure?: string | null;
  /** Maximum number of channels to display (default: 5) */
  maxDisplayed?: number;
  /** Callback when a boxplot is clicked */
  onChannelClick?: (channelId: string) => void;
  /** Show stats table below the chart (default: false) */
  showStatsTable?: boolean;
  /** Custom Cpk thresholds for health classification in stats table (defaults to industry standards) */
  cpkThresholds?: CpkThresholds;
  /** Show violin (density) overlay behind box elements (default: false) */
  showViolin?: boolean;
}

/**
 * PerformancePareto props - Cpk ranking chart (worst first)
 */
export interface PerformanceParetoProps extends BaseChartProps {
  /** Channel results for ranking */
  channels: ChannelResult[];
  /** Currently selected measure/channel */
  selectedMeasure?: string | null;
  /** Maximum number of channels to display (default: 20) */
  maxDisplayed?: number;
  /** Callback when a bar is clicked */
  onChannelClick?: (channelId: string) => void;
  /** Custom Cpk thresholds for health classification and reference lines (defaults to industry standards) */
  cpkThresholds?: CpkThresholds;
}

/**
 * PerformanceCapability props - Histogram for selected channel
 */
export interface PerformanceCapabilityProps extends BaseChartProps {
  /** Single channel result to display (null shows placeholder) */
  channel: ChannelResult | null;
  /** Specification limits for reference lines */
  specs: SpecLimits;
}

// ============================================================================
// Yamazumi Chart Types
// ============================================================================

/** Re-export from core for chart component usage */
export type { YamazumiBarData, YamazumiSegment, ActivityType } from '@variscout/core';

/**
 * YamazumiChart props - Stacked bar chart for lean time study analysis
 */
export interface YamazumiChartProps extends BaseChartProps {
  /** Bar data (one per process step) */
  data: import('@variscout/core').YamazumiBarData[];
  /** Reference takt time (renders as horizontal dashed line) */
  taktTime?: number;
  /** Currently selected bar keys */
  selectedBars?: string[];
  /** Callback when a bar is clicked (drill-down) */
  onBarClick?: (stepKey: string) => void;
  /** Callback when a segment within a bar is clicked */
  onSegmentClick?: (stepKey: string, activityType: import('@variscout/core').ActivityType) => void;
  /** Callback for right-click context menu */
  onBarContextMenu?: (key: string, event: React.MouseEvent) => void;
  /** Highlighted bars with colors (annotation highlights) */
  highlightedBars?: Record<string, HighlightColor>;
  /** Show percentage labels on segments */
  showPercentLabels?: boolean;
  /** Y-axis label */
  yAxisLabel?: string;
}

// ============================================================================
// ScatterFit Chart Types
// ============================================================================

/**
 * ScatterFit props - scatterplot with fitted curve overlay
 * Used in FactorPreviewOverlay for continuous-factor relationship preview
 */
export interface ScatterFitProps extends BaseChartProps {
  /** Raw data points */
  data: Array<{ x: number; y: number }>;
  /** Fitted curve points (connected line) */
  fittedLine: Array<{ x: number; y: number }>;
  /** Prediction band (optional) */
  predictionBand?: Array<{ x: number; yLow: number; yHigh: number }>;
  /** Optimal point marker (quadratic peak/valley) */
  optimum?: { x: number; y: number };
  /** Whether the relationship is significant (affects fitted line color) */
  isSignificant?: boolean;
  /** X-axis label */
  xLabel?: string;
  /** Y-axis label */
  yLabel?: string;
  /** Insight text shown below chart */
  insightText?: string;
}
