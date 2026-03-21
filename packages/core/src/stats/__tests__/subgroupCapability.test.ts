import { describe, it, expect } from 'vitest';
import {
  groupDataIntoSubgroups,
  calculateSubgroupCapability,
  calculateSeriesControlLimits,
} from '../subgroupCapability';
import type { SubgroupConfig, SubgroupData } from '../subgroupCapability';
import type { DataRow } from '../../types';

// ============================================================================
// groupDataIntoSubgroups
// ============================================================================

describe('groupDataIntoSubgroups', () => {
  const makeRows = (values: number[], column?: Record<string, string>): DataRow[] =>
    values.map((v, i) => ({
      Weight: v,
      ...(column ? { Batch: column[String(i)] ?? `B${Math.floor(i / 5) + 1}` } : {}),
    }));

  describe('fixed-size method', () => {
    it('groups 20 rows with n=5 into 4 subgroups', () => {
      const rows = makeRows(Array.from({ length: 20 }, (_, i) => 10 + i * 0.1));
      const config: SubgroupConfig = { method: 'fixed-size', size: 5 };
      const result = groupDataIntoSubgroups(rows, 'Weight', config);

      expect(result).toHaveLength(4);
      expect(result[0].label).toBe('Subgroup 1');
      expect(result[0].values).toHaveLength(5);
      expect(result[3].label).toBe('Subgroup 4');
      expect(result[3].values).toHaveLength(5);
    });

    it('drops trailing partial subgroup (23 rows, n=5 → 4 subgroups)', () => {
      const rows = makeRows(Array.from({ length: 23 }, (_, i) => 10 + i * 0.1));
      const config: SubgroupConfig = { method: 'fixed-size', size: 5 };
      const result = groupDataIntoSubgroups(rows, 'Weight', config);

      expect(result).toHaveLength(4);
    });

    it('uses minimum size of 2 when size < 2', () => {
      const rows = makeRows([1, 2, 3, 4]);
      const config: SubgroupConfig = { method: 'fixed-size', size: 1 };
      const result = groupDataIntoSubgroups(rows, 'Weight', config);

      expect(result).toHaveLength(2);
      expect(result[0].values).toHaveLength(2);
    });

    it('defaults to size=5 when size not specified', () => {
      const rows = makeRows(Array.from({ length: 10 }, (_, i) => i));
      const config: SubgroupConfig = { method: 'fixed-size' };
      const result = groupDataIntoSubgroups(rows, 'Weight', config);

      expect(result).toHaveLength(2);
      expect(result[0].values).toHaveLength(5);
    });

    it('skips rows with non-numeric outcome', () => {
      const rows: DataRow[] = [
        { Weight: 10 },
        { Weight: 'bad' },
        { Weight: 11 },
        { Weight: 12 },
        { Weight: 13 },
      ];
      const config: SubgroupConfig = { method: 'fixed-size', size: 2 };
      const result = groupDataIntoSubgroups(rows, 'Weight', config);

      // 4 valid rows → 2 groups of 2
      expect(result).toHaveLength(2);
    });

    it('returns original rows alongside values', () => {
      const rows = makeRows([10, 11, 12, 13]);
      const config: SubgroupConfig = { method: 'fixed-size', size: 2 };
      const result = groupDataIntoSubgroups(rows, 'Weight', config);

      expect(result[0].rows).toHaveLength(2);
      expect(result[0].rows[0]).toBe(rows[0]);
    });
  });

  describe('column-based method', () => {
    it('groups by unique column values preserving appearance order', () => {
      const rows: DataRow[] = [
        { Weight: 10, Batch: 'A' },
        { Weight: 11, Batch: 'A' },
        { Weight: 12, Batch: 'B' },
        { Weight: 13, Batch: 'B' },
        { Weight: 14, Batch: 'C' },
      ];
      const config: SubgroupConfig = { method: 'column', column: 'Batch' };
      const result = groupDataIntoSubgroups(rows, 'Weight', config);

      expect(result).toHaveLength(3);
      expect(result[0].label).toBe('A');
      expect(result[0].values).toEqual([10, 11]);
      expect(result[1].label).toBe('B');
      expect(result[2].label).toBe('C');
    });

    it('skips rows with empty column values', () => {
      const rows: DataRow[] = [
        { Weight: 10, Batch: 'A' },
        { Weight: 11, Batch: '' },
        { Weight: 12, Batch: 'A' },
      ];
      const config: SubgroupConfig = { method: 'column', column: 'Batch' };
      const result = groupDataIntoSubgroups(rows, 'Weight', config);

      expect(result).toHaveLength(1);
      expect(result[0].values).toEqual([10, 12]);
    });
  });
});

// ============================================================================
// calculateSubgroupCapability
// ============================================================================

describe('calculateSubgroupCapability', () => {
  it('calculates Cp and Cpk for subgroups with both specs', () => {
    // Known data: mean ≈ 10, low variation
    const subgroups: SubgroupData[] = [
      { values: [9.8, 10.0, 10.2, 9.9, 10.1], label: 'SG1', rows: [] },
      { values: [10.5, 10.7, 10.3, 10.6, 10.4], label: 'SG2', rows: [] },
    ];
    const specs = { usl: 12, lsl: 8 };
    const result = calculateSubgroupCapability(subgroups, specs);

    expect(result).toHaveLength(2);
    expect(result[0].n).toBe(5);
    expect(result[0].cp).toBeDefined();
    expect(result[0].cpk).toBeDefined();
    expect(result[0].cp!).toBeGreaterThan(0);
    expect(result[0].cpk!).toBeGreaterThan(0);
    // Cp >= Cpk always
    expect(result[0].cp!).toBeGreaterThanOrEqual(result[0].cpk!);
  });

  it('calculates only Cpk with one-sided USL spec', () => {
    const subgroups: SubgroupData[] = [
      { values: [9.8, 10.0, 10.2, 9.9, 10.1], label: 'SG1', rows: [] },
    ];
    const specs = { usl: 12 };
    const result = calculateSubgroupCapability(subgroups, specs);

    expect(result[0].cp).toBeUndefined();
    expect(result[0].cpk).toBeDefined();
    expect(result[0].cpk!).toBeGreaterThan(0);
  });

  it('calculates only Cpk with one-sided LSL spec', () => {
    const subgroups: SubgroupData[] = [
      { values: [9.8, 10.0, 10.2, 9.9, 10.1], label: 'SG1', rows: [] },
    ];
    const specs = { lsl: 8 };
    const result = calculateSubgroupCapability(subgroups, specs);

    expect(result[0].cp).toBeUndefined();
    expect(result[0].cpk).toBeDefined();
    expect(result[0].cpk!).toBeGreaterThan(0);
  });

  it('returns undefined cp/cpk for n=1 subgroup', () => {
    const subgroups: SubgroupData[] = [{ values: [10.0], label: 'SG1', rows: [] }];
    const specs = { usl: 12, lsl: 8 };
    const result = calculateSubgroupCapability(subgroups, specs);

    expect(result[0].cp).toBeUndefined();
    expect(result[0].cpk).toBeUndefined();
    expect(result[0].n).toBe(1);
  });

  it('returns undefined cp/cpk for identical values (zero sigma)', () => {
    const subgroups: SubgroupData[] = [{ values: [10, 10, 10, 10, 10], label: 'SG1', rows: [] }];
    const specs = { usl: 12, lsl: 8 };
    const result = calculateSubgroupCapability(subgroups, specs);

    expect(result[0].cp).toBeUndefined();
    expect(result[0].cpk).toBeUndefined();
    expect(result[0].sigmaWithin).toBe(0);
  });

  it('returns undefined cp/cpk when no specs provided', () => {
    const subgroups: SubgroupData[] = [
      { values: [9.8, 10.0, 10.2, 9.9, 10.1], label: 'SG1', rows: [] },
    ];
    const result = calculateSubgroupCapability(subgroups, {});

    expect(result[0].cp).toBeUndefined();
    expect(result[0].cpk).toBeUndefined();
  });

  it('preserves index and label', () => {
    const subgroups: SubgroupData[] = [
      { values: [10, 11], label: 'Batch A', rows: [] },
      { values: [12, 13], label: 'Batch B', rows: [] },
    ];
    const result = calculateSubgroupCapability(subgroups, { usl: 15, lsl: 5 });

    expect(result[0].index).toBe(0);
    expect(result[0].label).toBe('Batch A');
    expect(result[1].index).toBe(1);
    expect(result[1].label).toBe('Batch B');
  });

  it('produces known Cp/Cpk for tight process', () => {
    // σ_within ≈ small, specs wide → high Cp/Cpk
    // 5 values close together: [10.0, 10.0, 10.0, 10.0, 10.0] → σ = 0 (handled)
    // Use slight variation: [9.9, 10.0, 10.1, 10.0, 9.9]
    const subgroups: SubgroupData[] = [
      { values: [9.9, 10.0, 10.1, 10.0, 9.9], label: 'SG1', rows: [] },
    ];
    const specs = { usl: 12, lsl: 8 };
    const result = calculateSubgroupCapability(subgroups, specs);

    // With specs width = 4, and very small sigma, Cp should be high
    expect(result[0].cp!).toBeGreaterThan(2);
    expect(result[0].cpk!).toBeGreaterThan(2);
  });
});

// ============================================================================
// calculateSeriesControlLimits
// ============================================================================

describe('calculateSeriesControlLimits', () => {
  it('calculates mean, UCL, LCL from known values', () => {
    const values = [1.2, 1.4, 1.3, 1.5, 1.1];
    const result = calculateSeriesControlLimits(values);

    expect(result).not.toBeNull();
    expect(result!.n).toBe(5);
    expect(result!.mean).toBeCloseTo(1.3, 2);
    expect(result!.ucl).toBeGreaterThan(result!.mean);
    expect(result!.lcl).toBeLessThan(result!.mean);
    expect(result!.lcl).toBeGreaterThanOrEqual(0);
  });

  it('returns null for fewer than 2 values', () => {
    expect(calculateSeriesControlLimits([1.5])).toBeNull();
    expect(calculateSeriesControlLimits([])).toBeNull();
  });

  it('clamps LCL to 0', () => {
    // Small mean with large spread should clamp LCL
    const values = [0.1, 0.2, 0.1, 5.0]; // large spread, low mean
    const result = calculateSeriesControlLimits(values);

    expect(result).not.toBeNull();
    expect(result!.lcl).toBe(0);
  });

  it('filters out NaN and Infinity', () => {
    const values = [1.0, NaN, 2.0, Infinity, 1.5];
    const result = calculateSeriesControlLimits(values);

    expect(result).not.toBeNull();
    expect(result!.n).toBe(3);
  });

  it('UCL = mean + 3σ for normal spread', () => {
    // Two values: 0 and 2 → mean=1, σ=√2≈1.414
    const values = [0, 2];
    const result = calculateSeriesControlLimits(values);

    expect(result).not.toBeNull();
    expect(result!.mean).toBeCloseTo(1, 5);
    // d3.deviation uses sample std dev for n=2: sqrt((0-1)²+(2-1)²)/(2-1)) = √2 ≈ 1.414
    expect(result!.ucl).toBeCloseTo(1 + 3 * Math.SQRT2, 5);
  });
});
