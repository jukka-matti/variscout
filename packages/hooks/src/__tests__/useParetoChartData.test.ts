/**
 * Tests for useParetoChartData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useParetoChartData } from '../useParetoChartData';

const RAW_DATA = [
  { Machine: 'A', Weight: 10 },
  { Machine: 'A', Weight: 20 },
  { Machine: 'A', Weight: 30 },
  { Machine: 'B', Weight: 40 },
  { Machine: 'B', Weight: 50 },
  { Machine: 'C', Weight: 60 },
];

const FILTERED_DATA = [
  { Machine: 'A', Weight: 10 },
  { Machine: 'A', Weight: 20 },
  { Machine: 'B', Weight: 40 },
];

const NO_FILTERS: Record<string, (string | number)[]> = {};
const WITH_FILTERS: Record<string, (string | number)[]> = { Machine: ['A'] };

const SEPARATE_PARETO = [
  { category: 'Defect X', count: 50, value: 500 },
  { category: 'Defect Y', count: 30, value: 300 },
  { category: 'Defect Z', count: 20, value: 200 },
];

describe('useParetoChartData', () => {
  it('computes count-based Pareto data sorted descending', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: RAW_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );

    expect(result.current.data).toHaveLength(3);
    // A has 3, B has 2, C has 1 → sorted by count desc
    expect(result.current.data[0].key).toBe('A');
    expect(result.current.data[0].value).toBe(3);
    expect(result.current.data[1].key).toBe('B');
    expect(result.current.data[1].value).toBe(2);
    expect(result.current.data[2].key).toBe('C');
    expect(result.current.data[2].value).toBe(1);
    expect(result.current.totalCount).toBe(6);
  });

  it('computes value-based Pareto data (sum of outcome)', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: RAW_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'value',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );

    // B: 40+50=90, C: 60, A: 10+20+30=60 → sorted desc: B(90), then A or C(60)
    expect(result.current.data[0].key).toBe('B');
    expect(result.current.data[0].value).toBe(90);
    expect(result.current.totalCount).toBe(210);
  });

  it('computes cumulative percentages correctly', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: RAW_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );

    // Last entry should have cumulativePercentage = 100
    const last = result.current.data[result.current.data.length - 1];
    expect(last.cumulativePercentage).toBeCloseTo(100, 5);
  });

  it('returns empty data for empty filteredData', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: [],
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );

    expect(result.current.data).toHaveLength(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('uses separate Pareto data when paretoMode is separate', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: RAW_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: false,
        paretoMode: 'separate',
        separateParetoData: SEPARATE_PARETO,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );

    expect(result.current.usingSeparateData).toBe(true);
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0].key).toBe('Defect X');
    expect(result.current.data[0].value).toBe(50);
    expect(result.current.totalCount).toBe(100);
  });

  it('computes comparisonData when showComparison and filters active', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: FILTERED_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: true,
        paretoMode: null,
        separateParetoData: null,
        filters: WITH_FILTERS,
        parentWidth: 800,
      })
    );

    expect(result.current.comparisonData).toBeDefined();
    // Full population: A=3/6=50%, B=2/6=33.3%, C=1/6=16.7%
    expect(result.current.comparisonData!.get('A')).toBeCloseTo(50, 0);
    expect(result.current.comparisonData!.get('B')).toBeCloseTo(33.3, 0);
  });

  it('returns undefined comparisonData when showComparison is false', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: FILTERED_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: WITH_FILTERS,
        parentWidth: 800,
      })
    );

    expect(result.current.comparisonData).toBeUndefined();
    expect(result.current.ghostBarData).toBeUndefined();
  });

  it('computes ghostBarData from comparisonData', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: FILTERED_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: true,
        paretoMode: null,
        separateParetoData: null,
        filters: WITH_FILTERS,
        parentWidth: 800,
      })
    );

    expect(result.current.ghostBarData).toBeDefined();
    // ghostBarData scales comparison percentages to filtered total
    const filteredTotal = result.current.totalCount;
    const aExpected = (filteredTotal * 50) / 100; // 50% of filtered total
    expect(result.current.ghostBarData!.get('A')).toBeCloseTo(aExpected, 1);
  });

  it('computes categoryPositions for annotation layer', () => {
    const { result } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: RAW_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );

    expect(result.current.categoryPositions.size).toBe(3);
    expect(result.current.categoryPositions.has('A')).toBe(true);
    expect(result.current.categoryPositions.has('B')).toBe(true);
    expect(result.current.categoryPositions.has('C')).toBe(true);
  });

  it('returns hasActiveFilters correctly', () => {
    const { result: noFilters } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: RAW_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: NO_FILTERS,
        parentWidth: 800,
      })
    );
    expect(noFilters.current.hasActiveFilters).toBe(false);

    const { result: withFilters } = renderHook(() =>
      useParetoChartData({
        rawData: RAW_DATA,
        filteredData: FILTERED_DATA,
        factor: 'Machine',
        outcome: 'Weight',
        aggregation: 'count',
        showComparison: false,
        paretoMode: null,
        separateParetoData: null,
        filters: WITH_FILTERS,
        parentWidth: 800,
      })
    );
    expect(withFilters.current.hasActiveFilters).toBe(true);
  });
});
