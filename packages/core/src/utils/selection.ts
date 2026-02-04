/**
 * Selection utilities for Minitab-style brushing
 *
 * Provides functions to create new factor columns from point selections,
 * enabling users to:
 * 1. Brush points in IChart
 * 2. Name the selection as a custom factor
 * 3. Auto-filter to show only selected points
 * 4. Use the factor for future drill-down analysis
 */

import type { DataRow } from '../types';

/**
 * Create a new factor column from selected points
 *
 * Adds a new column to the dataset where:
 * - Selected points get the factor name as their value
 * - Unselected points get "Other" as their value
 *
 * @param data - Original dataset
 * @param selectedIndices - Set of row indices to mark as selected (0-based)
 * @param factorName - User-provided name for the new factor
 * @returns New dataset with added factor column
 *
 * @example
 * ```typescript
 * // User brushes points [5, 8, 12] in IChart
 * // User names factor: "High Temperature Events"
 * const updatedData = createFactorFromSelection(
 *   rawData,
 *   new Set([5, 8, 12]),
 *   "High Temperature Events"
 * );
 *
 * // Result: New column "High Temperature Events"
 * // Row 5: { ...existing, "High Temperature Events": "High Temperature Events" }
 * // Row 0: { ...existing, "High Temperature Events": "Other" }
 * ```
 */
export function createFactorFromSelection(
  data: DataRow[],
  selectedIndices: Set<number>,
  factorName: string
): DataRow[] {
  return data.map((row, index) => ({
    ...row,
    [factorName]: selectedIndices.has(index) ? factorName : 'Other',
  }));
}

/**
 * Check if a factor name is valid (not already a column name)
 *
 * @param factorName - Proposed factor name
 * @param existingColumns - Array of existing column names
 * @returns true if the name is valid (unique)
 */
export function isValidFactorName(factorName: string, existingColumns: string[]): boolean {
  const trimmed = factorName.trim();
  if (!trimmed) return false;
  return !existingColumns.includes(trimmed);
}

/**
 * Get all column names from a dataset
 *
 * @param data - Dataset to extract column names from
 * @returns Array of unique column names
 */
export function getColumnNames(data: DataRow[]): string[] {
  if (data.length === 0) return [];
  const allKeys = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });
  return Array.from(allKeys);
}
