import { describe, expect, it } from 'vitest';
import {
  decodeFactorDropId,
  encodeFactorDropId,
  isFactorDropId,
  FACTOR_ZONE_GLOBAL_DROP_ID,
} from '../encodeFactorDropId';

describe('encodeFactorDropId', () => {
  it('encode("global") returns the global drop id', () => {
    expect(encodeFactorDropId('global')).toBe('factor-zone:global');
    expect(encodeFactorDropId('global')).toBe(FACTOR_ZONE_GLOBAL_DROP_ID);
  });

  it('encode({ stepId }) returns the per-step drop id', () => {
    expect(encodeFactorDropId({ stepId: 's-mix' })).toBe('factor-zone:step:s-mix');
    expect(encodeFactorDropId({ stepId: 'abc-123' })).toBe('factor-zone:step:abc-123');
  });

  it('isFactorDropId type-guards both shapes', () => {
    expect(isFactorDropId('factor-zone:global')).toBe(true);
    expect(isFactorDropId('factor-zone:step:s-mix')).toBe(true);
    expect(isFactorDropId('outcome-zone:singleton')).toBe(false);
    expect(isFactorDropId('column:Temp')).toBe(false);
    expect(isFactorDropId(123)).toBe(false);
  });

  it('decode returns scope discriminated union or null', () => {
    expect(decodeFactorDropId('factor-zone:global')).toEqual({ scope: 'global' });
    expect(decodeFactorDropId('factor-zone:step:s-mix')).toEqual({
      scope: 'step',
      stepId: 's-mix',
    });
    expect(decodeFactorDropId('factor-zone:step:multi:colon')).toEqual({
      scope: 'step',
      stepId: 'multi:colon',
    });
    expect(decodeFactorDropId('factor-zone:other')).toBeNull();
    expect(decodeFactorDropId('canvas:empty')).toBeNull();
  });

  it('decode preserves empty stepId as null (malformed)', () => {
    expect(decodeFactorDropId('factor-zone:step:')).toBeNull();
  });
});
