import { describe, expect, it } from 'vitest';
import {
  decodeOutcomeDropId,
  encodeOutcomeDropId,
  isOutcomeDropId,
  OUTCOME_ZONE_DROP_ID,
} from '../encodeOutcomeDropId';

describe('encodeOutcomeDropId', () => {
  it('encode returns the singleton drop id', () => {
    expect(encodeOutcomeDropId()).toBe('outcome-zone:singleton');
    expect(encodeOutcomeDropId()).toBe(OUTCOME_ZONE_DROP_ID);
  });

  it('isOutcomeDropId type-guards the singleton id', () => {
    expect(isOutcomeDropId('outcome-zone:singleton')).toBe(true);
    expect(isOutcomeDropId('column:Diameter')).toBe(false);
    expect(isOutcomeDropId(123)).toBe(false);
  });

  it('decode returns "singleton" for canonical id, null otherwise', () => {
    expect(decodeOutcomeDropId('outcome-zone:singleton')).toBe('singleton');
    expect(decodeOutcomeDropId('outcome-zone:other')).toBeNull();
    expect(decodeOutcomeDropId('canvas:empty')).toBeNull();
  });
});
