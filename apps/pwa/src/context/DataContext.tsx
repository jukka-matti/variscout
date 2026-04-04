/**
 * DataContext - Central state management for VariScout PWA
 *
 * Uses the shared useDataState hook from @variscout/hooks for core state management.
 * Split into DataStateContext and DataActionsContext following Kent C. Dodds pattern
 * for optimal re-render behavior: action-only consumers don't re-render on state changes.
 */
import React, { createContext, useContext, useMemo } from 'react';
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
import { useStatsWorker } from '../workers/useStatsWorker';
import { useStoreSync } from './useStoreSync';

// Re-export types for backwards compatibility
export type { DisplayOptions, ChartTitles, ParetoMode, DataQualityReport, ParetoRow };

const DataStateContext = createContext<DataState | undefined>(undefined);
const DataActionsContext = createContext<DataActions | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const workerApi = useStatsWorker();
  const [state, actions] = useDataState({
    persistence: pwaPersistenceAdapter,
    workerApi,
  });

  // ---------------------------------------------------------------------------
  // Store sync: Investigation store is source of truth for findings/questions/categories.
  // The sync hook reads from the store and pushes changes back to useDataState
  // for persistence serialization.
  // ---------------------------------------------------------------------------
  const storeSync = useStoreSync({
    stateFindings: state.findings,
    stateQuestions: state.questions,
    stateCategories: state.categories,
    setStateFindings: actions.setFindings,
    setStateQuestions: actions.setQuestions,
    setStateCategories: actions.setCategories,
  });

  // Memoize state context to avoid unnecessary re-renders
  const stateValue = useMemo<DataState>(
    () => ({
      ...state,
      // Override investigation fields with store-authoritative values
      findings: storeSync.findings,
      questions: storeSync.questions,
      categories: storeSync.categories,
    }),
    [state, storeSync.findings, storeSync.questions, storeSync.categories]
  );

  // Memoize actions context to avoid unnecessary re-renders
  const actionsValue = useMemo<DataActions>(
    () => ({
      ...actions,
      // Route investigation setters through the store
      setFindings: storeSync.setFindings,
      setQuestions: storeSync.setQuestions,
      setCategories: storeSync.setCategories,
    }),
    [actions, storeSync.setFindings, storeSync.setQuestions, storeSync.setCategories]
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
