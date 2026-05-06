import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../hypothesisConditionEvaluator';
import type { HypothesisCondition } from '../hypothesisCondition';

type Row = Record<string, unknown>;

describe('evaluateCondition', () => {
  const row: Row = {
    SHIFT: 'night',
    NOZZLE_TEMP: 130,
    SUPPLIER: 'B',
  };

  it('evaluates eq leaf true', () => {
    const cond: HypothesisCondition = { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates eq leaf false', () => {
    const cond: HypothesisCondition = { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'day' };
    expect(evaluateCondition(cond, row)).toBe(false);
  });

  it('evaluates numeric gt leaf', () => {
    const cond: HypothesisCondition = { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 120 };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates between leaf inclusive', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'NOZZLE_TEMP',
      op: 'between',
      value: [120, 140],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates in leaf with string array', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SUPPLIER',
      op: 'in',
      value: ['A', 'B', 'C'],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('returns false on missing column without throwing', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'MISSING_COL',
      op: 'eq',
      value: 1,
    };
    expect(evaluateCondition(cond, row)).toBe(false);
  });

  it('returns false on null value without throwing', () => {
    const nullRow: Row = { X: null };
    const cond: HypothesisCondition = { kind: 'leaf', column: 'X', op: 'eq', value: 1 };
    expect(evaluateCondition(cond, nullRow)).toBe(false);
  });

  it('evaluates AND branch', () => {
    const cond: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 120 },
      ],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates OR branch — short-circuit on first true', () => {
    const cond: HypothesisCondition = {
      kind: 'or',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'day' },
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
      ],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates unary NOT branch', () => {
    const cond: HypothesisCondition = {
      kind: 'not',
      child: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'day' },
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('handles nested AND inside OR', () => {
    const cond: HypothesisCondition = {
      kind: 'or',
      children: [
        {
          kind: 'and',
          children: [
            { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
            { kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'A' },
          ],
        },
        { kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' },
      ],
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates neq leaf', () => {
    const cond: HypothesisCondition = { kind: 'leaf', column: 'SHIFT', op: 'neq', value: 'day' };
    expect(evaluateCondition(cond, row)).toBe(true);
    const contra: HypothesisCondition = {
      kind: 'leaf',
      column: 'SHIFT',
      op: 'neq',
      value: 'night',
    };
    expect(evaluateCondition(contra, row)).toBe(false);
  });

  it('evaluates lt leaf', () => {
    const cond: HypothesisCondition = { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'lt', value: 150 };
    expect(evaluateCondition(cond, row)).toBe(true);
    const contra: HypothesisCondition = {
      kind: 'leaf',
      column: 'NOZZLE_TEMP',
      op: 'lt',
      value: 120,
    };
    expect(evaluateCondition(contra, row)).toBe(false);
  });

  it('evaluates lte leaf inclusive', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'NOZZLE_TEMP',
      op: 'lte',
      value: 130,
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates gte leaf inclusive', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'NOZZLE_TEMP',
      op: 'gte',
      value: 130,
    };
    expect(evaluateCondition(cond, row)).toBe(true);
  });

  it('evaluates between outside range as false', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'NOZZLE_TEMP',
      op: 'between',
      value: [100, 120],
    };
    expect(evaluateCondition(cond, row)).toBe(false);
  });

  it('evaluates in miss as false', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SUPPLIER',
      op: 'in',
      value: ['A', 'C', 'D'],
    };
    expect(evaluateCondition(cond, row)).toBe(false);
  });

  it('evaluates in with number array', () => {
    const numRow = { LOT: 2 };
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'LOT',
      op: 'in',
      value: [1, 2, 3],
    };
    expect(evaluateCondition(cond, numRow)).toBe(true);
  });

  it('returns false for between with non-numeric tuple values', () => {
    // TS allows string[] as value (the union is broad), so the runtime guard is the
    // only protection against implicit coercion — this test proves the guard holds.
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'NOZZLE_TEMP',
      op: 'between',
      value: ['A', 'Z'] as unknown as [number, number],
    };
    expect(evaluateCondition(cond, row)).toBe(false);
  });
});

import { runAndCheck } from '../hypothesisConditionEvaluator';
import type { SuspectedCause, GateNode } from '@variscout/core';

function hub(id: string, cond: HypothesisCondition | undefined): SuspectedCause {
  return {
    id,
    name: id,
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    condition: cond,
    createdAt: 1745625600000,
    updatedAt: 1745625600000,
    investigationId: 'inv-test-001',
    deletedAt: null,
  };
}

describe('runAndCheck', () => {
  const hubs: SuspectedCause[] = [
    hub('h1', { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' }),
    hub('h2', { kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' }),
    hub('h3', undefined),
  ];

  const rows = [
    { SHIFT: 'night', SUPPLIER: 'B' },
    { SHIFT: 'night', SUPPLIER: 'A' },
    { SHIFT: 'day', SUPPLIER: 'B' },
    { SHIFT: 'night', SUPPLIER: 'B' },
  ];

  it('counts holds for a single-hub leaf', () => {
    const tree: GateNode = { kind: 'hub', hubId: 'h1' };
    const result = runAndCheck(tree, hubs, rows);
    expect(result.total).toBe(4);
    expect(result.holds).toBe(3);
    expect(result.matchingRowIndices).toEqual([0, 1, 3]);
  });

  it('counts holds for AND of two hubs', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    const result = runAndCheck(tree, hubs, rows);
    expect(result.holds).toBe(2);
    expect(result.matchingRowIndices).toEqual([0, 3]);
  });

  it('returns 0 holds when a referenced hub has no condition', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h3' }, // no condition
      ],
    };
    const result = runAndCheck(tree, hubs, rows);
    expect(result.holds).toBe(0);
  });

  it('handles nested OR + AND', () => {
    const tree: GateNode = {
      kind: 'or',
      children: [
        {
          kind: 'and',
          children: [
            { kind: 'hub', hubId: 'h1' },
            { kind: 'hub', hubId: 'h2' },
          ],
        },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    const result = runAndCheck(tree, hubs, rows);
    // row 0: h1=true h2=true → AND true → OR true
    // row 1: h1=true h2=false → AND false. h2=false. OR false.
    // row 2: h1=false h2=true → AND false. h2=true. OR true.
    // row 3: h1=true h2=true → AND true → OR true.
    expect(result.holds).toBe(3);
    expect(result.matchingRowIndices).toEqual([0, 2, 3]);
  });

  it('handles unary NOT gate', () => {
    const tree: GateNode = {
      kind: 'not',
      child: { kind: 'hub', hubId: 'h1' },
    };
    const result = runAndCheck(tree, hubs, rows);
    // h1 = SHIFT == 'night' → true on rows 0, 1, 3; false on row 2
    // NOT h1 → true on row 2 only
    expect(result.holds).toBe(1);
    expect(result.matchingRowIndices).toEqual([2]);
  });

  it('returns total 0 / holds 0 on empty rows without throwing', () => {
    const tree: GateNode = { kind: 'hub', hubId: 'h1' };
    const result = runAndCheck(tree, hubs, []);
    expect(result.total).toBe(0);
    expect(result.holds).toBe(0);
    expect(result.matchingRowIndices).toEqual([]);
  });

  it('returns 0 holds when tree references a missing hub', () => {
    const tree: GateNode = { kind: 'hub', hubId: 'missing' };
    const result = runAndCheck(tree, hubs, rows);
    expect(result.holds).toBe(0);
  });
});
