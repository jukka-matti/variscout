/**
 * DataContext - Central state management for VariScout PWA
 *
 * Uses the shared useDataState hook from @variscout/hooks for core state management,
 * reducing duplication with the Azure app while maintaining full API compatibility.
 */
import React, { createContext, useContext } from 'react';
import {
  useDataState,
  type DataState,
  type DataActions,
  type DisplayOptions,
  type ChartTitles,
  type ParetoMode,
  type DataQualityReport,
  type ParetoRow,
} from '@variscout/hooks';
import { pwaPersistenceAdapter } from '../lib/persistenceAdapter';
import type { StatsResult, StagedStatsResult, StageOrderMode } from '@variscout/core';

// Re-export types for backwards compatibility
export type { DisplayOptions, ChartTitles, ParetoMode, DataQualityReport, ParetoRow };

/**
 * Full DataContext interface - combines DataState and DataActions
 * Maintains backwards compatibility with existing component imports
 */
interface DataContextType extends DataState, DataActions {
  // All state and actions are inherited from DataState and DataActions
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, actions] = useDataState({
    persistence: pwaPersistenceAdapter,
    autoSaveDelay: 1000,
  });

  // Combine state and actions into a single context value
  const value: DataContextType = {
    ...state,
    ...actions,
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
export type { StatsResult, StagedStatsResult, StageOrderMode };
