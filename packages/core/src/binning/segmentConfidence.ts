/**
 * Per-segment statistics for inflection-binning results.
 *
 * The Anderson-Darling p-value per segment is the normality-confidence signal
 * that justifies stratification: when each segment "looks normal" on the
 * probability plot (typically AD p > 0.1), the cuts plausibly separate
 * distinct sub-populations.
 *
 * @module binning/segmentConfidence
 */

import { andersonDarlingTest } from '../stats/andersonDarling';
import { safeDivide } from '../stats/safeMath';
import type { SegmentStats } from './types';

/** Minimum n at which Anderson-Darling p-value is reported. Below this the AD test is unreliable. */
const AD_MIN_N = 7;

/**
 * Compute per-segment stats for a sorted-ascending value array and a sorted cut array.
 *
 * Boundary rule mirrors `applyCuts`: cuts are inclusive lower bounds.
 *   segment 0           = v < cuts[0]
 *   segment i (1..k-1)  = cuts[i-1] <= v < cuts[i]
 *   segment cuts.length = v >= cuts[last]
 *
 * @param sortedValues Values sorted ascending. Empty input → single empty segment.
 * @param cuts         Sorted cut values (ascending).
 * @returns Array of length cuts.length + 1 with stats per segment.
 */
export function computeSegmentStats(sortedValues: number[], cuts: number[]): SegmentStats[] {
  const totalN = sortedValues.length;
  const segmentCount = cuts.length + 1;
  const segments: SegmentStats[] = [];

  // Pre-compute boundary indices so each segment is O(n / k) instead of repeated linear scans.
  // boundaryIdx[s] = first index in sortedValues belonging to segment s.
  const boundaryIdx: number[] = new Array(segmentCount + 1);
  boundaryIdx[0] = 0;
  for (let s = 0; s < cuts.length; s++) {
    // First index where sortedValues[i] >= cuts[s]
    let i = boundaryIdx[s];
    while (i < totalN && sortedValues[i] < cuts[s]) i++;
    boundaryIdx[s + 1] = i;
  }
  boundaryIdx[segmentCount] = totalN;

  for (let s = 0; s < segmentCount; s++) {
    const start = boundaryIdx[s];
    const end = boundaryIdx[s + 1];
    const n = end - start;

    const lower = s === 0 ? null : cuts[s - 1];
    const upper = s === cuts.length ? null : cuts[s];

    let mean: number | undefined;
    let adPValue: number | undefined;

    if (n > 0) {
      let sum = 0;
      for (let i = start; i < end; i++) sum += sortedValues[i];
      const meanCandidate = safeDivide(sum, n);
      mean = meanCandidate;
    }

    if (n >= AD_MIN_N) {
      const slice = sortedValues.slice(start, end);
      const ad = andersonDarlingTest(slice);
      adPValue = Number.isFinite(ad.pValue) ? ad.pValue : undefined;
    }

    const percentShare = totalN > 0 ? (safeDivide(n, totalN) ?? 0) * 100 : 0;

    segments.push({
      range: { lower, upper },
      n,
      percentShare,
      mean,
      adPValue,
    });
  }

  return segments;
}
