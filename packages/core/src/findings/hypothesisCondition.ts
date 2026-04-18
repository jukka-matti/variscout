/**
 * Predicate tree that can be evaluated against a data row.
 *
 * Used by Investigation Wall hub `SuspectedCause.condition` to turn a hypothesis
 * into a disconfirmable claim — auto-derived from a finding's source on first
 * hub creation; editable afterwards.
 *
 * See: docs/superpowers/specs/2026-04-19-investigation-wall-design.md
 */

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
