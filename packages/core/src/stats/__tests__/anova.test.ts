import { describe, it, expect } from 'vitest';
import {
  calculateAnova,
  calculateAnovaFromArrays,
  getEtaSquared,
  groupDataByFactor,
} from '../anova';
import type { DataRow } from '../../types';

describe('groupDataByFactor', () => {
  it('groups numeric values by factor column', () => {
    const data = [
      { Supplier: 'A', Weight: 10 },
      { Supplier: 'A', Weight: 12 },
      { Supplier: 'B', Weight: 14 },
      { Supplier: 'B', Weight: 15 },
    ];
    const groups = groupDataByFactor(data, 'Supplier', 'Weight');
    expect(groups.get('A')).toEqual([10, 12]);
    expect(groups.get('B')).toEqual([14, 15]);
  });

  it('skips non-numeric outcome values', () => {
    const data = [
      { Supplier: 'A', Weight: 10 },
      { Supplier: 'A', Weight: 'bad' },
      { Supplier: 'B', Weight: 14 },
    ];
    const groups = groupDataByFactor(data, 'Supplier', 'Weight');
    expect(groups.get('A')).toEqual([10]);
    expect(groups.get('B')).toEqual([14]);
  });

  it('labels missing factor values as Unknown', () => {
    const data = [{ Weight: 10 }, { Supplier: null, Weight: 12 }];
    const groups = groupDataByFactor(data, 'Supplier', 'Weight');
    expect(groups.has('Unknown')).toBe(true);
    // Both undefined and null coalesce to 'Unknown' via ?? operator
    expect(groups.get('Unknown')).toEqual([10, 12]);
  });

  it('returns empty map for empty data', () => {
    const groups = groupDataByFactor([], 'Supplier', 'Weight');
    expect(groups.size).toBe(0);
  });
});

describe('getEtaSquared', () => {
  it('returns 0 when all values are the same', () => {
    const data: DataRow[] = [
      { Group: 'A', Value: 5 },
      { Group: 'B', Value: 5 },
      { Group: 'A', Value: 5 },
      { Group: 'B', Value: 5 },
    ];
    expect(getEtaSquared(data, 'Group', 'Value')).toBe(0);
  });

  it('returns 1 when all variation is between groups', () => {
    // Each group has identical values, all variation is between groups
    const data: DataRow[] = [
      { Group: 'A', Value: 10 },
      { Group: 'A', Value: 10 },
      { Group: 'B', Value: 20 },
      { Group: 'B', Value: 20 },
    ];
    expect(getEtaSquared(data, 'Group', 'Value')).toBeCloseTo(1.0, 5);
  });

  it('returns value between 0 and 1 for mixed variation', () => {
    const data: DataRow[] = [
      { Group: 'A', Value: 10 },
      { Group: 'A', Value: 12 },
      { Group: 'B', Value: 20 },
      { Group: 'B', Value: 22 },
    ];
    const eta = getEtaSquared(data, 'Group', 'Value');
    expect(eta).toBeGreaterThan(0);
    expect(eta).toBeLessThan(1);
    // Grand mean = 16, SSB = 2*(11-16)^2 + 2*(21-16)^2 = 100
    // SST = (10-16)^2 + (12-16)^2 + (20-16)^2 + (22-16)^2 = 36+16+16+36 = 104
    // eta^2 = 100/104 ≈ 0.9615
    expect(eta).toBeCloseTo(100 / 104, 4);
  });
});

describe('calculateAnova', () => {
  it('returns null for fewer than 2 groups', () => {
    const data: DataRow[] = [
      { Group: 'A', Value: 10 },
      { Group: 'A', Value: 12 },
      { Group: 'A', Value: 11 },
    ];
    expect(calculateAnova(data, 'Value', 'Group')).toBeNull();
  });

  it('returns null for fewer than 3 total observations', () => {
    const data: DataRow[] = [
      { Group: 'A', Value: 10 },
      { Group: 'B', Value: 20 },
    ];
    expect(calculateAnova(data, 'Value', 'Group')).toBeNull();
  });

  it('calculates correct ANOVA for two groups with known values', () => {
    // Group A: [2, 4, 6] mean=4, Group B: [8, 10, 12] mean=10
    // Grand mean = 7, N=6, k=2
    // SSB = 3*(4-7)^2 + 3*(10-7)^2 = 27+27 = 54
    // SSW = (2-4)^2+(4-4)^2+(6-4)^2 + (8-10)^2+(10-10)^2+(12-10)^2 = 4+0+4+4+0+4 = 16
    // dfBetween=1, dfWithin=4
    // MSB=54, MSW=4, F=13.5
    const data: DataRow[] = [
      { Group: 'A', Value: 2 },
      { Group: 'A', Value: 4 },
      { Group: 'A', Value: 6 },
      { Group: 'B', Value: 8 },
      { Group: 'B', Value: 10 },
      { Group: 'B', Value: 12 },
    ];
    const result = calculateAnova(data, 'Value', 'Group');
    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(2);
    expect(result!.dfBetween).toBe(1);
    expect(result!.dfWithin).toBe(4);
    expect(result!.ssb).toBeCloseTo(54, 4);
    expect(result!.ssw).toBeCloseTo(16, 4);
    expect(result!.msb).toBeCloseTo(54, 4);
    expect(result!.msw).toBeCloseTo(4, 4);
    expect(result!.fStatistic).toBeCloseTo(13.5, 4);
    expect(result!.pValue).toBeGreaterThan(0);
    expect(result!.pValue).toBeLessThan(1);
    expect(result!.etaSquared).toBeCloseTo(54 / 70, 4);
  });

  it('calculates correct ANOVA for three groups', () => {
    // Group A: [1, 2, 3] mean=2
    // Group B: [4, 5, 6] mean=5
    // Group C: [7, 8, 9] mean=8
    // Grand mean = 5, N=9, k=3
    // SSB = 3*(2-5)^2 + 3*(5-5)^2 + 3*(8-5)^2 = 27+0+27 = 54
    // SSW = sum of (x-group_mean)^2 = 3*(1+0+1) = 6 per group => 6+6+6 = 18... wait
    // Actually: each group has variance 1, so SSW = (3-1)*1 * 3 = 6
    // No: stdDev of [1,2,3] = 1, so var = 1, SSW per group = (n-1)*var = 2*1 = 2
    // Total SSW = 2+2+2 = 6
    const data: DataRow[] = [
      { Group: 'A', Value: 1 },
      { Group: 'A', Value: 2 },
      { Group: 'A', Value: 3 },
      { Group: 'B', Value: 4 },
      { Group: 'B', Value: 5 },
      { Group: 'B', Value: 6 },
      { Group: 'C', Value: 7 },
      { Group: 'C', Value: 8 },
      { Group: 'C', Value: 9 },
    ];
    const result = calculateAnova(data, 'Value', 'Group');
    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(3);
    expect(result!.dfBetween).toBe(2);
    expect(result!.dfWithin).toBe(6);
    expect(result!.ssb).toBeCloseTo(54, 4);
    expect(result!.ssw).toBeCloseTo(6, 4);
    expect(result!.fStatistic).toBeCloseTo(27, 4);
    expect(result!.isSignificant).toBe(true);
    expect(result!.etaSquared).toBeCloseTo(54 / 60, 4);
  });

  it('detects non-significant result for overlapping groups', () => {
    // Nearly identical groups — should not be significant
    const data: DataRow[] = [
      { Group: 'A', Value: 10.0 },
      { Group: 'A', Value: 10.1 },
      { Group: 'A', Value: 9.9 },
      { Group: 'B', Value: 10.0 },
      { Group: 'B', Value: 10.2 },
      { Group: 'B', Value: 9.8 },
    ];
    const result = calculateAnova(data, 'Value', 'Group');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(false);
    expect(result!.pValue).toBeGreaterThan(0.05);
  });

  it('generates insight text', () => {
    const data: DataRow[] = [
      { Group: 'A', Value: 1 },
      { Group: 'A', Value: 2 },
      { Group: 'A', Value: 3 },
      { Group: 'B', Value: 10 },
      { Group: 'B', Value: 11 },
      { Group: 'B', Value: 12 },
    ];
    const result = calculateAnova(data, 'Value', 'Group');
    expect(result).not.toBeNull();
    expect(result!.insight).toBeTruthy();
    expect(typeof result!.insight).toBe('string');
  });

  it('returns group statistics with correct names and counts', () => {
    const data: DataRow[] = [
      { Shift: 'Day', Time: 10 },
      { Shift: 'Day', Time: 12 },
      { Shift: 'Day', Time: 11 },
      { Shift: 'Night', Time: 15 },
      { Shift: 'Night', Time: 14 },
      { Shift: 'Night', Time: 16 },
    ];
    const result = calculateAnova(data, 'Time', 'Shift');
    expect(result).not.toBeNull();
    const dayGroup = result!.groups.find(g => g.name === 'Day');
    const nightGroup = result!.groups.find(g => g.name === 'Night');
    expect(dayGroup).toBeDefined();
    expect(dayGroup!.n).toBe(3);
    expect(dayGroup!.mean).toBeCloseTo(11, 4);
    expect(nightGroup).toBeDefined();
    expect(nightGroup!.n).toBe(3);
    expect(nightGroup!.mean).toBeCloseTo(15, 4);
  });
});

describe('calculateAnovaFromArrays', () => {
  it('produces identical results to calculateAnova', () => {
    const data: DataRow[] = [
      { Group: 'A', Value: 2 },
      { Group: 'A', Value: 4 },
      { Group: 'A', Value: 6 },
      { Group: 'B', Value: 8 },
      { Group: 'B', Value: 10 },
      { Group: 'B', Value: 12 },
    ];
    const fromDataRow = calculateAnova(data, 'Value', 'Group');
    const fromArrays = calculateAnovaFromArrays(
      ['A', 'A', 'A', 'B', 'B', 'B'],
      [2, 4, 6, 8, 10, 12],
      'Value'
    );
    expect(fromArrays).not.toBeNull();
    expect(fromArrays!.fStatistic).toBeCloseTo(fromDataRow!.fStatistic, 8);
    expect(fromArrays!.pValue).toBeCloseTo(fromDataRow!.pValue, 8);
    expect(fromArrays!.etaSquared).toBeCloseTo(fromDataRow!.etaSquared, 8);
    expect(fromArrays!.ssb).toBeCloseTo(fromDataRow!.ssb, 8);
    expect(fromArrays!.ssw).toBeCloseTo(fromDataRow!.ssw, 8);
  });

  it('returns null for single group', () => {
    const result = calculateAnovaFromArrays(['A', 'A', 'A'], [1, 2, 3]);
    expect(result).toBeNull();
  });

  it('skips NaN outcome values', () => {
    const result = calculateAnovaFromArrays(['A', 'A', 'A', 'B', 'B', 'B'], [2, NaN, 6, 8, 10, 12]);
    expect(result).not.toBeNull();
    // Group A should have only 2 values [2, 6]
    const groupA = result!.groups.find(g => g.name === 'A');
    expect(groupA!.n).toBe(2);
  });
});
