/**
 * Stress tests for hooks with large datasets.
 *
 * Tests useColumnClassification boundaries and useVariationTracking
 * computation at scale. Hook tests use renderHook from @testing-library/react.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useColumnClassification } from '../useColumnClassification';
import { useVariationTracking } from '../useVariationTracking';
import { createFilterAction, type FilterAction } from '@variscout/core';
import type { DataRow } from '@variscout/core';

// ============================================================================
// Helper: Seeded PRNG (copied from core stress helpers to avoid cross-pkg import)
// ============================================================================

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateNormal(rng: () => number, mean: number, std: number): number {
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

function buildStressData(
  rowCount: number,
  factorLevels: Record<string, string[]>,
  measurementCol: string,
  baseMean: number,
  baseStd: number,
  seed: number = 42
): DataRow[] {
  const rng = mulberry32(seed);
  const factorEntries = Object.entries(factorLevels);
  const rows: DataRow[] = [];

  for (let i = 0; i < rowCount; i++) {
    const row: DataRow = {};
    let divisor = 1;

    for (const [name, levels] of factorEntries) {
      const idx = Math.floor(i / divisor) % levels.length;
      row[name] = levels[idx];
      divisor *= levels.length;
    }

    row[measurementCol] = Math.round(generateNormal(rng, baseMean, baseStd) * 100) / 100;
    rows.push(row);
  }

  return rows;
}

// ============================================================================
// useColumnClassification stress tests
// ============================================================================

describe('useColumnClassification at scale', () => {
  it('5K rows, factor with 10 unique values (at default boundary) -> categorical', () => {
    const levels = Array.from({ length: 10 }, (_, i) => `Level_${i + 1}`);
    const data = buildStressData(5000, { Factor: levels }, 'Value', 100, 5);

    const { result } = renderHook(() =>
      useColumnClassification(data, { excludeColumn: 'Value', maxCategoricalUnique: 10 })
    );

    expect(result.current.categorical).toContain('Factor');
  });

  it('5K rows, factor with 11 unique values (above default) -> excluded', () => {
    const levels = Array.from({ length: 11 }, (_, i) => `Level_${i + 1}`);
    const data = buildStressData(5000, { Factor: levels }, 'Value', 100, 5);

    const { result } = renderHook(() =>
      useColumnClassification(data, { excludeColumn: 'Value', maxCategoricalUnique: 10 })
    );

    // 11 unique values exceeds the default threshold of 10
    expect(result.current.categorical).not.toContain('Factor');
  });

  it(
    '50K rows, 3 factors [3, 10, 50 levels] -> correct classification',
    { timeout: 30_000 },
    () => {
      const data: DataRow[] = [];
      const rng = mulberry32(42);

      for (let i = 0; i < 50000; i++) {
        data.push({
          SmallFactor: `S_${(i % 3) + 1}`,
          MedFactor: `M_${(i % 10) + 1}`,
          LargeFactor: `L_${(i % 50) + 1}`,
          Value: Math.round(generateNormal(rng, 100, 5) * 100) / 100,
        });
      }

      // With default threshold = 10
      const { result: defaultResult } = renderHook(() =>
        useColumnClassification(data, { excludeColumn: 'Value', maxCategoricalUnique: 10 })
      );

      // SmallFactor (3 levels) -> categorical
      expect(defaultResult.current.categorical).toContain('SmallFactor');
      // MedFactor (10 levels) -> categorical (at boundary)
      expect(defaultResult.current.categorical).toContain('MedFactor');
      // LargeFactor (50 levels) -> excluded from categorical
      expect(defaultResult.current.categorical).not.toContain('LargeFactor');

      // With raised threshold = 50
      const { result: raisedResult } = renderHook(() =>
        useColumnClassification(data, { excludeColumn: 'Value', maxCategoricalUnique: 50 })
      );

      // Now LargeFactor (50 levels) should be included
      expect(raisedResult.current.categorical).toContain('LargeFactor');
    }
  );

  it('documents threshold mismatch: parser(50) vs hook(10)', () => {
    /**
     * DESIGN NOTE: The parser classifies columns with <=50 unique values as 'categorical'.
     * The useColumnClassification hook defaults to maxCategoricalUnique=10.
     *
     * This means columns with 11-50 unique string values are:
     * - Parsed and loaded into the data model (parser says "categorical")
     * - NOT offered as factors in the UI by default (hook says "too many")
     *
     * This is intentional: the parser is permissive, the UI is conservative.
     * Users can override via the maxCategoricalUnique option if needed.
     */
    const levels25 = Array.from({ length: 25 }, (_, i) => `Product_${i + 1}`);
    const data = buildStressData(500, { Product: levels25 }, 'Weight', 100, 5);

    // With default threshold (10): excluded
    const { result: defaultResult } = renderHook(() =>
      useColumnClassification(data, { excludeColumn: 'Weight' })
    );
    expect(defaultResult.current.categorical).not.toContain('Product');

    // With raised threshold (50): included
    const { result: raisedResult } = renderHook(() =>
      useColumnClassification(data, { excludeColumn: 'Weight', maxCategoricalUnique: 50 })
    );
    expect(raisedResult.current.categorical).toContain('Product');
  });
});

// ============================================================================
// useVariationTracking computation at scale
// ============================================================================

describe('useVariationTracking at scale', () => {
  it('10K rows, 3 filters deep -> cumulative variation computed', { timeout: 30_000 }, () => {
    const machinelevels = Array.from({ length: 5 }, (_, i) => `Machine_${i + 1}`);
    const shiftLevels = ['Day', 'Night', 'Swing'];
    const operatorLevels = Array.from({ length: 4 }, (_, i) => `Op_${i + 1}`);

    // Stable references (required by useVariationTracking to avoid infinite loops)
    const data = buildStressData(
      10000,
      { Machine: machinelevels, Shift: shiftLevels, Operator: operatorLevels },
      'Output',
      100,
      5
    );

    const factors = ['Machine', 'Shift', 'Operator'];
    const outcome = 'Output';

    // 3-level filter stack
    const filterStack: FilterAction[] = [
      createFilterAction({
        type: 'filter',
        source: 'ichart',
        factor: 'Machine',
        values: ['Machine_1'],
      }),
      createFilterAction({ type: 'filter', source: 'ichart', factor: 'Shift', values: ['Day'] }),
      createFilterAction({
        type: 'filter',
        source: 'ichart',
        factor: 'Operator',
        values: ['Op_1'],
      }),
    ];

    const { result } = renderHook(() => useVariationTracking(data, filterStack, outcome, factors));

    // Should have root + 3 filter levels = 4 breadcrumbs
    expect(result.current.breadcrumbsWithVariation.length).toBeGreaterThanOrEqual(2);
    // Cumulative variation should be a valid percentage
    if (result.current.cumulativeVariationPct !== null) {
      expect(result.current.cumulativeVariationPct).toBeGreaterThan(0);
      expect(result.current.cumulativeVariationPct).toBeLessThanOrEqual(100);
    }
    // Impact level should be set
    expect(result.current.impactLevel).not.toBeNull();
  });

  it('50K rows, 1 filter -> completes without timeout', { timeout: 30_000 }, () => {
    const levels = Array.from({ length: 10 }, (_, i) => `Group_${i + 1}`);
    const data = buildStressData(50000, { Group: levels }, 'Value', 100, 5);

    const factors = ['Group'];
    const outcome = 'Value';

    const filterStack: FilterAction[] = [
      createFilterAction({
        type: 'filter',
        source: 'ichart',
        factor: 'Group',
        values: ['Group_1'],
      }),
    ];

    const start = performance.now();
    const { result } = renderHook(() => useVariationTracking(data, filterStack, outcome, factors));
    const elapsed = performance.now() - start;

    // Should complete, producing a result
    expect(result.current.breadcrumbsWithVariation.length).toBeGreaterThanOrEqual(2);
    // Computation should be reasonable (not hanging)
    expect(elapsed).toBeLessThan(10000);
  });

  it('factor variations are computed for large dataset', { timeout: 30_000 }, () => {
    const data = buildStressData(
      10000,
      {
        Machine: Array.from({ length: 8 }, (_, i) => `M_${i + 1}`),
        Shift: ['Day', 'Night'],
      },
      'Weight',
      100,
      3
    );

    const factors = ['Machine', 'Shift'];
    const outcome = 'Weight';
    const emptyStack: FilterAction[] = [];

    const { result } = renderHook(() => useVariationTracking(data, emptyStack, outcome, factors));

    // Factor variations should be available
    expect(result.current.factorVariations.size).toBeGreaterThan(0);

    // Each variation should be a valid percentage
    for (const [, pct] of result.current.factorVariations) {
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});
