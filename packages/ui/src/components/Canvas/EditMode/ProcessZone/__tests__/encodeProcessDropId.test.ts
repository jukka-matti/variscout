import { describe, expect, it } from 'vitest';
import { encodeProcessDropId, isProcessDropId, PROCESS_ZONE_DROP_ID } from '../encodeProcessDropId';

describe('encodeProcessDropId', () => {
  it('encode returns the singleton drop id', () => {
    expect(encodeProcessDropId()).toBe('process-zone:singleton');
    expect(encodeProcessDropId()).toBe(PROCESS_ZONE_DROP_ID);
  });

  it('isProcessDropId type-guards the singleton id', () => {
    expect(isProcessDropId('process-zone:singleton')).toBe(true);
    expect(isProcessDropId('column:StepName')).toBe(false);
    expect(isProcessDropId(123)).toBe(false);
    expect(isProcessDropId(undefined)).toBe(false);
    expect(isProcessDropId(null)).toBe(false);
  });
});
