/**
 * Drill utilities — data filtering for drill-down navigation
 */

import type { DataRow } from '../types';

/**
 * Filter data by a set of filters
 * Utility function for applying drill filters to raw data
 *
 * @param data - Raw data array
 * @param filters - Filters as Record<factor, values[]>
 * @returns Filtered data array
 */
export function applyFilters(
  data: DataRow[],
  filters: Record<string, (string | number)[]>
): DataRow[] {
  return data.filter(row => {
    return Object.entries(filters).every(([col, values]) => {
      if (!values || values.length === 0) return true;
      const cellValue = row[col];
      return values.includes(cellValue as string | number);
    });
  });
}
