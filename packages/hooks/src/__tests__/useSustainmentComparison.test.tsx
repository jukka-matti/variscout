import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ControlRecord, DataRow } from '@variscout/core';
import { useSustainmentComparison } from '../useSustainmentComparison';

function makeRecord(overrides: Partial<ControlRecord> = {}): ControlRecord {
  return {
    id: 'sr-1',
    hubId: 'hub-1',
    projectId: 'inv-1',
    status: 'verifying',
    title: 'Hold fill weight',
    lastEvaluatedSnapshotId: undefined,
    improvementDate: '2026-06-01T00:00:00.000Z',
    baseline: {
      capturedAt: 1_714_000_000_000,
      window: {
        startISO: '2026-05-01T00:00:00.000Z',
        endISO: '2026-05-31T23:59:59.999Z',
      },
      measure: 'fill_weight',
      n: 2,
      mean: 100,
      sigma: 1,
      specsSnapshot: { lsl: 95, usl: 105 },
    },
    ladder: [7, 30, 90],
    ladderStep: 0,
    createdAt: 1_714_000_000_000,
    updatedAt: 1_714_000_000_000,
    deletedAt: null,
    ...overrides,
  };
}

describe('useSustainmentComparison', () => {
  const rows: DataRow[] = [
    { captured_at: '2026-05-01T00:00:00.000Z', fill_weight: 99, defect: 'under' },
    { captured_at: '2026-05-02T00:00:00.000Z', fill_weight: 101, defect: 'over' },
    { captured_at: '2026-06-02T00:00:00.000Z', fill_weight: 100.5, defect: 'over' },
    { captured_at: '2026-06-03T00:00:00.000Z', fill_weight: 100.7, defect: 'over' },
  ];

  it('returns null until a control record is selected', () => {
    const { result } = renderHook(() =>
      useSustainmentComparison({ rows, timeColumn: 'captured_at', record: null })
    );

    expect(result.current).toBeNull();
  });

  it('computes live before/after comparison from app data', () => {
    const { result } = renderHook(() =>
      useSustainmentComparison({
        rows,
        timeColumn: 'captured_at',
        record: makeRecord(),
        defectCategoryColumn: 'defect',
      })
    );

    expect(result.current?.before.source).toBe('live');
    expect(result.current?.before.n).toBe(2);
    expect(result.current?.after?.n).toBe(2);
    expect(result.current?.defects?.after).toEqual([{ category: 'over', count: 2 }]);
  });

  it('recomputes when rows change', () => {
    const record = makeRecord();
    const { result, rerender } = renderHook(
      ({ currentRows }) =>
        useSustainmentComparison({ rows: currentRows, timeColumn: 'captured_at', record }),
      { initialProps: { currentRows: rows } }
    );

    expect(result.current?.after?.n).toBe(2);

    rerender({
      currentRows: [...rows, { captured_at: '2026-06-04T00:00:00.000Z', fill_weight: 100.4 }],
    });

    expect(result.current?.after?.n).toBe(3);
  });
});
