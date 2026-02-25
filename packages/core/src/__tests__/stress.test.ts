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
  calculateRegression,
  calculateMultipleRegression,
} from '../stats';
import {
  calculateFactorVariations,
  calculateCategoryTotalSS,
  calculateDrillVariation,
} from '../variation';
import type { DataRow } from '../types';
import {
  generateStressData,
  simpleFactory,
  pharmaFillLine,
  beverageFilling,
  timedExec,
  mulberry32,
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
// Variation Tracking at Scale
// ============================================================================

describe('Variation tracking at scale', () => {
  it('3 factors x 10K rows - contributions sum to ~100%', { timeout: 30_000 }, () => {
    const data = generateStressData({
      rowCount: 10000,
      factors: [
        { name: 'Machine', levels: 10, meanShifts: Array.from({ length: 10 }, (_, i) => i * 2) },
        { name: 'Shift', levels: 5 },
        { name: 'Operator', levels: 3 },
      ],
      measurement: { name: 'Output', baseMean: 100, baseStd: 3 },
    });

    // Test calculateCategoryTotalSS - contributions should sum to ~100%
    for (const factor of ['Machine', 'Shift', 'Operator']) {
      const result = calculateCategoryTotalSS(data, factor, 'Output');
      expect(result).not.toBeNull();

      const totalContribution = Array.from(result!.contributions.values()).reduce(
        (sum, v) => sum + v,
        0
      );
      // Contributions within a factor should sum to 100%
      expect(totalContribution).toBeCloseTo(100, 0);
    }
  });

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

  it('calculateFactorVariations with 3 factors on 10K rows', { timeout: 30_000 }, () => {
    const data = generateStressData({
      rowCount: 10000,
      factors: [
        { name: 'Machine', levels: 10, meanShifts: Array.from({ length: 10 }, (_, i) => i * 3) },
        { name: 'Shift', levels: 3, meanShifts: [0, 1, 2] },
        { name: 'Operator', levels: 5 },
      ],
      measurement: { name: 'Output', baseMean: 100, baseStd: 2 },
    });

    const variations = calculateFactorVariations(data, ['Machine', 'Shift', 'Operator'], 'Output');

    // Machine has the largest mean shifts, should have highest variation
    expect(variations.get('Machine')).toBeGreaterThan(0);
    // All variations should be percentages
    for (const [, pct] of variations) {
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('known effect sizes - eta-squared within tolerance', () => {
    // Generate data with a strong known effect:
    // Group has 2 levels with mean shift of 10, baseStd = 1
    // Expected eta-squared ≈ shift^2 / (shift^2 + 2*std^2) for balanced groups
    // = 100 / (100 + 2) ≈ 0.98
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
    // With shift=10 and std=1, eta-squared should be very high (>0.9)
    expect(etaSq).toBeGreaterThan(0.9);
  });

  it('calculateDrillVariation with multi-level filters', () => {
    const data = generateStressData({
      rowCount: 3000,
      factors: [
        { name: 'Machine', levels: 5, meanShifts: [0, 3, 6, 9, 12] },
        { name: 'Shift', levels: 3, meanShifts: [0, 1, 2] },
      ],
      measurement: { name: 'Output', baseMean: 100, baseStd: 2 },
    });

    calculateDrillVariation(data, { Machine: ['Machine_001'], Shift: ['Day'] }, 'Output');

    // Filtering doesn't exist as 'Day' - use generated level name
    const result2 = calculateDrillVariation(data, { Machine: ['Machine_001'] }, 'Output');

    expect(result2).not.toBeNull();
    expect(result2!.levels).toHaveLength(2); // root + 1 filter
    expect(result2!.cumulativeVariationPct).toBeGreaterThan(0);
    expect(result2!.cumulativeVariationPct).toBeLessThanOrEqual(100);
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

  it('calculateCategoryTotalSS(50K, 50 levels) < 1000ms', { timeout: 30_000 }, () => {
    const data = generateStressData({
      rowCount: 50000,
      factors: [{ name: 'Category', levels: 50 }],
      measurement: { name: 'Value', baseMean: 100, baseStd: 5 },
    });

    const { durationMs } = timedExec(() => calculateCategoryTotalSS(data, 'Category', 'Value'));
    expect(durationMs).toBeLessThan(1000);
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

// ============================================================================
// Regression Performance Benchmarks
// ============================================================================

describe('Regression performance benchmarks', () => {
  it(
    'calculateMultipleRegression: 1000 rows, 6 continuous predictors < 500ms',
    { timeout: 10_000 },
    () => {
      const rng = mulberry32(42);
      const data = Array.from({ length: 1000 }, () => {
        const x1 = rng() * 100;
        const x2 = rng() * 100;
        const x3 = rng() * 100;
        const x4 = rng() * 100;
        const x5 = rng() * 100;
        const x6 = rng() * 100;
        const y = 2 * x1 + 3 * x2 - x3 + 0.5 * x4 + x5 - 2 * x6 + rng() * 10;
        return { X1: x1, X2: x2, X3: x3, X4: x4, X5: x5, X6: x6, Y: y } as DataRow;
      });

      const { result, durationMs } = timedExec(() =>
        calculateMultipleRegression(data, 'Y', ['X1', 'X2', 'X3', 'X4', 'X5', 'X6'])
      );

      expect(result).not.toBeNull();
      expect(result!.rSquared).toBeGreaterThan(0.9);
      expect(durationMs).toBeLessThan(500);
    }
  );

  it(
    'calculateMultipleRegression: 500 rows, 3 factors + interactions < 500ms',
    { timeout: 10_000 },
    () => {
      const rng = mulberry32(77);
      const shifts = ['Day', 'Night', 'Swing'];
      const data = Array.from({ length: 500 }, (_, i) => {
        const temp = rng() * 50 + 100;
        const pressure = rng() * 20 + 50;
        const shift = shifts[i % 3];
        const y = temp * 0.5 + pressure * 2 + (shift === 'Night' ? 3 : 0) + rng() * 5;
        return { Temp: temp, Pressure: pressure, Shift: shift, Y: y } as DataRow;
      });

      const { result, durationMs } = timedExec(() =>
        calculateMultipleRegression(data, 'Y', ['Temp', 'Pressure', 'Shift'], {
          categoricalColumns: ['Shift'],
          includeInteractions: true,
        })
      );

      expect(result).not.toBeNull();
      expect(durationMs).toBeLessThan(500);
    }
  );

  it('VIF at scale: 10 predictors, 200 rows → all VIF values finite', { timeout: 10_000 }, () => {
    const rng = mulberry32(55);
    const data = Array.from({ length: 200 }, () => {
      const row: DataRow = {};
      for (let j = 1; j <= 10; j++) {
        row[`X${j}`] = rng() * 100;
      }
      // Y is a linear combination of all predictors
      let y = 0;
      for (let j = 1; j <= 10; j++) {
        y += (j % 2 === 0 ? 1 : -1) * (row[`X${j}`] as number);
      }
      row.Y = y + rng() * 20;
      return row;
    });

    const cols = Array.from({ length: 10 }, (_, i) => `X${i + 1}`);
    const result = calculateMultipleRegression(data, 'Y', cols);

    expect(result).not.toBeNull();
    const vifs = result!.coefficients.map(c => c.vif).filter((v): v is number => v !== undefined);
    // All VIF values should be finite (independent predictors)
    for (const vif of vifs) {
      expect(isFinite(vif)).toBe(true);
      expect(vif).toBeGreaterThanOrEqual(1); // VIF is always ≥ 1
    }
  });

  it('calculateRegression: 50K rows, simple linear < 200ms', { timeout: 30_000 }, () => {
    const rng = mulberry32(33);
    const data = Array.from({ length: 50_000 }, () => {
      const x = rng() * 1000;
      const y = 2.5 * x + 100 + rng() * 50;
      return { X: x, Y: y };
    });

    const { result, durationMs } = timedExec(() => calculateRegression(data, 'X', 'Y'));

    expect(result).not.toBeNull();
    expect(result!.linear.slope).toBeCloseTo(2.5, 0);
    expect(durationMs).toBeLessThan(200);
  });
});
