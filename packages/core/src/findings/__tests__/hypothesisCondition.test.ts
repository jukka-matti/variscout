import { describe, it, expect } from 'vitest';
import type { HypothesisCondition } from '../hypothesisCondition';

describe('HypothesisCondition type', () => {
  it('allows a leaf with eq comparison', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SHIFT',
      op: 'eq',
      value: 'night',
    };
    expect(cond.kind).toBe('leaf');
  });

  it('allows an AND branch with nested leaves', () => {
    const cond: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 120 },
      ],
    };
    expect(cond.kind).toBe('and');
    expect(cond.kind === 'and' ? cond.children.length : 0).toBe(2);
  });

  it('allows OR and NOT branches', () => {
    const or: HypothesisCondition = {
      kind: 'or',
      children: [{ kind: 'leaf', column: 'X', op: 'eq', value: 1 }],
    };
    const not: HypothesisCondition = {
      kind: 'not',
      children: [{ kind: 'leaf', column: 'X', op: 'eq', value: 1 }],
    };
    expect(or.kind).toBe('or');
    expect(not.kind).toBe('not');
  });

  it('allows between comparison with tuple value', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'TEMP',
      op: 'between',
      value: [100, 200],
    };
    expect(cond.kind).toBe('leaf');
  });
});
