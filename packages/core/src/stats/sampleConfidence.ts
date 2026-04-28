/**
 * Sample-size confidence band for a capability statistic.
 *
 * Watson's transcript: at n=25 ~10% extra uncertainty, n=20 ~40%, n=15 ~30%.
 * VariScout's deterministic engine refuses to publish Cpk for `insufficient`
 * (n<10), badges `review` (10≤n<30), and trusts `trust` (n≥30).
 *
 * See:
 *   docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 *   ~/.claude/plans/i-would-need-to-drifting-hummingbird.md (objection A4)
 */

export type SampleConfidence = 'trust' | 'review' | 'insufficient';

/** Thresholds used for `sampleConfidenceFor`. Exported for UI badges. */
export const SAMPLE_CONFIDENCE_THRESHOLDS = {
  /** n < this is `insufficient`. */
  insufficient: 10,
  /** n >= this is `trust`; otherwise `review`. */
  review: 30,
} as const;

/**
 * Map a sample size to a confidence band. Pure function. Defensive against
 * fractional n via `Math.floor`. n must be non-negative; negative values
 * return `insufficient`.
 */
export function sampleConfidenceFor(n: number): SampleConfidence {
  const floored = Math.floor(n);
  if (floored < SAMPLE_CONFIDENCE_THRESHOLDS.insufficient) return 'insufficient';
  if (floored < SAMPLE_CONFIDENCE_THRESHOLDS.review) return 'review';
  return 'trust';
}
