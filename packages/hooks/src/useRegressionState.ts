import { useState, useEffect, useCallback } from 'react';

/**
 * Regression analysis mode
 */
export type RegressionMode = 'simple' | 'advanced';

/**
 * Options for useRegressionState
 */
export interface UseRegressionStateOptions {
  /** Maximum number of X columns for simple mode (default: 4) */
  maxSimpleColumns?: number;
  /** Available numeric columns for auto-selection */
  numericColumns: string[];
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

  // Modal state
  expandedChart: string | null;
  setExpandedChart: (col: string | null) => void;
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
  const { maxSimpleColumns = 4, numericColumns } = options;

  // Mode state
  const [mode, setMode] = useState<RegressionMode>('simple');

  // Simple mode state
  const [selectedXColumns, setSelectedXColumns] = useState<string[]>([]);

  // Advanced mode state
  const [advSelectedPredictors, setAdvSelectedPredictors] = useState<string[]>([]);
  const [categoricalColumns, setCategoricalColumns] = useState<Set<string>>(new Set());
  const [includeInteractions, setIncludeInteractions] = useState(false);

  // Modal state
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // Auto-select first N numeric columns if none selected
  useEffect(() => {
    if (selectedXColumns.length === 0 && numericColumns.length > 0) {
      setSelectedXColumns(numericColumns.slice(0, maxSimpleColumns));
    }
  }, [numericColumns, selectedXColumns.length, maxSimpleColumns]);

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

    // Modal
    expandedChart,
    setExpandedChart,
  };
}
