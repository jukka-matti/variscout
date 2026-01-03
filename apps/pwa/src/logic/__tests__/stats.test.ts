import { describe, it, expect } from 'vitest';
import { calculateStats, calculateAnova } from '@variscout/core';

describe('Stats Engine', () => {
  it('should calculate basic stats for a normal distribution', () => {
    // Simple dataset: 10, 12, 11, 13, 10
    // Mean: 11.2, StdDev: ~1.303
    const data = [10, 12, 11, 13, 10];
    const stats = calculateStats(data);

    expect(stats.mean).toBeCloseTo(11.2, 1);
    expect(stats.stdDev).toBeCloseTo(1.3, 2);
    expect(stats.ucl).toBeCloseTo(11.2 + 3 * 1.3038, 1);
    expect(stats.lcl).toBeCloseTo(11.2 - 3 * 1.3038, 1);
  });

  it('should calculate Cp and Cpk correctly', () => {
    // Data centered at 10, sigma ~= 1
    const data = [9, 10, 11];
    const usl = 13;
    const lsl = 7;
    // Tolerance = 6, 6-sigma = 6 -> Cp = 1.0

    const stats = calculateStats(data, usl, lsl);
    expect(stats.cp).toBeCloseTo(1.0, 1);
    expect(stats.cpk).toBeCloseTo(1.0, 1); // Centered, so Cpk = Cp
  });

  it('should calculate Cpk correctly when off-center', () => {
    // Data centered at 12, sigma ~= 1
    // USL = 13 (1 sigma away), LSL = 7 (5 sigma away)
    // Cpk = min((13-12)/3, (12-7)/3) = 1/3 = 0.33
    const data = [11, 12, 13];
    const usl = 13;
    const lsl = 7;

    const stats = calculateStats(data, usl, lsl);
    expect(stats.cpk).toBeCloseTo(0.33, 2);
  });

  it('should handle one-sided specs', () => {
    const data = [10, 10, 10]; // Sigma is 0, special case?
    // Let's use scattered data
    const scattered = [9, 10, 11];
    const usl = 13;

    const stats = calculateStats(scattered, usl, undefined);
    expect(stats.cp).toBeUndefined(); // Cannot calc Cp with one limit
    expect(stats.cpk).toBeCloseTo((13 - 10) / (3 * 1), 1); // Cpu = 1.0
  });

  it('should handle empty data', () => {
    const stats = calculateStats([]);
    expect(stats.mean).toBe(0);
    expect(stats.stdDev).toBe(0);
    expect(stats.outOfSpecPercentage).toBe(0);
  });
});

describe('ANOVA', () => {
  it('should detect significant difference between groups', () => {
    // Three clearly different groups
    const data = [
      { Shift: 'A', CycleTime: 20 },
      { Shift: 'A', CycleTime: 21 },
      { Shift: 'A', CycleTime: 22 },
      { Shift: 'A', CycleTime: 23 },
      { Shift: 'B', CycleTime: 30 },
      { Shift: 'B', CycleTime: 31 },
      { Shift: 'B', CycleTime: 32 },
      { Shift: 'B', CycleTime: 33 },
      { Shift: 'C', CycleTime: 40 },
      { Shift: 'C', CycleTime: 41 },
      { Shift: 'C', CycleTime: 42 },
      { Shift: 'C', CycleTime: 43 },
    ];

    const result = calculateAnova(data, 'CycleTime', 'Shift');

    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(true);
    expect(result!.pValue).toBeLessThan(0.05);
    expect(result!.groups).toHaveLength(3);
    expect(result!.fStatistic).toBeGreaterThan(1);
  });

  it('should not detect difference when groups are similar', () => {
    // Three similar groups with overlapping distributions
    const data = [
      { Shift: 'A', CycleTime: 10 },
      { Shift: 'A', CycleTime: 11 },
      { Shift: 'A', CycleTime: 12 },
      { Shift: 'B', CycleTime: 10 },
      { Shift: 'B', CycleTime: 11 },
      { Shift: 'B', CycleTime: 12 },
      { Shift: 'C', CycleTime: 10 },
      { Shift: 'C', CycleTime: 11 },
      { Shift: 'C', CycleTime: 12 },
    ];

    const result = calculateAnova(data, 'CycleTime', 'Shift');

    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(false);
    expect(result!.pValue).toBeGreaterThan(0.05);
  });

  it('should calculate correct group statistics', () => {
    const data = [
      { Group: 'X', Value: 10 },
      { Group: 'X', Value: 20 },
      { Group: 'Y', Value: 30 },
      { Group: 'Y', Value: 40 },
    ];

    const result = calculateAnova(data, 'Value', 'Group');

    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(2);

    const groupX = result!.groups.find(g => g.name === 'X');
    const groupY = result!.groups.find(g => g.name === 'Y');

    expect(groupX).toBeDefined();
    expect(groupX!.mean).toBeCloseTo(15, 1);
    expect(groupX!.n).toBe(2);

    expect(groupY).toBeDefined();
    expect(groupY!.mean).toBeCloseTo(35, 1);
    expect(groupY!.n).toBe(2);
  });

  it('should calculate eta-squared effect size', () => {
    // Large effect size expected
    const data = [
      { Group: 'A', Value: 1 },
      { Group: 'A', Value: 2 },
      { Group: 'A', Value: 3 },
      { Group: 'B', Value: 100 },
      { Group: 'B', Value: 101 },
      { Group: 'B', Value: 102 },
    ];

    const result = calculateAnova(data, 'Value', 'Group');

    expect(result).not.toBeNull();
    // Eta-squared should be > 0.14 for large effect
    expect(result!.etaSquared).toBeGreaterThan(0.14);
  });

  it('should return null for single group', () => {
    const data = [
      { Group: 'A', Value: 10 },
      { Group: 'A', Value: 20 },
    ];

    const result = calculateAnova(data, 'Value', 'Group');
    expect(result).toBeNull();
  });

  it('should return null for empty data', () => {
    const result = calculateAnova([], 'Value', 'Group');
    expect(result).toBeNull();
  });

  it('should generate plain-language insight for significant result', () => {
    const data = [
      { Machine: 'Fast', Time: 10 },
      { Machine: 'Fast', Time: 11 },
      { Machine: 'Fast', Time: 12 },
      { Machine: 'Slow', Time: 30 },
      { Machine: 'Slow', Time: 31 },
      { Machine: 'Slow', Time: 32 },
    ];

    const result = calculateAnova(data, 'Time', 'Machine');

    expect(result).not.toBeNull();
    expect(result!.insight).toContain('Fast');
    expect(result!.insight).toContain('best');
  });
});
