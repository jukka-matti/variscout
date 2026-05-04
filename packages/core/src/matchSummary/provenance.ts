import type { SnapshotProvenance } from '../evidenceSources';
import type { DataRow } from '../types';

export function createSnapshotProvenance(
  origin: string,
  rows: DataRow[],
  timeColumn?: string
): SnapshotProvenance {
  const importedAt = new Date().toISOString();
  if (!timeColumn || rows.length === 0) {
    return { origin, importedAt };
  }
  const timestamps: number[] = [];
  for (const row of rows) {
    const value = row[timeColumn];
    if (value === undefined || value === null) continue;
    const ms = new Date(String(value)).getTime();
    if (Number.isFinite(ms)) timestamps.push(ms);
  }
  if (timestamps.length === 0) {
    return { origin, importedAt };
  }
  const startISO = new Date(Math.min(...timestamps)).toISOString();
  const endISO = new Date(Math.max(...timestamps)).toISOString();
  return { origin, importedAt, rowTimestampRange: { startISO, endISO } };
}
