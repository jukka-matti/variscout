import { describe, expect, it } from 'vitest';
import {
  applyDerivedFactorToFilters,
  buildBrushCaptureDraft,
  buildBrushDerivedColumn,
  buildCategoryPointCaptureDraft,
  buildProbabilityBandCaptureDraft,
  buildValueBandDerivedColumn,
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

  it('builds a category point draft with the category as an ordinary active filter', () => {
    const draft = buildCategoryPointCaptureDraft({
      chart: 'boxplot',
      factor: 'Step',
      categoryKey: 'Fill',
      outcome: 'Cycle_Time',
      rows,
      activeFilters: {},
    });

    expect(draft.entryKind).toBe('point');
    expect(draft.source).toMatchObject({ chart: 'boxplot', category: 'Fill' });
    expect(draft.activeFilters).toEqual({ Step: ['Fill'] });
    expect(draft.conditionLabel).toBe('Step = Fill');
    expect(draft.evidenceLabel).toBe('mean 45 vs 45 · n=2');
  });

  it('preserves raw numeric values when chart category keys are strings', () => {
    const draft = buildCategoryPointCaptureDraft({
      chart: 'pareto',
      factor: 'Station',
      categoryKey: '2',
      outcome: 'Cycle_Time',
      rows: [
        { Cycle_Time: 20, Station: 1 },
        { Cycle_Time: 40, Station: 2 },
        { Cycle_Time: 60, Station: 2 },
      ],
      activeFilters: {},
    });

    expect(draft.activeFilters).toEqual({ Station: [2] });
    expect(draft.conditionLabel).toBe('Station = 2');
    expect(draft.evidenceLabel).toBe('mean 50 vs 20 · n=2');
  });

  it('builds a probability band draft and preserves anchorYMax for between derivation', () => {
    const draft = buildProbabilityBandCaptureDraft({
      outcome: 'Cycle_Time',
      minValue: 35,
      maxValue: 55,
      activeFilters: { Step: ['Fill'] },
      rows,
      anchorX: 0.5,
    });

    expect(draft.entryKind).toBe('probability-band');
    expect(draft.source).toMatchObject({
      chart: 'probability',
      anchorX: 0.5,
      anchorY: 35,
      anchorYMax: 55,
    });
    expect(draft.proposedFactorName).toBe('Cycle_Time 35-55');
    expect(draft.activeFilters).toEqual({ Step: ['Fill'] });
    expect(draft.conditionLabel).toBe('Step = Fill x Cycle_Time 35-55');
    expect(draft.evidenceLabel).toBe('mean 45 vs 45 · n=2');
  });

  it('creates in/out values for probability value bands', () => {
    const nextRows = buildValueBandDerivedColumn(rows, 'Cycle_Time', 35, 55, 'Cycle_Time 35-55');
    expect(nextRows.map(row => row['Cycle_Time 35-55'])).toEqual(['out', 'in', 'in', 'out']);
  });
});
