import { describe, it, expect } from 'vitest';
import type { DataRow } from '@variscout/core';
import { augmentWithTimeColumns } from '@variscout/core';
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

describe('time column re-extraction after append', () => {
  it('appended rows get time-derived columns when re-applying augmentWithTimeColumns', () => {
    const existing: DataRow[] = [
      {
        Weight: 10,
        Timestamp: '2025-06-15T10:00:00Z',
        Timestamp_Year: '2025',
        Timestamp_Month: 'Jun',
      },
      {
        Weight: 12,
        Timestamp: '2025-06-16T11:00:00Z',
        Timestamp_Year: '2025',
        Timestamp_Month: 'Jun',
      },
    ];
    const incoming: DataRow[] = [
      { Weight: 14, Timestamp: '2025-07-01T09:00:00Z' },
      { Weight: 16, Timestamp: '2025-07-02T14:00:00Z' },
    ];

    const merged = mergeRows(existing, incoming);

    // Before re-extraction, appended rows have null time-derived columns
    expect(merged[2].Timestamp_Year).toBeNull();
    expect(merged[2].Timestamp_Month).toBeNull();

    // Re-apply time extraction (simulates what reapplyTimeColumns does)
    augmentWithTimeColumns(merged, 'Timestamp', {
      extractYear: true,
      extractMonth: true,
      extractWeek: false,
      extractDayOfWeek: false,
      extractHour: false,
    });

    // After re-extraction, all rows have time-derived columns
    expect(merged[0].Timestamp_Year).toBe('2025');
    expect(merged[0].Timestamp_Month).toBe('Jun');
    expect(merged[2].Timestamp_Year).toBe('2025');
    expect(merged[2].Timestamp_Month).toBe('Jul');
    expect(merged[3].Timestamp_Year).toBe('2025');
    expect(merged[3].Timestamp_Month).toBe('Jul');
  });
});
