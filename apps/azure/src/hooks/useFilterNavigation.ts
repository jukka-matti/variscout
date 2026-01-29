import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import {
  type FilterAction,
  type FilterSource,
  type FilterType,
  type HighlightState,
  type BreadcrumbItem,
  createFilterAction,
  popFilterStack,
  popFilterStackTo,
  pushFilterStack,
  filterStackToFilters,
  filterStackToBreadcrumbs,
  shouldToggleFilter,
  searchParamsToFilters,
  updateUrlWithFilters,
  isEmbedMode,
} from '@variscout/core';

/**
 * Options for useFilterNavigation hook
 */
export interface UseFilterNavigationOptions {
  /** Push/pop browser history on filter changes (enables back button) */
  enableHistory?: boolean;
  /** Sync filters to URL parameters (enables shareable URLs) */
  enableUrlSync?: boolean;
}

export interface UseFilterNavigationReturn {
  /** Current filter stack */
  filterStack: FilterAction[];

  /** Breadcrumb items for UI display */
  breadcrumbs: BreadcrumbItem[];

  /** Current highlight state (I-Chart point) */
  currentHighlight: HighlightState | null;

  /**
   * Apply a filter to the data
   * For filter type: applies filter and adds to breadcrumb trail
   * For highlight type: just highlights without filtering
   */
  applyFilter: (params: {
    type: FilterType;
    source: FilterSource;
    factor?: string;
    values: (string | number)[];
    rowIndex?: number;
    originalIndex?: number;
  }) => void;

  /**
   * Remove the last filter from the stack
   */
  removeLastFilter: () => void;

  /**
   * Navigate to a specific point in filter history
   * Pass 'root' to clear all filters
   */
  navigateTo: (actionId: string) => void;

  /**
   * Clear all filter state (back to root)
   */
  clearFilters: () => void;

  /**
   * Set highlight without filtering (for I-Chart)
   */
  setHighlight: (rowIndex: number, value: number, originalIndex?: number) => void;

  /**
   * Clear current highlight
   */
  clearHighlight: () => void;

  /**
   * Check if there are any active filters
   */
  hasFilters: boolean;

  /**
   * Update the values for an existing filter
   * If the filter doesn't exist, creates a new one
   * If newValues is empty, removes the filter
   */
  updateFilterValues: (
    factor: string,
    newValues: (string | number)[],
    source?: FilterSource
  ) => void;

  /**
   * Remove a specific filter by factor name
   */
  removeFilter: (factor: string) => void;
}

/**
 * History state stored in browser history
 */
interface HistoryState {
  drillFilters: Record<string, (string | number)[]>;
}

/**
 * Hook for managing filter navigation state
 *
 * Provides:
 * - Filter stack for tracking navigation history
 * - Breadcrumb generation for UI
 * - Automatic filter sync with DataContext
 * - Toggle behavior (clicking same filter removes it)
 * - Browser history integration (back button support)
 * - URL parameter sync (shareable URLs)
 *
 * @param options - Configuration options
 * @param options.enableHistory - Push/pop browser history on filter changes
 * @param options.enableUrlSync - Sync filters to URL parameters
 */
export function useFilterNavigation(
  options: UseFilterNavigationOptions = {}
): UseFilterNavigationReturn {
  const { enableHistory = false, enableUrlSync = false } = options;
  const { filters, setFilters, columnAliases } = useData();

  // Filter navigation state
  const [filterStack, setFilterStack] = useState<FilterAction[]>([]);
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
      // Create filter actions from URL filters
      const initialStack: FilterAction[] = [];
      for (const [factor, values] of Object.entries(urlFilters)) {
        const action = createFilterAction({
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
      setFilterStack(initialStack);
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

      // Rebuild filter stack from restored filters
      const restoredStack: FilterAction[] = [];
      for (const [factor, values] of Object.entries(restoredFilters)) {
        const action = createFilterAction({
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

      setFilterStack(restoredStack);
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

  // Sync filter stack to DataContext filters and optionally update URL/history
  const syncFiltersFromStack = useCallback(
    (stack: FilterAction[], pushHistory = true) => {
      const newFilters = filterStackToFilters(stack);
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

  // Apply filter to data
  const applyFilter = useCallback(
    (params: {
      type: FilterType;
      source: FilterSource;
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
      if (shouldToggleFilter(filterStack, params)) {
        // Find and remove the matching action
        const newStack = filterStack.filter(
          a => !(a.type === 'filter' && a.factor === params.factor)
        );
        setFilterStack(newStack);
        syncFiltersFromStack(newStack);
        return;
      }

      // Create new filter action with proper label
      const action = createFilterAction({
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

      const newStack = pushFilterStack(filterStack, action);
      setFilterStack(newStack);
      syncFiltersFromStack(newStack);
    },
    [filterStack, columnAliases, syncFiltersFromStack]
  );

  // Remove the last filter
  const removeLastFilter = useCallback(() => {
    const newStack = popFilterStack(filterStack);
    setFilterStack(newStack);
    syncFiltersFromStack(newStack);
  }, [filterStack, syncFiltersFromStack]);

  // Navigate to specific point in history
  const navigateTo = useCallback(
    (actionId: string) => {
      if (actionId === 'root') {
        setFilterStack([]);
        syncFiltersFromStack([]);
        return;
      }

      const newStack = popFilterStackTo(filterStack, actionId);
      setFilterStack(newStack);
      syncFiltersFromStack(newStack);
    },
    [filterStack, syncFiltersFromStack]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterStack([]);
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

  // Update values for an existing filter (for multi-select)
  const updateFilterValues = useCallback(
    (factor: string, newValues: (string | number)[], source: FilterSource = 'boxplot') => {
      // If empty values, remove the filter entirely
      if (newValues.length === 0) {
        const newStack = filterStack.filter(a => !(a.type === 'filter' && a.factor === factor));
        setFilterStack(newStack);
        syncFiltersFromStack(newStack);
        return;
      }

      // Find existing filter for this factor
      const existingIndex = filterStack.findIndex(a => a.type === 'filter' && a.factor === factor);

      if (existingIndex >= 0) {
        // Update existing filter's values
        const newStack = [...filterStack];
        const existing = newStack[existingIndex];
        const newLabel = `${factor}: ${newValues.slice(0, 2).map(String).join(', ')}${newValues.length > 2 ? ` +${newValues.length - 2}` : ''}`;
        // Apply column alias to label if available
        const aliasedLabel = columnAliases[factor]
          ? newLabel.replace(factor, columnAliases[factor])
          : newLabel;
        newStack[existingIndex] = {
          ...existing,
          values: newValues,
          label: aliasedLabel,
        };
        setFilterStack(newStack);
        syncFiltersFromStack(newStack);
      } else {
        // Create new filter
        const action = createFilterAction({
          type: 'filter',
          source,
          factor,
          values: newValues,
        });
        // Update label with alias if available
        if (columnAliases[factor]) {
          action.label = action.label.replace(factor, columnAliases[factor]);
        }
        const newStack = pushFilterStack(filterStack, action);
        setFilterStack(newStack);
        syncFiltersFromStack(newStack);
      }
    },
    [filterStack, columnAliases, syncFiltersFromStack]
  );

  // Remove a specific filter by factor name
  const removeFilter = useCallback(
    (factor: string) => {
      const newStack = filterStack.filter(a => !(a.type === 'filter' && a.factor === factor));
      setFilterStack(newStack);
      syncFiltersFromStack(newStack);
    },
    [filterStack, syncFiltersFromStack]
  );

  // Generate breadcrumb items with aliased labels
  const breadcrumbs = useMemo(() => {
    return filterStackToBreadcrumbs(filterStack, 'All Data');
  }, [filterStack]);

  const hasFilters = filterStack.length > 0;

  return {
    filterStack,
    breadcrumbs,
    currentHighlight,
    applyFilter,
    removeLastFilter,
    navigateTo,
    clearFilters,
    setHighlight,
    clearHighlight,
    hasFilters,
    updateFilterValues,
    removeFilter,
  };
}

export default useFilterNavigation;
