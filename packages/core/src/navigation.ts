/**
 * Navigation types and utilities for drill-down navigation
 *
 * Provides a consistent navigation model across all VariScout products:
 * - PWA: Full interactive drill-down with history
 * - Excel: Read-only display (slicers control filtering)
 * - Azure: Full interactive drill-down with history
 */

/**
 * Types of drill-down actions
 * - highlight: Show data point without filtering (I-Chart)
 * - filter: Filter data to subset (Boxplot, Pareto)
 */
export type DrillType = 'highlight' | 'filter';

/**
 * Source chart that initiated the drill action
 */
export type DrillSource = 'ichart' | 'boxplot' | 'pareto' | 'histogram';

/**
 * A single drill-down action in the navigation history
 */
export interface DrillAction {
  /** Unique identifier for this action */
  id: string;
  /** Type of drill (highlight vs filter) */
  type: DrillType;
  /** Which chart initiated the drill */
  source: DrillSource;
  /** The factor/column being drilled (for filter type) */
  factor?: string;
  /** The value(s) being selected */
  values: (string | number)[];
  /** For I-Chart: the row index being highlighted */
  rowIndex?: number;
  /** Timestamp for ordering */
  timestamp: number;
  /** Display label for breadcrumb UI */
  label: string;
}

/**
 * Current highlight state (I-Chart point selection)
 * Separate from drill stack as highlights don't filter data
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
  /** Stack of drill actions (newest last) */
  drillStack: DrillAction[];
  /** Current highlight (I-Chart only, not a filter) */
  currentHighlight: HighlightState | null;
}

/**
 * Generate a unique ID for a drill action
 */
export function generateDrillId(): string {
  return `drill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a display label for a drill action
 */
export function getDrillLabel(action: DrillAction): string {
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
 * Convert a drill stack to a filters object for DataContext
 * Later actions for the same factor override earlier ones
 */
export function drillStackToFilters(stack: DrillAction[]): Record<string, (string | number)[]> {
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
 * Create a new drill action with auto-generated ID and timestamp
 */
export function createDrillAction(
  params: Omit<DrillAction, 'id' | 'timestamp' | 'label'>
): DrillAction {
  const action: DrillAction = {
    ...params,
    id: generateDrillId(),
    timestamp: Date.now(),
    label: '', // Will be set below
  };
  action.label = getDrillLabel(action);
  return action;
}

/**
 * Find the index of a drill action by ID
 * Returns -1 if not found
 */
export function findDrillIndex(stack: DrillAction[], actionId: string): number {
  return stack.findIndex(a => a.id === actionId);
}

/**
 * Pop the drill stack back to a specific action (inclusive)
 * Returns the new stack with everything after actionId removed
 */
export function popDrillStackTo(stack: DrillAction[], actionId: string): DrillAction[] {
  const index = findDrillIndex(stack, actionId);
  if (index === -1) return stack;
  return stack.slice(0, index + 1);
}

/**
 * Pop the most recent action from the drill stack
 */
export function popDrillStack(stack: DrillAction[]): DrillAction[] {
  if (stack.length === 0) return stack;
  return stack.slice(0, -1);
}

/**
 * Push a new action onto the drill stack
 */
export function pushDrillStack(stack: DrillAction[], action: DrillAction): DrillAction[] {
  return [...stack, action];
}

/**
 * Check if clicking the same factor value should toggle (remove) the filter
 * Returns true if the action would result in the same filter as current
 */
export function shouldToggleDrill(
  stack: DrillAction[],
  newAction: Omit<DrillAction, 'id' | 'timestamp' | 'label'>
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
  source: DrillSource;
}

/**
 * Convert drill stack to breadcrumb items for UI
 * Adds a "root" item at the beginning
 */
export function drillStackToBreadcrumbs(
  stack: DrillAction[],
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
  drillStack: [],
  currentHighlight: null,
};
