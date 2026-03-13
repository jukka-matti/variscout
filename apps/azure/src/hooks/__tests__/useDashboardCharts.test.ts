/**
 * Tests for useDashboardCharts — Azure wrapper around useDashboardChartsBase
 *
 * CRITICAL: vi.mock() calls BEFORE component imports to prevent OOM.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks (BEFORE imports) ────────────────────────────────────────────

const mockSetChartTitles = vi.fn();
const mockUseData = vi.fn();

vi.mock('../../context/DataContext', () => ({
  useData: () => mockUseData(),
}));

const mockBaseSetBoxplotFactor = vi.fn();
const mockBaseSetParetoFactor = vi.fn();
const mockBaseHandleDrillDown = vi.fn();
const mockBaseSetShowParetoComparison = vi.fn();
const mockBaseHandleCopyChart = vi.fn();
const mockBaseHandleDownloadPng = vi.fn();
const mockBaseHandleDownloadSvg = vi.fn();

const defaultBaseResult = {
  boxplotFactor: 'Operator',
  setBoxplotFactor: mockBaseSetBoxplotFactor,
  paretoFactor: 'Line',
  setParetoFactor: mockBaseSetParetoFactor,
  showParetoComparison: false,
  setShowParetoComparison: mockBaseSetShowParetoComparison,
  toggleParetoComparison: vi.fn(),
  copyFeedback: null,
  handleCopyChart: mockBaseHandleCopyChart,
  handleDownloadPng: mockBaseHandleDownloadPng,
  handleDownloadSvg: mockBaseHandleDownloadSvg,
  availableOutcomes: ['Weight'],
  availableStageColumns: [],
  anovaResult: null,
  boxplotData: [],
  cumulativeVariationPct: 42,
  factorVariations: new Map([['Operator', 0.35]]),
  categoryContributions: new Map([
    [
      'Operator',
      new Map<string | number, number>([
        ['A', 0.6],
        ['B', 0.4],
      ]),
    ],
  ]),
  filterChipData: [],
  handleDrillDown: mockBaseHandleDrillDown,
};

vi.mock('@variscout/hooks', () => ({
  useDashboardChartsBase: () => defaultBaseResult,
  useKeyboardNavigation: vi.fn(),
}));

// Mock the local filter navigation hook (imported via ../hooks barrel)
const mockApplyFilter = vi.fn();
const mockClearFilters = vi.fn();
const mockUpdateFilterValues = vi.fn();
const mockRemoveFilter = vi.fn();

vi.mock('../useFilterNavigation', () => ({
  useFilterNavigation: () => ({
    filterStack: [],
    applyFilter: mockApplyFilter,
    clearFilters: mockClearFilters,
    updateFilterValues: mockUpdateFilterValues,
    removeFilter: mockRemoveFilter,
  }),
}));

// ── Import AFTER mocks ────────────────────────────────────────────────
import { renderHook, act } from '@testing-library/react';
import { useDashboardCharts } from '../useDashboardCharts';

// ── Default DataContext mock ──────────────────────────────────────────

function defaultDataContext() {
  return {
    outcome: 'Weight',
    factors: ['Operator', 'Line'],
    rawData: [{ Weight: 10, Operator: 'A', Line: '1' }],
    filteredData: [{ Weight: 10, Operator: 'A', Line: '1' }],
    chartTitles: {},
    setChartTitles: mockSetChartTitles,
    displayOptions: {},
  };
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('useDashboardCharts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseData.mockReturnValue(defaultDataContext());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('base hook passthrough', () => {
    it('returns boxplotFactor and paretoFactor from base hook', () => {
      const { result } = renderHook(() => useDashboardCharts());

      expect(result.current.boxplotFactor).toBe('Operator');
      expect(result.current.paretoFactor).toBe('Line');
    });

    it('returns computed data from base hook', () => {
      const { result } = renderHook(() => useDashboardCharts());

      expect(result.current.availableOutcomes).toEqual(['Weight']);
      expect(result.current.availableStageColumns).toEqual([]);
      expect(result.current.anovaResult).toBeNull();
      expect(result.current.boxplotData).toEqual([]);
    });

    it('returns chart export functions from base hook', () => {
      const { result } = renderHook(() => useDashboardCharts());

      expect(result.current.copyFeedback).toBeNull();
      expect(result.current.handleCopyChart).toBe(mockBaseHandleCopyChart);
      expect(result.current.handleDownloadPng).toBe(mockBaseHandleDownloadPng);
      expect(result.current.handleDownloadSvg).toBe(mockBaseHandleDownloadSvg);
    });

    it('returns showParetoComparison from base hook', () => {
      const { result } = renderHook(() => useDashboardCharts());

      expect(result.current.showParetoComparison).toBe(false);
      expect(result.current.setShowParetoComparison).toBe(mockBaseSetShowParetoComparison);
    });

    it('returns filter navigation functions', () => {
      const { result } = renderHook(() => useDashboardCharts());

      expect(result.current.filterStack).toEqual([]);
      expect(result.current.applyFilter).toBe(mockApplyFilter);
      expect(result.current.clearFilters).toBe(mockClearFilters);
      expect(result.current.updateFilterValues).toBe(mockUpdateFilterValues);
      expect(result.current.removeFilter).toBe(mockRemoveFilter);
    });
  });

  describe('categoryContributions', () => {
    it('returns category contributions from base hook when present', () => {
      const { result } = renderHook(() => useDashboardCharts());

      expect(result.current.categoryContributions).toBeInstanceOf(Map);
      expect(result.current.categoryContributions.has('Operator')).toBe(true);
      const operatorMap = result.current.categoryContributions.get('Operator')!;
      expect(operatorMap.get('A')).toBe(0.6);
      expect(operatorMap.get('B')).toBe(0.4);
    });

    it('returns empty Map when base hook has undefined categoryContributions', () => {
      // Override base result for this test
      const originalContributions = defaultBaseResult.categoryContributions;
      defaultBaseResult.categoryContributions = undefined as unknown as Map<
        string,
        Map<string | number, number>
      >;

      const { result } = renderHook(() => useDashboardCharts());

      expect(result.current.categoryContributions).toBeInstanceOf(Map);
      expect(result.current.categoryContributions.size).toBe(0);

      // Restore
      defaultBaseResult.categoryContributions = originalContributions;
    });
  });

  describe('cumulativeVariationPct', () => {
    it('returns value from base hook', () => {
      const { result } = renderHook(() => useDashboardCharts());
      expect(result.current.cumulativeVariationPct).toBe(42);
    });

    it('coerces null to 0', () => {
      const original = defaultBaseResult.cumulativeVariationPct;
      defaultBaseResult.cumulativeVariationPct = null as unknown as number;

      const { result } = renderHook(() => useDashboardCharts());
      expect(result.current.cumulativeVariationPct).toBe(0);

      defaultBaseResult.cumulativeVariationPct = original;
    });
  });

  describe('factor setter persistence callbacks', () => {
    it('calls onBoxplotFactorChange when setBoxplotFactor is called', () => {
      const onBoxplotFactorChange = vi.fn();
      const { result } = renderHook(() => useDashboardCharts({ onBoxplotFactorChange }));

      act(() => {
        result.current.setBoxplotFactor('Line');
      });

      expect(mockBaseSetBoxplotFactor).toHaveBeenCalledWith('Line');
      expect(onBoxplotFactorChange).toHaveBeenCalledWith('Line');
    });

    it('calls onParetoFactorChange when setParetoFactor is called', () => {
      const onParetoFactorChange = vi.fn();
      const { result } = renderHook(() => useDashboardCharts({ onParetoFactorChange }));

      act(() => {
        result.current.setParetoFactor('Operator');
      });

      expect(mockBaseSetParetoFactor).toHaveBeenCalledWith('Operator');
      expect(onParetoFactorChange).toHaveBeenCalledWith('Operator');
    });

    it('does not throw when persistence callbacks are not provided', () => {
      const { result } = renderHook(() => useDashboardCharts());

      expect(() => {
        act(() => {
          result.current.setBoxplotFactor('Line');
          result.current.setParetoFactor('Operator');
        });
      }).not.toThrow();
    });
  });

  describe('focused chart navigation', () => {
    it('initializes focusedChart as null', () => {
      const { result } = renderHook(() => useDashboardCharts());
      expect(result.current.focusedChart).toBeNull();
    });

    it('setFocusedChart updates the focused chart', () => {
      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.setFocusedChart('ichart');
      });
      expect(result.current.focusedChart).toBe('ichart');

      act(() => {
        result.current.setFocusedChart('boxplot');
      });
      expect(result.current.focusedChart).toBe('boxplot');

      act(() => {
        result.current.setFocusedChart(null);
      });
      expect(result.current.focusedChart).toBeNull();
    });

    it('handleNextChart cycles through chart order', () => {
      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.setFocusedChart('ichart');
      });

      act(() => {
        result.current.handleNextChart();
      });
      expect(result.current.focusedChart).toBe('boxplot');

      act(() => {
        result.current.handleNextChart();
      });
      expect(result.current.focusedChart).toBe('pareto');

      act(() => {
        result.current.handleNextChart();
      });
      expect(result.current.focusedChart).toBe('ichart');
    });

    it('handlePrevChart cycles backward through chart order', () => {
      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.setFocusedChart('ichart');
      });

      act(() => {
        result.current.handlePrevChart();
      });
      expect(result.current.focusedChart).toBe('pareto');

      act(() => {
        result.current.handlePrevChart();
      });
      expect(result.current.focusedChart).toBe('boxplot');
    });

    it('handleNextChart does nothing when focusedChart is null', () => {
      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.handleNextChart();
      });
      expect(result.current.focusedChart).toBeNull();
    });

    it('handlePrevChart does nothing when focusedChart is null', () => {
      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.handlePrevChart();
      });
      expect(result.current.focusedChart).toBeNull();
    });
  });

  describe('showParetoPanel', () => {
    it('initializes as true', () => {
      const { result } = renderHook(() => useDashboardCharts());
      expect(result.current.showParetoPanel).toBe(true);
    });

    it('can be toggled', () => {
      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.setShowParetoPanel(false);
      });
      expect(result.current.showParetoPanel).toBe(false);

      act(() => {
        result.current.setShowParetoPanel(true);
      });
      expect(result.current.showParetoPanel).toBe(true);
    });

    it('resets to true when rawData changes', () => {
      const { result, rerender } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.setShowParetoPanel(false);
      });
      expect(result.current.showParetoPanel).toBe(false);

      // Simulate data change
      mockUseData.mockReturnValue({
        ...defaultDataContext(),
        rawData: [{ Weight: 20, Operator: 'B', Line: '2' }],
      });
      rerender();

      expect(result.current.showParetoPanel).toBe(true);
    });

    it('resets to true when factors change', () => {
      const { result, rerender } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.setShowParetoPanel(false);
      });
      expect(result.current.showParetoPanel).toBe(false);

      mockUseData.mockReturnValue({
        ...defaultDataContext(),
        factors: ['Operator', 'Line', 'Shift'],
      });
      rerender();

      expect(result.current.showParetoPanel).toBe(true);
    });
  });

  describe('handleChartTitleChange', () => {
    it('calls setChartTitles with updated title', () => {
      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.handleChartTitleChange('ichart', 'My I-Chart');
      });

      expect(mockSetChartTitles).toHaveBeenCalledWith({ ichart: 'My I-Chart' });
    });

    it('preserves existing chart titles', () => {
      mockUseData.mockReturnValue({
        ...defaultDataContext(),
        chartTitles: { boxplot: 'Existing Boxplot Title' },
      });

      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.handleChartTitleChange('pareto', 'New Pareto');
      });

      expect(mockSetChartTitles).toHaveBeenCalledWith({
        boxplot: 'Existing Boxplot Title',
        pareto: 'New Pareto',
      });
    });
  });

  describe('handleDrillDown', () => {
    it('delegates to base handleDrillDown and reports factor change', () => {
      mockBaseHandleDrillDown.mockReturnValue('Line');
      const onBoxplotFactorChange = vi.fn();
      const onParetoFactorChange = vi.fn();

      const { result } = renderHook(() =>
        useDashboardCharts({ onBoxplotFactorChange, onParetoFactorChange })
      );

      act(() => {
        result.current.handleDrillDown('Operator', 'A');
      });

      expect(mockBaseHandleDrillDown).toHaveBeenCalledWith('Operator', 'A');
      expect(onBoxplotFactorChange).toHaveBeenCalledWith('Line');
      expect(onParetoFactorChange).toHaveBeenCalledWith('Line');
    });

    it('reports the original factor when no next factor exists', () => {
      mockBaseHandleDrillDown.mockReturnValue(null);
      const onBoxplotFactorChange = vi.fn();
      const onParetoFactorChange = vi.fn();

      const { result } = renderHook(() =>
        useDashboardCharts({ onBoxplotFactorChange, onParetoFactorChange })
      );

      act(() => {
        result.current.handleDrillDown('Operator', 'A');
      });

      expect(onBoxplotFactorChange).toHaveBeenCalledWith('Operator');
      expect(onParetoFactorChange).toHaveBeenCalledWith('Operator');
    });
  });

  describe('lastAdvancedFactor visual feedback', () => {
    it('initializes as null', () => {
      const { result } = renderHook(() => useDashboardCharts());
      expect(result.current.lastAdvancedFactor).toBeNull();
    });

    it('sets lastAdvancedFactor on drill-down when next factor exists', () => {
      mockBaseHandleDrillDown.mockReturnValue('Line');

      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.handleDrillDown('Operator', 'A');
      });

      expect(result.current.lastAdvancedFactor).toBe('Line');
    });

    it('clears lastAdvancedFactor after 2 seconds', () => {
      mockBaseHandleDrillDown.mockReturnValue('Line');

      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.handleDrillDown('Operator', 'A');
      });
      expect(result.current.lastAdvancedFactor).toBe('Line');

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.lastAdvancedFactor).toBeNull();
    });

    it('does not set lastAdvancedFactor when no next factor', () => {
      mockBaseHandleDrillDown.mockReturnValue(null);

      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.handleDrillDown('Operator', 'A');
      });

      expect(result.current.lastAdvancedFactor).toBeNull();
    });

    it('resets timeout on consecutive drill-downs', () => {
      mockBaseHandleDrillDown.mockReturnValue('Line');

      const { result } = renderHook(() => useDashboardCharts());

      act(() => {
        result.current.handleDrillDown('Operator', 'A');
      });
      expect(result.current.lastAdvancedFactor).toBe('Line');

      // Advance partway through the timeout
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Drill again — should reset the timer
      mockBaseHandleDrillDown.mockReturnValue('Shift');
      act(() => {
        result.current.handleDrillDown('Line', 'X');
      });
      expect(result.current.lastAdvancedFactor).toBe('Shift');

      // Original 2s would have expired, but new timer is still running
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.lastAdvancedFactor).toBe('Shift');

      // Full 2s from second drill
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(result.current.lastAdvancedFactor).toBeNull();
    });
  });

  describe('external filter navigation', () => {
    it('uses external filter nav when provided', () => {
      const externalApplyFilter = vi.fn();
      const externalClearFilters = vi.fn();
      const externalUpdateFilterValues = vi.fn();
      const externalRemoveFilter = vi.fn();

      const externalFilterNav = {
        filterStack: [
          { type: 'filter' as const, source: 'boxplot' as const, factor: 'Op', values: ['A'] },
        ],
        applyFilter: externalApplyFilter,
        clearFilters: externalClearFilters,
        updateFilterValues: externalUpdateFilterValues,
        removeFilter: externalRemoveFilter,
        filters: {},
        setFilters: vi.fn(),
        columnAliases: {},
      };

      const { result } = renderHook(() => useDashboardCharts({ externalFilterNav }));

      expect(result.current.filterStack).toEqual(externalFilterNav.filterStack);
      expect(result.current.applyFilter).toBe(externalApplyFilter);
      expect(result.current.clearFilters).toBe(externalClearFilters);
      expect(result.current.updateFilterValues).toBe(externalUpdateFilterValues);
      expect(result.current.removeFilter).toBe(externalRemoveFilter);
    });
  });
});
