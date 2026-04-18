/**
 * Predicate tree that can be evaluated against a data row.
 *
 * Used by Investigation Wall hub `SuspectedCause.condition` to turn a hypothesis
 * into a disconfirmable claim — auto-derived from a finding's source on first
 * hub creation; editable afterwards.
 *
 * See: docs/superpowers/specs/2026-04-19-investigation-wall-design.md
 */

import type { FindingSource } from './types';

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

export interface ConditionBranch {
  kind: 'and' | 'or' | 'not';
  children: HypothesisCondition[];
}

export type HypothesisCondition = ConditionLeaf | ConditionBranch;

/** Column hints resolved by the caller from chart state at brush time. */
export interface FindingSourceColumnHints {
  /** The grouping column for boxplot (x-axis column). */
  groupColumn?: string;
  /** The dimension column for pareto (x-axis column). */
  dimensionColumn?: string;
  /** The activity column for yamazumi. */
  activityColumn?: string;
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
    case 'yamazumi':
      if (!hints.activityColumn) return undefined;
      return { kind: 'leaf', column: hints.activityColumn, op: 'eq', value: source.category };
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
