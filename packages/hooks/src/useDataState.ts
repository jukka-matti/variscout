/**
 * useDataState - Shared state management hook for VariScout data contexts
 *
 * This hook extracts the common state management logic from PWA and Azure DataContexts,
 * reducing ~460 lines of duplication across the two apps.
 *
 * Internally delegates to:
 * - useDataComputation: derived values (stats, Y-domain, staged data, performance)
 * - useProjectPersistence: save/load/export/import/newProject
 *
 * Usage:
 * ```tsx
 * const [state, actions] = useDataState({ persistence: pwaPersistenceAdapter });
 * ```
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  DataRow,
  SpecLimits,
  StageOrderMode,
  StatsResult,
  StagedStatsResult,
  ChannelPerformanceData,
  FilterAction,
  Finding,
  Hypothesis,
  InvestigationCategory,
  AnalysisMode,
  YamazumiColumnMapping,
} from '@variscout/core';
import type {
  DisplayOptions,
  PersistenceAdapter,
  ChartTitles,
  ParetoMode,
  DataQualityReport,
  ParetoRow,
  ScaleMode,
  SavedProject,
  ViewState,
} from './types';
import { useDataComputation } from './useDataComputation';
import { useProjectPersistence } from './useProjectPersistence';

// ============================================================================
// Types
// ============================================================================

export interface UseDataStateOptions {
  /** Persistence adapter for project storage */
  persistence: PersistenceAdapter;
}

export interface DataState {
  // Core data
  rawData: DataRow[];
  filteredData: DataRow[];
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  specs: SpecLimits;
  /** Per-measure spec overrides for Performance Mode (keyed by measure column name) */
  measureSpecs: Record<string, SpecLimits>;
  stats: StatsResult | null;

  // Multi-point selection (Minitab-style brushing)
  /** Selected point indices in filteredData */
  selectedPoints: Set<number>;
  /** Map from filteredData index to original rawData index */
  selectionIndexMap: Map<number, number>;

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
  paretoAggregation: 'count' | 'value';
  separateParetoData: ParetoRow[] | null;
  separateParetoFilename: string | null;

  // Y-axis lock feature
  fullDataYDomain: { min: number; max: number } | null;
  yDomainForCharts: { min: number; max: number } | undefined;

  // Performance mode (multi-measure analysis)
  isPerformanceMode: boolean;
  measureColumns: string[];
  measureLabel: string;
  selectedMeasure: string | null;
  performanceResult: ChannelPerformanceData | null;
  /** User-defined Cpk target for Performance Mode (default: 1.33) */
  cpkTarget: number;

  // Analysis mode (standard | performance | yamazumi)
  analysisMode: AnalysisMode;
  yamazumiMapping: YamazumiColumnMapping | null;

  /** Helper to get effective specs for a measure (per-measure override or global) */
  getSpecsForMeasure: (measureId: string) => SpecLimits;

  // Filter stack (ordered drill trail for breadcrumb persistence)
  filterStack: FilterAction[];

  // View state (for restoring analyst's working context)
  viewState: ViewState | null;

  // Findings (analyst's scouting report — bookmarked filter states with notes)
  findings: Finding[];

  // Hypotheses (causal theories linked to findings)
  hypotheses: Hypothesis[];

  // Investigation categories (dynamic factor grouping)
  categories: InvestigationCategory[];
}

export interface DataActions {
  // Core setters
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setTimeColumn: (col: string | null) => void;
  setSpecs: (specs: SpecLimits) => void;

  // Selection actions (Minitab-style brushing)
  setSelectedPoints: (indices: Set<number>) => void;
  addToSelection: (indices: number[]) => void;
  removeFromSelection: (indices: number[]) => void;
  clearSelection: () => void;
  togglePointSelection: (index: number) => void;
  /** Set per-measure spec overrides for Performance Mode */
  setMeasureSpecs: (measureSpecs: Record<string, SpecLimits>) => void;
  /** Update specs for a single measure (merges with existing measureSpecs) */
  setMeasureSpec: (measureId: string, specs: SpecLimits) => void;
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
  setParetoAggregation: (mode: 'count' | 'value') => void;
  setSeparateParetoData: (data: ParetoRow[] | null) => void;
  setSeparateParetoFilename: (filename: string | null) => void;

  // Stage setters
  setStageColumn: (col: string | null) => void;
  setStageOrderMode: (mode: StageOrderMode) => void;

  // Performance mode setters
  setPerformanceMode: (enabled: boolean) => void;
  setMeasureColumns: (columns: string[]) => void;
  setMeasureLabel: (label: string) => void;
  setSelectedMeasure: (measureId: string | null) => void;
  setCpkTarget: (target: number) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setYamazumiMapping: (mapping: YamazumiColumnMapping | null) => void;

  // Filter stack
  setFilterStack: (stack: FilterAction[]) => void;

  // View state
  setViewState: (state: ViewState | null) => void;

  // Findings
  setFindings: (findings: Finding[]) => void;

  // Hypotheses
  setHypotheses: (hypotheses: Hypothesis[]) => void;

  // Investigation categories
  setCategories: (categories: InvestigationCategory[]) => void;

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
// Default Values
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

export function useDataState(options: UseDataStateOptions): [DataState, DataActions] {
  const { persistence } = options;

  // Core state
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [factors, setFactors] = useState<string[]>([]);
  const [timeColumn, setTimeColumn] = useState<string | null>(null);
  const [specs, setSpecs] = useState<SpecLimits>({});
  const [measureSpecs, setMeasureSpecs] = useState<Record<string, SpecLimits>>({});
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
  const [paretoAggregation, setParetoAggregation] = useState<'count' | 'value'>('count');
  const [separateParetoData, setSeparateParetoData] = useState<ParetoRow[] | null>(null);
  const [separateParetoFilename, setSeparateParetoFilename] = useState<string | null>(null);

  // Performance mode (multi-measure analysis)
  const [isPerformanceMode, setPerformanceMode] = useState(false);
  const [measureColumns, setMeasureColumns] = useState<string[]>([]);
  const [measureLabel, setMeasureLabel] = useState('Measure');
  const [selectedMeasure, setSelectedMeasure] = useState<string | null>(null);
  const [cpkTarget, setCpkTarget] = useState(1.33);

  // Analysis mode (unified mode selector — replaces isPerformanceMode in Phase 6)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('standard');
  const [yamazumiMapping, setYamazumiMapping] = useState<YamazumiColumnMapping | null>(null);

  // Filter stack (ordered drill trail for breadcrumb persistence)
  const [filterStack, setFilterStack] = useState<FilterAction[]>([]);

  // View state (for restoring analyst's working context)
  const [viewState, setViewState] = useState<ViewState | null>(null);

  // Findings (scouting report — persisted with project)
  const [findings, setFindings] = useState<Finding[]>([]);

  // Hypotheses (causal theories — persisted with project)
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);

  // Investigation categories (dynamic factor grouping — persisted with project)
  const [categories, setCategories] = useState<InvestigationCategory[]>([]);

  // Multi-point selection (Minitab-style brushing)
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
  const [selectionIndexMap, setSelectionIndexMap] = useState<Map<number, number>>(new Map());

  // ---------------------------------------------------------------------------
  // Selection actions
  // ---------------------------------------------------------------------------

  const addToSelection = useCallback((indices: number[]) => {
    setSelectedPoints(prev => {
      const newSet = new Set(prev);
      indices.forEach(i => newSet.add(i));
      return newSet;
    });
  }, []);

  const removeFromSelection = useCallback((indices: number[]) => {
    setSelectedPoints(prev => {
      const newSet = new Set(prev);
      indices.forEach(i => newSet.delete(i));
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPoints(new Set());
  }, []);

  const togglePointSelection = useCallback((index: number) => {
    setSelectedPoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Helper to set specs for a single measure (merges with existing)
  const setMeasureSpec = useCallback((measureId: string, measureSpec: SpecLimits) => {
    setMeasureSpecs(prev => ({
      ...prev,
      [measureId]: measureSpec,
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered data (pure computation — no side effects)
  // ---------------------------------------------------------------------------

  const { filteredData, filteredIndexMap } = useMemo(() => {
    // Build a reverse lookup once: O(N) instead of O(N²) rawData.indexOf
    const rowToIndex = new Map<object, number>();
    for (let i = 0; i < rawData.length; i++) {
      rowToIndex.set(rawData[i], i);
    }

    const filtered: typeof rawData = [];
    const indexMap = new Map<number, number>();

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const pass = Object.entries(filters).every(([col, values]) => {
        if (!values || values.length === 0) return true;
        const cellValue = row[col];
        return values.includes(cellValue as string | number);
      });
      if (pass) {
        const filteredIndex = filtered.length;
        filtered.push(row);
        indexMap.set(filteredIndex, i);
      }
    }

    return { filteredData: filtered, filteredIndexMap: indexMap };
  }, [rawData, filters]);

  // Sync selection state when filtered data changes
  useEffect(() => {
    setSelectionIndexMap(filteredIndexMap);
    setSelectedPoints(new Set());
  }, [filteredIndexMap]);

  // ---------------------------------------------------------------------------
  // Derived computations (delegated)
  // ---------------------------------------------------------------------------

  const {
    stats,
    fullDataYDomain,
    yDomainForCharts,
    stagedData,
    stagedStats,
    performanceResult,
    getSpecsForMeasure,
  } = useDataComputation({
    rawData,
    filteredData,
    outcome,
    specs,
    measureSpecs,
    stageColumn,
    stageOrderMode,
    displayOptions,
    isPerformanceMode,
    measureColumns,
  });

  // ---------------------------------------------------------------------------
  // Persistence actions (delegated)
  // ---------------------------------------------------------------------------

  const {
    saveProject,
    loadProject,
    listProjects,
    deleteProject,
    renameProject,
    exportProject,
    importProject,
    newProject,
  } = useProjectPersistence({
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
    isPerformanceMode,
    measureColumns,
    selectedMeasure,
    measureLabel,
    chartTitles,
    paretoMode,
    paretoAggregation,
    separateParetoData,
    timeColumn,
    filterStack,
    viewState,
    findings,
    hypotheses,
    categories,
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
    setFilterStack,
    setViewState,
    setFindings,
    setHypotheses,
    setCategories,
  });

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
      measureSpecs,
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
      paretoAggregation,
      separateParetoData,
      separateParetoFilename,
      fullDataYDomain,
      yDomainForCharts,
      isPerformanceMode,
      measureColumns,
      measureLabel,
      selectedMeasure,
      performanceResult,
      cpkTarget,
      getSpecsForMeasure,
      analysisMode,
      yamazumiMapping,
      selectedPoints,
      selectionIndexMap,
      filterStack,
      viewState,
      findings,
      hypotheses,
      categories,
    }),
    [
      rawData,
      filteredData,
      outcome,
      factors,
      timeColumn,
      specs,
      measureSpecs,
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
      paretoAggregation,
      separateParetoData,
      separateParetoFilename,
      fullDataYDomain,
      yDomainForCharts,
      isPerformanceMode,
      measureColumns,
      measureLabel,
      selectedMeasure,
      performanceResult,
      cpkTarget,
      getSpecsForMeasure,
      analysisMode,
      yamazumiMapping,
      selectedPoints,
      selectionIndexMap,
      filterStack,
      viewState,
      findings,
      hypotheses,
      categories,
    ]
  );

  const actions: DataActions = useMemo(
    () => ({
      setRawData,
      setOutcome,
      setFactors,
      setTimeColumn,
      setSpecs,
      setMeasureSpecs,
      setMeasureSpec,

      setFilters,
      setAxisSettings,
      setChartTitles,
      setColumnAliases,
      setValueLabels,
      setDisplayOptions,
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
      setAnalysisMode,
      setYamazumiMapping,
      setFilterStack,
      setViewState,
      setFindings,
      setHypotheses,
      setCategories,
      setSelectedPoints,
      addToSelection,
      removeFromSelection,
      clearSelection,
      togglePointSelection,
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
      setMeasureSpecs,
      setMeasureSpec,

      setFilters,
      setAxisSettings,
      setChartTitles,
      setColumnAliases,
      setValueLabels,
      setDisplayOptions,
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
      setAnalysisMode,
      setYamazumiMapping,
      setFilterStack,
      setViewState,
      setFindings,
      setHypotheses,
      setCategories,
      setSelectedPoints,
      addToSelection,
      removeFromSelection,
      clearSelection,
      togglePointSelection,
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
