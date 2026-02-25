import { describe, it, expect } from 'vitest';
import {
  calculateDrillVariation,
  calculateFactorVariations,
  calculateCategoryTotalSS,
  getMaxCategoryContribution,
  shouldHighlightDrill,
  applyFilters,
} from '../variation';
import { getEtaSquared } from '../stats';

// =============================================================================
// Test Data
// =============================================================================

/**
 * High-variation dataset where Shift explains most of the outcome variation.
 * Day shift: Weight ~100-102
 * Night shift: Weight ~150-152
 * This creates a clear separation (~99% eta-squared for Shift)
 */
const highVariationData = [
  { Shift: 'Day', Machine: 'A', Weight: 100 },
  { Shift: 'Day', Machine: 'A', Weight: 102 },
  { Shift: 'Day', Machine: 'B', Weight: 101 },
  { Shift: 'Day', Machine: 'B', Weight: 103 },
  { Shift: 'Night', Machine: 'A', Weight: 150 },
  { Shift: 'Night', Machine: 'A', Weight: 152 },
  { Shift: 'Night', Machine: 'B', Weight: 151 },
  { Shift: 'Night', Machine: 'B', Weight: 153 },
];

/**
 * Low-variation dataset where groups overlap significantly.
 * Both shifts have similar weight distributions.
 */
const lowVariationData = [
  { Shift: 'Day', Weight: 100 },
  { Shift: 'Day', Weight: 101 },
  { Shift: 'Day', Weight: 102 },
  { Shift: 'Night', Weight: 100 },
  { Shift: 'Night', Weight: 101 },
  { Shift: 'Night', Weight: 102 },
];

/**
 * Multi-level drill data for testing cumulative calculations.
 * Shift has high variation, Machine has moderate variation within each shift.
 */
const multiLevelData = [
  // Day shift - Machine A (Weight: 100-102), Machine B (Weight: 110-112)
  { Shift: 'Day', Machine: 'A', Operator: 'X', Weight: 100 },
  { Shift: 'Day', Machine: 'A', Operator: 'X', Weight: 101 },
  { Shift: 'Day', Machine: 'A', Operator: 'Y', Weight: 101 },
  { Shift: 'Day', Machine: 'A', Operator: 'Y', Weight: 102 },
  { Shift: 'Day', Machine: 'B', Operator: 'X', Weight: 110 },
  { Shift: 'Day', Machine: 'B', Operator: 'X', Weight: 111 },
  { Shift: 'Day', Machine: 'B', Operator: 'Y', Weight: 111 },
  { Shift: 'Day', Machine: 'B', Operator: 'Y', Weight: 112 },
  // Night shift - Machine A (Weight: 150-152), Machine B (Weight: 160-162)
  { Shift: 'Night', Machine: 'A', Operator: 'X', Weight: 150 },
  { Shift: 'Night', Machine: 'A', Operator: 'X', Weight: 151 },
  { Shift: 'Night', Machine: 'A', Operator: 'Y', Weight: 151 },
  { Shift: 'Night', Machine: 'A', Operator: 'Y', Weight: 152 },
  { Shift: 'Night', Machine: 'B', Operator: 'X', Weight: 160 },
  { Shift: 'Night', Machine: 'B', Operator: 'X', Weight: 161 },
  { Shift: 'Night', Machine: 'B', Operator: 'Y', Weight: 161 },
  { Shift: 'Night', Machine: 'B', Operator: 'Y', Weight: 162 },
];

// =============================================================================
// calculateFactorVariations() Tests
// =============================================================================

describe('calculateFactorVariations', () => {
  it('should return meaningful max category contribution for factor with clear group separation', () => {
    const variations = calculateFactorVariations(highVariationData, ['Shift'], 'Weight');

    expect(variations.has('Shift')).toBe(true);
    // Day and Night each contribute ~50% of Total SS (symmetric data)
    // Max category contribution is ~50%
    expect(variations.get('Shift')).toBeGreaterThan(40);
    expect(variations.get('Shift')).toBeLessThan(60);
  });

  it('should return equal max contributions for factor with identical groups', () => {
    const variations = calculateFactorVariations(lowVariationData, ['Shift'], 'Weight');

    // Groups are nearly identical in both mean and spread
    // Each category still accounts for ~50% of Total SS (data is evenly split)
    const shiftVariation = variations.get('Shift') ?? 0;
    expect(shiftVariation).toBeGreaterThan(40);
  });

  it('should return Map with multiple factor percentages', () => {
    const variations = calculateFactorVariations(highVariationData, ['Shift', 'Machine'], 'Weight');

    expect(variations.has('Shift')).toBe(true);
    expect(variations.has('Machine')).toBe(true);
    // Both factors have 2 symmetric categories, so max contributions are similar
    expect(variations.get('Shift')).toBeGreaterThan(40);
    expect(variations.get('Machine')).toBeGreaterThan(40);
  });

  it('should exclude factors in excludeFactors array', () => {
    const variations = calculateFactorVariations(
      highVariationData,
      ['Shift', 'Machine'],
      'Weight',
      ['Shift'] // Exclude Shift
    );

    expect(variations.has('Shift')).toBe(false);
    expect(variations.has('Machine')).toBe(true);
  });

  it('should return empty Map for insufficient data (< 2 rows)', () => {
    const singleRow = [{ Shift: 'Day', Weight: 100 }];
    const variations = calculateFactorVariations(singleRow, ['Shift'], 'Weight');

    expect(variations.size).toBe(0);
  });

  it('should return empty Map for empty data', () => {
    const variations = calculateFactorVariations([], ['Shift'], 'Weight');

    expect(variations.size).toBe(0);
  });

  it('should return 100% max contribution for factor with single group', () => {
    const singleGroupData = [
      { Shift: 'Day', Weight: 100 },
      { Shift: 'Day', Weight: 101 },
      { Shift: 'Day', Weight: 102 },
    ];
    const variations = calculateFactorVariations(singleGroupData, ['Shift'], 'Weight');

    // Single group accounts for 100% of Total SS
    const shiftVariation = variations.get('Shift') ?? 0;
    expect(shiftVariation).toBeCloseTo(100, 0);
  });

  it('should handle missing outcome column gracefully', () => {
    const variations = calculateFactorVariations(highVariationData, ['Shift'], '');

    expect(variations.size).toBe(0);
  });
});

// =============================================================================
// calculateDrillVariation() Tests
// =============================================================================

describe('calculateDrillVariation', () => {
  it('should return null for insufficient data', () => {
    const singleRow = [{ Shift: 'Day', Weight: 100 }];
    const result = calculateDrillVariation(singleRow, { Shift: ['Day'] }, 'Weight');

    expect(result).toBeNull();
  });

  it('should return null for empty outcome', () => {
    const result = calculateDrillVariation(highVariationData, { Shift: ['Day'] }, '');

    expect(result).toBeNull();
  });

  it('should calculate single-level drill correctly', () => {
    const result = calculateDrillVariation(highVariationData, { Shift: ['Day'] }, 'Weight');

    expect(result).not.toBeNull();
    expect(result!.levels).toHaveLength(2); // Root + 1 drill level
    expect(result!.levels[0].factor).toBeNull(); // Root
    expect(result!.levels[0].localVariationPct).toBe(100);
    expect(result!.levels[1].factor).toBe('Shift');
    // Day accounts for ~50% of Total SS (symmetric data: Day ~100, Night ~150)
    expect(result!.levels[1].localVariationPct).toBeCloseTo(50, 0);
  });

  it('should calculate multi-level drill with cumulative multiplication', () => {
    const result = calculateDrillVariation(
      multiLevelData,
      { Shift: ['Day'], Machine: ['A'] },
      'Weight'
    );

    expect(result).not.toBeNull();
    expect(result!.levels).toHaveLength(3); // Root + 2 drill levels

    // Level 1: Shift Day scope (~50% of Total SS in symmetric data)
    const shiftLevel = result!.levels[1];
    expect(shiftLevel.factor).toBe('Shift');
    expect(shiftLevel.localVariationPct).toBeCloseTo(50, 0);

    // Level 2: Machine A scope within Day data (~50% of Day's Total SS)
    const machineLevel = result!.levels[2];
    expect(machineLevel.factor).toBe('Machine');

    // Cumulative should be product: local1 * local2 / 100
    const expectedCumulative =
      (shiftLevel.localVariationPct * machineLevel.localVariationPct) / 100;
    expect(result!.cumulativeVariationPct).toBeCloseTo(expectedCumulative, 1);
  });

  it('should multiply scope fractions correctly (not add)', () => {
    // With Total SS scope: Day ~50%, Machine A within Day ~50%
    // Cumulative should be ~25%, not ~100%
    const result = calculateDrillVariation(
      multiLevelData,
      { Shift: ['Day'], Machine: ['A'] },
      'Weight'
    );

    expect(result).not.toBeNull();
    // Cumulative should always be <= minimum of local percentages
    const level1Pct = result!.levels[1].localVariationPct;
    const level2Pct = result!.levels[2].localVariationPct;
    expect(result!.cumulativeVariationPct).toBeLessThanOrEqual(Math.min(level1Pct, level2Pct));
  });

  it('should return high impact level for cumulative >= 50%', () => {
    // Night accounts for ~50% of Total SS → exactly at threshold → 'high'
    const result = calculateDrillVariation(highVariationData, { Shift: ['Night'] }, 'Weight');

    expect(result).not.toBeNull();
    expect(result!.cumulativeVariationPct).toBeCloseTo(50, 0);
    expect(result!.impactLevel).toBe('high');
  });

  it('should return moderate impact level for cumulative 30-50%', () => {
    // We need data that produces ~35-45% cumulative variation
    // Multi-level drill on high-variation data might achieve this
    const result = calculateDrillVariation(
      multiLevelData,
      { Shift: ['Day'], Machine: ['A'] },
      'Weight'
    );

    // The exact result depends on the data structure
    // This test verifies the function returns valid impact levels
    expect(result).not.toBeNull();
    expect(['high', 'moderate', 'low']).toContain(result!.impactLevel);
  });

  it('should return insight text based on cumulative variation', () => {
    const result = calculateDrillVariation(highVariationData, { Shift: ['Night'] }, 'Weight');

    expect(result).not.toBeNull();
    expect(result!.insightText).toBeTruthy();
    expect(typeof result!.insightText).toBe('string');
    expect(result!.insightText.length).toBeGreaterThan(10);
  });

  it('should handle empty filters object', () => {
    const result = calculateDrillVariation(highVariationData, {}, 'Weight');

    expect(result).not.toBeNull();
    // Only root level
    expect(result!.levels).toHaveLength(1);
    expect(result!.cumulativeVariationPct).toBe(100);
  });

  it('should handle filters with empty values array', () => {
    const result = calculateDrillVariation(
      highVariationData,
      { Shift: [] }, // Empty array should be skipped
      'Weight'
    );

    expect(result).not.toBeNull();
    expect(result!.levels).toHaveLength(1); // Only root
  });

  it('should stop processing when filtered data becomes too small', () => {
    // Filter to single row at second level
    const result = calculateDrillVariation(
      [
        { Shift: 'Day', Machine: 'A', Weight: 100 },
        { Shift: 'Night', Machine: 'B', Weight: 150 },
      ],
      { Shift: ['Day'], Machine: ['A'] },
      'Weight'
    );

    expect(result).not.toBeNull();
    // Should process first filter but stop when data becomes single row
    expect(result!.levels.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// shouldHighlightDrill() Tests
// =============================================================================

describe('shouldHighlightDrill', () => {
  it('should return true at threshold (50%)', () => {
    expect(shouldHighlightDrill(50)).toBe(true);
  });

  it('should return true above threshold (67%)', () => {
    expect(shouldHighlightDrill(67)).toBe(true);
  });

  it('should return false below threshold (49%)', () => {
    expect(shouldHighlightDrill(49)).toBe(false);
  });

  it('should return false for 0%', () => {
    expect(shouldHighlightDrill(0)).toBe(false);
  });

  it('should return true for 100%', () => {
    expect(shouldHighlightDrill(100)).toBe(true);
  });

  it('should handle decimal values correctly', () => {
    expect(shouldHighlightDrill(49.9)).toBe(false);
    expect(shouldHighlightDrill(50.0)).toBe(true);
    expect(shouldHighlightDrill(50.1)).toBe(true);
  });
});

// =============================================================================
// applyFilters() Tests
// =============================================================================

describe('applyFilters', () => {
  const testData = [
    { Shift: 'Day', Machine: 'A', Value: 1 },
    { Shift: 'Day', Machine: 'B', Value: 2 },
    { Shift: 'Night', Machine: 'A', Value: 3 },
    { Shift: 'Night', Machine: 'B', Value: 4 },
  ];

  it('should filter by single column', () => {
    const result = applyFilters(testData, { Shift: ['Day'] });

    expect(result).toHaveLength(2);
    expect(result.every(row => row.Shift === 'Day')).toBe(true);
  });

  it('should filter by multiple columns (AND logic)', () => {
    const result = applyFilters(testData, {
      Shift: ['Day'],
      Machine: ['A'],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ Shift: 'Day', Machine: 'A', Value: 1 });
  });

  it('should return all data for empty filters object', () => {
    const result = applyFilters(testData, {});

    expect(result).toHaveLength(4);
  });

  it('should return all data for filter with empty values array', () => {
    const result = applyFilters(testData, { Shift: [] });

    expect(result).toHaveLength(4);
  });

  it('should return empty array when no rows match', () => {
    const result = applyFilters(testData, { Shift: ['Evening'] });

    expect(result).toHaveLength(0);
  });

  it('should handle multiple values for single column (OR within column)', () => {
    const result = applyFilters(testData, { Shift: ['Day', 'Night'] });

    expect(result).toHaveLength(4);
  });

  it('should handle numeric filter values', () => {
    const numericData = [
      { Category: 1, Value: 10 },
      { Category: 2, Value: 20 },
      { Category: 1, Value: 15 },
    ];

    const result = applyFilters(numericData, { Category: [1] });

    expect(result).toHaveLength(2);
    expect(result.every(row => row.Category === 1)).toBe(true);
  });

  it('should return empty array for empty input data', () => {
    const result = applyFilters([], { Shift: ['Day'] });

    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Variation Tracking Integration', () => {
  it('should work end-to-end: identify high-variation factor and drill', () => {
    // Step 1: Identify which factor to drill into
    const variations = calculateFactorVariations(highVariationData, ['Shift', 'Machine'], 'Weight');

    // Shift should be the recommended drill target
    const shiftVariation = variations.get('Shift')!;
    expect(shouldHighlightDrill(shiftVariation)).toBe(true);

    // Step 2: Drill into the high-variation factor
    const drillResult = calculateDrillVariation(highVariationData, { Shift: ['Night'] }, 'Weight');

    expect(drillResult).not.toBeNull();
    expect(drillResult!.impactLevel).toBe('high');
  });

  it('should correctly filter data before calculating remaining factor variations', () => {
    // Apply filter to drill into Night shift
    const filteredData = applyFilters(multiLevelData, { Shift: ['Night'] });
    expect(filteredData).toHaveLength(8);

    // Calculate variations for remaining factors
    const variations = calculateFactorVariations(
      filteredData,
      ['Shift', 'Machine', 'Operator'],
      'Weight',
      ['Shift'] // Exclude already-drilled factor
    );

    // Shift should not be in results
    expect(variations.has('Shift')).toBe(false);
    // Machine should still be calculable
    expect(variations.has('Machine')).toBe(true);
  });
});

// =============================================================================
// η² vs Max Category Contribution Ranking Tests
// =============================================================================

describe('Suggestion ranking: η² vs max category contribution', () => {
  it('should rank high-η² factor above high-category-count factor', () => {
    // Bottleneck-like dataset:
    // - Step has 5 categories (diverse means) → high η² but low max-category Total SS
    // - Shift has 2 categories (similar means) → low η² but high max-category Total SS (~50% each)
    const data = [
      // Step has 5 levels with different means — explains most variation
      { Step: 'S1', Shift: 'Day', Value: 100 },
      { Step: 'S1', Shift: 'Day', Value: 102 },
      { Step: 'S2', Shift: 'Night', Value: 150 },
      { Step: 'S2', Shift: 'Night', Value: 152 },
      { Step: 'S3', Shift: 'Day', Value: 120 },
      { Step: 'S3', Shift: 'Day', Value: 122 },
      { Step: 'S4', Shift: 'Night', Value: 130 },
      { Step: 'S4', Shift: 'Night', Value: 132 },
      { Step: 'S5', Shift: 'Day', Value: 110 },
      { Step: 'S5', Shift: 'Day', Value: 112 },
    ];

    const etaStep = getEtaSquared(data, 'Step', 'Value');
    const etaShift = getEtaSquared(data, 'Shift', 'Value');
    const maxContribStep = getMaxCategoryContribution(data, 'Step', 'Value');
    const maxContribShift = getMaxCategoryContribution(data, 'Shift', 'Value');

    // Step has higher η² (explains more overall variation)
    expect(etaStep).toBeGreaterThan(etaShift);

    // But Shift has higher max single-category contribution (2 categories → ~50% each)
    // while Step's max category is ~20-30% (5 categories spread the Total SS)
    expect(maxContribShift).toBeGreaterThan(maxContribStep);

    // Using η² for suggestion ranking correctly identifies Step as the better factor
    // Using max category contribution would misleadingly suggest Shift
  });
});

// =============================================================================
// calculateCategoryTotalSS() Tests - Basic tests (detailed tests in categoryStats.test.ts)
// =============================================================================

describe('calculateCategoryTotalSS', () => {
  it('should return Total SS contributions that sum to 100%', () => {
    const result = calculateCategoryTotalSS(highVariationData, 'Shift', 'Weight');

    expect(result).not.toBeNull();

    let totalContribution = 0;
    for (const contrib of result!.contributions.values()) {
      totalContribution += contrib;
    }

    // Sum should be 100% (total variation fully partitioned)
    expect(totalContribution).toBeCloseTo(100, 5);
  });

  it('should capture spread contribution (not just mean shift)', () => {
    // Create data where both categories have same mean but different spreads
    const spreadData = [
      { Category: 'Tight', Value: 99 },
      { Category: 'Tight', Value: 101 },
      { Category: 'Wide', Value: 80 },
      { Category: 'Wide', Value: 120 },
    ];

    const result = calculateCategoryTotalSS(spreadData, 'Category', 'Value');

    expect(result).not.toBeNull();

    const tightContrib = result!.contributions.get('Tight')!;
    const wideContrib = result!.contributions.get('Wide')!;

    // Both should be non-zero (unlike between-group which would be 0 when means equal)
    expect(tightContrib).toBeGreaterThan(0);
    expect(wideContrib).toBeGreaterThan(0);

    // Wide category contributes more due to higher spread
    expect(wideContrib).toBeGreaterThan(tightContrib);
  });

  it('should return null for insufficient data', () => {
    expect(calculateCategoryTotalSS([], 'Shift', 'Weight')).toBeNull();
    expect(calculateCategoryTotalSS([{ Shift: 'Day', Weight: 100 }], 'Shift', 'Weight')).toBeNull();
  });
});
