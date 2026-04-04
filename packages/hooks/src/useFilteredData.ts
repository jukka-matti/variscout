/**
 * useFilteredData — Derived hook: applies filters to rawData from projectStore.
 *
 * Returns filtered DataRow[] and a reverse index map (filteredIndex → rawIndex).
 * Replaces the inline filtering logic from useDataState.
 */

import { useMemo } from 'react';
import type { DataRow } from '@variscout/core';
import { useProjectStore } from '@variscout/stores';

export interface FilteredDataResult {
  filteredData: DataRow[];
  /** Map from filteredData index to rawData index */
  filteredIndexMap: Map<number, number>;
}

export function useFilteredData(): FilteredDataResult {
  const rawData = useProjectStore(s => s.rawData);
  const filters = useProjectStore(s => s.filters);

  return useMemo(() => {
    const filtered: DataRow[] = [];
    const indexMap = new Map<number, number>();

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const filterEntries = Object.entries(filters);
      const pass = filterEntries.every(([col, vals]) => {
        if (!vals || vals.length === 0) return true;
        const cellValue = row[col];
        return (vals as (string | number)[]).includes(cellValue as string | number);
      });
      if (pass) {
        indexMap.set(filtered.length, i);
        filtered.push(row);
      }
    }

    return { filteredData: filtered, filteredIndexMap: indexMap };
  }, [rawData, filters]);
}
