import { describe, it, expect, vi } from 'vitest';

import { computeYamazumiData, computeYamazumiSummary } from '../aggregation';
import type { YamazumiColumnMapping, YamazumiBarData } from '../types';
import type { DataRow } from '../../types';

describe('computeYamazumiData', () => {
  const activityLevelMapping: YamazumiColumnMapping = {
    stepColumn: 'Step',
    activityTypeColumn: 'Activity_Type',
    cycleTimeColumn: 'Cycle_Time',
  };

  describe('activity-level granularity', () => {
    const rows: DataRow[] = [
      { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 30 },
      { Step: 'Pick', Activity_Type: 'Waste', Cycle_Time: 15 },
      { Step: 'Pack', Activity_Type: 'VA', Cycle_Time: 20 },
      { Step: 'Pack', Activity_Type: 'NVA-Required', Cycle_Time: 10 },
    ];

    it('produces one bar per step', () => {
      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars).toHaveLength(2);
      expect(bars[0].key).toBe('Pick');
      expect(bars[1].key).toBe('Pack');
    });

    it('sums cycle times correctly per step', () => {
      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars[0].totalTime).toBe(45); // 30 + 15
      expect(bars[1].totalTime).toBe(30); // 20 + 10
    });

    it('creates correct segments for Pick', () => {
      const bars = computeYamazumiData(rows, activityLevelMapping);
      const pick = bars[0];

      const vaSeg = pick.segments.find(s => s.activityType === 'va');
      expect(vaSeg).toBeDefined();
      expect(vaSeg!.totalTime).toBe(30);
      expect(vaSeg!.count).toBe(1);
      expect(vaSeg!.percentage).toBeCloseTo(30 / 45, 5);

      const wasteSeg = pick.segments.find(s => s.activityType === 'waste');
      expect(wasteSeg).toBeDefined();
      expect(wasteSeg!.totalTime).toBe(15);
      expect(wasteSeg!.count).toBe(1);
      expect(wasteSeg!.percentage).toBeCloseTo(15 / 45, 5);
    });

    it('creates correct segments for Pack', () => {
      const bars = computeYamazumiData(rows, activityLevelMapping);
      const pack = bars[1];

      const vaSeg = pack.segments.find(s => s.activityType === 'va');
      expect(vaSeg).toBeDefined();
      expect(vaSeg!.totalTime).toBe(20);

      const nvaSeg = pack.segments.find(s => s.activityType === 'nva-required');
      expect(nvaSeg).toBeDefined();
      expect(nvaSeg!.totalTime).toBe(10);
    });

    it('orders segments by ACTIVITY_TYPE_ORDER (va, nva-required, waste, wait)', () => {
      const bars = computeYamazumiData(rows, activityLevelMapping);
      const pick = bars[0];
      // Pick has va and waste; va should come first
      expect(pick.segments[0].activityType).toBe('va');
      expect(pick.segments[1].activityType).toBe('waste');
    });
  });

  describe('step-level granularity', () => {
    it('handles single row per step', () => {
      const rows: DataRow[] = [
        { Step: 'Assemble', Activity_Type: 'VA', Cycle_Time: 50 },
        { Step: 'Inspect', Activity_Type: 'NVA-Required', Cycle_Time: 25 },
      ];

      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars).toHaveLength(2);
      expect(bars[0].key).toBe('Assemble');
      expect(bars[0].totalTime).toBe(50);
      expect(bars[1].key).toBe('Inspect');
      expect(bars[1].totalTime).toBe(25);
    });
  });

  describe('wait time from separate column', () => {
    it('adds wait time from waitTimeColumn', () => {
      const rows: DataRow[] = [
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 30, Wait_Time: 5 },
        { Step: 'Pick', Activity_Type: 'Waste', Cycle_Time: 15, Wait_Time: 3 },
        { Step: 'Pack', Activity_Type: 'VA', Cycle_Time: 20, Wait_Time: 0 },
      ];

      const mapping: YamazumiColumnMapping = {
        ...activityLevelMapping,
        waitTimeColumn: 'Wait_Time',
      };

      const bars = computeYamazumiData(rows, mapping);
      const pick = bars.find(b => b.key === 'Pick')!;
      const waitSeg = pick.segments.find(s => s.activityType === 'wait');

      expect(waitSeg).toBeDefined();
      expect(waitSeg!.totalTime).toBe(8); // 5 + 3
      // Total should include wait: 30 + 15 + 8 = 53
      expect(pick.totalTime).toBe(53);
    });

    it('ignores zero and negative wait times', () => {
      const rows: DataRow[] = [
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 30, Wait_Time: 0 },
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 10, Wait_Time: -5 },
      ];

      const mapping: YamazumiColumnMapping = {
        ...activityLevelMapping,
        waitTimeColumn: 'Wait_Time',
      };

      const bars = computeYamazumiData(rows, mapping);
      const pick = bars[0];
      const waitSeg = pick.segments.find(s => s.activityType === 'wait');
      expect(waitSeg).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty data', () => {
      const bars = computeYamazumiData([], activityLevelMapping);
      expect(bars).toEqual([]);
    });

    it('skips rows with negative cycle times', () => {
      const rows: DataRow[] = [
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 30 },
        { Step: 'Pick', Activity_Type: 'Waste', Cycle_Time: -5 },
      ];

      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars).toHaveLength(1);
      expect(bars[0].totalTime).toBe(30);
      expect(bars[0].segments).toHaveLength(1);
    });

    it('skips rows with non-numeric cycle time', () => {
      const rows: DataRow[] = [
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 'abc' },
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 10 },
      ];

      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars[0].totalTime).toBe(10);
    });

    it('skips rows with empty step name', () => {
      const rows: DataRow[] = [
        { Step: '', Activity_Type: 'VA', Cycle_Time: 30 },
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 20 },
      ];

      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars).toHaveLength(1);
      expect(bars[0].key).toBe('Pick');
    });

    it('preserves step insertion order', () => {
      const rows: DataRow[] = [
        { Step: 'Zebra', Activity_Type: 'VA', Cycle_Time: 10 },
        { Step: 'Alpha', Activity_Type: 'VA', Cycle_Time: 20 },
        { Step: 'Middle', Activity_Type: 'VA', Cycle_Time: 15 },
      ];

      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars.map(b => b.key)).toEqual(['Zebra', 'Alpha', 'Middle']);
    });

    it('classifies unknown activity types as waste with warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const rows: DataRow[] = [{ Step: 'Pick', Activity_Type: 'SomeUnknown', Cycle_Time: 10 }];

      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars[0].segments[0].activityType).toBe('waste');
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('aggregates multiple rows of the same activity type within a step', () => {
      const rows: DataRow[] = [
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 10 },
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 20 },
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 5 },
      ];

      const bars = computeYamazumiData(rows, activityLevelMapping);
      expect(bars[0].segments).toHaveLength(1);
      expect(bars[0].segments[0].totalTime).toBe(35);
      expect(bars[0].segments[0].count).toBe(3);
    });
  });
});

describe('computeYamazumiSummary', () => {
  it('computes correct summary from bar data', () => {
    const bars: YamazumiBarData[] = [
      {
        key: 'Pick',
        totalTime: 45,
        segments: [
          { activityType: 'va', totalTime: 30, percentage: 30 / 45, count: 1 },
          { activityType: 'waste', totalTime: 15, percentage: 15 / 45, count: 1 },
        ],
      },
      {
        key: 'Pack',
        totalTime: 30,
        segments: [
          { activityType: 'va', totalTime: 20, percentage: 20 / 30, count: 1 },
          { activityType: 'nva-required', totalTime: 10, percentage: 10 / 30, count: 1 },
        ],
      },
    ];

    const summary = computeYamazumiSummary(bars);

    expect(summary.vaTime).toBe(50); // 30 + 20
    expect(summary.nvaTime).toBe(10);
    expect(summary.wasteTime).toBe(15);
    expect(summary.waitTime).toBe(0);
    expect(summary.totalLeadTime).toBe(75); // 50 + 10 + 15 + 0
    expect(summary.vaRatio).toBeCloseTo(50 / 75, 5);
    // processEfficiency = VA / (VA + NVA) = 50 / 60
    expect(summary.processEfficiency).toBeCloseTo(50 / 60, 5);
    expect(summary.stepsOverTakt).toEqual([]);
    expect(summary.taktTime).toBeUndefined();
  });

  it('computes stepsOverTakt correctly', () => {
    const bars: YamazumiBarData[] = [
      {
        key: 'Pick',
        totalTime: 45,
        segments: [{ activityType: 'va', totalTime: 45, percentage: 1, count: 1 }],
      },
      {
        key: 'Pack',
        totalTime: 30,
        segments: [{ activityType: 'va', totalTime: 30, percentage: 1, count: 1 }],
      },
      {
        key: 'Ship',
        totalTime: 42,
        segments: [{ activityType: 'va', totalTime: 42, percentage: 1, count: 1 }],
      },
    ];

    const summary = computeYamazumiSummary(bars, 40);

    expect(summary.taktTime).toBe(40);
    expect(summary.stepsOverTakt).toEqual(['Pick', 'Ship']);
  });

  it('includes all activity types in summary', () => {
    const bars: YamazumiBarData[] = [
      {
        key: 'Step1',
        totalTime: 100,
        segments: [
          { activityType: 'va', totalTime: 40, percentage: 0.4, count: 1 },
          { activityType: 'nva-required', totalTime: 20, percentage: 0.2, count: 1 },
          { activityType: 'waste', totalTime: 25, percentage: 0.25, count: 1 },
          { activityType: 'wait', totalTime: 15, percentage: 0.15, count: 1 },
        ],
      },
    ];

    const summary = computeYamazumiSummary(bars);

    expect(summary.vaTime).toBe(40);
    expect(summary.nvaTime).toBe(20);
    expect(summary.wasteTime).toBe(25);
    expect(summary.waitTime).toBe(15);
    expect(summary.totalLeadTime).toBe(100);
    expect(summary.vaRatio).toBeCloseTo(0.4, 5);
    expect(summary.processEfficiency).toBeCloseTo(40 / 60, 5);
  });

  it('handles empty bars array', () => {
    const summary = computeYamazumiSummary([]);

    expect(summary.totalLeadTime).toBe(0);
    expect(summary.vaTime).toBe(0);
    expect(summary.vaRatio).toBe(0);
    expect(summary.processEfficiency).toBe(0);
    expect(summary.stepsOverTakt).toEqual([]);
  });

  it('does not flag steps when taktTime is 0', () => {
    const bars: YamazumiBarData[] = [
      {
        key: 'Step1',
        totalTime: 50,
        segments: [{ activityType: 'va', totalTime: 50, percentage: 1, count: 1 }],
      },
    ];

    const summary = computeYamazumiSummary(bars, 0);
    expect(summary.stepsOverTakt).toEqual([]);
  });

  it('handles 100% VA process', () => {
    const bars: YamazumiBarData[] = [
      {
        key: 'Step1',
        totalTime: 60,
        segments: [{ activityType: 'va', totalTime: 60, percentage: 1, count: 1 }],
      },
    ];

    const summary = computeYamazumiSummary(bars);

    expect(summary.vaRatio).toBeCloseTo(1.0, 5);
    expect(summary.processEfficiency).toBeCloseTo(1.0, 5);
  });
});
