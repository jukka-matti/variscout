/**
 * Quartile binning for continuous columns.
 *
 * Uses the same inclusive-upper-bound boundary rule at the .25/.5/.75 quantiles
 * as stats/interactionScreening.ts's private bins, with UI-facing annotated
 * labels. Used by `computeMainEffects` to pre-bin continuous X's before
 * grouping: otherwise each near-unique numeric value stringifies into its own
 * singleton group, which inflates η² toward 1 and collapses the within-group
 * degrees of freedom (N−k → 0). Binning is a correctness requirement of the
 * ranking, not display polish.
 *
 * @module binning/quantileCuts
 */

import * as d3 from 'd3-array';

/** Result of quartile-binning a numeric column. */
export interface QuartileBinning {
  /**
   * Bin label for each input value, parallel to `values`. `undefined` entries
   * mark non-finite inputs that could not be placed in a bin.
   */
  labels: (string | undefined)[];
  /** Distinct bin labels in Q1→Q4 order (collapsed when quantiles coincide). */
  levelNames: string[];
}

/**
 * Bin numeric values into readable quartile levels (Q1–Q4).
 *
 * Boundary rule mirrors the `interactionScreening` precedent: a value lands in
 * the first bin whose upper cut it does not exceed (`v <= q1 → Q1`, etc.), so
 * cuts are inclusive upper bounds and Q4 is the open-topped tail.
 *
 * Labels read "Q1 (≤x)", "Q2 (x–y)", "Q3 (y–z)", "Q4 (>z)" using the resolved
 * quantile values, so a binned chip can show what each level covers. When fewer
 * than four points are present (or the quantiles coincide on a near-constant
 * column) bins collapse and `levelNames` reports only the labels actually used.
 *
 * @param values Raw numeric values; non-finite entries map to `undefined`.
 * @returns Per-value labels plus the distinct level names in quartile order.
 */
export function quartileBin(values: ReadonlyArray<number>): QuartileBinning {
  const finite = values.filter((v): v is number => Number.isFinite(v));

  // Too few points for meaningful quartiles — emit a single bin.
  if (finite.length < 4) {
    const labels = values.map(v => (Number.isFinite(v) ? 'All' : undefined));
    return { labels, levelNames: finite.length > 0 ? ['All'] : [] };
  }

  const sorted = [...finite].sort((a, b) => a - b);
  const q1 = d3.quantile(sorted, 0.25)!;
  const q2 = d3.quantile(sorted, 0.5)!;
  const q3 = d3.quantile(sorted, 0.75)!;

  // Readable, value-annotated labels following the interactionScreening style.
  const fmt = (n: number): string => formatCut(n);
  const labelQ1 = `Q1 (≤${fmt(q1)})`;
  const labelQ2 = `Q2 (${fmt(q1)}–${fmt(q2)})`;
  const labelQ3 = `Q3 (${fmt(q2)}–${fmt(q3)})`;
  const labelQ4 = `Q4 (>${fmt(q3)})`;

  const labels: (string | undefined)[] = values.map(v => {
    if (!Number.isFinite(v)) return undefined;
    if (v <= q1) return labelQ1;
    if (v <= q2) return labelQ2;
    if (v <= q3) return labelQ3;
    return labelQ4;
  });

  // Preserve Q1→Q4 order, dropping any bin that ended up empty (coincident
  // quantiles on a near-constant column collapse adjacent bins).
  const usedLabels = new Set(labels.filter((l): l is string => l !== undefined));
  const levelNames: string[] = [];
  for (const lbl of [labelQ1, labelQ2, labelQ3, labelQ4]) {
    if (usedLabels.has(lbl)) {
      levelNames.push(lbl);
    }
  }

  return { labels, levelNames };
}

/**
 * Format a cut value for a bin label without `.toFixed` on a stat output:
 * trims to at most 2 decimals and drops trailing zeros.
 */
function formatCut(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Round to 2 decimals deterministically, then strip trailing zeros.
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}
