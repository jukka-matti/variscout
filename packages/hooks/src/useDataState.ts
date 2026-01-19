/**
 * useDataState - Shared state management hook for VariScout data contexts
 *
 * This hook extracts the common state management logic from PWA and Azure DataContexts,
 * reducing ~460 lines of duplication across the two apps.
 *
 * Usage:
 * ```tsx
 * const [state, actions] = useDataState({ persistence: pwaPersistenceAdapter });
 * ```
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  calculateStats,
  calculateStatsByStage,
  sortDataByStage,
  determineStageOrder,
  type DataRow,
  type StatsResult,
  type StagedStatsResult,
  type StageOrderMode,
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
} from './types';

// ============================================================================
// Types
// ============================================================================

export interface UseDataStateOptions {
  /** Persistence adapter for auto-save and project storage */
  persistence: PersistenceAdapter;
  /** Debounce delay for auto-save in ms (default: 1000) */
  autoSaveDelay?: number;
}

export interface DataState {
  // Core data
  rawData: DataRow[];
  filteredData: DataRow[];
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  specs: { usl?: number; lsl?: number; target?: number };
  grades: { max: number; label: string; color: string }[];
  stats: StatsResult | null;

  // Stage support
  stageColumn: string | null;
  stageOrderMode: StageOrderMode;
  stagedStats: StagedStatsResult | null;
  stagedData: DataRow[];

  // Filters and settings
  filters: Record<string, (string | number)[]>;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  chartTitles: ChartTitles;
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;
  displayOptions: DisplayOptions;

  // Project state
  currentProjectId: string | null;
  currentProjectName: string | null;
  hasUnsavedChanges: boolean;
  dataFilename: string | null;

  // Data quality validation
  dataQualityReport: DataQualityReport | null;

  // Pareto support
  paretoMode: ParetoMode;
  separateParetoData: ParetoRow[] | null;
  separateParetoFilename: string | null;

  // Y-axis lock feature
  fullDataYDomain: { min: number; max: number } | null;
  yDomainForCharts: { min: number; max: number } | undefined;
}

export interface DataActions {
  // Core setters
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setTimeColumn: (col: string | null) => void;
  setSpecs: (specs: { usl?: number; lsl?: number; target?: number }) => void;
  setGrades: (grades: { max: number; label: string; color: string }[]) => void;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  setAxisSettings: (settings: { min?: number; max?: number; scaleMode?: ScaleMode }) => void;
  setChartTitles: (titles: ChartTitles) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  setValueLabels: (labels: Record<string, Record<string, string>>) => void;
  setDisplayOptions: (options: DisplayOptions) => void;
  setDataFilename: (filename: string | null) => void;

  // Data quality
  setDataQualityReport: (report: DataQualityReport | null) => void;

  // Pareto setters
  setParetoMode: (mode: ParetoMode) => void;
  setSeparateParetoData: (data: ParetoRow[] | null) => void;
  setSeparateParetoFilename: (filename: string | null) => void;

  // Stage setters
  setStageColumn: (col: string | null) => void;
  setStageOrderMode: (mode: StageOrderMode) => void;

  // Persistence methods
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
// Debounce Utility
// ============================================================================

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  return debounced;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  showCp: false,
  showCpk: true,
  showSpecs: true,
  lockYAxisToFullData: true,
  showControlLimits: true,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDataState(options: UseDataStateOptions): [DataState, DataActions] {
  const { persistence, autoSaveDelay = 1000 } = options;

  // Core state
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [factors, setFactors] = useState<string[]>([]);
  const [timeColumn, setTimeColumn] = useState<string | null>(null);
  const [specs, setSpecs] = useState<{ usl?: number; lsl?: number; target?: number }>({});
  const [grades, setGrades] = useState<{ max: number; label: string; color: string }[]>([]);
  const [filters, setFilters] = useState<Record<string, (string | number)[]>>({});
  const [axisSettings, setAxisSettings] = useState<{
    min?: number;
    max?: number;
    scaleMode?: ScaleMode;
  }>({});
  const [chartTitles, setChartTitles] = useState<ChartTitles>({});
  const [columnAliases, setColumnAliases] = useState<Record<string, string>>({});
  const [valueLabels, setValueLabels] = useState<Record<string, Record<string, string>>>({});
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>(DEFAULT_DISPLAY_OPTIONS);

  // Stage support
  const [stageColumn, setStageColumn] = useState<string | null>(null);
  const [stageOrderMode, setStageOrderMode] = useState<StageOrderMode>('auto');

  // Project state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dataFilename, setDataFilename] = useState<string | null>(null);

  // Data quality validation
  const [dataQualityReport, setDataQualityReport] = useState<DataQualityReport | null>(null);

  // Pareto support
  const [paretoMode, setParetoMode] = useState<ParetoMode>('derived');
  const [separateParetoData, setSeparateParetoData] = useState<ParetoRow[] | null>(null);
  const [separateParetoFilename, setSeparateParetoFilename] = useState<string | null>(null);

  const isInitialized = useRef(false);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      return Object.entries(filters).every(([col, values]) => {
        if (!values || values.length === 0) return true;
        const cellValue = row[col];
        return values.includes(cellValue as string | number);
      });
    });
  }, [rawData, filters]);

  const stats = useMemo(() => {
    if (!outcome || filteredData.length === 0) return null;
    const values = filteredData
      .map(d => {
        const v = d[outcome];
        return typeof v === 'number' ? v : Number(v);
      })
      .filter(v => !isNaN(v));
    return calculateStats(values, specs.usl, specs.lsl, grades);
  }, [filteredData, outcome, specs, grades]);

  // Full dataset Y domain (for Y-axis lock feature)
  const fullDataYDomain = useMemo(() => {
    if (!outcome || rawData.length === 0) return null;
    const values = rawData
      .map(d => {
        const v = d[outcome];
        return typeof v === 'number' ? v : Number(v);
      })
      .filter(v => !isNaN(v));
    if (values.length === 0) return null;

    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);

    // Include spec limits in domain
    if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
    if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

    // Add 10% padding
    const padding = (maxVal - minVal) * 0.1 || 1;
    return { min: minVal - padding, max: maxVal + padding };
  }, [rawData, outcome, specs]);

  // Y domain to pass to charts (either full data domain or undefined for auto)
  const yDomainForCharts = useMemo(() => {
    if (displayOptions.lockYAxisToFullData && fullDataYDomain) {
      return fullDataYDomain;
    }
    return undefined;
  }, [displayOptions.lockYAxisToFullData, fullDataYDomain]);

  // Staged data - sorted by stage when stageColumn is active
  const stagedData = useMemo(() => {
    if (!stageColumn || filteredData.length === 0) return filteredData;

    const stageValues = filteredData.map(row => String(row[stageColumn] ?? ''));
    const stageOrder = determineStageOrder(stageValues, stageOrderMode);

    return sortDataByStage(filteredData, stageColumn, stageOrder);
  }, [filteredData, stageColumn, stageOrderMode]);

  // Staged stats - calculated separately for each stage
  const stagedStats = useMemo(() => {
    if (!stageColumn || !outcome || filteredData.length === 0) return null;

    return calculateStatsByStage(filteredData, outcome, stageColumn, specs, undefined, grades);
  }, [filteredData, outcome, stageColumn, specs, grades]);

  // ---------------------------------------------------------------------------
  // State getter for persistence
  // ---------------------------------------------------------------------------

  const getCurrentState = useCallback(
    (): Omit<AnalysisState, 'version'> => ({
      rawData,
      outcome,
      factors,
      specs,
      grades,
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
      grades,
      filters,
      axisSettings,
      columnAliases,
      valueLabels,
      displayOptions,
    ]
  );

  // ---------------------------------------------------------------------------
  // Auto-save
  // ---------------------------------------------------------------------------

  const debouncedAutoSave = useMemo(
    () =>
      debounce((state: Omit<AnalysisState, 'version'>) => {
        if (state.rawData.length > 0) {
          persistence.autoSave(state);
        }
      }, autoSaveDelay),
    [persistence, autoSaveDelay]
  );

  useEffect(() => {
    if (!isInitialized.current) return;
    if (rawData.length > 0) {
      setHasUnsavedChanges(true);
      debouncedAutoSave(getCurrentState());
    }
    return () => debouncedAutoSave.cancel();
  }, [
    rawData,
    outcome,
    factors,
    specs,
    grades,
    filters,
    axisSettings,
    columnAliases,
    valueLabels,
    displayOptions,
    getCurrentState,
    debouncedAutoSave,
  ]);

  // Restore from auto-save on mount
  useEffect(() => {
    const saved = persistence.loadAutoSave();
    if (saved && saved.rawData && saved.rawData.length > 0) {
      setRawData(saved.rawData as DataRow[]);
      if (saved.outcome) setOutcome(saved.outcome);
      if (saved.factors) setFactors(saved.factors);
      if (saved.specs) setSpecs(saved.specs);
      if (saved.grades) setGrades(saved.grades);
      if (saved.filters) setFilters(saved.filters);
      if (saved.axisSettings) setAxisSettings(saved.axisSettings);
      if (saved.columnAliases) setColumnAliases(saved.columnAliases);
      if (saved.valueLabels) setValueLabels(saved.valueLabels);
      if (saved.displayOptions) setDisplayOptions(saved.displayOptions);
    }
    isInitialized.current = true;
  }, [persistence]);

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
    [persistence, getCurrentState]
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
        setGrades(state.grades);
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
    [persistence]
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
    [persistence, currentProjectId]
  );

  const renameProject = useCallback(
    async (id: string, newName: string): Promise<void> => {
      await persistence.renameProject(id, newName);
      if (currentProjectId === id) {
        setCurrentProjectName(newName);
      }
    },
    [persistence, currentProjectId]
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
      if (state.grades) setGrades(state.grades);
      if (state.filters) setFilters(state.filters);
      if (state.axisSettings) setAxisSettings(state.axisSettings);
      if (state.columnAliases) setColumnAliases(state.columnAliases);
      if (state.valueLabels) setValueLabels(state.valueLabels);
      if (state.displayOptions) setDisplayOptions(state.displayOptions);
      setCurrentProjectId(null);
      setCurrentProjectName(file.name.replace('.vrs', ''));
      setHasUnsavedChanges(true);
    },
    [persistence]
  );

  const newProject = useCallback((): void => {
    setRawData([]);
    setOutcome(null);
    setFactors([]);
    setTimeColumn(null);
    setSpecs({});
    setGrades([]);
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
    setSeparateParetoData(null);
    setSeparateParetoFilename(null);
    // Reset stage state
    setStageColumn(null);
    setStageOrderMode('auto');
    persistence.clearAutoSave();
  }, [persistence]);

  // ---------------------------------------------------------------------------
  // Return memoized state and actions
  // ---------------------------------------------------------------------------

  const state: DataState = useMemo(
    () => ({
      rawData,
      filteredData,
      outcome,
      factors,
      timeColumn,
      specs,
      grades,
      stats,
      stageColumn,
      stageOrderMode,
      stagedStats,
      stagedData,
      filters,
      axisSettings,
      chartTitles,
      columnAliases,
      valueLabels,
      displayOptions,
      currentProjectId,
      currentProjectName,
      hasUnsavedChanges,
      dataFilename,
      dataQualityReport,
      paretoMode,
      separateParetoData,
      separateParetoFilename,
      fullDataYDomain,
      yDomainForCharts,
    }),
    [
      rawData,
      filteredData,
      outcome,
      factors,
      timeColumn,
      specs,
      grades,
      stats,
      stageColumn,
      stageOrderMode,
      stagedStats,
      stagedData,
      filters,
      axisSettings,
      chartTitles,
      columnAliases,
      valueLabels,
      displayOptions,
      currentProjectId,
      currentProjectName,
      hasUnsavedChanges,
      dataFilename,
      dataQualityReport,
      paretoMode,
      separateParetoData,
      separateParetoFilename,
      fullDataYDomain,
      yDomainForCharts,
    ]
  );

  const actions: DataActions = useMemo(
    () => ({
      setRawData,
      setOutcome,
      setFactors,
      setTimeColumn,
      setSpecs,
      setGrades,
      setFilters,
      setAxisSettings,
      setChartTitles,
      setColumnAliases,
      setValueLabels,
      setDisplayOptions,
      setDataFilename,
      setDataQualityReport,
      setParetoMode,
      setSeparateParetoData,
      setSeparateParetoFilename,
      setStageColumn,
      setStageOrderMode,
      saveProject,
      loadProject,
      listProjects,
      deleteProject,
      renameProject,
      exportProject,
      importProject,
      newProject,
    }),
    [
      setRawData,
      setOutcome,
      setFactors,
      setTimeColumn,
      setSpecs,
      setGrades,
      setFilters,
      setAxisSettings,
      setChartTitles,
      setColumnAliases,
      setValueLabels,
      setDisplayOptions,
      setDataFilename,
      setDataQualityReport,
      setParetoMode,
      setSeparateParetoData,
      setSeparateParetoFilename,
      setStageColumn,
      setStageOrderMode,
      saveProject,
      loadProject,
      listProjects,
      deleteProject,
      renameProject,
      exportProject,
      importProject,
      newProject,
    ]
  );

  return [state, actions];
}
