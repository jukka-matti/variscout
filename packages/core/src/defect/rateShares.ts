/**
 * Level-native defect-rate contribution — ADR-088.
 *
 * `computeDefectRateShares` ranks candidate factors by how strongly their
 * levels concentrate the defect rate relative to the overall rate.
 *
 * Statistical honesty note (P5 / ADR-069 B3):
 *   These are RATE SHARES — a level-native rate contribution measure.
 *   They are NOT variance shares and must never be labelled "% of variation".
 *   The computation: per-level defect rate vs. the overall rate, weighted by
 *   level exposure (row count). Concentration = weighted mean absolute deviation
 *   of per-level rates from the overall rate.
 *
 * Numeric safety (ADR-069):
 *   All outputs use `safeDivide` / `finiteOrUndefined`. No NaN or Infinity
 *   is ever returned. Raw numbers only — formatting is the UI layer's job.
 *
 * @module core/defect/rateShares
 */

import { safeDivide } from '../stats/safeMath';
import { excludeYDerivedFactors } from '../stats/factorEffects';
import type { DataRow } from '../types';
import type { BinnedFactorBinding } from '../binning/types';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-level data for a factor's rate contribution.
 *
 * `level`  — the level label (string value of the factor column).
 * `rate`   — defect rate at this level (mean of the outcome column).
 * `share`  — how this level's rate compares to the overall rate
 *            (`rate / overallRate`); ≥ 1 means above average, < 1 below.
 *            Returns 0 when overall rate is 0 (no defects → no share to assign).
 * `n`      — number of rows at this level (exposure weight).
 */
export interface DefectRateLevelData {
  level: string;
  rate: number;
  share: number;
  n: number;
}

/**
 * Rate contribution result for one factor.
 *
 * Honesty note (P5 / ADR-069): `concentration` is a level-native rate
 * dispersion statistic — the weighted mean absolute deviation of per-level
 * rates from the overall rate. It is NOT a variance share; never label it
 * "% of variation explained".
 */
export interface DefectRateShare {
  /** Factor column name. */
  factor: string;
  /**
   * Per-level rate data, sorted descending by `rate` (highest-defect level
   * first — the most over-concentrated level is the natural Pareto focus).
   */
  perLevel: DefectRateLevelData[];
  /**
   * Weighted mean absolute deviation of per-level rates from the overall rate.
   * Bounded ≥ 0; 0 when all levels have identical rates; larger when one level
   * dominates.
   *
   * This is a rate dispersion statistic — see the honesty note above.
   */
  concentration: number;
  /**
   * True when the factor has ≥ 2 levels with non-trivial separation
   * (concentration > 0.01 × overallRate).
   * Purely indicative; no inferential test is applied in V1.
   */
  isSignificant: boolean;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Compute level-native defect-rate contributions for each candidate factor.
 *
 * @param workingRows   Rows produced by `computeDefectRates()` — already
 *                      aggregated. NEVER pass raw event-log rows here.
 * @param factors       Candidate factor column names (Y-derived columns are
 *                      excluded internally via excludeYDerivedFactors).
 * @param outcomeColumn Name of the defect-rate / defect-count column (e.g.
 *                      'DefectRate' or 'DefectCount').
 * @param bindings      Optional binned-factor bindings for D11 exclusion.
 * @returns Array of `DefectRateShare` sorted descending by `concentration`
 *          (highest contributor first). Empty when data is empty or no valid
 *          factors remain after exclusion.
 */
export function computeDefectRateShares(
  workingRows: DataRow[],
  factors: string[],
  outcomeColumn: string,
  bindings?: BinnedFactorBinding[]
): DefectRateShare[] {
  if (workingRows.length === 0 || factors.length === 0) {
    return [];
  }

  // D11: exclude Y-derived columns (tautological — outcome itself, _bin suffixed, etc.)
  const candidates = excludeYDerivedFactors(factors, outcomeColumn, bindings).filter(
    f => f !== outcomeColumn
  );

  if (candidates.length === 0) {
    return [];
  }

  // Compute overall defect rate (mean of outcome column across all rows)
  let overallSum = 0;
  let overallCount = 0;
  for (const row of workingRows) {
    const val = row[outcomeColumn];
    if (typeof val === 'number' && Number.isFinite(val)) {
      overallSum += val;
      overallCount++;
    }
  }

  if (overallCount === 0) {
    return [];
  }

  const overallRate = overallSum / overallCount;

  // Compute per-factor concentration
  const results: DefectRateShare[] = [];

  for (const factor of candidates) {
    // Group rows by factor level
    const levelGroups = new Map<string, number[]>();
    for (const row of workingRows) {
      const levelVal = row[factor];
      if (levelVal === null || levelVal === undefined) continue;
      const levelKey = String(levelVal);
      const arr = levelGroups.get(levelKey);
      if (arr) {
        const outcomeVal = row[outcomeColumn];
        if (typeof outcomeVal === 'number' && Number.isFinite(outcomeVal)) {
          arr.push(outcomeVal);
        }
      } else {
        const outcomeVal = row[outcomeColumn];
        const vals: number[] = [];
        if (typeof outcomeVal === 'number' && Number.isFinite(outcomeVal)) {
          vals.push(outcomeVal);
        }
        levelGroups.set(levelKey, vals);
      }
    }

    // Need at least 2 levels with data to have any concentration
    const validLevels = Array.from(levelGroups.entries()).filter(([, vals]) => vals.length > 0);
    if (validLevels.length < 1) continue;

    // Compute per-level rates
    const perLevelData: DefectRateLevelData[] = [];
    for (const [level, vals] of validLevels) {
      if (vals.length === 0) continue;
      const levelRate = vals.reduce((a, b) => a + b, 0) / vals.length;
      const share = safeDivide(levelRate, overallRate) ?? 0;
      perLevelData.push({
        level,
        rate: levelRate,
        share,
        n: vals.length,
      });
    }

    if (perLevelData.length === 0) continue;

    // Sort by rate descending (highest-defect level first)
    perLevelData.sort((a, b) => b.rate - a.rate);

    // Concentration = weighted mean absolute deviation of per-level rates from overall rate
    // weight = n_level / n_total
    const totalN = perLevelData.reduce((s, l) => s + l.n, 0);
    let concentration = 0;
    if (totalN > 0) {
      for (const levelData of perLevelData) {
        const weight = levelData.n / totalN;
        concentration += weight * Math.abs(levelData.rate - overallRate);
      }
    }

    // Significance: indicative threshold (concentration > 1% of overall rate)
    const significanceThreshold = Math.abs(overallRate) * 0.01;
    const isSignificant = validLevels.length >= 2 && concentration > significanceThreshold;

    results.push({
      factor,
      perLevel: perLevelData,
      concentration,
      isSignificant,
    });
  }

  // Sort by concentration descending
  results.sort((a, b) => b.concentration - a.concentration);

  return results;
}
