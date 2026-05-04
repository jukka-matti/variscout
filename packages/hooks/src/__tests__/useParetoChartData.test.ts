/**
 * Tests for useParetoChartData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useParetoChartData } from '../useParetoChartData';
import type { ComputeParetoYContext } from '@variscout/core/pareto';

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

  describe('allSingleRow', () => {
    const SINGLE_ROW_DATA = [
      { Defect: 'Scratch', Count: 45 },
      { Defect: 'Dent', Count: 30 },
      { Defect: 'Stain', Count: 15 },
    ];

    it('returns true when count mode and every category has exactly 1 row', () => {
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: SINGLE_ROW_DATA,
          filteredData: SINGLE_ROW_DATA,
          factor: 'Defect',
          outcome: 'Count',
          aggregation: 'count',
          showComparison: false,
          paretoMode: null,
          separateParetoData: null,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      expect(result.current.allSingleRow).toBe(true);
    });

    it('returns false when any category has more than 1 row', () => {
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

      // Machine A has 3 rows, B has 2, C has 1
      expect(result.current.allSingleRow).toBe(false);
    });

    it('returns false when in value mode', () => {
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: SINGLE_ROW_DATA,
          filteredData: SINGLE_ROW_DATA,
          factor: 'Defect',
          outcome: 'Count',
          aggregation: 'value',
          showComparison: false,
          paretoMode: null,
          separateParetoData: null,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      expect(result.current.allSingleRow).toBe(false);
    });

    it('returns false when using separate data', () => {
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: SINGLE_ROW_DATA,
          filteredData: SINGLE_ROW_DATA,
          factor: 'Defect',
          outcome: 'Count',
          aggregation: 'count',
          showComparison: false,
          paretoMode: 'separate',
          separateParetoData: SEPARATE_PARETO,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      expect(result.current.allSingleRow).toBe(false);
    });

    it('returns false when fewer than 2 categories', () => {
      const singleCategory = [{ Defect: 'Scratch', Count: 45 }];
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: singleCategory,
          filteredData: singleCategory,
          factor: 'Defect',
          outcome: 'Count',
          aggregation: 'count',
          showComparison: false,
          paretoMode: null,
          separateParetoData: null,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      expect(result.current.allSingleRow).toBe(false);
    });
  });

  describe('yMetric dispatch', () => {
    // Fixture: 4 rows — A has cost 10+20=30, B has cost 30+40=70
    const COST_DATA = [
      { Machine: 'A', Cost: 10 },
      { Machine: 'A', Cost: 20 },
      { Machine: 'B', Cost: 30 },
      { Machine: 'B', Cost: 40 },
    ];

    // Fixture for percent-out-of-spec: LSL=5, USL=25
    // A rows: 10 (in), 20 (in), 30 (out) → 1/3 ≈ 33.33%
    // B rows: 3 (out), 15 (in) → 1/2 = 50%
    const SPEC_DATA = [
      { Group: 'A', Measure: 10 },
      { Group: 'A', Measure: 20 },
      { Group: 'A', Measure: 30 },
      { Group: 'B', Measure: 3 },
      { Group: 'B', Measure: 15 },
    ];

    // Fixture for cpk: group A rows give low Cpk, group B rows give high Cpk
    // A rows: 1, 2, 3, 4, 5 — mean=3, σ≈1.581 → Cpk=(25-3)/(3*1.581)≈4.64 for wide spec
    // Use tight spec: LSL=2, USL=4 → CPU=(4-3)/(4.743)≈0.211, CPL=(3-2)/(4.743)≈0.211 → Cpk≈0.211
    // B rows: 9,10,11 — mean=10, σ=1 → CPU=(20-10)/3=3.33, CPL=(10-5)/3=1.67 → Cpk=1.67
    const CPK_DATA = [
      { Group: 'A', Value: 1 },
      { Group: 'A', Value: 2 },
      { Group: 'A', Value: 3 },
      { Group: 'A', Value: 4 },
      { Group: 'A', Value: 5 },
      { Group: 'B', Value: 9 },
      { Group: 'B', Value: 10 },
      { Group: 'B', Value: 11 },
    ];

    it('yMetric: count behaves identically to legacy aggregation: count', () => {
      const { result: legacyResult } = renderHook(() =>
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

      const { result: yMetricResult } = renderHook(() =>
        useParetoChartData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          factor: 'Machine',
          outcome: 'Weight',
          aggregation: 'count',
          yMetric: 'count',
          showComparison: false,
          paretoMode: null,
          separateParetoData: null,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      // Both should produce the same sorted keys and values
      expect(yMetricResult.current.data.map(d => d.key)).toEqual(
        legacyResult.current.data.map(d => d.key)
      );
      expect(yMetricResult.current.data.map(d => d.value)).toEqual(
        legacyResult.current.data.map(d => d.value)
      );
      expect(yMetricResult.current.totalCount).toBe(legacyResult.current.totalCount);
    });

    it('yMetric: cost dispatches to computeParetoY with costColumn', () => {
      const yMetricContext: ComputeParetoYContext = { costColumn: 'Cost' };
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: COST_DATA,
          filteredData: COST_DATA,
          factor: 'Machine',
          outcome: null,
          aggregation: 'count',
          yMetric: 'cost',
          yMetricContext,
          showComparison: false,
          paretoMode: null,
          separateParetoData: null,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      // B: 30+40=70, A: 10+20=30 → descending: B first
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].key).toBe('B');
      expect(result.current.data[0].value).toBeCloseTo(70, 5);
      expect(result.current.data[1].key).toBe('A');
      expect(result.current.data[1].value).toBeCloseTo(30, 5);
      expect(result.current.totalCount).toBeCloseTo(100, 5);
    });

    it('yMetric: percent-out-of-spec computes per-group percentages', () => {
      const yMetricContext: ComputeParetoYContext = {
        outcomeColumn: 'Measure',
        spec: { lsl: 5, usl: 25 },
      };
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: SPEC_DATA,
          filteredData: SPEC_DATA,
          factor: 'Group',
          outcome: null,
          aggregation: 'count',
          yMetric: 'percent-out-of-spec',
          yMetricContext,
          showComparison: false,
          paretoMode: null,
          separateParetoData: null,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      // B: 1/2=50% out, A: 1/3≈33.33% out → descending: B first
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].key).toBe('B');
      expect(result.current.data[0].value).toBeCloseTo(50, 2);
      expect(result.current.data[1].key).toBe('A');
      expect(result.current.data[1].value).toBeCloseTo(33.33, 1);
    });

    it('yMetric: cpk sorts ascending (smallerIsWorse) — worst group first', () => {
      const yMetricContext: ComputeParetoYContext = {
        outcomeColumn: 'Value',
        spec: { lsl: 2, usl: 20 },
      };
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: CPK_DATA,
          filteredData: CPK_DATA,
          factor: 'Group',
          outcome: null,
          aggregation: 'count',
          yMetric: 'cpk',
          yMetricContext,
          showComparison: false,
          paretoMode: null,
          separateParetoData: null,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      // Group A has lower Cpk (tight spec relative to spread) → should appear first
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].key).toBe('A');
      // Group B should have a higher Cpk and appear second
      expect(result.current.data[1].key).toBe('B');
      // Ascending sort: data[0].value <= data[1].value
      expect(result.current.data[0].value).toBeLessThanOrEqual(result.current.data[1].value);
    });

    it('yMetric: missing context throws and propagates from computeParetoY', () => {
      // Pass yMetric: 'cost' without costColumn in context → computeParetoY throws
      expect(() =>
        renderHook(() =>
          useParetoChartData({
            rawData: COST_DATA,
            filteredData: COST_DATA,
            factor: 'Machine',
            outcome: null,
            aggregation: 'count',
            yMetric: 'cost',
            yMetricContext: {},
            showComparison: false,
            paretoMode: null,
            separateParetoData: null,
            filters: NO_FILTERS,
            parentWidth: 800,
          })
        )
      ).toThrow('computeParetoY: missing context.costColumn for metric "cost"');
    });

    it('usingSeparateData: true + yMetric provided → falls through to separate-data branch (yMetric ignored)', () => {
      const yMetricContext: ComputeParetoYContext = { costColumn: 'Cost' };
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: COST_DATA,
          filteredData: COST_DATA,
          factor: 'Machine',
          outcome: null,
          aggregation: 'count',
          yMetric: 'cost',
          yMetricContext,
          showComparison: false,
          paretoMode: 'separate',
          separateParetoData: SEPARATE_PARETO,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      // Should use SEPARATE_PARETO data, not the yMetric dispatch
      expect(result.current.usingSeparateData).toBe(true);
      expect(result.current.data[0].key).toBe('Defect X');
      expect(result.current.data[0].value).toBe(50);
      expect(result.current.totalCount).toBe(100);
    });

    it('yMetric: undefined + aggregation: value → legacy value path still works', () => {
      const { result } = renderHook(() =>
        useParetoChartData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          factor: 'Machine',
          outcome: 'Weight',
          aggregation: 'value',
          yMetric: undefined,
          showComparison: false,
          paretoMode: null,
          separateParetoData: null,
          filters: NO_FILTERS,
          parentWidth: 800,
        })
      );

      // Legacy value path: sum of Weight per group
      // B: 40+50=90, A: 10+20+30=60, C: 60 → B first
      expect(result.current.data[0].key).toBe('B');
      expect(result.current.data[0].value).toBe(90);
      expect(result.current.totalCount).toBe(210);
    });
  });
});
