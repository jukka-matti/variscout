/**
 * Stress tests for hooks with large datasets.
 *
 * Tests useColumnClassification boundaries.
 * Hook tests use renderHook from @testing-library/react.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useColumnClassification } from '../useColumnClassification';
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
