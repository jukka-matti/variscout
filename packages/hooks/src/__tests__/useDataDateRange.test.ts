import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePreferencesStore,
  getPreferencesInitialState,
  useProjectStore,
  getProjectInitialState,
} from '@variscout/stores';
import { useDataDateRange } from '../useDataDateRange';
import type { DataRow } from '@variscout/core';

/**
 * Build N rows spanning a deterministic, fixed date window.
 * Row i carries a `Date` value `daysFromStart` days after `2026-04-13`.
 */
function buildDatedRows(dates: string[]): DataRow[] {
  return dates.map(d => ({ Date: d, value: 1 })) as DataRow[];
}

beforeEach(() => {
  usePreferencesStore.setState(getPreferencesInitialState());
  useProjectStore.setState(getProjectInitialState());
});

describe('useDataDateRange', () => {
  it('returns null when no timeColumn is set', () => {
    act(() => {
      useProjectStore.setState({
        rawData: buildDatedRows(['2026-04-13T00:00:00Z', '2026-06-05T00:00:00Z']),
        filters: {},
        timeColumn: null,
      });
    });
    const { result } = renderHook(() => useDataDateRange());
    expect(result.current).toBeNull();
  });

  it('formats "Apr 13 – Jun 5" over the timeColumn of the lensed rows', () => {
    act(() => {
      useProjectStore.setState({
        rawData: buildDatedRows([
          '2026-04-13T00:00:00Z',
          '2026-05-01T00:00:00Z',
          '2026-06-05T00:00:00Z',
        ]),
        filters: {},
        timeColumn: 'Date',
      });
    });
    const { result } = renderHook(() => useDataDateRange());
    expect(result.current).toBe('Apr 13 – Jun 5');
  });

  it('collapses to a single label when start and end fall on the same day', () => {
    act(() => {
      useProjectStore.setState({
        rawData: buildDatedRows(['2026-04-13T08:00:00Z', '2026-04-13T17:00:00Z']),
        filters: {},
        timeColumn: 'Date',
      });
    });
    const { result } = renderHook(() => useDataDateRange());
    expect(result.current).toBe('Apr 13');
  });

  it('returns null when the timeColumn has no parseable values', () => {
    act(() => {
      useProjectStore.setState({
        rawData: buildDatedRows(['nope', 'still-nope']),
        filters: {},
        timeColumn: 'Date',
      });
    });
    const { result } = renderHook(() => useDataDateRange());
    expect(result.current).toBeNull();
  });

  it('respects the rolling lens window (range shrinks with the lensed slice)', () => {
    // 10 rows, one per day from Apr 1..Apr 10; rolling window of 3 keeps the last 3.
    const dates = Array.from(
      { length: 10 },
      (_, i) => `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`
    );
    act(() => {
      useProjectStore.setState({ rawData: buildDatedRows(dates), filters: {}, timeColumn: 'Date' });
      usePreferencesStore.setState({ timeLens: { mode: 'rolling', windowSize: 3 } });
    });
    const { result } = renderHook(() => useDataDateRange());
    expect(result.current).toBe('Apr 8 – Apr 10');
  });
});
