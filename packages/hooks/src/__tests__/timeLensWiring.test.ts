/**
 * Task 3 — timeLens wiring tests
 *
 * Verifies that useIChartData, useBoxplotData, useProbabilityPlotData,
 * useParetoChartData, and useAnalysisStats all consume the global `timeLens`
 * from useSessionStore and pass their output through applyTimeLens before
 * computing stats / chart prep.
 *
 * Pattern:
 *  - beforeEach resets the store to its initial state (mode: 'cumulative').
 *  - Each rolling-lens test sets `{ timeLens: { mode: 'rolling', windowSize: 50 } }`.
 *  - Cumulative regression tests confirm the full dataset is still used when
 *    the lens is in its default state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionStore, getSessionInitialState } from '@variscout/stores';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useIChartData } from '../useIChartData';
import { useBoxplotData } from '../useBoxplotData';
import { useProbabilityPlotData } from '../useProbabilityPlotData';
import { useParetoChartData } from '../useParetoChartData';
import { useAnalysisStats } from '../useAnalysisStats';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

/** Build N numeric rows, each with a distinct y-value 1..N */
function buildRows(n: number, outcomeKey = 'value'): Record<string, unknown>[] {
  return Array.from({ length: n }, (_, i) => ({
    [outcomeKey]: i + 1,
    factor: i % 5 === 0 ? 'A' : 'B',
  }));
}

const ROWS_100 = buildRows(100);
const ROWS_100_PROB = buildRows(100, 'v');

// Pareto test data: 100 rows with two categories
function buildParetoRows(n: number): Record<string, unknown>[] {
  return Array.from({ length: n }, (_, i) => ({
    defect: i % 2 === 0 ? 'TypeA' : 'TypeB',
    count: 1,
  }));
}
const PARETO_100 = buildParetoRows(100);
const NO_FILTERS: Record<string, (string | number)[]> = {};

// ---------------------------------------------------------------------------
// Store reset helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  useSessionStore.setState(getSessionInitialState());
  useProjectStore.setState(getProjectInitialState());
});

// ---------------------------------------------------------------------------
// useIChartData
// ---------------------------------------------------------------------------

describe('useIChartData — timeLens wiring', () => {
  it('cumulative (default): returns all 100 data points', () => {
    const { result } = renderHook(() => useIChartData(ROWS_100, 'value', null, null));
    expect(result.current).toHaveLength(100);
  });

  it('rolling windowSize=50: returns only the last 50 data points', () => {
    act(() => {
      useSessionStore.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });
    const { result } = renderHook(() => useIChartData(ROWS_100, 'value', null, null));
    expect(result.current).toHaveLength(50);
    // The last row in the window should be the 100th value (value = 100)
    expect(result.current[49].y).toBe(100);
    // The first row in the window should be the 51st value (value = 51)
    expect(result.current[0].y).toBe(51);
  });

  it('fixed anchor=0 windowSize=30: returns first 30 data points', () => {
    act(() => {
      useSessionStore.setState({ timeLens: { mode: 'fixed', anchor: 0, windowSize: 30 } });
    });
    const { result } = renderHook(() => useIChartData(ROWS_100, 'value', null, null));
    expect(result.current).toHaveLength(30);
    expect(result.current[0].y).toBe(1);
    expect(result.current[29].y).toBe(30);
  });

  it('openEnded anchor=80: returns rows 80..99', () => {
    act(() => {
      useSessionStore.setState({ timeLens: { mode: 'openEnded', anchor: 80 } });
    });
    const { result } = renderHook(() => useIChartData(ROWS_100, 'value', null, null));
    expect(result.current).toHaveLength(20);
    expect(result.current[0].y).toBe(81);
  });
});

// ---------------------------------------------------------------------------
// useBoxplotData
// ---------------------------------------------------------------------------

describe('useBoxplotData — timeLens wiring', () => {
  it('cumulative (default): totals all 100 rows across groups', () => {
    const { result } = renderHook(() => useBoxplotData(ROWS_100, 'factor', 'value'));
    const totalValues = result.current.data.reduce((sum, g) => sum + g.values.length, 0);
    expect(totalValues).toBe(100);
  });

  it('rolling windowSize=50: group value totals sum to 50', () => {
    act(() => {
      useSessionStore.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });
    const { result } = renderHook(() => useBoxplotData(ROWS_100, 'factor', 'value'));
    const totalValues = result.current.data.reduce((sum, g) => sum + g.values.length, 0);
    expect(totalValues).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// useProbabilityPlotData
// ---------------------------------------------------------------------------

describe('useProbabilityPlotData — timeLens wiring', () => {
  it('cumulative (default): single series has n=100', () => {
    const values = ROWS_100_PROB.map(r => r.v as number);
    const { result } = renderHook(() => useProbabilityPlotData({ values }));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].n).toBe(100);
  });

  it('rolling windowSize=50: single series has n=50', () => {
    act(() => {
      useSessionStore.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });
    const values = ROWS_100_PROB.map(r => r.v as number);
    const { result } = renderHook(() => useProbabilityPlotData({ values }));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].n).toBe(50);
  });

  it('rolling windowSize=50 with rows: factor grouping operates on 50 rows', () => {
    act(() => {
      useSessionStore.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });
    const rows = ROWS_100_PROB as import('@variscout/core').DataRow[];
    const values = ROWS_100_PROB.map(r => r.v as number);
    const { result } = renderHook(() =>
      useProbabilityPlotData({ values, factorColumn: 'factor', rows })
    );
    const totalN = result.current.reduce((sum, s) => sum + s.n, 0);
    expect(totalN).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// useParetoChartData
// ---------------------------------------------------------------------------

describe('useParetoChartData — timeLens wiring', () => {
  it('cumulative (default): totalCount reflects all 100 filtered rows', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: PARETO_100,
        filteredData: PARETO_100,
        factor: 'defect',
        outcome: null,
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );
    expect(result.current.totalCount).toBe(100);
  });

  it('rolling windowSize=50: totalCount reflects only last 50 filtered rows', () => {
    act(() => {
      useSessionStore.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: PARETO_100,
        filteredData: PARETO_100,
        factor: 'defect',
        outcome: null,
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );
    expect(result.current.totalCount).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// useAnalysisStats (page-stats)
// ---------------------------------------------------------------------------

describe('useAnalysisStats — timeLens wiring', () => {
  // buildRows(100) produces values 1..100, mean = 50.5
  // rolling window of last 50 → values 51..100, mean = 75.5

  it('cumulative (default): mean reflects full 100-row dataset (mean ≈ 50.5)', async () => {
    const rawData = buildRows(100) as import('@variscout/core').DataRow[];
    act(() => {
      useProjectStore.setState({ rawData, outcome: 'value', filters: {} });
    });

    const { result } = renderHook(() => useAnalysisStats());

    // Wait for async useEffect + sync computeStats to settle
    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });
    expect(result.current.stats!.mean).toBeCloseTo(50.5, 1);
  });

  it('rolling windowSize=50: mean reflects last-50 subset (mean ≈ 75.5)', async () => {
    const rawData = buildRows(100) as import('@variscout/core').DataRow[];
    act(() => {
      useProjectStore.setState({ rawData, outcome: 'value', filters: {} });
      useSessionStore.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });

    const { result } = renderHook(() => useAnalysisStats());

    // Wait for async useEffect + sync computeStats to settle
    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });
    // Last 50 rows: values 51..100, mean = (51+100)/2 = 75.5
    expect(result.current.stats!.mean).toBeCloseTo(75.5, 1);
  });
});
