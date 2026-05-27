import { describe, expect, it } from 'vitest';
import { extractStepsFromCategoricalColumn } from '../extractStepsFromCategoricalColumn';

describe('extractStepsFromCategoricalColumn', () => {
  it('returns an ExtractedStep per distinct value', () => {
    const result = extractStepsFromCategoricalColumn('StepName', ['Cut', 'Weld', 'Inspect']);
    expect(result).toHaveLength(3);
  });

  it('assigns stable ids from columnName + index', () => {
    const result = extractStepsFromCategoricalColumn('Phase', ['Setup', 'Run', 'Teardown']);
    expect(result[0].id).toBe('step-Phase-0');
    expect(result[1].id).toBe('step-Phase-1');
    expect(result[2].id).toBe('step-Phase-2');
  });

  it('uses the distinct value as the step name', () => {
    const result = extractStepsFromCategoricalColumn('Stage', ['Alpha', 'Beta']);
    expect(result[0].name).toBe('Alpha');
    expect(result[1].name).toBe('Beta');
  });

  it('assigns order matching the array index', () => {
    const result = extractStepsFromCategoricalColumn('Zone', ['A', 'B', 'C']);
    expect(result.map(s => s.order)).toEqual([0, 1, 2]);
  });

  it('returns an empty array for empty distinct values', () => {
    const result = extractStepsFromCategoricalColumn('Empty', []);
    expect(result).toEqual([]);
  });

  it('id embeds the column name to avoid cross-column collisions', () => {
    const r1 = extractStepsFromCategoricalColumn('ColA', ['X']);
    const r2 = extractStepsFromCategoricalColumn('ColB', ['X']);
    expect(r1[0].id).toBe('step-ColA-0');
    expect(r2[0].id).toBe('step-ColB-0');
    expect(r1[0].id).not.toBe(r2[0].id);
  });
});
