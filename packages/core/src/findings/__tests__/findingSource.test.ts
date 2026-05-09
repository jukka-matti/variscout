/**
 * Tests for FindingSource shape — type-level + round-trip.
 *
 * Covers Task 17: brushedRange optional field on ichart variant.
 */
import { describe, it, expect } from 'vitest';
import type { FindingSource } from '../types';

const ROLLING_LENS = { mode: 'rolling' as const, windowSize: 50 };

describe('FindingSource.ichart brushedRange', () => {
  it('constructs ichart source without brushedRange (backward compatibility)', () => {
    const source: FindingSource = {
      chart: 'ichart',
      anchorX: 10,
      anchorY: 5.5,
      timeLens: ROLLING_LENS,
    };
    // TypeScript compiles => shape is valid without brushedRange
    expect(source.chart).toBe('ichart');
    expect(source.anchorX).toBe(10);
    expect(source.anchorY).toBeCloseTo(5.5, 5);
    // brushedRange absent
    expect((source as { brushedRange?: unknown }).brushedRange).toBeUndefined();
  });

  it('constructs ichart source with brushedRange and preserves it through JSON round-trip', () => {
    const source: FindingSource = {
      chart: 'ichart',
      anchorX: 20,
      anchorY: 3.0,
      timeLens: ROLLING_LENS,
      brushedRange: { startIdx: 12, endIdx: 28 },
    };
    const serialized = JSON.stringify(source);
    const deserialized: FindingSource = JSON.parse(serialized);

    if (deserialized.chart !== 'ichart') throw new Error('chart discriminant lost');
    expect(deserialized.brushedRange).toEqual({ startIdx: 12, endIdx: 28 });
    expect(deserialized.brushedRange?.startIdx).toBe(12);
    expect(deserialized.brushedRange?.endIdx).toBe(28);
    expect(deserialized.timeLens).toEqual(ROLLING_LENS);
  });
});
