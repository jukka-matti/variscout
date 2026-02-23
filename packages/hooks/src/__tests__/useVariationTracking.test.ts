/**
 * Tests for useVariationTracking hook
 *
 * Tests the hook's filterChipData computation, breadcrumb enhancement,
 * and impact level classification. Uses synthetic data with known
 * factor structure (same pattern as variation.test.ts).
 *
 * IMPORTANT: All props passed to useVariationTracking via renderHook must use
 * stable references (module-level constants). Inline arrays create new references
 * on every render, causing infinite effect loops when state changes trigger re-renders.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVariationTracking } from '../useVariationTracking';
import { createFilterAction, type FilterAction } from '@variscout/core';

// =============================================================================
// Test Data
// =============================================================================

/**
 * High-variation dataset where Machine explains most of the outcome variation.
 * Machine A: Weight ~10 (10,11,12)
 * Machine B: Weight ~50 (50,51,52)
 * Machine C: Weight ~100 (100,101,102)
 * Shift has minimal effect.
 */
const testData = [
  { Machine: 'A', Shift: 'Day', Weight: 10 },
  { Machine: 'A', Shift: 'Day', Weight: 11 },
  { Machine: 'A', Shift: 'Night', Weight: 12 },
  { Machine: 'B', Shift: 'Day', Weight: 50 },
  { Machine: 'B', Shift: 'Day', Weight: 51 },
  { Machine: 'B', Shift: 'Night', Weight: 52 },
  { Machine: 'C', Shift: 'Day', Weight: 100 },
  { Machine: 'C', Shift: 'Day', Weight: 101 },
  { Machine: 'C', Shift: 'Night', Weight: 102 },
];

const factors = ['Machine', 'Shift'];
const outcome = 'Weight';

// Stable empty references
const emptyStack: FilterAction[] = [];
const emptyFactors: string[] = [];

// =============================================================================
// Helper
// =============================================================================

function makeFilterAction(factor: string, values: (string | number)[]): FilterAction {
  return createFilterAction({
    type: 'filter',
    source: 'ichart',
    factor,
    values,
  });
}

// =============================================================================
// Basic behavior
// =============================================================================

describe('useVariationTracking — basic behavior', () => {
  it('empty filterStack → null cumulative, empty chipData', () => {
    const { result } = renderHook(() =>
      useVariationTracking(testData, emptyStack, outcome, factors)
    );

    expect(result.current.cumulativeVariationPct).toBeNull();
    expect(result.current.filterChipData).toEqual([]);
    expect(result.current.impactLevel).toBeNull();
  });

  it('no outcome → null cumulative, empty chipData', () => {
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, null, factors));

    expect(result.current.cumulativeVariationPct).toBeNull();
    expect(result.current.filterChipData).toEqual([]);
  });

  it('fewer than 2 rows → null cumulative', () => {
    const singleRow = [testData[0]];
    const { result } = renderHook(() =>
      useVariationTracking(singleRow, emptyStack, outcome, factors)
    );

    expect(result.current.cumulativeVariationPct).toBeNull();
    expect(result.current.factorVariations.size).toBe(0);
  });

  it('with data and outcome → factorVariations is non-empty Map', () => {
    const { result } = renderHook(() =>
      useVariationTracking(testData, emptyStack, outcome, factors)
    );

    expect(result.current.factorVariations.size).toBeGreaterThan(0);
    expect(result.current.factorVariations.has('Machine')).toBe(true);
    // Machine should explain most variation (A~10, B~50, C~100)
    expect(result.current.factorVariations.get('Machine')).toBeGreaterThan(90);
  });
});

// =============================================================================
// filterChipData
// =============================================================================

describe('useVariationTracking — filterChipData', () => {
  it('single filter → chip has correct factor, values, contributionPct', () => {
    const stack = [makeFilterAction('Machine', ['C'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    expect(result.current.filterChipData).toHaveLength(1);
    const chip = result.current.filterChipData[0];
    expect(chip.factor).toBe('Machine');
    expect(chip.values).toEqual(['C']);
    expect(chip.contributionPct).toBeGreaterThan(0);
  });

  it('contributionPct reflects original (unfiltered) data contributions', () => {
    // Machine C has highest mean (~100), so largest share of total SS
    const stack = [makeFilterAction('Machine', ['C'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    const chip = result.current.filterChipData[0];
    // Machine C should have a significant contribution since it's the highest group
    expect(chip.contributionPct).toBeGreaterThan(30);
  });

  it('availableValues sorted by contributionPct descending', () => {
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    const chip = result.current.filterChipData[0];
    const pcts = chip.availableValues.map(v => v.contributionPct);
    // Verify descending order
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i]).toBeLessThanOrEqual(pcts[i - 1]);
    }
  });

  it('isSelected flag correct for each available value', () => {
    const stack = [makeFilterAction('Machine', ['A', 'B'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    const chip = result.current.filterChipData[0];
    for (const av of chip.availableValues) {
      if (av.value === 'A' || av.value === 'B') {
        expect(av.isSelected).toBe(true);
      } else {
        expect(av.isSelected).toBe(false);
      }
    }
  });

  it('multi-filter stack → one chip per filter action', () => {
    const stack = [makeFilterAction('Machine', ['A']), makeFilterAction('Shift', ['Day'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    expect(result.current.filterChipData).toHaveLength(2);
    expect(result.current.filterChipData[0].factor).toBe('Machine');
    expect(result.current.filterChipData[1].factor).toBe('Shift');
  });
});

// =============================================================================
// Breadcrumbs & variation
// =============================================================================

describe('useVariationTracking — breadcrumbs and variation', () => {
  it('empty stack → single root breadcrumb', () => {
    const { result } = renderHook(() =>
      useVariationTracking(testData, emptyStack, outcome, factors)
    );

    expect(result.current.breadcrumbsWithVariation).toHaveLength(1);
    expect(result.current.breadcrumbsWithVariation[0].id).toBe('root');
    expect(result.current.breadcrumbsWithVariation[0].label).toBe('All Data');
  });

  it('single filter → 2 breadcrumbs, root has localVariationPct: 100', () => {
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    expect(result.current.breadcrumbsWithVariation).toHaveLength(2);
    expect(result.current.breadcrumbsWithVariation[0].localVariationPct).toBe(100);
  });

  it('cumulativeVariationPct is non-null after filtering', () => {
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    expect(result.current.cumulativeVariationPct).not.toBeNull();
    expect(result.current.cumulativeVariationPct).toBeGreaterThan(0);
  });

  it('scope percentage reflects Total SS contribution', () => {
    // Machine A has ~46% of Total SS (low group, far from mean)
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    // Machine A scope → cumulative ~46% → 'moderate'
    expect(result.current.cumulativeVariationPct).toBeGreaterThan(30);
    expect(result.current.cumulativeVariationPct).toBeLessThan(50);
    expect(result.current.impactLevel).toBe('moderate');
  });
});
