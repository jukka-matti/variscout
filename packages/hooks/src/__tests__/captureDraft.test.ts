import { describe, expect, it } from 'vitest';
import {
  applyDerivedFactorToFilters,
  buildBrushCaptureDraft,
  buildBrushDerivedColumn,
  resolveDerivedFactorName,
} from '../captureDraft';

describe('captureDraft', () => {
  const rows = [
    { Cycle_Time: 30, Step: 'Prep' },
    { Cycle_Time: 40, Step: 'Fill' },
    { Cycle_Time: 50, Step: 'Fill' },
    { Cycle_Time: 60, Step: 'Pack' },
  ];

  it('builds an I-Chart brush draft with factor-expressed condition and evidence contrast', () => {
    const draft = buildBrushCaptureDraft({
      rows,
      outcome: 'Cycle_Time',
      selectedIndices: new Set([1, 2]),
      activeFilters: { Step: ['Fill'] },
    });

    expect(draft.entryKind).toBe('brush');
    expect(draft.source.chart).toBe('ichart');
    expect(draft.source.brushedRange).toEqual({ startIdx: 1, endIdx: 2 });
    expect(draft.proposedFactorName).toBe('obs 2-3');
    expect(draft.conditionLabel).toBe('Step = Fill x obs 2-3');
    expect(draft.evidenceLabel).toBe('mean 45 vs 45 · n=2');
  });

  it('suffixes proposed factor names that collide with existing columns', () => {
    const draft = buildBrushCaptureDraft({
      rows,
      outcome: 'Cycle_Time',
      selectedIndices: new Set([1, 2]),
      activeFilters: { Step: ['Fill'] },
      existingColumnNames: ['Step', 'Cycle_Time', 'obs 2-3', 'obs 2-3 2'],
    });

    expect(draft.proposedFactorName).toBe('obs 2-3 3');
    expect(resolveDerivedFactorName('Machine', ['Machine', 'Machine 2'])).toBe('Machine 3');
  });

  it('applies a derived brush factor as an ordinary activeFilters key', () => {
    expect(applyDerivedFactorToFilters({ Step: ['Fill'] }, 'obs 2-3')).toEqual({
      Step: ['Fill'],
      'obs 2-3': ['in'],
    });
  });

  it('creates in/out values for selected rows only', () => {
    const nextRows = buildBrushDerivedColumn(rows, new Set([1, 2]), 'obs 2-3');
    expect(nextRows.map(row => row['obs 2-3'])).toEqual(['out', 'in', 'in', 'out']);
  });
});
