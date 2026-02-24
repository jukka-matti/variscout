import { useState, useEffect, useCallback, useMemo } from 'react';
import type { RegressionPersistenceState, ReductionStepData } from './types';

/**
 * Regression analysis mode
 */
export type RegressionMode = 'simple' | 'advanced';

/**
 * A single step in the model reduction history
 */
export interface ReductionStep {
  /** Term that was removed */
  term: string;
  /** P-value of the removed term */
  pValue: number;
  /** Adjusted R² before removal */
  adjR2Before: number;
  /** Adjusted R² after removal */
  adjR2After: number;
}

/**
 * Options for useRegressionState
 */
export interface UseRegressionStateOptions {
  /** Maximum number of X columns for simple mode (default: 4) */
  maxSimpleColumns?: number;
  /** Available numeric columns for auto-selection */
  numericColumns: string[];
  /** External predictors to pre-populate (switches to Advanced mode) */
  initialPredictors?: string[];
  /** Pre-ranked columns by R² for smarter simple-mode auto-selection */
  rankedColumns?: string[];
  /** All available columns (numeric + categorical) for validating initialPredictors */
  allColumns?: string[];
  /** Saved regression state to restore (from project persistence) */
  savedState?: RegressionPersistenceState | null;
  /** Current total row count (for staleness detection) */
  dataRowCount?: number;
}

/**
 * State and actions returned by useRegressionState
 */
export interface UseRegressionStateReturn {
  // Mode
  mode: RegressionMode;
  setMode: (mode: RegressionMode) => void;

  // Simple mode state
  selectedXColumns: string[];
  toggleXColumn: (col: string) => void;

  // Advanced mode state
  advSelectedPredictors: string[];
  toggleAdvPredictor: (col: string) => void;
  categoricalColumns: Set<string>;
  toggleCategorical: (col: string) => void;
  includeInteractions: boolean;
  setIncludeInteractions: (include: boolean) => void;

  // Model reduction
  reductionHistory: ReductionStep[];
  addReductionStep: (step: ReductionStep) => void;
  updateLastStepAdjR2After: (adjR2After: number) => void;
  clearReductionHistory: () => void;

  // Modal state
  expandedChart: string | null;
  setExpandedChart: (col: string | null) => void;

  /** Snapshot current state for persistence (converts Set → array) */
  getState: () => RegressionPersistenceState;

  /** Row count at time of last model computation (for staleness detection) */
  modelDataRowCount: number | undefined;
  /** Update model row count (called when regression model is recomputed) */
  setModelDataRowCount: (count: number) => void;
}

/**
 * Hook for managing RegressionPanel state
 *
 * Consolidates the 6 useState calls from RegressionPanel into a single hook
 * with related state and actions.
 *
 * @example
 * ```tsx
 * const regression = useRegressionState({
 *   numericColumns: columns.numeric,
 *   maxSimpleColumns: 4,
 * });
 *
 * // Use in component:
 * regression.mode // 'simple' | 'advanced'
 * regression.toggleXColumn('Temperature') // Toggle column selection
 * ```
 */
export function useRegressionState(options: UseRegressionStateOptions): UseRegressionStateReturn {
  const {
    maxSimpleColumns = 4,
    numericColumns,
    initialPredictors,
    rankedColumns,
    allColumns,
    savedState,
    dataRowCount,
  } = options;

  // Mode state — restore from saved if available
  const [mode, setMode] = useState<RegressionMode>(savedState?.mode ?? 'simple');

  // Simple mode state — restore from saved if available
  const [selectedXColumns, setSelectedXColumns] = useState<string[]>(
    savedState?.selectedXColumns ?? []
  );

  // Advanced mode state — restore from saved if available
  const [advSelectedPredictors, setAdvSelectedPredictors] = useState<string[]>(
    savedState?.advSelectedPredictors ?? []
  );
  const [categoricalColumns, setCategoricalColumns] = useState<Set<string>>(
    savedState?.categoricalColumns ? new Set(savedState.categoricalColumns) : new Set()
  );
  const [includeInteractions, setIncludeInteractions] = useState(
    savedState?.includeInteractions ?? false
  );

  // Model reduction state — restore from saved if available
  const [reductionHistory, setReductionHistory] = useState<ReductionStep[]>(
    (savedState?.reductionHistory as ReductionStep[] | undefined) ?? []
  );

  // Data staleness tracking
  const [modelDataRowCount, setModelDataRowCount] = useState<number | undefined>(
    savedState?.dataRowCount
  );

  // Modal state
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // Auto-select columns for simple mode: prefer ranked (by R²) if available
  useEffect(() => {
    if (selectedXColumns.length === 0 && numericColumns.length > 0) {
      if (rankedColumns && rankedColumns.length > 0) {
        // Use pre-ranked columns (top N by R²)
        const validRanked = rankedColumns.filter(c => numericColumns.includes(c));
        setSelectedXColumns(validRanked.slice(0, maxSimpleColumns));
      } else {
        setSelectedXColumns(numericColumns.slice(0, maxSimpleColumns));
      }
    }
  }, [numericColumns, selectedXColumns.length, maxSimpleColumns, rankedColumns]);

  // Apply external initialPredictors (from investigation → regression bridge)
  useEffect(() => {
    if (initialPredictors && initialPredictors.length > 0) {
      // Validate: only keep columns that actually exist in the dataset
      const validSet = allColumns ?? numericColumns;
      const validPredictors = initialPredictors.filter(col => validSet.includes(col));
      if (validPredictors.length === 0) return;

      setMode('advanced');
      setAdvSelectedPredictors(validPredictors);
      // Mark categorical columns that aren't in numeric list
      const catSet = new Set<string>();
      for (const col of validPredictors) {
        if (!numericColumns.includes(col)) {
          catSet.add(col);
        }
      }
      if (catSet.size > 0) {
        setCategoricalColumns(catSet);
      }
    }
  }, [initialPredictors, numericColumns, allColumns]);

  // Toggle simple mode X column selection
  const toggleXColumn = useCallback(
    (col: string) => {
      if (selectedXColumns.includes(col)) {
        setSelectedXColumns(prev => prev.filter(c => c !== col));
      } else if (selectedXColumns.length < maxSimpleColumns) {
        setSelectedXColumns(prev => [...prev, col]);
      }
    },
    [selectedXColumns, maxSimpleColumns]
  );

  // Toggle advanced mode predictor selection
  const toggleAdvPredictor = useCallback(
    (col: string) => {
      if (advSelectedPredictors.includes(col)) {
        setAdvSelectedPredictors(prev => prev.filter(c => c !== col));
        // Also remove from categorical if present
        setCategoricalColumns(prev => {
          const next = new Set(prev);
          next.delete(col);
          return next;
        });
      } else {
        setAdvSelectedPredictors(prev => [...prev, col]);
      }
    },
    [advSelectedPredictors]
  );

  // Toggle categorical treatment for a column
  const toggleCategorical = useCallback((col: string) => {
    setCategoricalColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  }, []);

  // Model reduction actions
  const addReductionStep = useCallback((step: ReductionStep) => {
    setReductionHistory(prev => [...prev, step]);
  }, []);

  const updateLastStepAdjR2After = useCallback((adjR2After: number) => {
    setReductionHistory(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], adjR2After };
      return updated;
    });
  }, []);

  const clearReductionHistory = useCallback(() => {
    setReductionHistory([]);
  }, []);

  // Snapshot current state for persistence (converts Set → array)
  const getState = useCallback(
    (): RegressionPersistenceState => ({
      mode,
      selectedXColumns: selectedXColumns.length > 0 ? selectedXColumns : undefined,
      advSelectedPredictors: advSelectedPredictors.length > 0 ? advSelectedPredictors : undefined,
      categoricalColumns: categoricalColumns.size > 0 ? Array.from(categoricalColumns) : undefined,
      includeInteractions: includeInteractions || undefined,
      reductionHistory:
        reductionHistory.length > 0 ? (reductionHistory as ReductionStepData[]) : undefined,
      dataRowCount: modelDataRowCount,
    }),
    [
      mode,
      selectedXColumns,
      advSelectedPredictors,
      categoricalColumns,
      includeInteractions,
      reductionHistory,
      modelDataRowCount,
    ]
  );

  return {
    // Mode
    mode,
    setMode,

    // Simple mode
    selectedXColumns,
    toggleXColumn,

    // Advanced mode
    advSelectedPredictors,
    toggleAdvPredictor,
    categoricalColumns,
    toggleCategorical,
    includeInteractions,
    setIncludeInteractions,

    // Model reduction
    reductionHistory,
    addReductionStep,
    updateLastStepAdjR2After,
    clearReductionHistory,

    // Modal
    expandedChart,
    setExpandedChart,

    // Persistence
    getState,

    // Staleness tracking
    modelDataRowCount,
    setModelDataRowCount,
  };
}
