/**
 * Tests for useDataComputation hook - edge cases for derived data computations
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataComputation } from '../useDataComputation';
import type { DataComputationInputs } from '../useDataComputation';
import type { DataRow, SpecLimits, StageOrderMode } from '@variscout/core';

function makeInputs(overrides: Partial<DataComputationInputs> = {}): DataComputationInputs {
  return {
    rawData: [],
    filteredData: [],
    outcome: null,
    specs: {},
    measureSpecs: {},
    stageColumn: null,
    stageOrderMode: 'auto' as StageOrderMode,
    displayOptions: { lockYAxisToFullData: false },
    isPerformanceMode: false,
    measureColumns: [],
    ...overrides,
  };
}

function makeRows(values: number[], outcome = 'value'): DataRow[] {
  return values.map(v => ({ [outcome]: v }));
}

describe('useDataComputation', () => {
  // 1. NaN values in rawData: stats computed for valid values only
  it('filters NaN values from data before computing stats', () => {
    const data = makeRows([10, NaN, 20, NaN, 30]);
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      outcome: 'value',
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.stats).not.toBeNull();
    // Only the 3 valid values (10, 20, 30) contribute; NaN rows are filtered
    expect(result.current.stats!.mean).toBeCloseTo(20, 5);
    // stdDev should be based on 3 values, not 5
    expect(result.current.stats!.stdDev).toBeCloseTo(10, 0);
  });

  // 2. Empty measureColumns + performanceMode: performanceResult=null
  it('returns null performanceResult when performanceMode=true but measureColumns is empty', () => {
    const data = makeRows([10, 20, 30]);
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      outcome: 'value',
      isPerformanceMode: true,
      measureColumns: [],
      specs: { usl: 50, lsl: 0 },
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.performanceResult).toBeNull();
  });

  // 3. Single-row stages: stagedStats computed without error
  it('computes stagedStats for stages with only 1 row each', () => {
    const data: DataRow[] = [
      { value: 10, stage: 'A' },
      { value: 20, stage: 'B' },
      { value: 30, stage: 'C' },
    ];
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      outcome: 'value',
      stageColumn: 'stage',
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.stagedStats).not.toBeNull();
    expect(result.current.stagedStats!.stageOrder.length).toBe(3);
    // Each stage should have stats (single-value: stdDev=0 or similar)
    const stageA = result.current.stagedStats!.stages.get('A');
    expect(stageA).toBeDefined();
    expect(stageA!.mean).toBeCloseTo(10, 5);
  });

  // 4. No outcome column: stats=null, fullDataYDomain=null
  it('returns null stats and null fullDataYDomain when outcome is null', () => {
    const data = makeRows([10, 20, 30]);
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      outcome: null,
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.stats).toBeNull();
    expect(result.current.fullDataYDomain).toBeNull();
  });

  // 5. Y-domain includes spec limits wider than data range
  it('expands fullDataYDomain to include spec limits beyond data range', () => {
    const data = makeRows([40, 50, 60]);
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      outcome: 'value',
      specs: { usl: 100, lsl: 0 },
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.fullDataYDomain).not.toBeNull();
    // Range should be 0-100 (from specs), plus 10% padding = (100-0)*0.1 = 10
    // min: 0 - 10 = -10, max: 100 + 10 = 110
    expect(result.current.fullDataYDomain!.min).toBeCloseTo(-10, 5);
    expect(result.current.fullDataYDomain!.max).toBeCloseTo(110, 5);
  });

  // 6. Stats computed correctly for filtered data subset
  it('computes stats from filteredData, not rawData', () => {
    const rawData = makeRows([10, 20, 30, 40, 50]);
    const filteredData = makeRows([10, 20, 30]); // subset
    const inputs = makeInputs({
      rawData,
      filteredData,
      outcome: 'value',
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats!.mean).toBeCloseTo(20, 5);
    // stdDev based on 3 values [10,20,30], not 5
    expect(result.current.stats!.stdDev).toBeCloseTo(10, 0);
  });

  // 7. yDomainForCharts returns undefined when lockYAxisToFullData=false
  it('returns undefined yDomainForCharts when lockYAxisToFullData is false', () => {
    const data = makeRows([10, 20, 30]);
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      outcome: 'value',
      displayOptions: { lockYAxisToFullData: false },
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.yDomainForCharts).toBeUndefined();
    // But fullDataYDomain should still be computed
    expect(result.current.fullDataYDomain).not.toBeNull();
  });

  // 7b. yDomainForCharts returns domain when lockYAxisToFullData=true
  it('returns fullDataYDomain as yDomainForCharts when lockYAxisToFullData is true', () => {
    const data = makeRows([10, 20, 30]);
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      outcome: 'value',
      displayOptions: { lockYAxisToFullData: true },
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.yDomainForCharts).toBeDefined();
    expect(result.current.yDomainForCharts).toEqual(result.current.fullDataYDomain);
  });

  // 8. getSpecsForMeasure returns per-measure override when defined
  it('returns per-measure specs when defined in measureSpecs', () => {
    const globalSpecs: SpecLimits = { usl: 100, lsl: 0 };
    const channelSpecs: SpecLimits = { usl: 50, lsl: 10 };
    const inputs = makeInputs({
      specs: globalSpecs,
      measureSpecs: { 'channel-1': channelSpecs },
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    // Per-measure override
    const ch1Specs = result.current.getSpecsForMeasure('channel-1');
    expect(ch1Specs).toEqual(channelSpecs);

    // Falls back to global specs for unknown measure
    const ch2Specs = result.current.getSpecsForMeasure('channel-2');
    expect(ch2Specs).toEqual(globalSpecs);
  });

  // 9. performanceResult is null when specs have no USL or LSL
  it('returns null performanceResult when no spec limits defined', () => {
    const data: DataRow[] = [
      { m1: 10, m2: 20 },
      { m1: 15, m2: 25 },
    ];
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      isPerformanceMode: true,
      measureColumns: ['m1', 'm2'],
      specs: {}, // no USL/LSL
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    expect(result.current.performanceResult).toBeNull();
  });

  // 10. fullDataYDomain is null when all values are NaN
  it('returns null fullDataYDomain when all raw data values are NaN', () => {
    const data = makeRows([NaN, NaN, NaN]);
    const inputs = makeInputs({
      rawData: data,
      filteredData: data,
      outcome: 'value',
    });

    const { result } = renderHook(() => useDataComputation(inputs));

    // fullDataYDomain guards against empty valid values
    expect(result.current.fullDataYDomain).toBeNull();
    // stats: calculateStats is called with empty array (filteredData.length > 0 passes guard)
    // but all NaN values are filtered out, so stats has zero/degenerate values
    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats!.mean).toBe(0);
  });
});
