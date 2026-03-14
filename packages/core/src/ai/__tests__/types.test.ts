import { describe, it, expect } from 'vitest';
import { isFactorRole } from '../types';

describe('isFactorRole', () => {
  it('returns true for valid FactorRole values', () => {
    expect(isFactorRole('equipment')).toBe(true);
    expect(isFactorRole('temporal')).toBe(true);
    expect(isFactorRole('operator')).toBe(true);
    expect(isFactorRole('material')).toBe(true);
    expect(isFactorRole('location')).toBe(true);
    expect(isFactorRole('unknown')).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isFactorRole('foo')).toBe(false);
    expect(isFactorRole('')).toBe(false);
    expect(isFactorRole('EQUIPMENT')).toBe(false);
    expect(isFactorRole('spatial')).toBe(false);
  });
});
