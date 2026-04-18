import { describe, it, expect } from 'vitest';
import type { HypothesisCondition } from '../hypothesisCondition';
import { deriveConditionFromFindingSource } from '../hypothesisCondition';
import type { FindingSource } from '../types';

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

  it('allows in comparison with string array', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SUPPLIER',
      op: 'in',
      value: ['A', 'B', 'C'],
    };
    expect(cond.kind).toBe('leaf');
  });

  it('allows in comparison with number array', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'LOT',
      op: 'in',
      value: [1, 2, 3],
    };
    expect(cond.kind).toBe('leaf');
  });
});

describe('deriveConditionFromFindingSource', () => {
  it('derives eq leaf from boxplot category', () => {
    const source: FindingSource = { chart: 'boxplot', category: 'night' };
    const result = deriveConditionFromFindingSource(source, { groupColumn: 'SHIFT' });
    expect(result).toEqual({ kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' });
  });

  it('derives eq leaf from pareto category', () => {
    const source: FindingSource = { chart: 'pareto', category: 'SupplierB' };
    const result = deriveConditionFromFindingSource(source, { dimensionColumn: 'SUPPLIER' });
    expect(result).toEqual({ kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'SupplierB' });
  });

  it('derives gte leaf from ichart anchor', () => {
    const source: FindingSource = { chart: 'ichart', anchorX: 10, anchorY: 120 };
    const result = deriveConditionFromFindingSource(source, { metricColumn: 'NOZZLE.TEMP' });
    expect(result).toEqual({ kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gte', value: 120 });
  });

  it('derives between leaf from probability plot', () => {
    const source: FindingSource = { chart: 'probability', anchorX: 10, anchorY: 100 };
    const result = deriveConditionFromFindingSource(source, {
      metricColumn: 'FILL',
      anchorYMax: 110,
    });
    expect(result).toEqual({ kind: 'leaf', column: 'FILL', op: 'between', value: [100, 110] });
  });

  it('derives eq leaf from yamazumi activity', () => {
    const source: FindingSource = { chart: 'yamazumi', category: 'Bending' };
    const result = deriveConditionFromFindingSource(source, { activityColumn: 'ACTIVITY' });
    expect(result).toEqual({ kind: 'leaf', column: 'ACTIVITY', op: 'eq', value: 'Bending' });
  });

  it('returns undefined for coscout findings', () => {
    const source: FindingSource = { chart: 'coscout', messageId: 'abc123' };
    const result = deriveConditionFromFindingSource(source, {});
    expect(result).toBeUndefined();
  });

  it('returns undefined when no columnHint is provided for a boxplot', () => {
    const source: FindingSource = { chart: 'boxplot', category: 'night' };
    const result = deriveConditionFromFindingSource(source, {});
    expect(result).toBeUndefined();
  });

  it('returns undefined when metricColumn missing for ichart', () => {
    const source: FindingSource = { chart: 'ichart', anchorX: 10, anchorY: 120 };
    expect(deriveConditionFromFindingSource(source, {})).toBeUndefined();
  });

  it('returns undefined when metricColumn missing for probability', () => {
    const source: FindingSource = { chart: 'probability', anchorX: 10, anchorY: 100 };
    expect(deriveConditionFromFindingSource(source, {})).toBeUndefined();
  });

  it('returns undefined when anchorYMax missing for probability', () => {
    const source: FindingSource = { chart: 'probability', anchorX: 10, anchorY: 100 };
    expect(deriveConditionFromFindingSource(source, { metricColumn: 'FILL' })).toBeUndefined();
  });

  it('returns undefined when dimensionColumn missing for pareto', () => {
    const source: FindingSource = { chart: 'pareto', category: 'Supplier' };
    expect(deriveConditionFromFindingSource(source, {})).toBeUndefined();
  });

  it('returns undefined when activityColumn missing for yamazumi', () => {
    const source: FindingSource = { chart: 'yamazumi', category: 'Bending' };
    expect(deriveConditionFromFindingSource(source, {})).toBeUndefined();
  });
});
