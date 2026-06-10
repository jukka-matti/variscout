import { useMemo } from 'react';
import { usePreferencesStore, useProjectStore } from '@variscout/stores';
import { timeLensIndices, parseTimeValue, rangeOf, MONTH_ABBR } from '@variscout/core';
import { useFilteredData } from './useFilteredData';

/** Format an ISO timestamp as a "Mon D" day label (e.g. "Apr 13"). No year — the
 * context line wants a glanceable span, not a full date. */
function dayLabel(iso: string): string {
  const d = parseTimeValue(iso);
  if (!d) return '';
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Returns a formatted `<start> – <end>` date-range label over the CURRENTLY
 * lensed/filtered rows, keyed on the project's `timeColumn`.
 *
 * - `null` when there is no `timeColumn`, no data, or no parseable timestamp.
 * - Collapses to a single label ("Apr 13") when start and end share a day.
 * - Honours the active `timeLens` window the same way `useLensedSampleCount`
 *   does (filtered rows sliced by `timeLensIndices`), so the range tracks what
 *   the I-Chart actually shows.
 *
 * Feeds the Explore context line (ER-1). Mechanism shared with the match-summary
 * classifier via the moved `rangeOf` (core/time).
 */
export function useDataDateRange(): string | null {
  const { filteredData } = useFilteredData();
  const timeColumn = useProjectStore(s => s.timeColumn);
  const lens = usePreferencesStore(s => s.timeLens);

  return useMemo(() => {
    if (!timeColumn) return null;
    const { start, end } = timeLensIndices(filteredData.length, lens);
    const lensedRows = filteredData.slice(start, end);
    const range = rangeOf(lensedRows, timeColumn);
    if (!range) return null;
    const startLabel = dayLabel(range.startISO);
    const endLabel = dayLabel(range.endISO);
    if (!startLabel || !endLabel) return null;
    return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  }, [filteredData, timeColumn, lens]);
}
