/**
 * Stack (unpivot) columns — transforms wide-form data to long-form
 *
 * Takes multiple columns with the same type of measurement and "stacks" them
 * into two new columns: a label column (original column names) and a measure
 * column (the values). Non-stacked columns are duplicated across all rows.
 *
 * @example
 * Input (wide):  Year | Germany | Sweden
 *                1995 | 21376   | 19925
 *
 * Output (long): Year | Country | Arrivals
 *                1995 | Germany | 21376
 *                1995 | Sweden  | 19925
 */

import type { DataRow } from '../types';

/**
 * Configuration for the stack operation.
 */
export interface StackConfig {
  /** Column names to pivot into rows (e.g., 83 country names) */
  columnsToStack: string[];
  /** Name for the new value column (e.g., "Arrivals") */
  measureName: string;
  /** Name for the new label column (e.g., "Country") */
  labelName: string;
}

/**
 * Result of a stack operation.
 */
export interface StackResult {
  /** Stacked rows */
  data: DataRow[];
  /** New column list (kept columns + labelName + measureName) */
  columns: string[];
  /** Total row count */
  rowCount: number;
  /** Unique values in the label column (original column names) */
  labelValues: string[];
  /** Columns that were not stacked (preserved as-is) */
  keptColumns: string[];
}

/**
 * Stack (unpivot) selected columns into label + measure columns.
 *
 * For each input row, produces one output row per stacked column.
 * Non-stacked columns are duplicated across all output rows.
 * Null/undefined values are preserved (not skipped).
 *
 * @param data - Input data rows (wide-form)
 * @param config - Stack configuration
 * @returns StackResult with long-form data
 * @throws Error if columnsToStack is empty or names conflict
 */
export function stackColumns(data: DataRow[], config: StackConfig): StackResult {
  const { columnsToStack, measureName, labelName } = config;

  if (columnsToStack.length === 0) {
    throw new Error('At least one column must be selected for stacking');
  }

  if (!measureName.trim()) {
    throw new Error('Measure name is required');
  }

  if (!labelName.trim()) {
    throw new Error('Label name is required');
  }

  if (data.length === 0) {
    return {
      data: [],
      columns: [labelName, measureName],
      rowCount: 0,
      labelValues: columnsToStack,
      keptColumns: [],
    };
  }

  // Determine which columns to keep (not stacked)
  const stackSet = new Set(columnsToStack);
  const allColumns = Object.keys(data[0]);
  const keptColumns = allColumns.filter(col => !stackSet.has(col));

  // Check for name conflicts
  const outputColumns = [...keptColumns, labelName, measureName];
  const outputSet = new Set<string>();
  for (const col of outputColumns) {
    if (outputSet.has(col)) {
      throw new Error(
        `Column name conflict: "${col}" already exists. Choose a different name for the ${col === labelName ? 'label' : 'measure'} column.`
      );
    }
    outputSet.add(col);
  }

  // Pre-allocate output array for performance
  const outputLength = data.length * columnsToStack.length;
  const output: DataRow[] = new Array(outputLength);

  let idx = 0;
  for (const row of data) {
    // Build the kept-columns portion once per input row
    const keptValues: DataRow = {};
    for (const col of keptColumns) {
      keptValues[col] = row[col];
    }

    for (const stackCol of columnsToStack) {
      const newRow: DataRow = { ...keptValues };
      newRow[labelName] = stackCol;
      newRow[measureName] = row[stackCol] ?? null;
      output[idx++] = newRow;
    }
  }

  return {
    data: output,
    columns: outputColumns,
    rowCount: output.length,
    labelValues: columnsToStack,
    keptColumns,
  };
}

/**
 * Preview the result of a stack operation without performing it.
 * Returns metadata about what the stack would produce.
 */
export function previewStack(
  data: DataRow[],
  config: StackConfig
): { outputRowCount: number; outputColumnCount: number; keptColumns: string[] } {
  const stackSet = new Set(config.columnsToStack);
  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];
  const keptColumns = allColumns.filter(col => !stackSet.has(col));

  return {
    outputRowCount: data.length * config.columnsToStack.length,
    outputColumnCount: keptColumns.length + 2, // +2 for label and measure
    keptColumns,
  };
}
