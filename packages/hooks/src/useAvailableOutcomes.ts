import { useMemo } from 'react';
import type { DataRow } from '@variscout/core';

/**
 * Hook to compute available numeric outcome columns from data.
 *
 * @param data - Array of data rows to analyze
 * @returns Array of column names that contain numeric values
 */
export function useAvailableOutcomes(data: DataRow[]): string[] {
  return useMemo(() => {
    if (data.length === 0) return [];
    const row = data[0];
    return Object.keys(row).filter(key => typeof row[key] === 'number');
  }, [data]);
}

export default useAvailableOutcomes;
