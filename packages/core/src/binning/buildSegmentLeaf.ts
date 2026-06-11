/**
 * Build a `ConditionLeaf` that matches rows belonging to a specific segment of a
 * `BinnedFactorBinding`.
 *
 * Used by the inflection-binning surface's per-segment "view as condition →" CTA
 * (spec §10/ER-5a): the analyst clicks a segment chip and the matching condition
 * leaf is appended to the active condition via `applyCondition`.
 *
 * Boundary rule — mirrors `buildBandLeaf`'s inclusive `between` convention and the
 * `between` evaluator in `hypothesisConditionEvaluator.ts`:
 *
 *   segment 0           (first):   op 'lt',      value = cuts[0]
 *   segment i (1..k-1) (middle):   op 'between', value = [cuts[i-1], cuts[i]]  (inclusive both ends)
 *   segment k           (last):    op 'gte',     value = cuts[k-1]
 *
 * The `between` bounds are **inclusive on both ends** (`raw >= lo && raw <= hi`)
 * which matches how `evaluateCondition` in `hypothesisConditionEvaluator.ts`
 * evaluates the op. This mirrors `buildBandLeaf`'s value shape exactly.
 *
 * Note on boundary overlap: `applyCuts` uses lower-inclusive, upper-exclusive
 * convention (`cuts[i-1] <= v < cuts[i]`) which produces non-overlapping segments.
 * The `between` leaf uses inclusive-both-ends, so a value exactly at a cut boundary
 * is matched by both the lower segment's `between` upper bound and the upper
 * segment's `between` lower bound. This is an intentional trade-off — `between`
 * is the canonical range-leaf op used across the codebase (e.g. `buildBandLeaf`),
 * and segment conditions are for exploration / condition minting, not for exact
 * population reconstruction. Callers requiring the non-overlapping guarantee should
 * use `applyCuts` directly.
 *
 * @module binning/buildSegmentLeaf
 */

import type { ConditionLeaf } from '../findings/hypothesisCondition';
import type { BinnedFactorBinding } from './types';

/**
 * Build a `ConditionLeaf` for the segment at `segmentIndex` in the given binding.
 *
 * Segments are 0-indexed. A binding with `cuts.length === k` has `k + 1` segments:
 *   - segment 0           → first (open lower end)
 *   - segments 1 … k-1   → middle (bounded both ends, inclusive)
 *   - segment k           → last (open upper end)
 *
 * The leaf is built on `binding.sourceColumn` — the raw numeric column from which
 * the cuts were derived. The generated condition can be passed directly to
 * `applyCondition` to filter the dataset to the matching population.
 *
 * @param binding       - The `BinnedFactorBinding` whose cuts define the segments.
 * @param segmentIndex  - 0-based index of the target segment (0 … cuts.length).
 * @returns A `ConditionLeaf` matching the segment's value range.
 * @throws {RangeError}  When `segmentIndex < 0` or `segmentIndex > cuts.length`.
 */
export function buildSegmentLeaf(
  binding: BinnedFactorBinding,
  segmentIndex: number
): ConditionLeaf {
  const { cuts, sourceColumn } = binding;
  const k = cuts.length; // number of cut points → k+1 segments

  if (segmentIndex < 0 || segmentIndex > k) {
    throw new RangeError(
      `buildSegmentLeaf: segmentIndex ${segmentIndex} is out of range for a binding with ` +
        `${k} cut(s) (valid range: 0 … ${k}).`
    );
  }

  // First segment: open lower end — everything below the first cut.
  if (segmentIndex === 0) {
    return { kind: 'leaf', column: sourceColumn, op: 'lt', value: cuts[0] };
  }

  // Last segment: open upper end — everything at or above the last cut.
  if (segmentIndex === k) {
    return { kind: 'leaf', column: sourceColumn, op: 'gte', value: cuts[k - 1] };
  }

  // Middle segment: bounded both ends, inclusive (mirrors buildBandLeaf's between convention).
  return {
    kind: 'leaf',
    column: sourceColumn,
    op: 'between',
    value: [cuts[segmentIndex - 1], cuts[segmentIndex]],
  };
}
