import { useMemo } from 'react';
import type { DataRow } from '@variscout/core';

/**
 * Options for column classification
 */
export interface ColumnClassificationOptions {
  /** Maximum unique values for a column to be considered categorical (default: 10) */
  maxCategoricalUnique?: number;
  /** Column to exclude from classification (typically the outcome column) */
  excludeColumn?: string | null;
}

/**
 * Result of column classification
 */
export interface ColumnClassification {
  /** Columns containing numeric values */
  numeric: string[];
  /** Columns containing categorical (string) values with limited unique values */
  categorical: string[];
}

/**
 * Classifies data columns as numeric or categorical
 *
 * @param data - Array of data rows
 * @param options - Classification options
 * @returns Object with numeric and categorical column arrays
 *
 * @example
 * ```tsx
 * const { numeric, categorical } = useColumnClassification(data, {
 *   excludeColumn: outcome,
 *   maxCategoricalUnique: 10,
 * });
 * ```
 */
export function useColumnClassification(
  data: DataRow[],
  options: ColumnClassificationOptions = {}
): ColumnClassification {
  const { maxCategoricalUnique = 10, excludeColumn = null } = options;

  return useMemo(() => {
    if (data.length === 0) {
      return { numeric: [], categorical: [] };
    }

    const row = data[0];
    const numeric: string[] = [];
    const categorical: string[] = [];

    Object.keys(row).forEach(key => {
      // Skip the excluded column
      if (key === excludeColumn) return;

      if (typeof row[key] === 'number') {
        numeric.push(key);
      } else if (typeof row[key] === 'string') {
        // Check if categorical (limited unique values)
        const uniqueValues = new Set(data.map(r => r[key]));
        if (uniqueValues.size <= maxCategoricalUnique) {
          categorical.push(key);
        }
      }
    });

    return { numeric, categorical };
  }, [data, excludeColumn, maxCategoricalUnique]);
}
