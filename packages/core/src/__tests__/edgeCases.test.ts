/**
 * Edge Case Tests for Statistical Engine
 *
 * Tests boundary conditions where real bugs hide:
 * - Empty and minimal datasets
 * - Zero variation (identical values)
 * - Invalid or one-sided spec limits
 * - Extreme values and numerical precision
 * - ANOVA edge cases (single group, many groups)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  calculateAnova,
  calculateConformance,
  calculateBoxplotStats,
  calculateMovingRangeSigma,
  getEtaSquared,
} from '../stats';

// ============================================================================
// Empty and Minimal Data
// ============================================================================

describe('Edge Cases: Empty and Minimal Data', () => {
  it('empty array → zero-valued stats', () => {
    const stats = calculateStats([]);
    expect(stats.mean).toBe(0);
    expect(stats.stdDev).toBe(0);
    expect(stats.sigmaWithin).toBe(0);
    expect(stats.mrBar).toBe(0);
    expect(stats.ucl).toBe(0);
    expect(stats.lcl).toBe(0);
    expect(stats.outOfSpecPercentage).toBe(0);
    expect(stats.cp).toBeUndefined();
    expect(stats.cpk).toBeUndefined();
  });

  it('single value [42] → mean=42, σ_within from fallback, no MR', () => {
    const stats = calculateStats([42]);
    expect(stats.mean).toBe(42);
    // d3.deviation of single value is undefined → falls back to 0
    expect(stats.stdDev).toBe(0);
    // Moving range needs ≥2 points → sigmaWithin falls back to overall σ (0)
    expect(stats.mrBar).toBe(0);
    // Control limits collapse to mean when σ_within=0
    expect(stats.ucl).toBe(42);
    expect(stats.lcl).toBe(42);
  });

  it('two values [10, 20] → valid mean and σ_within from single MR', () => {
    const stats = calculateStats([10, 20]);
    expect(stats.mean).toBeCloseTo(15, 5);
    // MR = [|20-10|] = [10], MR̄ = 10, σ_within = 10 / 1.128 ≈ 8.865
    expect(stats.sigmaWithin).toBeCloseTo(10 / 1.128, 2);
    expect(stats.mrBar).toBeCloseTo(10, 5);
    expect(stats.ucl).toBeCloseTo(15 + 3 * (10 / 1.128), 1);
    expect(stats.lcl).toBeCloseTo(15 - 3 * (10 / 1.128), 1);
  });

  it('three values → full stats valid', () => {
    const stats = calculateStats([10, 12, 14]);
    expect(stats.mean).toBeCloseTo(12, 5);
    // MR = [2, 2], MR̄ = 2, σ_within = 2/1.128 ≈ 1.773
    expect(stats.mrBar).toBeCloseTo(2, 5);
    expect(stats.sigmaWithin).toBeCloseTo(2 / 1.128, 2);
    // stdDev (σ_overall) should be positive
    expect(stats.stdDev).toBeGreaterThan(0);
  });
});

// ============================================================================
// Zero Variation
// ============================================================================

describe('Edge Cases: Zero Variation', () => {
  it('all identical values → σ_within=0, MR̄=0', () => {
    const stats = calculateStats([10, 10, 10, 10, 10]);
    expect(stats.mean).toBe(10);
    expect(stats.stdDev).toBe(0);
    expect(stats.sigmaWithin).toBe(0);
    expect(stats.mrBar).toBe(0);
  });

  it('identical values → control limits collapse to mean', () => {
    const stats = calculateStats([10, 10, 10, 10]);
    expect(stats.ucl).toBe(10);
    expect(stats.lcl).toBe(10);
  });

  it('Cp with σ_within=0 → Infinity', () => {
    const stats = calculateStats([10, 10, 10, 10], 15, 5);
    // Cp = (15-5) / (6*0) = Infinity
    expect(stats.cp).toBe(Infinity);
  });

  it('Cpk with σ_within=0 → Infinity', () => {
    const stats = calculateStats([10, 10, 10, 10], 15, 5);
    // CPU = (15-10)/(3*0) = Infinity, CPL = (10-5)/(3*0) = Infinity
    expect(stats.cpk).toBe(Infinity);
  });

  it('calculateMovingRangeSigma with identical values', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([5, 5, 5, 5]);
    expect(mrBar).toBe(0);
    expect(sigmaWithin).toBe(0);
  });
});

// ============================================================================
// Invalid Spec Limits
// ============================================================================

describe('Edge Cases: Invalid Spec Limits', () => {
  const data = [9, 10, 11, 10, 10];

  it('USL < LSL → Cp is negative', () => {
    // USL=5, LSL=15 is reversed — Cp = (5-15)/(6*σ) = negative
    const stats = calculateStats(data, 5, 15);
    expect(stats.cp).toBeDefined();
    expect(stats.cp!).toBeLessThan(0);
  });

  it('USL = LSL → Cp = 0', () => {
    // USL=LSL=10 → Cp = (10-10)/(6*σ) = 0
    const stats = calculateStats(data, 10, 10);
    expect(stats.cp).toBeCloseTo(0, 5);
  });

  it('only USL set → Cp undefined, Cpk = CPU', () => {
    const stats = calculateStats(data, 15, undefined);
    expect(stats.cp).toBeUndefined();
    expect(stats.cpk).toBeDefined();
    // Cpk = (USL - mean) / (3 * σ_within)
    const expectedCpk = (15 - stats.mean) / (3 * stats.sigmaWithin);
    expect(stats.cpk).toBeCloseTo(expectedCpk, 5);
  });

  it('only LSL set → Cp undefined, Cpk = CPL', () => {
    const stats = calculateStats(data, undefined, 5);
    expect(stats.cp).toBeUndefined();
    expect(stats.cpk).toBeDefined();
    // Cpk = (mean - LSL) / (3 * σ_within)
    const expectedCpk = (stats.mean - 5) / (3 * stats.sigmaWithin);
    expect(stats.cpk).toBeCloseTo(expectedCpk, 5);
  });

  it('no specs → Cp and Cpk undefined', () => {
    const stats = calculateStats(data);
    expect(stats.cp).toBeUndefined();
    expect(stats.cpk).toBeUndefined();
  });
});

// ============================================================================
// Extreme Values
// ============================================================================

describe('Edge Cases: Extreme Values', () => {
  it('huge values → precision maintained', () => {
    const base = 1e12;
    const data = [base, base + 1, base + 2, base + 3, base + 4];
    const stats = calculateStats(data);
    expect(stats.mean).toBeCloseTo(base + 2, 0);
    // MR = [1, 1, 1, 1], MR̄ = 1
    expect(stats.mrBar).toBeCloseTo(1, 5);
  });

  it('negative values with LSL=0', () => {
    const data = [-5, -3, -1, 1, 3, 5];
    const stats = calculateStats(data, 10, 0);
    expect(stats.mean).toBeCloseTo(0, 5);
    // LCL can be negative (control limits are statistical, not physical)
    expect(stats.lcl).toBeLessThan(0);
    // Out of spec: values -5, -3, -1 are below LSL=0
    expect(stats.outOfSpecPercentage).toBeCloseTo(50, 0);
  });

  it('all values at USL → boundary pass rate', () => {
    const data = [100, 100, 100, 100, 100];
    // Values at exactly USL are NOT above USL, so they pass
    const stats = calculateStats(data, 100, 90);
    expect(stats.outOfSpecPercentage).toBe(0);
  });

  it('all values above USL → 100% out of spec', () => {
    const data = [101, 102, 103, 104, 105];
    const stats = calculateStats(data, 100, 90);
    expect(stats.outOfSpecPercentage).toBe(100);
  });

  it('all values below LSL → 100% out of spec', () => {
    const data = [85, 86, 87, 88, 89];
    const stats = calculateStats(data, 100, 90);
    expect(stats.outOfSpecPercentage).toBe(100);
  });

  it('mixed in-spec and out-of-spec', () => {
    const data = [89, 91, 95, 99, 101]; // 89 below LSL, 101 above USL
    const stats = calculateStats(data, 100, 90);
    // 2 out of 5 = 40%
    expect(stats.outOfSpecPercentage).toBeCloseTo(40, 5);
  });
});

// ============================================================================
// Conformance Edge Cases
// ============================================================================

describe('Edge Cases: Conformance', () => {
  it('empty array → 0% pass rate', () => {
    const result = calculateConformance([]);
    expect(result.total).toBe(0);
    expect(result.passRate).toBe(0);
    expect(result.pass).toBe(0);
  });

  it('no specs → everything passes', () => {
    const result = calculateConformance([10, 20, 30]);
    expect(result.passRate).toBe(100);
    expect(result.pass).toBe(3);
  });

  it('only USL → values above fail, below pass', () => {
    const result = calculateConformance([8, 9, 10, 11, 12], 10);
    // 11 and 12 are above USL
    expect(result.failUsl).toBe(2);
    expect(result.failLsl).toBe(0);
    expect(result.pass).toBe(3);
  });

  it('value exactly at USL passes', () => {
    const result = calculateConformance([10], 10);
    expect(result.pass).toBe(1);
    expect(result.failUsl).toBe(0);
  });

  it('value exactly at LSL passes', () => {
    const result = calculateConformance([5], undefined, 5);
    expect(result.pass).toBe(1);
    expect(result.failLsl).toBe(0);
  });
});

// ============================================================================
// Boxplot Edge Cases
// ============================================================================

describe('Edge Cases: Boxplot Stats', () => {
  it('empty values → zero stats', () => {
    const result = calculateBoxplotStats({ group: 'empty', values: [] });
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.median).toBe(0);
    expect(result.mean).toBe(0);
    expect(result.q1).toBe(0);
    expect(result.q3).toBe(0);
    expect(result.outliers).toEqual([]);
    expect(result.stdDev).toBe(0);
  });

  it('single value → all stats equal that value', () => {
    const result = calculateBoxplotStats({ group: 'single', values: [42] });
    expect(result.median).toBe(42);
    expect(result.mean).toBe(42);
    expect(result.q1).toBe(42);
    expect(result.q3).toBe(42);
    expect(result.stdDev).toBe(0);
  });

  it('two values → median is average', () => {
    const result = calculateBoxplotStats({ group: 'two', values: [10, 20] });
    expect(result.median).toBe(15);
    expect(result.mean).toBe(15);
  });

  it('outlier detection with extreme values', () => {
    // IQR method: outliers are > Q3 + 1.5*IQR or < Q1 - 1.5*IQR
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100]; // 100 is an outlier
    const result = calculateBoxplotStats({ group: 'outlier', values });
    expect(result.outliers).toContain(100);
  });

  it('identical values → no outliers', () => {
    const result = calculateBoxplotStats({ group: 'identical', values: [5, 5, 5, 5, 5] });
    expect(result.outliers).toEqual([]);
  });
});

// ============================================================================
// ANOVA Edge Cases
// ============================================================================

describe('Edge Cases: ANOVA', () => {
  it('single group → returns null', () => {
    const data = [
      { G: 'A', V: 10 },
      { G: 'A', V: 20 },
      { G: 'A', V: 30 },
    ];
    expect(calculateAnova(data, 'V', 'G')).toBeNull();
  });

  it('empty data → returns null', () => {
    expect(calculateAnova([], 'V', 'G')).toBeNull();
  });

  it('two groups with 1 member each → insufficient df, returns null', () => {
    const data = [
      { G: 'A', V: 10 },
      { G: 'B', V: 20 },
    ];
    // totalN=2, k=2 → dfWithin = 2-2 = 0 → should return null
    expect(calculateAnova(data, 'V', 'G')).toBeNull();
  });

  it('all groups identical means → F=0, not significant', () => {
    const data = [
      { G: 'A', V: 10 },
      { G: 'A', V: 10 },
      { G: 'B', V: 10 },
      { G: 'B', V: 10 },
      { G: 'C', V: 10 },
      { G: 'C', V: 10 },
    ];
    // SSW=0 → msw=0 → division issue
    // With zero within-group variance and zero between, ANOVA should handle gracefully
    const result = calculateAnova(data, 'V', 'G');
    // SSW=0 triggers early return null in current implementation
    expect(result).toBeNull();
  });

  it('two groups with clear difference → significant', () => {
    const data = [
      { G: 'A', V: 1 },
      { G: 'A', V: 2 },
      { G: 'A', V: 3 },
      { G: 'B', V: 10 },
      { G: 'B', V: 11 },
      { G: 'B', V: 12 },
    ];
    const result = calculateAnova(data, 'V', 'G');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(true);
    expect(result!.groups).toHaveLength(2);
  });

  it('many small groups (10 groups, 3 each) → handles gracefully', () => {
    const data: { G: string; V: number }[] = [];
    for (let g = 0; g < 10; g++) {
      for (let i = 0; i < 3; i++) {
        data.push({ G: `Group${g}`, V: g * 10 + i });
      }
    }
    const result = calculateAnova(data, 'V', 'G');
    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(10);
    expect(result!.isSignificant).toBe(true);
    expect(result!.etaSquared).toBeGreaterThan(0.5);
  });

  it('two groups, equal but noisy → not significant', () => {
    // Same distribution in both groups
    const data = [
      { G: 'A', V: 10 },
      { G: 'A', V: 12 },
      { G: 'A', V: 11 },
      { G: 'B', V: 10 },
      { G: 'B', V: 12 },
      { G: 'B', V: 11 },
    ];
    const result = calculateAnova(data, 'V', 'G');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(false);
  });
});

// ============================================================================
// Eta-Squared Edge Cases
// ============================================================================

describe('Edge Cases: Eta-Squared', () => {
  it('no variation in data → η²=0', () => {
    const data = [
      { G: 'A', V: 10 },
      { G: 'B', V: 10 },
    ];
    expect(getEtaSquared(data, 'G', 'V')).toBe(0);
  });

  it('all variation between groups → η² near 1', () => {
    const data = [
      { G: 'A', V: 0 },
      { G: 'A', V: 0 },
      { G: 'B', V: 100 },
      { G: 'B', V: 100 },
    ];
    expect(getEtaSquared(data, 'G', 'V')).toBeCloseTo(1, 5);
  });

  it('single row → η²=0 (no SS_total)', () => {
    const data = [{ G: 'A', V: 42 }];
    expect(getEtaSquared(data, 'G', 'V')).toBe(0);
  });
});
