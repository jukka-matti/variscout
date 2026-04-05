/**
 * Canonical UI presentation types for @variscout/core
 *
 * This module is the SINGLE SOURCE OF TRUTH for UI presentation types
 * that are shared across packages (hooks, stores, charts, ui).
 *
 * Previously these types were duplicated in:
 * - packages/hooks/src/types.ts
 * - packages/stores/src/projectStore.ts
 * - packages/charts/src/EvidenceMap/types.ts
 * - packages/ui/src/components/ChartAnnotationLayer/types.ts
 *
 * All consumers should import from '@variscout/core/ui-types'.
 */

import type { BoxplotSortBy, BoxplotSortDirection } from '../types';
import type { StandardIChartMetric } from '../stats/subgroupCapability';
import type { YamazumiIChartMetric, YamazumiParetoMode } from '../yamazumi/types';

// Re-export referenced types for consumer convenience
export type {
  BoxplotSortBy,
  BoxplotSortDirection,
  StandardIChartMetric,
  YamazumiIChartMetric,
  YamazumiParetoMode,
};

// ============================================================================
// Scale & Axis Types
// ============================================================================

/**
 * Y-axis scale mode
 * - 'auto': Automatically calculate range from data, specs, and control limits
 * - 'clampZero': Start Y-axis at zero, auto-calculate max
 * - 'manual': Use explicit min/max values from axisSettings
 */
export type ScaleMode = 'auto' | 'clampZero' | 'manual';

/**
 * Axis settings for manual scale control
 */
export interface AxisSettings {
  min?: number;
  max?: number;
  scaleMode?: ScaleMode;
}

// ============================================================================
// Annotation Types
// ============================================================================

/** Highlight color for annotated chart elements (boxplot categories, pareto bars) */
export type HighlightColor = 'red' | 'amber' | 'green';

// ============================================================================
// Display & Presentation Types
// ============================================================================

/**
 * Display options controlling chart presentation.
 * Persisted with project state.
 */
export interface DisplayOptions {
  /** Lock Y-axis to full dataset range when filtering (default: true) */
  lockYAxisToFullData?: boolean;
  /** Show control limits (UCL/Mean/LCL) on I-Chart (default: true) */
  showControlLimits?: boolean;
  /** Show violin (density) overlay on boxplot charts (default: false) */
  showViolin?: boolean;
  /** Show filter context bar inside chart cards for copy-to-clipboard (default: true) */
  showFilterContext?: boolean;
  /** Boxplot category sort criterion (default: 'name') */
  boxplotSortBy?: BoxplotSortBy;
  /** Boxplot category sort direction (default: 'asc') */
  boxplotSortDirection?: BoxplotSortDirection;
  /** Highlighted boxplot categories (category key -> color) */
  boxplotHighlights?: Record<string, HighlightColor>;
  /** Highlighted pareto categories (category key -> color) */
  paretoHighlights?: Record<string, HighlightColor>;
  /** Show specification limits on I-Chart (default: true) */
  showSpecs?: boolean;
  /** Show Cpk values in stats panel (default: true) */
  showCpk?: boolean;
  /** Standard I-Chart metric mode (default: 'measurement') */
  standardIChartMetric?: StandardIChartMetric;
  /** Capability boxplot metric (default: 'cpk') */
  capabilityBoxplotMetric?: 'cp' | 'cpk';
  /** Dashboard layout mode: grid (2x2 viewport-fit) or scroll (stacked full-width) */
  dashboardLayout?: 'grid' | 'scroll';
}

/**
 * Custom chart titles for reporting/export
 */
export interface ChartTitles {
  ichart?: string;
  boxplot?: string;
  pareto?: string;
}

/**
 * Pareto chart data mode
 * - 'derived': Generate from main data using factors
 * - 'separate': Use separately uploaded Pareto data file
 */
export type ParetoMode = 'derived' | 'separate';

/**
 * Pareto chart aggregation mode
 * - 'count': Count occurrences per category (default)
 * - 'value': Sum of outcome values per category (e.g., total duration per reason)
 */
export type ParetoAggregation = 'count' | 'value';

// ============================================================================
// View State
// ============================================================================

/**
 * Lightweight view state persisted with project.
 * Captures where the analyst was working so reload resumes their context.
 */
export interface ViewState {
  activeView?: 'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report';
  activeTab?: 'analysis' | 'performance' | 'yamazumi';
  isFindingsOpen?: boolean;
  isWhatIfOpen?: boolean;
  focusedChart?:
    | 'ichart'
    | 'boxplot'
    | 'pareto'
    | 'yamazumi'
    | 'histogram'
    | 'probability-plot'
    | null;
  boxplotFactor?: string;
  paretoFactor?: string;
  findingsViewMode?: 'list' | 'board' | 'tree';
  /** Yamazumi I-Chart metric selector */
  yamazumiIChartMetric?: YamazumiIChartMetric;
  /** Yamazumi Pareto mode selector */
  yamazumiParetoMode?: YamazumiParetoMode;
}
