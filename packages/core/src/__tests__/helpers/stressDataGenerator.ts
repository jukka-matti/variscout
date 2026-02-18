/**
 * Reusable seeded data generator for stress tests.
 *
 * Copies mulberry32() and generateNormal() from @variscout/data/utils.ts
 * to avoid adding a data->core dependency (these are ~16 lines of pure math).
 */

import type { DataRow } from '../../types';

// ============================================================================
// Seeded PRNG (copied from @variscout/data/utils.ts)
// ============================================================================

/**
 * Mulberry32 seeded PRNG -- deterministic random number generator.
 * Returns a function that produces [0, 1) values from a 32-bit seed.
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a random value from a normal distribution using Box-Muller transform.
 */
function generateNormal(rng: () => number, mean: number, std: number): number {
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

// ============================================================================
// Types
// ============================================================================

export interface FactorConfig {
  /** Column name for this factor */
  name: string;
  /** Explicit level names, or a count to auto-generate "Level_001" etc. */
  levels: string[] | number;
  /** Optional per-level mean shifts (added to baseMean). Array indexed by level index. */
  meanShifts?: number[];
}

export interface MeasurementConfig {
  name: string;
  baseMean: number;
  baseStd: number;
  specs?: { usl?: number; lsl?: number };
}

export interface StressDataConfig {
  rowCount: number;
  factors: FactorConfig[];
  measurement: MeasurementConfig;
  seed?: number;
}

// ============================================================================
// Core Generator
// ============================================================================

/**
 * Configurable stress data generator with deterministic output.
 *
 * Rows are assigned to factor levels via deterministic modular arithmetic
 * on the row index (not random selection) for reproducible group sizes.
 */
export function generateStressData(config: StressDataConfig): DataRow[] {
  const { rowCount, factors, measurement, seed = 42 } = config;
  const rng = mulberry32(seed);

  // Resolve factor levels
  const resolvedFactors = factors.map(f => {
    const levels: string[] =
      typeof f.levels === 'number'
        ? Array.from({ length: f.levels }, (_, i) => `${f.name}_${String(i + 1).padStart(3, '0')}`)
        : f.levels;
    return { ...f, resolvedLevels: levels };
  });

  const rows: DataRow[] = [];

  for (let i = 0; i < rowCount; i++) {
    const row: DataRow = {};

    // Assign factor levels deterministically
    let totalMeanShift = 0;
    let divisor = 1;

    for (const factor of resolvedFactors) {
      const levelCount = factor.resolvedLevels.length;
      const levelIndex = Math.floor(i / divisor) % levelCount;
      row[factor.name] = factor.resolvedLevels[levelIndex];

      // Apply mean shift if specified
      if (factor.meanShifts && factor.meanShifts[levelIndex] !== undefined) {
        totalMeanShift += factor.meanShifts[levelIndex];
      }

      divisor *= levelCount;
    }

    // Generate measurement value with combined mean shifts
    const value = generateNormal(rng, measurement.baseMean + totalMeanShift, measurement.baseStd);
    row[measurement.name] = Math.round(value * 100) / 100;

    rows.push(row);
  }

  return rows;
}

// ============================================================================
// Pre-built Scenario Helpers
// ============================================================================

/**
 * Pharma fill line: 200 products, 3 shifts, 12 fill heads.
 * Product has the highest cardinality (200), exceeding the 50-value parser threshold.
 */
export function pharmaFillLine(rows: number): DataRow[] {
  return generateStressData({
    rowCount: rows,
    factors: [
      {
        name: 'Product',
        levels: 200,
      },
      {
        name: 'Shift',
        levels: ['Morning', 'Afternoon', 'Night'],
        meanShifts: [0, 0.5, 1.0],
      },
      {
        name: 'FillHead',
        levels: 12,
        meanShifts: Array.from({ length: 12 }, (_, i) => (i - 6) * 0.3),
      },
    ],
    measurement: {
      name: 'FillWeight',
      baseMean: 500,
      baseStd: 2.0,
      specs: { usl: 510, lsl: 490 },
    },
  });
}

/**
 * Automotive supplier: 500 suppliers, 4 plants.
 * Supplier column (500 unique) will be classified as 'text' by the parser.
 */
export function automotiveSupplier(rows: number): DataRow[] {
  return generateStressData({
    rowCount: rows,
    factors: [
      {
        name: 'Supplier',
        levels: 500,
      },
      {
        name: 'Plant',
        levels: ['Detroit', 'Shanghai', 'Munich', 'Chennai'],
        meanShifts: [0, 1.5, -0.5, 2.0],
      },
    ],
    measurement: {
      name: 'Tensile_MPa',
      baseMean: 450,
      baseStd: 15,
      specs: { usl: 500, lsl: 400 },
    },
  });
}

/**
 * Beverage filling: 8 heads x 50 products x 3 shifts.
 * Product is at the exact 50-value threshold (should be categorical).
 */
export function beverageFilling(rows: number): DataRow[] {
  return generateStressData({
    rowCount: rows,
    factors: [
      {
        name: 'Head',
        levels: 8,
        meanShifts: [0, 0.2, -0.1, 0.5, -0.3, 0.1, 0.4, -0.2],
      },
      {
        name: 'Product',
        levels: 50,
      },
      {
        name: 'Shift',
        levels: ['Day', 'Swing', 'Night'],
        meanShifts: [0, 0.3, 0.8],
      },
    ],
    measurement: {
      name: 'Volume_ml',
      baseMean: 330,
      baseStd: 1.5,
      specs: { usl: 335, lsl: 325 },
    },
  });
}

/**
 * Simple factory with a single factor of N levels and known mean shifts.
 * Useful for verifying eta-squared calculations where the expected effect size
 * can be estimated from the shift magnitudes.
 */
export function simpleFactory(rows: number, groupCount: number): DataRow[] {
  // Create deterministic mean shifts: groups alternate between 0 and 5
  const meanShifts = Array.from({ length: groupCount }, (_, i) => (i % 2 === 0 ? 0 : 5));

  return generateStressData({
    rowCount: rows,
    factors: [
      {
        name: 'Group',
        levels: groupCount,
        meanShifts,
      },
    ],
    measurement: {
      name: 'Measurement',
      baseMean: 100,
      baseStd: 2,
    },
  });
}

// ============================================================================
// Timing Utility
// ============================================================================

/**
 * Execute a function and measure its duration.
 */
export function timedExec<T>(fn: () => T): { result: T; durationMs: number } {
  const start = performance.now();
  const result = fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}
