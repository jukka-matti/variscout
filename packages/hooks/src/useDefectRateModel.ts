/**
 * useDefectRateModel — packages `computeDefectRateShares` output into typed
 * chips for the FactorStrip `'defect-rate-share'` variant (Task 2 / ER-5b).
 *
 * Contract (ER-5b D12):
 *   - Concentration is computed over the ALREADY-TRANSFORMED working dataset
 *     produced by `computeDefectRates()`. NEVER call this on raw event-log rows
 *     (the `computeDefectRates`-before-stats boundary is untouchable).
 *   - D11 exclusion: Y-derived columns are dropped before calling the engine
 *     (same responsibility boundary as useFactorStripModel / useMembershipModel).
 *   - DefectRateChip carries `concentration` (rate dispersion, bounded ≥ 0) —
 *     NOT a variance share. Mislabelling this as "% of variation" is a
 *     statistical-honesty violation (P5 / ADR-069). Formatting is the UI
 *     layer's responsibility.
 *
 * Memoised on (workingRows, allFactors, defectOutcome, bindings).
 * No store reads — all data arrives via props.
 *
 * @module hooks/useDefectRateModel
 */

import { useMemo } from 'react';
import type { DataRow } from '@variscout/core';
import { computeDefectRateShares } from '@variscout/core';
import type { DefectRateLevelData } from '@variscout/core';
import type { BinnedFactorBinding } from '@variscout/core/binning';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Top-level annotation for a defect-rate chip — the most over-concentrated
 * level (highest rate above the overall rate).
 *
 * `level` — the level label.
 * `rate`  — the defect rate at this level (raw number; UI formats via formatStat).
 */
export interface DefectRateChipTopLevel {
  level: string;
  /** Raw defect rate at this level (0..∞). UI formats via formatStat. */
  rate: number;
}

/**
 * One ranked factor chip produced by useDefectRateModel.
 *
 * Honesty note (P5 / ADR-069 B3): `concentration` is a rate dispersion
 * statistic (weighted mean absolute deviation of per-level rates from the
 * overall rate). It is NOT a variance share; never render it as "X% of
 * variation explained" — that would be a statistical honesty violation.
 * Label it as "rate concentration" or show it as a relative bar.
 *
 * Raw numbers only — formatting is the UI's responsibility (P5 / ADR-069 B3).
 */
export interface DefectRateChip {
  /** Factor column name. */
  factor: string;
  /**
   * Weighted mean absolute deviation of per-level defect rates from the
   * overall rate. Bounded ≥ 0; larger = more concentrated defect risk.
   * See the honesty note above — this is NOT a variance share.
   */
  concentration: number;
  /** Per-level rate data (sorted by rate DESC — highest-defect level first). */
  perLevel: DefectRateLevelData[];
  /** True when the factor has non-trivial separation between levels. */
  isSignificant: boolean;
  /**
   * The level with the highest defect rate (most over-concentrated).
   * null when the factor has no levels with a rate above the overall rate.
   */
  topLevel: DefectRateChipTopLevel | null;
}

/** Arguments for useDefectRateModel. */
export interface UseDefectRateModelArgs {
  /**
   * Working rows produced by `computeDefectRates()` — ALREADY AGGREGATED.
   * NEVER pass raw event-log rows here; the `computeDefectRates`-before-stats
   * boundary is an invariant (packages/core/CLAUDE.md).
   */
  workingRows: DataRow[];
  /**
   * Candidate factor columns (merged, seed-not-gate).
   * Y-derived columns are excluded inside the hook (D11 boundary).
   */
  allFactors: string[];
  /**
   * Active defect outcome column name (e.g. 'DefectRate' or 'DefectCount').
   * null → hook returns null.
   */
  defectOutcome: string | null;
  /**
   * Binned-factor bindings for D11 exclusion (optional).
   * Pass from the active project's bindings when available.
   */
  bindings?: BinnedFactorBinding[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Rank every candidate factor by how strongly its levels concentrate the
 * defect rate (level-native rate contribution, ADR-088), and return typed
 * chips for the FactorStrip `'defect-rate-share'` variant.
 *
 * Returns null when:
 *   - `defectOutcome` is null or empty;
 *   - `workingRows` is empty;
 *   - `allFactors` is empty after D11 exclusion;
 *   - `computeDefectRateShares` returns no results.
 */
export function useDefectRateModel({
  workingRows,
  allFactors,
  defectOutcome,
  bindings,
}: UseDefectRateModelArgs): DefectRateChip[] | null {
  return useMemo(() => {
    if (!defectOutcome) return null;
    if (workingRows.length === 0) return null;
    if (allFactors.length === 0) return null;

    // Compute rate shares — D11 exclusion is handled inside computeDefectRateShares
    const shares = computeDefectRateShares(workingRows, allFactors, defectOutcome, bindings);
    if (shares.length === 0) return null;

    // Package into DefectRateChip[] (already sorted DESC by concentration)
    return shares.map(share => {
      // topLevel: the level with the highest rate (first in perLevel since sorted DESC)
      let topLevel: DefectRateChipTopLevel | null = null;
      if (share.perLevel.length > 0) {
        const topLevelData = share.perLevel[0]; // already sorted by rate DESC
        topLevel = { level: topLevelData.level, rate: topLevelData.rate };
      }

      return {
        factor: share.factor,
        concentration: share.concentration,
        perLevel: share.perLevel,
        isSignificant: share.isSignificant,
        topLevel,
      };
    });
  }, [workingRows, allFactors, defectOutcome, bindings]);
}
