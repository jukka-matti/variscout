/**
 * Tests for useYamazumiIChartData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useYamazumiIChartData } from '../useYamazumiIChartData';
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

describe('useYamazumiIChartData', () => {
  it('returns [] when mapping is null', () => {
    const { result } = renderHook(() =>
      useYamazumiIChartData({ filteredData: testData, mapping: null, metric: 'total' })
    );
    expect(result.current).toEqual([]);
  });

  it('total metric includes all activity times', () => {
    const { result } = renderHook(() =>
      useYamazumiIChartData({ filteredData: testData, mapping, metric: 'total' })
    );

    const points = result.current;
    expect(points).toHaveLength(2);

    // Pick: VA(30) + Waste(15) = 45
    const pick = points.find(p => p.stage === 'Pick');
    expect(pick).toBeDefined();
    expect(pick!.y).toBe(45);

    // Pack: VA(20) + NVA-Required(10) = 30
    const pack = points.find(p => p.stage === 'Pack');
    expect(pack).toBeDefined();
    expect(pack!.y).toBe(30);
  });

  it('va metric only includes VA times', () => {
    const { result } = renderHook(() =>
      useYamazumiIChartData({ filteredData: testData, mapping, metric: 'va' })
    );

    const points = result.current;
    expect(points).toHaveLength(2);

    // Pick: only VA=30
    const pick = points.find(p => p.stage === 'Pick');
    expect(pick).toBeDefined();
    expect(pick!.y).toBe(30);

    // Pack: only VA=20
    const pack = points.find(p => p.stage === 'Pack');
    expect(pack).toBeDefined();
    expect(pack!.y).toBe(20);
  });

  it('waste metric only includes waste times', () => {
    const { result } = renderHook(() =>
      useYamazumiIChartData({ filteredData: testData, mapping, metric: 'waste' })
    );

    const points = result.current;
    // Only Pick has waste (15), Pack has no waste rows
    expect(points).toHaveLength(1);
    expect(points[0].stage).toBe('Pick');
    expect(points[0].y).toBe(15);
  });

  it('wait metric only includes wait times', () => {
    const { result } = renderHook(() =>
      useYamazumiIChartData({ filteredData: testData, mapping, metric: 'wait' })
    );

    // No wait activities in test data
    expect(result.current).toEqual([]);
  });

  it('assigns sequential x coordinates and originalIndex', () => {
    const { result } = renderHook(() =>
      useYamazumiIChartData({ filteredData: testData, mapping, metric: 'total' })
    );

    const points = result.current;
    expect(points[0].x).toBe(0);
    expect(points[0].originalIndex).toBe(0);
    expect(points[1].x).toBe(1);
    expect(points[1].originalIndex).toBe(1);
  });

  it('nva metric only includes NVA-Required times', () => {
    const { result } = renderHook(() =>
      useYamazumiIChartData({ filteredData: testData, mapping, metric: 'nva' })
    );

    const points = result.current;
    // Only Pack has NVA-Required (10)
    expect(points).toHaveLength(1);
    expect(points[0].stage).toBe('Pack');
    expect(points[0].y).toBe(10);
  });
});
