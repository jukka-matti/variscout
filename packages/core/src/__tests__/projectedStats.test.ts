import { describe, it, expect } from 'vitest';
import { calculateProjectedStats, type ProjectedStats } from '../variation';

describe('calculateProjectedStats', () => {
  // Sample data with three machines, Machine C being the worst performer
  const sampleData = [
    // Machine A: mean ~100, low stdDev
    { Machine: 'A', Weight: 99 },
    { Machine: 'A', Weight: 100 },
    { Machine: 'A', Weight: 101 },
    { Machine: 'A', Weight: 100 },
    // Machine B: mean ~100, low stdDev
    { Machine: 'B', Weight: 98 },
    { Machine: 'B', Weight: 100 },
    { Machine: 'B', Weight: 102 },
    { Machine: 'B', Weight: 100 },
    // Machine C: mean ~110, high stdDev (the "worst" performer)
    { Machine: 'C', Weight: 105 },
    { Machine: 'C', Weight: 110 },
    { Machine: 'C', Weight: 115 },
    { Machine: 'C', Weight: 110 },
  ];

  it('should calculate projected mean and stdDev after exclusion', () => {
    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(['C']),
      undefined,
      undefined
    );

    expect(result).not.toBeNull();
    expect(result!.remainingCount).toBe(8); // 12 - 4 Machine C rows

    // After excluding Machine C, mean should be closer to 100
    expect(result!.mean).toBeCloseTo(100, 0);

    // StdDev should be lower without Machine C's spread
    expect(result!.stdDev).toBeLessThan(2);
  });

  it('should calculate Cpk when specs are provided', () => {
    const specs = { usl: 115, lsl: 85, target: 100 };

    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(['C']),
      specs,
      undefined
    );

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeDefined();
    expect(result!.cp).toBeDefined();

    // With tight distribution around 100 and wide spec limits, Cpk should be high
    expect(result!.cpk).toBeGreaterThan(1.0);
  });

  it('should calculate Cpk with only USL', () => {
    const specs = { usl: 115 };

    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(['C']),
      specs,
      undefined
    );

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeDefined();
    expect(result!.cp).toBeUndefined(); // Cp requires both limits
  });

  it('should calculate Cpk with only LSL', () => {
    const specs = { lsl: 85 };

    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(['C']),
      specs,
      undefined
    );

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeDefined();
    expect(result!.cp).toBeUndefined();
  });

  it('should calculate improvement percentages when currentStats provided', () => {
    const specs = { usl: 120, lsl: 80, target: 100 };
    const currentStats = {
      mean: 103.5, // Current mean (with Machine C)
      stdDev: 5.5, // Current stdDev (with Machine C)
      cpk: 0.8, // Current Cpk (with Machine C)
    };

    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(['C']),
      specs,
      currentStats
    );

    expect(result).not.toBeNull();

    // Should show improvement in stdDev (reduction > 0)
    expect(result!.stdDevReductionPct).toBeDefined();
    expect(result!.stdDevReductionPct).toBeGreaterThan(0);

    // Should show improvement in mean centering (closer to target)
    expect(result!.meanImprovementPct).toBeDefined();
    expect(result!.meanImprovementPct).toBeGreaterThan(0);

    // Should show improvement in Cpk
    expect(result!.cpkImprovementPct).toBeDefined();
    expect(result!.cpkImprovementPct).toBeGreaterThan(0);
  });

  it('should handle multiple category exclusions', () => {
    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(['B', 'C']), // Exclude both B and C
      undefined,
      undefined
    );

    expect(result).not.toBeNull();
    expect(result!.remainingCount).toBe(4); // Only Machine A rows remain

    // Mean should be exactly Machine A's mean
    expect(result!.mean).toBeCloseTo(100, 0);
  });

  it('should return null when all categories are excluded', () => {
    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(['A', 'B', 'C']), // Exclude all
      undefined,
      undefined
    );

    expect(result).toBeNull();
  });

  it('should return null when remaining data is insufficient', () => {
    const smallData = [
      { Machine: 'A', Weight: 100 },
      { Machine: 'B', Weight: 110 },
    ];

    const result = calculateProjectedStats(
      smallData,
      'Machine',
      'Weight',
      new Set(['A']), // Only 1 row remains
      undefined,
      undefined
    );

    expect(result).toBeNull();
  });

  it('should work without specs (no Cpk calculation)', () => {
    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(['C']),
      undefined, // No specs
      { mean: 103.5, stdDev: 5.5 } // Current stats without Cpk
    );

    expect(result).not.toBeNull();
    expect(result!.mean).toBeDefined();
    expect(result!.stdDev).toBeDefined();
    expect(result!.cpk).toBeUndefined();
    expect(result!.cpkImprovementPct).toBeUndefined();

    // Should still calculate stdDev improvement
    expect(result!.stdDevReductionPct).toBeDefined();
  });

  it('should handle rows with missing factor values', () => {
    const dataWithMissing = [
      { Machine: 'A', Weight: 100 },
      { Machine: 'A', Weight: 100 },
      { Machine: undefined, Weight: 150 }, // Missing factor
      { Machine: null, Weight: 150 }, // Null factor
      { Weight: 150 }, // Missing entirely
    ];

    const result = calculateProjectedStats(
      dataWithMissing as any[],
      'Machine',
      'Weight',
      new Set(['A']),
      undefined,
      undefined
    );

    expect(result).not.toBeNull();
    // Rows with missing factor should be included (not excluded)
    expect(result!.remainingCount).toBe(3);
  });

  it('should calculate mean improvement using spec midpoint when no target', () => {
    const specs = { usl: 120, lsl: 80 }; // Midpoint = 100, no explicit target

    // Data that's off-center (mean > 100)
    const offCenterData = [
      { Machine: 'A', Weight: 100 },
      { Machine: 'A', Weight: 100 },
      { Machine: 'B', Weight: 120 }, // Pulls mean up
      { Machine: 'B', Weight: 120 },
    ];

    const currentStats = {
      mean: 110, // Current mean (off-center)
      stdDev: 10,
    };

    const result = calculateProjectedStats(
      offCenterData,
      'Machine',
      'Weight',
      new Set(['B']), // Exclude the off-center category
      specs,
      currentStats
    );

    expect(result).not.toBeNull();
    expect(result!.meanImprovementPct).toBeDefined();
    // After excluding B, mean should be 100 (exactly at spec midpoint)
    // Improvement should be 100% (from 10 deviation to 0 deviation)
    expect(result!.meanImprovementPct).toBeCloseTo(100, 0);
  });

  it('should handle stdDev improvement when projected is worse', () => {
    // Create data where excluding a category makes stdDev worse
    const data = [
      { Machine: 'A', Weight: 100 },
      { Machine: 'A', Weight: 100 }, // Tight cluster
      { Machine: 'B', Weight: 90 },
      { Machine: 'B', Weight: 110 }, // Wide spread within B
    ];

    const currentStats = {
      mean: 100,
      stdDev: 5, // Artificially low current stdDev
    };

    const result = calculateProjectedStats(
      data,
      'Machine',
      'Weight',
      new Set(['A']), // Exclude the tight cluster
      undefined,
      currentStats
    );

    expect(result).not.toBeNull();
    // stdDevReductionPct can be negative if projection is worse
    expect(result!.stdDevReductionPct).toBeDefined();
    expect(result!.stdDevReductionPct).toBeLessThan(0);
  });

  it('should handle empty exclusion set (no exclusions)', () => {
    const result = calculateProjectedStats(
      sampleData,
      'Machine',
      'Weight',
      new Set(), // Empty set - no exclusions
      undefined,
      undefined
    );

    expect(result).not.toBeNull();
    expect(result!.remainingCount).toBe(12); // All rows included
  });

  it('should handle numeric category values', () => {
    const numericData = [
      { Line: 1, Output: 100 },
      { Line: 1, Output: 100 },
      { Line: 2, Output: 200 },
      { Line: 2, Output: 200 },
    ];

    const result = calculateProjectedStats(
      numericData,
      'Line',
      'Output',
      new Set([2]), // Exclude Line 2 (numeric)
      undefined,
      undefined
    );

    expect(result).not.toBeNull();
    expect(result!.remainingCount).toBe(2);
    expect(result!.mean).toBe(100);
  });
});
