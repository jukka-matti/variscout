import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreferencesStore, getPreferencesInitialState } from '@variscout/stores';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useLensedSampleCount } from '../useLensedSampleCount';
import type { DataRow } from '@variscout/core';

/** Build N simple rows */
function buildRows(n: number): DataRow[] {
  return Array.from({ length: n }, (_, i) => ({ value: i + 1 })) as DataRow[];
}

beforeEach(() => {
  usePreferencesStore.setState(getPreferencesInitialState());
  useProjectStore.setState(getProjectInitialState());
});

describe('useLensedSampleCount', () => {
  it('cumulative (default): returns full filtered count', () => {
    act(() => {
      useProjectStore.setState({ rawData: buildRows(100), filters: {} });
    });
    const { result } = renderHook(() => useLensedSampleCount());
    expect(result.current).toBe(100);
  });

  it('rolling windowSize=50: returns 50 when 100 rows are loaded', () => {
    act(() => {
      useProjectStore.setState({ rawData: buildRows(100), filters: {} });
      usePreferencesStore.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });
    const { result } = renderHook(() => useLensedSampleCount());
    expect(result.current).toBe(50);
  });

  it('updates reactively when lens changes (cumulative → rolling-50 → cumulative)', () => {
    act(() => {
      useProjectStore.setState({ rawData: buildRows(100), filters: {} });
    });
    const { result } = renderHook(() => useLensedSampleCount());

    expect(result.current).toBe(100);

    act(() => {
      usePreferencesStore.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });
    expect(result.current).toBe(50);

    act(() => {
      usePreferencesStore.setState({ timeLens: { mode: 'cumulative' } });
    });
    expect(result.current).toBe(100);
  });

  it('fixed anchor=0 windowSize=30: returns 30', () => {
    act(() => {
      useProjectStore.setState({ rawData: buildRows(100), filters: {} });
      usePreferencesStore.setState({ timeLens: { mode: 'fixed', anchor: 0, windowSize: 30 } });
    });
    const { result } = renderHook(() => useLensedSampleCount());
    expect(result.current).toBe(30);
  });

  it('out-of-bounds fixed anchor returns 0', () => {
    act(() => {
      useProjectStore.setState({ rawData: buildRows(5), filters: {} });
      usePreferencesStore.setState({ timeLens: { mode: 'fixed', anchor: 99, windowSize: 5 } });
    });
    const { result } = renderHook(() => useLensedSampleCount());
    expect(result.current).toBe(0);
  });
});
