import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  calculateStats,
  calculateStatsByStage,
  sortDataByStage,
  determineStageOrder,
  type StatsResult,
  type StageOrderMode,
  type StagedStatsResult,
} from '@variscout/core';
import {
  autoSave,
  loadAutoSave,
  clearAutoSave,
  saveProjectLocally,
  loadProjectLocally,
  listProjectsLocally,
  deleteProjectLocally,
  renameProjectLocally,
  exportToFile,
  importFromFile,
  debounce,
  SavedProject,
  AnalysisState,
  DisplayOptions,
} from '../lib/persistence';
import { useStorage, type StorageLocation } from '../services/storage';
import type { DataQualityReport, ParetoRow } from '../logic/parser';

interface DataContextType {
  rawData: any[];
  filteredData: any[];
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  specs: { usl?: number; lsl?: number; target?: number };
  grades: { max: number; label: string; color: string }[];
  stats: StatsResult | null;
  // Stage support for I-Chart with stages
  stageColumn: string | null;
  stageOrderMode: StageOrderMode;
  stagedStats: StagedStatsResult | null;
  stagedData: any[]; // Data sorted by stage when stageColumn is active
  filters: Record<string, any[]>;
  axisSettings: { min?: number; max?: number };
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;
  displayOptions: DisplayOptions;
  currentProjectId: string | null;
  currentProjectName: string | null;
  currentProjectLocation: StorageLocation;
  hasUnsavedChanges: boolean;
  dataFilename: string | null;
  // Data quality validation
  dataQualityReport: DataQualityReport | null;
  // Separate Pareto data support
  paretoMode: 'derived' | 'separate';
  separateParetoData: ParetoRow[] | null;
  separateParetoFilename: string | null;
  // Setters
  setDataFilename: (filename: string | null) => void;
  setRawData: (data: any[]) => void;
  setOutcome: (col: string) => void;
  setFactors: (cols: string[]) => void;
  setSpecs: (specs: { usl?: number; lsl?: number; target?: number }) => void;
  setGrades: (grades: { max: number; label: string; color: string }[]) => void;
  setFilters: (filters: Record<string, any[]>) => void;
  setAxisSettings: (settings: { min?: number; max?: number }) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  setValueLabels: (labels: Record<string, Record<string, string>>) => void;
  setDisplayOptions: (options: DisplayOptions) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setParetoMode: (mode: 'derived' | 'separate') => void;
  setSeparateParetoData: (data: ParetoRow[] | null) => void;
  setSeparateParetoFilename: (name: string | null) => void;
  // Stage setters
  setStageColumn: (col: string | null) => void;
  setStageOrderMode: (mode: StageOrderMode) => void;
  // Persistence methods (local + cloud sync)
  saveProject: (name: string, location?: StorageLocation) => Promise<SavedProject>;
  loadProject: (name: string) => Promise<void>;
  listProjects: () => Promise<SavedProject[]>;
  deleteProject: (name: string) => Promise<void>;
  renameProject: (oldName: string, newName: string) => Promise<void>;
  exportProject: (filename: string) => void;
  importProject: (file: File) => Promise<void>;
  newProject: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [factors, setFactors] = useState<string[]>([]);
  const [timeColumn, setTimeColumn] = useState<string | null>(null);
  const [specs, setSpecs] = useState<{ usl?: number; lsl?: number; target?: number }>({});
  const [grades, setGrades] = useState<{ max: number; label: string; color: string }[]>([]);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [axisSettings, setAxisSettings] = useState<{ min?: number; max?: number }>({});
  const [columnAliases, setColumnAliases] = useState<Record<string, string>>({});
  const [valueLabels, setValueLabels] = useState<Record<string, Record<string, string>>>({});
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showCp: false,
    showCpk: true,
    showSpecs: true,
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [currentProjectLocation, setCurrentProjectLocation] = useState<StorageLocation>('team');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dataFilename, setDataFilename] = useState<string | null>(null);
  // Data quality validation
  const [dataQualityReport, setDataQualityReport] = useState<DataQualityReport | null>(null);
  // Separate Pareto data support
  const [paretoMode, setParetoMode] = useState<'derived' | 'separate'>('derived');
  const [separateParetoData, setSeparateParetoData] = useState<ParetoRow[] | null>(null);
  const [separateParetoFilename, setSeparateParetoFilename] = useState<string | null>(null);
  // Stage support for I-Chart with stages
  const [stageColumn, setStageColumn] = useState<string | null>(null);
  const [stageOrderMode, setStageOrderMode] = useState<StageOrderMode>('auto');

  // Cloud sync hook
  const { saveProject: saveToCloud, syncStatus } = useStorage();

  const isInitialized = useRef(false);

  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      return Object.entries(filters).every(([col, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(row[col]);
      });
    });
  }, [rawData, filters]);

  const stats = useMemo(() => {
    if (!outcome || filteredData.length === 0) return null;
    const values = filteredData.map(d => Number(d[outcome])).filter(v => !isNaN(v));
    return calculateStats(values, specs.usl, specs.lsl, grades);
  }, [filteredData, outcome, specs, grades]);

  // Staged data - sorted by stage when stageColumn is active
  const stagedData = useMemo(() => {
    if (!stageColumn || filteredData.length === 0) return filteredData;

    // Get stage values and determine order
    const stageValues = filteredData.map(row => String(row[stageColumn] ?? ''));
    const stageOrder = determineStageOrder(stageValues, stageOrderMode);

    // Sort data by stage
    return sortDataByStage(filteredData, stageColumn, stageOrder);
  }, [filteredData, stageColumn, stageOrderMode]);

  // Staged stats - calculated separately for each stage
  const stagedStats = useMemo(() => {
    if (!stageColumn || !outcome || filteredData.length === 0) return null;

    return calculateStatsByStage(filteredData, outcome, stageColumn, specs, undefined, grades);
  }, [filteredData, outcome, stageColumn, specs, grades]);

  // Get current state for saving
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

  // Debounced auto-save
  const debouncedAutoSave = useMemo(
    () =>
      debounce((state: Omit<AnalysisState, 'version'>) => {
        if (state.rawData.length > 0) {
          autoSave(state);
        }
      }, 1000),
    []
  );

  // Auto-save on state change
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
    const saved = loadAutoSave();
    if (saved && saved.rawData && saved.rawData.length > 0) {
      setRawData(saved.rawData);
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
  }, []);

  // Save project to local IndexedDB and trigger cloud sync
  const saveProject = useCallback(
    async (name: string, location: StorageLocation = 'team'): Promise<SavedProject> => {
      // Save locally first (instant feedback)
      const project = await saveProjectLocally(name, getCurrentState(), location);

      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setCurrentProjectLocation(location);
      setHasUnsavedChanges(false);

      // Trigger cloud sync
      await saveToCloud(getCurrentState(), name, location);

      return project;
    },
    [getCurrentState, saveToCloud]
  );

  // Load project from IndexedDB
  const loadProject = useCallback(async (name: string): Promise<void> => {
    const project = await loadProjectLocally(name);
    if (project) {
      const { state } = project;
      setRawData(state.rawData);
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
      setCurrentProjectLocation(project.location);
      setHasUnsavedChanges(false);
    }
  }, []);

  // List all projects
  const listProjects = useCallback(async (): Promise<SavedProject[]> => {
    return listProjectsLocally();
  }, []);

  // Delete project
  const deleteProject = useCallback(
    async (name: string): Promise<void> => {
      await deleteProjectLocally(name);
      if (currentProjectName === name) {
        setCurrentProjectId(null);
        setCurrentProjectName(null);
      }
    },
    [currentProjectName]
  );

  // Rename project
  const renameProject = useCallback(
    async (oldName: string, newName: string): Promise<void> => {
      await renameProjectLocally(oldName, newName);
      if (currentProjectName === oldName) {
        setCurrentProjectName(newName);
      }
    },
    [currentProjectName]
  );

  // Export to file
  const exportProject = useCallback(
    (filename: string): void => {
      exportToFile(getCurrentState(), filename);
    },
    [getCurrentState]
  );

  // Import from file
  const importProject = useCallback(async (file: File): Promise<void> => {
    const state = await importFromFile(file);
    setRawData(state.rawData);
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
  }, []);

  // New project (clear everything)
  const newProject = useCallback((): void => {
    setRawData([]);
    setDataFilename(null);
    setOutcome(null);
    setFactors([]);
    setSpecs({});
    setGrades([]);
    setFilters({});
    setAxisSettings({});
    setColumnAliases({});
    setValueLabels({});
    setDisplayOptions({ showCp: false, showCpk: true, showSpecs: true });
    setCurrentProjectId(null);
    setCurrentProjectName(null);
    setHasUnsavedChanges(false);
    // Reset validation and Pareto
    setDataQualityReport(null);
    setParetoMode('derived');
    setSeparateParetoData(null);
    setSeparateParetoFilename(null);
    // Reset stage state
    setStageColumn(null);
    setStageOrderMode('auto');
    clearAutoSave();
  }, []);

  return (
    <DataContext.Provider
      value={{
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
        columnAliases,
        valueLabels,
        displayOptions,
        currentProjectId,
        currentProjectName,
        currentProjectLocation,
        hasUnsavedChanges,
        dataFilename,
        dataQualityReport,
        paretoMode,
        separateParetoData,
        separateParetoFilename,
        setDataFilename,
        setRawData,
        setOutcome,
        setFactors,
        setSpecs,
        setGrades,
        setFilters,
        setAxisSettings,
        setColumnAliases,
        setValueLabels,
        setDisplayOptions,
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
