import { describe, it, expect } from 'vitest';
import { calculateStats } from '@variscout/core';

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
