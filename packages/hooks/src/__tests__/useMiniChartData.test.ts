import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMiniChartData } from '../useMiniChartData';
import type { Hypothesis } from '@variscout/core/findings';

const hub = (condition: Hypothesis['condition']): Hypothesis =>
  ({
    id: 'h1',
    name: '',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'proposed',
    investigationId: 'inv-1',
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    condition,
  }) as Hypothesis;

describe('useMiniChartData', () => {
  it('returns ichart values for numeric factor', () => {
    const rows = [{ TEMP: 90 }, { TEMP: 95 }, { TEMP: 100 }];
    const { result } = renderHook(() =>
      useMiniChartData(
        hub({ kind: 'leaf', column: 'TEMP', op: 'gt', value: 95 }),
        rows,
        { TEMP: 'numeric' },
        'thickness'
      )
    );
    expect(result.current.kind).toBe('i-chart');
    expect(result.current.values).toEqual([90, 95, 100]);
  });

  it('returns boxplot groups for categorical factor with outcome', () => {
    const rows = [
      { SUPPLIER: 'A', thickness: 1.0 },
      { SUPPLIER: 'A', thickness: 1.1 },
      { SUPPLIER: 'B', thickness: 1.5 },
    ];
    const { result } = renderHook(() =>
      useMiniChartData(
        hub({ kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' }),
        rows,
        { SUPPLIER: 'categorical', thickness: 'numeric' },
        'thickness'
      )
    );
    expect(result.current.kind).toBe('boxplot');
    expect(result.current.groups).toHaveLength(2);
    const a = result.current.groups!.find(g => g.category === 'A');
    expect(a!.values).toEqual([1.0, 1.1]);
  });

  it('returns placeholder for categorical factor without outcome', () => {
    const { result } = renderHook(() =>
      useMiniChartData(
        hub({ kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' }),
        [],
        { SUPPLIER: 'categorical' },
        undefined
      )
    );
    expect(result.current.kind).toBe('placeholder');
    expect(result.current.reason).toBe('no-outcome');
  });
});
