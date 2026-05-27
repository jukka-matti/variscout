import type { DataRow } from '../types';
import type { ColumnParsingProfile } from './types';

/**
 * Profile every column in the dataset for parsing confidence + alternatives.
 * Pure function — runs deterministically on raw cell values.
 */
export function profileColumns(rows: DataRow[]): ColumnParsingProfile[] {
  if (rows.length === 0) return [];
  throw new Error('profileColumns not yet implemented');
}
