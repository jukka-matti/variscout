import { describe, it, expect } from 'vitest';
import type { DataRow } from '@variscout/core';
import { detectMergeStrategy, mergeRows, mergeColumns } from '../useDataMerge';

describe('detectMergeStrategy', () => {
  it('returns "rows" when all incoming columns exist in existing', () => {
    const existing = ['Weight', 'Operator', 'Line'];
    const incoming = ['Weight', 'Operator'];
    expect(detectMergeStrategy(existing, incoming)).toBe('rows');
  });

  it('returns "columns" when some incoming columns are new', () => {
    const existing = ['Weight', 'Operator'];
    const incoming = ['Weight', 'Shift'];
    expect(detectMergeStrategy(existing, incoming)).toBe('columns');
  });

  it('returns "columns" when all incoming columns are new', () => {
    const existing = ['Weight', 'Operator'];
    const incoming = ['Temperature', 'Humidity'];
    expect(detectMergeStrategy(existing, incoming)).toBe('columns');
  });

  it('returns "rows" when incoming columns are empty', () => {
    const existing = ['Weight', 'Operator'];
    const incoming: string[] = [];
    expect(detectMergeStrategy(existing, incoming)).toBe('rows');
  });

  it('returns "columns" when existing columns are empty', () => {
    const existing: string[] = [];
    const incoming = ['Weight', 'Operator'];
    expect(detectMergeStrategy(existing, incoming)).toBe('columns');
  });
});

describe('mergeRows', () => {
  it('appends rows when columns match', () => {
    const existing = [
      { Weight: 10, Operator: 'A' },
      { Weight: 12, Operator: 'B' },
    ];
    const incoming = [{ Weight: 14, Operator: 'C' }];
    const result = mergeRows(existing, incoming);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ Weight: 10, Operator: 'A' });
    expect(result[1]).toEqual({ Weight: 12, Operator: 'B' });
    expect(result[2]).toEqual({ Weight: 14, Operator: 'C' });
  });

  it('fills null for existing rows when incoming has extra columns', () => {
    const existing = [{ Weight: 10 }];
    const incoming = [{ Weight: 14, Shift: 'Morning' }];
    const result = mergeRows(existing, incoming);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ Weight: 10, Shift: null });
    expect(result[1]).toEqual({ Weight: 14, Shift: 'Morning' });
  });

  it('fills null for incoming rows when existing has extra columns', () => {
    const existing = [{ Weight: 10, Line: 'L1' }];
    const incoming = [{ Weight: 14 }];
    const result = mergeRows(existing, incoming);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ Weight: 10, Line: 'L1' });
    expect(result[1]).toEqual({ Weight: 14, Line: null });
  });

  it('returns incoming data when existing is empty', () => {
    const existing: DataRow[] = [];
    const incoming = [
      { Weight: 14, Operator: 'C' },
      { Weight: 16, Operator: 'D' },
    ];
    const result = mergeRows(existing, incoming);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ Weight: 14, Operator: 'C' });
    expect(result[1]).toEqual({ Weight: 16, Operator: 'D' });
  });

  it('returns existing data when incoming is empty', () => {
    const existing = [{ Weight: 10, Operator: 'A' }];
    const incoming: DataRow[] = [];
    const result = mergeRows(existing, incoming);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ Weight: 10, Operator: 'A' });
  });
});

describe('mergeColumns', () => {
  it('merges new columns by row index', () => {
    const existing = [
      { Weight: 10, Operator: 'A' },
      { Weight: 12, Operator: 'B' },
    ];
    const incoming = [
      { Shift: 'Morning', Line: 'L1' },
      { Shift: 'Evening', Line: 'L2' },
    ];
    const { data, addedColumns } = mergeColumns(existing, incoming);
    expect(addedColumns).toEqual(['Shift', 'Line']);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ Weight: 10, Operator: 'A', Shift: 'Morning', Line: 'L1' });
    expect(data[1]).toEqual({ Weight: 12, Operator: 'B', Shift: 'Evening', Line: 'L2' });
  });

  it('pads new columns with null when incoming is shorter than existing', () => {
    const existing = [{ Weight: 10 }, { Weight: 12 }, { Weight: 14 }];
    const incoming = [{ Shift: 'Morning' }];
    const { data, addedColumns } = mergeColumns(existing, incoming);
    expect(addedColumns).toEqual(['Shift']);
    expect(data).toHaveLength(3);
    expect(data[0]).toEqual({ Weight: 10, Shift: 'Morning' });
    expect(data[1]).toEqual({ Weight: 12, Shift: null });
    expect(data[2]).toEqual({ Weight: 14, Shift: null });
  });

  it('pads existing columns with null when incoming is longer than existing', () => {
    const existing = [{ Weight: 10 }];
    const incoming = [{ Shift: 'Morning' }, { Shift: 'Evening' }, { Shift: 'Night' }];
    const { data, addedColumns } = mergeColumns(existing, incoming);
    expect(addedColumns).toEqual(['Shift']);
    expect(data).toHaveLength(3);
    expect(data[0]).toEqual({ Weight: 10, Shift: 'Morning' });
    expect(data[1]).toEqual({ Weight: null, Shift: 'Evening' });
    expect(data[2]).toEqual({ Weight: null, Shift: 'Night' });
  });

  it('skips duplicate columns and returns existing data unchanged', () => {
    const existing = [
      { Weight: 10, Operator: 'A' },
      { Weight: 12, Operator: 'B' },
    ];
    const incoming = [
      { Weight: 99, Operator: 'Z' },
      { Weight: 88, Operator: 'Y' },
    ];
    const { data, addedColumns } = mergeColumns(existing, incoming);
    expect(addedColumns).toEqual([]);
    expect(data).toBe(existing); // same reference, no copy
  });

  it('returns incoming data with addedColumns when existing is empty', () => {
    const existing: DataRow[] = [];
    const incoming = [
      { Weight: 14, Operator: 'C' },
      { Weight: 16, Operator: 'D' },
    ];
    const { data, addedColumns } = mergeColumns(existing, incoming);
    expect(addedColumns).toEqual(['Weight', 'Operator']);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ Weight: 14, Operator: 'C' });
    expect(data[1]).toEqual({ Weight: 16, Operator: 'D' });
  });

  it('returns correct addedColumns array excluding existing columns', () => {
    const existing = [{ Weight: 10, Operator: 'A' }];
    const incoming = [{ Operator: 'X', Shift: 'Morning', Line: 'L1' }];
    const { data, addedColumns } = mergeColumns(existing, incoming);
    expect(addedColumns).toEqual(['Shift', 'Line']);
    expect(data[0]).toEqual({ Weight: 10, Operator: 'A', Shift: 'Morning', Line: 'L1' });
  });
});
