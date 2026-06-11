/**
 * Membership-separation engine (ER-5a Task 1).
 *
 * When a condition is applied in the Explore tab, this engine answers the
 * question "what distinguishes the rows in this condition?" — separate from
 * magnitude-based variation ranking.
 *
 * The separation statistic is bias-corrected Cramér's V (Bergsma 2013),
 * computed on the factor-levels × {in, out} contingency table. This statistic
 * is bounded [0,1] and cardinality-penalised in the same spirit as the
 * ω²-adjusted η² used in the magnitude strip (ER-2), so a high-cardinality
 * factor cannot fake a high rank through level-count inflation.
 *
 * Language invariant (P5): uses "distinguishes" / "separation" / "over-represented",
 * never "drives" / "causes" / "root cause".
 *
 * @module stats/membershipSeparation
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import type { ConditionLeaf } from '../findings/hypothesisCondition';
import { rowMatchesConditionLeaves } from '../findings/hypothesisCondition';
import { classifyAllFactors } from './factorTypeDetection';
import { quartileBin } from '../binning/quantileCuts';
import { lnGamma } from './distributions';

// ============================================================================
// Types
// ============================================================================

/**
 * Composition data for one level of a factor.
 *
 * `shareIn  = nIn  / NIn`  (fraction of the in-condition population at this level)
 * `shareOut = nOut / NOut` (fraction of the out-of-condition population at this level)
 * `lift     = shareIn / shareOut`; Infinity when nOut === 0 && nIn > 0 (level
 *             appears exclusively inside the condition).
 */
export interface MembershipLevelComposition {
  /** Factor level label (or quartile bin label for continuous factors). */
  level: string;
  /** Rows inside the condition at this level. */
  nIn: number;
  /** Rows outside the condition at this level. */
  nOut: number;
  /** Share of the in-condition population: nIn / NIn. */
  shareIn: number;
  /** Share of the out-of-condition population: nOut / NOut. */
  shareOut: number;
  /**
   * Over-representation ratio: shareIn / shareOut.
   * Infinity when nOut === 0 and nIn > 0 (level present only inside the condition).
   * NaN is never returned — see implementation guards.
   */
  lift: number;
}

/**
 * Per-factor membership-separation result.
 *
 * Language note: "adjustedV" refers to bias-corrected Cramér's Ṽ, a separation
 * statistic. It describes how strongly a factor's levels distinguish the in-
 * vs out-of-condition populations. It is NOT a causal claim.
 */
export interface MembershipFactorSeparation {
  /** Factor column name. */
  factor: string;
  /**
   * Bias-corrected Cramér's Ṽ (Bergsma 2013), floored at 0.
   * Bounded [0, 1]; cardinality-penalised (high-level-count factors are
   * discounted the same way ω² discounts η²).
   * Never NaN; never Infinity.
   */
  adjustedV: number;
  /**
   * χ² p-value for the factor-levels × membership contingency table
   * (Wilson–Hilferty χ² CDF approximation, df = k−1).
   * A finite number in [0, 1]; never NaN.
   */
  pValue: number;
  /**
   * True when the factor was quartile-binned before building the contingency
   * table (continuous X's are binned to prevent singleton-group inflation,
   * exactly as in `computeMainEffects`).
   */
  binnedForRanking: boolean;
  /**
   * Per-level composition data. For a binned factor, levels are the quartile
   * labels (Q1–Q4). Sorted by lift descending (highest over-representation first).
   */
  levels: MembershipLevelComposition[];
  /**
   * The level with the highest lift among levels where nIn ≥ 3.
   * Used to render the "Factor — Level ×N.N" chip annotation.
   * null when no level has nIn ≥ 3 (chip shows the statistic only).
   */
  topLevel: string | null;
}

/**
 * Full result of the membership-separation computation.
 */
export interface MembershipSeparationResult {
  /**
   * Per-factor separation, sorted by adjustedV descending (strongest separator
   * first).
   */
  factors: MembershipFactorSeparation[];
  /** Number of rows that satisfy the condition (NIn). */
  nIn: number;
  /** Number of rows that do not satisfy the condition (NOut). */
  nOut: number;
  /** Total row count (NIn + NOut). */
  n: number;
}

// ============================================================================
// χ² p-value via regularised incomplete gamma
// ============================================================================

/**
 * Regularised upper incomplete gamma function Q(a, x) = 1 − P(a, x).
 *
 * Uses the series expansion for x < a+1, and the Legendre continued fraction
 * (Lentz algorithm) for x ≥ a+1.  Both branches converge for all finite
 * positive inputs.  References: Abramowitz & Stegun §6.5; Press et al.
 * "Numerical Recipes" §6.2 (gammq / gammp).
 */
function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (!Number.isFinite(x)) return 0;
  if (!Number.isFinite(a) || a <= 0) return 1;

  if (x < a + 1) {
    // --- Series expansion for the lower regularised gamma P(a,x) ---
    // P(a, x) = e^{-x} x^a / Γ(a)  ×  Σ_{n≥0} x^n / [(a+1)(a+2)…(a+n+1)]
    // equivalently: term₀ = 1/a, termₙ = term_{n-1} × x / (a+n)
    let term = 1 / a;
    let sum = term;
    for (let n = 1; n <= 300; n++) {
      term *= x / (a + n);
      sum += term;
      if (term < sum * 1e-14) break;
    }
    const logVal = -x + a * Math.log(x) - lnGamma(a);
    const P = Math.exp(logVal) * sum;
    return Math.max(0, Math.min(1, 1 - P));
  } else {
    // --- Legendre continued fraction for Q(a, x) ---
    // Q(a, x) = e^{-x} x^a / Γ(a) × CF
    // CF = 1 / (x+1-a- 1(1-a)/(x+3-a- 2(2-a)/(x+5-a-…)))
    // Lentz algorithm (Numerical Recipes §6.2):
    let b = x + 1 - a;
    let C = 1 / 1e-30;
    let D = 1 / b;
    let h = D;
    for (let i = 1; i <= 300; i++) {
      const an = -i * (i - a);
      b += 2;
      D = an * D + b;
      if (Math.abs(D) < 1e-30) D = 1e-30;
      C = b + an / C;
      if (Math.abs(C) < 1e-30) C = 1e-30;
      D = 1 / D;
      const delta = C * D;
      h *= delta;
      if (Math.abs(delta - 1) < 1e-14) break;
    }
    const logVal = -x + a * Math.log(x) - lnGamma(a);
    const Q = Math.exp(logVal) * h;
    return Math.max(0, Math.min(1, Q));
  }
}

/**
 * χ² right-tail p-value: P(χ² > x | df).
 *
 * χ²(df) is a Gamma(df/2, 2) distribution, so:
 *   P(χ² > x | df) = Q(df/2, x/2)
 *
 * Returns a finite number in [0, 1].  Never NaN.
 */
function chiSquaredPValue(chiSq: number, df: number): number {
  if (chiSq <= 0 || df <= 0) return 1;
  const p = gammaQ(df / 2, chiSq / 2);
  if (!Number.isFinite(p) || Number.isNaN(p)) return 1;
  return Math.max(0, Math.min(1, p));
}

// ============================================================================
// Bias-corrected Cramér's V (Bergsma 2013)
// ============================================================================

/**
 * Compute the bias-corrected Cramér's Ṽ from a contingency table cell counts.
 *
 * Formulas (Bergsma 2013):
 *   φ²   = χ² / n
 *   φ̃²  = max(0, φ² − (k−1)(r−1) / (n−1))
 *   k̃   = k − (k−1)² / (n−1)
 *   r̃   = r − (r−1)² / (n−1)
 *   Ṽ   = sqrt(φ̃² / min(k̃−1, r̃−1)), floored at 0
 *
 * Where k = number of factor levels, r = 2 (membership column, always binary),
 * n = total observations.
 *
 * @param chiSq - χ² statistic.
 * @param n     - Total observations.
 * @param k     - Number of factor levels (rows in the contingency table).
 * @param r     - Number of columns (always 2 for membership: in/out).
 * @returns Ṽ ∈ [0, 1], never NaN, never Infinity.
 */
function biasCorrectedCramerV(chiSq: number, n: number, k: number, r: number): number {
  if (n <= 1 || k < 2 || r < 2) return 0;

  const phi2 = chiSq / n;
  const denom_n = n - 1;

  // Bias correction: subtract the expected value of φ² under H₀.
  const phi2Tilde = Math.max(0, phi2 - ((k - 1) * (r - 1)) / denom_n);

  // Cardinality-adjusted level counts.
  const kTilde = k - (k - 1) ** 2 / denom_n;
  const rTilde = r - (r - 1) ** 2 / denom_n;

  const minAdj = Math.min(kTilde - 1, rTilde - 1);
  if (minAdj <= 0) return 0;

  const V2 = phi2Tilde / minAdj;
  if (!Number.isFinite(V2) || V2 < 0) return 0;

  const V = Math.sqrt(V2);
  if (!Number.isFinite(V)) return 0;

  return Math.max(0, V);
}

// ============================================================================
// χ² from contingency table
// ============================================================================

/**
 * Compute χ² from a 2-column contingency table (factor levels × {in, out}).
 *
 * @param inCounts  - Per-level count of in-condition rows.
 * @param outCounts - Per-level count of out-of-condition rows.
 * @param NIn       - Total in-condition rows.
 * @param NOut      - Total out-of-condition rows.
 * @returns χ² statistic (≥ 0), NaN-safe.
 */
function computeChiSquared(
  inCounts: Map<string, number>,
  outCounts: Map<string, number>,
  NIn: number,
  NOut: number
): number {
  const n = NIn + NOut;
  if (n === 0) return 0;

  let chiSq = 0;
  const levels = new Set([...inCounts.keys(), ...outCounts.keys()]);

  for (const level of levels) {
    const nIn = inCounts.get(level) ?? 0;
    const nOut = outCounts.get(level) ?? 0;
    const rowTotal = nIn + nOut;

    // Expected: E_ij = (rowTotal × colTotal) / n
    const eIn = (rowTotal * NIn) / n;
    const eOut = (rowTotal * NOut) / n;

    if (eIn > 0) chiSq += (nIn - eIn) ** 2 / eIn;
    if (eOut > 0) chiSq += (nOut - eOut) ** 2 / eOut;
  }

  return Number.isFinite(chiSq) ? chiSq : 0;
}

// ============================================================================
// Main engine
// ============================================================================

/**
 * Compute membership-separation statistics for a set of factors.
 *
 * The function labels every row as "in" (satisfies all leaves) or "out" (does
 * not), then builds a factor-levels × {in, out} contingency table per factor
 * and computes the bias-corrected Cramér's Ṽ as the separation statistic.
 *
 * Continuous factors are quartile-pre-binned exactly as `computeMainEffects`
 * does — this prevents singleton-group inflation and is a correctness
 * requirement of the ranking.
 *
 * Degenerate guard: returns `null` when NIn === 0 or NOut === 0 (no
 * in/out partition exists, so no separation can be computed), or when no
 * factor has at least 2 levels in the data.
 *
 * Division of labour (mirrors `computeMainEffects`): Y-derived factor
 * exclusion is the caller's responsibility — do NOT pass Y-derived columns;
 * use `excludeYDerivedFactors` before calling if needed.
 *
 * Language note (P5): this function measures "separation" / how factors
 * "distinguish" the condition membership. It does not assign causation.
 *
 * @param rows    - Full lensed dataset (NOT pre-filtered to condition rows).
 * @param leaves  - Flat AND-of-leaves that defines the condition. Empty list
 *                  → vacuous truth (all rows are "in") → degenerate → null.
 * @param factors - Candidate factor column names to evaluate.
 * @returns Separation result sorted by Ṽ descending, or null if degenerate.
 */
export function computeMembershipSeparation(
  rows: DataRow[],
  leaves: ReadonlyArray<ConditionLeaf>,
  factors: string[]
): MembershipSeparationResult | null {
  if (rows.length === 0) return null;
  if (factors.length === 0) return null;

  // Label every row as in-condition or out-of-condition.
  // rowMatchesConditionLeaves with empty leaves returns true → all NIn, NOut=0 → degenerate.
  const membership: boolean[] = rows.map(row => rowMatchesConditionLeaves(row, [...leaves]));

  const NIn = membership.filter(Boolean).length;
  const NOut = rows.length - NIn;

  // Degenerate guard (disposition 4).
  if (NIn === 0 || NOut === 0) return null;

  // Classify factors to decide continuous → quartile-bin.
  const classifications = classifyAllFactors(rows, factors);
  const binnedFactors = new Set<string>();
  const binLabels = new Map<string, (string | undefined)[]>();

  for (const factor of factors) {
    if (classifications.get(factor)?.type !== 'continuous') continue;
    const numeric = rows.map(row => {
      const v = toNumericValue(row[factor]);
      return v === undefined ? NaN : v;
    });
    const { labels } = quartileBin(numeric);
    binnedFactors.add(factor);
    binLabels.set(factor, labels);
  }

  const factorResults: MembershipFactorSeparation[] = [];

  for (const factor of factors) {
    // Build contingency counts: factor level → {nIn, nOut}
    const inCounts = new Map<string, number>();
    const outCounts = new Map<string, number>();

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      let level: string;

      if (binnedFactors.has(factor)) {
        // Continuous factor: use quartile bin label; skip if unbinnable.
        const label = binLabels.get(factor)![r];
        if (label === undefined) continue;
        level = label;
      } else {
        level = String(row[factor] ?? '');
        if (level === '' || level === 'undefined' || level === 'null') continue;
      }

      if (membership[r]) {
        inCounts.set(level, (inCounts.get(level) ?? 0) + 1);
      } else {
        outCounts.set(level, (outCounts.get(level) ?? 0) + 1);
      }
    }

    // Union of levels seen in either group.
    const allLevels = new Set([...inCounts.keys(), ...outCounts.keys()]);
    const k = allLevels.size;

    // Need ≥ 2 levels to compute separation.
    if (k < 2) continue;

    const r = 2; // binary membership column (in / out)
    const n = NIn + NOut;

    const chiSq = computeChiSquared(inCounts, outCounts, NIn, NOut);
    const df = k - 1; // df for the χ² test (with r=2 fixed, df = k−1)
    const pValue = chiSquaredPValue(chiSq, df);
    const adjustedV = biasCorrectedCramerV(chiSq, n, k, r);

    // Build per-level composition data (disposition 4).
    const levels: MembershipLevelComposition[] = [];
    for (const level of allLevels) {
      const nInLevel = inCounts.get(level) ?? 0;
      const nOutLevel = outCounts.get(level) ?? 0;
      const shareIn = NIn > 0 ? nInLevel / NIn : 0;
      const shareOut = NOut > 0 ? nOutLevel / NOut : 0;

      let lift: number;
      if (nOutLevel === 0 && nInLevel > 0) {
        // Level appears exclusively inside the condition.
        lift = Infinity;
      } else if (shareOut === 0) {
        lift = 0;
      } else {
        lift = shareIn / shareOut;
        if (!Number.isFinite(lift)) lift = 0;
      }

      levels.push({ level, nIn: nInLevel, nOut: nOutLevel, shareIn, shareOut, lift });
    }

    // Sort levels by lift descending for display.
    levels.sort((a, b) => {
      // Infinity first, then descending finite lift.
      if (a.lift === Infinity && b.lift === Infinity) return a.level.localeCompare(b.level);
      if (a.lift === Infinity) return -1;
      if (b.lift === Infinity) return 1;
      return b.lift - a.lift;
    });

    // topLevel: argmax lift among levels with nIn ≥ 3 (disposition 3).
    let topLevel: string | null = null;
    let topLift = -Infinity;
    for (const lv of levels) {
      if (lv.nIn < 3) continue;
      const lvLift = lv.lift === Infinity ? Number.MAX_VALUE : lv.lift;
      if (lvLift > topLift) {
        topLift = lvLift;
        topLevel = lv.level;
      }
    }

    factorResults.push({
      factor,
      adjustedV,
      pValue,
      binnedForRanking: binnedFactors.has(factor),
      levels,
      topLevel,
    });
  }

  // No usable factors (all had < 2 levels).
  if (factorResults.length === 0) return null;

  // Sort by adjustedV descending (strongest separator first).
  factorResults.sort((a, b) => b.adjustedV - a.adjustedV);

  return {
    factors: factorResults,
    nIn: NIn,
    nOut: NOut,
    n: NIn + NOut,
  };
}
