/**
 * Tests for useDashboardChartsBase hook
 */

// vi.mock calls MUST be before component imports to prevent infinite re-render loops
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../useDashboardComputedData', () => ({
  useDashboardComputedData: vi.fn(() => ({
    availableOutcomes: ['Weight'],
    availableStageColumns: ['Machine', 'Shift'],
    anovaResult: null,
    boxplotData: [],
  })),
}));

vi.mock('../useChartCopy', () => ({
  useChartCopy: vi.fn(() => ({
    copyFeedback: null,
    handleCopyChart: vi.fn(),
    handleDownloadPng: vi.fn(),
    handleDownloadSvg: vi.fn(),
  })),
}));

import { renderHook, act } from '@testing-library/react';
import { useDashboardChartsBase } from '../useDashboardChartsBase';
import type { UseDashboardChartsBaseOptions } from '../useDashboardChartsBase';
import type { FilterAction } from '@variscout/core';

function makeOptions(
  overrides: Partial<UseDashboardChartsBaseOptions> = {}
): UseDashboardChartsBaseOptions {
  return {
    rawData: [
      { Machine: 'A', Shift: 'Day', Weight: 10 },
      { Machine: 'B', Shift: 'Night', Weight: 20 },
    ],
    filteredData: [
      { Machine: 'A', Shift: 'Day', Weight: 10 },
      { Machine: 'B', Shift: 'Night', Weight: 20 },
    ],
    outcome: 'Weight',
    factors: ['Machine', 'Shift'],
    filterStack: [],
    displayOptions: {},
    filterNav: { applyFilter: vi.fn() },
    ...overrides,
  };
}

describe('useDashboardChartsBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Factor initialization ───────────────────────────────────────────

  it('initializes boxplotFactor to factors[0] and paretoFactor to factors[1]', () => {
    const opts = makeOptions({ factors: ['Machine', 'Shift'] });
    const { result } = renderHook(() => useDashboardChartsBase(opts));

    expect(result.current.boxplotFactor).toBe('Machine');
    expect(result.current.paretoFactor).toBe('Shift');
  });

  it('sets paretoFactor to factors[0] when only one factor available', () => {
    const opts = makeOptions({ factors: ['Machine'] });
    const { result } = renderHook(() => useDashboardChartsBase(opts));

    expect(result.current.boxplotFactor).toBe('Machine');
    expect(result.current.paretoFactor).toBe('Machine');
  });

  it('uses initialBoxplotFactor and initialParetoFactor when provided', () => {
    const opts = makeOptions({
      factors: ['Machine', 'Shift', 'Operator'],
      initialBoxplotFactor: 'Shift',
      initialParetoFactor: 'Operator',
    });
    const { result } = renderHook(() => useDashboardChartsBase(opts));

    expect(result.current.boxplotFactor).toBe('Shift');
    expect(result.current.paretoFactor).toBe('Operator');
  });

  // ── Factor reset on removal ─────────────────────────────────────────

  it('resets factor to factors[0] when current factor is removed', () => {
    const opts = makeOptions({ factors: ['Machine', 'Shift'] });
    const { result, rerender } = renderHook(
      (props: UseDashboardChartsBaseOptions) => useDashboardChartsBase(props),
      { initialProps: opts }
    );

    // Set paretoFactor to 'Shift'
    expect(result.current.paretoFactor).toBe('Shift');

    // Now remove 'Shift' from factors
    rerender(makeOptions({ factors: ['Machine', 'Operator'] }));

    expect(result.current.boxplotFactor).toBe('Machine');
    // 'Shift' is no longer in factors, so paretoFactor resets
    expect(result.current.paretoFactor).toBe('Operator');
  });

  // ── Pareto comparison toggle ────────────────────────────────────────

  it('toggleParetoComparison flips showParetoComparison', () => {
    const opts = makeOptions();
    const { result } = renderHook(() => useDashboardChartsBase(opts));

    expect(result.current.showParetoComparison).toBe(false);

    act(() => {
      result.current.toggleParetoComparison();
    });
    expect(result.current.showParetoComparison).toBe(true);

    act(() => {
      result.current.toggleParetoComparison();
    });
    expect(result.current.showParetoComparison).toBe(false);
  });

  it('setShowParetoComparison sets the value directly', () => {
    const opts = makeOptions();
    const { result } = renderHook(() => useDashboardChartsBase(opts));

    act(() => {
      result.current.setShowParetoComparison(true);
    });
    expect(result.current.showParetoComparison).toBe(true);
  });

  // ── handleDrillDown ─────────────────────────────────────────────────

  it('handleDrillDown calls applyFilter with correct FilterAction and keeps factor', () => {
    const applyFilter = vi.fn();
    const opts = makeOptions({ filterNav: { applyFilter } });
    const { result } = renderHook(() => useDashboardChartsBase(opts));

    act(() => {
      result.current.handleDrillDown('Machine', 'A');
    });

    // Verify applyFilter was called with correct shape
    expect(applyFilter).toHaveBeenCalledTimes(1);
    const filterArg = applyFilter.mock.calls[0][0] as FilterAction;
    expect(filterArg).toEqual({
      type: 'filter',
      source: 'boxplot',
      factor: 'Machine',
      values: ['A'],
    });

    // Factor stays on the drilled factor
    expect(result.current.boxplotFactor).toBe('Machine');
    expect(result.current.paretoFactor).toBe('Machine');
  });

  // ── Passthrough of composed hook data ───────────────────────────────

  it('passes through computed data from composed hooks', () => {
    const opts = makeOptions();
    const { result } = renderHook(() => useDashboardChartsBase(opts));

    // Computed data passthrough
    expect(result.current.availableOutcomes).toEqual(['Weight']);
    expect(result.current.availableStageColumns).toEqual(['Machine', 'Shift']);
    expect(result.current.anovaResult).toBeNull();
    expect(result.current.boxplotData).toEqual([]);

    // Chart copy passthrough
    expect(result.current.copyFeedback).toBeNull();
    expect(typeof result.current.handleCopyChart).toBe('function');
    expect(typeof result.current.handleDownloadPng).toBe('function');
    expect(typeof result.current.handleDownloadSvg).toBe('function');
  });

  // ── Manual factor selection ─────────────────────────────────────────

  it('setBoxplotFactor and setParetoFactor update factors independently', () => {
    const opts = makeOptions({ factors: ['Machine', 'Shift', 'Operator'] });
    const { result } = renderHook(() => useDashboardChartsBase(opts));

    act(() => {
      result.current.setBoxplotFactor('Operator');
    });
    expect(result.current.boxplotFactor).toBe('Operator');
    expect(result.current.paretoFactor).toBe('Shift'); // unchanged

    act(() => {
      result.current.setParetoFactor('Machine');
    });
    expect(result.current.paretoFactor).toBe('Machine');
    expect(result.current.boxplotFactor).toBe('Operator'); // unchanged
  });
});
