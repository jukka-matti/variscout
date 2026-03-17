import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useVerificationCharts } from '../useVerificationCharts';
import type { UseVerificationChartsOptions } from '../useVerificationCharts';

// Minimal mock data
const mockStagedComparison = {
  stages: [
    { name: 'Before', stats: { mean: 10, stdDev: 1, cpk: 1.2, outOfSpecPercentage: 2 } },
    { name: 'After', stats: { mean: 10.5, stdDev: 0.8, cpk: 1.5, outOfSpecPercentage: 0.5 } },
  ],
  deltas: {
    meanShift: 0.5,
    variationRatio: 0.8,
    cpkDelta: 0.3,
    passRateDelta: 1.5,
    outOfSpecReduction: 75,
  },
  colorCoding: {
    meanShift: 'amber' as const,
    variationRatio: 'green' as const,
    cpkDelta: 'green' as const,
    passRateDelta: 'green' as const,
    outOfSpecReduction: 'green' as const,
  },
};

const mockStagedStats = {
  stages: new Map([
    ['Before', { mean: 10, stdDev: 1, count: 50 }],
    ['After', { mean: 10.5, stdDev: 0.8, count: 50 }],
  ]),
  stageOrder: ['Before', 'After'],
  overallStats: { mean: 10.25, stdDev: 0.9, count: 100 },
};

function makeOptions(
  overrides: Partial<UseVerificationChartsOptions> = {}
): UseVerificationChartsOptions {
  return {
    stagedComparison:
      mockStagedComparison as unknown as UseVerificationChartsOptions['stagedComparison'],
    stagedStats: mockStagedStats as unknown as UseVerificationChartsOptions['stagedStats'],
    factors: ['Machine'],
    specs: { lsl: 8, usl: 12 },
    stageColumn: 'Stage',
    comparisonData: new Map([
      ['A', 10],
      ['B', 20],
    ]),
    ...overrides,
  };
}

describe('useVerificationCharts', () => {
  it('returns 5 charts in canonical order', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions()));
    const ids = result.current.charts.map(c => c.id);
    expect(ids).toEqual(['stats', 'ichart', 'boxplot', 'histogram', 'pareto']);
  });

  it('marks all charts available when all conditions met', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions()));
    expect(result.current.charts.every(c => c.available)).toBe(true);
    expect(result.current.hasAnyAvailable).toBe(true);
  });

  it('smart defaults: all available charts are ON', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions()));
    expect(result.current.activeCharts.size).toBe(5);
    for (const c of result.current.charts) {
      expect(result.current.activeCharts.has(c.id)).toBe(true);
    }
  });

  it('toggles a chart off then on', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions()));
    expect(result.current.activeCharts.has('stats')).toBe(true);

    act(() => result.current.toggleChart('stats'));
    expect(result.current.activeCharts.has('stats')).toBe(false);

    act(() => result.current.toggleChart('stats'));
    expect(result.current.activeCharts.has('stats')).toBe(true);
  });

  it('cannot toggle unavailable chart on', () => {
    const { result } = renderHook(() =>
      useVerificationCharts(makeOptions({ comparisonData: null }))
    );
    // Pareto should be unavailable
    const pareto = result.current.charts.find(c => c.id === 'pareto')!;
    expect(pareto.available).toBe(false);
    expect(result.current.activeCharts.has('pareto')).toBe(false);

    act(() => result.current.toggleChart('pareto'));
    expect(result.current.activeCharts.has('pareto')).toBe(false);
  });

  it('stats unavailable when no stagedComparison', () => {
    const { result } = renderHook(() =>
      useVerificationCharts(makeOptions({ stagedComparison: null }))
    );
    const stats = result.current.charts.find(c => c.id === 'stats')!;
    expect(stats.available).toBe(false);
  });

  it('ichart unavailable when no stagedStats', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions({ stagedStats: null })));
    const ichart = result.current.charts.find(c => c.id === 'ichart')!;
    expect(ichart.available).toBe(false);
  });

  it('boxplot unavailable when no factors', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions({ factors: [] })));
    const boxplot = result.current.charts.find(c => c.id === 'boxplot')!;
    expect(boxplot.available).toBe(false);
  });

  it('boxplot unavailable when no stageColumn', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions({ stageColumn: null })));
    const boxplot = result.current.charts.find(c => c.id === 'boxplot')!;
    expect(boxplot.available).toBe(false);
  });

  it('histogram unavailable when no specs', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions({ specs: {} })));
    const histogram = result.current.charts.find(c => c.id === 'histogram')!;
    expect(histogram.available).toBe(false);
  });

  it('hasAnyAvailable false when nothing available', () => {
    const { result } = renderHook(() =>
      useVerificationCharts(
        makeOptions({
          stagedComparison: null,
          stagedStats: null,
          factors: [],
          specs: {},
          stageColumn: null,
          comparisonData: null,
        })
      )
    );
    expect(result.current.hasAnyAvailable).toBe(false);
    expect(result.current.activeCharts.size).toBe(0);
  });

  it('all chips can be toggled off independently', () => {
    const { result } = renderHook(() => useVerificationCharts(makeOptions()));
    const ids = result.current.charts.map(c => c.id);

    // Toggle all off
    for (const id of ids) {
      act(() => result.current.toggleChart(id));
    }
    expect(result.current.activeCharts.size).toBe(0);
  });
});
