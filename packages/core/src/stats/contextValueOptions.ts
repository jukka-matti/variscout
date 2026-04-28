import type { DataRow } from '../types';

const MAX_DISTINCT_VALUES = 50;

/**
 * Enumerate the distinct values present in a column across rows. Excludes
 * null, undefined, and empty-string values. Sorted lexicographically. Caps
 * cardinality at 50 — beyond that, the dimension is being abused as an
 * identifier rather than a context filter and the analyst should split into
 * multiple hubs.
 *
 * Used by `useProductionLineGlanceData` to populate the filter strip's
 * per-column chip options.
 */
export function distinctContextValues(rows: readonly DataRow[], column: string): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const raw = row[column];
    if (raw === null || raw === undefined) continue;
    const str = String(raw);
    if (str === '') continue;
    seen.add(str);
  }
  const sorted = [...seen].sort();
  return sorted.slice(0, MAX_DISTINCT_VALUES);
}
