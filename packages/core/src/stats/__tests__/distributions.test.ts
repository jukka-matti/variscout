import { describe, it, expect } from 'vitest';
import {
  normalPDF,
  lnGamma,
  incompleteBeta,
  fDistributionPValue,
  tDistributionPValue,
} from '../distributions';

describe('normalPDF', () => {
  it('returns peak value at x=0', () => {
    // PDF(0) = 1/sqrt(2*pi) ≈ 0.3989
    expect(normalPDF(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 6);
  });

  it('is symmetric around zero', () => {
    expect(normalPDF(1)).toBeCloseTo(normalPDF(-1), 10);
    expect(normalPDF(2.5)).toBeCloseTo(normalPDF(-2.5), 10);
  });

  it('decreases with distance from zero', () => {
    expect(normalPDF(0)).toBeGreaterThan(normalPDF(1));
    expect(normalPDF(1)).toBeGreaterThan(normalPDF(2));
    expect(normalPDF(2)).toBeGreaterThan(normalPDF(3));
  });

  it('returns known value at x=1', () => {
    // PDF(1) = exp(-0.5) / sqrt(2*pi) ≈ 0.2420
    const expected = Math.exp(-0.5) / Math.sqrt(2 * Math.PI);
    expect(normalPDF(1)).toBeCloseTo(expected, 6);
  });
});

describe('lnGamma', () => {
  it('computes ln(Gamma(1)) = ln(0!) = 0', () => {
    expect(lnGamma(1)).toBeCloseTo(0, 6);
  });

  it('computes ln(Gamma(2)) = ln(1!) = 0', () => {
    expect(lnGamma(2)).toBeCloseTo(0, 6);
  });

  it('computes ln(Gamma(5)) = ln(4!) = ln(24)', () => {
    expect(lnGamma(5)).toBeCloseTo(Math.log(24), 6);
  });

  it('computes ln(Gamma(0.5)) = ln(sqrt(pi))', () => {
    // Gamma(0.5) = sqrt(pi)
    expect(lnGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 5);
  });

  it('computes ln(Gamma(10)) = ln(9!)', () => {
    // 9! = 362880
    expect(lnGamma(10)).toBeCloseTo(Math.log(362880), 4);
  });
});

describe('incompleteBeta', () => {
  it('returns 0 when x=0', () => {
    expect(incompleteBeta(2, 3, 0)).toBe(0);
  });

  it('returns 1 when x=1', () => {
    expect(incompleteBeta(2, 3, 1)).toBe(1);
  });

  it('returns 0.5 at the median for symmetric beta(a,a)', () => {
    // For a symmetric Beta(a,a), the median is at x=0.5
    // I_0.5(a, a) = 0.5
    expect(incompleteBeta(3, 3, 0.5)).toBeCloseTo(0.5, 4);
  });

  it('returns known value for Beta(1,1) = uniform', () => {
    // I_x(1,1) = x for the uniform distribution
    expect(incompleteBeta(1, 1, 0.3)).toBeCloseTo(0.3, 6);
    expect(incompleteBeta(1, 1, 0.7)).toBeCloseTo(0.7, 6);
  });
});

describe('fDistributionPValue', () => {
  it('returns 1 for f=0', () => {
    expect(fDistributionPValue(0, 1, 10)).toBe(1);
  });

  it('returns 0 for infinite f', () => {
    expect(fDistributionPValue(Infinity, 1, 10)).toBe(0);
  });

  it('returns p-value between 0 and 1 for typical F', () => {
    const p = fDistributionPValue(4.0, 2, 20);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  it('known critical value: F(1,4)=7.71 → p ≈ 0.05', () => {
    // F critical value at alpha=0.05 with df1=1, df2=4 is ~7.71
    const p = fDistributionPValue(7.71, 1, 4);
    expect(p).toBeCloseTo(0.05, 1);
  });

  it('known critical value: F(2,6)=5.14 → p ≈ 0.05', () => {
    // F critical value at alpha=0.05 with df1=2, df2=6 is ~5.14
    const p = fDistributionPValue(5.14, 2, 6);
    expect(p).toBeCloseTo(0.05, 1);
  });

  it('larger F gives smaller p-value', () => {
    const p1 = fDistributionPValue(2.0, 3, 20);
    const p2 = fDistributionPValue(5.0, 3, 20);
    expect(p2).toBeLessThan(p1);
  });

  it('very large F gives very small p-value', () => {
    const p = fDistributionPValue(100, 2, 30);
    expect(p).toBeLessThan(0.001);
  });
});

describe('tDistributionPValue', () => {
  it('returns 1 for t=0 (two-tailed, perfectly centered)', () => {
    const p = tDistributionPValue(0, 10);
    expect(p).toBeCloseTo(1, 4);
  });

  it('returns 0 for infinite t', () => {
    expect(tDistributionPValue(Infinity, 10)).toBe(0);
  });

  it('returns 1 for df <= 0', () => {
    expect(tDistributionPValue(2.0, 0)).toBe(1);
    expect(tDistributionPValue(2.0, -1)).toBe(1);
  });

  it('is symmetric: same p for positive and negative t', () => {
    const p1 = tDistributionPValue(2.5, 15);
    const p2 = tDistributionPValue(-2.5, 15);
    expect(p1).toBeCloseTo(p2, 8);
  });

  it('known critical value: t(10)=2.228 → p ≈ 0.05 (two-tailed)', () => {
    const p = tDistributionPValue(2.228, 10);
    expect(p).toBeCloseTo(0.05, 1);
  });

  it('larger |t| gives smaller p-value', () => {
    const p1 = tDistributionPValue(1.0, 20);
    const p2 = tDistributionPValue(3.0, 20);
    expect(p2).toBeLessThan(p1);
  });
});
