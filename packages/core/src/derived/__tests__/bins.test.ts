import { describe, expect, it } from 'vitest';
import { computeBinnedFactorColumn } from '../bins';
import type { BinnedFactorBinding } from '../../binning';

function binding(overrides: Partial<BinnedFactorBinding> = {}): BinnedFactorBinding {
  return {
    id: 'b1',
    sourceColumn: 'Reactor_temp',
    cuts: [50],
    levelNames: ['<50', '>=50'],
    detectionMethod: 'gap-ratio-v1',
    detectedAt: '2026-05-28T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeBinnedFactorColumn', () => {
  it('maps values to labels per cuts', () => {
    const rows = [{ Reactor_temp: 30 }, { Reactor_temp: 70 }, { Reactor_temp: 50 }];
    expect(computeBinnedFactorColumn(rows, binding())).toEqual(['<50', '>=50', '>=50']);
  });

  it('returns null for missing/null/undefined/invalid/NaN values', () => {
    const rows = [
      { Reactor_temp: null },
      { Reactor_temp: 30 },
      {},
      { Reactor_temp: 'invalid' },
      { Reactor_temp: NaN },
    ];
    expect(computeBinnedFactorColumn(rows, binding())).toEqual([null, '<50', null, null, null]);
  });

  it('assigns all rows to the single level when cuts is empty', () => {
    const rows = [{ Reactor_temp: 10 }, { Reactor_temp: 99 }, { Reactor_temp: 0 }];
    expect(computeBinnedFactorColumn(rows, binding({ cuts: [], levelNames: ['only'] }))).toEqual([
      'only',
      'only',
      'only',
    ]);
  });

  it('coerces numeric strings to numbers', () => {
    const rows = [{ Reactor_temp: '30' }, { Reactor_temp: '70.5' }];
    expect(computeBinnedFactorColumn(rows, binding())).toEqual(['<50', '>=50']);
  });

  it('handles a 2-cut binding (3 segments)', () => {
    const rows = [{ Reactor_temp: 10 }, { Reactor_temp: 50 }, { Reactor_temp: 100 }];
    expect(
      computeBinnedFactorColumn(
        rows,
        binding({ cuts: [30, 70], levelNames: ['low', 'med', 'high'] })
      )
    ).toEqual(['low', 'med', 'high']);
  });

  it('result length equals rows length', () => {
    const rows = [
      { Reactor_temp: 1 },
      { Reactor_temp: 2 },
      { Reactor_temp: null },
      {},
      { Reactor_temp: 99 },
    ];
    const result = computeBinnedFactorColumn(rows, binding());
    expect(result).toHaveLength(rows.length);
  });

  it('returns null when source column key is absent from row', () => {
    const rows = [{ other_col: 42 }];
    expect(computeBinnedFactorColumn(rows, binding())).toEqual([null]);
  });
});
