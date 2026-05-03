// packages/core/src/scopeDimensions/__tests__/suggestPrimaryDimensions.test.ts
import { describe, expect, it } from 'vitest';
import { suggestPrimaryDimensions } from '../suggestPrimaryDimensions';

describe('suggestPrimaryDimensions', () => {
  const cols = [
    { name: 'product_id', uniqueCount: 9 },
    { name: 'lot_id', uniqueCount: 87 },
    { name: 'shift', uniqueCount: 3 },
    { name: 'batch_id', uniqueCount: 412 },
    { name: 'operator_id', uniqueCount: 12 },
    { name: 'random_col', uniqueCount: 5 },
    { name: 'tiny_col', uniqueCount: 2 },
  ];

  it('suggests columns with cardinality 3-50 + name keyword match', () => {
    const result = suggestPrimaryDimensions(cols);
    expect(result).toContain('product_id');
    expect(result).toContain('shift');
    expect(result).toContain('operator_id');
  });

  it('excludes high-cardinality columns (>50 levels)', () => {
    const result = suggestPrimaryDimensions(cols);
    expect(result).not.toContain('lot_id');
    expect(result).not.toContain('batch_id');
  });

  it('excludes very low cardinality columns (<3 levels)', () => {
    const result = suggestPrimaryDimensions(cols);
    expect(result).not.toContain('tiny_col');
  });

  it('excludes columns without name keyword match', () => {
    const result = suggestPrimaryDimensions(cols);
    expect(result).not.toContain('random_col');
  });

  it('returns empty array when no columns match', () => {
    expect(suggestPrimaryDimensions([{ name: 'foo', uniqueCount: 5 }])).toEqual([]);
  });
});
