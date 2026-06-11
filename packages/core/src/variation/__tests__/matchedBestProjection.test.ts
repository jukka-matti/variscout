import { describe, it, expect } from 'vitest';
import { computeMatchedBestProjection } from '../projection';
import type { DataRow } from '../../types';

/** Build a flat dataset from per-level → outcome-values map. */
function rowsFromGroups(
  factor: string,
  outcome: string,
  groups: Record<string, number[]>
): DataRow[] {
  const rows: DataRow[] = [];
  for (const [level, values] of Object.entries(groups)) {
    for (const v of values) rows.push({ [factor]: level, [outcome]: v });
  }
  return rows;
}

describe('computeMatchedBestProjection', () => {
  it('picks the MIN-mean level for smaller-is-better and projects the mean down', () => {
    // A=[2,4] mean 3, B=[8,12] mean 10, C=[20,24] mean 22. Overall mean ≈ 11.667.
    // smaller-is-better (USL only) → best is A (lowest mean). Every group shifts to
    // A's mean → projected overall mean == bestMean == 3.
    const data = rowsFromGroups('Site', 'Value', { A: [2, 4], B: [8, 12], C: [20, 24] });
    const result = computeMatchedBestProjection(data, 'Value', 'Site', { usl: 30 });
    expect(result).toBeDefined();
    expect(result!.bestLevel).toBe('A');
    expect(result!.currentMean).toBeCloseTo(11.6667, 4);
    expect(result!.projectedMean).toBeCloseTo(3, 4);
    expect(result!.projectedMean).toBeLessThan(result!.currentMean);
    expect(result!.k).toBe(3);
    expect(result!.n).toBe(6);
    // Cpk present with limits, and improves (mean lower + spread tighter).
    expect(result!.currentCpk).toBeDefined();
    expect(result!.projectedCpk).toBeDefined();
    expect(result!.projectedCpk!).toBeGreaterThan(result!.currentCpk!);
  });

  it('picks the MAX-mean level for larger-is-better and projects the mean up', () => {
    // larger-is-better (LSL only) → best is C (highest mean). projected mean == 22.
    const data = rowsFromGroups('Site', 'Value', { A: [2, 4], B: [8, 12], C: [20, 24] });
    const result = computeMatchedBestProjection(data, 'Value', 'Site', { lsl: 0 });
    expect(result).toBeDefined();
    expect(result!.bestLevel).toBe('C');
    expect(result!.projectedMean).toBeCloseTo(22, 4);
    expect(result!.projectedMean).toBeGreaterThan(result!.currentMean);
  });

  it('targets the closest-to-target level for explicit nominal-with-target', () => {
    // target 10 → B (mean 10) is the best. projected mean == 10.
    const data = rowsFromGroups('Site', 'Value', { A: [2, 4], B: [8, 12], C: [20, 24] });
    const result = computeMatchedBestProjection(data, 'Value', 'Site', {
      usl: 30,
      lsl: 0,
      target: 10,
      characteristicType: 'nominal',
    });
    expect(result).toBeDefined();
    expect(result!.bestLevel).toBe('B');
    expect(result!.projectedMean).toBeCloseTo(10, 4);
  });

  it('returns undefined when there is no inferable direction (empty specs → nominal fallback)', () => {
    const data = rowsFromGroups('Site', 'Value', { A: [2, 4], B: [8, 12], C: [20, 24] });
    // No specs → inferCharacteristicType → 'nominal' with no target/midpoint → no direction.
    expect(computeMatchedBestProjection(data, 'Value', 'Site')).toBeUndefined();
    expect(computeMatchedBestProjection(data, 'Value', 'Site', {})).toBeUndefined();
  });

  it('omits Cpk fields when no spec limits are present but a direction exists', () => {
    // Explicit smaller-is-better via characteristicType, but no usl/lsl → no Cpk.
    const data = rowsFromGroups('Site', 'Value', { A: [2, 4], B: [8, 12], C: [20, 24] });
    const result = computeMatchedBestProjection(data, 'Value', 'Site', {
      characteristicType: 'smaller',
    });
    expect(result).toBeDefined();
    expect(result!.bestLevel).toBe('A');
    expect(result!.currentCpk).toBeUndefined();
    expect(result!.projectedCpk).toBeUndefined();
  });

  it('returns undefined for a degenerate single-group factor', () => {
    const data = rowsFromGroups('Site', 'Value', { A: [2, 4, 6, 8] });
    expect(computeMatchedBestProjection(data, 'Value', 'Site', { usl: 30 })).toBeUndefined();
  });

  it('returns undefined when too few rows to project', () => {
    const data = rowsFromGroups('Site', 'Value', { A: [2], B: [8] });
    expect(computeMatchedBestProjection(data, 'Value', 'Site', { usl: 30 })).toBeUndefined();
  });

  it('never returns NaN/Infinity in the projected numbers', () => {
    const data = rowsFromGroups('Site', 'Value', { A: [2, 4], B: [8, 12], C: [20, 24] });
    const result = computeMatchedBestProjection(data, 'Value', 'Site', { usl: 30 })!;
    expect(Number.isFinite(result.currentMean)).toBe(true);
    expect(Number.isFinite(result.projectedMean)).toBe(true);
    expect(Number.isFinite(result.currentCpk!)).toBe(true);
    expect(Number.isFinite(result.projectedCpk!)).toBe(true);
  });
});
