import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  searchParamsToFilters,
  updateUrlWithFilters,
  isEmbedMode,
} from '@variscout/core';
import type { DrillDownContext } from './types';

/**
 * Options for useDrillDown hook
 */
export interface UseDrillDownOptions {
  /** Push/pop browser history on drill changes (enables back button) */
  enableHistory?: boolean;
  /** Sync filters to URL parameters (enables shareable URLs) */
  enableUrlSync?: boolean;
}

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
 * History state stored in browser history
 */
interface HistoryState {
  drillFilters: Record<string, (string | number)[]>;
}

/**
 * Hook for managing drill-down navigation state
 *
 * Uses context injection pattern - apps pass their data context
 * rather than this hook importing a specific context.
 *
 * Provides:
 * - Drill stack for tracking navigation history
 * - Breadcrumb generation for UI
 * - Automatic filter sync with DataContext
 * - Toggle behavior (clicking same filter removes it)
 * - Browser history integration (back button support)
 * - URL parameter sync (shareable URLs)
 *
 * @param context - Drill down context with filters and setFilters
 * @param options - Configuration options
 * @param options.enableHistory - Push/pop browser history on drill changes
 * @param options.enableUrlSync - Sync filters to URL parameters
 *
 * @example
 * ```tsx
 * // In PWA or Azure app
 * const { filters, setFilters, columnAliases } = useData();
 * const { drillDown, breadcrumbs, clearDrill } = useDrillDown(
 *   { filters, setFilters, columnAliases },
 *   { enableHistory: true, enableUrlSync: true }
 * );
 *
 * // Drill into Pareto category
 * drillDown({
 *   type: 'filter',
 *   source: 'pareto',
 *   factor: 'DefectType',
 *   values: ['Scratch'],
 * });
 * ```
 */
export function useDrillDown(
  context: DrillDownContext,
  options: UseDrillDownOptions = {}
): UseDrillDownReturn {
  const { enableHistory = false, enableUrlSync = false } = options;
  const { filters, setFilters, columnAliases } = context;

  // Drill navigation state
  const [drillStack, setDrillStack] = useState<DrillAction[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState<HighlightState | null>(null);

  // Track if we're handling a popstate event (to avoid pushing history)
  const isPopstateRef = useRef(false);
  // Track if we've initialized from URL
  const hasInitializedRef = useRef(false);

  // Check if we should sync to URL (not in embed mode)
  const shouldSyncUrl = enableUrlSync && !isEmbedMode();
  const shouldUseHistory = enableHistory && !isEmbedMode();

  // Initialize from URL parameters on mount
  useEffect(() => {
    if (!shouldSyncUrl || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const urlFilters = searchParamsToFilters(new URLSearchParams(window.location.search));
    if (Object.keys(urlFilters).length > 0) {
      // Create drill actions from URL filters
      const initialStack: DrillAction[] = [];
      for (const [factor, values] of Object.entries(urlFilters)) {
        const action = createDrillAction({
          type: 'filter',
          source: 'boxplot', // Default source for URL-loaded filters
          factor,
          values,
        });
        // Update label with alias if available
        if (columnAliases[factor]) {
          action.label = action.label.replace(factor, columnAliases[factor]);
        }
        initialStack.push(action);
      }
      setDrillStack(initialStack);
      setFilters(urlFilters);

      // Replace current history state to include initial filters
      if (shouldUseHistory) {
        const state: HistoryState = { drillFilters: urlFilters };
        window.history.replaceState(state, '');
      }
    } else if (shouldUseHistory) {
      // No URL filters - set empty state
      const state: HistoryState = { drillFilters: {} };
      window.history.replaceState(state, '');
    }
  }, [shouldSyncUrl, shouldUseHistory, columnAliases, setFilters]);

  // Handle browser back/forward button
  useEffect(() => {
    if (!shouldUseHistory) return;

    const handlePopstate = (event: PopStateEvent) => {
      isPopstateRef.current = true;

      const state = event.state as HistoryState | null;
      const restoredFilters = state?.drillFilters || {};

      // Rebuild drill stack from restored filters
      const restoredStack: DrillAction[] = [];
      for (const [factor, values] of Object.entries(restoredFilters)) {
        const action = createDrillAction({
          type: 'filter',
          source: 'boxplot',
          factor,
          values,
        });
        if (columnAliases[factor]) {
          action.label = action.label.replace(factor, columnAliases[factor]);
        }
        restoredStack.push(action);
      }

      setDrillStack(restoredStack);
      setFilters(restoredFilters);

      // Update URL to match restored state (if URL sync enabled)
      if (shouldSyncUrl) {
        const newUrl = updateUrlWithFilters(restoredFilters);
        window.history.replaceState(event.state, '', newUrl);
      }

      // Reset flag after state update
      setTimeout(() => {
        isPopstateRef.current = false;
      }, 0);
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [shouldUseHistory, shouldSyncUrl, columnAliases, setFilters]);

  // Sync drill stack to DataContext filters and optionally update URL/history
  const syncFiltersFromStack = useCallback(
    (stack: DrillAction[], pushHistory = true) => {
      const newFilters = drillStackToFilters(stack);
      setFilters(newFilters);

      // Update URL parameters
      if (shouldSyncUrl) {
        const newUrl = updateUrlWithFilters(newFilters);
        if (shouldUseHistory && pushHistory && !isPopstateRef.current) {
          // Push new history entry
          const state: HistoryState = { drillFilters: newFilters };
          window.history.pushState(state, '', newUrl);
        } else {
          // Just update URL without adding history entry
          window.history.replaceState(window.history.state, '', newUrl);
        }
      } else if (shouldUseHistory && pushHistory && !isPopstateRef.current) {
        // No URL sync but history enabled
        const state: HistoryState = { drillFilters: newFilters };
        window.history.pushState(state, '');
      }
    },
    [setFilters, shouldSyncUrl, shouldUseHistory]
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
        syncFiltersFromStack([]);
        return;
      }

      const newStack = popDrillStackTo(drillStack, actionId);
      setDrillStack(newStack);
      syncFiltersFromStack(newStack);
    },
    [drillStack, syncFiltersFromStack]
  );

  // Clear all drills
  const clearDrill = useCallback(() => {
    setDrillStack([]);
    syncFiltersFromStack([]);
    setCurrentHighlight(null);
  }, [syncFiltersFromStack]);

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
