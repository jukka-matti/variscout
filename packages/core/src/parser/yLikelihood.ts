/**
 * Y-likelihood ranking heuristic for FRAME b0 column-selection UI.
 *
 * Pure function: given parsed `ColumnAnalysis[]`, return the subset of
 * plausible Y candidates (output / outcome / KPI columns) ranked by how
 * Y-like each is. Used by the Y-picker UI to display continuous-numeric
 * columns in a sensible default order.
 *
 * IMPORTANT: this function NEVER auto-selects. It only orders the candidate
 * set so the user's first eye-fixation lands on the most likely measure.
 *
 * Hard rules: pure TS, no React/UI imports (per packages/core/CLAUDE.md).
 */

import type { ColumnAnalysis } from './types';

export interface RankedColumn {
  column: ColumnAnalysis;
  /** Heuristic score, higher = more Y-like. Range roughly 0..2. */
  score: number;
  /** Reasons that contributed to the score, for debugging / future tooltip. */
  reasons: readonly string[];
}

// Plausibility-filter regexes: case-insensitive name patterns that strongly
// indicate "this is NOT a Y" (time / id columns are excluded outright,
// regardless of inferred type, since name signals win when the pattern is strong).
const TIME_LIKE_NAME =
  /^(time|timestamp|date|datetime|.*_at|.*_dt|.*time$|.*date$|year|month|day|hour|minute|second)$/i;
const ID_LIKE_NAME = /^(id|.*_id|.*_uuid|index|row.?num|seq.?num|serial)$/i;

// Score-boost name patterns. Each matched substring (case-insensitive) adds
// +0.5 to the column score, capped at +1.0 total so very long names with
// multiple weak hits don't outrank a clearly-named outcome.
const NAME_PATTERN_GROUPS: readonly string[] = [
  '%',
  'pct',
  'percent',
  'rate',
  'yield',
  'defect',
  'output',
  'result',
  'content',
  'weight',
  'length',
  'width',
  'thickness',
  'diameter',
  'quality',
  'score',
];

const BASE_SCORE = 1.0;
const NAME_PATTERN_BONUS = 0.5;
const NAME_PATTERN_BONUS_CAP = 1.0;
const RICH_VARIATION_BONUS = 0.3;
const RICH_VARIATION_THRESHOLD = 30;

/**
 * Filter to plausible Y candidates, then rank by Y-likelihood.
 * Plausible = numeric type AND has variation AND name not strongly time-like / id-like.
 * Excluded: date columns, text columns, all-equal numeric columns, columns named like an ID.
 *
 * Returned in descending score order. Ties broken by original order.
 */
export function rankYCandidates(columns: readonly ColumnAnalysis[]): RankedColumn[] {
  const ranked: Array<RankedColumn & { originalIndex: number }> = [];

  columns.forEach((column, originalIndex) => {
    // Plausibility filter (hard exclude)
    if (column.type !== 'numeric') return;
    if (!column.hasVariation) return;
    if (TIME_LIKE_NAME.test(column.name)) return;
    if (ID_LIKE_NAME.test(column.name)) return;

    const reasons: string[] = ['base'];
    let score = BASE_SCORE;

    // Name pattern bonus (additive, capped)
    const lowerName = column.name.toLowerCase();
    let nameBonus = 0;
    for (const pattern of NAME_PATTERN_GROUPS) {
      if (lowerName.includes(pattern.toLowerCase())) {
        nameBonus += NAME_PATTERN_BONUS;
        reasons.push(`name pattern: ${pattern}`);
        if (nameBonus >= NAME_PATTERN_BONUS_CAP) break;
      }
    }
    score += Math.min(nameBonus, NAME_PATTERN_BONUS_CAP);

    // Variation bonus: rich measurement, not coarse-binned
    if (column.uniqueCount >= RICH_VARIATION_THRESHOLD) {
      score += RICH_VARIATION_BONUS;
      reasons.push('rich variation');
    }

    // Sparse penalty intentionally omitted: ColumnAnalysis exposes uniqueCount
    // (distinct values) and missingCount but not totalCount. Using
    // `missing / (unique + missing)` as a proxy is wrong for high-cardinality
    // columns (the most important Y candidates) — a 10k-row column with 50
    // distinct values + 100 missing would score `100/150 ≈ 0.67` and trigger
    // a false penalty, even though only ~1% of rows are missing. Add this
    // back when ColumnAnalysis grows a `totalCount` field.

    ranked.push({ column, score, reasons, originalIndex });
  });

  // Descending score, ties broken by original order (stable)
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.originalIndex - b.originalIndex;
  });

  return ranked.map(({ column, score, reasons }) => ({ column, score, reasons }));
}
