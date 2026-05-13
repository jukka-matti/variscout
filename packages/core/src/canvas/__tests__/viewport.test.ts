import { describe, expect, it } from 'vitest';
import { inferLevel, isValidLevel, LOD_THRESHOLDS, type CanvasLevel } from '../viewport';

describe('canvas viewport levels', () => {
  it('infers l1 below the l1ToL2 threshold', () => {
    expect(inferLevel(0)).toBe<CanvasLevel>('l1');
    expect(inferLevel(LOD_THRESHOLDS.l1ToL2 - 0.001)).toBe<CanvasLevel>('l1');
  });

  it('infers l2 between thresholds', () => {
    expect(inferLevel(LOD_THRESHOLDS.l1ToL2)).toBe<CanvasLevel>('l2');
    expect(inferLevel(1.0)).toBe<CanvasLevel>('l2');
    expect(inferLevel(LOD_THRESHOLDS.l2ToL3 - 0.001)).toBe<CanvasLevel>('l2');
  });

  it('infers l3 at and above the l2ToL3 threshold', () => {
    expect(inferLevel(LOD_THRESHOLDS.l2ToL3)).toBe<CanvasLevel>('l3');
    expect(inferLevel(5.0)).toBe<CanvasLevel>('l3');
  });

  it('publishes fixed LOD thresholds', () => {
    expect(LOD_THRESHOLDS).toEqual({
      l1ToL2: 0.3,
      l2ToL3: 2.0,
    });
  });

  it('validates supported canvas levels', () => {
    expect(isValidLevel('l1')).toBe(true);
    expect(isValidLevel('l2')).toBe(true);
    expect(isValidLevel('l3')).toBe(true);
    expect(isValidLevel('l4')).toBe(false);
    expect(isValidLevel('')).toBe(false);
  });
});
