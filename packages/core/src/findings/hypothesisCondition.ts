/**
 * Predicate tree that can be evaluated against a data row.
 *
 * Used by Investigation Wall hub `Hypothesis.condition` to turn a hypothesis
 * into a disconfirmable claim — auto-derived from a finding's source on first
 * hub creation; editable afterwards.
 *
 * See: docs/superpowers/specs/2026-04-19-investigation-wall-design.md
 */

import type { FindingSource } from './types';
import type { ProcessMap } from '../frame/types';

export type ComparisonOp = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'in';

export interface ConditionLeaf {
  kind: 'leaf';
  column: string;
  op: ComparisonOp;
  /**
   * Operator-specific value shape:
   * - `eq` / `neq` / `lt` / `lte` / `gt` / `gte`: `string | number`
   * - `between`: `[number, number]` (inclusive)
   * - `in`: `string[] | number[]`
   */
  value: string | number | [number, number] | string[] | number[];
}

export interface ConditionAndOr {
  kind: 'and' | 'or';
  children: HypothesisCondition[];
}

export interface ConditionNot {
  kind: 'not';
  child: HypothesisCondition;
}

export type ConditionBranch = ConditionAndOr | ConditionNot;

export type HypothesisCondition = ConditionLeaf | ConditionBranch;

/** Column hints resolved by the caller from chart state at brush time. */
export interface FindingSourceColumnHints {
  /** The grouping column for boxplot (x-axis column). */
  groupColumn?: string;
  /** The dimension column for pareto (x-axis column). */
  dimensionColumn?: string;
  /** The metric column (y-axis) for ichart / probability plot. */
  metricColumn?: string;
  /** Upper anchor for probability-plot between ranges. */
  anchorYMax?: number;
}

/**
 * Derive a one-leaf condition from a finding's chart source, given column hints
 * resolved from the chart state at brush time. Returns undefined for CoScout
 * findings (no brush) or when the required column hint is missing.
 */
export function deriveConditionFromFindingSource(
  source: FindingSource,
  hints: FindingSourceColumnHints
): HypothesisCondition | undefined {
  switch (source.chart) {
    case 'boxplot':
      if (!hints.groupColumn) return undefined;
      return { kind: 'leaf', column: hints.groupColumn, op: 'eq', value: source.category };
    case 'pareto':
      if (!hints.dimensionColumn) return undefined;
      return { kind: 'leaf', column: hints.dimensionColumn, op: 'eq', value: source.category };
    case 'ichart':
      if (!hints.metricColumn) return undefined;
      return { kind: 'leaf', column: hints.metricColumn, op: 'gte', value: source.anchorY };
    case 'probability':
      if (!hints.metricColumn || hints.anchorYMax === undefined) return undefined;
      return {
        kind: 'leaf',
        column: hints.metricColumn,
        op: 'between',
        value: [source.anchorY, hints.anchorYMax],
      };
    case 'coscout':
      return undefined;
  }
}

/**
 * Structural shape of one categorical filter chip — mirrors the View-layer
 * `CategoricalFilter` from `@variscout/stores` without importing it (core may not
 * depend on stores). A `{column, values}` pair from the Process↔Explore bridge.
 */
export interface CategoricalFilterInput {
  column: string;
  values: ReadonlyArray<string | number>;
}

/**
 * Bridge transient drill-chip filters → a flat `ConditionLeaf[]` (ADR-085).
 *
 * Single-value chips become `eq` leaves; multi-value chips become `in` leaves.
 * Empty chips are dropped. Equality membership only — range/comparison ops are
 * out of scope for scope capture (the leaf shape would still carry them later).
 */
export function buildConditionFromCategoricalFilters(
  filters: ReadonlyArray<CategoricalFilterInput>
): ConditionLeaf[] {
  const leaves: ConditionLeaf[] = [];
  for (const filter of filters) {
    if (filter.values.length === 0) continue;
    if (filter.values.length === 1) {
      leaves.push({ kind: 'leaf', column: filter.column, op: 'eq', value: filter.values[0] });
    } else {
      leaves.push({
        kind: 'leaf',
        column: filter.column,
        op: 'in',
        value: normalizeInValues(filter.values),
      });
    }
  }
  return leaves;
}

/**
 * Bridge a `FindingContext.activeFilters` map (`Record<column, values[]>`) →
 * a flat `ConditionLeaf[]`. Same equality-membership semantics as
 * `buildConditionFromCategoricalFilters`; used to re-derive a scope's WHERE from
 * a linked finding's snapshot.
 */
export function activeFiltersToCondition(
  activeFilters: Record<string, (string | number)[]>
): ConditionLeaf[] {
  return buildConditionFromCategoricalFilters(
    Object.entries(activeFilters).map(([column, values]) => ({ column, values }))
  );
}

/**
 * Snapshot transient drill-chip filters → a `Record<column, values[]>` map,
 * the shape a `Finding.context.activeFilters` expects.
 *
 * This is the capture-as-Finding bridge (IM-4a Task 1): a Finding captured
 * during a drilldown should snapshot the DRILL condition (the active scope
 * chips), not the legacy row-level `projectStore.filters` map. Empty chips are
 * dropped so an absent value never lands in the snapshot.
 */
export function categoricalFiltersToActiveFilters(
  filters: ReadonlyArray<CategoricalFilterInput>
): Record<string, (string | number)[]> {
  const map: Record<string, (string | number)[]> = {};
  for (const filter of filters) {
    if (filter.values.length === 0) continue;
    map[filter.column] = [...filter.values];
  }
  return map;
}

/** Human-readable symbol for each leaf comparison op. */
const OP_SYMBOL: Record<ComparisonOp, string> = {
  eq: '=',
  neq: '≠',
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
  between: '∈',
  in: '∈',
};

/**
 * Format a flat `ConditionLeaf[]` (a scope's compound WHERE) as a single
 * human-readable line, e.g. `"Machine = B ∩ Product = X"`. Leaves are joined
 * with `∩` (set intersection — the predicates are a flat AND). `in`/`between`
 * render their membership/range; empty list → empty string.
 *
 * Locale-free (math symbols + raw values) so it is safe to use as a display
 * fallback without a catalog key.
 */
export function formatConditionLeaves(predicates: ReadonlyArray<ConditionLeaf>): string {
  const leafText = (leaf: ConditionLeaf): string => {
    const symbol = OP_SYMBOL[leaf.op];
    if (leaf.op === 'in' && Array.isArray(leaf.value)) {
      return `${leaf.column} ${symbol} {${leaf.value.join(', ')}}`;
    }
    if (leaf.op === 'between' && Array.isArray(leaf.value)) {
      return `${leaf.column} ${symbol} [${leaf.value.join(', ')}]`;
    }
    return `${leaf.column} ${symbol} ${String(leaf.value)}`;
  };
  return predicates.map(leafText).join(' ∩ ');
}

/**
 * A canonical, order-independent key for a flat list of `ConditionLeaf`
 * predicates — the identity of a `ProblemStatementScope`'s WHERE.
 *
 * Used by the drill→scope producer for idempotency: re-firing on the same
 * compound condition (same `{column, op, value}` set, regardless of chip
 * order) yields the same key, so no duplicate scope is created.
 *
 * Value encoding preserves type (numeric `1` ≠ string `"1"`) via a tagged
 * `JSON.stringify`; array values (`in`, `between`) are sorted for membership
 * sets but preserved-in-order for `between` ranges (a 2-tuple where order is
 * semantic). Empty list → empty string.
 */
export function predicateSetKey(predicates: ReadonlyArray<ConditionLeaf>): string {
  const leafKey = (leaf: ConditionLeaf): string => {
    let valuePart: string;
    if (leaf.op === 'between') {
      // `between` is an ordered [min, max] tuple — order is semantic, keep as-is.
      valuePart = JSON.stringify(leaf.value);
    } else if (Array.isArray(leaf.value)) {
      // `in` is a membership set — order is irrelevant; sort by tagged encoding.
      const sorted = [...leaf.value].map(v => `${typeof v}:${String(v)}`).sort();
      valuePart = JSON.stringify(sorted);
    } else {
      // Scalar — tag with the runtime type so numeric 1 ≠ string "1".
      valuePart = `${typeof leaf.value}:${String(leaf.value)}`;
    }
    return `${leaf.column}|${leaf.op}|${valuePart}`;
  };
  return predicates.map(leafKey).sort().join('&&');
}

/**
 * True iff two predicate lists describe the same compound condition
 * (order-independent). Thin wrapper over `predicateSetKey`.
 */
export function predicateSetsEqual(
  a: ReadonlyArray<ConditionLeaf>,
  b: ReadonlyArray<ConditionLeaf>
): boolean {
  return predicateSetKey(a) === predicateSetKey(b);
}

/**
 * Coerce a mixed `(string | number)[]` chip-value array into the homogeneous
 * `string[] | number[]` an `in` leaf requires. All-numeric stays numeric;
 * otherwise everything is stringified.
 */
function normalizeInValues(values: ReadonlyArray<string | number>): string[] | number[] {
  if (values.every(v => typeof v === 'number')) {
    return values as number[];
  }
  return values.map(String);
}

/**
 * Collect the set of column names referenced by a hypothesis condition tree.
 * Returns an empty set for unknown kinds — defensive against future schema growth.
 */
export function collectReferencedColumns(condition: HypothesisCondition): Set<string> {
  const columns = new Set<string>();
  const walk = (node: HypothesisCondition): void => {
    switch (node.kind) {
      case 'leaf':
        columns.add(node.column);
        return;
      case 'and':
      case 'or':
        node.children.forEach(walk);
        return;
      case 'not':
        walk(node.child);
        return;
    }
  };
  walk(condition);
  return columns;
}

/**
 * Collect the flat list of `ConditionLeaf` predicates in a hypothesis condition
 * tree (the AND/OR/NOT structure is flattened to its leaves). Used by the
 * per-hypothesis What-If (FE-2a §5), which partitions the dataset on the cause's
 * leaves to project the if-controlled Cpk. `NOT` is not inverted here — the
 * leaves are returned as-authored, matching how `computeScopeWhatIfProjection`
 * ANDs them (a cause's condition is the WHERE-it-holds, used to fix that subset).
 */
export function collectConditionLeaves(condition: HypothesisCondition): ConditionLeaf[] {
  const leaves: ConditionLeaf[] = [];
  const walk = (node: HypothesisCondition): void => {
    switch (node.kind) {
      case 'leaf':
        leaves.push(node);
        return;
      case 'and':
      case 'or':
        node.children.forEach(walk);
        return;
      case 'not':
        walk(node.child);
        return;
    }
  };
  walk(condition);
  return leaves;
}

/**
 * True iff the condition references at least one column not present in `availableColumns`.
 * Returns false for an undefined condition (no claim → no missing-column state).
 */
export function conditionHasMissingColumn(
  condition: HypothesisCondition | undefined,
  availableColumns: ReadonlySet<string>
): boolean {
  if (!condition) return false;
  const referenced = collectReferencedColumns(condition);
  for (const col of referenced) {
    if (!availableColumns.has(col)) return true;
  }
  return false;
}

/**
 * Collect the dataset columns that belong to a process step.
 *
 * Includes chip assignments, tributary factor columns, and the step CTQ column
 * so focal-step filtering uses the same column definition as Canvas L3.
 */
export function collectStepColumns(
  processMap: ProcessMap | undefined,
  stepId: string
): Set<string> {
  const stepColumns = new Set<string>();
  if (!processMap) return stepColumns;

  for (const [column, assignedStepId] of Object.entries(processMap.assignments ?? {})) {
    if (assignedStepId === stepId) stepColumns.add(column);
  }
  for (const tributary of processMap.tributaries) {
    if (tributary.stepId === stepId) stepColumns.add(tributary.column);
  }

  const node = processMap.nodes.find(candidate => candidate.id === stepId);
  if (node?.ctqColumn) stepColumns.add(node.ctqColumn);

  return stepColumns;
}

/**
 * True iff the condition references at least one column mapped to `stepId`.
 *
 * ProcessMap is the source of truth: chip assignments map column IDs to steps,
 * and tributaries carry the step's incoming factor columns. Undefined inputs
 * produce no match so callers can safely use this as an optional focal filter.
 */
export function conditionReferencesStep(
  condition: HypothesisCondition | undefined,
  processMap: ProcessMap | undefined,
  stepId: string
): boolean {
  if (!condition || !processMap) return false;

  const stepColumns = collectStepColumns(processMap, stepId);
  if (stepColumns.size === 0) return false;

  const referenced = collectReferencedColumns(condition);
  for (const column of referenced) {
    if (stepColumns.has(column)) return true;
  }
  return false;
}
