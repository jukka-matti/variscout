import { describe, it, expect } from 'vitest';
import type { HypothesisCondition } from '../hypothesisCondition';
import type { ProcessMap } from '../../frame/types';
import {
  collectReferencedColumns,
  conditionHasMissingColumn,
  conditionReferencesStep,
  deriveConditionFromFindingSource,
} from '../hypothesisCondition';
import type { FindingSource } from '../types';

const processMap: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'step-fill', name: 'Fill', order: 0 },
    { id: 'step-pack', name: 'Pack', order: 1 },
  ],
  tributaries: [
    { id: 'trib-shift', stepId: 'step-fill', column: 'SHIFT' },
    { id: 'trib-machine', stepId: 'step-pack', column: 'MACHINE' },
  ],
  assignments: {
    Operator: 'step-fill',
    Line: 'step-pack',
  },
  createdAt: '2026-05-13T00:00:00.000Z',
  updatedAt: '2026-05-13T00:00:00.000Z',
};

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
      child: { kind: 'leaf', column: 'X', op: 'eq', value: 1 },
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
    const source: FindingSource = {
      chart: 'boxplot',
      category: 'night',
      timeLens: { mode: 'cumulative' },
    };
    const result = deriveConditionFromFindingSource(source, { groupColumn: 'SHIFT' });
    expect(result).toEqual({ kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' });
  });

  it('derives eq leaf from pareto category', () => {
    const source: FindingSource = {
      chart: 'pareto',
      category: 'SupplierB',
      timeLens: { mode: 'cumulative' },
    };
    const result = deriveConditionFromFindingSource(source, { dimensionColumn: 'SUPPLIER' });
    expect(result).toEqual({ kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'SupplierB' });
  });

  it('derives gte leaf from ichart anchor', () => {
    const source: FindingSource = {
      chart: 'ichart',
      anchorX: 10,
      anchorY: 120,
      timeLens: { mode: 'cumulative' },
    };
    const result = deriveConditionFromFindingSource(source, { metricColumn: 'NOZZLE.TEMP' });
    expect(result).toEqual({ kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gte', value: 120 });
  });

  it('derives between leaf from probability plot', () => {
    const source: FindingSource = {
      chart: 'probability',
      anchorX: 10,
      anchorY: 100,
      timeLens: { mode: 'cumulative' },
    };
    const result = deriveConditionFromFindingSource(source, {
      metricColumn: 'FILL',
      anchorYMax: 110,
    });
    expect(result).toEqual({ kind: 'leaf', column: 'FILL', op: 'between', value: [100, 110] });
  });

  it('returns undefined for coscout findings', () => {
    const source: FindingSource = {
      chart: 'coscout',
      messageId: 'abc123',
      timeLens: { mode: 'cumulative' },
    };
    const result = deriveConditionFromFindingSource(source, {});
    expect(result).toBeUndefined();
  });

  it('returns undefined when no columnHint is provided for a boxplot', () => {
    const source: FindingSource = {
      chart: 'boxplot',
      category: 'night',
      timeLens: { mode: 'cumulative' },
    };
    const result = deriveConditionFromFindingSource(source, {});
    expect(result).toBeUndefined();
  });

  it('returns undefined when metricColumn missing for ichart', () => {
    const source: FindingSource = {
      chart: 'ichart',
      anchorX: 10,
      anchorY: 120,
      timeLens: { mode: 'cumulative' },
    };
    expect(deriveConditionFromFindingSource(source, {})).toBeUndefined();
  });

  it('returns undefined when metricColumn missing for probability', () => {
    const source: FindingSource = {
      chart: 'probability',
      anchorX: 10,
      anchorY: 100,
      timeLens: { mode: 'cumulative' },
    };
    expect(deriveConditionFromFindingSource(source, {})).toBeUndefined();
  });

  it('returns undefined when anchorYMax missing for probability', () => {
    const source: FindingSource = {
      chart: 'probability',
      anchorX: 10,
      anchorY: 100,
      timeLens: { mode: 'cumulative' },
    };
    expect(deriveConditionFromFindingSource(source, { metricColumn: 'FILL' })).toBeUndefined();
  });

  it('returns undefined when dimensionColumn missing for pareto', () => {
    const source: FindingSource = {
      chart: 'pareto',
      category: 'Supplier',
      timeLens: { mode: 'cumulative' },
    };
    expect(deriveConditionFromFindingSource(source, {})).toBeUndefined();
  });
});

describe('collectReferencedColumns', () => {
  it('returns a single column for a leaf', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SHIFT',
      op: 'eq',
      value: 'night',
    };
    expect([...collectReferencedColumns(cond)]).toEqual(['SHIFT']);
  });

  it('walks into and/or branches and dedups', () => {
    const cond: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 120 },
        {
          kind: 'or',
          children: [
            { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'day' },
            { kind: 'leaf', column: 'OPERATOR', op: 'eq', value: 'alice' },
          ],
        },
      ],
    };
    expect(collectReferencedColumns(cond)).toEqual(new Set(['SHIFT', 'NOZZLE.TEMP', 'OPERATOR']));
  });

  it('walks into not branches', () => {
    const cond: HypothesisCondition = {
      kind: 'not',
      child: { kind: 'leaf', column: 'OVERRIDE', op: 'eq', value: true as unknown as string },
    };
    expect([...collectReferencedColumns(cond)]).toEqual(['OVERRIDE']);
  });
});

describe('conditionHasMissingColumn', () => {
  it('returns false when condition is undefined', () => {
    expect(conditionHasMissingColumn(undefined, new Set(['SHIFT']))).toBe(false);
  });

  it('returns false when every referenced column is present', () => {
    const cond: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 120 },
      ],
    };
    expect(conditionHasMissingColumn(cond, new Set(['SHIFT', 'NOZZLE.TEMP', 'OTHER']))).toBe(false);
  });

  it('returns true when any referenced column is absent', () => {
    const cond: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 120 },
      ],
    };
    expect(conditionHasMissingColumn(cond, new Set(['SHIFT']))).toBe(true);
  });

  it('inspects columns inside NOT branches', () => {
    const cond: HypothesisCondition = {
      kind: 'not',
      child: { kind: 'leaf', column: 'DROPPED', op: 'eq', value: 1 },
    };
    expect(conditionHasMissingColumn(cond, new Set(['KEPT']))).toBe(true);
  });
});

describe('conditionReferencesStep', () => {
  it('matches a leaf condition through a step assignment', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'Operator',
      op: 'eq',
      value: 'alice',
    };

    expect(conditionReferencesStep(cond, processMap, 'step-fill')).toBe(true);
  });

  it('matches a leaf condition through a step tributary column', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SHIFT',
      op: 'eq',
      value: 'night',
    };

    expect(conditionReferencesStep(cond, processMap, 'step-fill')).toBe(true);
  });

  it('matches a leaf condition through the step ctq column', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'Fill Weight',
      op: 'gt',
      value: 100,
    };

    expect(
      conditionReferencesStep(
        cond,
        {
          ...processMap,
          nodes: [{ id: 'step-fill', name: 'Fill', order: 0, ctqColumn: 'Fill Weight' }],
          assignments: {},
          tributaries: [],
        },
        'step-fill'
      )
    ).toBe(true);
  });

  it('matches referenced columns inside and/or/not branches', () => {
    const cond: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'UNRELATED', op: 'eq', value: 'x' },
        {
          kind: 'or',
          children: [
            { kind: 'leaf', column: 'OTHER', op: 'eq', value: 'y' },
            {
              kind: 'not',
              child: { kind: 'leaf', column: 'MACHINE', op: 'eq', value: 'm1' },
            },
          ],
        },
      ],
    };

    expect(conditionReferencesStep(cond, processMap, 'step-pack')).toBe(true);
  });

  it('returns false for an undefined condition', () => {
    expect(conditionReferencesStep(undefined, processMap, 'step-fill')).toBe(false);
  });

  it('returns false when the process map is missing', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'SHIFT',
      op: 'eq',
      value: 'night',
    };

    expect(conditionReferencesStep(cond, undefined, 'step-fill')).toBe(false);
  });

  it('returns false when referenced columns do not map to the step', () => {
    const cond: HypothesisCondition = {
      kind: 'leaf',
      column: 'MACHINE',
      op: 'eq',
      value: 'm1',
    };

    expect(conditionReferencesStep(cond, processMap, 'step-fill')).toBe(false);
  });
});
