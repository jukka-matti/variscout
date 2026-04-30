/**
 * useFilteredData — Derived hook: applies filters to rawData from projectStore.
 *
 * Returns filtered DataRow[] and a reverse index map (filteredIndex → rawIndex).
 * Replaces the inline filtering logic from useDataState.
 *
 * Multi-level SCOUT V1 — accepts an optional `window` arg. When supplied
 * together with a `timeColumn` on the project store, rows whose time value
 * falls outside the window are dropped AFTER filter-pass. The index map
 * continues to satisfy `filteredData[i] === rawData[filteredIndexMap.get(i)!]`.
 */

import { useMemo } from 'react';
import type { DataRow, TimelineWindow } from '@variscout/core';
import { parseTimeValue } from '@variscout/core/time';
import { useProjectStore } from '@variscout/stores';

export interface FilteredDataResult {
  filteredData: DataRow[];
  /** Map from filteredData index to rawData index */
  filteredIndexMap: Map<number, number>;
}

export interface UseFilteredDataArgs {
  /** Optional timeline window. Applied alongside column filters using projectStore.timeColumn. */
  window?: TimelineWindow;
}

/** Returns true if rawData index `i` should pass the window. */
function makeWindowPredicate(
  rawData: DataRow[],
  timeColumn: string | null,
  window: TimelineWindow | undefined
): ((i: number) => boolean) | null {
  if (!window || !timeColumn) return null;
  if (rawData.length === 0) return null;
  // If the time column is missing from the data shape, applyWindow returns []
  // (see applyWindow.ts). Mirror that behavior here so callers can't show
  // stale rows when the FRAME-detected column has been dropped.
  if (!(timeColumn in rawData[0])) return () => false;

  if (window.kind === 'cumulative') {
    return (i: number) => parseTimeValue(rawData[i][timeColumn]) !== null;
  }

  let startMs: number;
  let endMs: number;
  const now = Date.now();
  switch (window.kind) {
    case 'fixed':
      startMs = Date.parse(window.startISO);
      endMs = Date.parse(window.endISO);
      break;
    case 'rolling':
      endMs = now;
      startMs = endMs - window.windowDays * 24 * 60 * 60 * 1000;
      break;
    case 'openEnded':
      startMs = Date.parse(window.startISO);
      endMs = now;
      break;
    default: {
      const _exhaustive: never = window;
      void _exhaustive;
      return () => false;
    }
  }

  return (i: number) => {
    const t = parseTimeValue(rawData[i][timeColumn]);
    if (t === null) return false;
    const ms = t.getTime();
    return ms >= startMs && ms <= endMs;
  };
}

export function useFilteredData(args: UseFilteredDataArgs = {}): FilteredDataResult {
  const rawData = useProjectStore(s => s.rawData);
  const filters = useProjectStore(s => s.filters);
  const timeColumn = useProjectStore(s => s.timeColumn);
  const { window } = args;

  return useMemo(() => {
    const filtered: DataRow[] = [];
    const indexMap = new Map<number, number>();
    const inWindow = makeWindowPredicate(rawData, timeColumn, window);

    for (let i = 0; i < rawData.length; i++) {
      if (inWindow && !inWindow(i)) continue;
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
  }, [rawData, filters, timeColumn, window]);
}
