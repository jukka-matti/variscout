import type { DataRow } from '../types';
import type { ColumnParsingProfile, ParsingInterpretation } from './types';

/**
 * Profile every column in the dataset for parsing confidence + alternatives.
 * Pure function — runs deterministically on raw cell values.
 *
 * Task 2 lands the column-enumeration + null-only error path; richer
 * detection (numeric / date / affix / id / categorical) ships in Tasks 3–6.
 */
export function profileColumns(rows: DataRow[]): ColumnParsingProfile[] {
  if (rows.length === 0) return [];
  const columnNames = collectColumnNames(rows);
  return columnNames.map(columnName => profileOneColumn(columnName, rows));
}

function collectColumnNames(rows: DataRow[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      seen.add(key);
    }
  }
  return Array.from(seen);
}

function profileOneColumn(columnName: string, rows: DataRow[]): ColumnParsingProfile {
  const values = rows
    .map(r => r[columnName])
    .filter(v => v !== null && v !== undefined && v !== '');

  if (values.length === 0) {
    return {
      columnName,
      status: 'error',
      confidence: 0,
      primary: null,
      alternatives: [],
      transformedSamples: [],
    };
  }

  // Real detection in Task 3+. For now, treat everything as text.
  const primary: ParsingInterpretation = { kind: 'text', label: 'text', detail: {} };
  return {
    columnName,
    status: 'ok',
    confidence: 100,
    primary,
    alternatives: [],
    transformedSamples: [],
  };
}
