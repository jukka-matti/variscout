import type { ColumnParsingProfile } from '../parser/types';

export interface DetectTimeColumnsResult {
  count: number;
  columns: string[];
}

/**
 * Detect date-typed columns from parsing profiles for the time-as-factors workflow.
 *
 * Filter rule: `primary.kind === 'date'` AND `status === 'ok'`. Profiles with
 * `primary` null or any other status are excluded. Input order is preserved.
 *
 * Returns `null` when 0 date columns match — consumers should check before
 * surfacing the system-hint banner.
 */
export function detectTimeColumns(
  profiles: ColumnParsingProfile[]
): DetectTimeColumnsResult | null {
  const columns = profiles
    .filter(p => p.primary?.kind === 'date' && p.status === 'ok')
    .map(p => p.columnName);
  if (columns.length === 0) return null;
  return { count: columns.length, columns };
}
