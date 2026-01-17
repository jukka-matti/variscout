/**
 * DataContext - Central state management for VariScout Azure App
 *
 * Uses the shared useDataState hook from @variscout/hooks for core state management,
 * while adding Azure-specific cloud sync functionality via useStorage.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
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
import type { StatsResult, StagedStatsResult, StageOrderMode } from '@variscout/core';

// Re-export types for backwards compatibility
export type { DisplayOptions, ParetoMode, DataQualityReport, ParetoRow, StorageLocation };

/**
 * Extended DataContext interface for Azure app
 * Includes cloud sync features beyond the base DataState/DataActions
 */
interface DataContextType extends Omit<DataState, 'saveProject' | 'loadProject'> {
  // All DataState fields are inherited

  // Azure-specific state
  currentProjectLocation: StorageLocation;
  syncStatus: SyncStatus;

  // All DataActions are inherited except for persistence methods we override
  setRawData: DataActions['setRawData'];
  setOutcome: DataActions['setOutcome'];
  setFactors: DataActions['setFactors'];
  setTimeColumn: DataActions['setTimeColumn'];
  setSpecs: DataActions['setSpecs'];
  setGrades: DataActions['setGrades'];
  setFilters: DataActions['setFilters'];
  setAxisSettings: DataActions['setAxisSettings'];
  setChartTitles: DataActions['setChartTitles'];
  setColumnAliases: DataActions['setColumnAliases'];
  setValueLabels: DataActions['setValueLabels'];
  setDisplayOptions: DataActions['setDisplayOptions'];
  setDataFilename: DataActions['setDataFilename'];
  setDataQualityReport: DataActions['setDataQualityReport'];
  setParetoMode: DataActions['setParetoMode'];
  setSeparateParetoData: DataActions['setSeparateParetoData'];
  setSeparateParetoFilename: DataActions['setSeparateParetoFilename'];
  setStageColumn: DataActions['setStageColumn'];
  setStageOrderMode: DataActions['setStageOrderMode'];

  // Azure-specific persistence methods (with location support)
  saveProject: (name: string, location?: StorageLocation) => Promise<SavedProject>;
  loadProject: (name: string) => Promise<void>;
  listProjects: () => Promise<SavedProject[]>;
  deleteProject: (name: string) => Promise<void>;
  renameProject: (oldName: string, newName: string) => Promise<void>;
  exportProject: DataActions['exportProject'];
  importProject: DataActions['importProject'];
  newProject: DataActions['newProject'];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state from shared hook
  const [state, actions] = useDataState({
    persistence: azurePersistenceAdapter,
    autoSaveDelay: 1000,
  });

  // Azure-specific state
  const [currentProjectLocation, setCurrentProjectLocation] = useState<StorageLocation>('team');

  // Cloud sync hook
  const { saveProject: saveToCloud, syncStatus } = useStorage();

  /**
   * Save project with cloud sync
   * Saves locally first (instant feedback), then triggers cloud sync
   */
  const saveProject = useCallback(
    async (name: string, location: StorageLocation = 'team'): Promise<SavedProject> => {
      // Update default location for adapter
      setDefaultLocation(location);
      setCurrentProjectLocation(location);

      // Save locally via the shared hook's persistence adapter
      const project = await actions.saveProject(name);

      // Trigger cloud sync
      await saveToCloud(state, name, location);

      return project;
    },
    [actions, state, saveToCloud]
  );

  /**
   * Load project - delegates to shared hook
   * Note: Azure uses name-based lookups
   */
  const loadProject = useCallback(
    async (name: string): Promise<void> => {
      await actions.loadProject(name);
    },
    [actions]
  );

  /**
   * Delete project - delegates to shared hook
   * Note: Azure uses name-based lookups
   */
  const deleteProject = useCallback(
    async (name: string): Promise<void> => {
      await actions.deleteProject(name);
    },
    [actions]
  );

  /**
   * Rename project - delegates to shared hook
   * Note: Azure uses name-based lookups
   */
  const renameProject = useCallback(
    async (oldName: string, newName: string): Promise<void> => {
      await actions.renameProject(oldName, newName);
    },
    [actions]
  );

  // Combine state and actions into context value
  const value: DataContextType = {
    // Core state from shared hook
    rawData: state.rawData,
    filteredData: state.filteredData,
    outcome: state.outcome,
    factors: state.factors,
    timeColumn: state.timeColumn,
    specs: state.specs,
    grades: state.grades,
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
    separateParetoData: state.separateParetoData,
    separateParetoFilename: state.separateParetoFilename,
    fullDataYDomain: state.fullDataYDomain,
    yDomainForCharts: state.yDomainForCharts,

    // Azure-specific state
    currentProjectLocation,
    syncStatus,

    // Core setters from shared hook
    setRawData: actions.setRawData,
    setOutcome: actions.setOutcome,
    setFactors: actions.setFactors,
    setTimeColumn: actions.setTimeColumn,
    setSpecs: actions.setSpecs,
    setGrades: actions.setGrades,
    setFilters: actions.setFilters,
    setAxisSettings: actions.setAxisSettings,
    setChartTitles: actions.setChartTitles,
    setColumnAliases: actions.setColumnAliases,
    setValueLabels: actions.setValueLabels,
    setDisplayOptions: actions.setDisplayOptions,
    setDataFilename: actions.setDataFilename,
    setDataQualityReport: actions.setDataQualityReport,
    setParetoMode: actions.setParetoMode,
    setSeparateParetoData: actions.setSeparateParetoData,
    setSeparateParetoFilename: actions.setSeparateParetoFilename,
    setStageColumn: actions.setStageColumn,
    setStageOrderMode: actions.setStageOrderMode,

    // Azure-enhanced persistence methods
    saveProject,
    loadProject,
    listProjects: actions.listProjects,
    deleteProject,
    renameProject,
    exportProject: actions.exportProject,
    importProject: actions.importProject,
    newProject: actions.newProject,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

/**
 * Hook to access the DataContext
 * @throws Error if used outside of DataProvider
 */
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

// Export additional types for component type annotations
export type { StatsResult, StagedStatsResult, StageOrderMode, SyncStatus };
