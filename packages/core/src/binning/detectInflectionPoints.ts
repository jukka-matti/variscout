/**
 * Inflection-point detection for the probability lens binning UX.
 *
 * Algorithm (V1, tuned for separating Gaussian mixtures from unimodal data):
 *
 *   0. Pre-check: if the sample is already approximately normal
 *      (Anderson-Darling p > NORMALITY_P), there is no inflection to detect.
 *
 *   1. Build the probability-plot point cloud (value, normalQuantile(rank))
 *      using Benard's median rank `p_i = (i + 1 - 0.3) / (n + 0.4)` on the
 *      sorted-ascending values. The cloud is preserved as the diagnostic
 *      coordinate system, even though detection itself works on gaps.
 *
 *   2. Compute the median between-value gap `medianGap = median(sorted[i] -
 *      sorted[i-1])`. After trimming the first/last EDGE_TRIM_FRACTION of
 *      candidate breakpoints (to suppress tail-outlier dominance), find the
 *      breakpoint with the largest `gap[i] / medianGap` ratio.
 *
 *   3. Accept the breakpoint iff `gap[i] / medianGap > GAP_RATIO_THRESHOLD`.
 *      The ratio is the signal a Six Sigma user sees on a probability plot
 *      kink — a wide jump in source-column value for a tiny jump in z-rank.
 *      A clean unimodal Gaussian has within-cluster gaps that scale uniformly
 *      with sample density; bimodal mixtures have a between-cluster gap
 *      orders of magnitude larger than the within-cluster median.
 *
 *   4. After accepting a cut, RSS reduction is reported as the overall
 *      confidence: fit two lines on the (value, normalQuantile) cloud
 *      against the candidate split and compare to the single-line baseline.
 *
 *   5. If `maxBreakpoints >= 2`, recurse on the LARGER of the two segments
 *      produced by the cut. The recursion treats the sub-segment as its own
 *      dataset (its own median-gap, its own AD whole-sample check). If the
 *      recursion finds an additional cut, return both.
 *
 * Why gap-ratio + AD-on-whole rather than PWL-RSS alone or AD-on-segments
 * alone:
 *
 *   - PWL-RSS reduction always exceeds the threshold for skewed unimodal
 *     data (lognormal, etc.) because a two-line fit absorbs systemic
 *     curvature — false positives.
 *
 *   - AD-on-segments depends on absolute p-value thresholds that are too
 *     noisy at the n≈50 sample sizes typical inside a sub-cluster: a clean
 *     N(50, 3) draw of 50 points can yield AD p ≈ 0.01 by chance — false
 *     negatives.
 *
 *   - Gap ratio is invariant to within-cluster spread and to the unit of
 *     measurement, and it directly captures the "kink in the probability
 *     plot" the user sees. The AD whole-sample pre-check defends against
 *     applying the gap test to already-normal data (where a Gaussian's
 *     extreme-tail outlier could otherwise look like a structural break).
 *
 * KDE-valley and change-point algorithms were considered and rejected
 * during the three-round brainstorm: KDE-valley operates in density space
 * (loses the user's prob-plot intuition) and change-point algorithms operate
 * on the value sequence (sensitive to data order, which is meaningless here).
 *
 * @module binning/detectInflectionPoints
 */

import { andersonDarlingTest } from '../stats/andersonDarling';
import { solveOLS } from '../stats/olsRegression';
import { normalQuantile } from '../stats/probability';
import { safeDivide } from '../stats/safeMath';
import type { InflectionDetectionInput, InflectionDetectionResult } from './types';
import { computeSegmentStats } from './segmentConfidence';

/** Minimum n for any inflection detection to run; below this we return no cuts. */
export const MIN_TOTAL_POINTS = 30;

/** Minimum points required in EACH side of a candidate split. */
const MIN_SEGMENT_POINTS = 5;

/** Skip first/last X% of candidate breakpoints (suppresses tail-outlier dominance). */
const EDGE_TRIM_FRACTION = 0.1;

/** Default maximum number of breakpoints to search for. */
const DEFAULT_MAX_BREAKPOINTS = 2;

/**
 * Anderson-Darling p-value threshold for the WHOLE-SAMPLE normality pre-check.
 * If the whole sample is consistent with normality above this threshold, no
 * inflection exists and detection short-circuits.
 */
const NORMALITY_P = 0.05;

/**
 * Minimum `gap[i] / medianGap` required to accept a breakpoint. Empirically
 * unimodal Gaussian / lognormal data top out at ~10x; bimodal/trimodal
 * Gaussian mixtures with means several σ apart show ratios of 100x or more.
 */
const GAP_RATIO_THRESHOLD = 20;

/**
 * Detect inflection points on the probability plot via gap-ratio detection
 * with Anderson-Darling whole-sample pre-check and probability-plot PWL
 * confidence reporting.
 */
export function detectInflectionPoints(input: InflectionDetectionInput): InflectionDetectionResult {
  const { values, maxBreakpoints = DEFAULT_MAX_BREAKPOINTS } = input;

  // --------------------------------------------------------------------------
  // 1. Guard rails — return no cuts + single segment for degenerate inputs.
  // --------------------------------------------------------------------------
  if (values.length === 0 || values.length < MIN_TOTAL_POINTS) {
    return {
      cuts: [],
      segments: computeSegmentStats(
        [...values].sort((a, b) => a - b),
        []
      ),
      confidence: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  if (sorted[0] === sorted[sorted.length - 1]) {
    // All values equal — degenerate.
    return { cuts: [], segments: computeSegmentStats(sorted, []), confidence: 0 };
  }

  // --------------------------------------------------------------------------
  // 2. Recursively detect cuts. Each level checks its own whole-sample
  //    normality, finds the best gap-ratio breakpoint, and recurses on the
  //    larger sub-segment if budget allows.
  // --------------------------------------------------------------------------
  const cuts = detectCutsRecursive(sorted, maxBreakpoints);
  if (cuts.length === 0) {
    return { cuts: [], segments: computeSegmentStats(sorted, []), confidence: 0 };
  }

  cuts.sort((a, b) => a - b);

  // --------------------------------------------------------------------------
  // 3. Compute confidence as the PWL RSS reduction on the WHOLE prob plot
  //    against the FIRST cut (cuts[0]), clamped to [0, 100].
  // --------------------------------------------------------------------------
  // Confidence reports RSS reduction against the FIRST cut only (2-segment fit
  // vs single line). For 2-cut results, this conservatively underreports the
  // full 3-segment separation quality. Full-partition PWL confidence is a
  // Task 8 follow-up if UX surfaces show this matters.
  const confidence = computePwlConfidence(sorted, cuts[0]);
  const segments = computeSegmentStats(sorted, cuts);

  return { cuts, segments, confidence };
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Recursive gap-ratio detector. Returns the cut values that decompose the
 * sorted segment, or `[]` if the segment shows no detectable inflection.
 */
function detectCutsRecursive(sortedSegment: number[], cutBudget: number): number[] {
  if (cutBudget <= 0) return [];
  const n = sortedSegment.length;
  if (n < MIN_SEGMENT_POINTS * 2) return [];

  // Whole-sample normality check at every recursion level. A sub-segment
  // that is already approximately normal has no further inflection.
  const wholeAD = andersonDarlingTest(sortedSegment).pValue;
  if (wholeAD > NORMALITY_P) return [];

  // ----- Compute gaps + median gap. -----------------------------------------
  const gaps = new Float64Array(n - 1);
  for (let i = 1; i < n; i++) gaps[i - 1] = sortedSegment[i] - sortedSegment[i - 1];
  const sortedGaps = gaps.slice().sort();
  const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)];
  if (!Number.isFinite(medianGap) || medianGap <= 0) return [];

  // ----- Trim candidate range to interior. ---------------------------------
  const trim = Math.max(MIN_SEGMENT_POINTS, Math.floor(n * EDGE_TRIM_FRACTION));
  if (n - trim - trim < 2) return [];

  // ----- Find the candidate breakpoint with the largest gap ratio. ---------
  let bestRatio = 0;
  let bestSplitIdx = -1;
  for (let i = trim; i <= n - trim; i++) {
    // i is the FIRST index of the right side; gap[i-1] = sorted[i] - sorted[i-1].
    const gap = gaps[i - 1];
    const ratio = safeDivide(gap, medianGap) ?? 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestSplitIdx = i;
    }
  }

  if (bestSplitIdx < 0 || bestRatio < GAP_RATIO_THRESHOLD) return [];

  // ----- Cut value: midpoint between the two adjacent values (more intuitive
  //       than picking the right-side min as the cut). ----------------------
  const cutValue = (sortedSegment[bestSplitIdx - 1] + sortedSegment[bestSplitIdx]) / 2;

  // ----- Recurse on the larger sub-segment if budget remains. --------------
  const cuts: number[] = [cutValue];
  if (cutBudget > 1) {
    const leftLen = bestSplitIdx;
    const rightLen = n - bestSplitIdx;
    const subsegment =
      leftLen >= rightLen
        ? sortedSegment.slice(0, bestSplitIdx)
        : sortedSegment.slice(bestSplitIdx);
    const subCuts = detectCutsRecursive(subsegment, cutBudget - 1);
    cuts.push(...subCuts);
  }

  return cuts;
}

/**
 * Confidence score: relative RSS reduction (in %) achieved by piecewise
 * linear fit at the given cut value vs a single line through the whole
 * (value, normalQuantile) probability-plot point cloud.
 *
 * This is reported as the "how strong is the inflection?" signal for the UI.
 */
function computePwlConfidence(sortedSegment: number[], cutValue: number): number {
  const n = sortedSegment.length;
  if (n < 2) return 0;

  // Find the first index where value >= cutValue.
  let splitIdx = 0;
  while (splitIdx < n && sortedSegment[splitIdx] < cutValue) splitIdx++;
  if (splitIdx < MIN_SEGMENT_POINTS || n - splitIdx < MIN_SEGMENT_POINTS) return 0;

  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = sortedSegment[i];
    ys[i] = normalQuantile((i + 1 - 0.3) / (n + 0.4));
  }

  const baseline = fitLineRSS(xs, ys, 0, n);
  const leftRSS = fitLineRSS(xs, ys, 0, splitIdx);
  const rightRSS = fitLineRSS(xs, ys, splitIdx, n);
  if (!Number.isFinite(baseline) || !Number.isFinite(leftRSS) || !Number.isFinite(rightRSS)) {
    return 0;
  }
  const reduction = safeDivide(baseline - (leftRSS + rightRSS), baseline) ?? 0;
  return Math.max(0, Math.min(100, reduction * 100));
}

/**
 * Fit y = a + b·x via OLS on (xs, ys) over indices [start, end) and return RSS.
 * Returns NaN if the segment has fewer than two distinct x values.
 */
function fitLineRSS(xs: Float64Array, ys: Float64Array, start: number, end: number): number {
  const len = end - start;
  if (len < 2) return NaN;

  const xSlice = new Float64Array(len);
  const ySlice = new Float64Array(len);
  const intercept = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    xSlice[i] = xs[start + i];
    ySlice[i] = ys[start + i];
    intercept[i] = 1;
  }

  let xMin = xSlice[0];
  let xMax = xSlice[0];
  for (let i = 1; i < len; i++) {
    const v = xSlice[i];
    if (v < xMin) xMin = v;
    if (v > xMax) xMax = v;
  }
  if (xMin === xMax) return NaN;

  const sol = solveOLS([intercept, xSlice], ySlice, len, 2);
  return sol.sse;
}
