import { describe, expect, it } from 'vitest';
import {
  decodeOutcomeDropId,
  encodeOutcomeDropId,
  isOutcomeDropId,
  OUTCOME_ZONE_SINGLETON_DROP_ID,
} from '../encodeOutcomeDropId';

describe('encodeOutcomeDropId', () => {
  it('encode("singleton") returns the singleton drop id', () => {
    expect(encodeOutcomeDropId('singleton')).toBe('outcome-zone:singleton');
    expect(encodeOutcomeDropId('singleton')).toBe(OUTCOME_ZONE_SINGLETON_DROP_ID);
  });

  it('encode({ stepId }) returns the per-step drop id', () => {
    expect(encodeOutcomeDropId({ stepId: 'step-x' })).toBe('outcome-zone:step:step-x');
    expect(encodeOutcomeDropId({ stepId: 'abc-123' })).toBe('outcome-zone:step:abc-123');
  });

  it('isOutcomeDropId type-guards both shapes', () => {
    expect(isOutcomeDropId('outcome-zone:singleton')).toBe(true);
    expect(isOutcomeDropId('outcome-zone:step:step-x')).toBe(true);
    expect(isOutcomeDropId('factor-zone:global')).toBe(false);
    expect(isOutcomeDropId('column:Diameter')).toBe(false);
    expect(isOutcomeDropId(123)).toBe(false);
  });

  it('decode returns scope discriminated union or null', () => {
    expect(decodeOutcomeDropId('outcome-zone:singleton')).toEqual({ scope: 'singleton' });
    expect(decodeOutcomeDropId('outcome-zone:step:step-x')).toEqual({
      scope: 'step',
      stepId: 'step-x',
    });
    expect(decodeOutcomeDropId('outcome-zone:step:multi:colon')).toEqual({
      scope: 'step',
      stepId: 'multi:colon',
    });
    expect(decodeOutcomeDropId('outcome-zone:other')).toBeNull();
    expect(decodeOutcomeDropId('canvas:empty')).toBeNull();
  });

  it('decode preserves empty stepId as null (malformed)', () => {
    expect(decodeOutcomeDropId('outcome-zone:step:')).toBeNull();
  });
});
