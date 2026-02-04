/**
 * DataContext - Central state management for VariScout PWA
 *
 * Uses the shared useDataState hook from @variscout/hooks for core state management,
 * reducing duplication with the Azure app while maintaining full API compatibility.
 */
import React, { createContext, useContext, useMemo, useEffect } from 'react';
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
import {
  validateThresholds,
  type StatsResult,
  type StagedStatsResult,
  type StageOrderMode,
} from '@variscout/core';
import { pwaPersistenceAdapter } from '../lib/persistenceAdapter';

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
  });

  // Load cpkThresholds from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('variscout_cpk_thresholds');
    if (stored) {
      try {
        const thresholds = JSON.parse(stored);
        if (validateThresholds(thresholds)) {
          actions.setCpkThresholds(thresholds);
        }
      } catch (e) {
        console.error('Failed to load Cpk thresholds from localStorage:', e);
      }
    }
  }, [actions]);

  // Combine state and actions into a memoized context value
  const value = useMemo<DataContextType>(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions]
  );

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
