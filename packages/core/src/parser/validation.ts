/**
 * Data validation — identify rows that will be excluded from analysis
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import type { DataQualityReport, ExcludedRow, ExclusionReason, ColumnIssue } from './types';

export type { DataQualityReport, ExcludedRow, ExclusionReason, ColumnIssue };

/**
 * Validate data and identify rows that will be excluded from analysis.
 *
 * @param data - Array of data rows to validate
 * @param outcomeColumn - Column to validate for numeric values
 * @returns DataQualityReport with excluded rows and column issues
 */
export function validateData(data: DataRow[], outcomeColumn: string | null): DataQualityReport {
  const excludedRows: ExcludedRow[] = [];
  const columnIssues: ColumnIssue[] = [];

  if (!outcomeColumn || data.length === 0) {
    return {
      totalRows: data.length,
      validRows: data.length,
      excludedRows: [],
      columnIssues: [],
    };
  }

  // Check each row for issues in the outcome column
  data.forEach((row, index) => {
    const value = row[outcomeColumn];
    const reasons: ExclusionReason[] = [];

    // Check missing
    if (value === null || value === undefined || value === '') {
      reasons.push({ type: 'missing', column: outcomeColumn });
    }
    // Check non-numeric (only if not missing)
    else {
      const numericValue = toNumericValue(value);
      if (numericValue === undefined) {
        reasons.push({
          type: 'non_numeric',
          column: outcomeColumn,
          value: String(value).slice(0, 50),
        });
      }
    }

    if (reasons.length > 0) {
      excludedRows.push({ index, reasons });
    }
  });

  // Summarize issues by type
  const missingCount = excludedRows.filter(r => r.reasons.some(re => re.type === 'missing')).length;
  const nonNumericCount = excludedRows.filter(r =>
    r.reasons.some(re => re.type === 'non_numeric')
  ).length;

  if (missingCount > 0) {
    columnIssues.push({
      column: outcomeColumn,
      type: 'missing',
      count: missingCount,
      severity: 'warning',
    });
  }

  if (nonNumericCount > 0) {
    columnIssues.push({
      column: outcomeColumn,
      type: 'non_numeric',
      count: nonNumericCount,
      severity: 'warning',
    });
  }

  // Check for no variation in valid values
  const validValues = data
    .filter((_, i) => !excludedRows.some(e => e.index === i))
    .map(row => toNumericValue(row[outcomeColumn]))
    .filter((v): v is number => v !== undefined);

  if (validValues.length > 0) {
    const uniqueValid = new Set(validValues);
    if (uniqueValid.size === 1) {
      columnIssues.push({
        column: outcomeColumn,
        type: 'no_variation',
        count: validValues.length,
        severity: 'info',
      });
    }
  }

  return {
    totalRows: data.length,
    validRows: data.length - excludedRows.length,
    excludedRows,
    columnIssues,
  };
}
