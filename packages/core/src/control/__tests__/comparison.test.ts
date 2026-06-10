import { describe, expect, it } from 'vitest';
import { calculateStats } from '../../stats/basic';
import type { DataRow } from '../../types';
import { computeSustainmentComparison, freezeBaseline, type ControlBaseline } from '../comparison';

const rows: DataRow[] = [
  { date: '2026-01-01T00:00:00.000Z', value: 10, category: 'scratch' },
  { date: '2026-01-02T00:00:00.000Z', value: 12, category: 'dent' },
  { date: '2026-01-03T00:00:00.000Z', value: 11, category: 'scratch' },
  { date: '2026-01-04T00:00:00.000Z', value: 9, category: 'dent' },
  { date: '2026-01-05T00:00:00.000Z', value: 8, category: 'scratch' },
  { date: '2026-01-06T00:00:00.000Z', value: 9, category: 'scratch' },
  { date: '2026-01-07T00:00:00.000Z', value: 7, category: 'void' },
];

const frozenBaseline: ControlBaseline = {
  capturedAt: Date.parse('2026-01-04T12:00:00.000Z'),
  window: {
    startISO: '2025-12-01T00:00:00.000Z',
    endISO: '2025-12-31T23:59:59.999Z',
  },
  measure: 'value',
  n: 30,
  mean: 20,
  sigma: 2,
  cpk: 1.1,
  specsSnapshot: { usl: 20, lsl: 0, target: 10 },
  defectBreakdown: [
    { category: 'legacy', count: 4 },
    { category: 'dent', count: 1 },
  ],
};

describe('computeSustainmentComparison', () => {
  it('uses live before stats when enough pre-improvement rows exist', () => {
    const result = computeSustainmentComparison({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-05T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: 0 },
    });
    const expectedBefore = calculateStats([10, 12, 11, 9], 20, 0);

    expect(result.before.source).toBe('live');
    expect(result.before.n).toBe(4);
    expect(result.before.mean).toBeCloseTo(expectedBefore.mean);
    expect(result.before.sigma).toBeCloseTo(expectedBefore.sigmaWithin);
    expect(result.before.cpk).toBeCloseTo(expectedBefore.cpk!);
  });

  it('falls back to the frozen before stats when the live before window is too small', () => {
    const result = computeSustainmentComparison({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-02T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: 0 },
    });

    expect(result.before).toEqual({
      source: 'frozen',
      n: frozenBaseline.n,
      mean: frozenBaseline.mean,
      sigma: frozenBaseline.sigma,
      cpk: frozenBaseline.cpk,
    });
  });

  it('omits cpk values and cpk delta when specs are absent', () => {
    const baselineWithoutSpecs: ControlBaseline = {
      ...frozenBaseline,
      cpk: 1.1,
      specsSnapshot: undefined,
    };

    const result = computeSustainmentComparison({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-05T00:00:00.000Z',
      baseline: baselineWithoutSpecs,
    });

    expect(result.before.cpk).toBeUndefined();
    expect(result.after?.cpk).toBeUndefined();
    expect(result.deltas.cpkDelta).toBeUndefined();
  });

  it('uses frozen before stats, full dataset after stats, and no phases when timeColumn is missing', () => {
    const result = computeSustainmentComparison({
      rows,
      timeColumn: null,
      improvementDate: '2026-01-05T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: 0 },
    });
    const expectedAfter = calculateStats([10, 12, 11, 9, 8, 9, 7], 20, 0);

    expect(result.before.source).toBe('frozen');
    expect(result.after?.n).toBe(7);
    expect(result.after?.mean).toBeCloseTo(expectedAfter.mean);
    expect(result.phases).toBeUndefined();
  });

  it('returns after null when no post-improvement rows exist', () => {
    const result = computeSustainmentComparison({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-10T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: 0 },
    });

    expect(result.after).toBeNull();
    expect(result.phases?.afterLimits).toBeUndefined();
  });

  it('matches calculateStats phase limits for before and after windows', () => {
    const result = computeSustainmentComparison({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-05T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: 0 },
    });
    const expectedBefore = calculateStats([10, 12, 11, 9], 20, 0);
    const expectedAfter = calculateStats([8, 9, 7], 20, 0);

    expect(result.phases?.beforeLimits).toMatchObject({
      n: 4,
      centerLine: expectedBefore.mean,
      ucl: expectedBefore.ucl,
      lcl: expectedBefore.lcl,
      window: {
        startISO: '2026-01-01T00:00:00.000Z',
        endISO: '2026-01-04T00:00:00.000Z',
      },
    });
    expect(result.phases?.afterLimits).toMatchObject({
      n: 3,
      centerLine: expectedAfter.mean,
      ucl: expectedAfter.ucl,
      lcl: expectedAfter.lcl,
      window: {
        startISO: '2026-01-05T00:00:00.000Z',
        endISO: '2026-01-07T00:00:00.000Z',
      },
    });
  });

  it('returns deterministic defect breakdowns for before and after windows', () => {
    const result = computeSustainmentComparison({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-05T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: 0 },
      defectCategoryColumn: 'category',
    });

    expect(result.defects).toEqual({
      before: [
        { category: 'dent', count: 2 },
        { category: 'scratch', count: 2 },
      ],
      after: [
        { category: 'scratch', count: 2 },
        { category: 'void', count: 1 },
      ],
    });
  });
});

describe('freezeBaseline', () => {
  it('freezes baseline stats from pre-improvement rows', () => {
    const baseline = freezeBaseline({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-05T00:00:00.000Z',
      measure: 'value',
      specs: { usl: 20, lsl: 0, target: 10 },
      defectCategoryColumn: 'category',
      capturedAt: Date.parse('2026-01-08T00:00:00.000Z'),
    });
    const expected = calculateStats([10, 12, 11, 9], 20, 0);

    expect(baseline).toMatchObject({
      capturedAt: Date.parse('2026-01-08T00:00:00.000Z'),
      window: {
        startISO: '2026-01-01T00:00:00.000Z',
        endISO: '2026-01-04T00:00:00.000Z',
      },
      measure: 'value',
      n: 4,
      mean: expected.mean,
      sigma: expected.sigmaWithin,
      cpk: expected.cpk,
      specsSnapshot: { usl: 20, lsl: 0, target: 10 },
      defectBreakdown: [
        { category: 'dent', count: 2 },
        { category: 'scratch', count: 2 },
      ],
    });
  });
});
