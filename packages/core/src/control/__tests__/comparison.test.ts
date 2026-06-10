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

  it('uses the frozen baseline spec snapshot as the shared Cpk basis', () => {
    const result = computeSustainmentComparison({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-02T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: -100 },
    });
    const expectedAfterOnFrozenBasis = calculateStats([12, 11, 9, 8, 9, 7], 20, 0);
    const afterOnInputBasis = calculateStats([12, 11, 9, 8, 9, 7], 20, -100);

    expect(result.before.cpk).toBeCloseTo(frozenBaseline.cpk!);
    expect(result.after?.cpk).toBeCloseTo(expectedAfterOnFrozenBasis.cpk!);
    expect(result.after?.cpk).not.toBeCloseTo(afterOnInputBasis.cpk!);
    expect(result.deltas.cpkDelta).toBeCloseTo(
      expectedAfterOnFrozenBasis.cpk! - frozenBaseline.cpk!
    );
  });

  it('omits Cpk delta when a frozen baseline has no shared spec basis', () => {
    const result = computeSustainmentComparison({
      rows,
      timeColumn: 'date',
      improvementDate: '2026-01-02T00:00:00.000Z',
      baseline: {
        ...frozenBaseline,
        specsSnapshot: undefined,
      },
      specs: { usl: 20, lsl: 0 },
    });

    expect(result.before.cpk).toBe(frozenBaseline.cpk);
    expect(result.after?.cpk).toBeDefined();
    expect(result.deltas.cpkDelta).toBeUndefined();
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

  it('orders each time-windowed phase by time before computing moving-range stats', () => {
    const shuffledRows: DataRow[] = [
      { date: '2026-01-03T00:00:00.000Z', value: 11 },
      { date: '2026-01-06T00:00:00.000Z', value: 9 },
      { date: '2026-01-01T00:00:00.000Z', value: 10 },
      { date: '2026-01-05T00:00:00.000Z', value: 8 },
      { date: '2026-01-04T00:00:00.000Z', value: 9 },
      { date: '2026-01-02T00:00:00.000Z', value: 12 },
      { date: '2026-01-07T00:00:00.000Z', value: 7 },
    ];

    const result = computeSustainmentComparison({
      rows: shuffledRows,
      timeColumn: 'date',
      improvementDate: '2026-01-05T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: 0 },
    });
    const expectedBefore = calculateStats([10, 12, 11, 9], 20, 0);
    const expectedAfter = calculateStats([8, 9, 7], 20, 0);

    expect(result.before.sigma).toBeCloseTo(expectedBefore.sigmaWithin);
    expect(result.before.cpk).toBeCloseTo(expectedBefore.cpk!);
    expect(result.after?.sigma).toBeCloseTo(expectedAfter.sigmaWithin);
    expect(result.after?.cpk).toBeCloseTo(expectedAfter.cpk!);
    expect(result.phases?.beforeLimits?.ucl).toBeCloseTo(expectedBefore.ucl);
    expect(result.phases?.afterLimits?.ucl).toBeCloseTo(expectedAfter.ucl);
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

  it('keeps no-timeColumn stats in input order', () => {
    const shuffledRows: DataRow[] = [{ value: 11 }, { value: 9 }, { value: 10 }, { value: 8 }];

    const result = computeSustainmentComparison({
      rows: shuffledRows,
      timeColumn: null,
      improvementDate: '2026-01-05T00:00:00.000Z',
      baseline: frozenBaseline,
      specs: { usl: 20, lsl: 0 },
    });
    const expectedAfter = calculateStats([11, 9, 10, 8], 20, 0);

    expect(result.after?.sigma).toBeCloseTo(expectedAfter.sigmaWithin);
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

  it('orders pre-improvement rows by time before freezing moving-range stats', () => {
    const baseline = freezeBaseline({
      rows: [
        { date: '2026-01-03T00:00:00.000Z', value: 11 },
        { date: '2026-01-01T00:00:00.000Z', value: 10 },
        { date: '2026-01-04T00:00:00.000Z', value: 9 },
        { date: '2026-01-02T00:00:00.000Z', value: 12 },
        { date: '2026-01-05T00:00:00.000Z', value: 8 },
      ],
      timeColumn: 'date',
      improvementDate: '2026-01-05T00:00:00.000Z',
      measure: 'value',
      specs: { usl: 20, lsl: 0, target: 10 },
      capturedAt: Date.parse('2026-01-08T00:00:00.000Z'),
    });
    const expected = calculateStats([10, 12, 11, 9], 20, 0);

    expect(baseline.sigma).toBeCloseTo(expected.sigmaWithin);
    expect(baseline.cpk).toBeCloseTo(expected.cpk!);
  });

  it('throws when no valid pre-improvement rows can be frozen', () => {
    expect(() =>
      freezeBaseline({
        rows: [
          { date: '2026-01-05T00:00:00.000Z', value: 8 },
          { date: '2026-01-06T00:00:00.000Z', value: 9 },
          { date: '2026-01-01T00:00:00.000Z', value: '' },
        ],
        timeColumn: 'date',
        improvementDate: '2026-01-05T00:00:00.000Z',
        measure: 'value',
        specs: { usl: 20, lsl: 0, target: 10 },
      })
    ).toThrow('Cannot freeze baseline without valid pre-improvement rows for measure "value".');
  });
});
