import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';

// ── Mocks (must precede the hook import) ───────────────────────────────────

// Capture the base hook's setBoxplotFactor so the test can assert the PWA
// wrapper forwards to it AND mirrors into analysisScopeStore.
const baseSetBoxplotFactor = vi.fn();
const baseSetParetoFactor = vi.fn();

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useFilteredData: () => ({ filteredData: [] }),
    useDashboardChartsBase: () => ({
      boxplotFactor: 'Weekday',
      setBoxplotFactor: baseSetBoxplotFactor,
      paretoFactor: 'Weekday',
      setParetoFactor: baseSetParetoFactor,
      availableOutcomes: [],
      availableStageColumns: [],
      anovaResult: null,
      boxplotData: [],
      showParetoComparison: false,
      toggleParetoComparison: vi.fn(),
      copyFeedback: null,
      handleCopyChart: vi.fn(),
      handleDownloadPng: vi.fn(),
      handleDownloadSvg: vi.fn(),
      handleDrillDown: vi.fn(),
    }),
  };
});

vi.mock('../../workers/useStatsWorker', () => ({
  useStatsWorker: () => ({}),
}));

vi.mock('../useFilterNavigation', () => ({
  useFilterNavigation: () => ({
    filterStack: [],
    applyFilter: vi.fn(),
    navigateTo: vi.fn(),
    clearFilters: vi.fn(),
    updateFilterValues: vi.fn(),
    removeFilter: vi.fn(),
  }),
}));

vi.mock('../useFocusMode', () => ({
  useFocusMode: () => ({
    focusedChart: null,
    setFocusedChart: vi.fn(),
    handleNextChart: vi.fn(),
    handlePrevChart: vi.fn(),
  }),
}));

import { useDashboardCharts } from '../useDashboardCharts';

describe('useDashboardCharts — analysisScopeStore boxplotFactor mirror', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalysisScopeStore.setState(
      (
        useAnalysisScopeStore as unknown as {
          getInitialState: () => ReturnType<typeof useAnalysisScopeStore.getState>;
        }
      ).getInitialState()
    );
  });

  it('writes the selected boxplot factor into analysisScopeStore', () => {
    const { result } = renderHook(() => useDashboardCharts());

    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();

    act(() => {
      result.current.setBoxplotFactor('Team');
    });

    // Forwards to the base setter (local picker state)…
    expect(baseSetBoxplotFactor).toHaveBeenCalledWith('Team');
    // …and mirrors into the View-layer scope store so What-If can read it.
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Team');
  });
});
