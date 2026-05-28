import { describe, it, expect } from 'vitest';
import { computeSegmentStats } from '../segmentConfidence';
import { mulberry32 } from '../../__tests__/helpers/stressDataGenerator';

/**
 * Deterministic normal-distribution sampler via Box-Muller using a seeded RNG.
 * NEVER use Math.random in core — the package forbids it.
 */
function seededNormalSample(rng: () => number, mean: number, std: number): number {
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

describe('computeSegmentStats', () => {
  it('splits a sorted sample into two roughly equal segments with defined AD p-values when n >= 7 per segment', () => {
    const rng = mulberry32(42);
    const values: number[] = [];
    for (let i = 0; i < 100; i++) values.push(seededNormalSample(rng, 50, 5));
    values.sort((a, b) => a - b);

    const segments = computeSegmentStats(values, [50]);

    expect(segments).toHaveLength(2);
    expect(segments[0].n + segments[1].n).toBe(100);
    // Sample drawn from N(50, 5) has roughly half its mass below 50, but with
    // n=100 the actual split is noisy (typically 45-55 either side).
    expect(segments[0].percentShare).toBeGreaterThan(40);
    expect(segments[0].percentShare).toBeLessThan(60);
    expect(segments[1].percentShare).toBeGreaterThan(40);
    expect(segments[1].percentShare).toBeLessThan(60);
    expect(segments[0].adPValue).toBeDefined();
    expect(segments[1].adPValue).toBeDefined();
    expect(segments[0].mean).toBeDefined();
    expect(segments[1].mean).toBeDefined();
    expect(segments[0].range.lower).toBeNull();
    expect(segments[0].range.upper).toBe(50);
    expect(segments[1].range.lower).toBe(50);
    expect(segments[1].range.upper).toBeNull();
  });

  it('returns undefined adPValue when n < 7', () => {
    const segments = computeSegmentStats([1, 2, 3, 4, 5], []);
    expect(segments).toHaveLength(1);
    expect(segments[0].n).toBe(5);
    expect(segments[0].adPValue).toBeUndefined();
    expect(segments[0].mean).toBeCloseTo(3, 6);
    expect(segments[0].percentShare).toBeCloseTo(100, 6);
    expect(segments[0].range.lower).toBeNull();
    expect(segments[0].range.upper).toBeNull();
  });

  it('handles an empty values array with a single empty segment', () => {
    const segments = computeSegmentStats([], []);
    expect(segments).toHaveLength(1);
    expect(segments[0].n).toBe(0);
    expect(segments[0].mean).toBeUndefined();
    expect(segments[0].percentShare).toBeCloseTo(0, 6);
    expect(segments[0].adPValue).toBeUndefined();
  });

  it('percent shares across segments sum to 100', () => {
    const rng = mulberry32(7);
    const values: number[] = [];
    for (let i = 0; i < 150; i++) values.push(seededNormalSample(rng, 50, 10));
    values.sort((a, b) => a - b);

    const segments = computeSegmentStats(values, [40, 60]);
    const total = segments.reduce((acc, s) => acc + s.percentShare, 0);
    expect(total).toBeCloseTo(100, 6);
  });
});
