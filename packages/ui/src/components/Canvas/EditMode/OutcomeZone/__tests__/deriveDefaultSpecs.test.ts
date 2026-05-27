import { describe, expect, it } from 'vitest';
import { deriveDefaultSpecs } from '../deriveDefaultSpecs';

describe('deriveDefaultSpecs', () => {
  it('nominalIsBest: target = mean, LSL/USL undefined, Cpk = 1.33', () => {
    const result = deriveDefaultSpecs([1, 2, 3, 4, 5], 'nominalIsBest');
    expect(result.target).toBe(3);
    expect(result.lsl).toBeUndefined();
    expect(result.usl).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('smallerIsBetter: all spec values undefined except Cpk', () => {
    const result = deriveDefaultSpecs([1, 2, 3, 4, 5], 'smallerIsBetter');
    expect(result.target).toBeUndefined();
    expect(result.lsl).toBeUndefined();
    expect(result.usl).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('largerIsBetter: all spec values undefined except Cpk', () => {
    const result = deriveDefaultSpecs([1, 2, 3, 4, 5], 'largerIsBetter');
    expect(result.target).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('empty values: all undefined except Cpk', () => {
    const result = deriveDefaultSpecs([], 'nominalIsBest');
    expect(result.target).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('ignores non-finite values when computing mean', () => {
    const result = deriveDefaultSpecs([1, 2, NaN, 3, Infinity], 'nominalIsBest');
    expect(result.target).toBe(2);
  });
});
