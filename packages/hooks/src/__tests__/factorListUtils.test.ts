/**
 * Tests for factorListUtils — buildFactorList + augmentLensedRowsWithDerived
 *
 * These pure functions are the G1 Task 4 pivot point:
 * - buildFactorList: merges raw factors + derived categorical columns for pickers
 * - augmentLensedRowsWithDerived: injects derived column values into row objects
 */

import { describe, it, expect } from 'vitest';
import { buildFactorList, augmentLensedRowsWithDerived } from '../factorListUtils';
import type { DataRow } from '@variscout/core';

// ── buildFactorList ─────────────────────────────────────────────────────────

describe('buildFactorList', () => {
  it('returns rawFactors unchanged when categoricalValuesByColumn is absent', () => {
    expect(buildFactorList(['Vessel', 'Shift'])).toEqual(['Vessel', 'Shift']);
  });

  it('returns rawFactors unchanged when categoricalValuesByColumn is empty', () => {
    expect(buildFactorList(['Vessel', 'Shift'], {})).toEqual(['Vessel', 'Shift']);
  });

  it('appends derived keys after raw factors in column-name sort order', () => {
    const categoricalValuesByColumn = {
      'Order_Date.day-of-week': ['Mon', 'Tue'],
      Reactor_temp_bin: ['<50', '>=50'],
    };
    const result = buildFactorList(['Vessel', 'Shift'], categoricalValuesByColumn);
    // Raw first, then derived sorted: Order_Date.day-of-week < Reactor_temp_bin
    expect(result).toEqual(['Vessel', 'Shift', 'Order_Date.day-of-week', 'Reactor_temp_bin']);
  });

  it('deduplicates: raw entry wins when derived key collides with raw factor', () => {
    const categoricalValuesByColumn = {
      Vessel: ['A', 'B'], // collision — Vessel is already raw
      Reactor_temp_bin: ['<50', '>=50'],
    };
    const result = buildFactorList(['Vessel', 'Shift'], categoricalValuesByColumn);
    // Vessel appears only once (from raw); Reactor_temp_bin appended
    expect(result).toEqual(['Vessel', 'Shift', 'Reactor_temp_bin']);
  });

  it('works with only derived columns and no raw factors', () => {
    const categoricalValuesByColumn = {
      Reactor_temp_bin: ['<50', '>=50'],
      'Order_Date.year': ['2024', '2025'],
    };
    const result = buildFactorList([], categoricalValuesByColumn);
    expect(result).toEqual(['Order_Date.year', 'Reactor_temp_bin']);
  });
});

// ── augmentLensedRowsWithDerived ────────────────────────────────────────────

describe('augmentLensedRowsWithDerived', () => {
  const makeRows = (n: number): DataRow[] =>
    Array.from({ length: n }, (_, i) => ({ Value: i * 10, Machine: `M${i + 1}` }));

  it('returns the same array reference when categoricalValuesByColumn is absent', () => {
    const rows = makeRows(3);
    expect(augmentLensedRowsWithDerived(rows)).toBe(rows);
  });

  it('returns the same array reference when categoricalValuesByColumn is empty', () => {
    const rows = makeRows(3);
    expect(augmentLensedRowsWithDerived(rows, {})).toBe(rows);
  });

  it('injects derived column values at matching indices (no lens offset)', () => {
    const rows: DataRow[] = [
      { Value: 10, Machine: 'M1' },
      { Value: 20, Machine: 'M2' },
      { Value: 30, Machine: 'M3' },
    ];
    const categoricalValuesByColumn = {
      Reactor_temp_bin: ['<50', '>=50', '<50'],
    };
    const result = augmentLensedRowsWithDerived(rows, categoricalValuesByColumn, 0);
    expect(result[0]).toMatchObject({ Value: 10, Machine: 'M1', Reactor_temp_bin: '<50' });
    expect(result[1]).toMatchObject({ Value: 20, Machine: 'M2', Reactor_temp_bin: '>=50' });
    expect(result[2]).toMatchObject({ Value: 30, Machine: 'M3', Reactor_temp_bin: '<50' });
  });

  it('applies lens offset: startIdx aligns derived values to lensed window', () => {
    // Original: 5 rows; lens window [2, 5) → lensedRows has 3 rows
    const lensedRows: DataRow[] = [{ Value: 30 }, { Value: 40 }, { Value: 50 }];
    // Bin values for all 5 original rows:
    const categoricalValuesByColumn = {
      Reactor_temp_bin: ['<50', '<50', '>=50', '<50', '>=50'],
    };
    const result = augmentLensedRowsWithDerived(lensedRows, categoricalValuesByColumn, 2);
    // lensedRows[0] maps to original[2] → '>=50'
    // lensedRows[1] maps to original[3] → '<50'
    // lensedRows[2] maps to original[4] → '>=50'
    expect(result[0]).toMatchObject({ Value: 30, Reactor_temp_bin: '>=50' });
    expect(result[1]).toMatchObject({ Value: 40, Reactor_temp_bin: '<50' });
    expect(result[2]).toMatchObject({ Value: 50, Reactor_temp_bin: '>=50' });
  });

  it('does not overwrite existing raw column values', () => {
    const rows: DataRow[] = [{ Value: 10, Reactor_temp_bin: 'raw_value' }];
    const categoricalValuesByColumn = {
      Reactor_temp_bin: ['derived_value'],
    };
    const result = augmentLensedRowsWithDerived(rows, categoricalValuesByColumn, 0);
    // Raw value wins
    expect(result[0]['Reactor_temp_bin']).toBe('raw_value');
  });

  it('handles null in derived column values gracefully', () => {
    const rows: DataRow[] = [{ Value: 10 }, { Value: 20 }];
    const categoricalValuesByColumn = {
      Reactor_temp_bin: [null, '<50'],
    };
    const result = augmentLensedRowsWithDerived(rows, categoricalValuesByColumn, 0);
    expect(result[0]['Reactor_temp_bin']).toBeNull();
    expect(result[1]['Reactor_temp_bin']).toBe('<50');
  });

  it('handles undefined slot in derived column (out-of-bounds) as null', () => {
    const rows: DataRow[] = [{ Value: 10 }];
    // Only 1 derived value but startIdx=99 → out of bounds
    const categoricalValuesByColumn = {
      Reactor_temp_bin: ['<50'],
    };
    const result = augmentLensedRowsWithDerived(rows, categoricalValuesByColumn, 99);
    expect(result[0]['Reactor_temp_bin']).toBeNull();
  });

  it('returns original row reference when no extra keys are added', () => {
    // Row already has all derived keys
    const rows: DataRow[] = [{ Value: 10, Reactor_temp_bin: 'existing' }];
    const categoricalValuesByColumn = {
      Reactor_temp_bin: ['derived'],
    };
    const result = augmentLensedRowsWithDerived(rows, categoricalValuesByColumn, 0);
    // Same object reference because no extra was injected
    expect(result[0]).toBe(rows[0]);
  });
});

// ── Boxplot rendering integration (pure function level) ──────────────────────

describe('buildFactorList + augmentLensedRowsWithDerived integration', () => {
  it('factor-list test: raw + derived from spec example', () => {
    const categoricalValuesByColumn = {
      'Order_Date.day-of-week': ['Mon', 'Tue', 'Mon', 'Fri', 'Tue'],
      Reactor_temp_bin: ['<50', '>=50', '<50', '>=50', '<50'],
    };
    const result = buildFactorList(['Vessel', 'Shift'], categoricalValuesByColumn);
    expect(result).toEqual(['Vessel', 'Shift', 'Order_Date.day-of-week', 'Reactor_temp_bin']);
  });

  it('boxplot rendering test: rows without Reactor_temp_bin key become groupable via augmentation', () => {
    // Given rows without Reactor_temp_bin, but derivedColumn has values
    const rows: DataRow[] = [
      { Value: 10 },
      { Value: 20 },
      { Value: 15 },
      { Value: 25 },
      { Value: 12 },
    ];
    const categoricalValuesByColumn = {
      Reactor_temp_bin: ['<50', '>=50', '<50', '>=50', '<50'],
    };
    const augmented = augmentLensedRowsWithDerived(rows, categoricalValuesByColumn, 0);

    // Simulate what useBoxplotData does: group by factor
    const groups = new Map<string, number[]>();
    for (const row of augmented) {
      const key = String(row['Reactor_temp_bin']);
      if (key && key !== 'null') {
        const vals = groups.get(key) ?? [];
        vals.push(row['Value'] as number);
        groups.set(key, vals);
      }
    }

    // Expect 2 groups
    expect(groups.size).toBe(2);
    expect(groups.get('<50')).toEqual([10, 15, 12]);
    expect(groups.get('>=50')).toEqual([20, 25]);
  });

  it('probability lens test: rows without Reactor_temp_bin produce 2 series via augmentation', () => {
    const rows: DataRow[] = [
      { Value: 10 },
      { Value: 20 },
      { Value: 15 },
      { Value: 25 },
      { Value: 12 },
    ];
    const categoricalValuesByColumn = {
      Reactor_temp_bin: ['<50', '>=50', '<50', '>=50', '<50'],
    };
    const augmented = augmentLensedRowsWithDerived(rows, categoricalValuesByColumn, 0);

    // Simulate what useProbabilityPlotData does: group by factorColumn
    const groups = new Map<string, number[]>();
    for (let i = 0; i < augmented.length; i++) {
      const factorValue = augmented[i]['Reactor_temp_bin'];
      if (factorValue == null) continue;
      const key = String(factorValue);
      const vals = groups.get(key) ?? [];
      vals.push(rows[i]['Value'] as number);
      groups.set(key, vals);
    }

    expect(groups.size).toBe(2);
  });
});
