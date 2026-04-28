import { describe, it, expect } from 'vitest';
import { distinctContextValues } from '../contextValueOptions';
import type { DataRow } from '../../types';

describe('distinctContextValues', () => {
  const rows: DataRow[] = [
    { product: 'Coke 12oz', shift: 'A', value: 1 },
    { product: 'Coke 16oz', shift: 'B', value: 2 },
    { product: 'Coke 12oz', shift: 'A', value: 3 },
    { product: 'Sprite 12oz', shift: '', value: 4 }, // empty shift
    { product: null as unknown as string, shift: 'C', value: 5 }, // null product
  ];

  it('returns distinct values for a column, sorted lexicographically', () => {
    expect(distinctContextValues(rows, 'product')).toEqual([
      'Coke 12oz',
      'Coke 16oz',
      'Sprite 12oz',
    ]);
  });

  it('excludes null and empty values', () => {
    expect(distinctContextValues(rows, 'shift')).toEqual(['A', 'B', 'C']);
  });

  it('returns empty array for absent column', () => {
    expect(distinctContextValues(rows, 'absent')).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(distinctContextValues([], 'product')).toEqual([]);
  });

  it('caps cardinality at 50 (returns first 50 sorted)', () => {
    const many: DataRow[] = Array.from({ length: 100 }, (_, i) => ({
      k: `v${String(i).padStart(3, '0')}`,
    }));
    const result = distinctContextValues(many, 'k');
    expect(result.length).toBe(50);
    expect(result[0]).toBe('v000');
    expect(result[49]).toBe('v049');
  });

  it('treats numeric values as strings (uses String() coercion)', () => {
    const numericRows: DataRow[] = [
      { batch: 1, value: 'a' },
      { batch: 2, value: 'b' },
      { batch: 1, value: 'c' },
    ];
    expect(distinctContextValues(numericRows, 'batch')).toEqual(['1', '2']);
  });
});
