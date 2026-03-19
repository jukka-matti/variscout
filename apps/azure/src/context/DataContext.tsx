/**
 * DataContext - Central state management for VariScout Azure App
 *
 * Uses the shared useDataState hook from @variscout/hooks for core state management,
 * while adding Azure-specific cloud sync functionality via useStorage.
 *
 * Split into DataStateContext and DataActionsContext following Kent C. Dodds pattern
 * for optimal re-render behavior: action-only consumers don't re-render on state changes.
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import {
  useDataState,
  type DataState,
  type DataActions,
  type DisplayOptions,
  type ParetoMode,
  type DataQualityReport,
  type ParetoRow,
  type SavedProject,
} from '@variscout/hooks';
import { azurePersistenceAdapter, setDefaultLocation } from '../lib/persistenceAdapter';
import { useStorage, type StorageLocation, type SyncStatus } from '../services/storage';
import type {
  StatsResult,
  StagedStatsResult,
  StageOrderMode,
  ProcessContext,
} from '@variscout/core';
import { hasTeamFeatures } from '@variscout/core';
import { getTeamsContext } from '../teams/teamsContext';

// Re-export types for backwards compatibility
export type { DisplayOptions, ParetoMode, DataQualityReport, ParetoRow, StorageLocation };

/**
 * Per-component AI toggle preferences.
 * All default to true — disabling a component hides it without turning off AI globally.
 */
export interface AIPreferences {
  narration: boolean;
  insights: boolean;
  coscout: boolean;
}

const DEFAULT_AI_PREFERENCES: AIPreferences = {
  narration: true,
  insights: true,
  coscout: true,
};

/**
 * Azure-specific state beyond base DataState
 */
interface AzureDataState extends Omit<DataState, 'saveProject' | 'loadProject'> {
  currentProjectLocation: StorageLocation;
  syncStatus: SyncStatus;
  processContext: ProcessContext;
  aiEnabled: boolean;
  aiPreferences: AIPreferences;
  /** Custom SharePoint folder path for Knowledge Base search (ADR-026) */
  knowledgeSearchFolder: string | undefined;
}

/**
 * Azure-specific actions beyond base DataActions
 */
interface AzureDataActions extends Omit<
  DataActions,
  'saveProject' | 'loadProject' | 'deleteProject' | 'renameProject'
> {
  saveProject: (name: string, location?: StorageLocation) => Promise<SavedProject>;
  loadProject: (name: string) => Promise<void>;
  deleteProject: (name: string) => Promise<void>;
  renameProject: (oldName: string, newName: string) => Promise<void>;
  setProcessContext: (ctx: ProcessContext) => void;
  setAIEnabled: (enabled: boolean) => void;
  setAIPreferences: (prefs: AIPreferences) => void;
  setKnowledgeSearchFolder: (folder: string | undefined) => void;
}

/**
 * Full DataContext interface - combines state and actions
 * Maintains backwards compatibility with existing component imports
 */
type DataContextType = AzureDataState & AzureDataActions;

const DataStateContext = createContext<AzureDataState | undefined>(undefined);
const DataActionsContext = createContext<AzureDataActions | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state from shared hook
  const [state, actions] = useDataState({
    persistence: azurePersistenceAdapter,
  });

  // AI process context
  const [processContext, setProcessContext] = useState<ProcessContext>({});
  const [aiEnabled, setAIEnabled] = useState(false);
  const [aiPreferences, setAIPreferences] = useState<AIPreferences>(DEFAULT_AI_PREFERENCES);
  const [knowledgeSearchFolder, setKnowledgeSearchFolder] = useState<string | undefined>(undefined);

  // Azure-specific state — default location based on Teams context
  const defaultLocation = useMemo<StorageLocation>(() => {
    const ctx = getTeamsContext();
    return ctx.tabType === 'channel' && hasTeamFeatures() ? 'team' : 'personal';
  }, []);
  const [currentProjectLocation, setCurrentProjectLocation] =
    useState<StorageLocation>(defaultLocation);

  // Cloud sync hook
  const { saveProject: saveToCloud, syncStatus } = useStorage();

  // Ref to track current state — avoids stale closure in saveProject
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Save project with cloud sync
   * Saves locally first (instant feedback), then triggers cloud sync
   */
  const saveProject = useCallback(
    async (name: string, location: StorageLocation = defaultLocation): Promise<SavedProject> => {
      // Update default location for adapter
      setDefaultLocation(location);
      setCurrentProjectLocation(location);

      // Save locally via the shared hook's persistence adapter
      const project = await actions.saveProject(name);

      // Read current state at call time, not captured snapshot
      const currentState = stateRef.current;

      // Trigger cloud sync
      await saveToCloud(currentState, name, location);

      return project;
    },
    [actions, saveToCloud, defaultLocation]
  );

  /**
   * Load project - delegates to shared hook
   */
  const loadProject = useCallback(
    async (name: string): Promise<void> => {
      await actions.loadProject(name);
    },
    [actions]
  );

  /**
   * Delete project - delegates to shared hook
   */
  const deleteProject = useCallback(
    async (name: string): Promise<void> => {
      await actions.deleteProject(name);
    },
    [actions]
  );

  /**
   * Rename project - delegates to shared hook
   */
  const renameProject = useCallback(
    async (oldName: string, newName: string): Promise<void> => {
      await actions.renameProject(oldName, newName);
    },
    [actions]
  );

  // Memoize state context
  const stateValue = useMemo<AzureDataState>(
    () => ({
      // Core state
      rawData: state.rawData,
      filteredData: state.filteredData,
      outcome: state.outcome,
      factors: state.factors,
      timeColumn: state.timeColumn,
      specs: state.specs,
      stats: state.stats,
      stageColumn: state.stageColumn,
      stageOrderMode: state.stageOrderMode,
      stagedStats: state.stagedStats,
      stagedData: state.stagedData,
      filters: state.filters,
      axisSettings: state.axisSettings,
      chartTitles: state.chartTitles,
      columnAliases: state.columnAliases,
      valueLabels: state.valueLabels,
      displayOptions: state.displayOptions,
      currentProjectId: state.currentProjectId,
      currentProjectName: state.currentProjectName,
      hasUnsavedChanges: state.hasUnsavedChanges,
      dataFilename: state.dataFilename,
      dataQualityReport: state.dataQualityReport,
      paretoMode: state.paretoMode,
      paretoAggregation: state.paretoAggregation,
      separateParetoData: state.separateParetoData,
      separateParetoFilename: state.separateParetoFilename,
      fullDataYDomain: state.fullDataYDomain,
      yDomainForCharts: state.yDomainForCharts,

      // Performance mode state
      isPerformanceMode: state.isPerformanceMode,
      measureColumns: state.measureColumns,
      measureLabel: state.measureLabel,
      selectedMeasure: state.selectedMeasure,
      performanceResult: state.performanceResult,
      cpkTarget: state.cpkTarget,
      measureSpecs: state.measureSpecs,
      getSpecsForMeasure: state.getSpecsForMeasure,

      // Multi-point selection state
      selectedPoints: state.selectedPoints,
      selectionIndexMap: state.selectionIndexMap,

      // Filter stack (ordered drill trail)
      filterStack: state.filterStack,

      // View state
      viewState: state.viewState,

      // Findings
      findings: state.findings,

      // Hypotheses
      hypotheses: state.hypotheses,

      // Investigation categories
      categories: state.categories,

      // Azure-specific state
      currentProjectLocation,
      syncStatus,
      processContext,
      aiEnabled,
      aiPreferences,
      knowledgeSearchFolder,
    }),
    [
      state,
      currentProjectLocation,
      syncStatus,
      processContext,
      aiEnabled,
      aiPreferences,
      knowledgeSearchFolder,
    ]
  );

  // Memoize actions context
  const actionsValue = useMemo<AzureDataActions>(
    () => ({
      // Core setters
      setRawData: actions.setRawData,
      setOutcome: actions.setOutcome,
      setFactors: actions.setFactors,
      setTimeColumn: actions.setTimeColumn,
      setSpecs: actions.setSpecs,
      setFilters: actions.setFilters,
      setAxisSettings: actions.setAxisSettings,
      setChartTitles: actions.setChartTitles,
      setColumnAliases: actions.setColumnAliases,
      setValueLabels: actions.setValueLabels,
      setDisplayOptions: actions.setDisplayOptions,
      setDataFilename: actions.setDataFilename,
      setDataQualityReport: actions.setDataQualityReport,
      setParetoMode: actions.setParetoMode,
      setParetoAggregation: actions.setParetoAggregation,
      setSeparateParetoData: actions.setSeparateParetoData,
      setSeparateParetoFilename: actions.setSeparateParetoFilename,
      setStageColumn: actions.setStageColumn,
      setStageOrderMode: actions.setStageOrderMode,

      // Performance mode setters
      setPerformanceMode: actions.setPerformanceMode,
      setMeasureColumns: actions.setMeasureColumns,
      setMeasureLabel: actions.setMeasureLabel,
      setSelectedMeasure: actions.setSelectedMeasure,
      setCpkTarget: actions.setCpkTarget,
      setMeasureSpecs: actions.setMeasureSpecs,
      setMeasureSpec: actions.setMeasureSpec,

      // Multi-point selection actions
      setSelectedPoints: actions.setSelectedPoints,
      addToSelection: actions.addToSelection,
      removeFromSelection: actions.removeFromSelection,
      clearSelection: actions.clearSelection,
      togglePointSelection: actions.togglePointSelection,

      // Filter stack / view state / findings / hypotheses / categories setters
      setFilterStack: actions.setFilterStack,
      setViewState: actions.setViewState,
      setFindings: actions.setFindings,
      setHypotheses: actions.setHypotheses,
      setCategories: actions.setCategories,

      // AI
      setProcessContext,
      setAIEnabled,
      setAIPreferences,
      setKnowledgeSearchFolder,

      // Azure-enhanced persistence methods
      saveProject,
      loadProject,
      listProjects: actions.listProjects,
      deleteProject,
      renameProject,
      exportProject: actions.exportProject,
      importProject: actions.importProject,
      newProject: actions.newProject,
    }),
    [
      actions,
      saveProject,
      loadProject,
      deleteProject,
      renameProject,
      setProcessContext,
      setAIEnabled,
      setAIPreferences,
      setKnowledgeSearchFolder,
    ]
  );

  return (
    <DataStateContext.Provider value={stateValue}>
      <DataActionsContext.Provider value={actionsValue}>{children}</DataActionsContext.Provider>
    </DataStateContext.Provider>
  );
};

/**
 * Hook to access only state (re-renders on state changes)
 */
export const useDataStateCtx = (): AzureDataState => {
  const context = useContext(DataStateContext);
  if (!context) {
    throw new Error('useDataStateCtx must be used within DataProvider');
  }
  return context;
};

/**
 * Hook to access only actions (stable — never triggers re-renders)
 */
export const useDataActions = (): AzureDataActions => {
  const context = useContext(DataActionsContext);
  if (!context) {
    throw new Error('useDataActions must be used within DataProvider');
  }
  return context;
};

/**
 * Hook to access the full DataContext (backward compatible)
 * Prefer useDataStateCtx/useDataActions for new code to minimize re-renders.
 */
export const useData = (): DataContextType => {
  const state = useDataStateCtx();
  const actions = useDataActions();
  return { ...state, ...actions };
};

// Export additional types for component type annotations
export type { StatsResult, StagedStatsResult, StageOrderMode, SyncStatus };
