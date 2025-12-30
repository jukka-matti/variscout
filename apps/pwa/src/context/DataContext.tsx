import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { calculateStats, type StatsResult } from '@variscout/core';
import {
  autoSave,
  loadAutoSave,
  clearAutoSave,
  saveProject as saveToDb,
  loadProject as loadFromDb,
  listProjects as listFromDb,
  deleteProject as deleteFromDb,
  renameProject as renameInDb,
  exportToFile,
  importFromFile,
  debounce,
  SavedProject,
  AnalysisState,
  DisplayOptions,
} from '../lib/persistence';

interface DataContextType {
  rawData: any[];
  filteredData: any[];
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  specs: { usl?: number; lsl?: number; target?: number };
  grades: { max: number; label: string; color: string }[];
  stats: StatsResult | null;
  filters: Record<string, any[]>;
  axisSettings: { min?: number; max?: number };
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;
  displayOptions: DisplayOptions;
  currentProjectId: string | null;
  currentProjectName: string | null;
  hasUnsavedChanges: boolean;
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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

  // Save project to IndexedDB
  const saveProject = useCallback(
    async (name: string): Promise<SavedProject> => {
      const project = await saveToDb(name, getCurrentState());
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setHasUnsavedChanges(false);
      return project;
    },
    [getCurrentState]
  );

  // Load project from IndexedDB
  const loadProject = useCallback(async (id: string): Promise<void> => {
    const project = await loadFromDb(id);
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
      setHasUnsavedChanges(false);
    }
  }, []);

  // List all projects
  const listProjects = useCallback(async (): Promise<SavedProject[]> => {
    return listFromDb();
  }, []);

  // Delete project
  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      await deleteFromDb(id);
      if (currentProjectId === id) {
        setCurrentProjectId(null);
        setCurrentProjectName(null);
      }
    },
    [currentProjectId]
  );

  // Rename project
  const renameProject = useCallback(
    async (id: string, newName: string): Promise<void> => {
      await renameInDb(id, newName);
      if (currentProjectId === id) {
        setCurrentProjectName(newName);
      }
    },
    [currentProjectId]
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
        filters,
        axisSettings,
        columnAliases,
        valueLabels,
        displayOptions,
        currentProjectId,
        currentProjectName,
        hasUnsavedChanges,
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
