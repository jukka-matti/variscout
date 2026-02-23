/**
 * Pure utility functions for filter navigation.
 *
 * Extracted from useFilterNavigation to keep URL/history parsing
 * logic testable without React.
 */
import { createFilterAction, type FilterAction } from '@variscout/core';

/**
 * History state stored in browser history entries.
 */
export interface HistoryState {
  drillFilters: Record<string, (string | number)[]>;
}

/**
 * Build a FilterAction[] from URL search parameters.
 *
 * Each `filter_<factor>=val1,val2` pair becomes one FilterAction.
 * Column aliases are applied to the label if provided.
 */
export function buildFilterStackFromUrl(
  urlFilters: Record<string, (string | number)[]>,
  columnAliases: Record<string, string>
): FilterAction[] {
  const stack: FilterAction[] = [];
  for (const [factor, values] of Object.entries(urlFilters)) {
    const action = createFilterAction({
      type: 'filter',
      source: 'boxplot', // Default source for URL-loaded filters
      factor,
      values,
    });
    if (columnAliases[factor]) {
      action.label = action.label.replace(factor, columnAliases[factor]);
    }
    stack.push(action);
  }
  return stack;
}

/**
 * Build a FilterAction[] from a restored browser history state.
 *
 * Re-creates actions from the `drillFilters` record persisted
 * in `window.history.state` so the back/forward buttons work.
 */
export function buildFilterStackFromState(
  restoredFilters: Record<string, (string | number)[]>,
  columnAliases: Record<string, string>
): FilterAction[] {
  const stack: FilterAction[] = [];
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
    stack.push(action);
  }
  return stack;
}
