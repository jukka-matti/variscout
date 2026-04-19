/**
 * Pure predicate evaluator for HypothesisCondition.
 *
 * Used by the Investigation Wall to compute HOLDS X/Y over a data window.
 * Missing columns, type mismatches, and null/undefined values return false
 * rather than throwing (ADR-069 B2 safety).
 */

import type { HypothesisCondition } from './hypothesisCondition';
import type { SuspectedCause, GateNode } from './types';

export type DataRow = Record<string, unknown>;

export function evaluateCondition(cond: HypothesisCondition, row: DataRow): boolean {
  switch (cond.kind) {
    case 'leaf':
      return evaluateLeaf(cond, row);
    case 'and':
      return cond.children.every(c => evaluateCondition(c, row));
    case 'or':
      return cond.children.some(c => evaluateCondition(c, row));
    case 'not':
      return !evaluateCondition(cond.child, row);
  }
}

// ============================================================================
// GateNode tree evaluator
// ============================================================================

export interface AndCheckResult {
  total: number;
  holds: number;
  matchingRowIndices: number[];
}

/**
 * Evaluate a GateNode tree against every row in the data window. Returns the
 * count of rows where the tree evaluates to true, the total rows considered,
 * and the matching row indices for highlight-on-chart interactions.
 *
 * Hubs without a condition evaluate to false (cannot be disconfirmed without a rule).
 * Unknown hub IDs evaluate to false.
 */
export function runAndCheck(
  tree: GateNode,
  hubs: SuspectedCause[],
  rows: DataRow[]
): AndCheckResult {
  const hubById = new Map(hubs.map(h => [h.id, h]));
  const matching: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    if (evaluateGate(tree, hubById, rows[i])) matching.push(i);
  }
  return { total: rows.length, holds: matching.length, matchingRowIndices: matching };
}

function evaluateGate(node: GateNode, hubById: Map<string, SuspectedCause>, row: DataRow): boolean {
  switch (node.kind) {
    case 'hub': {
      const hub = hubById.get(node.hubId);
      if (!hub || !hub.condition) return false;
      return evaluateCondition(hub.condition, row);
    }
    case 'and':
      return node.children.every(c => evaluateGate(c, hubById, row));
    case 'or':
      return node.children.some(c => evaluateGate(c, hubById, row));
    case 'not':
      return !evaluateGate(node.child, hubById, row);
  }
}

// ============================================================================
// Leaf evaluator
// ============================================================================

function evaluateLeaf(cond: Extract<HypothesisCondition, { kind: 'leaf' }>, row: DataRow): boolean {
  if (!(cond.column in row)) return false;
  const raw = row[cond.column];
  if (raw === null || raw === undefined) return false;

  switch (cond.op) {
    case 'eq':
      return raw === cond.value;
    case 'neq':
      return raw !== cond.value;
    case 'lt':
      return typeof raw === 'number' && typeof cond.value === 'number' && raw < cond.value;
    case 'lte':
      return typeof raw === 'number' && typeof cond.value === 'number' && raw <= cond.value;
    case 'gt':
      return typeof raw === 'number' && typeof cond.value === 'number' && raw > cond.value;
    case 'gte':
      return typeof raw === 'number' && typeof cond.value === 'number' && raw >= cond.value;
    case 'between':
      if (typeof raw !== 'number') return false;
      if (!Array.isArray(cond.value) || cond.value.length !== 2) return false;
      if (typeof cond.value[0] !== 'number' || typeof cond.value[1] !== 'number') return false;
      return raw >= cond.value[0] && raw <= cond.value[1];
    case 'in':
      if (!Array.isArray(cond.value)) return false;
      return (cond.value as Array<string | number>).some(v => v === raw);
  }
}
