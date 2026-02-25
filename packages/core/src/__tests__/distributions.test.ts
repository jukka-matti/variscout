/**
 * Direct tests for internal distribution functions.
 *
 * These functions are not exported from @variscout/core but are critical
 * infrastructure for ANOVA p-values, regression significance, and probability
 * plots. Reference values from R pf(), pt(), lgamma(), pbeta().
 */
import { describe, it, expect } from 'vitest';

import {
  normalPDF,
  lnGamma,
  incompleteBeta,
  fDistributionPValue,
  tDistributionPValue,
} from '../stats/distributions';

// ============================================================================
// normalPDF
// ============================================================================

describe('normalPDF', () => {
  it('standard normal peak at x=0', () => {
    // φ(0) = 1/√(2π) ≈ 0.3989422804014327
    expect(normalPDF(0)).toBeCloseTo(0.39894228, 7);
  });

  it('symmetric: φ(-x) = φ(x)', () => {
    expect(normalPDF(-1.5)).toBeCloseTo(normalPDF(1.5), 15);
    expect(normalPDF(-3.0)).toBeCloseTo(normalPDF(3.0), 15);
  });

  it('known values at ±1σ and ±2σ', () => {
    // φ(1) ≈ 0.24197
    expect(normalPDF(1)).toBeCloseTo(0.24197, 4);
    // φ(2) ≈ 0.05399
    expect(normalPDF(2)).toBeCloseTo(0.05399, 4);
  });

  it('extreme values decay toward zero', () => {
    expect(normalPDF(10)).toBeLessThan(1e-20);
    expect(normalPDF(-10)).toBeLessThan(1e-20);
    expect(normalPDF(10)).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// lnGamma
// ============================================================================

describe('lnGamma', () => {
  it('lnGamma(1) = ln(0!) = 0', () => {
    expect(lnGamma(1)).toBeCloseTo(0, 10);
  });

  it('lnGamma(2) = ln(1!) = 0', () => {
    expect(lnGamma(2)).toBeCloseTo(0, 10);
  });

  it('lnGamma(5) = ln(4!) = ln(24)', () => {
    expect(lnGamma(5)).toBeCloseTo(Math.log(24), 8);
  });

  it('lnGamma(0.5) = ln(√π) ≈ 0.5724', () => {
    // Γ(0.5) = √π ≈ 1.7724538509
    expect(lnGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 6);
  });

  it('lnGamma(10) = ln(9!) = ln(362880)', () => {
    expect(lnGamma(10)).toBeCloseTo(Math.log(362880), 6);
  });

  it('reflection formula: small values via Γ(x)Γ(1-x) = π/sin(πx)', () => {
    // lnGamma(0.25) — R: lgamma(0.25) ≈ 1.28802252
    expect(lnGamma(0.25)).toBeCloseTo(1.28802252, 4);
  });
});

// ============================================================================
// incompleteBeta
// ============================================================================

describe('incompleteBeta', () => {
  it('boundary: I(a,b,0) = 0', () => {
    expect(incompleteBeta(2, 3, 0)).toBe(0);
  });

  it('boundary: I(a,b,1) = 1', () => {
    expect(incompleteBeta(2, 3, 1)).toBe(1);
  });

  it('Beta(1,1) = Uniform: I(1,1,x) = x', () => {
    // Regularized incomplete beta for a=b=1 is the identity
    expect(incompleteBeta(1, 1, 0.3)).toBeCloseTo(0.3, 4);
    expect(incompleteBeta(1, 1, 0.7)).toBeCloseTo(0.7, 4);
  });

  it('Beta(2,2) symmetry: I(2,2,0.5) = 0.5', () => {
    expect(incompleteBeta(2, 2, 0.5)).toBeCloseTo(0.5, 6);
  });

  it('Beta(1,2,0.3) = 2x - x² (closed form)', () => {
    // I_x(1,2) = 2x - x² for x ∈ [0,1] (exact closed form)
    // x=0.3: 2*0.3 - 0.09 = 0.51
    expect(incompleteBeta(1, 2, 0.3)).toBeCloseTo(0.51, 3);
    // x=0.7: 2*0.7 - 0.49 = 0.91
    expect(incompleteBeta(1, 2, 0.7)).toBeCloseTo(0.91, 3);
  });
});

// ============================================================================
// fDistributionPValue
// ============================================================================

describe('fDistributionPValue', () => {
  it('f=0 returns 1 (no evidence against null)', () => {
    expect(fDistributionPValue(0, 2, 20)).toBe(1);
  });

  it('f=Infinity returns 0', () => {
    expect(fDistributionPValue(Infinity, 2, 20)).toBe(0);
  });

  it('F(4.06, 2, 20) ≈ 0.033 (R: pf(4.06, 2, 20, lower.tail=FALSE))', () => {
    // R: pf(4.06, 2, 20, lower.tail=FALSE) → 0.03295...
    const p = fDistributionPValue(4.06, 2, 20);
    expect(p).toBeCloseTo(0.033, 2);
    expect(p).toBeLessThan(0.05);
  });

  it('large df2 approaches chi-square: F(3.0, 2, 1000) ≈ 0.050', () => {
    // R: pf(3.0, 2, 1000, lower.tail=FALSE) → 0.04996...
    const p = fDistributionPValue(3.0, 2, 1000);
    expect(p).toBeCloseTo(0.05, 2);
  });

  it('negative f returns 1', () => {
    expect(fDistributionPValue(-5, 3, 10)).toBe(1);
  });
});

// ============================================================================
// tDistributionPValue
// ============================================================================

describe('tDistributionPValue', () => {
  it('t(2.0, 30): R pt(2.0, 30, lower.tail=FALSE)*2 ≈ 0.0547', () => {
    const p = tDistributionPValue(2.0, 30);
    expect(p).toBeCloseTo(0.0547, 3);
  });

  it('t(1.96, 120) approaches normal: ≈ 0.052', () => {
    // Large df → approaches z-distribution
    const p = tDistributionPValue(1.96, 120);
    expect(p).toBeCloseTo(0.052, 2);
    // Should be near but slightly above 0.05 for finite df
    expect(p).toBeGreaterThan(0.04);
    expect(p).toBeLessThan(0.06);
  });

  it('t=0 returns 1 (no evidence)', () => {
    expect(tDistributionPValue(0, 30)).toBe(1);
  });

  it('df ≤ 0 returns 1 (degenerate)', () => {
    expect(tDistributionPValue(2.0, 0)).toBe(1);
    expect(tDistributionPValue(2.0, -5)).toBe(1);
  });
});
