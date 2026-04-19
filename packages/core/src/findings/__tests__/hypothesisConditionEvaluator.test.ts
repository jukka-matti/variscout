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
