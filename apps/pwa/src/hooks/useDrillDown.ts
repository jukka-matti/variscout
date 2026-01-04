import { useState, useCallback, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  type DrillAction,
  type DrillSource,
  type DrillType,
  type HighlightState,
  type BreadcrumbItem,
  createDrillAction,
  popDrillStack,
  popDrillStackTo,
  pushDrillStack,
  drillStackToFilters,
  drillStackToBreadcrumbs,
  shouldToggleDrill,
} from '@variscout/core';

export interface UseDrillDownReturn {
  /** Current drill stack */
  drillStack: DrillAction[];

  /** Breadcrumb items for UI display */
  breadcrumbs: BreadcrumbItem[];

  /** Current highlight state (I-Chart point) */
  currentHighlight: HighlightState | null;

  /**
   * Drill down into data subset
   * For filter type: applies filter and adds to breadcrumb trail
   * For highlight type: just highlights without filtering
   */
  drillDown: (params: {
    type: DrillType;
    source: DrillSource;
    factor?: string;
    values: (string | number)[];
    rowIndex?: number;
    originalIndex?: number;
  }) => void;

  /**
   * Go back one level in drill history
   */
  drillUp: () => void;

  /**
   * Navigate to a specific point in drill history
   * Pass 'root' to clear all drills
   */
  drillTo: (actionId: string) => void;

  /**
   * Clear all drill state (back to root)
   */
  clearDrill: () => void;

  /**
   * Set highlight without filtering (for I-Chart)
   */
  setHighlight: (rowIndex: number, value: number, originalIndex?: number) => void;

  /**
   * Clear current highlight
   */
  clearHighlight: () => void;

  /**
   * Check if there are any active drills
   */
  hasDrills: boolean;
}

/**
 * Hook for managing drill-down navigation state
 *
 * Provides:
 * - Drill stack for tracking navigation history
 * - Breadcrumb generation for UI
 * - Automatic filter sync with DataContext
 * - Toggle behavior (clicking same filter removes it)
 *
 * @example
 * ```tsx
 * const { drillDown, breadcrumbs, clearDrill } = useDrillDown();
 *
 * // Drill into Pareto category
 * drillDown({
 *   type: 'filter',
 *   source: 'pareto',
 *   factor: 'DefectType',
 *   values: ['Scratch'],
 * });
 *
 * // Render breadcrumbs
 * breadcrumbs.map(item => (
 *   <button onClick={() => drillTo(item.id)}>{item.label}</button>
 * ));
 * ```
 */
export function useDrillDown(): UseDrillDownReturn {
  const { filters, setFilters, columnAliases } = useData();

  // Drill navigation state
  const [drillStack, setDrillStack] = useState<DrillAction[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState<HighlightState | null>(null);

  // Sync drill stack to DataContext filters
  const syncFiltersFromStack = useCallback(
    (stack: DrillAction[]) => {
      const newFilters = drillStackToFilters(stack);
      setFilters(newFilters);
    },
    [setFilters]
  );

  // Drill down into data
  const drillDown = useCallback(
    (params: {
      type: DrillType;
      source: DrillSource;
      factor?: string;
      values: (string | number)[];
      rowIndex?: number;
      originalIndex?: number;
    }) => {
      // Handle highlight separately (doesn't affect filters)
      if (params.type === 'highlight') {
        if (params.rowIndex !== undefined) {
          setCurrentHighlight({
            rowIndex: params.rowIndex,
            value: params.values[0] as number,
            originalIndex: params.originalIndex,
          });
        }
        return;
      }

      // Check if this would toggle off an existing filter
      if (shouldToggleDrill(drillStack, params)) {
        // Find and remove the matching action
        const newStack = drillStack.filter(
          a => !(a.type === 'filter' && a.factor === params.factor)
        );
        setDrillStack(newStack);
        syncFiltersFromStack(newStack);
        return;
      }

      // Create new drill action with proper label
      const action = createDrillAction({
        type: params.type,
        source: params.source,
        factor: params.factor,
        values: params.values,
        rowIndex: params.rowIndex,
      });

      // Update label to use column alias if available
      if (params.factor && columnAliases[params.factor]) {
        action.label = action.label.replace(params.factor, columnAliases[params.factor]);
      }

      const newStack = pushDrillStack(drillStack, action);
      setDrillStack(newStack);
      syncFiltersFromStack(newStack);
    },
    [drillStack, columnAliases, syncFiltersFromStack]
  );

  // Go back one level
  const drillUp = useCallback(() => {
    const newStack = popDrillStack(drillStack);
    setDrillStack(newStack);
    syncFiltersFromStack(newStack);
  }, [drillStack, syncFiltersFromStack]);

  // Navigate to specific point in history
  const drillTo = useCallback(
    (actionId: string) => {
      if (actionId === 'root') {
        setDrillStack([]);
        setFilters({});
        return;
      }

      const newStack = popDrillStackTo(drillStack, actionId);
      setDrillStack(newStack);
      syncFiltersFromStack(newStack);
    },
    [drillStack, setFilters, syncFiltersFromStack]
  );

  // Clear all drills
  const clearDrill = useCallback(() => {
    setDrillStack([]);
    setFilters({});
    setCurrentHighlight(null);
  }, [setFilters]);

  // Set highlight (I-Chart)
  const setHighlight = useCallback((rowIndex: number, value: number, originalIndex?: number) => {
    setCurrentHighlight({ rowIndex, value, originalIndex });
  }, []);

  // Clear highlight
  const clearHighlight = useCallback(() => {
    setCurrentHighlight(null);
  }, []);

  // Generate breadcrumb items with aliased labels
  const breadcrumbs = useMemo(() => {
    return drillStackToBreadcrumbs(drillStack, 'All Data');
  }, [drillStack]);

  const hasDrills = drillStack.length > 0;

  return {
    drillStack,
    breadcrumbs,
    currentHighlight,
    drillDown,
    drillUp,
    drillTo,
    clearDrill,
    setHighlight,
    clearHighlight,
    hasDrills,
  };
}

export default useDrillDown;
