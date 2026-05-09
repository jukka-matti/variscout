import { describe, it, expect } from 'vitest';
import { computeSourceHash, shouldShowDrift } from '../snapshot';
import type { DriftableSnapshot, DriftableCurrent } from '../snapshot';

describe('computeSourceHash', () => {
  it('is deterministic — same value produces the same hash on repeated calls', () => {
    const value = { x: 1, y: [2, 3], z: 'hello' };
    const h1 = computeSourceHash(value);
    const h2 = computeSourceHash(value);
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different values', () => {
    const h1 = computeSourceHash({ a: 1 });
    const h2 = computeSourceHash({ a: 2 });
    expect(h1).not.toBe(h2);
  });

  it('returns a stable string for undefined', () => {
    const h = computeSourceHash(undefined);
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
    // deterministic
    expect(h).toBe(computeSourceHash(undefined));
  });

  it('returns a stable string for null', () => {
    const h = computeSourceHash(null);
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
    // deterministic
    expect(h).toBe(computeSourceHash(null));
  });
});

describe('shouldShowDrift', () => {
  it('returns true when snapshot.sourceHash differs from current.hash', () => {
    const snapshot: DriftableSnapshot<string> = { value: 'old', sourceHash: 'abc-123' };
    const current: DriftableCurrent<string> = { value: 'new', hash: 'xyz-456' };
    expect(shouldShowDrift(snapshot, current)).toBe(true);
  });

  it('returns false when hashes match', () => {
    const hash = computeSourceHash({ x: 42 });
    const snapshot: DriftableSnapshot<number> = { value: 42, sourceHash: hash };
    const current: DriftableCurrent<number> = { value: 42, hash };
    expect(shouldShowDrift(snapshot, current)).toBe(false);
  });
});
