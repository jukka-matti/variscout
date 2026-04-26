import { describe, expect, it } from 'vitest';
import {
  buildProcessMomentFindingClue,
  computeProcessMoments,
  summarizeComparableProcessMoments,
  type ProcessMomentDefinition,
} from '../index';
import type { DataRow } from '../types';

const rows: DataRow[] = [
  { Stage: 'Before', Weight: 9.5 },
  { Stage: 'Before', Weight: 9.8 },
  { Stage: 'Before', Weight: 10.1 },
  { Stage: 'Before', Weight: 10.4 },
  { Stage: 'Before', Weight: 10.7 },
  { Stage: 'After', Weight: 9.98 },
  { Stage: 'After', Weight: 10.0 },
  { Stage: 'After', Weight: 10.02 },
  { Stage: 'After', Weight: 10.01 },
  { Stage: 'After', Weight: 9.99 },
];

const definitions: ProcessMomentDefinition[] = [
  {
    id: 'before',
    name: 'Before change',
    outcomeColumn: 'Weight',
    boundary: { type: 'column-value', column: 'Stage', value: 'Before' },
    specs: { lsl: 9.5, usl: 10.5 },
    cpkTarget: 1.33,
    comparableStage: 'fill-weight',
  },
  {
    id: 'after',
    name: 'After change',
    outcomeColumn: 'Weight',
    boundary: { type: 'column-value', column: 'Stage', value: 'After' },
    specs: { lsl: 9.5, usl: 10.5 },
    cpkTarget: 1.33,
    comparableStage: 'fill-weight',
  },
];

describe('Process Moments', () => {
  it('computes Cp/Cpk lanes and status for stage-like moment boundaries', () => {
    const results = computeProcessMoments(rows, definitions);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: 'before',
      n: 5,
      status: 'red',
    });
    expect(results[0].insufficientReason).toBeUndefined();
    expect(results[0].cp).toBeCloseTo(0.63, 2);
    expect(results[0].cpk).toBeCloseTo(0.5, 2);
    expect(results[1].status).toBe('green');
    expect(results[1].cpk).toBeGreaterThan(1.33);
  });

  it('marks missing specs, n below 5, zero sigma, and invalid outcomes as insufficient', () => {
    const results = computeProcessMoments(
      [
        { Stage: 'Tiny', Weight: 10 },
        { Stage: 'Tiny', Weight: 10.1 },
        { Stage: 'Flat', Weight: 10 },
        { Stage: 'Flat', Weight: 10 },
        { Stage: 'Flat', Weight: 10 },
        { Stage: 'Flat', Weight: 10 },
        { Stage: 'Flat', Weight: 10 },
        { Stage: 'Bad', Weight: 'n/a' },
        { Stage: 'Bad', Weight: null },
      ],
      [
        {
          id: 'tiny',
          name: 'Tiny',
          outcomeColumn: 'Weight',
          boundary: { type: 'column-value', column: 'Stage', value: 'Tiny' },
          specs: { usl: 11 },
        },
        {
          id: 'no-spec',
          name: 'No spec',
          outcomeColumn: 'Weight',
          boundary: { type: 'manual-range', startIndex: 0, endIndex: 4 },
          specs: {},
        },
        {
          id: 'flat',
          name: 'Flat',
          outcomeColumn: 'Weight',
          boundary: { type: 'column-value', column: 'Stage', value: 'Flat' },
          specs: { usl: 11 },
        },
        {
          id: 'bad',
          name: 'Bad',
          outcomeColumn: 'Weight',
          boundary: { type: 'column-value', column: 'Stage', value: 'Bad' },
          specs: { usl: 11 },
        },
      ]
    );

    expect(results.map(result => result.insufficientReason)).toEqual([
      'n-below-5',
      'missing-specs',
      'zero-sigma',
      'invalid-outcome-values',
    ]);
    expect(results.every(result => result.status === 'insufficient')).toBe(true);
  });

  it('summarizes average Cp/Cpk by comparable stage', () => {
    const summary = summarizeComparableProcessMoments(computeProcessMoments(rows, definitions));

    expect(summary).toEqual([
      {
        comparableStage: 'fill-weight',
        momentCount: 2,
        sufficientCount: 2,
        averageCp: expect.any(Number),
        averageCpk: expect.any(Number),
        minCpk: expect.any(Number),
        status: 'red',
      },
    ]);
  });

  it('can project a weak moment into a finding clue for a Mechanism Branch', () => {
    const [weakMoment] = computeProcessMoments(rows, definitions);
    const clue = buildProcessMomentFindingClue(weakMoment, 'hub-1');

    expect(clue).toMatchObject({
      branchId: 'hub-1',
      finding: {
        text: 'Before change moment has Cpk 0.50 below target 1.33.',
        validationStatus: 'supports',
      },
    });
  });
});
