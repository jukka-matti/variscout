import { describe, it, expect } from 'vitest';
import { calculateStats, calculateMovingRangeSigma } from '../basic';

describe('calculateMovingRangeSigma', () => {
  it('calculates MR-based sigma for known data', () => {
    // Data: [10, 12, 11, 13, 10]
    // Moving ranges: |12-10|=2, |11-12|=1, |13-11|=2, |10-13|=3
    // MR-bar = (2+1+2+3)/4 = 2.0
    // sigma_within = 2.0 / 1.128 ≈ 1.7730
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([10, 12, 11, 13, 10]);
    expect(mrBar).toBeCloseTo(2.0, 4);
    expect(sigmaWithin).toBeCloseTo(2.0 / 1.128, 4);
  });

  it('returns zero for single value', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([42]);
    expect(mrBar).toBe(0);
    expect(sigmaWithin).toBe(0);
  });

  it('returns zero for empty array', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([]);
    expect(mrBar).toBe(0);
    expect(sigmaWithin).toBe(0);
  });

  it('handles two values', () => {
    // MR = |20-10| = 10, MR-bar = 10/1 = 10
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([10, 20]);
    expect(mrBar).toBeCloseTo(10, 4);
    expect(sigmaWithin).toBeCloseTo(10 / 1.128, 4);
  });

  it('returns zero sigma for identical values', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([5, 5, 5, 5]);
    expect(mrBar).toBe(0);
    expect(sigmaWithin).toBe(0);
  });
});

describe('calculateStats', () => {
  describe('basic statistics', () => {
    it('calculates mean and median for [1,2,3,4,5]', () => {
      const result = calculateStats([1, 2, 3, 4, 5]);
      expect(result.mean).toBeCloseTo(3, 8);
      expect(result.median).toBeCloseTo(3, 8);
    });

    it('calculates correct standard deviation', () => {
      // [1,2,3,4,5] sample stdDev = sqrt(10/4) = sqrt(2.5) ≈ 1.5811
      const result = calculateStats([1, 2, 3, 4, 5]);
      expect(result.stdDev).toBeCloseTo(Math.sqrt(2.5), 4);
    });

    it('calculates moving range sigma', () => {
      // [1,2,3,4,5]: MR = [1,1,1,1], MR-bar = 1, sigma_within = 1/1.128
      const result = calculateStats([1, 2, 3, 4, 5]);
      expect(result.mrBar).toBeCloseTo(1, 4);
      expect(result.sigmaWithin).toBeCloseTo(1 / 1.128, 4);
    });
  });

  describe('control limits', () => {
    it('calculates UCL and LCL as mean +/- 3*sigmaWithin', () => {
      const data = [10, 12, 11, 13, 10];
      const result = calculateStats(data);
      const expectedMean = 11.2;
      const expectedSigma = 2.0 / 1.128;
      expect(result.mean).toBeCloseTo(expectedMean, 4);
      expect(result.ucl).toBeCloseTo(expectedMean + 3 * expectedSigma, 4);
      expect(result.lcl).toBeCloseTo(expectedMean - 3 * expectedSigma, 4);
    });

    it('UCL and LCL are symmetric around mean', () => {
      const result = calculateStats([5, 10, 15, 20, 25]);
      expect(result.ucl - result.mean).toBeCloseTo(result.mean - result.lcl, 8);
    });
  });

  describe('capability indices (Cp/Cpk)', () => {
    it('calculates Cp with both spec limits', () => {
      // Cp = (USL - LSL) / (6 * sigmaWithin)
      const data = [10, 12, 11, 13, 10];
      const result = calculateStats(data, 20, 0);
      const expectedSigma = 2.0 / 1.128;
      expect(result.cp).toBeCloseTo(20 / (6 * expectedSigma), 4);
    });

    it('calculates Cpk with both spec limits', () => {
      // Cpk = min(CPU, CPL) where CPU = (USL-mean)/(3*sigma), CPL = (mean-LSL)/(3*sigma)
      const data = [10, 12, 11, 13, 10];
      const result = calculateStats(data, 20, 0);
      const mean = 11.2;
      const sigma = 2.0 / 1.128;
      const cpu = (20 - mean) / (3 * sigma);
      const cpl = (mean - 0) / (3 * sigma);
      expect(result.cpk).toBeCloseTo(Math.min(cpu, cpl), 4);
    });

    it('calculates Cpk with only USL', () => {
      const data = [10, 12, 11, 13, 10];
      const result = calculateStats(data, 20);
      const mean = 11.2;
      const sigma = 2.0 / 1.128;
      expect(result.cpk).toBeCloseTo((20 - mean) / (3 * sigma), 4);
      expect(result.cp).toBeUndefined();
    });

    it('calculates Cpk with only LSL', () => {
      const data = [10, 12, 11, 13, 10];
      const result = calculateStats(data, undefined, 0);
      const mean = 11.2;
      const sigma = 2.0 / 1.128;
      expect(result.cpk).toBeCloseTo((mean - 0) / (3 * sigma), 4);
      expect(result.cp).toBeUndefined();
    });

    it('returns undefined Cp/Cpk when no spec limits', () => {
      const result = calculateStats([10, 12, 11, 13, 10]);
      expect(result.cp).toBeUndefined();
      expect(result.cpk).toBeUndefined();
    });

    it('returns undefined Cp/Cpk when all values identical (sigmaWithin=0)', () => {
      const result = calculateStats([5, 5, 5, 5], 10, 0);
      expect(result.cp).toBeUndefined();
      expect(result.cpk).toBeUndefined();
    });
  });

  describe('out of spec percentage', () => {
    it('calculates percentage above USL', () => {
      // 2 of 5 values above USL=3
      const result = calculateStats([1, 2, 3, 4, 5], 3);
      expect(result.outOfSpecPercentage).toBeCloseTo(40, 4);
    });

    it('calculates percentage below LSL', () => {
      // 2 of 5 values below LSL=3
      const result = calculateStats([1, 2, 3, 4, 5], undefined, 3);
      expect(result.outOfSpecPercentage).toBeCloseTo(40, 4);
    });

    it('calculates percentage outside both limits', () => {
      // LSL=2, USL=4: values 1 and 5 are out => 40%
      const result = calculateStats([1, 2, 3, 4, 5], 4, 2);
      expect(result.outOfSpecPercentage).toBeCloseTo(40, 4);
    });

    it('returns 0% when all values in spec', () => {
      const result = calculateStats([2, 3, 4], 10, 0);
      expect(result.outOfSpecPercentage).toBe(0);
    });

    it('returns 0% when no spec limits', () => {
      const result = calculateStats([1, 2, 3]);
      expect(result.outOfSpecPercentage).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('returns zeros for empty data', () => {
      const result = calculateStats([]);
      expect(result.mean).toBe(0);
      expect(result.median).toBe(0);
      expect(result.stdDev).toBe(0);
      expect(result.sigmaWithin).toBe(0);
      expect(result.ucl).toBe(0);
      expect(result.lcl).toBe(0);
      expect(result.outOfSpecPercentage).toBe(0);
    });

    it('handles single value', () => {
      const result = calculateStats([42]);
      expect(result.mean).toBe(42);
      expect(result.median).toBe(42);
      expect(result.stdDev).toBe(0);
    });

    it('handles two values', () => {
      const result = calculateStats([10, 20]);
      expect(result.mean).toBeCloseTo(15, 8);
      expect(result.median).toBeCloseTo(15, 8);
    });

    it('handles negative values', () => {
      const result = calculateStats([-5, -3, -1, 1, 3, 5]);
      expect(result.mean).toBeCloseTo(0, 8);
    });

    it('handles all identical values', () => {
      const result = calculateStats([7, 7, 7, 7, 7]);
      expect(result.mean).toBe(7);
      expect(result.stdDev).toBe(0);
      expect(result.sigmaWithin).toBe(0);
      expect(result.mrBar).toBe(0);
      // UCL = LCL = mean when sigma=0
      expect(result.ucl).toBe(7);
      expect(result.lcl).toBe(7);
    });
  });
});
