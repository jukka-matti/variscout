import { useState, useCallback, useMemo, useEffect, useRef, useTransition } from 'react';
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
import type { FilterNavigationContext } from './types';
import {
  type HistoryState,
  buildFilterStackFromUrl,
  buildFilterStackFromState,
} from './filterUtils';

/**
 * Options for useFilterNavigation hook
 */
export interface UseFilterNavigationOptions {
  /** Push/pop browser history on filter changes (enables back button) */
  enableHistory?: boolean;
  /** Sync filters to URL parameters (enables shareable URLs) */
  enableUrlSync?: boolean;
  /** External filter stack state (for DataContext persistence) */
  externalFilterStack?: FilterAction[];
  /** External setter for filter stack (for DataContext persistence) */
  externalSetFilterStack?: (stack: FilterAction[]) => void;
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

  /** Remove the last filter from the stack */
  removeLastFilter: () => void;

  /** Navigate to a specific point in filter history. Pass 'root' to clear all filters */
  navigateTo: (actionId: string) => void;

  /** Clear all filter state (back to root) */
  clearFilters: () => void;

  /** Set highlight without filtering (for I-Chart) */
  setHighlight: (rowIndex: number, value: number, originalIndex?: number) => void;

  /** Clear current highlight */
  clearHighlight: () => void;

  /** Check if there are any active filters */
  hasFilters: boolean;

  /** True while a filter transition is pending (heavy computation in progress) */
  isFilterPending: boolean;

  /**
   * Update the values for an existing filter.
   * If the filter doesn't exist, creates a new one.
   * If newValues is empty, removes the filter.
   */
  updateFilterValues: (
    factor: string,
    newValues: (string | number)[],
    source?: FilterSource
  ) => void;

  /** Remove a specific filter by factor name */
  removeFilter: (factor: string) => void;
}

/**
 * Hook for managing filter navigation state
 *
 * Uses context injection pattern - apps pass their data context
 * rather than this hook importing a specific context.
 *
 * @example
 * ```tsx
 * const { filters, setFilters, columnAliases } = useData();
 * const { applyFilter, breadcrumbs, clearFilters } = useFilterNavigation(
 *   { filters, setFilters, columnAliases },
 *   { enableHistory: true, enableUrlSync: true }
 * );
 * ```
 */
export function useFilterNavigation(
  context: FilterNavigationContext,
  options: UseFilterNavigationOptions = {}
): UseFilterNavigationReturn {
  const {
    enableHistory = false,
    enableUrlSync = false,
    externalFilterStack,
    externalSetFilterStack,
  } = options;
  const { setFilters, columnAliases } = context;

  // Use external state when provided (for persistence), otherwise internal
  const [internalFilterStack, internalSetFilterStack] = useState<FilterAction[]>([]);
  const filterStack = externalFilterStack ?? internalFilterStack;
  const setFilterStack = externalSetFilterStack ?? internalSetFilterStack;
  const [currentHighlight, setCurrentHighlight] = useState<HighlightState | null>(null);
  const [isFilterPending, startTransition] = useTransition();

  // Track if we're handling a popstate event (to avoid pushing history)
  const isPopstateRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const shouldSyncUrl = enableUrlSync && !isEmbedMode();
  const shouldUseHistory = enableHistory && !isEmbedMode();

  // Initialize from URL parameters on mount
  useEffect(() => {
    if (!shouldSyncUrl || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const urlFilters = searchParamsToFilters(new URLSearchParams(window.location.search));
    if (Object.keys(urlFilters).length > 0) {
      const initialStack = buildFilterStackFromUrl(urlFilters, columnAliases);
      setFilterStack(initialStack);
      setFilters(urlFilters);

      if (shouldUseHistory) {
        const state: HistoryState = { drillFilters: urlFilters };
        window.history.replaceState(state, '');
      }
    } else if (shouldUseHistory) {
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
      const restoredStack = buildFilterStackFromState(restoredFilters, columnAliases);

      setFilterStack(restoredStack);
      setFilters(restoredFilters);

      if (shouldSyncUrl) {
        const newUrl = updateUrlWithFilters(restoredFilters);
        window.history.replaceState(event.state, '', newUrl);
      }

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
      // Mark filter application as non-urgent — keeps breadcrumb UI responsive
      // while the expensive filteredData re-computation runs in the background
      startTransition(() => {
        setFilters(newFilters);
      });

      if (shouldSyncUrl) {
        const newUrl = updateUrlWithFilters(newFilters);
        if (shouldUseHistory && pushHistory && !isPopstateRef.current) {
          const state: HistoryState = { drillFilters: newFilters };
          window.history.pushState(state, '', newUrl);
        } else {
          window.history.replaceState(window.history.state, '', newUrl);
        }
      } else if (shouldUseHistory && pushHistory && !isPopstateRef.current) {
        const state: HistoryState = { drillFilters: newFilters };
        window.history.pushState(state, '');
      }
    },
    [setFilters, shouldSyncUrl, shouldUseHistory]
  );

  const applyFilter = useCallback(
    (params: {
      type: FilterType;
      source: FilterSource;
      factor?: string;
      values: (string | number)[];
      rowIndex?: number;
      originalIndex?: number;
    }) => {
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

      if (shouldToggleFilter(filterStack, params)) {
        const newStack = filterStack.filter(
          a => !(a.type === 'filter' && a.factor === params.factor)
        );
        setFilterStack(newStack);
        syncFiltersFromStack(newStack);
        return;
      }

      const action = createFilterAction({
        type: params.type,
        source: params.source,
        factor: params.factor,
        values: params.values,
        rowIndex: params.rowIndex,
      });

      if (params.factor && columnAliases[params.factor]) {
        action.label = action.label.replace(params.factor, columnAliases[params.factor]);
      }

      const newStack = pushFilterStack(filterStack, action);
      setFilterStack(newStack);
      syncFiltersFromStack(newStack);
    },
    [filterStack, columnAliases, syncFiltersFromStack]
  );

  const removeLastFilter = useCallback(() => {
    const newStack = popFilterStack(filterStack);
    setFilterStack(newStack);
    syncFiltersFromStack(newStack);
  }, [filterStack, syncFiltersFromStack]);

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

  const clearFilters = useCallback(() => {
    setFilterStack([]);
    syncFiltersFromStack([]);
    setCurrentHighlight(null);
  }, [syncFiltersFromStack]);

  const setHighlight = useCallback((rowIndex: number, value: number, originalIndex?: number) => {
    setCurrentHighlight({ rowIndex, value, originalIndex });
  }, []);

  const clearHighlight = useCallback(() => {
    setCurrentHighlight(null);
  }, []);

  const updateFilterValues = useCallback(
    (factor: string, newValues: (string | number)[], source: FilterSource = 'boxplot') => {
      if (newValues.length === 0) {
        const newStack = filterStack.filter(a => !(a.type === 'filter' && a.factor === factor));
        setFilterStack(newStack);
        syncFiltersFromStack(newStack);
        return;
      }

      const existingIndex = filterStack.findIndex(a => a.type === 'filter' && a.factor === factor);

      if (existingIndex >= 0) {
        const newStack = [...filterStack];
        const existing = newStack[existingIndex];
        const newLabel = `${factor}: ${newValues.slice(0, 2).map(String).join(', ')}${newValues.length > 2 ? ` +${newValues.length - 2}` : ''}`;
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
        const action = createFilterAction({
          type: 'filter',
          source,
          factor,
          values: newValues,
        });
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

  const removeFilter = useCallback(
    (factor: string) => {
      const newStack = filterStack.filter(a => !(a.type === 'filter' && a.factor === factor));
      setFilterStack(newStack);
      syncFiltersFromStack(newStack);
    },
    [filterStack, syncFiltersFromStack]
  );

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
    isFilterPending,
    updateFilterValues,
    removeFilter,
  };
}

export default useFilterNavigation;
