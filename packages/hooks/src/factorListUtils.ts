/**
 * factorListUtils — Pure helpers for building factor lists that include
 * derived categorical columns alongside raw dataset columns.
 *
 * Used by:
 * - useDashboardChartsBase: factor picker (Boxplot + Pareto)
 * - useBoxplotData / useProbabilityPlotData: row augmentation for derived columns
 *
 * @see categoricalValuesByColumn — Record<colName, (string|null)[]> keyed by
 * derived column name (e.g. `Order_Date.day-of-week`, `Reactor_temp_bin`).
 * Values are parallel to rawData rows (index i → row i).
 */

import type { DataRow } from '@variscout/core';

/**
 * Builds the merged factor list for chart pickers.
 *
 * Order: raw factors first (existing behavior preserved), then derived keys
 * from `categoricalValuesByColumn` sorted by column name. Deduplication by
 * name: if a derived key collides with a raw factor, the raw entry wins
 * (no double-entry, raw ordering kept).
 *
 * When `categoricalValuesByColumn` is absent or empty the result equals
 * `rawFactors` exactly — backward compat.
 *
 * @param rawFactors - Current project factor columns (string[])
 * @param categoricalValuesByColumn - Derived categorical channel
 * @returns Merged, deduplicated factor list
 */
export function buildFactorList(
  rawFactors: string[],
  categoricalValuesByColumn?: Record<string, (string | null)[]>
): string[] {
  if (!categoricalValuesByColumn || Object.keys(categoricalValuesByColumn).length === 0) {
    return rawFactors;
  }

  const seen = new Set<string>(rawFactors);
  const derivedKeys = Object.keys(categoricalValuesByColumn)
    .filter(k => !seen.has(k))
    .sort();

  return [...rawFactors, ...derivedKeys];
}

/**
 * Augments each data row with derived column values from
 * `categoricalValuesByColumn`, keyed by original row index.
 *
 * Returns the same array reference when `categoricalValuesByColumn` is absent
 * or empty — no object allocation on the hot path.
 *
 * Important: `rows` MUST be the original (pre-lens or pre-filter) rows so
 * that `categoricalValuesByColumn[col][i]` aligns with `rows[i]`.
 * Callers that pass a lens-sliced sub-array must also slice the derived
 * columns — this function takes the original index as an explicit param so
 * each consumer can implement the slice however it needs.
 *
 * For the common case where the caller already has a lensed slice:
 * use `augmentLensedRowsWithDerived` instead.
 *
 * @param rows - Original (un-sliced) data rows
 * @param categoricalValuesByColumn - Derived categorical channel
 * @returns Augmented rows (new objects per row with derived keys merged in)
 */
export function augmentRowsWithDerived(
  rows: DataRow[],
  categoricalValuesByColumn?: Record<string, (string | null)[]>
): DataRow[] {
  if (!categoricalValuesByColumn || Object.keys(categoricalValuesByColumn).length === 0) {
    return rows;
  }

  const derivedEntries = Object.entries(categoricalValuesByColumn);
  return rows.map((row, i) => {
    const extra: Record<string, string | null> = {};
    for (const [col, vals] of derivedEntries) {
      const val = vals[i];
      // Only inject if the column is NOT already present in the raw row
      // (raw values take precedence to avoid silent overwrite of real data)
      if (!(col in row)) {
        extra[col] = val !== undefined ? val : null;
      }
    }
    if (Object.keys(extra).length === 0) return row;
    return { ...row, ...extra } as DataRow;
  });
}

/**
 * Augments a lensed (sliced) sub-array of rows with derived column values,
 * using `startIdx` to align against the parallel `categoricalValuesByColumn`
 * arrays.
 *
 * The lens may select a window `[start, end)` from the original rows.
 * `categoricalValuesByColumn[col][startIdx + i]` gives the derived value
 * for `lensedRows[i]`.
 *
 * @param lensedRows - Lensed (sliced) data rows
 * @param categoricalValuesByColumn - Derived categorical channel (parallel to original rows)
 * @param startIdx - Start index of the lens window in the original row array
 * @returns Augmented lensed rows
 */
export function augmentLensedRowsWithDerived(
  lensedRows: DataRow[],
  categoricalValuesByColumn?: Record<string, (string | null)[]>,
  startIdx: number = 0
): DataRow[] {
  if (!categoricalValuesByColumn || Object.keys(categoricalValuesByColumn).length === 0) {
    return lensedRows;
  }

  const derivedEntries = Object.entries(categoricalValuesByColumn);
  return lensedRows.map((row, i) => {
    const extra: Record<string, string | null> = {};
    const originalIdx = startIdx + i;
    for (const [col, vals] of derivedEntries) {
      if (!(col in row)) {
        const val = vals[originalIdx];
        extra[col] = val !== undefined ? val : null;
      }
    }
    if (Object.keys(extra).length === 0) return row;
    return { ...row, ...extra } as DataRow;
  });
}
