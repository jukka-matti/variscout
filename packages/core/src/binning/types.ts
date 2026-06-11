/**
 * Types for the binning sub-path.
 *
 * Backs the Probability lens "kink detection" UX in the Explore tab (PR-CCJ-G1):
 * the analyst sees an inflection point on the probability plot, applies binning,
 * and the resulting bin column becomes a persistent derived chip used for
 * downstream stratification.
 *
 * @module binning/types
 */

/**
 * A persistent derived factor produced by binning a numeric source column.
 *
 * Survives across sessions as a chip in the column palette; the analyst stratifies
 * downstream charts (boxplot, control chart, etc.) by the resulting bin levels.
 */
export interface BinnedFactorBinding {
  /** Stable identifier for this binding. */
  id: string;
  /** Raw numeric source column being binned. */
  sourceColumn: string;
  /**
   * Generic provenance field (spec §10/D11) — the column this binding was derived from.
   *
   * `sourceColumn` remains the operational field used at runtime (applyCuts, factor
   * effects, segment-leaf building). `derivedFrom` exists so NON-binding derived
   * columns (e.g. a bin column surfaced from a different engine) can also be
   * provenance-tracked and excluded from Y-derived factor ranking without requiring a
   * `sourceColumn` match. Optional for backward compatibility — existing bindings
   * without the field keep working; `excludeYDerivedFactors` falls back to the
   * `sourceColumn` convention when `derivedFrom` is absent.
   */
  derivedFrom?: string;
  /** Sorted cut values in source-column value space. */
  cuts: number[];
  /** Level names; length === cuts.length + 1. */
  levelNames: string[];
  /** How the cuts were chosen. */
  detectionMethod: 'gap-ratio-v1' | 'manual';
  /** ISO timestamp captured when the binding was created or refreshed. */
  detectedAt: string;
}

/**
 * Input parameters for inflection-point detection on a probability plot.
 */
export interface InflectionDetectionInput {
  /** Raw numeric column values; caller filters nulls / NaNs. */
  values: number[];
  /** Maximum number of breakpoints to search for. Default: 2. */
  maxBreakpoints?: number;
}

/**
 * Per-segment statistics returned alongside detected cuts.
 *
 * The `adPValue` doubles as the per-segment normality-confidence signal that
 * justifies stratifying by the cuts: each segment "looks linear" on the
 * probability plot when its Anderson-Darling p-value is comfortably above
 * a normality threshold (e.g., > 0.1).
 */
export interface SegmentStats {
  /** Source-column value range. `lower=null` for first segment, `upper=null` for last. */
  range: { lower: number | null; upper: number | null };
  /** Number of observations in the segment. */
  n: number;
  /** Share of total observations as a percentage 0-100. */
  percentShare: number;
  /** Arithmetic mean of segment values; `undefined` for empty segments. */
  mean: number | undefined;
  /** Anderson-Darling p-value; `undefined` if n < 7 (insufficient for AD test). */
  adPValue: number | undefined;
}

/**
 * Result of inflection-point detection.
 *
 * If no breakpoint meets the relative-RSS-reduction threshold the result is
 * `{ cuts: [], segments: [<singleSegment>], confidence: 0 }`.
 */
export interface InflectionDetectionResult {
  /** Cut values in source-column value space; length 0..maxBreakpoints. */
  cuts: number[];
  /** Per-segment stats; length === cuts.length + 1. */
  segments: SegmentStats[];
  /** Overall confidence: relative RSS reduction × 100, clamped 0..100. */
  confidence: number;
}
