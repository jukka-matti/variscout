/**
 * Defect data aggregation transform.
 *
 * Converts raw defect data into aggregated rates — defect mode's equivalent
 * of yamazumi's `computeYamazumiData()`.
 */

import type { DataRow, DataCellValue } from '../types';
import type { DefectMapping } from './types';
import { PASS_FAIL_VALUES } from '../parser/defectKeywords';

export interface DefectTransformResult {
  /** Aggregated rows (working dataset for all charts) */
  data: DataRow[];
  /** Name of the Y column (DefectCount or DefectRate) */
  outcomeColumn: string;
  /** Available factor columns for drill-down */
  factors: string[];
}

/**
 * Compute the statistical mode (most frequent value) for a column across rows.
 * Returns null if no values exist.
 */
function columnMode(rows: DataRow[], column: string): DataCellValue {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const val = row[column];
    const key = String(val ?? '');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  if (best === undefined) return null;
  // Try to return the original typed value from the first matching row
  for (const row of rows) {
    if (String(row[column] ?? '') === best) return row[column];
  }
  return best;
}

/**
 * Determine whether a column is numeric across the provided rows.
 */
function isNumericColumn(rows: DataRow[], column: string): boolean {
  let numericCount = 0;
  let total = 0;
  for (const row of rows) {
    const val = row[column];
    if (val == null) continue;
    total++;
    if (typeof val === 'number') numericCount++;
  }
  // Consider numeric if majority of non-null values are numbers
  return total > 0 && numericCount / total > 0.5;
}

/**
 * Build a grouping key from one or more column values in a row.
 */
function groupKey(row: DataRow, columns: string[]): string {
  return columns.map(c => String(row[c] ?? '')).join('\x00');
}

/**
 * Identify all categorical (non-numeric) columns in the data, excluding specified columns.
 */
function categoricalColumns(rows: DataRow[], exclude: Set<string>): string[] {
  if (rows.length === 0) return [];
  const allCols = Object.keys(rows[0]);
  return allCols.filter(c => !exclude.has(c) && !isNumericColumn(rows, c));
}

/**
 * Transform event-log defect data into aggregated rows.
 */
function transformEventLog(rawData: DataRow[], mapping: DefectMapping): DefectTransformResult {
  const { aggregationUnit, defectTypeColumn, unitsProducedColumn } = mapping;

  // Grouping columns: aggregationUnit + defectTypeColumn (if present)
  const groupCols = [aggregationUnit];
  if (defectTypeColumn) groupCols.push(defectTypeColumn);

  // Identify factor columns (all categorical except aggregationUnit)
  const excludeSet = new Set([aggregationUnit]);
  const allFactors = categoricalColumns(rawData, excludeSet);

  // Group rows
  const groups = new Map<string, DataRow[]>();
  for (const row of rawData) {
    const key = groupKey(row, groupCols);
    const arr = groups.get(key);
    if (arr) arr.push(row);
    else groups.set(key, [row]);
  }

  // Build units-produced lookup (by aggregation unit) if column is provided
  let unitsLookup: Map<string, number> | undefined;
  if (unitsProducedColumn) {
    unitsLookup = new Map<string, number>();
    for (const row of rawData) {
      const unitKey = String(row[aggregationUnit] ?? '');
      const val = row[unitsProducedColumn];
      if (typeof val === 'number' && !unitsLookup.has(unitKey)) {
        unitsLookup.set(unitKey, val);
      }
    }
  }

  const hasRate = !!unitsProducedColumn;
  const outcomeColumn = hasRate ? 'DefectRate' : 'DefectCount';

  const data: DataRow[] = [];
  for (const [, rows] of groups) {
    const count = rows.length;
    const outRow: DataRow = {};

    // Copy grouping columns from first row
    outRow[aggregationUnit] = rows[0][aggregationUnit];
    if (defectTypeColumn) {
      outRow[defectTypeColumn] = rows[0][defectTypeColumn];
    }

    // Defect count
    outRow['DefectCount'] = count;

    // Defect rate if units produced available
    if (hasRate && unitsLookup) {
      const unitKey = String(rows[0][aggregationUnit] ?? '');
      const units = unitsLookup.get(unitKey);
      outRow['DefectRate'] = units && units > 0 ? count / units : count;
    }

    // Preserve other factor columns using mode
    for (const col of allFactors) {
      if (col === defectTypeColumn) continue; // already set
      outRow[col] = columnMode(rows, col);
    }

    data.push(outRow);
  }

  return { data, outcomeColumn, factors: allFactors };
}

/**
 * Transform pre-aggregated defect data (pass through).
 */
function transformPreAggregated(rawData: DataRow[], mapping: DefectMapping): DefectTransformResult {
  const { aggregationUnit, countColumn } = mapping;
  const outcomeColumn = countColumn!;

  const excludeSet = new Set([aggregationUnit]);
  const factors = categoricalColumns(rawData, excludeSet);

  return { data: [...rawData], outcomeColumn, factors };
}

/**
 * Build the set of fail values from PASS_FAIL_VALUES (case-insensitive).
 */
function buildFailSet(): Set<string> {
  const set = new Set<string>();
  for (const [, fail] of PASS_FAIL_VALUES) {
    set.add(fail.toLowerCase());
  }
  return set;
}

/**
 * Transform pass/fail defect data into aggregated rows.
 */
function transformPassFail(rawData: DataRow[], mapping: DefectMapping): DefectTransformResult {
  const { aggregationUnit, resultColumn } = mapping;
  if (!resultColumn) {
    return { data: [], outcomeColumn: 'DefectRate', factors: [] };
  }

  const failSet = buildFailSet();

  // Identify factor columns (categorical, excluding aggregationUnit and resultColumn)
  const excludeSet = new Set([aggregationUnit, resultColumn]);
  const factors = categoricalColumns(rawData, excludeSet);

  // Group by aggregation unit
  const groups = new Map<string, DataRow[]>();
  for (const row of rawData) {
    const key = String(row[aggregationUnit] ?? '');
    const arr = groups.get(key);
    if (arr) arr.push(row);
    else groups.set(key, [row]);
  }

  const data: DataRow[] = [];
  for (const [, rows] of groups) {
    const total = rows.length;
    let failCount = 0;
    for (const row of rows) {
      const val = String(row[resultColumn] ?? '').toLowerCase();
      if (failSet.has(val)) failCount++;
    }

    const outRow: DataRow = {};
    outRow[aggregationUnit] = rows[0][aggregationUnit];
    outRow['DefectCount'] = failCount;
    outRow['DefectRate'] = total > 0 ? failCount / total : 0;
    outRow['TotalUnits'] = total;

    // Preserve factor columns using mode
    for (const col of factors) {
      outRow[col] = columnMode(rows, col);
    }

    data.push(outRow);
  }

  return { data, outcomeColumn: 'DefectRate', factors };
}

/**
 * Convert raw defect data into aggregated defect rates.
 *
 * This is the mode transform for defect analysis — defect mode's equivalent
 * of yamazumi's `computeYamazumiData()`.
 *
 * @param rawData - Raw data rows (possibly filtered)
 * @param mapping - Defect column mapping configuration
 * @returns Aggregated data with outcome column and available factors
 */
export function computeDefectRates(
  rawData: DataRow[],
  mapping: DefectMapping
): DefectTransformResult {
  if (rawData.length === 0) {
    return { data: [], outcomeColumn: 'DefectCount', factors: [] };
  }

  switch (mapping.dataShape) {
    case 'event-log':
      return transformEventLog(rawData, mapping);
    case 'pre-aggregated':
      return transformPreAggregated(rawData, mapping);
    case 'pass-fail':
      return transformPassFail(rawData, mapping);
    default:
      return { data: [], outcomeColumn: 'DefectCount', factors: [] };
  }
}
