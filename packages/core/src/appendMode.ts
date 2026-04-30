import type { DataRow } from './types';

export interface MergeReport {
  added: number;
  duplicates: number;
  corrected: number;
}

export interface MergeResult {
  merged: DataRow[];
  report: MergeReport;
}

/**
 * Merge incoming rows into existing rows.
 *
 * `keyColumns` identifies the set of columns that determine row identity.
 * - Match on all keyColumns + all other column values  -> exact duplicate (dropped)
 * - Match on keyColumns, differ on other values        -> correction (incoming wins)
 * - No match on keyColumns                              -> append
 *
 * Per docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md decision #4.
 */
export function mergeRows(
  existing: DataRow[],
  incoming: DataRow[],
  keyColumns: string[]
): MergeResult {
  const keyOf = (row: DataRow): string => keyColumns.map(c => String(row[c] ?? '')).join('||');

  const existingByKey = new Map<string, { row: DataRow; index: number }>();
  existing.forEach((row, index) => existingByKey.set(keyOf(row), { row, index }));

  const merged: DataRow[] = [...existing];
  let added = 0;
  let duplicates = 0;
  let corrected = 0;

  for (const newRow of incoming) {
    const key = keyOf(newRow);
    const match = existingByKey.get(key);

    if (!match) {
      merged.push(newRow);
      added++;
      continue;
    }

    const isExactDuplicate = Object.keys(newRow).every(
      col => String(match.row[col] ?? '') === String(newRow[col] ?? '')
    );

    if (isExactDuplicate) {
      duplicates++;
    } else {
      merged[match.index] = newRow;
      corrected++;
    }
  }

  return { merged, report: { added, duplicates, corrected } };
}
