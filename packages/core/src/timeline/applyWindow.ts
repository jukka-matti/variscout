import type { DataRow } from '../types';
import { parseTimeValue } from '../time';
import type { TimelineWindow } from './types';

/**
 * Filter rows by the active timeline window.
 *
 * Rules:
 * - Rows with a null/unparseable timeColumn value are dropped (they have no temporal locus).
 * - If the timeColumn does not exist on the row shape, returns an empty array
 *   (caller should detect-time-column at FRAME, not at apply time).
 * - For 'rolling' and 'openEnded' windows, `now` defaults to current time;
 *   tests pass an explicit `now` for determinism.
 */
export function applyWindow(
  rows: DataRow[],
  timeColumn: string,
  window: TimelineWindow,
  now: Date = new Date()
): DataRow[] {
  if (rows.length === 0) return [];
  if (!(timeColumn in rows[0])) return [];

  if (window.kind === 'cumulative') {
    return rows.filter(row => parseTimeValue(row[timeColumn]) !== null);
  }

  let startMs: number;
  let endMs: number;

  switch (window.kind) {
    case 'fixed':
      startMs = Date.parse(window.startISO);
      endMs = Date.parse(window.endISO);
      break;
    case 'rolling':
      endMs = now.getTime();
      startMs = endMs - window.windowDays * 24 * 60 * 60 * 1000;
      break;
    case 'openEnded':
      startMs = Date.parse(window.startISO);
      endMs = now.getTime();
      break;
    default: {
      const _exhaustive: never = window;
      return _exhaustive;
    }
  }

  return rows.filter(row => {
    const t = parseTimeValue(row[timeColumn]);
    if (t === null) return false;
    const ms = t.getTime();
    return ms >= startMs && ms <= endMs;
  });
}
