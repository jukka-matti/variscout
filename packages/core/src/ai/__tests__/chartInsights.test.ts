import { describe, it, expect } from 'vitest';
import {
  buildIChartInsight,
  buildBoxplotInsight,
  buildParetoInsight,
  buildStatsInsight,
} from '../chartInsights';
import type { NelsonRule2Sequence, NelsonRule3Sequence } from '../../types';

describe('buildIChartInsight', () => {
  it('returns null when no violations', () => {
    expect(buildIChartInsight([], 0, 50)).toBeNull();
  });

  it('returns warning with nelson sequence info', () => {
    const sequences: NelsonRule2Sequence[] = [{ startIndex: 5, endIndex: 13, side: 'above' }];
    const result = buildIChartInsight(sequences, 0, 50);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('warning');
    expect(result!.priority).toBe(3);
    expect(result!.text).toBe('Process shift: 9 points above mean from obs. 6');
  });

  it('picks the longest nelson sequence', () => {
    const sequences: NelsonRule2Sequence[] = [
      { startIndex: 0, endIndex: 4, side: 'above' },
      { startIndex: 20, endIndex: 30, side: 'below' },
      { startIndex: 40, endIndex: 44, side: 'above' },
    ];
    const result = buildIChartInsight(sequences, 2, 50);
    expect(result).not.toBeNull();
    expect(result!.text).toContain('11 points below mean from obs. 21');
  });

  it('returns out-of-control warning when no nelson but OOC points', () => {
    const result = buildIChartInsight([], 3, 50);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('warning');
    expect(result!.priority).toBe(2);
    expect(result!.text).toBe('3 of 50 points outside control limits (6%)');
  });

  it('formats percentage correctly', () => {
    const result = buildIChartInsight([], 1, 3);
    expect(result).not.toBeNull();
    expect(result!.text).toBe('1 of 3 points outside control limits (33%)');
  });

  it('returns trend warning for Nelson Rule 3 sequences', () => {
    const rule3: NelsonRule3Sequence[] = [
      { startIndex: 10, endIndex: 17, direction: 'increasing' },
    ];
    const result = buildIChartInsight([], 0, 50, rule3);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('warning');
    expect(result!.priority).toBe(2.5);
    expect(result!.text).toBe('Trend detected: 8 consecutive increasing points from obs. 11');
  });

  it('picks the longest Rule 3 sequence', () => {
    const rule3: NelsonRule3Sequence[] = [
      { startIndex: 0, endIndex: 5, direction: 'increasing' },
      { startIndex: 20, endIndex: 29, direction: 'decreasing' },
    ];
    const result = buildIChartInsight([], 0, 50, rule3);
    expect(result).not.toBeNull();
    expect(result!.text).toContain('10 consecutive decreasing');
  });

  it('Nelson Rule 2 takes priority over Rule 3', () => {
    const rule2: NelsonRule2Sequence[] = [{ startIndex: 0, endIndex: 8, side: 'above' }];
    const rule3: NelsonRule3Sequence[] = [
      { startIndex: 10, endIndex: 17, direction: 'increasing' },
    ];
    const result = buildIChartInsight(rule2, 0, 50, rule3);
    expect(result).not.toBeNull();
    expect(result!.priority).toBe(3);
    expect(result!.text).toContain('Process shift');
  });

  it('Rule 3 takes priority over OOC points', () => {
    const rule3: NelsonRule3Sequence[] = [{ startIndex: 0, endIndex: 6, direction: 'decreasing' }];
    const result = buildIChartInsight([], 2, 50, rule3);
    expect(result).not.toBeNull();
    expect(result!.priority).toBe(2.5);
    expect(result!.text).toContain('Trend detected');
  });
});

describe('buildBoxplotInsight', () => {
  it('returns null when no variations', () => {
    const variations = new Map<string, number>();
    expect(buildBoxplotInsight(variations, 'Machine', null)).toBeNull();
  });

  it('returns drill suggestion when nextDrillFactor >= 30%', () => {
    const variations = new Map<string, number>([
      ['Machine', 20],
      ['Operator', 35],
    ]);
    const result = buildBoxplotInsight(variations, 'Machine', 'Operator');
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('suggestion');
    expect(result!.priority).toBe(3);
    expect(result!.text).toBe('→ Drill Operator (35% of variation)');
  });

  it('returns current factor info when >= 50%', () => {
    const variations = new Map<string, number>([['Machine', 55]]);
    const result = buildBoxplotInsight(variations, 'Machine', null);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('info');
    expect(result!.priority).toBe(2);
    expect(result!.text).toBe('Machine explains 55% of total variation');
  });

  it('returns null for low variation', () => {
    const variations = new Map<string, number>([
      ['Machine', 15],
      ['Operator', 10],
    ]);
    expect(buildBoxplotInsight(variations, 'Machine', 'Operator')).toBeNull();
  });

  it('prefers drill suggestion over current factor info', () => {
    const variations = new Map<string, number>([
      ['Machine', 55],
      ['Operator', 40],
    ]);
    const result = buildBoxplotInsight(variations, 'Machine', 'Operator');
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('suggestion');
    expect(result!.text).toContain('Drill Operator');
  });
});

describe('buildParetoInsight', () => {
  it('returns null for < 3 categories', () => {
    const contributions = new Map<string, number>([
      ['A', 60],
      ['B', 40],
    ]);
    expect(buildParetoInsight(contributions, 2)).toBeNull();
  });

  it('returns top 2 info when >= 60%', () => {
    const contributions = new Map<string, number>([
      ['A', 35],
      ['B', 30],
      ['C', 20],
      ['D', 15],
    ]);
    const result = buildParetoInsight(contributions, 4);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('info');
    expect(result!.priority).toBe(2);
    expect(result!.text).toBe('Top 2 of 4 categories explain 65%');
  });

  it('returns investigate suggestion when >= 80% and >= 5 categories', () => {
    const contributions = new Map<string, number>([
      ['A', 50],
      ['B', 35],
      ['C', 5],
      ['D', 5],
      ['E', 5],
    ]);
    const result = buildParetoInsight(contributions, 5);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('suggestion');
    expect(result!.priority).toBe(3);
    expect(result!.text).toBe('Top 2 of 5 categories explain 85% — investigate these first');
  });

  it('returns single dominant category info', () => {
    const contributions = new Map<string, number>([
      ['Machine A', 55],
      ['Machine B', 25],
      ['Machine C', 20],
    ]);
    const result = buildParetoInsight(contributions, 3);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('info');
    expect(result!.priority).toBe(2);
    expect(result!.text).toBe('"Machine A" accounts for 55% of variation');
  });

  it('returns null for evenly distributed', () => {
    const contributions = new Map<string, number>([
      ['A', 25],
      ['B', 25],
      ['C', 25],
      ['D', 25],
    ]);
    expect(buildParetoInsight(contributions, 4)).toBeNull();
  });
});

describe('buildStatsInsight', () => {
  it('returns null when no specs', () => {
    expect(buildStatsInsight(1.5, 1.8, 1.33, 99, false)).toBeNull();
  });

  it('returns warning for cpk below target', () => {
    const result = buildStatsInsight(0.85, 1.2, 1.33, 98, true);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('warning');
    expect(result!.priority).toBe(3);
    expect(result!.text).toBe('Cpk 0.85 — below 1.33 target');
  });

  it('returns info for cpk meeting target', () => {
    const result = buildStatsInsight(1.5, 1.8, 1.33, 99, true);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('info');
    expect(result!.priority).toBe(1);
    expect(result!.text).toBe('Cpk 1.50 meets 1.33 target');
  });

  it('returns pass rate warning', () => {
    const result = buildStatsInsight(undefined, undefined, 1.33, 88, true);
    expect(result).not.toBeNull();
    expect(result!.chipType).toBe('warning');
    expect(result!.priority).toBe(2);
    expect(result!.text).toBe('Pass rate 88% — review spec compliance');
  });

  it('returns null when everything is fine without cpk', () => {
    expect(buildStatsInsight(undefined, undefined, 1.33, 99, true)).toBeNull();
  });

  it('formats cpk with two decimal places', () => {
    const result = buildStatsInsight(1.0, 1.2, 1.33, 99, true);
    expect(result).not.toBeNull();
    expect(result!.text).toContain('Cpk 1.00');
  });
});
