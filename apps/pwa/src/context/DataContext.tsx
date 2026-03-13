/**
 * DataContext - Central state management for VariScout PWA
 *
 * Uses the shared useDataState hook from @variscout/hooks for core state management.
 * Split into DataStateContext and DataActionsContext following Kent C. Dodds pattern
 * for optimal re-render behavior: action-only consumers don't re-render on state changes.
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
import { type StatsResult, type StagedStatsResult, type StageOrderMode } from '@variscout/core';
import { pwaPersistenceAdapter } from '../lib/persistenceAdapter';

// Re-export types for backwards compatibility
export type { DisplayOptions, ChartTitles, ParetoMode, DataQualityReport, ParetoRow };

const DataStateContext = createContext<DataState | undefined>(undefined);
const DataActionsContext = createContext<DataActions | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, actions] = useDataState({
    persistence: pwaPersistenceAdapter,
  });

  return (
    <DataStateContext.Provider value={state}>
      <DataActionsContext.Provider value={actions}>{children}</DataActionsContext.Provider>
    </DataStateContext.Provider>
  );
};

/**
 * Hook to access only state (re-renders on state changes)
 */
export const useDataStateCtx = (): DataState => {
  const context = useContext(DataStateContext);
  if (!context) {
    throw new Error('useDataStateCtx must be used within DataProvider');
  }
  return context;
};

/**
 * Hook to access only actions (stable — never triggers re-renders)
 */
export const useDataActions = (): DataActions => {
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
export const useData = (): DataState & DataActions => {
  const state = useDataStateCtx();
  const actions = useDataActions();
  return { ...state, ...actions };
};

// Export additional types for component type annotations
export type { StatsResult, StagedStatsResult, StageOrderMode };
