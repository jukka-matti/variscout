import { useSessionStore } from '@variscout/stores';
import { timeLensIndices } from '@variscout/core';
import { useFilteredData } from './useFilteredData';

/**
 * Returns the number of observations visible under the current `timeLens`.
 *
 * Keeps the n chip in ProcessHealthBar consistent with lensed stats: when a
 * rolling window reduces the effective sample from 100 to 50, this hook
 * returns 50 — matching what `useAnalysisStats` computes.
 */
export function useLensedSampleCount(): number {
  const { filteredData } = useFilteredData();
  const lens = useSessionStore(s => s.timeLens);
  const { start, end } = timeLensIndices(filteredData.length, lens);
  return end - start;
}
