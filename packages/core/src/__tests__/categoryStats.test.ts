import { describe, it, expect } from 'vitest';
import { getCategoryStats, calculateCategoryTotalSS } from '../variation';
import { inferCharacteristicType } from '../types';
import type { DataRow } from '../types';

describe('getCategoryStats', () => {
  it('should calculate mean and stdDev for each category', () => {
    const data = [
      { Machine: 'A', Weight: 10 },
      { Machine: 'A', Weight: 12 },
      { Machine: 'A', Weight: 11 },
      { Machine: 'B', Weight: 20 },
      { Machine: 'B', Weight: 22 },
      { Machine: 'B', Weight: 21 },
    ];

    const result = getCategoryStats(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);

    // Machine B has higher mean (further from overall), so should be first
    const machineB = result!.find(c => c.value === 'B');
    expect(machineB).toBeDefined();
    expect(machineB!.count).toBe(3);
    expect(machineB!.mean).toBeCloseTo(21, 1);
    expect(machineB!.stdDev).toBeCloseTo(0.816, 2);

    const machineA = result!.find(c => c.value === 'A');
    expect(machineA).toBeDefined();
    expect(machineA!.count).toBe(3);
    expect(machineA!.mean).toBeCloseTo(11, 1);
    expect(machineA!.stdDev).toBeCloseTo(0.816, 2);
  });

  it('should sort categories by contribution percentage (highest first)', () => {
    // Machine C is clearly different from A and B
    const data = [
      { Machine: 'A', Weight: 100 },
      { Machine: 'A', Weight: 101 },
      { Machine: 'A', Weight: 99 },
      { Machine: 'B', Weight: 100 },
      { Machine: 'B', Weight: 102 },
      { Machine: 'B', Weight: 98 },
      { Machine: 'C', Weight: 150 },
      { Machine: 'C', Weight: 152 },
      { Machine: 'C', Weight: 148 },
    ];

    const result = getCategoryStats(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);

    // Machine C should be first (highest Total SS contribution — mean far from overall + spread)
    expect(result![0].value).toBe('C');
    expect(result![0].contributionPct).toBeGreaterThan(50);
  });

  it('should calculate contribution percentages that sum to 100% (Total SS)', () => {
    const data = [
      { Shift: 'Day', Output: 20 },
      { Shift: 'Day', Output: 22 },
      { Shift: 'Day', Output: 21 },
      { Shift: 'Day', Output: 23 },
      { Shift: 'Night', Output: 30 },
      { Shift: 'Night', Output: 32 },
      { Shift: 'Night', Output: 31 },
      { Shift: 'Night', Output: 33 },
    ];

    const result = getCategoryStats(data, 'Shift', 'Output');

    expect(result).not.toBeNull();

    // Sum of contribution percentages should equal 100% (Total SS fully partitioned)
    const totalContribution = result!.reduce((sum, c) => sum + c.contributionPct, 0);
    expect(totalContribution).toBeCloseTo(100, 1);
  });

  it('should return null for insufficient data', () => {
    expect(getCategoryStats([], 'Machine', 'Weight')).toBeNull();
    expect(getCategoryStats([{ Machine: 'A', Weight: 10 }], 'Machine', 'Weight')).toBeNull();
  });

  it('should return null when all values are the same (no variation)', () => {
    const data = [
      { Machine: 'A', Weight: 10 },
      { Machine: 'A', Weight: 10 },
      { Machine: 'B', Weight: 10 },
      { Machine: 'B', Weight: 10 },
    ];

    expect(getCategoryStats(data, 'Machine', 'Weight')).toBeNull();
  });

  it('should handle single category', () => {
    const data = [
      { Machine: 'A', Weight: 10 },
      { Machine: 'A', Weight: 12 },
      { Machine: 'A', Weight: 11 },
    ];

    const result = getCategoryStats(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].value).toBe('A');
    expect(result![0].count).toBe(3);
    expect(result![0].mean).toBeCloseTo(11, 1);
    // Single category accounts for 100% of Total SS
    expect(result![0].contributionPct).toBeCloseTo(100, 1);
  });

  it('should handle numeric category values', () => {
    const data = [
      { Line: 1, Output: 100 },
      { Line: 1, Output: 102 },
      { Line: 2, Output: 200 },
      { Line: 2, Output: 202 },
    ];

    const result = getCategoryStats(data, 'Line', 'Output');

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    // Numeric keys should be preserved
    expect(result!.some(c => c.value === 1)).toBe(true);
    expect(result!.some(c => c.value === 2)).toBe(true);
  });

  it('should handle missing values gracefully', () => {
    const data = [
      { Machine: 'A', Weight: 10 },
      { Machine: 'A', Weight: undefined },
      { Machine: 'B', Weight: 20 },
      { Machine: null, Weight: 15 },
      { Weight: 25 }, // Missing Machine
    ];

    const result = getCategoryStats(data as DataRow[], 'Machine', 'Weight');

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    // Should only include valid rows
    const machineA = result!.find(c => c.value === 'A');
    expect(machineA!.count).toBe(1); // Only the row with valid weight
  });

  it('should calculate correct stdDev for varied data', () => {
    // Machine A: tight distribution, Machine B: wide distribution
    const data = [
      { Machine: 'A', Weight: 99 },
      { Machine: 'A', Weight: 100 },
      { Machine: 'A', Weight: 101 },
      { Machine: 'B', Weight: 90 },
      { Machine: 'B', Weight: 100 },
      { Machine: 'B', Weight: 110 },
    ];

    const result = getCategoryStats(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();

    const machineA = result!.find(c => c.value === 'A');
    const machineB = result!.find(c => c.value === 'B');

    // Machine A has tighter spread (σ ≈ 0.816)
    expect(machineA!.stdDev).toBeCloseTo(0.816, 2);

    // Machine B has wider spread (σ ≈ 8.16)
    expect(machineB!.stdDev).toBeCloseTo(8.165, 2);
  });
});

// =============================================================================
// calculateCategoryTotalSS() Tests
// =============================================================================

describe('calculateCategoryTotalSS', () => {
  it('should calculate Total SS contribution for each category', () => {
    const data = [
      { Machine: 'A', Weight: 100 },
      { Machine: 'A', Weight: 102 },
      { Machine: 'B', Weight: 150 },
      { Machine: 'B', Weight: 152 },
    ];

    const result = calculateCategoryTotalSS(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();
    expect(result!.contributions.has('A')).toBe(true);
    expect(result!.contributions.has('B')).toBe(true);
  });

  it('should have sum of all categories equal 100%', () => {
    const data = [
      { Machine: 'A', Weight: 100 },
      { Machine: 'A', Weight: 102 },
      { Machine: 'B', Weight: 150 },
      { Machine: 'B', Weight: 152 },
      { Machine: 'C', Weight: 125 },
      { Machine: 'C', Weight: 130 },
    ];

    const result = calculateCategoryTotalSS(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();

    // Sum of all category contributions should equal 100%
    let totalContribution = 0;
    for (const contrib of result!.contributions.values()) {
      totalContribution += contrib;
    }

    expect(totalContribution).toBeCloseTo(100, 1);
  });

  it('should capture within-group spread (not just between-group)', () => {
    // Machine A: mean = 101, same as overall mean, but has high spread
    // Machine B: mean = 101, same as overall mean, but has low spread
    // Between-group SS = 0 for both (means equal overall mean)
    // Total SS should still show Machine A contributing more due to spread
    const data = [
      { Machine: 'A', Weight: 91 }, // 10 below mean
      { Machine: 'A', Weight: 111 }, // 10 above mean
      { Machine: 'B', Weight: 100 }, // 1 below mean
      { Machine: 'B', Weight: 102 }, // 1 above mean
    ];

    const result = calculateCategoryTotalSS(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();

    const contribA = result!.contributions.get('A')!;
    const contribB = result!.contributions.get('B')!;

    // Machine A has higher spread, so should contribute more to Total SS
    expect(contribA).toBeGreaterThan(contribB);
    // Machine A with high spread should contribute the majority
    expect(contribA).toBeGreaterThan(90);
  });

  it('should show non-zero impact for category with mean near overall mean but high spread', () => {
    // This is the key test case - the problem with between-group only
    // Category with mean = overall mean but high variation should show impact
    const data = [
      { Machine: 'A', Weight: 50 }, // High spread
      { Machine: 'A', Weight: 150 }, // Mean = 100
      { Machine: 'B', Weight: 99 }, // Low spread
      { Machine: 'B', Weight: 101 }, // Mean = 100
    ];

    const result = calculateCategoryTotalSS(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();

    const contribA = result!.contributions.get('A')!;
    const contribB = result!.contributions.get('B')!;

    // Both should have non-zero contributions (unlike between-group which would be 0)
    expect(contribA).toBeGreaterThan(0);
    expect(contribB).toBeGreaterThan(0);

    // Machine A contributes more due to higher spread
    expect(contribA).toBeGreaterThan(contribB);
  });

  it('should return null for insufficient data', () => {
    expect(calculateCategoryTotalSS([], 'Machine', 'Weight')).toBeNull();
    expect(
      calculateCategoryTotalSS([{ Machine: 'A', Weight: 10 }], 'Machine', 'Weight')
    ).toBeNull();
  });

  it('should return null when all values are the same (no variation)', () => {
    const data = [
      { Machine: 'A', Weight: 10 },
      { Machine: 'A', Weight: 10 },
      { Machine: 'B', Weight: 10 },
      { Machine: 'B', Weight: 10 },
    ];

    expect(calculateCategoryTotalSS(data, 'Machine', 'Weight')).toBeNull();
  });

  it('should handle numeric category values', () => {
    const data = [
      { Line: 1, Output: 100 },
      { Line: 1, Output: 102 },
      { Line: 2, Output: 200 },
      { Line: 2, Output: 202 },
    ];

    const result = calculateCategoryTotalSS(data, 'Line', 'Output');

    expect(result).not.toBeNull();
    expect(result!.contributions.has(1)).toBe(true);
    expect(result!.contributions.has(2)).toBe(true);
  });

  it('should include ssTotal in result', () => {
    const data = [
      { Machine: 'A', Weight: 100 },
      { Machine: 'A', Weight: 110 },
      { Machine: 'B', Weight: 120 },
      { Machine: 'B', Weight: 130 },
    ];

    const result = calculateCategoryTotalSS(data, 'Machine', 'Weight');

    expect(result).not.toBeNull();
    expect(result!.ssTotal).toBeGreaterThan(0);
  });
});

// =============================================================================
// inferCharacteristicType() Tests
// =============================================================================

describe('inferCharacteristicType', () => {
  it('should return "nominal" when both USL and LSL are defined', () => {
    expect(inferCharacteristicType({ usl: 100, lsl: 90 })).toBe('nominal');
    expect(inferCharacteristicType({ usl: 100, lsl: 90, target: 95 })).toBe('nominal');
  });

  it('should return "smaller" when only USL is defined (smaller-is-better)', () => {
    expect(inferCharacteristicType({ usl: 5 })).toBe('smaller');
    expect(inferCharacteristicType({ usl: 0 })).toBe('smaller');
  });

  it('should return "larger" when only LSL is defined (larger-is-better)', () => {
    expect(inferCharacteristicType({ lsl: 80 })).toBe('larger');
    expect(inferCharacteristicType({ lsl: 0 })).toBe('larger');
  });

  it('should return "nominal" when no specs are defined (default fallback)', () => {
    expect(inferCharacteristicType({})).toBe('nominal');
  });

  it('should return explicitly set characteristicType if provided', () => {
    expect(inferCharacteristicType({ usl: 100, characteristicType: 'smaller' })).toBe('smaller');
    expect(inferCharacteristicType({ lsl: 50, characteristicType: 'nominal' })).toBe('nominal');
    expect(inferCharacteristicType({ usl: 100, lsl: 90, characteristicType: 'larger' })).toBe(
      'larger'
    );
  });

  it('should handle target-only spec as nominal', () => {
    // Target without limits is still nominal (fallback)
    expect(inferCharacteristicType({ target: 100 })).toBe('nominal');
  });
});
