/**
 * Data validation — identify rows that will be excluded from analysis
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import type {
  DataQualityReport,
  ExcludedRow,
  ExclusionReason,
  ColumnIssue,
  PerOutcomeQuality,
} from './types';

export type { DataQualityReport, ExcludedRow, ExclusionReason, ColumnIssue, PerOutcomeQuality };

/**
 * Validate data and identify rows that will be excluded from analysis.
 *
 * Accepts an array of outcome columns. A row is excluded if ANY outcome column
 * is invalid for that row. Per-column quality stats are returned in `perOutcome`.
 *
 * Single-outcome callers: wrap the column in `[outcomeColumn]` and read
 * `perOutcome[outcomeColumn]` for per-column stats.
 *
 * @param data - Array of data rows to validate
 * @param outcomeColumns - Columns to validate for numeric values. Pass `[]` when
 *   no outcome is selected yet.
 * @returns DataQualityReport with excluded rows, column issues, and per-outcome quality
 */
export function validateData(data: DataRow[], outcomeColumns: string[]): DataQualityReport {
  const cols = outcomeColumns;

  const excludedRows: ExcludedRow[] = [];
  const columnIssues: ColumnIssue[] = [];

  // Empty outcome list or empty data → pass-through
  if (cols.length === 0 || data.length === 0) {
    const perOutcome: Record<string, PerOutcomeQuality> = {};
    for (const col of cols) {
      perOutcome[col] = { validCount: data.length, invalidCount: 0, missingCount: 0 };
    }
    return {
      totalRows: data.length,
      validRows: data.length,
      excludedRows: [],
      columnIssues: [],
      perOutcome,
    };
  }

  // Per-column accumulators for quality stats
  const perOutcomeAccum: Record<
    string,
    { validCount: number; invalidCount: number; missingCount: number }
  > = {};
  for (const col of cols) {
    perOutcomeAccum[col] = { validCount: 0, invalidCount: 0, missingCount: 0 };
  }

  // Check each row for issues across all outcome columns
  data.forEach((row, index) => {
    const allReasons: ExclusionReason[] = [];

    for (const col of cols) {
      const value = row[col];
      const accum = perOutcomeAccum[col];

      if (value === null || value === undefined || value === '') {
        allReasons.push({ type: 'missing', column: col });
        accum.missingCount++;
        accum.invalidCount++;
      } else {
        const numericValue = toNumericValue(value);
        if (numericValue === undefined) {
          allReasons.push({
            type: 'non_numeric',
            column: col,
            value: String(value).slice(0, 50),
          });
          accum.invalidCount++;
        } else {
          accum.validCount++;
        }
      }
    }

    if (allReasons.length > 0) {
      excludedRows.push({ index, reasons: allReasons });
    }
  });

  // Build per-outcome quality (validCount must account for rows excluded by OTHER columns too)
  // validCount = rows where THIS column is valid, regardless of other columns.
  // (matches the plan: perOutcome tracks per-column validity, not joint validity)
  const perOutcome: Record<string, PerOutcomeQuality> = {};
  for (const col of cols) {
    perOutcome[col] = { ...perOutcomeAccum[col] };
  }

  // Existing column-issues aggregation — one ColumnIssue entry per column per issue type.
  for (const col of cols) {
    const missingCount = excludedRows.filter(r =>
      r.reasons.some(re => re.type === 'missing' && re.column === col)
    ).length;
    const nonNumericCount = excludedRows.filter(r =>
      r.reasons.some(re => re.type === 'non_numeric' && re.column === col)
    ).length;

    if (missingCount > 0) {
      columnIssues.push({
        column: col,
        type: 'missing',
        count: missingCount,
        severity: 'warning',
      });
    }

    if (nonNumericCount > 0) {
      columnIssues.push({
        column: col,
        type: 'non_numeric',
        count: nonNumericCount,
        severity: 'warning',
      });
    }

    // Check for no variation in valid values for this column
    const validValues = data
      .filter(
        (_, i) => !excludedRows.some(e => e.index === i && e.reasons.some(r => r.column === col))
      )
      .map(row => toNumericValue(row[col]))
      .filter((v): v is number => v !== undefined);

    if (validValues.length > 0) {
      const uniqueValid = new Set(validValues);
      if (uniqueValid.size === 1) {
        columnIssues.push({
          column: col,
          type: 'no_variation',
          count: validValues.length,
          severity: 'info',
        });
      }
    }
  }

  return {
    totalRows: data.length,
    validRows: data.length - excludedRows.length,
    excludedRows,
    columnIssues,
    perOutcome,
  };
}
