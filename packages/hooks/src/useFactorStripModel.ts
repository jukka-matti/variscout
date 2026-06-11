/**
 * useFactorStripModel — ranks every candidate factor by cardinality-penalised
 * share of variation (ω²-adjusted η²) and packages the results as typed chips
 * ready for the FactorStrip UI component (Task 3 / ER-2).
 *
 * Contract from the plan:
 *   - D11 exclusion: drops Y-derived factor columns before ranking.
 *   - Engine order: adjustedEtaSquared DESC; significance breaks ties.
 *   - isWeak: adjustedPct < 1 OR !isSignificant.
 *   - isSelected: framing-prominence flag only — ranking is ALWAYS global.
 *   - whatIf: computeMatchedBestProjection per chip, eager (fine at these
 *     sizes); undefined when no direction inferable (spec empty or 'nominal').
 *   - residualPct: 100 − max(chips.adjustedPct).  NOT a sum of chip shares —
 *     summing per-factor shares is an invalid decomposition (D3). ER-6 upgrades
 *     this to the in-model residual once best-subsets runs.
 *
 * Memoised on (rows, outcome, allFactors, selectedFactors, specs, bindings).
 * No store reads — all data arrives via props.
 */

import { useMemo } from 'react';
import type { DataRow, SpecLimits } from '@variscout/core';
import {
  computeMainEffects,
  excludeYDerivedFactors,
  computeMatchedBestProjection,
} from '@variscout/core';
import type { MatchedBestProjection } from '@variscout/core';
import type { BinnedFactorBinding } from '@variscout/core/binning';

// ── Types ─────────────────────────────────────────────────────────────────

/** What-if hover payload — ephemeral, never persisted. */
export type FactorStripWhatIf = MatchedBestProjection;

export interface FactorStripStepDecoration {
  stepId: string;
  stepName: string;
}

/**
 * One ranked factor chip produced by useFactorStripModel.
 * Raw numbers only — formatting is the UI's responsibility (P5 / ADR-069 B3).
 */
export interface FactorStripChip {
  /** Factor column name. */
  factor: string;
  /** Cardinality-penalised adjusted share × 100 (ω²-style), floored at 0. */
  adjustedPct: number;
  /** Raw descriptive η² × 100 (retained for transparency, never for ranking). */
  rawPct: number;
  /** One-way ANOVA p-value. */
  pValue: number;
  /** Between-groups degrees of freedom (k − 1). */
  dfBetween: number;
  /** Within-groups degrees of freedom (N − k). */
  dfWithin: number;
  /**
   * Number of observations in the joint complete-case set (rows where the
   * outcome and ALL ranked candidates are present). NOT a per-factor valid
   * count — a missing value in ANY candidate excludes the row.
   */
  n: number;
  /** True when the ANOVA p-value < 0.05. */
  isSignificant: boolean;
  /**
   * True when adjustedPct < 1 OR !isSignificant.  Weak chips render grayed
   * in the UI (still visible — honesty beats suppression).
   */
  isWeak: boolean;
  /**
   * True when the factor is in the framing-selected set.  This is a prominence
   * flag only — ranking order is always global regardless of selection.
   */
  isSelected: boolean;
  /**
   * True when a continuous factor was quartile-binned (Q1–Q4) before ranking.
   * The UI annotates these chips with "(binned)" so the analyst knows the
   * bars reflect quartile-grouped data, not raw values.
   */
  binnedForRanking: boolean;
  /** Process-step attribution from Frame/Canvas, if this factor belongs to a step. */
  step?: FactorStripStepDecoration;
  /**
   * Matched-best projection for the what-if hover card.  Undefined when:
   *   - no spec limits / direction are inferable (spec empty or 'nominal');
   *   - the engine returns undefined on degenerates (< 2 groups, < 3 rows).
   * The UI MUST omit the hover block entirely when this is undefined.
   */
  whatIf?: FactorStripWhatIf;
}

/** Arguments for useFactorStripModel. */
export interface UseFactorStripModelArgs {
  /** Lensed/filtered rows the strip ranks over. */
  rows: DataRow[];
  /** Active outcome (Y) column name. Null → hook returns null. */
  outcome: string | null;
  /**
   * Merged candidate factor columns (seed-not-gate — includes framing-selected
   * AND every other derived/raw column).  Callers pass
   * `useDashboardChartsBase().allFactors` directly.
   */
  allFactors: string[];
  /**
   * Framing-selected factors (prominence flag only).  The strip ranks ALL
   * candidates globally; selected factors just get isSelected=true so the UI
   * can visually distinguish them.
   *
   * Callers MUST pass a referentially stable array (store selector or useMemo)
   * — a new array identity each render defeats the hook's memo.
   */
  selectedFactors: string[];
  /**
   * Per-outcome spec limits resolved by the caller (measureSpecs-resolved).
   * Used for what-if direction inference; undefined → no what-if.
   */
  specs?: SpecLimits;
  /**
   * Binned-factor bindings from the active project.  Used for D11 exclusion
   * (strips any column whose sourceColumn === outcome or whose materialized
   * name matches the `${outcome}_bin` convention).
   */
  bindings?: BinnedFactorBinding[];
  /** Optional process-step decorations keyed by factor column name. */
  stepDecorations?: ReadonlyMap<string, FactorStripStepDecoration>;
}

/** Output from useFactorStripModel. */
export interface UseFactorStripModelResult {
  /** Ranked chips, engine order (adjusted DESC, significance tiebreak). */
  chips: FactorStripChip[];
  /**
   * Approximate residual: 100 − max(chips.adjustedPct).
   * Null when chips is empty.
   * The `~` prefix and "not tied to these factors" copy are the UI's
   * responsibility — this hook returns the raw number only.
   *
   * ⚠ Summing individual chip shares would be an invalid decomposition (D3).
   * ER-6 will upgrade this to the true in-model residual (1 − R²adj) once
   * best-subsets is run.  Until then, the largest-share floor is the honest
   * v1 approximation.
   */
  residualPct: number | null;
  /** Number of valid observations used by the engine. */
  n: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────

/**
 * Rank every candidate factor by cardinality-penalised share of variation
 * (ω²-adjusted η²) and return typed chips for the FactorStrip component.
 *
 * Returns null when:
 *   - `outcome` is null or empty;
 *   - the engine returns null (< 3 rows, all-same-Y, no factors with ≥ 2 levels).
 */
export function useFactorStripModel({
  rows,
  outcome,
  allFactors,
  selectedFactors,
  specs,
  bindings,
  stepDecorations,
}: UseFactorStripModelArgs): UseFactorStripModelResult | null {
  return useMemo(() => {
    if (!outcome) return null;
    if (allFactors.length === 0) return null;

    // D11: drop any column that is derived from the outcome itself (tautology).
    const candidates = excludeYDerivedFactors(allFactors, outcome, bindings);
    if (candidates.length === 0) return null;

    const mainEffects = computeMainEffects(rows, outcome, candidates);
    if (mainEffects === null) return null;

    const { factors: factorResults, n } = mainEffects;
    if (factorResults.length === 0) return null;

    const selectedSet = new Set(selectedFactors);

    const chips: FactorStripChip[] = factorResults.map(fe => {
      const adjustedPct = fe.adjustedEtaSquared * 100;
      const rawPct = fe.etaSquared * 100;
      const isWeak = adjustedPct < 1 || !fe.isSignificant;

      // Eager what-if projection — cheap at typical strip sizes (<50 factors).
      const whatIf = computeMatchedBestProjection(rows, outcome, fe.factor, specs);

      return {
        factor: fe.factor,
        adjustedPct,
        rawPct,
        pValue: fe.pValue,
        dfBetween: fe.dfBetween,
        dfWithin: fe.dfWithin,
        n,
        isSignificant: fe.isSignificant,
        isWeak,
        isSelected: selectedSet.has(fe.factor),
        binnedForRanking: fe.binnedForRanking,
        step: stepDecorations?.get(fe.factor),
        whatIf,
      };
    });

    // Residual: 100 − top adjusted share (v1 approximation; see JSDoc above).
    const maxAdjustedPct = chips.length > 0 ? Math.max(...chips.map(c => c.adjustedPct)) : null;
    const residualPct = maxAdjustedPct !== null ? Math.max(0, 100 - maxAdjustedPct) : null;

    return { chips, residualPct, n };
  }, [rows, outcome, allFactors, selectedFactors, specs, bindings, stepDecorations]);
}
