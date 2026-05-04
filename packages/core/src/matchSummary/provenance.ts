import type { SnapshotProvenance } from '../evidenceSources';
import type { DataRow } from '../types';
import { parseTimeValue } from '../time';

export function createSnapshotProvenance(
  origin: string,
  rows: DataRow[],
  timeColumn?: string
): SnapshotProvenance {
  const importedAt = new Date().toISOString();
  if (!timeColumn || rows.length === 0) {
    return { origin, importedAt };
  }
  let min = Infinity;
  let max = -Infinity;
  let hasAny = false;
  for (const row of rows) {
    const value = row[timeColumn];
    if (value === undefined || value === null) continue;
    const parsed = parseTimeValue(value);
    if (parsed === null) continue;
    const ms = parsed.getTime();
    if (ms < min) min = ms;
    if (ms > max) max = ms;
    hasAny = true;
  }
  if (!hasAny) {
    return { origin, importedAt };
  }
  const startISO = new Date(min).toISOString();
  const endISO = new Date(max).toISOString();
  return { origin, importedAt, rowTimestampRange: { startISO, endISO } };
}
