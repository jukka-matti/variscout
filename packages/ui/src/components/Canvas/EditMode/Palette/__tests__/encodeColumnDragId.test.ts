import { describe, it, expect } from 'vitest';
import { encodeColumnDragId, decodeColumnDragId, isColumnDragId } from '../encodeColumnDragId';

describe('encodeColumnDragId', () => {
  it('round-trips a simple column name', () => {
    const id = encodeColumnDragId('Speed');
    expect(id).toBe('column:Speed');
    expect(decodeColumnDragId(id)).toBe('Speed');
  });

  it('round-trips a column name with spaces', () => {
    const id = encodeColumnDragId('Lead time (h)');
    expect(decodeColumnDragId(id)).toBe('Lead time (h)');
  });

  it('isColumnDragId returns true for column ids and false for others', () => {
    expect(isColumnDragId('column:Speed')).toBe(true);
    expect(isColumnDragId('chip:abc-123')).toBe(false);
    expect(isColumnDragId('Speed')).toBe(false);
  });

  it('decodeColumnDragId returns null for non-column ids', () => {
    expect(decodeColumnDragId('chip:abc-123')).toBeNull();
    expect(decodeColumnDragId('Speed')).toBeNull();
  });
});
