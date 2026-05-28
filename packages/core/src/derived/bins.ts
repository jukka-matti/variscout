import type { BinnedFactorBinding } from '../binning';
import { applyCuts } from '../binning';
import { toNumericValue } from '../types';

/**
 * Compute the derived bin-label column for a given binding. For each row:
 *  - Extract `row[binding.sourceColumn]` via `toNumericValue()` (returns
 *    `undefined` for null/missing/non-numeric values).
 *  - Find the bin segment via `applyCuts` on the numeric value.
 *  - Return the corresponding `binding.levelNames[idx]`, or `null` for
 *    unparseable rows.
 *
 * Pure function: same `(rows, binding)` → same output. Never throws.
 * Returned array length === rows.length (one entry per row).
 *
 * @param rows    - Dataset rows (unknown cell types)
 * @param binding - BinnedFactorBinding specifying source column + cuts + level names
 * @returns       Array of bin level names (or null) parallel to `rows`
 */
export function computeBinnedFactorColumn(
  rows: ReadonlyArray<Record<string, unknown>>,
  binding: BinnedFactorBinding
): (string | null)[] {
  const numeric: (number | null)[] = rows.map(row => {
    const raw = row[binding.sourceColumn];
    // toNumericValue handles null, undefined, non-numeric strings, booleans.
    // NaN from a numeric-typed NaN is not finite — applyCuts will null it.
    const n = toNumericValue(raw as Parameters<typeof toNumericValue>[0]);
    return n !== undefined ? n : null;
  });

  return applyCuts(numeric, binding.cuts, binding.levelNames);
}
