/**
 * Golden Data Tests
 *
 * Verify statistics are correct for known, static datasets from docs/04-cases/.
 * These CSVs have fixed values (not randomly generated), so we can assert
 * exact expected results computed by hand.
 *
 * Coffee washing-station.csv: 30 rows, 3 beds (A/B/C), specs LSL=10 USL=12
 * Packaging fillweights.csv:  120 rows, 3 shifts (Day/Evening/Night)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { DataRow } from '../../types';
import { loadCsv } from './fixtures/loadCsv';
import { calculateStats, calculateAnova, getEtaSquared, calculateRegression } from '../stats';
import { applyFilters, calculateDrillVariation, calculateCategoryTotalSS } from '../variation';

// ============================================================================
// Coffee dataset — washing-station.csv
// ============================================================================

describe('Golden Data: Coffee Washing Station', () => {
  let data: DataRow[];
  const USL = 12;
  const LSL = 10;

  beforeAll(() => {
    data = loadCsv('docs/04-cases/coffee/washing-station.csv');
  });

  it('should load 30 rows with expected columns', () => {
    expect(data).toHaveLength(30);
    expect(Object.keys(data[0])).toEqual(
      expect.arrayContaining(['Batch_ID', 'Drying_Bed', 'Moisture_pct'])
    );
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Overall stats (all 30 rows)
  // --------------------------------------------------------------------------

  describe('overall stats (all 30 rows)', () => {
    it('should calculate correct mean, stdDev, UCL, LCL', () => {
      const values = data.map(r => r.Moisture_pct as number);
      const stats = calculateStats(values, USL, LSL);

      expect(stats.mean).toBeCloseTo(11.8933, 2);
      expect(stats.stdDev).toBeCloseTo(1.0178, 2);
      // UCL/LCL use σ_within (MR̄/d2), not σ_overall
      expect(stats.ucl).toBeCloseTo(13.6817, 1);
      expect(stats.lcl).toBeCloseTo(10.105, 1);
    });

    it('should calculate correct Cp and Cpk', () => {
      const values = data.map(r => r.Moisture_pct as number);
      const stats = calculateStats(values, USL, LSL);

      // Cp/Cpk use σ_within (≈0.596 vs σ_overall ≈1.018)
      // Process is not capable: Cp ≈ 0.56, Cpk ≈ 0.06 (near USL)
      expect(stats.cp).toBeCloseTo(0.5592, 2);
      expect(stats.cpk).toBeCloseTo(0.0596, 2);
    });

    it('should report 33.3% out of spec', () => {
      const values = data.map(r => r.Moisture_pct as number);
      const stats = calculateStats(values, USL, LSL);

      // 10 of 30 values are > USL (all from Bed C)
      expect(stats.outOfSpecPercentage).toBeCloseTo(33.33, 1);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Filter to Bed A (10 rows)
  // --------------------------------------------------------------------------

  describe('filtered to Bed A', () => {
    it('should have 10 rows after filtering', () => {
      const filtered = applyFilters(data, { Drying_Bed: ['A'] });
      expect(filtered).toHaveLength(10);
    });

    it('should calculate correct mean and Cpk', () => {
      const filtered = applyFilters(data, { Drying_Bed: ['A'] });
      const values = filtered.map(r => r.Moisture_pct as number);
      const stats = calculateStats(values, USL, LSL);

      expect(stats.mean).toBeCloseTo(11.05, 2);
      expect(stats.stdDev).toBeCloseTo(0.3028, 2);
      // Bed A Cpk with σ_within ≈ 0.748 (σ_within > σ_overall due to row ordering)
      expect(stats.cpk).toBeCloseTo(0.7476, 2);
      expect(stats.cpk!).toBeGreaterThan(0.5);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Filter to Bed C (10 rows)
  // --------------------------------------------------------------------------

  describe('filtered to Bed C', () => {
    it('should have 10 rows after filtering', () => {
      const filtered = applyFilters(data, { Drying_Bed: ['C'] });
      expect(filtered).toHaveLength(10);
    });

    it('should calculate correct mean and Cpk (failing)', () => {
      const filtered = applyFilters(data, { Drying_Bed: ['C'] });
      const values = filtered.map(r => r.Moisture_pct as number);
      const stats = calculateStats(values, USL, LSL);

      expect(stats.mean).toBeCloseTo(13.18, 2);
      expect(stats.stdDev).toBeCloseTo(0.5329, 2);
      // Bed C is far above USL: Cpk is negative (σ_within ≈ 0.739)
      expect(stats.cpk).toBeCloseTo(-0.5324, 2);
      expect(stats.cpk!).toBeLessThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: ANOVA by Drying_Bed (all data)
  // --------------------------------------------------------------------------

  describe('ANOVA by Drying_Bed', () => {
    it('should detect significant difference with high eta-squared', () => {
      const result = calculateAnova(data, 'Moisture_pct', 'Drying_Bed');

      expect(result).not.toBeNull();
      expect(result!.isSignificant).toBe(true);
      // η² ≈ 0.853 — Drying_Bed explains 85% of variation
      expect(result!.etaSquared).toBeCloseTo(0.8533, 2);
      expect(result!.fStatistic).toBeCloseTo(78.54, 0);
      expect(result!.pValue).toBeLessThan(0.001);
    });

    it('should have correct group stats', () => {
      const result = calculateAnova(data, 'Moisture_pct', 'Drying_Bed');

      const groupA = result!.groups.find(g => g.name === 'A');
      const groupB = result!.groups.find(g => g.name === 'B');
      const groupC = result!.groups.find(g => g.name === 'C');

      expect(groupA).toBeDefined();
      expect(groupA!.n).toBe(10);
      expect(groupA!.mean).toBeCloseTo(11.05, 2);

      expect(groupB).toBeDefined();
      expect(groupB!.n).toBe(10);
      expect(groupB!.mean).toBeCloseTo(11.45, 2);

      expect(groupC).toBeDefined();
      expect(groupC!.n).toBe(10);
      expect(groupC!.mean).toBeCloseTo(13.18, 2);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: ANOVA on Bed A+B only (similar beds → low η²)
  // --------------------------------------------------------------------------

  describe('ANOVA on Bed A+B subset', () => {
    it('should show lower eta-squared (similar beds)', () => {
      const subset = applyFilters(data, { Drying_Bed: ['A', 'B'] });
      expect(subset).toHaveLength(20);

      const result = calculateAnova(subset, 'Moisture_pct', 'Drying_Bed');

      expect(result).not.toBeNull();
      // η² ≈ 0.30 — moderate, much lower than 0.85 with Bed C
      expect(result!.etaSquared).toBeCloseTo(0.3019, 2);
      expect(result!.etaSquared).toBeLessThan(0.5);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Drill variation (cumulative Total SS scope)
  // --------------------------------------------------------------------------

  describe('drill variation', () => {
    it('should calculate Total SS scope for Bed C drill', () => {
      const result = calculateDrillVariation(data, { Drying_Bed: ['C'] }, 'Moisture_pct');

      expect(result).not.toBeNull();
      expect(result!.levels).toHaveLength(2); // root + 1 drill level

      // Root level is 100%
      expect(result!.levels[0].cumulativeVariationPct).toBe(100);

      // Bed C's Total SS contribution (captures mean shift + spread)
      // Bed C has the highest moisture → largest deviations from overall mean
      expect(result!.levels[1].localVariationPct).toBeGreaterThan(30);
      expect(result!.levels[1].localVariationPct).toBeLessThanOrEqual(100);
      expect(result!.cumulativeVariationPct).toBeCloseTo(result!.levels[1].localVariationPct, 5);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Category Total SS contributions
  // --------------------------------------------------------------------------

  describe('category contributions', () => {
    it('should show Bed C dominating total SS', () => {
      const result = calculateCategoryTotalSS(data, 'Drying_Bed', 'Moisture_pct');

      expect(result).not.toBeNull();

      const pctA = result!.contributions.get('A');
      const pctB = result!.contributions.get('B');
      const pctC = result!.contributions.get('C');

      expect(pctA).toBeDefined();
      expect(pctB).toBeDefined();
      expect(pctC).toBeDefined();

      // Bed C dominates with ~63.6% of total SS
      expect(pctC!).toBeCloseTo(63.62, 0);
      // Bed A ≈ 26.4%, Bed B ≈ 10.0%
      expect(pctA!).toBeCloseTo(26.42, 0);
      expect(pctB!).toBeCloseTo(9.96, 0);

      // Sum should be 100%
      expect(pctA! + pctB! + pctC!).toBeCloseTo(100, 1);
    });

    it('should show high between-group variation (η²)', () => {
      const etaSq = getEtaSquared(data, 'Drying_Bed', 'Moisture_pct');
      expect(etaSq).toBeCloseTo(0.8533, 2);
    });
  });
});

// ============================================================================
// Packaging dataset — fillweights.csv
// ============================================================================

describe('Golden Data: Packaging Fill Weights', () => {
  let data: DataRow[];

  beforeAll(() => {
    data = loadCsv('docs/04-cases/packaging/fillweights.csv');
  });

  it('should load 120 rows with expected columns', () => {
    expect(data).toHaveLength(120);
    expect(Object.keys(data[0])).toEqual(
      expect.arrayContaining(['Sequence', 'Shift', 'Fill_Weight_g'])
    );
  });

  describe('overall stats', () => {
    it('should calculate correct mean and stdDev', () => {
      const values = data.map(r => r.Fill_Weight_g as number);
      const stats = calculateStats(values);

      expect(stats.mean).toBeCloseTo(497.5375, 2);
      expect(stats.stdDev).toBeCloseTo(1.6446, 2);
    });
  });

  describe('ANOVA by Shift', () => {
    it('should detect significant shift effect', () => {
      const result = calculateAnova(data, 'Fill_Weight_g', 'Shift');

      expect(result).not.toBeNull();
      expect(result!.isSignificant).toBe(true);
      // η² ≈ 0.666 — Shift explains 67% of variation
      expect(result!.etaSquared).toBeCloseTo(0.6658, 2);
    });

    it('should identify Night shift as different', () => {
      const result = calculateAnova(data, 'Fill_Weight_g', 'Shift');

      const nightGroup = result!.groups.find(g => g.name === 'Night');
      const dayGroup = result!.groups.find(g => g.name === 'Day');

      expect(nightGroup).toBeDefined();
      expect(dayGroup).toBeDefined();

      // Night shift runs lower (≈495.65) vs Day (≈498.60)
      expect(nightGroup!.mean).toBeCloseTo(495.6525, 2);
      expect(dayGroup!.mean).toBeCloseTo(498.5975, 2);
      expect(nightGroup!.mean).toBeLessThan(dayGroup!.mean);
    });
  });

  describe('filter then ANOVA', () => {
    it('should show lower η² when Night excluded', () => {
      const subset = applyFilters(data, { Shift: ['Day', 'Evening'] });
      expect(subset).toHaveLength(80);

      const result = calculateAnova(subset, 'Fill_Weight_g', 'Shift');

      expect(result).not.toBeNull();
      // Day and Evening are similar → low η²
      expect(result!.etaSquared).toBeLessThan(0.1);
    });
  });

  describe('drill variation', () => {
    it('should calculate Total SS scope for Shift drill', () => {
      const result = calculateDrillVariation(data, { Shift: ['Night'] }, 'Fill_Weight_g');

      expect(result).not.toBeNull();
      // Night shift's Total SS contribution
      expect(result!.cumulativeVariationPct).toBeGreaterThan(0);
      expect(result!.cumulativeVariationPct).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================================
// Cross-dataset: Filter→Stats pipeline verification
// ============================================================================

describe('Golden Data: Pipeline Verification', () => {
  let coffeeData: DataRow[];

  beforeAll(() => {
    coffeeData = loadCsv('docs/04-cases/coffee/washing-station.csv');
  });

  it('should match: filter → stats = golden values', () => {
    // This tests the full pipeline: load CSV → filter → calculate stats → verify
    const filtered = applyFilters(coffeeData, { Drying_Bed: ['A'] });
    const values = filtered.map(r => r.Moisture_pct as number);
    const stats = calculateStats(values, 12, 10);

    // Same values as the dedicated Bed A test above — confirms consistency
    expect(stats.mean).toBeCloseTo(11.05, 2);
    expect(stats.cpk).toBeCloseTo(0.7476, 2);
  });

  it('should show stats worsen when including Bed C', () => {
    // Pipeline test: compare stats with and without the problematic bed
    const withoutC = applyFilters(coffeeData, { Drying_Bed: ['A', 'B'] });
    const withC = coffeeData;

    const statsWithout = calculateStats(
      withoutC.map(r => r.Moisture_pct as number),
      12,
      10
    );
    const statsWith = calculateStats(
      withC.map(r => r.Moisture_pct as number),
      12,
      10
    );

    // Including Bed C worsens all metrics
    expect(statsWith.cpk!).toBeLessThan(statsWithout.cpk!);
    expect(statsWith.stdDev).toBeGreaterThan(statsWithout.stdDev);
    expect(statsWith.outOfSpecPercentage).toBeGreaterThan(statsWithout.outOfSpecPercentage);
  });

  it('should compute eta-squared consistently via two paths', () => {
    // Path 1: getEtaSquared directly
    const eta1 = getEtaSquared(coffeeData, 'Drying_Bed', 'Moisture_pct');

    // Path 2: calculateAnova
    const anova = calculateAnova(coffeeData, 'Moisture_pct', 'Drying_Bed');

    // Both should give the same η²
    expect(eta1).toBeCloseTo(anova!.etaSquared, 6);
  });
});

// ============================================================================
// Avocado dataset — coating-regression.csv
// ============================================================================

describe('Golden Data: Avocado Coating Regression', () => {
  let data: DataRow[];

  beforeAll(() => {
    data = loadCsv('docs/04-cases/avocado/coating-regression.csv');
  });

  it('should load data with expected columns', () => {
    expect(data.length).toBeGreaterThanOrEqual(10);
    expect(Object.keys(data[0])).toEqual(
      expect.arrayContaining(['Coating_ml_kg', 'Shelf_Life_Days'])
    );
  });

  it('should find significant linear relationship (Coating → Shelf Life)', () => {
    const result = calculateRegression(data, 'Coating_ml_kg', 'Shelf_Life_Days');

    expect(result).not.toBeNull();
    expect(result!.linear.isSignificant).toBe(true);
    expect(result!.linear.slope).toBeGreaterThan(0); // more coating → longer shelf life
    expect(result!.linear.rSquared).toBeGreaterThan(0.5);
    expect(result!.recommendedFit).not.toBe('none');
  });

  it('should have strength rating ≥ 3 (moderate to strong)', () => {
    const result = calculateRegression(data, 'Coating_ml_kg', 'Shelf_Life_Days');

    expect(result).not.toBeNull();
    expect(result!.strengthRating).toBeGreaterThanOrEqual(3);
  });
});
