import { useMemo } from 'react';
import type { DataRow } from '@variscout/core';

export interface StageColumnOptions {
  /** Minimum number of unique values (default: 2) */
  minUnique?: number;
  /** Maximum number of unique values (default: 10) */
  maxUnique?: number;
  /** Column to exclude (e.g., outcome column) */
  excludeColumn?: string | null;
}

/**
 * Hook to compute available stage columns (categorical with reasonable unique values).
 *
 * Stage columns are categorical columns suitable for grouping data into stages.
 * They should have 2-10 unique values (configurable).
 *
 * @param data - Array of data rows to analyze
 * @param options - Configuration options
 * @returns Array of column names suitable for staging
 */
export function useAvailableStageColumns(
  data: DataRow[],
  options: StageColumnOptions = {}
): string[] {
  const { minUnique = 2, maxUnique = 10, excludeColumn = null } = options;

  return useMemo(() => {
    if (data.length === 0) return [];

    const candidates: string[] = [];
    const columns = Object.keys(data[0] || {});

    for (const col of columns) {
      // Skip the excluded column (typically outcome)
      if (col === excludeColumn) continue;

      // Get unique values
      const uniqueValues = new Set<string>();
      for (const row of data) {
        const val = row[col];
        if (val !== undefined && val !== null && val !== '') {
          uniqueValues.add(String(val));
        }
        // Early exit if too many unique values
        if (uniqueValues.size > maxUnique) break;
      }

      // Valid stage column: within unique value range
      if (uniqueValues.size >= minUnique && uniqueValues.size <= maxUnique) {
        candidates.push(col);
      }
    }

    return candidates;
  }, [data, minUnique, maxUnique, excludeColumn]);
}

export default useAvailableStageColumns;
