/**
 * Defect data aggregation transform.
 *
 * Converts raw defect data into aggregated rates — defect mode's equivalent
 * of yamazumi's `computeYamazumiData()`.
 */

import type { DataRow, DataCellValue } from '../types';
import type { DefectMapping, DefectStepRollup } from './types';
import { PASS_FAIL_VALUES } from '../parser/defectKeywords';

export interface DefectTransformResult {
  /** Aggregated rows (working dataset for all charts) */
  data: DataRow[];
  /** Name of the Y column (DefectCount or DefectRate) */
  outcomeColumn: string;
  /** Available factor columns for drill-down */
  factors: string[];
  /** Name of the summed cost column (if costColumn was mapped) */
  costColumn?: string;
  /** Name of the summed duration column (if durationColumn was mapped) */
  durationColumn?: string;
  /**
   * Per-step bucketing of defects. Populated when `DefectMapping.stepRejectedAtColumn`
   * is set; `undefined` otherwise. Sorted descending by `defectCount`.
   *
   * Invariant: Σ perStep.defectCount + (rows with empty/null step) === system-level
   * DefectCount total (assuming every row either has a valid step key or is skipped).
   *
   * Legacy consumers that do not set `stepRejectedAtColumn` are unaffected — this
   * field is absent from their result.
   */
  perStep?: DefectStepRollup[];
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
 * Return true when a step-column value should be treated as "no step assignment".
 * Rows with no step assignment still count toward the system-level total but are
 * excluded from `perStep` to keep entries meaningful.
 */
function isEmptyStepValue(value: DataCellValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * Build the `perStep` rollup from a flat list of rows.
 *
 * @param rows        Raw rows to bucket (event-log: all rows; pass-fail: fail rows only)
 * @param stepCol     Column that identifies the rejecting step
 * @param costCol     Optional source column whose values are summed into `costTotal`
 * @param durationCol Optional source column whose values are summed into `durationTotal`
 * @returns Sorted (descending by defectCount) array of `DefectStepRollup`, or `undefined`
 *          when `stepCol` is not provided.
 */
function buildPerStepRollup(
  rows: DataRow[],
  stepCol: string | undefined,
  costCol: string | undefined,
  durationCol: string | undefined
): DefectStepRollup[] | undefined {
  if (!stepCol) return undefined;

  const buckets = new Map<
    string,
    { defectCount: number; costTotal: number; durationTotal: number }
  >();

  for (const row of rows) {
    const stepVal = row[stepCol];
    if (isEmptyStepValue(stepVal)) {
      // Row still counts in system total; excluded from per-step.
      continue;
    }
    const key = String(stepVal);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { defectCount: 0, costTotal: 0, durationTotal: 0 };
      buckets.set(key, bucket);
    }
    bucket.defectCount += 1;
    if (costCol) {
      const costVal = row[costCol];
      if (typeof costVal === 'number' && Number.isFinite(costVal)) {
        bucket.costTotal += costVal;
      }
    }
    if (durationCol) {
      const durVal = row[durationCol];
      if (typeof durVal === 'number' && Number.isFinite(durVal)) {
        bucket.durationTotal += durVal;
      }
    }
  }

  const result: DefectStepRollup[] = [];
  for (const [stepKey, bucket] of buckets) {
    const entry: DefectStepRollup = {
      stepKey,
      defectCount: bucket.defectCount,
      // defectRate is always undefined in V1 — see DefectStepRollup JSDoc.
      defectRate: undefined,
    };
    if (costCol !== undefined) entry.costTotal = bucket.costTotal;
    if (durationCol !== undefined) entry.durationTotal = bucket.durationTotal;
    result.push(entry);
  }

  // Sort descending by defectCount; ties preserve insertion (Map) order — stable.
  result.sort((a, b) => b.defectCount - a.defectCount);
  return result;
}

/**
 * Build the `perStep` rollup for pre-aggregated data where each row already
 * carries a `countColumn` value instead of representing a single defect event.
 */
function buildPerStepRollupPreAgg(
  rows: DataRow[],
  stepCol: string | undefined,
  countCol: string,
  costCol: string | undefined,
  durationCol: string | undefined
): DefectStepRollup[] | undefined {
  if (!stepCol) return undefined;

  const buckets = new Map<
    string,
    { defectCount: number; costTotal: number; durationTotal: number }
  >();

  for (const row of rows) {
    const stepVal = row[stepCol];
    if (isEmptyStepValue(stepVal)) {
      continue;
    }
    const key = String(stepVal);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { defectCount: 0, costTotal: 0, durationTotal: 0 };
      buckets.set(key, bucket);
    }
    // Sum the count column (not row count)
    const countVal = row[countCol];
    if (typeof countVal === 'number' && Number.isFinite(countVal)) {
      bucket.defectCount += countVal;
    }
    if (costCol) {
      const costVal = row[costCol];
      if (typeof costVal === 'number' && Number.isFinite(costVal)) {
        bucket.costTotal += costVal;
      }
    }
    if (durationCol) {
      const durVal = row[durationCol];
      if (typeof durVal === 'number' && Number.isFinite(durVal)) {
        bucket.durationTotal += durVal;
      }
    }
  }

  const result: DefectStepRollup[] = [];
  for (const [stepKey, bucket] of buckets) {
    const entry: DefectStepRollup = {
      stepKey,
      defectCount: bucket.defectCount,
      defectRate: undefined,
    };
    if (costCol !== undefined) entry.costTotal = bucket.costTotal;
    if (durationCol !== undefined) entry.durationTotal = bucket.durationTotal;
    result.push(entry);
  }

  result.sort((a, b) => b.defectCount - a.defectCount);
  return result;
}

/**
 * Transform event-log defect data into aggregated rows.
 */
function transformEventLog(rawData: DataRow[], mapping: DefectMapping): DefectTransformResult {
  const { aggregationUnit, defectTypeColumn, unitsProducedColumn, costColumn, durationColumn } =
    mapping;

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

  // Determine output column names for cost/duration
  const costOutColumn = costColumn ? 'CostTotal' : undefined;
  const durationOutColumn = durationColumn ? 'DurationTotal' : undefined;

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

    // Sum cost column if mapped
    if (costColumn && costOutColumn) {
      let costSum = 0;
      for (const row of rows) {
        const val = row[costColumn];
        if (typeof val === 'number') costSum += val;
      }
      outRow[costOutColumn] = costSum;
    }

    // Sum duration column if mapped
    if (durationColumn && durationOutColumn) {
      let durSum = 0;
      for (const row of rows) {
        const val = row[durationColumn];
        if (typeof val === 'number') durSum += val;
      }
      outRow[durationOutColumn] = durSum;
    }

    // Preserve other factor columns using mode
    for (const col of allFactors) {
      if (col === defectTypeColumn) continue; // already set
      outRow[col] = columnMode(rows, col);
    }

    data.push(outRow);
  }

  const perStep = buildPerStepRollup(
    rawData,
    mapping.stepRejectedAtColumn,
    costColumn,
    durationColumn
  );

  return {
    data,
    outcomeColumn,
    factors: allFactors,
    costColumn: costOutColumn,
    durationColumn: durationOutColumn,
    ...(perStep !== undefined ? { perStep } : {}),
  };
}

/**
 * Transform pre-aggregated defect data (pass through).
 */
function transformPreAggregated(rawData: DataRow[], mapping: DefectMapping): DefectTransformResult {
  const { aggregationUnit, countColumn, costColumn, durationColumn } = mapping;
  const outcomeColumn = countColumn!;

  const excludeSet = new Set([aggregationUnit]);
  const factors = categoricalColumns(rawData, excludeSet);

  const perStep = buildPerStepRollupPreAgg(
    rawData,
    mapping.stepRejectedAtColumn,
    outcomeColumn,
    costColumn,
    durationColumn
  );

  // For pre-aggregated data, cost/duration columns already exist in the rows.
  // Pass them through directly (no renaming needed).
  return {
    data: [...rawData],
    outcomeColumn,
    factors,
    costColumn: costColumn,
    durationColumn: durationColumn,
    ...(perStep !== undefined ? { perStep } : {}),
  };
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
  const { aggregationUnit, resultColumn, costColumn, durationColumn } = mapping;
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
  // Collect fail rows for per-step bucketing (pass-fail: only fail rows anchor to a step)
  const failRows: DataRow[] = [];

  for (const [, rows] of groups) {
    const total = rows.length;
    let failCount = 0;
    for (const row of rows) {
      const val = String(row[resultColumn] ?? '').toLowerCase();
      if (failSet.has(val)) {
        failCount++;
        failRows.push(row);
      }
    }

    const outRow: DataRow = {};
    outRow[aggregationUnit] = rows[0][aggregationUnit];
    outRow['DefectCount'] = failCount;
    outRow['DefectRate'] = total > 0 ? failCount / total : 0;
    outRow['TotalUnits'] = total;

    // Sum cost column if mapped
    if (costColumn) {
      let costSum = 0;
      for (const row of rows) {
        const val = row[costColumn];
        if (typeof val === 'number') costSum += val;
      }
      outRow['CostTotal'] = costSum;
    }

    // Sum duration column if mapped
    if (durationColumn) {
      let durSum = 0;
      for (const row of rows) {
        const val = row[durationColumn];
        if (typeof val === 'number') durSum += val;
      }
      outRow['DurationTotal'] = durSum;
    }

    // Preserve factor columns using mode
    for (const col of factors) {
      outRow[col] = columnMode(rows, col);
    }

    data.push(outRow);
  }

  // Per-step bucketing: only fail rows are anchored to a step (per spec §9.1 + task P2.1 design)
  const perStep = buildPerStepRollup(
    failRows,
    mapping.stepRejectedAtColumn,
    costColumn,
    durationColumn
  );

  return {
    data,
    outcomeColumn: 'DefectRate',
    factors,
    costColumn: costColumn ? 'CostTotal' : undefined,
    durationColumn: durationColumn ? 'DurationTotal' : undefined,
    ...(perStep !== undefined ? { perStep } : {}),
  };
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
