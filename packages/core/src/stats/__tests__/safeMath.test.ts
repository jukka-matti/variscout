import { describe, it, expect } from 'vitest';
import { finiteOrUndefined, safeDivide, computeOptimum } from '../safeMath';

describe('finiteOrUndefined', () => {
  it('returns the number for normal finite positive value', () => {
    expect(finiteOrUndefined(1)).toBe(1);
  });

  it('returns the number for normal finite negative value', () => {
    expect(finiteOrUndefined(-1)).toBe(-1);
  });

  it('returns zero', () => {
    expect(finiteOrUndefined(0)).toBe(0);
  });

  it('returns a fractional value', () => {
    expect(finiteOrUndefined(0.5)).toBeCloseTo(0.5);
  });

  it('returns a very small finite number', () => {
    expect(finiteOrUndefined(1e-300)).toBeCloseTo(1e-300);
  });

  it('returns undefined for NaN', () => {
    expect(finiteOrUndefined(NaN)).toBeUndefined();
  });

  it('returns undefined for Infinity', () => {
    expect(finiteOrUndefined(Infinity)).toBeUndefined();
  });

  it('returns undefined for -Infinity', () => {
    expect(finiteOrUndefined(-Infinity)).toBeUndefined();
  });
});

describe('safeDivide', () => {
  it('performs normal division', () => {
    expect(safeDivide(10, 2)).toBeCloseTo(5);
  });

  it('returns undefined for zero denominator', () => {
    expect(safeDivide(10, 0)).toBeUndefined();
  });

  it('returns undefined for near-zero denominator below default threshold', () => {
    expect(safeDivide(10, 1e-16)).toBeUndefined();
  });

  it('returns undefined for NaN numerator', () => {
    expect(safeDivide(NaN, 2)).toBeUndefined();
  });

  it('returns undefined for NaN denominator', () => {
    expect(safeDivide(10, NaN)).toBeUndefined();
  });

  it('returns undefined for Infinity numerator', () => {
    expect(safeDivide(Infinity, 2)).toBeUndefined();
  });

  it('returns undefined for -Infinity denominator', () => {
    expect(safeDivide(10, -Infinity)).toBeUndefined();
  });

  it('returns undefined for negative zero denominator', () => {
    expect(safeDivide(10, -0)).toBeUndefined();
  });

  it('respects custom minDenom threshold — denominator below threshold returns undefined', () => {
    expect(safeDivide(10, 0.005, 0.01)).toBeUndefined();
  });

  it('respects custom minDenom threshold — denominator above threshold returns result', () => {
    const result = safeDivide(10, 0.02, 0.01);
    expect(result).toBeCloseTo(500);
  });

  it('handles very small but valid denominator with default minDenom', () => {
    // 1e-10 is above the default minDenom of 1e-15, so this should return a finite result
    const result = safeDivide(1, 1e-10);
    expect(result).toBeCloseTo(1e10);
  });
});

describe('computeOptimum', () => {
  it('computes quadratic vertex correctly: linear=2, quad=-1, mean=5 → 6', () => {
    // vertex = b1 / (2*b2) = 2 / (2*-1) = -1
    // optimum = mean - vertex = 5 - (-1) = 6
    const result = computeOptimum(2, -1, 5);
    expect(result).toBeCloseTo(6);
  });

  it('returns undefined for near-zero quad coefficient', () => {
    expect(computeOptimum(2, 1e-16, 5)).toBeUndefined();
  });

  it('returns undefined for zero quad coefficient', () => {
    expect(computeOptimum(2, 0, 5)).toBeUndefined();
  });

  it('returns undefined for NaN linear coefficient', () => {
    expect(computeOptimum(NaN, -1, 5)).toBeUndefined();
  });

  it('returns undefined for NaN quad coefficient', () => {
    expect(computeOptimum(2, NaN, 5)).toBeUndefined();
  });

  it('returns undefined for NaN mean', () => {
    expect(computeOptimum(2, -1, NaN)).toBeUndefined();
  });

  it('returns finite result for large but valid coefficient ratio', () => {
    // vertex = 1e6 / (2 * -1e3) = -500
    // optimum = 100 - (-500) = 600
    const result = computeOptimum(1e6, -1e3, 100);
    expect(result).toBeCloseTo(600);
  });
});
