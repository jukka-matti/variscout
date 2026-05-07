/**
 * projectStore — Zustand store for dataset + configuration + project lifecycle state
 *
 * Holds all data/config state previously managed by useDataState in the hooks package.
 * No computed/derived state (filteredData, stats) — those are handled by selectors.
 * No React imports — pure Zustand, framework-agnostic.
 */

import { create } from 'zustand';
import { useViewStore } from './viewStore';
import type {
  DataRow,
  SpecLimits,
  AnalysisMode,
  YamazumiColumnMapping,
  DefectMapping,
  SubgroupConfig,
  FilterAction,
  StageOrderMode,
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
import type {
  ParetoMode,
  ParetoAggregation,
  DisplayOptions,
  ChartTitles,
  AxisSettings,
  ViewState,
} from '@variscout/core/ui-types';

// Re-export canonical UI types for store consumers
export type {
  ScaleMode,
  HighlightColor,
  ParetoMode,
  ParetoAggregation,
  DisplayOptions,
  ChartTitles,
  AxisSettings,
  ViewState,
} from '@variscout/core/ui-types';

// Re-export core types for store consumers
export type { ParetoRow };
export type { DataQualityReport };

export const STORE_LAYER = 'document' as const;

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
  defectMapping?: DefectMapping | null;
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

  // Defect mode
  defectMapping: DefectMapping | null;

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
  setMeasureSpec: (column: string, partial: Partial<SpecLimits>) => void;
  setStageColumn: (col: string | null) => void;
  setStageOrderMode: (mode: StageOrderMode) => void;

  // Performance mode
  setMeasureColumns: (columns: string[]) => void;
  setMeasureLabel: (label: string) => void;
  setSelectedMeasure: (measureId: string | null) => void;
  setCpkTarget: (target: number | undefined) => void;

  // Yamazumi mode
  setYamazumiMapping: (mapping: YamazumiColumnMapping | null) => void;
  // Defect mode
  setDefectMapping: (mapping: DefectMapping | null) => void;

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
  defectMapping: null,
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

  newProject: () => {
    set(() => ({ ...initialState }));
    useViewStore.getState().clearTransientSelections();
  },

  loadProject: serialized => {
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
      defectMapping: serialized.defectMapping ?? null,
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
      findings: serialized.findings ?? [],
      questions: serialized.questions ?? [],
      categories: serialized.categories ?? [],
      hasUnsavedChanges: false,
    }));
    useViewStore.getState().clearTransientSelections();
  },

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
  setMeasureSpec: (column, partial) =>
    set(state => ({
      measureSpecs: {
        ...state.measureSpecs,
        [column]: { ...(state.measureSpecs[column] ?? {}), ...partial },
      },
      hasUnsavedChanges: true,
    })),
  setStageColumn: setAndMark(set, 'stageColumn'),
  setStageOrderMode: setAndMark(set, 'stageOrderMode'),

  // --- Performance mode ---

  setMeasureColumns: setAndMark(set, 'measureColumns'),
  setMeasureLabel: setAndMark(set, 'measureLabel'),
  setSelectedMeasure: setAndMark(set, 'selectedMeasure'),
  setCpkTarget: setAndMark(set, 'cpkTarget'),

  // --- Yamazumi mode ---

  setYamazumiMapping: setAndMark(set, 'yamazumiMapping'),
  setDefectMapping: setAndMark(set, 'defectMapping'),

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
