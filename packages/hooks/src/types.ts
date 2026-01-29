/**
 * Shared types for @variscout/hooks package
 *
 * These interfaces abstract the data context dependencies
 * allowing hooks to be used across different apps (PWA, Azure)
 */

import type {
  DataRow,
  StatsResult,
  SpecLimits,
  DataQualityReport,
  ParetoRow,
} from '@variscout/core';

// Re-export for convenience
export type { DataQualityReport, ParetoRow };

/**
 * Y-axis scale mode
 * - 'auto': Automatically calculate range from data, specs, and control limits
 * - 'clampZero': Start Y-axis at zero, auto-calculate max
 * - 'manual': Use explicit min/max values from axisSettings
 */
export type ScaleMode = 'auto' | 'clampZero' | 'manual';

/**
 * Minimal interface for chart scale calculation
 * Apps inject their context data matching this shape
 */
export interface ChartScaleContext {
  filteredData: DataRow[];
  outcome: string | null;
  specs: SpecLimits;
  grades?: { max: number; label: string; color: string }[];
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
}

/**
 * Minimal interface for filter navigation functionality
 * Apps inject their context data matching this shape
 */
export interface FilterNavigationContext {
  filters: Record<string, (string | number)[]>;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  columnAliases: Record<string, string>;
}

/**
 * Minimal interface for variation tracking
 * Apps inject their context data matching this shape
 */
export interface VariationTrackingContext {
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
}

/**
 * Full DataContext interface for components that need broad access
 * This mirrors the PWA/Azure DataContext but as an abstract interface
 */
export interface DataContextInterface {
  // Data
  rawData: DataRow[];
  filteredData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: SpecLimits;
  grades?: { max: number; label: string; color: string }[];
  stats: StatsResult | null;

  // Filters & Settings
  filters: Record<string, (string | number)[]>;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;
}

// ============================================================================
// Persistence Types - For shared DataContext hook
// ============================================================================

/**
 * Display options for capability metrics
 */
export interface DisplayOptions {
  showCp: boolean;
  showCpk: boolean;
  showSpecs?: boolean;
  /** Lock Y-axis to full dataset range when filtering (default: true) */
  lockYAxisToFullData?: boolean;
  /** Show control limits (UCL/Mean/LCL) on I-Chart (default: true) */
  showControlLimits?: boolean;
  /** Show category contribution labels below boxplot boxes (default: false) */
  showContributionLabels?: boolean;
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

/**
 * Saved analysis state
 */
export interface AnalysisState {
  version: string;
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: { usl?: number; lsl?: number; target?: number };
  /** Per-measure spec overrides for Performance Mode (keyed by measure column name) */
  measureSpecs?: Record<string, { usl?: number; lsl?: number; target?: number }>;
  grades: { max: number; label: string; color: string }[];
  filters: Record<string, (string | number)[]>;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  columnAliases?: Record<string, string>;
  valueLabels?: Record<string, Record<string, string>>;
  displayOptions?: DisplayOptions;
}

/**
 * Saved project metadata
 */
export interface SavedProject {
  id: string;
  name: string;
  state: AnalysisState;
  savedAt: string;
  rowCount: number;
  location?: string; // Azure app uses this for team/personal
}

/**
 * Persistence adapter interface
 * Allows apps to provide their own storage implementations
 */
export interface PersistenceAdapter {
  /** Save project to storage */
  saveProject: (name: string, state: Omit<AnalysisState, 'version'>) => Promise<SavedProject>;

  /** Load project from storage */
  loadProject: (id: string) => Promise<SavedProject | undefined>;

  /** List all saved projects */
  listProjects: () => Promise<SavedProject[]>;

  /** Delete project from storage */
  deleteProject: (id: string) => Promise<void>;

  /** Rename project in storage */
  renameProject: (id: string, newName: string) => Promise<void>;

  /** Export state to file */
  exportToFile: (state: Omit<AnalysisState, 'version'>, filename: string) => void;

  /** Import state from file */
  importFromFile: (file: File) => Promise<AnalysisState>;
}

/**
 * Debounce utility type
 */
export type DebouncedFunction<T extends (...args: unknown[]) => void> = T & {
  cancel: () => void;
};

// ============================================================================
// Chart Types
// ============================================================================

/**
 * Chart scale result
 */
export interface ChartScaleResult {
  min: number;
  max: number;
}
