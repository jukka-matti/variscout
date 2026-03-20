/**
 * Tests for useYamazumiChartData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useYamazumiChartData } from '../useYamazumiChartData';
import type { YamazumiColumnMapping } from '@variscout/core';

const testData = [
  { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 30, Activity: 'Get tool', Reason: '' },
  { Step: 'Pick', Activity_Type: 'Waste', Cycle_Time: 15, Activity: 'Walk', Reason: 'Poor layout' },
  { Step: 'Pack', Activity_Type: 'VA', Cycle_Time: 20, Activity: 'Box item', Reason: '' },
  { Step: 'Pack', Activity_Type: 'NVA-Required', Cycle_Time: 10, Activity: 'Label', Reason: '' },
];

const mapping: YamazumiColumnMapping = {
  stepColumn: 'Step',
  activityTypeColumn: 'Activity_Type',
  cycleTimeColumn: 'Cycle_Time',
  activityColumn: 'Activity',
  reasonColumn: 'Reason',
};

const EMPTY_DATA: Record<string, unknown>[] = [];

describe('useYamazumiChartData', () => {
  it('returns [] when mapping is null', () => {
    const { result } = renderHook(() =>
      useYamazumiChartData({ filteredData: testData, mapping: null })
    );
    expect(result.current).toEqual([]);
  });

  it('returns [] for empty data', () => {
    const { result } = renderHook(() =>
      useYamazumiChartData({ filteredData: EMPTY_DATA, mapping })
    );
    expect(result.current).toEqual([]);
  });

  it('returns correct bar data for basic input', () => {
    const { result } = renderHook(() => useYamazumiChartData({ filteredData: testData, mapping }));

    const bars = result.current;
    expect(bars).toHaveLength(2);

    // First bar: Pick (VA=30, Waste=15 => total=45)
    const pick = bars.find(b => b.key === 'Pick');
    expect(pick).toBeDefined();
    expect(pick!.totalTime).toBe(45);
    expect(pick!.segments).toHaveLength(2);

    const pickVA = pick!.segments.find(s => s.activityType === 'va');
    expect(pickVA).toBeDefined();
    expect(pickVA!.totalTime).toBe(30);

    const pickWaste = pick!.segments.find(s => s.activityType === 'waste');
    expect(pickWaste).toBeDefined();
    expect(pickWaste!.totalTime).toBe(15);

    // Second bar: Pack (VA=20, NVA-Required=10 => total=30)
    const pack = bars.find(b => b.key === 'Pack');
    expect(pack).toBeDefined();
    expect(pack!.totalTime).toBe(30);
    expect(pack!.segments).toHaveLength(2);

    const packVA = pack!.segments.find(s => s.activityType === 'va');
    expect(packVA).toBeDefined();
    expect(packVA!.totalTime).toBe(20);

    const packNVA = pack!.segments.find(s => s.activityType === 'nva-required');
    expect(packNVA).toBeDefined();
    expect(packNVA!.totalTime).toBe(10);
  });

  it('computes correct percentages per segment', () => {
    const { result } = renderHook(() => useYamazumiChartData({ filteredData: testData, mapping }));

    const pick = result.current.find(b => b.key === 'Pick')!;
    const pickVA = pick.segments.find(s => s.activityType === 'va')!;
    // 30 / 45 = 0.6667
    expect(pickVA.percentage).toBeCloseTo(30 / 45, 4);

    const pickWaste = pick.segments.find(s => s.activityType === 'waste')!;
    // 15 / 45 = 0.3333
    expect(pickWaste.percentage).toBeCloseTo(15 / 45, 4);
  });
});
