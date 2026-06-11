/**
 * useMembershipModel — ranks candidate factors by how strongly their levels
 * distinguish the rows inside a condition from the rows outside it.
 *
 * When a condition is applied in the Explore tab, the membership variant
 * REPLACES the magnitude strip. This hook packages the bias-corrected
 * Cramér's Ṽ separation engine (Task 1 / ER-5a) into typed chips ready for
 * the FactorStrip membership variant (Task 4).
 *
 * Contract (ER-5a disposition 2 / D7):
 *   - Separation is computed over the FULL lensed population (in-condition vs
 *     out-of-condition labels on every row). NEVER within-subset η².
 *   - D11 exclusion: Y-derived columns are dropped before calling the engine
 *     (same responsibility boundary as useFactorStripModel / computeMainEffects).
 *   - MembershipChip carries `separation` (Ṽ, bounded [0,1]) — NOT a variance
 *     share. Mislabelling Cramér's V as a % of variation is a statistical-honesty
 *     violation (P5 / ADR-069). Formatting (`×N.N`, significance stars, etc.) is
 *     the UI layer's responsibility.
 *
 * Memoised on (lensedRows, leaves, allFactors, outcome, bindings).
 * No store reads — all data arrives via props.
 *
 * @module hooks/useMembershipModel
 */

import { useMemo } from 'react';
import type { DataRow, ConditionLeaf } from '@variscout/core';
import { computeMembershipSeparation, excludeYDerivedFactors } from '@variscout/core';
import type { MembershipLevelComposition } from '@variscout/core';
import type { BinnedFactorBinding } from '@variscout/core/binning';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * The over-represented level annotation on a membership chip.
 *
 * `level` — the level label (factor value or quartile bin label).
 * `lift`  — shareIn / shareOut; `undefined` when the level appears exclusively
 *            inside the condition (nOut === 0 && nIn > 0 — supreme
 *            over-representation).  The UI must render the i18n "only in
 *            condition" label when lift is undefined, never a bare `∞` glyph
 *            (ER-5a disposition 3).
 */
export interface MembershipChipTopLevel {
  level: string;
  lift: number | undefined;
}

/**
 * One ranked factor chip produced by useMembershipModel.
 *
 * Honesty note (P5 / ADR-069 B3): `separation` is bias-corrected Cramér's Ṽ
 * (bounded [0,1]). It is a separation statistic, NOT a percentage of variation.
 * Never render it as "X% of variation explained" — that would mislabel V as
 * a variance share (a statistical honesty violation).  Label it as "separation"
 * or annotate with "Ṽ = …" in the UI.
 *
 * Raw numbers only — formatting is the UI's responsibility (P5 / ADR-069 B3).
 */
export interface MembershipChip {
  /** Factor column name. */
  factor: string;
  /**
   * Bias-corrected Cramér's Ṽ, bounded [0,1], floored at 0, never NaN.
   * This is a separation statistic — it measures how strongly the factor's
   * levels distinguish the in-condition population from the out-of-condition
   * population.  It is NOT a percentage of variation (do not render as one).
   */
  separation: number;
  /** χ² p-value for the factor-levels × membership contingency table. */
  pValue: number;
  /** True when p < 0.05. */
  isSignificant: boolean;
  /**
   * Degrees of freedom for the χ² test: k − 1, where k is the number of
   * distinct levels in this factor's contingency table. Equals 1 only for
   * binary factors; higher-cardinality factors have df > 1. Forwarded from
   * `MembershipFactorSeparation.df` so the UI can show honest hover copy.
   */
  df: number;
  /**
   * Number of rows used in this factor's contingency table (NIn + NOut minus
   * any rows where this factor's value was null). Forwarded from
   * `MembershipFactorSeparation.n` for honest sample-size display.
   */
  n: number;
  /**
   * True when a continuous factor was quartile-binned before computing
   * the contingency table.  The UI should annotate these chips with "(binned)".
   */
  binnedForRanking: boolean;
  /**
   * The level with the highest lift among levels where nIn ≥ 3.
   * null when no level qualifies (chip shows the statistic only, no "— Level ×N.N").
   *
   * If `topLevel.lift === undefined`, the level appears exclusively inside the
   * condition.  The UI must render the i18n "only in condition" label rather than
   * a bare `∞` glyph.
   */
  topLevel: MembershipChipTopLevel | null;
  /**
   * True when the factor is in the caller-supplied selected set.
   * Prominence flag only — ranking order is always global regardless of selection.
   */
  isSelected: boolean;
}

/** Arguments for useMembershipModel. */
export interface UseMembershipModelArgs {
  /**
   * Full lensed dataset (NOT pre-filtered to condition rows).
   * Disposition 2 / D7: separation is computed over the full population; the
   * condition labels are assigned per-row by the engine.
   */
  lensedRows: DataRow[];
  /**
   * Flat AND-of-leaves defining the active condition
   * (`analysisScopeStore.conditionLeaves`).
   * Empty list → vacuous truth → all rows in-condition → degenerate → null.
   */
  leaves: ReadonlyArray<ConditionLeaf>;
  /**
   * Merged candidate factor columns (seed-not-gate).
   * Y-derived columns are excluded inside the hook (D11) before calling the
   * engine.  Callers pass these as-is; the hook handles exclusion.
   */
  allFactors: string[];
  /**
   * Active outcome (Y) column name.  Used for D11 exclusion.
   * Null or empty → hook returns null.
   */
  outcome: string | null;
  /**
   * Binned-factor bindings from the active project.  Used by D11 exclusion to
   * detect outcome-derived columns beyond the `${outcome}_bin` convention.
   */
  bindings?: BinnedFactorBinding[];
  /**
   * Framing-selected factors (prominence flag only).  The hook ranks ALL
   * candidates globally; selected factors get isSelected=true so the UI can
   * visually distinguish them.
   *
   * Callers MUST pass a referentially stable array (store selector or useMemo)
   * — a new array identity each render defeats the hook's memo.
   */
  selectedFactors?: string[];
}

/** Output from useMembershipModel. */
export interface UseMembershipModelResult {
  /** Chips sorted by separation (Ṽ) descending — strongest separator first. */
  chips: MembershipChip[];
  /** Number of rows that satisfy the condition (NIn). */
  nIn: number;
  /** Number of rows that do not satisfy the condition (NOut). */
  nOut: number;
}

/** Module-level stable empty array for the selectedFactors default.
 *
 * Using a module-level constant avoids the "new [] on every render" pitfall that
 * breaks useMemo deps stability when the caller omits selectedFactors.
 */
const EMPTY_SELECTED: string[] = [];

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Rank every candidate factor by how strongly its levels distinguish the
 * in-condition population from the out-of-condition population (bias-corrected
 * Cramér's Ṽ), and return typed chips for the FactorStrip membership variant.
 *
 * Returns null when:
 *   - `outcome` is null or empty;
 *   - `leaves` is empty (vacuous truth — all rows in-condition, no partition);
 *   - the engine returns null (NIn === 0, NOut === 0, or no factor has ≥ 2 levels);
 *   - all factors are excluded by D11.
 */
export function useMembershipModel({
  lensedRows,
  leaves,
  allFactors,
  outcome,
  bindings,
  selectedFactors = EMPTY_SELECTED,
}: UseMembershipModelArgs): UseMembershipModelResult | null {
  return useMemo(() => {
    if (!outcome) return null;
    if (allFactors.length === 0) return null;
    // Empty leaves = vacuous truth (all rows "in") → degenerate.
    if (leaves.length === 0) return null;

    // D11: drop any column that is derived from the outcome itself (tautology).
    const candidates = excludeYDerivedFactors(allFactors, outcome, bindings);
    if (candidates.length === 0) return null;

    // Disposition 2 / D7: pass FULL lensed rows (not pre-filtered).
    const engineResult = computeMembershipSeparation(lensedRows, leaves, candidates);
    if (engineResult === null) return null;

    const { factors: factorResults, nIn, nOut } = engineResult;
    if (factorResults.length === 0) return null;

    const selectedSet = new Set(selectedFactors);

    const chips: MembershipChip[] = factorResults.map(fs => {
      // Thread topLevel from the engine if available, pairing level + lift.
      let topLevel: MembershipChipTopLevel | null = null;
      if (fs.topLevel !== null) {
        const topLevelData = fs.levels.find(lv => lv.level === fs.topLevel);
        if (topLevelData) {
          topLevel = { level: topLevelData.level, lift: topLevelData.lift };
        }
      }

      return {
        factor: fs.factor,
        separation: fs.adjustedV,
        pValue: fs.pValue,
        isSignificant: fs.pValue < 0.05,
        df: fs.df,
        n: fs.n,
        binnedForRanking: fs.binnedForRanking,
        topLevel,
        isSelected: selectedSet.has(fs.factor),
      };
    });

    return { chips, nIn, nOut };
  }, [lensedRows, leaves, allFactors, outcome, bindings, selectedFactors]);
}

// ── Composition model ─────────────────────────────────────────────────────────

/** Arguments for useCompositionModel. */
export interface UseCompositionModelArgs {
  /**
   * Full lensed dataset (NOT pre-filtered to condition rows).
   * Disposition 2 / D7: the engine operates on the full population.
   */
  lensedRows: DataRow[];
  /**
   * Flat AND-of-leaves defining the active condition.
   * Empty → no partition → degenerate → null.
   */
  leaves: ReadonlyArray<ConditionLeaf>;
  /**
   * Single factor column to decompose by level.
   * The engine is called with `[factor]` as the only candidate.
   */
  factor: string;
}

/** Output from useCompositionModel. */
export interface UseCompositionModelResult {
  /**
   * Per-level composition data, sorted by lift descending (highest
   * over-representation first).
   *
   * Count-view ordering (nIn descending) is a UI concern — callers that want
   * count mode should re-sort this array by `nIn` descending.  The hook
   * exposes a single canonical ordering (lift desc) so the engine runs once.
   */
  levels: MembershipLevelComposition[];
  /** Number of rows that satisfy the condition. */
  nIn: number;
  /** Number of rows that do not satisfy the condition. */
  nOut: number;
}

/**
 * Decompose a single factor by membership composition.
 *
 * Reuses the membership-separation engine for a single factor, then projects
 * its level data.  The contingency math is NOT duplicated in this hook.
 *
 * Sort contract: levels are returned sorted by lift descending.
 * For count-view ordering (nIn desc), re-sort in the UI — this hook returns
 * a single canonical ordering so the engine runs once per input change.
 *
 * Returns null when:
 *   - `leaves` is empty (no partition possible);
 *   - the engine returns null (NIn === 0, NOut === 0, or factor has < 2 levels).
 */
export function useCompositionModel({
  lensedRows,
  leaves,
  factor,
}: UseCompositionModelArgs): UseCompositionModelResult | null {
  return useMemo(() => {
    if (leaves.length === 0) return null;
    if (!factor) return null;

    const engineResult = computeMembershipSeparation(lensedRows, leaves, [factor]);
    if (engineResult === null) return null;

    // Project the single-factor result.
    const factorResult = engineResult.factors.find(f => f.factor === factor);
    if (!factorResult) return null;

    return {
      levels: factorResult.levels, // already sorted lift desc by the engine
      nIn: engineResult.nIn,
      nOut: engineResult.nOut,
    };
  }, [lensedRows, leaves, factor]);
}
