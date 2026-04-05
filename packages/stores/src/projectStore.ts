/**
 * projectStore — Zustand store for dataset + configuration + project lifecycle state
 *
 * Holds all data/config state previously managed by useDataState in the hooks package.
 * No computed/derived state (filteredData, stats) — those are handled by selectors.
 * No React imports — pure Zustand, framework-agnostic.
 */

import { create } from 'zustand';
import type {
  DataRow,
  SpecLimits,
  AnalysisMode,
  YamazumiColumnMapping,
  SubgroupConfig,
  FilterAction,
  ProcessContext,
  EntryScenario,
  InvestigationCategory,
  Finding,
  Question,
  SuspectedCause,
  CausalLink,
  ParetoRow,
  DataQualityReport,
} from '@variscout/core';

// ============================================================================
// Local type definitions
// Types from @variscout/hooks are reproduced here to avoid a hooks dependency.
// Keep in sync with packages/hooks/src/types.ts.
// ============================================================================

/** Y-axis scale mode */
export type ScaleMode = 'auto' | 'clampZero' | 'manual';

/** Highlight color for chart annotations */
export type HighlightColor = 'red' | 'amber' | 'green';

/** Pareto chart data mode */
export type ParetoMode = 'derived' | 'separate';

/** Pareto chart aggregation mode */
export type ParetoAggregation = 'count' | 'value';

/** Stage order determination mode */
export type StageOrderMode = 'auto' | 'data-order';

// ParetoRow is imported from @variscout/core above and re-exported here for stores consumers
export type { ParetoRow };

export type { DataQualityReport };

/** Display options for chart visualizations */
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
  boxplotSortBy?: 'name' | 'mean' | 'spread';
  /** Boxplot category sort direction (default: 'asc') */
  boxplotSortDirection?: 'asc' | 'desc';
  /** Highlighted boxplot categories (category key → color) */
  boxplotHighlights?: Record<string, HighlightColor>;
  /** Highlighted pareto categories (category key → color) */
  paretoHighlights?: Record<string, HighlightColor>;
  /** Show specification limits on I-Chart (default: true) */
  showSpecs?: boolean;
  /** Show Cpk values in stats panel (default: true) */
  showCpk?: boolean;
  /** Dashboard layout mode */
  dashboardLayout?: 'grid' | 'scroll';
  /** Capability boxplot metric */
  capabilityBoxplotMetric?: 'cp' | 'cpk';
  /** Standard I-Chart metric toggle: measurement data or capability (Cpk/Cp) */
  standardIChartMetric?: 'measurement' | 'capability';
}

/** Custom chart titles for reporting/export */
export interface ChartTitles {
  ichart?: string;
  boxplot?: string;
  pareto?: string;
}

/** Axis settings for Y-axis manual override */
export interface AxisSettings {
  min?: number;
  max?: number;
  scaleMode?: ScaleMode;
}

/** View state persisted with project (analyst's working context) */
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
}

// ============================================================================
// Serialized project shape (for loadProject)
// ============================================================================

export interface SerializedProject {
  projectId: string;
  projectName: string;
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: SpecLimits;
  analysisMode: AnalysisMode;
  // Optional fields
  dataFilename?: string | null;
  dataQualityReport?: DataQualityReport | null;
  timeColumn?: string | null;
  columnAliases?: Record<string, string>;
  valueLabels?: Record<string, Record<string, string>>;
  measureSpecs?: Record<string, SpecLimits>;
  stageColumn?: string | null;
  stageOrderMode?: StageOrderMode;
  measureColumns?: string[];
  measureLabel?: string;
  selectedMeasure?: string | null;
  cpkTarget?: number | undefined;
  yamazumiMapping?: YamazumiColumnMapping | null;
  subgroupConfig?: SubgroupConfig;
  filters?: Record<string, (string | number)[]>;
  filterStack?: FilterAction[];
  axisSettings?: AxisSettings;
  displayOptions?: DisplayOptions;
  chartTitles?: ChartTitles;
  paretoMode?: ParetoMode;
  paretoAggregation?: ParetoAggregation;
  separateParetoData?: ParetoRow[] | null;
  separateParetoFilename?: string | null;
  processContext?: ProcessContext;
  entryScenario?: EntryScenario;
  viewState?: ViewState | null;
  findings?: Finding[];
  questions?: Question[];
  categories?: InvestigationCategory[];
  suspectedCauses?: SuspectedCause[];
  causalLinks?: CausalLink[];
}

// ============================================================================
// State + Actions
// ============================================================================

export interface ProjectState {
  // Project lifecycle
  projectId: string | null;
  projectName: string | null;
  hasUnsavedChanges: boolean;

  // Raw dataset
  rawData: DataRow[];
  dataFilename: string | null;
  dataQualityReport: DataQualityReport | null;

  // Column configuration
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;

  // Analysis configuration
  analysisMode: AnalysisMode;
  specs: SpecLimits;
  measureSpecs: Record<string, SpecLimits>;
  stageColumn: string | null;
  stageOrderMode: StageOrderMode;

  // Performance mode
  measureColumns: string[];
  measureLabel: string;
  selectedMeasure: string | null;
  cpkTarget: number | undefined;

  // Yamazumi mode
  yamazumiMapping: YamazumiColumnMapping | null;

  // Subgroup capability
  subgroupConfig: SubgroupConfig;

  // Filters and display
  filters: Record<string, (string | number)[]>;
  filterStack: FilterAction[];
  axisSettings: AxisSettings;
  displayOptions: DisplayOptions;
  chartTitles: ChartTitles;

  // Pareto configuration
  paretoMode: ParetoMode;
  paretoAggregation: ParetoAggregation;
  separateParetoData: ParetoRow[] | null;
  separateParetoFilename: string | null;

  // AI / investigation context
  processContext: ProcessContext | null;
  entryScenario: EntryScenario | null;

  // Multi-point selection (ephemeral, not persisted — Minitab-style brushing)
  selectedPoints: Set<number>;
  selectionIndexMap: Map<number, number>;

  // View state (for restoring analyst's working context on project load)
  viewState: ViewState | null;

  // Findings and questions (stored here for serialization; feature stores manage editing)
  findings: Finding[];
  questions: Question[];
  categories: InvestigationCategory[];
}

export interface ProjectActions {
  // Project lifecycle
  setProjectId: (id: string | null) => void;
  setProjectName: (name: string | null) => void;
  markSaved: () => void;
  markUnsaved: () => void;
  newProject: () => void;
  loadProject: (serialized: SerializedProject) => void;

  // Dataset
  setRawData: (data: DataRow[]) => void;
  setDataFilename: (filename: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;

  // Column configuration
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setTimeColumn: (col: string | null) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  setValueLabels: (labels: Record<string, Record<string, string>>) => void;

  // Analysis configuration
  setAnalysisMode: (mode: AnalysisMode) => void;
  setSpecs: (specs: SpecLimits) => void;
  setMeasureSpecs: (specs: Record<string, SpecLimits>) => void;
  setStageColumn: (col: string | null) => void;
  setStageOrderMode: (mode: StageOrderMode) => void;

  // Performance mode
  setMeasureColumns: (columns: string[]) => void;
  setMeasureLabel: (label: string) => void;
  setSelectedMeasure: (measureId: string | null) => void;
  setCpkTarget: (target: number | undefined) => void;

  // Yamazumi mode
  setYamazumiMapping: (mapping: YamazumiColumnMapping | null) => void;

  // Subgroup capability
  setSubgroupConfig: (config: SubgroupConfig) => void;

  // Filters and display
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  setFilterStack: (stack: FilterAction[]) => void;
  setAxisSettings: (settings: AxisSettings) => void;
  setDisplayOptions: (options: DisplayOptions) => void;
  setChartTitles: (titles: ChartTitles) => void;

  // Pareto
  setParetoMode: (mode: ParetoMode) => void;
  setParetoAggregation: (mode: ParetoAggregation) => void;
  setSeparateParetoData: (data: ParetoRow[] | null) => void;
  setSeparateParetoFilename: (filename: string | null) => void;

  // AI / investigation context
  setProcessContext: (context: ProcessContext | null) => void;
  setEntryScenario: (scenario: EntryScenario | null) => void;

  // Selection (ephemeral)
  setSelectedPoints: (points: Set<number>) => void;
  addToSelection: (indices: number[]) => void;
  removeFromSelection: (indices: number[]) => void;
  clearSelection: () => void;
  togglePointSelection: (index: number) => void;
  setSelectionIndexMap: (map: Map<number, number>) => void;

  // View state
  setViewState: (state: ViewState | null) => void;

  // Findings and questions
  setFindings: (findings: Finding[]) => void;
  setQuestions: (questions: Question[]) => void;
  setCategories: (categories: InvestigationCategory[]) => void;
}

// ============================================================================
// Default values
// ============================================================================

const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  lockYAxisToFullData: true,
  showControlLimits: true,
  showViolin: false,
  showFilterContext: true,
};

const DEFAULT_SUBGROUP_CONFIG: SubgroupConfig = {
  size: 1,
  method: 'fixed-size',
};

const initialState: ProjectState = {
  projectId: null,
  projectName: null,
  hasUnsavedChanges: false,
  rawData: [],
  dataFilename: null,
  dataQualityReport: null,
  outcome: null,
  factors: [],
  timeColumn: null,
  columnAliases: {},
  valueLabels: {},
  analysisMode: 'standard',
  specs: {},
  measureSpecs: {},
  stageColumn: null,
  stageOrderMode: 'auto',
  measureColumns: [],
  measureLabel: 'Measure',
  selectedMeasure: null,
  cpkTarget: undefined,
  yamazumiMapping: null,
  subgroupConfig: DEFAULT_SUBGROUP_CONFIG,
  filters: {},
  filterStack: [],
  axisSettings: {},
  displayOptions: DEFAULT_DISPLAY_OPTIONS,
  chartTitles: {},
  paretoMode: 'derived',
  paretoAggregation: 'count',
  separateParetoData: null,
  separateParetoFilename: null,
  processContext: null,
  entryScenario: null,
  selectedPoints: new Set(),
  selectionIndexMap: new Map(),
  viewState: null,
  findings: [],
  questions: [],
  categories: [],
};

// ============================================================================
// Store
// ============================================================================

/** Helper that creates a setter which updates a field and marks unsaved */
const setAndMark =
  <K extends keyof ProjectState>(
    set: (fn: (s: ProjectState & ProjectActions) => Partial<ProjectState & ProjectActions>) => void,
    key: K
  ) =>
  (value: ProjectState[K]) =>
    set(
      () => ({ [key]: value, hasUnsavedChanges: true }) as Partial<ProjectState & ProjectActions>
    );

export const useProjectStore = create<ProjectState & ProjectActions>()(set => ({
  ...initialState,

  // --- Project lifecycle ---

  setProjectId: id => set(() => ({ projectId: id, hasUnsavedChanges: true })),
  setProjectName: name => set(() => ({ projectName: name, hasUnsavedChanges: true })),
  markSaved: () => set(() => ({ hasUnsavedChanges: false })),
  markUnsaved: () => set(() => ({ hasUnsavedChanges: true })),

  newProject: () => set(() => ({ ...initialState })),

  loadProject: serialized =>
    set(() => ({
      ...initialState,
      projectId: serialized.projectId,
      projectName: serialized.projectName,
      rawData: serialized.rawData,
      outcome: serialized.outcome,
      factors: serialized.factors,
      specs: serialized.specs,
      analysisMode: serialized.analysisMode,
      // Optional fields — fall back to initialState defaults
      dataFilename: serialized.dataFilename ?? null,
      dataQualityReport: serialized.dataQualityReport ?? null,
      timeColumn: serialized.timeColumn ?? null,
      columnAliases: serialized.columnAliases ?? {},
      valueLabels: serialized.valueLabels ?? {},
      measureSpecs: serialized.measureSpecs ?? {},
      stageColumn: serialized.stageColumn ?? null,
      stageOrderMode: serialized.stageOrderMode ?? 'auto',
      measureColumns: serialized.measureColumns ?? [],
      measureLabel: serialized.measureLabel ?? 'Measure',
      selectedMeasure: serialized.selectedMeasure ?? null,
      cpkTarget: serialized.cpkTarget,
      yamazumiMapping: serialized.yamazumiMapping ?? null,
      subgroupConfig: serialized.subgroupConfig ?? DEFAULT_SUBGROUP_CONFIG,
      filters: serialized.filters ?? {},
      filterStack: serialized.filterStack ?? [],
      axisSettings: serialized.axisSettings ?? {},
      displayOptions: serialized.displayOptions ?? DEFAULT_DISPLAY_OPTIONS,
      chartTitles: serialized.chartTitles ?? {},
      paretoMode: serialized.paretoMode ?? 'derived',
      paretoAggregation: serialized.paretoAggregation ?? 'count',
      separateParetoData: serialized.separateParetoData ?? null,
      separateParetoFilename: serialized.separateParetoFilename ?? null,
      processContext: serialized.processContext ?? null,
      entryScenario: serialized.entryScenario ?? null,
      viewState: serialized.viewState ?? null,
      selectedPoints: new Set(),
      selectionIndexMap: new Map(),
      findings: serialized.findings ?? [],
      questions: serialized.questions ?? [],
      categories: serialized.categories ?? [],
      hasUnsavedChanges: false,
    })),

  // --- Dataset setters ---

  setRawData: setAndMark(set, 'rawData'),
  setDataFilename: setAndMark(set, 'dataFilename'),
  setDataQualityReport: setAndMark(set, 'dataQualityReport'),

  // --- Column configuration ---

  setOutcome: setAndMark(set, 'outcome'),
  setFactors: setAndMark(set, 'factors'),
  setTimeColumn: setAndMark(set, 'timeColumn'),
  setColumnAliases: setAndMark(set, 'columnAliases'),
  setValueLabels: setAndMark(set, 'valueLabels'),

  // --- Analysis configuration ---

  setAnalysisMode: setAndMark(set, 'analysisMode'),
  setSpecs: setAndMark(set, 'specs'),
  setMeasureSpecs: setAndMark(set, 'measureSpecs'),
  setStageColumn: setAndMark(set, 'stageColumn'),
  setStageOrderMode: setAndMark(set, 'stageOrderMode'),

  // --- Performance mode ---

  setMeasureColumns: setAndMark(set, 'measureColumns'),
  setMeasureLabel: setAndMark(set, 'measureLabel'),
  setSelectedMeasure: setAndMark(set, 'selectedMeasure'),
  setCpkTarget: setAndMark(set, 'cpkTarget'),

  // --- Yamazumi mode ---

  setYamazumiMapping: setAndMark(set, 'yamazumiMapping'),

  // --- Subgroup capability ---

  setSubgroupConfig: setAndMark(set, 'subgroupConfig'),

  // --- Filters and display ---

  setFilters: setAndMark(set, 'filters'),
  setFilterStack: setAndMark(set, 'filterStack'),
  setAxisSettings: setAndMark(set, 'axisSettings'),
  setDisplayOptions: setAndMark(set, 'displayOptions'),
  setChartTitles: setAndMark(set, 'chartTitles'),

  // --- Pareto ---

  setParetoMode: setAndMark(set, 'paretoMode'),
  setParetoAggregation: setAndMark(set, 'paretoAggregation'),
  setSeparateParetoData: setAndMark(set, 'separateParetoData'),
  setSeparateParetoFilename: setAndMark(set, 'separateParetoFilename'),

  // --- AI / investigation context ---

  setProcessContext: setAndMark(set, 'processContext'),
  setEntryScenario: setAndMark(set, 'entryScenario'),

  // --- Selection (ephemeral — not marked as unsaved) ---

  setSelectedPoints: points => set(() => ({ selectedPoints: points })),
  addToSelection: indices =>
    set(s => {
      const newSet = new Set(s.selectedPoints);
      indices.forEach(i => newSet.add(i));
      return { selectedPoints: newSet };
    }),
  removeFromSelection: indices =>
    set(s => {
      const newSet = new Set(s.selectedPoints);
      indices.forEach(i => newSet.delete(i));
      return { selectedPoints: newSet };
    }),
  clearSelection: () => set(() => ({ selectedPoints: new Set() })),
  togglePointSelection: index =>
    set(s => {
      const newSet = new Set(s.selectedPoints);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return { selectedPoints: newSet };
    }),
  setSelectionIndexMap: map => set(() => ({ selectionIndexMap: map })),

  // --- View state ---

  setViewState: setAndMark(set, 'viewState'),

  // --- Findings and questions ---

  setFindings: setAndMark(set, 'findings'),
  setQuestions: setAndMark(set, 'questions'),
  setCategories: setAndMark(set, 'categories'),
}));

// Expose getInitialState for test resets (Zustand v5 provides this built-in,
// but we also export from the const to be explicit).
export const getProjectInitialState = (): ProjectState => ({ ...initialState });
