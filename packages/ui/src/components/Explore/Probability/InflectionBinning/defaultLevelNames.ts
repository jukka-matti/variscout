/**
 * Build human-readable default level labels from a sorted cut sequence.
 *
 * Boundary rule mirrors `applyCuts` / `computeSegmentStats` (inclusive lower
 * bound):
 *   segment 0           → `<cuts[0]`
 *   segment i (1..k-1)  → `cuts[i-1]–cuts[i]`
 *   segment cuts.length → `≥cuts[last]`
 *
 * Numeric formatting goes through `formatStatistic` from `@variscout/core/i18n`
 * (locale-aware decimal separator). Default precision: 2 fraction digits — the
 * same convention used across stat displays — trailing zeros are kept to make
 * level labels visually aligned.
 *
 * @example
 *   defaultLevelNames([])               // ['all']
 *   defaultLevelNames([47])             // ['<47.00', '≥47.00']
 *   defaultLevelNames([47, 89])         // ['<47.00', '47.00–89.00', '≥89.00']
 *   defaultLevelNames([47.5, 89.123])   // ['<47.50', '47.50–89.12', '≥89.12']
 */

import { formatStatistic } from '@variscout/core/i18n';

/**
 * Generate numeric-range labels for `cuts.length + 1` bin levels.
 *
 * @param cuts Sorted cut values (ascending). Empty cuts → single level `'all'`.
 */
export function defaultLevelNames(cuts: number[]): string[] {
  if (cuts.length === 0) {
    return ['all'];
  }

  const formatted = cuts.map(cut => formatStatistic(cut));
  const labels: string[] = new Array(cuts.length + 1);

  labels[0] = `<${formatted[0]}`;
  for (let i = 1; i < cuts.length; i++) {
    labels[i] = `${formatted[i - 1]}–${formatted[i]}`;
  }
  labels[cuts.length] = `≥${formatted[cuts.length - 1]}`;

  return labels;
}
