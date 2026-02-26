import { describe, it, expect } from 'vitest';
import { simulateOverallImpact, normalCDF, normalPDF } from '../variation';

describe('normalPDF', () => {
  it('returns peak value at the mean', () => {
    const peak = normalPDF(5, 5, 1);
    // PDF of standard normal at z=0 ≈ 0.3989
    expect(peak).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 4);
  });

  it('is symmetric around the mean', () => {
    expect(normalPDF(3, 5, 1)).toBeCloseTo(normalPDF(7, 5, 1), 10);
  });

  it('returns 0 away from mean when stdDev is 0', () => {
    expect(normalPDF(1, 5, 0)).toBe(0);
  });
});

describe('normalCDF', () => {
  it('returns 0.5 at z=0', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 4);
  });

  it('returns ~0.8413 at z=1', () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });

  it('returns ~0.0228 at z=-2', () => {
    expect(normalCDF(-2)).toBeCloseTo(0.0228, 3);
  });
});

describe('simulateOverallImpact', () => {
  const specs = { lsl: 7, usl: 13 };

  it('identity case: projected = current → no change', () => {
    const subset = { mean: 10, stdDev: 1, count: 50 };
    const complement = { mean: 10, stdDev: 1, count: 50 };
    const projected = { mean: 10, stdDev: 1 }; // same as subset

    const result = simulateOverallImpact(subset, complement, projected, specs);

    expect(result.subsetFraction).toBeCloseTo(0.5, 4);
    expect(result.currentOverall.mean).toBeCloseTo(result.projectedOverall.mean, 6);
    expect(result.currentOverall.stdDev).toBeCloseTo(result.projectedOverall.stdDev, 6);
    if (result.currentOverall.cpk !== undefined && result.projectedOverall.cpk !== undefined) {
      expect(result.projectedOverall.cpk).toBeCloseTo(result.currentOverall.cpk, 4);
    }
    // Improvements should be near zero
    if (result.improvements.cpkChange !== undefined) {
      expect(Math.abs(result.improvements.cpkChange)).toBeLessThan(0.001);
    }
  });

  it('full dataset (subset = all data): overall = subset', () => {
    const subset = { mean: 10, stdDev: 1.5, count: 100 };
    const complement = { mean: 0, stdDev: 0, count: 0 };
    // N=100, m=0 → weighted mean = subset mean
    // But count 0 means division would be N=100
    // Actually with m=0, formula: mean = (100*10 + 0*0)/100 = 10
    const projected = { mean: 9.5, stdDev: 1.2 };

    const result = simulateOverallImpact(subset, complement, projected, specs);

    expect(result.subsetFraction).toBeCloseTo(1.0, 4);
    expect(result.projectedOverall.mean).toBeCloseTo(9.5, 4);
    expect(result.projectedOverall.stdDev).toBeCloseTo(1.2, 4);
  });

  it('weighted recombination math with known values', () => {
    // Subset: 40 samples, mean=8, stdDev=1
    // Complement: 60 samples, mean=12, stdDev=1
    // Current overall mean = (40*8 + 60*12)/100 = (320+720)/100 = 10.4
    const subset = { mean: 8, stdDev: 1, count: 40 };
    const complement = { mean: 12, stdDev: 1, count: 60 };
    const projected = { mean: 10, stdDev: 0.8 }; // shift mean toward center, reduce spread

    const result = simulateOverallImpact(subset, complement, projected, specs);

    expect(result.subsetFraction).toBeCloseTo(0.4, 4);
    expect(result.currentOverall.mean).toBeCloseTo(10.4, 4);

    // Projected overall mean = (40*10 + 60*12)/100 = (400+720)/100 = 11.2
    expect(result.projectedOverall.mean).toBeCloseTo(11.2, 4);
  });

  it('Cpk improves when subset is shifted toward center', () => {
    const subset = { mean: 8, stdDev: 1, count: 50 };
    const complement = { mean: 10, stdDev: 1, count: 50 };
    const projected = { mean: 10, stdDev: 1 }; // shift subset mean to match complement

    const result = simulateOverallImpact(subset, complement, projected, specs);

    // After improvement, both groups have mean=10, so overall mean=10 (centered)
    // Cpk should be better than before
    expect(result.projectedOverall.cpk).toBeGreaterThan(result.currentOverall.cpk!);
    expect(result.improvements.cpkChange).toBeGreaterThan(0);
  });

  it('yield improves with better centering', () => {
    const subset = { mean: 7.5, stdDev: 1.5, count: 30 };
    const complement = { mean: 10, stdDev: 1, count: 70 };
    const projected = { mean: 10, stdDev: 1 };

    const result = simulateOverallImpact(subset, complement, projected, specs);

    expect(result.projectedOverall.yield).toBeGreaterThan(result.currentOverall.yield!);
    expect(result.improvements.yieldChange).toBeGreaterThan(0);
  });

  it('returns undefined Cpk/yield when no specs', () => {
    const subset = { mean: 10, stdDev: 1, count: 50 };
    const complement = { mean: 10, stdDev: 1, count: 50 };
    const projected = { mean: 10.5, stdDev: 0.8 };

    const result = simulateOverallImpact(subset, complement, projected);

    expect(result.currentOverall.cpk).toBeUndefined();
    expect(result.currentOverall.yield).toBeUndefined();
    expect(result.projectedOverall.cpk).toBeUndefined();
    expect(result.projectedOverall.yield).toBeUndefined();
  });

  it('handles one-sided specs (USL only)', () => {
    const subset = { mean: 10, stdDev: 1, count: 50 };
    const complement = { mean: 10, stdDev: 1, count: 50 };
    const projected = { mean: 9.5, stdDev: 0.8 };

    const result = simulateOverallImpact(subset, complement, projected, { usl: 13 });

    expect(result.currentOverall.cpk).toBeDefined();
    expect(result.projectedOverall.cpk).toBeDefined();
    // Moving mean further from USL with less spread → better Cpk
    expect(result.projectedOverall.cpk!).toBeGreaterThan(result.currentOverall.cpk!);
  });
});
