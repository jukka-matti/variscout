import { useMemo } from 'react';

/**
 * Memoized FK-list → entity batch projection. Used by IP UI sections that
 * carry FK arrays (e.g. sections.approach.actionItemIds[]) to
 * resolve them into rendered entities.
 *
 * `fetchBatch` is expected to be a referentially stable map-returning fn
 * (e.g., a Zustand selector wrapped in useCallback). Re-projection runs
 * only when fkList or fetchBatch identity changes.
 *
 * Returns the entities that resolved cleanly; missing FK entries are silently
 * dropped from the output array — the consumer chooses whether to surface that.
 *
 * Per spec §11 D18 — live-document primitives.
 */
export function useLiveProjection<T>(
  fkList: ReadonlyArray<string>,
  fetchBatch: (ids: ReadonlyArray<string>) => Map<string, T>
): T[] {
  return useMemo(() => {
    const batch = fetchBatch(fkList);
    return fkList.map(id => batch.get(id)).filter((v): v is T => v !== undefined);
  }, [fkList, fetchBatch]);
}
