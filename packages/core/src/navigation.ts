/**
 * Navigation types and utilities for filter navigation
 *
 * Provides a consistent navigation model across all VariScout products:
 * - PWA: Full interactive filter navigation with history
 * - Excel: Read-only display (slicers control filtering)
 * - Azure: Full interactive filter navigation with history
 */

/**
 * Types of filter actions
 * - highlight: Show data point without filtering (I-Chart)
 * - filter: Filter data to subset (Boxplot, Pareto)
 */
export type FilterType = 'highlight' | 'filter';

/**
 * Source chart that initiated the filter action
 */
export type FilterSource = 'ichart' | 'boxplot' | 'pareto' | 'histogram' | 'funnel' | 'mindmap';

/**
 * A single filter action in the navigation history
 */
export interface FilterAction {
  /** Unique identifier for this action */
  id: string;
  /** Type of action (highlight vs filter) */
  type: FilterType;
  /** Which chart initiated the filter */
  source: FilterSource;
  /** The factor/column being filtered */
  factor?: string;
  /** The value(s) being selected */
  values: (string | number)[];
  /** For I-Chart: the row index being highlighted */
  rowIndex?: number;
  /** Timestamp for ordering */
  timestamp: number;
  /** Display label for breadcrumb UI */
  label: string;
  /** Eta-squared (η²) - variation explained by this factor at filter time (0-100) */
  variationPct?: number;
}

/**
 * Current highlight state (I-Chart point selection)
 * Separate from filter stack as highlights don't filter data
 */
export interface HighlightState {
  /** Row index in filtered data */
  rowIndex: number;
  /** The Y value at that point */
  value: number;
  /** Original row index in raw data (for data table navigation) */
  originalIndex?: number;
}

/**
 * Complete navigation state
 */
export interface NavigationState {
  /** Stack of filter actions (newest last) */
  filterStack: FilterAction[];
  /** Current highlight (I-Chart only, not a filter) */
  currentHighlight: HighlightState | null;
}

/**
 * Generate a unique ID for a filter action
 */
export function generateFilterId(): string {
  return `filter-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a display label for a filter action
 */
export function getFilterLabel(action: FilterAction): string {
  if (action.type === 'highlight') {
    return `Point #${(action.rowIndex ?? 0) + 1}`;
  }

  const factorName = action.factor || 'Filter';

  // Format values with truncation for long lists
  if (action.values.length === 0) {
    return factorName;
  }

  const displayValues = action.values.slice(0, 2).map(String);
  const suffix = action.values.length > 2 ? ` +${action.values.length - 2}` : '';

  return `${factorName}: ${displayValues.join(', ')}${suffix}`;
}

/**
 * Convert a filter stack to a filters object for DataContext
 * Later actions for the same factor override earlier ones
 */
export function filterStackToFilters(stack: FilterAction[]): Record<string, (string | number)[]> {
  const filters: Record<string, (string | number)[]> = {};

  for (const action of stack) {
    // Only filter-type actions affect the filters
    if (action.type === 'filter' && action.factor) {
      filters[action.factor] = action.values;
    }
  }

  return filters;
}

/**
 * Create a new filter action with auto-generated ID and timestamp
 */
export function createFilterAction(
  params: Omit<FilterAction, 'id' | 'timestamp' | 'label'>
): FilterAction {
  const action: FilterAction = {
    ...params,
    id: generateFilterId(),
    timestamp: Date.now(),
    label: '', // Will be set below
  };
  action.label = getFilterLabel(action);
  return action;
}

/**
 * Find the index of a filter action by ID
 * Returns -1 if not found
 */
export function findFilterIndex(stack: FilterAction[], actionId: string): number {
  return stack.findIndex(a => a.id === actionId);
}

/**
 * Pop the filter stack back to a specific action (inclusive)
 * Returns the new stack with everything after actionId removed
 */
export function popFilterStackTo(stack: FilterAction[], actionId: string): FilterAction[] {
  const index = findFilterIndex(stack, actionId);
  if (index === -1) return stack;
  return stack.slice(0, index + 1);
}

/**
 * Pop the most recent action from the filter stack
 */
export function popFilterStack(stack: FilterAction[]): FilterAction[] {
  if (stack.length === 0) return stack;
  return stack.slice(0, -1);
}

/**
 * Push a new action onto the filter stack
 */
export function pushFilterStack(stack: FilterAction[], action: FilterAction): FilterAction[] {
  return [...stack, action];
}

/**
 * Check if clicking the same factor value should toggle (remove) the filter
 * Returns true if the action would result in the same filter as current
 */
export function shouldToggleFilter(
  stack: FilterAction[],
  newAction: Omit<FilterAction, 'id' | 'timestamp' | 'label'>
): boolean {
  if (newAction.type !== 'filter' || !newAction.factor) return false;

  // Find the most recent action for this factor
  const existingIndex = [...stack]
    .reverse()
    .findIndex(a => a.type === 'filter' && a.factor === newAction.factor);

  if (existingIndex === -1) return false;

  const existing = stack[stack.length - 1 - existingIndex];

  // Check if values are the same
  if (existing.values.length !== newAction.values.length) return false;

  const existingSet = new Set(existing.values.map(String));
  return newAction.values.every(v => existingSet.has(String(v)));
}

/**
 * Format breadcrumb items for UI display
 */
export interface BreadcrumbItem {
  id: string;
  label: string;
  isActive: boolean;
  source: FilterSource;
  /** Local variation % (η²) explained at this filter level (0-100) */
  localVariationPct?: number;
  /** Cumulative variation % isolated by all filters up to this point (0-100) */
  cumulativeVariationPct?: number;
}

/**
 * Convert filter stack to breadcrumb items for UI
 * Adds a "root" item at the beginning
 */
export function filterStackToBreadcrumbs(
  stack: FilterAction[],
  rootLabel = 'All Data'
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    {
      id: 'root',
      label: rootLabel,
      isActive: stack.length === 0,
      source: 'ichart', // Placeholder, root has no source
    },
  ];

  stack.forEach((action, index) => {
    items.push({
      id: action.id,
      label: action.label,
      isActive: index === stack.length - 1,
      source: action.source,
    });
  });

  return items;
}

/**
 * Initial/empty navigation state
 */
export const initialNavigationState: NavigationState = {
  filterStack: [],
  currentHighlight: null,
};

/**
 * Variation tracking thresholds for UI feedback
 *
 * HIGH_IMPACT (>50%): Green - "More than half your problem is HERE"
 * MODERATE_IMPACT (30-50%): Amber - "Significant chunk isolated"
 * Below 30%: Gray - "One of several contributors"
 */
export const VARIATION_THRESHOLDS = {
  /** Above this = high impact, green indicator, strong recommendation */
  HIGH_IMPACT: 50,
  /** Above this = moderate impact, amber indicator */
  MODERATE_IMPACT: 30,
} as const;

/**
 * Get the impact level for a variation percentage
 */
export function getVariationImpactLevel(variationPct: number): 'high' | 'moderate' | 'low' {
  if (variationPct >= VARIATION_THRESHOLDS.HIGH_IMPACT) return 'high';
  if (variationPct >= VARIATION_THRESHOLDS.MODERATE_IMPACT) return 'moderate';
  return 'low';
}

/**
 * Get insight text for a cumulative variation percentage
 */
export function getVariationInsight(cumulativePct: number): string {
  if (cumulativePct >= VARIATION_THRESHOLDS.HIGH_IMPACT) {
    return `Fix this combination to address more than half your quality problems.`;
  }
  if (cumulativePct >= VARIATION_THRESHOLDS.MODERATE_IMPACT) {
    return `This combination represents a significant chunk of your variation.`;
  }
  return `This is one of several contributing factors.`;
}
