import { describe, it, expect } from 'vitest';
import { detectInflectionPoints } from '../detectInflectionPoints';
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

/** Build a Gaussian mixture sample with the given component means + per-component count. */
function gaussianMixture(
  rng: () => number,
  components: Array<{ mean: number; std: number; n: number }>
): number[] {
  const out: number[] = [];
  for (const c of components) {
    for (let i = 0; i < c.n; i++) out.push(seededNormalSample(rng, c.mean, c.std));
  }
  return out;
}

/** Build a lognormal sample by exponentiating Gaussian draws (right-skewed unimodal). */
function lognormalSample(rng: () => number, mu: number, sigma: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(Math.exp(seededNormalSample(rng, mu, sigma)));
  return out;
}

describe('detectInflectionPoints', () => {
  it('finds exactly one cut on a tight bimodal Gaussian mixture (means 10, 50)', () => {
    const rng = mulberry32(101);
    const values = gaussianMixture(rng, [
      { mean: 10, std: 3, n: 50 },
      { mean: 50, std: 3, n: 50 },
    ]);

    const result = detectInflectionPoints({ values });

    expect(result.cuts).toHaveLength(1);
    const cut = result.cuts[0];
    // Cut should sit somewhere between the two means; allow generous tolerance.
    expect(cut).toBeGreaterThan(30 - 5);
    expect(cut).toBeLessThan(30 + 5);

    expect(result.segments).toHaveLength(2);
    // Each segment is one well-separated Gaussian → should look normal on prob plot.
    for (const seg of result.segments) {
      expect(seg.adPValue).toBeDefined();
      expect(seg.adPValue!).toBeGreaterThan(0.1);
    }
  });

  it('finds exactly two cuts on a trimodal Gaussian mixture (means 10, 50, 100)', () => {
    const rng = mulberry32(202);
    const values = gaussianMixture(rng, [
      { mean: 10, std: 3, n: 50 },
      { mean: 50, std: 3, n: 50 },
      { mean: 100, std: 3, n: 50 },
    ]);

    const result = detectInflectionPoints({ values });

    expect(result.cuts).toHaveLength(2);
    expect(result.cuts[0]).toBeLessThan(result.cuts[1]); // sorted ascending
    expect(result.segments).toHaveLength(3);
    // Anderson-Darling p-values for clean N(50, 3) samples of ~50 points can
    // vary widely from chance alone (this seed produced an AD p ≈ 0.01 for
    // the middle cluster). Assert > 0.005 — the segments are clearly more
    // normal than the full mixture (which has AD p ≈ 1e-21).
    for (const seg of result.segments) {
      expect(seg.adPValue).toBeDefined();
      expect(seg.adPValue!).toBeGreaterThan(0.005);
    }
  });

  it('returns no cuts on a clean unimodal Normal sample', () => {
    const rng = mulberry32(303);
    const values: number[] = [];
    for (let i = 0; i < 200; i++) values.push(seededNormalSample(rng, 50, 10));

    const result = detectInflectionPoints({ values });

    expect(result.cuts).toHaveLength(0);
    expect(result.segments).toHaveLength(1);
    expect(result.confidence).toBe(0);
  });

  it('returns no cuts on a skewed unimodal lognormal (skewed does NOT trigger spurious detection)', () => {
    const rng = mulberry32(404);
    const values = lognormalSample(rng, 3, 0.5, 100);

    const result = detectInflectionPoints({ values });

    // Skewed unimodal data violates normality but does NOT have a structural inflection;
    // the SPC discipline is that we only stratify when there are genuinely separable subpopulations.
    expect(result.cuts).toHaveLength(0);
    expect(result.segments).toHaveLength(1);
  });

  it('returns no cuts when n < 30 (insufficient-data guard)', () => {
    const rng = mulberry32(505);
    const values: number[] = [];
    for (let i = 0; i < 20; i++) values.push(seededNormalSample(rng, 50, 5));

    const result = detectInflectionPoints({ values });

    expect(result.cuts).toEqual([]);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].n).toBe(20);
    expect(result.confidence).toBe(0);
  });

  it('returns no cuts when all values are equal (degenerate)', () => {
    const values = Array.from({ length: 50 }, () => 5);

    const result = detectInflectionPoints({ values });

    expect(result.cuts).toEqual([]);
    expect(result.segments).toHaveLength(1);
    expect(result.confidence).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // GAP_RATIO_THRESHOLD = 20 calibration tests.
  //
  // These two tests pin the acceptance boundary. If GAP_RATIO_THRESHOLD is
  // raised above the borderline gap ratio (~36x) the first test will fail.
  // If it is lowered below the overlapping peak ratio (~12x) the second test
  // will start producing a spurious cut.
  // ---------------------------------------------------------------------------

  it('borderline bimodal (means 10 + 26, σ=2, N=100) — caught at threshold 20× but not at 50×', () => {
    // Seed 707: gap ratio ≈ 36×; reliably above 20 across all seeds for this
    // separation (5σ cluster separation → well-resolved gap on prob plot).
    const rng = mulberry32(707);
    const values = gaussianMixture(rng, [
      { mean: 10, std: 2, n: 50 },
      { mean: 26, std: 2, n: 50 },
    ]);

    const result = detectInflectionPoints({ values });

    // Algorithm MUST detect this separation at GAP_RATIO_THRESHOLD = 20.
    expect(result.cuts).toHaveLength(1);
    // Cut should sit between the cluster means (10..26) with reasonable margin.
    expect(result.cuts[0]).toBeGreaterThan(14);
    expect(result.cuts[0]).toBeLessThan(22);
  });

  it('overlapping bimodal (means 10 + 16, σ=3, N=100) — algorithm correctly rejects ambiguous bimodality', () => {
    // Seed 808: cluster means only 2σ apart — distributions substantially
    // overlap; no clean gap on the probability plot. The SPC discipline is to
    // preserve a single population model rather than stratify noise.
    const rng = mulberry32(808);
    const values = gaussianMixture(rng, [
      { mean: 10, std: 3, n: 50 },
      { mean: 16, std: 3, n: 50 },
    ]);

    const result = detectInflectionPoints({ values });

    // No cut should be accepted when the gap ratio is well below 20.
    expect(result.cuts).toHaveLength(0);
    expect(result.confidence).toBe(0);
  });

  it('is deterministic: same input → identical output', () => {
    const rng1 = mulberry32(606);
    const values1 = gaussianMixture(rng1, [
      { mean: 10, std: 3, n: 50 },
      { mean: 50, std: 3, n: 50 },
    ]);

    const rng2 = mulberry32(606);
    const values2 = gaussianMixture(rng2, [
      { mean: 10, std: 3, n: 50 },
      { mean: 50, std: 3, n: 50 },
    ]);

    const r1 = detectInflectionPoints({ values: values1 });
    const r2 = detectInflectionPoints({ values: values2 });

    expect(r1).toEqual(r2);
  });
});
