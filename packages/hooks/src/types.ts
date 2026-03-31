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
  BoxplotSortBy,
  BoxplotSortDirection,
  FilterAction,
  StageOrderMode,
  Finding,
  Hypothesis,
  ProcessContext,
  InvestigationCategory,
  EntryScenario,
  StackConfig,
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
  stats: StatsResult | null;

  // Filters & Settings
  filters: Record<string, (string | number)[]>;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;
}

// ============================================================================
// Annotation Types
// ============================================================================

/** Highlight color for annotated chart elements */
export type HighlightColor = 'red' | 'amber' | 'green';

// ============================================================================
// Persistence Types - For shared DataContext hook
// ============================================================================

/**
 * Display options for capability metrics
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
  /** Highlighted boxplot categories (category key → color) */
  boxplotHighlights?: Record<string, HighlightColor>;
  /** Highlighted pareto categories (category key → color) */
  paretoHighlights?: Record<string, HighlightColor>;
  /** Show specification limits on I-Chart (default: true) */
  showSpecs?: boolean;
  /** Show Cpk values in stats panel (default: true) */
  showCpk?: boolean;
  /** Standard I-Chart metric mode (default: 'measurement') */
  standardIChartMetric?: import('@variscout/core').StandardIChartMetric;
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

/**
 * Lightweight view state persisted with project.
 * Captures where the analyst was working so reload resumes their context.
 */
export interface ViewState {
  activeView?: 'dashboard' | 'editor';
  activeTab?: 'analysis' | 'performance' | 'yamazumi';
  isFindingsOpen?: boolean;
  isWhatIfOpen?: boolean;
  isImprovementOpen?: boolean;
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
  yamazumiIChartMetric?: import('@variscout/core').YamazumiIChartMetric;
  /** Yamazumi Pareto mode selector */
  yamazumiParetoMode?: import('@variscout/core').YamazumiParetoMode;
}

/**
 * Saved analysis state
 */
export interface AnalysisState {
  version: string;
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: SpecLimits;
  /** Per-measure spec overrides for Performance Mode (keyed by measure column name) */
  measureSpecs?: Record<string, SpecLimits>;
  filters: Record<string, (string | number)[]>;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  columnAliases?: Record<string, string>;
  valueLabels?: Record<string, Record<string, string>>;
  displayOptions?: DisplayOptions;

  // --- Quick-win workflow fields (Phase 1) ---
  /** Cpk target for Performance Mode (default: 1.33) */
  cpkTarget?: number;
  /** Staged analysis column */
  stageColumn?: string | null;
  /** Stage ordering mode */
  stageOrderMode?: StageOrderMode;
  /** Analysis mode: standard, performance, or yamazumi */
  analysisMode?: import('@variscout/core').AnalysisMode;
  /** Yamazumi column role mapping */
  yamazumiMapping?: import('@variscout/core').YamazumiColumnMapping;
  /** Selected measure columns for Performance Mode */
  measureColumns?: string[];
  /** Active channel drill in Performance Mode */
  selectedMeasure?: string | null;
  /** Measure axis label (default: 'Measure') */
  measureLabel?: string;
  /** Custom chart titles for reporting/export */
  chartTitles?: ChartTitles;

  // --- Pareto configuration ---
  /** Pareto chart data mode (default: 'derived') */
  paretoMode?: ParetoMode;
  /** Pareto chart aggregation mode (default: 'count') */
  paretoAggregation?: 'count' | 'value';
  /** Separately uploaded Pareto data (when paretoMode = 'separate') */
  separateParetoData?: ParetoRow[];

  // --- Time column ---
  /** Time column for I-Chart ordering */
  timeColumn?: string | null;

  // --- Filter stack ordering (Phase 2) ---
  /** Ordered filter drill trail — reconstructs breadcrumbs on reload */
  filterStack?: FilterAction[];

  // --- Stack (wide-form to long-form transform) ---
  /** Stack config if data was reshaped from wide-form. Re-applied on project reload. */
  stackConfig?: StackConfig;

  // --- View state (Phase 4) ---
  /** Where the analyst was working (tab, panels, focused chart) */
  viewState?: ViewState;

  // --- Findings (scouting report) ---
  /** Analyst findings — bookmarked filter states with notes */
  findings?: Finding[];
  /** ID of the active benchmark finding (Phase 3) */
  benchmarkFindingId?: string;

  // --- Hypotheses (causal theories linked to findings) ---
  /** Causal hypotheses for investigation workflow */
  hypotheses?: Hypothesis[];

  // --- Investigation categories (dynamic factor grouping) ---
  /** User-defined categories grouping factor columns */
  categories?: InvestigationCategory[];

  // --- AI process context ---
  /** Process description for AI grounding */
  processContext?: ProcessContext;

  // --- Entry scenario ---
  /** What prompted the analyst to start this analysis */
  entryScenario?: EntryScenario;

  // --- Knowledge Base scope (ADR-026) ---
  /** Custom SharePoint folder path for Knowledge Base search (overrides channel folder) */
  knowledgeSearchFolder?: string;

  // --- Improvement prioritization (ADR-035) ---
  /** Risk matrix axis configuration (default: process × safety) */
  riskAxisConfig?: import('@variscout/core').RiskAxisConfig;
  /** Budget for improvement planning */
  budgetConfig?: import('@variscout/core').BudgetConfig;

  // --- Subgroup capability analysis ---
  /** Subgroup configuration for capability mode */
  subgroupConfig?: import('@variscout/core').SubgroupConfig;
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
