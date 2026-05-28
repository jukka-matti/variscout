/**
 * Route raw numeric values into bin levels defined by a sorted cut sequence.
 *
 * Boundary rule: cuts are inclusive lower bounds.
 *   segment 0           = v < cuts[0]
 *   segment i (1..k-1)  = cuts[i-1] <= v < cuts[i]
 *   segment cuts.length = v >= cuts[last]
 *
 * Non-finite or null/undefined values return `null` (no level assigned).
 *
 * @param values     Raw numeric values; may contain null/undefined/NaN.
 * @param cuts       Sorted cut values (ascending). Empty cuts → all values get levelNames[0].
 * @param levelNames Bin level names; length MUST equal cuts.length + 1.
 * @returns Array of bin level names (or null) parallel to `values`.
 */
export function applyCuts(
  values: ReadonlyArray<number | null | undefined>,
  cuts: number[],
  levelNames: string[]
): (string | null)[] {
  const k = cuts.length;
  const out: (string | null)[] = new Array(values.length);

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === undefined || typeof v !== 'number' || !Number.isFinite(v)) {
      out[i] = null;
      continue;
    }

    // Linear scan finds the first cut greater than v; segment index = that position.
    // For typical k <= 2 (default maxBreakpoints) this is faster than a binary search.
    let idx = k; // default: value >= cuts[last] → last segment
    for (let j = 0; j < k; j++) {
      if (v < cuts[j]) {
        idx = j;
        break;
      }
    }
    out[i] = levelNames[idx];
  }

  return out;
}
