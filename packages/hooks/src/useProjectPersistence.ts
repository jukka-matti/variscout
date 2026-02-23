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
import type { DataRow, StageOrderMode } from '@variscout/core';
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
  specs: { usl?: number; lsl?: number; target?: number };
  measureSpecs: Record<string, { usl?: number; lsl?: number; target?: number }>;
  filters: Record<string, (string | number)[]>;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;
  displayOptions: DisplayOptions;
  currentProjectId: string | null;

  // All setters for load/import/new
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setTimeColumn: (col: string | null) => void;
  setSpecs: (specs: { usl?: number; lsl?: number; target?: number }) => void;
  setMeasureSpecs: (specs: Record<string, { usl?: number; lsl?: number; target?: number }>) => void;
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
  setPerformanceMode: (enabled: boolean) => void;
  setMeasureColumns: (columns: string[]) => void;
  setMeasureLabel: (label: string) => void;
  setSelectedMeasure: (measureId: string | null) => void;
  setCpkTarget: (target: number) => void;
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
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    setSelectedMeasure,
    setCpkTarget,
  } = inputs;

  // ---------------------------------------------------------------------------
  // State snapshot for persistence
  // ---------------------------------------------------------------------------

  const getCurrentState = useCallback(
    (): Omit<AnalysisState, 'version'> => ({
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
    }),
    [
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
    ]
  );

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
        setFilters(state.filters);
        setAxisSettings(state.axisSettings);
        setColumnAliases(state.columnAliases || {});
        setValueLabels(state.valueLabels || {});
        if (state.displayOptions) setDisplayOptions(state.displayOptions);
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
      if (state.filters) setFilters(state.filters);
      if (state.axisSettings) setAxisSettings(state.axisSettings);
      if (state.columnAliases) setColumnAliases(state.columnAliases);
      if (state.valueLabels) setValueLabels(state.valueLabels);
      if (state.displayOptions) setDisplayOptions(state.displayOptions);
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
    setPerformanceMode(false);
    setMeasureColumns([]);
    setMeasureLabel('Measure');
    setSelectedMeasure(null);
    setCpkTarget(1.33);
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
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    setSelectedMeasure,
    setCpkTarget,
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
