/**
 * Large-scale stress tests for VariScout core statistics.
 *
 * Validates calculation correctness at realistic production scales:
 * - 5K-50K rows, 30-500 ANOVA groups
 * - Graceful handling of sparse groups and edge cases
 * - Performance budgets for regression detection
 *
 * These tests use extended timeouts (up to 30s) for 50K row datasets.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  calculateAnova,
  getEtaSquared,
  calculateBoxplotStats,
  calculateKDE,
} from '../stats';
import type { DataRow } from '../types';
import {
  generateStressData,
  simpleFactory,
  pharmaFillLine,
  beverageFilling,
  timedExec,
} from './helpers/stressDataGenerator';

// ============================================================================
// ANOVA Scalability
// ============================================================================

describe('ANOVA scalability', () => {
  it('handles 30 groups x 100 rows (3K rows)', () => {
    const data = simpleFactory(3000, 30);
    const result = calculateAnova(data, 'Measurement', 'Group');

    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(30);
    expect(result!.fStatistic).toBeGreaterThan(0);
    expect(result!.etaSquared).toBeGreaterThanOrEqual(0);
    expect(result!.etaSquared).toBeLessThanOrEqual(1);
    expect(result!.dfBetween).toBe(29);
    expect(result!.dfWithin).toBe(3000 - 30);
  });

  it('handles 50 groups x 100 rows (5K rows)', () => {
    const data = simpleFactory(5000, 50);
    const result = calculateAnova(data, 'Measurement', 'Group');

    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(50);
    expect(result!.dfBetween).toBe(49);
  });

  it('handles 100 groups x 50 rows (5K rows) - no NaN', () => {
    const data = simpleFactory(5000, 100);
    const result = calculateAnova(data, 'Measurement', 'Group');

    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(100);
    expect(Number.isNaN(result!.fStatistic)).toBe(false);
    expect(Number.isNaN(result!.pValue)).toBe(false);
    expect(Number.isNaN(result!.etaSquared)).toBe(false);
  });

  it('handles 500 groups x 5 rows (2.5K rows) - many sparse groups', () => {
    const data = simpleFactory(2500, 500);
    const result = calculateAnova(data, 'Measurement', 'Group');

    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(500);
    // dfWithin = totalN - k = 2500 - 500 = 2000
    expect(result!.dfWithin).toBe(2000);
    expect(Number.isNaN(result!.fStatistic)).toBe(false);
  });

  it('50 groups with known mean shifts produce meaningful eta-squared', () => {
    // Even groups: mean=100, Odd groups: mean=105
    // With baseStd=2, this should produce a measurable effect
    const data = simpleFactory(5000, 50);
    const result = calculateAnova(data, 'Measurement', 'Group');

    expect(result).not.toBeNull();
    // With alternating 0/5 shifts and std=2, eta-squared should be substantial
    expect(result!.etaSquared).toBeGreaterThan(0.1);
    expect(result!.isSignificant).toBe(true);
  });

  it('mixed group sizes: 25 groups with 1 obs + 25 with ~100 obs', () => {
    // Generate data with 25 large groups and build single-obs groups manually
    const largeGroupData = generateStressData({
      rowCount: 2500,
      factors: [
        {
          name: 'Group',
          levels: Array.from({ length: 25 }, (_, i) => `Large_${i + 1}`),
          meanShifts: Array.from({ length: 25 }, (_, i) => (i % 3) * 2),
        },
      ],
      measurement: { name: 'Value', baseMean: 100, baseStd: 3 },
    });

    // Add 25 single-observation groups
    const singleObsRows: DataRow[] = Array.from({ length: 25 }, (_, i) => ({
      Group: `Single_${i + 1}`,
      Value: 100 + i * 0.5,
    }));

    const allData = [...largeGroupData, ...singleObsRows];
    const result = calculateAnova(allData, 'Value', 'Group');

    expect(result).not.toBeNull();
    // 25 large + 25 single = 50 groups
    expect(result!.groups).toHaveLength(50);
    // Single-obs groups contribute 0 to SSW, but large groups still contribute
    expect(result!.ssw).toBeGreaterThan(0);
    expect(Number.isNaN(result!.fStatistic)).toBe(false);
  });
});

// ============================================================================
// Basic Stats at Scale
// ============================================================================

describe('calculateStats at scale', () => {
  it('5K rows - mean/std converge to generator parameters', () => {
    const data = generateStressData({
      rowCount: 5000,
      factors: [],
      measurement: { name: 'Value', baseMean: 100, baseStd: 5 },
    });
    const values = data.map(d => d.Value as number);
    const stats = calculateStats(values, 115, 85);

    // With 5K samples, mean should be close to 100 and std close to 5
    expect(stats.mean).toBeCloseTo(100, 0);
    expect(stats.stdDev).toBeCloseTo(5, 0);
    expect(stats.cpk).toBeDefined();
    expect(stats.cpk!).toBeGreaterThan(0);
    expect(Number.isNaN(stats.cpk!)).toBe(false);
  });

  it('10K rows - stable results', () => {
    const data = generateStressData({
      rowCount: 10000,
      factors: [],
      measurement: { name: 'Value', baseMean: 50, baseStd: 3 },
    });
    const values = data.map(d => d.Value as number);
    const stats = calculateStats(values, 60, 40);

    expect(stats.mean).toBeCloseTo(50, 0);
    expect(stats.stdDev).toBeCloseTo(3, 0);
    expect(stats.cp).toBeDefined();
    expect(stats.cp!).toBeGreaterThan(0);
  });

  it('50K rows - completes without error', { timeout: 30_000 }, () => {
    const data = generateStressData({
      rowCount: 50000,
      factors: [],
      measurement: { name: 'Value', baseMean: 200, baseStd: 10 },
    });
    const values = data.map(d => d.Value as number);
    const stats = calculateStats(values, 240, 160);

    expect(stats.mean).toBeCloseTo(200, -1); // within ~10
    expect(stats.stdDev).toBeCloseTo(10, 0);
    expect(Number.isNaN(stats.mean)).toBe(false);
    expect(Number.isFinite(stats.ucl)).toBe(true);
    expect(Number.isFinite(stats.lcl)).toBe(true);
  });

  it('50K identical values - sigmaWithin === 0, no NaN/Infinity', { timeout: 30_000 }, () => {
    const values = Array.from({ length: 50000 }, () => 42.0);
    const stats = calculateStats(values);

    expect(stats.mean).toBe(42.0);
    expect(stats.stdDev).toBe(0);
    expect(stats.sigmaWithin).toBe(0);
    expect(Number.isNaN(stats.mean)).toBe(false);
    expect(Number.isNaN(stats.ucl)).toBe(false);
    expect(Number.isNaN(stats.lcl)).toBe(false);
    // Cp/Cpk are undefined without specs
    expect(stats.cp).toBeUndefined();
  });
});

// ============================================================================
// Eta-Squared at Scale
// ============================================================================

describe('Eta-squared at scale', () => {
  it(
    '1 factor x 50K rows, 50 levels - boundary of categorical threshold',
    { timeout: 30_000 },
    () => {
      const data = generateStressData({
        rowCount: 50000,
        factors: [{ name: 'Product', levels: 50 }],
        measurement: { name: 'Weight', baseMean: 100, baseStd: 5 },
      });

      const etaSq = getEtaSquared(data, 'Product', 'Weight');
      expect(etaSq).toBeGreaterThanOrEqual(0);
      expect(etaSq).toBeLessThanOrEqual(1);
      expect(Number.isNaN(etaSq)).toBe(false);
    }
  );

  it('known effect sizes - eta-squared within tolerance', () => {
    const data = generateStressData({
      rowCount: 2000,
      factors: [
        {
          name: 'Treatment',
          levels: ['Control', 'Treatment'],
          meanShifts: [0, 10],
        },
      ],
      measurement: { name: 'Response', baseMean: 50, baseStd: 1 },
    });

    const etaSq = getEtaSquared(data, 'Treatment', 'Response');
    expect(etaSq).toBeGreaterThan(0.9);
  });
});

// ============================================================================
// Boxplot Stats at Scale
// ============================================================================

describe('calculateBoxplotStats at scale', () => {
  it('10K values - completes with correct outliers', () => {
    const data = generateStressData({
      rowCount: 10000,
      factors: [],
      measurement: { name: 'Value', baseMean: 100, baseStd: 5 },
    });
    const values = data.map(d => d.Value as number);

    const result = calculateBoxplotStats({ group: 'test', values });

    expect(result.key).toBe('test');
    expect(result.values).toHaveLength(10000);
    expect(result.q1).toBeLessThan(result.median);
    expect(result.median).toBeLessThan(result.q3);
    expect(result.mean).toBeCloseTo(100, 0);
    expect(result.stdDev).toBeCloseTo(5, 0);
    // Normal distribution at 10K should produce some outliers
    expect(result.outliers.length).toBeGreaterThanOrEqual(0);
    // But not too many (outlier rate for normal ~0.7%)
    expect(result.outliers.length).toBeLessThan(200);
  });

  it('50K values - completes without error', { timeout: 30_000 }, () => {
    const data = generateStressData({
      rowCount: 50000,
      factors: [],
      measurement: { name: 'Value', baseMean: 50, baseStd: 10 },
    });
    const values = data.map(d => d.Value as number);

    const result = calculateBoxplotStats({ group: 'large', values });

    expect(result.key).toBe('large');
    expect(result.values).toHaveLength(50000);
    expect(Number.isFinite(result.median)).toBe(true);
    expect(Number.isFinite(result.mean)).toBe(true);
    expect(Number.isFinite(result.q1)).toBe(true);
    expect(Number.isFinite(result.q3)).toBe(true);
  });
});

// ============================================================================
// Timing Budgets
// ============================================================================

describe('Timing budgets', () => {
  it('calculateStats(50K) < 500ms', { timeout: 30_000 }, () => {
    const data = generateStressData({
      rowCount: 50000,
      factors: [],
      measurement: { name: 'Value', baseMean: 100, baseStd: 5 },
    });
    const values = data.map(d => d.Value as number);

    const { durationMs } = timedExec(() => calculateStats(values, 120, 80));
    expect(durationMs).toBeLessThan(500);
  });

  it('calculateAnova(50 groups, 5K rows) < 1000ms', { timeout: 30_000 }, () => {
    const data = simpleFactory(5000, 50);

    const { durationMs } = timedExec(() => calculateAnova(data, 'Measurement', 'Group'));
    expect(durationMs).toBeLessThan(1000);
  });

  it('getEtaSquared(50K rows) < 500ms', { timeout: 30_000 }, () => {
    const data = generateStressData({
      rowCount: 50000,
      factors: [{ name: 'Group', levels: 50 }],
      measurement: { name: 'Value', baseMean: 100, baseStd: 5 },
    });

    const { durationMs } = timedExec(() => getEtaSquared(data, 'Group', 'Value'));
    expect(durationMs).toBeLessThan(500);
  });

  it('calculateKDE(10K values) < 1000ms', { timeout: 30_000 }, () => {
    const data = generateStressData({
      rowCount: 10000,
      factors: [],
      measurement: { name: 'Value', baseMean: 100, baseStd: 5 },
    });
    const values = data.map(d => d.Value as number);

    const { result, durationMs } = timedExec(() => calculateKDE(values));
    expect(durationMs).toBeLessThan(1000);
    expect(result.length).toBeGreaterThan(0);
    // KDE should produce a smooth density estimate
    for (const point of result) {
      expect(point.count).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(point.value)).toBe(true);
    }
  });
});

// ============================================================================
// Scenario-Based Tests
// ============================================================================

describe('Scenario-based stress tests', () => {
  it(
    'pharma fill line (10K rows, 200 products) - ANOVA on Shift works',
    { timeout: 30_000 },
    () => {
      const data = pharmaFillLine(10000);

      // Shift has only 3 levels, valid for ANOVA
      const result = calculateAnova(data, 'FillWeight', 'Shift');
      expect(result).not.toBeNull();
      expect(result!.groups).toHaveLength(3);
      // Shift has mean shifts [0, 0.5, 1.0], should show significance
      expect(result!.isSignificant).toBe(true);
    }
  );

  it('beverage filling (5K rows) - 50 products at boundary', { timeout: 30_000 }, () => {
    const data = beverageFilling(5000);

    // With 50 products, this is at the parser's categorical threshold
    const productValues = new Set(data.map(d => d.Product));
    expect(productValues.size).toBe(50);

    // Head has 8 levels, valid factor
    const result = calculateAnova(data, 'Volume_ml', 'Head');
    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(8);
  });
});
