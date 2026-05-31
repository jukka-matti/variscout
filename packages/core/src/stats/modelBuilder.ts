/**
 * modelBuilder.ts — the scope-level "vital-few model-builder" selector.
 *
 * Increment 1 of the Factors & Evaluation initiative (spec §3). This is a PURE
 * layer over the existing `computeBestSubsets` engine: it does NOT reinvent
 * regression — it enumerates once, then exposes:
 *
 *   1. `selectVitalFew`  — the LOCKED default (call #1): the FEWEST factors whose
 *      subset is within `VITAL_FEW_R2ADJ_TOLERANCE` (1 percentage-point) of the
 *      max adjusted R² AND where every kept factor's p < `VITAL_FEW_P_THRESHOLD`
 *      (.15). Do nothing → you get the engine's deterministic recommendation.
 *   2. `lookupSubset`    — O(1) lookup of an already-enumerated subset by its
 *      exact (order-independent) factor set, so toggling a candidate across the
 *      "vital-few line" never recomputes the regression.
 *   3. `perFactorPValues`— each kept factor's p for the surface header. We surface
 *      adjusted R² + per-factor p ONLY (LOCKED #2: no Mallows Cp / BIC on the
 *      surface). p source: the OLS per-predictor p (group min per factorName)
 *      when present, else the factor's own single-factor subset overall-F p
 *      (always enumerated). Both are deterministic + engine-derived.
 *   4. `redundancyHint`  — multicollinearity honesty (spec §3): toggling a
 *      high-VIF factor OUT that barely moves R²adj → "redundant not irrelevant".
 *
 * Contribution, not causation; this module never names a "driver"/"cause".
 * Deterministic: no Date.now / Math.random / argless `new Date`.
 */

import type { BestSubsetResult, BestSubsetsResult } from './bestSubsets';

// ============================================================================
// Tunable constants (the LOCKED default rule — spec §2.1)
// ============================================================================

/**
 * "Within 1 percentage-point of the max adjusted R²" — the parsimony tolerance.
 * Expressed in R²adj units (0.01 == 1 percentage point). LOCKED call #1.
 */
export const VITAL_FEW_R2ADJ_TOLERANCE = 0.01;

/**
 * "Each kept factor's p < .15" — the per-factor inclusion gate. LOCKED call #1.
 * Deliberately looser than .05 because this is an exploratory contribution
 * screen (best-subsets), not a confirmatory pre-planned test.
 */
export const VITAL_FEW_P_THRESHOLD = 0.15;

/**
 * Redundancy: a factor whose group-VIF exceeds this is "correlated" enough that
 * toggling it OUT is expected to barely move R²adj. Mirrors the engine's own
 * high-VIF guardrail (`checkGuardrails` flags VIF > 10).
 */
export const REDUNDANCY_VIF_THRESHOLD = 10;

/**
 * Redundancy: "barely changed the model" — removing the factor drops R²adj by
 * less than this (in R²adj units). Pairs with the VIF gate so we only nudge when
 * BOTH "highly collinear" AND "drop is negligible" hold.
 */
export const REDUNDANCY_R2ADJ_DELTA = 0.01;

// ============================================================================
// Subset index — O(1) lookup by factor set
// ============================================================================

/** Order-independent key for a factor set (so {A,B} == {B,A}). */
export function factorSetKey(factors: readonly string[]): string {
  return [...factors].sort().join('\x00');
}

/**
 * A pre-built index over an enumerated `BestSubsetsResult` for O(1) lookup of a
 * subset by its exact factor set. Built ONCE per model; toggling reads it.
 */
export interface SubsetIndex {
  /** factorSetKey → the enumerated subset for that exact factor set. */
  byKey: Map<string, BestSubsetResult>;
  /** The maximum adjusted R² across all enumerated subsets. */
  maxRSquaredAdj: number;
  /** Single-factor subsets keyed by factor name (per-factor p fallback source). */
  singleByFactor: Map<string, BestSubsetResult>;
}

/** Build the O(1) subset index from an enumerated best-subsets result. */
export function buildSubsetIndex(result: BestSubsetsResult): SubsetIndex {
  const byKey = new Map<string, BestSubsetResult>();
  const singleByFactor = new Map<string, BestSubsetResult>();
  let maxRSquaredAdj = -Infinity;

  for (const subset of result.subsets) {
    byKey.set(factorSetKey(subset.factors), subset);
    if (subset.factorCount === 1) {
      singleByFactor.set(subset.factors[0], subset);
    }
    if (subset.rSquaredAdj > maxRSquaredAdj) {
      maxRSquaredAdj = subset.rSquaredAdj;
    }
  }

  if (!Number.isFinite(maxRSquaredAdj)) maxRSquaredAdj = 0;
  return { byKey, maxRSquaredAdj, singleByFactor };
}

/**
 * O(1) lookup of the enumerated subset for an exact factor set. Returns null
 * when that combination was not enumerated (e.g. > MAX_FACTORS, or the empty
 * set). Never recomputes regression.
 */
export function lookupSubset(
  index: SubsetIndex,
  factors: readonly string[]
): BestSubsetResult | null {
  if (factors.length === 0) return null;
  return index.byKey.get(factorSetKey(factors)) ?? null;
}

// ============================================================================
// Per-factor p (surface header)
// ============================================================================

/**
 * Per-factor p-value for the factors KEPT in a given subset.
 *
 * - OLS models expose per-predictor p (`subset.predictors`); for a grouped
 *   factor (categorical dummies, linear+quadratic) we take the GROUP MIN p
 *   (the factor "matters" if any of its terms do).
 * - All-categorical ANOVA subsets carry no per-predictor p, so we fall back to
 *   the factor's own single-factor subset overall-F p (always enumerated). This
 *   is the factor's marginal explanatory p — honest + engine-derived.
 *
 * Returns 1 (not significant) when no source is available, never throws.
 */
export function perFactorPValues(
  subset: BestSubsetResult,
  index: SubsetIndex
): Map<string, number> {
  const out = new Map<string, number>();

  for (const factor of subset.factors) {
    // Prefer the in-model OLS per-predictor p (partial, model-conditioned).
    if (subset.predictors && subset.predictors.length > 0) {
      const groupPs = subset.predictors
        .filter(p => p.factorName === factor && Number.isFinite(p.pValue))
        .map(p => p.pValue);
      if (groupPs.length > 0) {
        out.set(factor, Math.min(...groupPs));
        continue;
      }
    }
    // Fallback: the factor's own single-factor subset overall-F p (marginal).
    const single = index.singleByFactor.get(factor);
    out.set(factor, single ? single.pValue : 1);
  }

  return out;
}

// ============================================================================
// The vital-few default (LOCKED call #1)
// ============================================================================

export interface VitalFewSelection {
  /** The kept factors (the pre-selected "vital few"). */
  factors: string[];
  /** The enumerated subset for those exact factors. */
  subset: BestSubsetResult;
  /** Per-factor p for the kept factors (surface header). */
  perFactorP: Map<string, number>;
}

/**
 * Select the vital-few default: the FEWEST factors whose subset is within 1
 * percentage-point of the max adjusted R² AND where every kept factor's
 * p < .15. (LOCKED call #1.)
 *
 * Tie-break among equal-size candidates: highest adjusted R² (the engine's sort
 * already ranks subsets desc by R²adj). Falls back to the single best subset
 * (`subsets[0]`) when no candidate clears the p-gate, so the analyst always sees
 * a model rather than an empty band.
 */
export function selectVitalFew(
  result: BestSubsetsResult,
  index: SubsetIndex,
  options?: { r2adjTolerance?: number; pThreshold?: number }
): VitalFewSelection | null {
  if (result.subsets.length === 0) return null;

  const tolerance = options?.r2adjTolerance ?? VITAL_FEW_R2ADJ_TOLERANCE;
  const pThreshold = options?.pThreshold ?? VITAL_FEW_P_THRESHOLD;
  const cutoff = index.maxRSquaredAdj - tolerance;

  // Candidates "within tolerance of the max R²adj". The engine pre-sorted
  // subsets desc by R²adj, so a stable sort by (factorCount asc, then index
  // order) gives the fewest-factors-then-highest-R²adj winner.
  const candidates = result.subsets
    .filter(s => s.rSquaredAdj >= cutoff)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.factorCount - b.s.factorCount || a.i - b.i);

  for (const { s } of candidates) {
    const perFactorP = perFactorPValues(s, index);
    const allBelow = s.factors.every(f => (perFactorP.get(f) ?? 1) < pThreshold);
    if (allBelow) {
      return { factors: [...s.factors], subset: s, perFactorP };
    }
  }

  // No candidate cleared the p-gate → fall back to the single best subset so the
  // band still shows the engine's top model (the analyst can prune from there).
  const best = result.subsets[0];
  return { factors: [...best.factors], subset: best, perFactorP: perFactorPValues(best, index) };
}

// ============================================================================
// Ambient honesty: overfit + redundancy (already-computed values, just surfaced)
// ============================================================================

/**
 * "Fit-only estimate" guard: true when the subset's own warnings include an
 * overfit or low-observation-per-predictor flag. These are computed by the
 * engine's `checkGuardrails` (winner only); we read them, never recompute.
 */
export function isFitOnlyEstimate(subset: BestSubsetResult): boolean {
  if (!subset.warnings || subset.warnings.length === 0) return false;
  return subset.warnings.some(w => /overfit/i.test(w) || /observation-to-predictor/i.test(w));
}

export interface RedundancyHint {
  /** The factor that was just removed (the high-VIF one). */
  removedFactor: string;
  /** Its group VIF in the larger (with-factor) model. */
  vif: number;
  /** How much R²adj dropped when it was removed (>= 0 typically). */
  rSquaredAdjDelta: number;
}

/**
 * Multicollinearity honesty (spec §3): when toggling `removedFactor` OUT barely
 * changes R²adj AND that factor is highly collinear (group VIF over threshold in
 * the larger model), return a hint so the UI can say "removing X barely changed
 * the model — it's correlated with another factor, redundant not irrelevant."
 *
 * `withFactor` is the model that INCLUDES the factor (the VIF source);
 * `withoutFactor` is the model after toggling it out. Returns null when the
 * removal materially moves R²adj or the factor is not highly collinear.
 */
export function redundancyHint(
  removedFactor: string,
  withFactor: BestSubsetResult,
  withoutFactor: BestSubsetResult | null,
  options?: { vifThreshold?: number; r2adjDelta?: number }
): RedundancyHint | null {
  if (!withoutFactor) return null;
  const vifThreshold = options?.vifThreshold ?? REDUNDANCY_VIF_THRESHOLD;
  const r2adjDelta = options?.r2adjDelta ?? REDUNDANCY_R2ADJ_DELTA;

  const vif = withFactor.vif?.get(removedFactor);
  if (vif === undefined || !Number.isFinite(vif) || vif < vifThreshold) return null;

  const delta = withFactor.rSquaredAdj - withoutFactor.rSquaredAdj;
  // "Barely changed" — small magnitude in either direction.
  if (Math.abs(delta) > r2adjDelta) return null;

  return { removedFactor, vif, rSquaredAdjDelta: delta };
}
