/**
 * Tests for useYamazumiParetoData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useYamazumiParetoData } from '../useYamazumiParetoData';
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

describe('useYamazumiParetoData', () => {
  it('returns empty when mapping is null', () => {
    const { result } = renderHook(() =>
      useYamazumiParetoData({ filteredData: testData, mapping: null, mode: 'steps-total' })
    );
    expect(result.current.data).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('steps-total mode: aggregates all time by step, sorted descending', () => {
    const { result } = renderHook(() =>
      useYamazumiParetoData({ filteredData: testData, mapping, mode: 'steps-total' })
    );

    const { data, totalCount } = result.current;
    expect(data).toHaveLength(2);
    expect(totalCount).toBe(75); // 30+15+20+10

    // Pick (45) should come first (descending)
    expect(data[0].key).toBe('Pick');
    expect(data[0].value).toBe(45);

    // Pack (30) second
    expect(data[1].key).toBe('Pack');
    expect(data[1].value).toBe(30);
  });

  it('steps-waste mode: only includes waste time', () => {
    const { result } = renderHook(() =>
      useYamazumiParetoData({ filteredData: testData, mapping, mode: 'steps-waste' })
    );

    const { data, totalCount } = result.current;
    // Only Pick has waste (15)
    expect(data).toHaveLength(1);
    expect(data[0].key).toBe('Pick');
    expect(data[0].value).toBe(15);
    expect(totalCount).toBe(15);
  });

  it('activities mode: aggregates by activity column', () => {
    const { result } = renderHook(() =>
      useYamazumiParetoData({ filteredData: testData, mapping, mode: 'activities' })
    );

    const { data } = result.current;
    // 4 distinct activities: Get tool(30), Box item(20), Walk(15), Label(10)
    expect(data).toHaveLength(4);

    // Sorted descending by value
    expect(data[0].key).toBe('Get tool');
    expect(data[0].value).toBe(30);

    expect(data[1].key).toBe('Box item');
    expect(data[1].value).toBe(20);

    expect(data[2].key).toBe('Walk');
    expect(data[2].value).toBe(15);

    expect(data[3].key).toBe('Label');
    expect(data[3].value).toBe(10);
  });

  it('reasons mode: only waste rows with reason text', () => {
    const { result } = renderHook(() =>
      useYamazumiParetoData({ filteredData: testData, mapping, mode: 'reasons' })
    );

    const { data, totalCount } = result.current;
    // Only 1 waste row with non-empty reason: "Poor layout" (15)
    expect(data).toHaveLength(1);
    expect(data[0].key).toBe('Poor layout');
    expect(data[0].value).toBe(15);
    expect(totalCount).toBe(15);
  });

  it('cumulative percentages are calculated correctly', () => {
    const { result } = renderHook(() =>
      useYamazumiParetoData({ filteredData: testData, mapping, mode: 'steps-total' })
    );

    const { data } = result.current;

    // Pick: 45/75 = 60%
    expect(data[0].cumulative).toBe(45);
    expect(data[0].cumulativePercentage).toBeCloseTo(60, 1);

    // Pack: (45+30)/75 = 100%
    expect(data[1].cumulative).toBe(75);
    expect(data[1].cumulativePercentage).toBeCloseTo(100, 1);
  });

  it('steps-nva mode: only includes NVA-Required time', () => {
    const { result } = renderHook(() =>
      useYamazumiParetoData({ filteredData: testData, mapping, mode: 'steps-nva' })
    );

    const { data, totalCount } = result.current;
    // Only Pack has NVA-Required (10)
    expect(data).toHaveLength(1);
    expect(data[0].key).toBe('Pack');
    expect(data[0].value).toBe(10);
    expect(totalCount).toBe(10);
  });
});
