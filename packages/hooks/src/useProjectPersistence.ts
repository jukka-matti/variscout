/**
 * useProjectPersistence - Project save/load/export/import actions
 *
 * Extracts persistence-related callbacks from useDataState into a focused hook:
 * getCurrentState, saveProject, loadProject, listProjects, deleteProject,
 * renameProject, exportProject, importProject, newProject.
 *
 * Internal to useDataState -- not exported from the package.
 */

import { useCallback } from 'react';
import type {
  DataRow,
  SpecLimits,
  StageOrderMode,
  FilterAction,
  Finding,
  Question,
  InvestigationCategory,
  AnalysisMode,
  YamazumiColumnMapping,
  SubgroupConfig,
} from '@variscout/core';
import type {
  AnalysisState,
  DisplayOptions,
  PersistenceAdapter,
  SavedProject,
  ChartTitles,
  ParetoMode,
  DataQualityReport,
  ParetoRow,
  ScaleMode,
  ViewState,
} from './types';

// ============================================================================
// Types
// ============================================================================

export interface ProjectPersistenceInputs {
  persistence: PersistenceAdapter;

  // State getters for getCurrentState
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: SpecLimits;
  measureSpecs: Record<string, SpecLimits>;
  filters: Record<string, (string | number)[]>;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;
  displayOptions: DisplayOptions;
  currentProjectId: string | null;

  // Quick-win workflow getters (Phase 1)
  cpkTarget: number | undefined;
  stageColumn: string | null;
  stageOrderMode: StageOrderMode;
  measureColumns: string[];
  selectedMeasure: string | null;
  measureLabel: string;
  chartTitles: ChartTitles;

  // Analysis mode (yamazumi/performance/standard)
  analysisMode: AnalysisMode;
  yamazumiMapping: YamazumiColumnMapping | null;
  subgroupConfig: SubgroupConfig;

  // Pareto getters
  paretoMode: ParetoMode;
  paretoAggregation: 'count' | 'value';
  separateParetoData: ParetoRow[] | null;

  // Time column getter
  timeColumn: string | null;

  // Filter stack getter (Phase 2)
  filterStack: FilterAction[];

  // View state getter (Phase 4)
  viewState: ViewState | null;

  // Findings getter
  findings: Finding[];

  // Questions getter
  questions: Question[];

  // Categories getter
  categories: InvestigationCategory[];

  // All setters for load/import/new
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setTimeColumn: (col: string | null) => void;
  setSpecs: (specs: SpecLimits) => void;
  setMeasureSpecs: (specs: Record<string, SpecLimits>) => void;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  setAxisSettings: (settings: { min?: number; max?: number; scaleMode?: ScaleMode }) => void;
  setChartTitles: (titles: ChartTitles) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  setValueLabels: (labels: Record<string, Record<string, string>>) => void;
  setDisplayOptions: (options: DisplayOptions) => void;
  setCurrentProjectId: (id: string | null) => void;
  setCurrentProjectName: (name: string | null) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  setDataFilename: (filename: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setParetoMode: (mode: ParetoMode) => void;
  setParetoAggregation: (mode: 'count' | 'value') => void;
  setSeparateParetoData: (data: ParetoRow[] | null) => void;
  setSeparateParetoFilename: (filename: string | null) => void;
  setStageColumn: (col: string | null) => void;
  setStageOrderMode: (mode: StageOrderMode) => void;
  setMeasureColumns: (columns: string[]) => void;
  setMeasureLabel: (label: string) => void;
  setSelectedMeasure: (measureId: string | null) => void;
  setCpkTarget: (target: number | undefined) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setYamazumiMapping: (mapping: YamazumiColumnMapping | null) => void;
  setSubgroupConfig: (config: SubgroupConfig) => void;

  // Filter stack setter (Phase 2)
  setFilterStack: (stack: FilterAction[]) => void;

  // View state setter (Phase 4)
  setViewState: (state: ViewState | null) => void;

  // Findings setter
  setFindings: (findings: Finding[]) => void;

  // Questions setter
  setQuestions: (questions: Question[]) => void;

  // Categories setter
  setCategories: (categories: InvestigationCategory[]) => void;
}

export interface ProjectPersistenceResult {
  saveProject: (name: string) => Promise<SavedProject>;
  loadProject: (id: string) => Promise<void>;
  listProjects: () => Promise<SavedProject[]>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, newName: string) => Promise<void>;
  exportProject: (filename: string) => void;
  importProject: (file: File) => Promise<void>;
  newProject: () => void;
}

// ============================================================================
// Default Values (duplicated from useDataState for newProject reset)
// ============================================================================

const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  lockYAxisToFullData: true,
  showControlLimits: true,
  showViolin: false,
  showFilterContext: true,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useProjectPersistence(inputs: ProjectPersistenceInputs): ProjectPersistenceResult {
  const {
    persistence,
    rawData,
    outcome,
    factors,
    specs,
    measureSpecs,
    filters,
    axisSettings,
    columnAliases,
    valueLabels,
    displayOptions,
    currentProjectId,
    cpkTarget,
    stageColumn,
    stageOrderMode,
    measureColumns,
    selectedMeasure,
    measureLabel,
    chartTitles,
    analysisMode,
    yamazumiMapping,
    subgroupConfig,
    paretoMode,
    paretoAggregation,
    separateParetoData,
    timeColumn,
    filterStack,
    viewState,
    setRawData,
    setOutcome,
    setFactors,
    setTimeColumn,
    setSpecs,
    setMeasureSpecs,
    setFilters,
    setAxisSettings,
    setChartTitles,
    setColumnAliases,
    setValueLabels,
    setDisplayOptions,
    setCurrentProjectId,
    setCurrentProjectName,
    setHasUnsavedChanges,
    setDataFilename,
    setDataQualityReport,
    setParetoMode,
    setParetoAggregation,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setStageColumn,
    setStageOrderMode,
    setMeasureColumns,
    setMeasureLabel,
    setSelectedMeasure,
    setCpkTarget,
    setAnalysisMode,
    setYamazumiMapping,
    setSubgroupConfig,
    setFilterStack,
    setViewState,
    findings,
    setFindings,
    questions,
    setQuestions,
    categories,
    setCategories,
  } = inputs;

  // ---------------------------------------------------------------------------
  // State snapshot for persistence
  // ---------------------------------------------------------------------------

  const getCurrentState = useCallback((): Omit<AnalysisState, 'version'> => {
    const state: Omit<AnalysisState, 'version'> = {
      rawData,
      outcome,
      factors,
      specs,
      measureSpecs: Object.keys(measureSpecs).length > 0 ? measureSpecs : undefined,
      filters,
      axisSettings,
      columnAliases,
      valueLabels,
      displayOptions,
    };

    // Quick-win fields — only include non-default values for compact serialization
    if (cpkTarget !== undefined) state.cpkTarget = cpkTarget;
    if (stageColumn !== null) state.stageColumn = stageColumn;
    if (stageOrderMode !== 'auto') state.stageOrderMode = stageOrderMode;
    if (measureColumns.length > 0) state.measureColumns = measureColumns;
    if (selectedMeasure !== null) state.selectedMeasure = selectedMeasure;
    if (measureLabel !== 'Measure') state.measureLabel = measureLabel;
    if (Object.keys(chartTitles).length > 0) state.chartTitles = chartTitles;

    // Analysis mode — only include non-default values for compact serialization
    if (analysisMode !== 'standard') state.analysisMode = analysisMode;
    if (yamazumiMapping) state.yamazumiMapping = yamazumiMapping;
    if (subgroupConfig && (subgroupConfig.method !== 'fixed-size' || subgroupConfig.size !== 5)) {
      state.subgroupConfig = subgroupConfig;
    }

    // Pareto fields — only include non-default values for compact serialization
    if (paretoMode !== 'derived') state.paretoMode = paretoMode;
    if (paretoAggregation !== 'count') state.paretoAggregation = paretoAggregation;
    if (separateParetoData) state.separateParetoData = separateParetoData;

    // Time column — only include if set
    if (timeColumn) state.timeColumn = timeColumn;

    // Filter stack — only include if non-empty
    if (filterStack.length > 0) state.filterStack = filterStack;

    // View state — always include for explicit round-trip
    if (viewState) state.viewState = viewState;

    // Findings — only include if non-empty
    if (findings.length > 0) state.findings = findings;

    // Questions — only include if non-empty
    if (questions.length > 0) state.questions = questions;

    // Categories — only include if non-empty
    if (categories.length > 0) state.categories = categories;

    return state;
  }, [
    rawData,
    outcome,
    factors,
    specs,
    measureSpecs,
    filters,
    axisSettings,
    columnAliases,
    valueLabels,
    displayOptions,
    cpkTarget,
    stageColumn,
    stageOrderMode,
    measureColumns,
    selectedMeasure,
    measureLabel,
    chartTitles,
    analysisMode,
    yamazumiMapping,
    subgroupConfig,
    paretoMode,
    paretoAggregation,
    separateParetoData,
    timeColumn,
    filterStack,
    viewState,
    findings,
    questions,
    categories,
  ]);

  // ---------------------------------------------------------------------------
  // Persistence actions
  // ---------------------------------------------------------------------------

  const saveProject = useCallback(
    async (name: string): Promise<SavedProject> => {
      const project = await persistence.saveProject(name, getCurrentState());
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setHasUnsavedChanges(false);
      return project;
    },
    [persistence, getCurrentState, setCurrentProjectId, setCurrentProjectName, setHasUnsavedChanges]
  );

  const loadProject = useCallback(
    async (id: string): Promise<void> => {
      const project = await persistence.loadProject(id);
      if (project) {
        const { state } = project;
        setRawData(state.rawData as DataRow[]);
        setOutcome(state.outcome);
        setFactors(state.factors);
        setSpecs(state.specs);
        setMeasureSpecs(state.measureSpecs || {});
        setAxisSettings(state.axisSettings);
        setColumnAliases(state.columnAliases || {});
        setValueLabels(state.valueLabels || {});
        if (state.displayOptions) setDisplayOptions(state.displayOptions);

        // Quick-win fields (backward-compat: old .vrs files won't have these)
        setCpkTarget(state.cpkTarget);
        setStageColumn(state.stageColumn ?? null);
        setStageOrderMode(state.stageOrderMode ?? 'auto');
        setMeasureColumns(state.measureColumns ?? []);
        setSelectedMeasure(state.selectedMeasure ?? null);
        setMeasureLabel(state.measureLabel ?? 'Measure');
        setChartTitles(state.chartTitles ?? {});

        // Analysis mode (backward-compat: old .vrs files won't have these)
        setAnalysisMode(state.analysisMode ?? 'standard');
        setYamazumiMapping(state.yamazumiMapping ?? null);
        setSubgroupConfig(state.subgroupConfig ?? { method: 'fixed-size', size: 5 });

        // Pareto fields
        setParetoMode(state.paretoMode ?? 'derived');
        setParetoAggregation(state.paretoAggregation ?? 'count');
        setSeparateParetoData(state.separateParetoData ?? null);

        // Time column
        setTimeColumn(state.timeColumn ?? null);

        // Filter stack — if present, restore ordered stack + derive flat filters
        if (state.filterStack && state.filterStack.length > 0) {
          setFilterStack(state.filterStack);
          // Derive flat filters from the stack for data filtering
          const flatFilters: Record<string, (string | number)[]> = {};
          for (const action of state.filterStack) {
            if (action.type === 'filter' && action.factor) {
              flatFilters[action.factor] = action.values;
            }
          }
          setFilters(flatFilters);
        } else {
          // Old .vrs: use flat filters directly, no breadcrumbs
          setFilters(state.filters);
          setFilterStack([]);
        }

        // View state — migrate isMindmapOpen → isFindingsOpen for old .vrs files
        const vs = state.viewState ? { ...state.viewState } : null;
        if (vs && 'isMindmapOpen' in vs) {
          vs.isFindingsOpen =
            vs.isFindingsOpen ??
            ((vs as Record<string, unknown>).isMindmapOpen as boolean | undefined);
          delete (vs as Record<string, unknown>).isMindmapOpen;
        }
        setViewState(vs);

        // Findings
        setFindings(state.findings ?? []);

        // Questions
        setQuestions(state.questions ?? []);

        // Categories
        setCategories(state.categories ?? []);

        setCurrentProjectId(project.id);
        setCurrentProjectName(project.name);
        setHasUnsavedChanges(false);
      }
    },
    [
      persistence,
      setRawData,
      setOutcome,
      setFactors,
      setSpecs,
      setMeasureSpecs,
      setFilters,
      setAxisSettings,
      setColumnAliases,
      setValueLabels,
      setDisplayOptions,
      setCurrentProjectId,
      setCurrentProjectName,
      setHasUnsavedChanges,
      setCpkTarget,
      setStageColumn,
      setStageOrderMode,
      setMeasureColumns,
      setSelectedMeasure,
      setMeasureLabel,
      setChartTitles,
      setAnalysisMode,
      setYamazumiMapping,
      setSubgroupConfig,
      setParetoMode,
      setParetoAggregation,
      setSeparateParetoData,
      setTimeColumn,
      setFilterStack,
      setViewState,
      setFindings,
      setQuestions,
      setCategories,
    ]
  );

  const listProjects = useCallback(async (): Promise<SavedProject[]> => {
    return persistence.listProjects();
  }, [persistence]);

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      await persistence.deleteProject(id);
      if (currentProjectId === id) {
        setCurrentProjectId(null);
        setCurrentProjectName(null);
      }
    },
    [persistence, currentProjectId, setCurrentProjectId, setCurrentProjectName]
  );

  const renameProject = useCallback(
    async (id: string, newName: string): Promise<void> => {
      await persistence.renameProject(id, newName);
      if (currentProjectId === id) {
        setCurrentProjectName(newName);
      }
    },
    [persistence, currentProjectId, setCurrentProjectName]
  );

  const exportProject = useCallback(
    (filename: string): void => {
      persistence.exportToFile(getCurrentState(), filename);
    },
    [persistence, getCurrentState]
  );

  const importProject = useCallback(
    async (file: File): Promise<void> => {
      const state = await persistence.importFromFile(file);
      setRawData(state.rawData as DataRow[]);
      if (state.outcome) setOutcome(state.outcome);
      if (state.factors) setFactors(state.factors);
      if (state.specs) setSpecs(state.specs);
      if (state.axisSettings) setAxisSettings(state.axisSettings);
      if (state.columnAliases) setColumnAliases(state.columnAliases);
      if (state.valueLabels) setValueLabels(state.valueLabels);
      if (state.displayOptions) setDisplayOptions(state.displayOptions);

      // Quick-win fields
      setCpkTarget(state.cpkTarget);
      setStageColumn(state.stageColumn ?? null);
      setStageOrderMode(state.stageOrderMode ?? 'auto');
      setMeasureColumns(state.measureColumns ?? []);
      setSelectedMeasure(state.selectedMeasure ?? null);
      setMeasureLabel(state.measureLabel ?? 'Measure');
      setChartTitles(state.chartTitles ?? {});
      if (state.measureSpecs) setMeasureSpecs(state.measureSpecs);

      // Analysis mode
      setAnalysisMode(state.analysisMode ?? 'standard');
      setYamazumiMapping(state.yamazumiMapping ?? null);
      setSubgroupConfig(state.subgroupConfig ?? { method: 'fixed-size', size: 5 });

      // Pareto fields
      setParetoMode(state.paretoMode ?? 'derived');
      setParetoAggregation(state.paretoAggregation ?? 'count');
      setSeparateParetoData(state.separateParetoData ?? null);

      // Time column
      setTimeColumn(state.timeColumn ?? null);

      // Filter stack
      if (state.filterStack && state.filterStack.length > 0) {
        setFilterStack(state.filterStack);
        const flatFilters: Record<string, (string | number)[]> = {};
        for (const action of state.filterStack) {
          if (action.type === 'filter' && action.factor) {
            flatFilters[action.factor] = action.values;
          }
        }
        setFilters(flatFilters);
      } else if (state.filters) {
        setFilters(state.filters);
        setFilterStack([]);
      }

      // View state — migrate isMindmapOpen → isFindingsOpen for old .vrs files
      const vs = state.viewState ? { ...state.viewState } : null;
      if (vs && 'isMindmapOpen' in vs) {
        vs.isFindingsOpen =
          vs.isFindingsOpen ??
          ((vs as Record<string, unknown>).isMindmapOpen as boolean | undefined);
        delete (vs as Record<string, unknown>).isMindmapOpen;
      }
      setViewState(vs);

      // Findings
      setFindings(state.findings ?? []);

      // Questions
      setQuestions(state.questions ?? []);

      // Categories
      setCategories(state.categories ?? []);

      setCurrentProjectId(null);
      setCurrentProjectName(file.name.replace('.vrs', ''));
      setHasUnsavedChanges(true);
    },
    [
      persistence,
      setRawData,
      setOutcome,
      setFactors,
      setSpecs,
      setFilters,
      setAxisSettings,
      setColumnAliases,
      setValueLabels,
      setDisplayOptions,
      setCurrentProjectId,
      setCurrentProjectName,
      setHasUnsavedChanges,
      setCpkTarget,
      setStageColumn,
      setStageOrderMode,
      setMeasureColumns,
      setSelectedMeasure,
      setMeasureLabel,
      setChartTitles,
      setMeasureSpecs,
      setAnalysisMode,
      setYamazumiMapping,
      setSubgroupConfig,
      setParetoMode,
      setParetoAggregation,
      setSeparateParetoData,
      setTimeColumn,
      setFilterStack,
      setViewState,
      setFindings,
      setQuestions,
      setCategories,
    ]
  );

  const newProject = useCallback((): void => {
    setRawData([]);
    setOutcome(null);
    setFactors([]);
    setTimeColumn(null);
    setSpecs({});
    setMeasureSpecs({});
    setFilters({});
    setAxisSettings({});
    setChartTitles({});
    setColumnAliases({});
    setValueLabels({});
    setDisplayOptions(DEFAULT_DISPLAY_OPTIONS);
    setCurrentProjectId(null);
    setCurrentProjectName(null);
    setHasUnsavedChanges(false);
    setDataFilename(null);
    // Reset validation and Pareto
    setDataQualityReport(null);
    setParetoMode('derived');
    setParetoAggregation('count');
    setSeparateParetoData(null);
    setSeparateParetoFilename(null);
    // Reset stage state
    setStageColumn(null);
    setStageOrderMode('auto');
    // Reset performance mode
    setMeasureColumns([]);
    setMeasureLabel('Measure');
    setSelectedMeasure(null);
    setCpkTarget(undefined);
    // Reset analysis mode
    setAnalysisMode('standard');
    setYamazumiMapping(null);
    setSubgroupConfig({ method: 'fixed-size', size: 5 });
    // Reset filter stack, view state, findings, questions, and categories
    setFilterStack([]);
    setViewState(null);
    setFindings([]);
    setQuestions([]);
    setCategories([]);
  }, [
    setRawData,
    setOutcome,
    setFactors,
    setTimeColumn,
    setSpecs,
    setMeasureSpecs,
    setFilters,
    setAxisSettings,
    setChartTitles,
    setColumnAliases,
    setValueLabels,
    setDisplayOptions,
    setCurrentProjectId,
    setCurrentProjectName,
    setHasUnsavedChanges,
    setDataFilename,
    setDataQualityReport,
    setParetoMode,
    setParetoAggregation,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setStageColumn,
    setStageOrderMode,
    setMeasureColumns,
    setMeasureLabel,
    setSelectedMeasure,
    setCpkTarget,
    setAnalysisMode,
    setYamazumiMapping,
    setSubgroupConfig,
    setFilterStack,
    setViewState,
    setFindings,
    setQuestions,
    setCategories,
  ]);

  return {
    saveProject,
    loadProject,
    listProjects,
    deleteProject,
    renameProject,
    exportProject,
    importProject,
    newProject,
  };
}
