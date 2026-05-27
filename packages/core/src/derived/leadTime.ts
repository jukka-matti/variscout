import { parseTimeValue } from '../time';
import type { StepTimingBinding } from './types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parse a cell value to milliseconds epoch. Returns NaN for missing/unparseable.
 */
function cellToMs(value: unknown): number {
  if (value == null) return NaN;
  const date = parseTimeValue(value as Parameters<typeof parseTimeValue>[0]);
  if (date === null) return NaN;
  return date.getTime();
}

// ---------------------------------------------------------------------------
// Public derivation helpers
// ---------------------------------------------------------------------------

/**
 * Compute Lead_time per row: `max(end timestamps) – min(start timestamps)`
 * across all paired-kind step bindings.
 *
 * Returns `null` when:
 *  - `timings` is empty (no bindings at all), OR
 *  - none of the bindings are `kind: 'paired'` (spec §3.4 — Lead_time requires
 *    ≥1 step with explicit start+end columns).
 *
 * Per-row missing values (unparseable start or end cell) produce `NaN` for
 * that row; other rows are unaffected.
 */
export function computeLeadTimeColumn(
  rows: Record<string, unknown>[],
  timings: StepTimingBinding[]
): number[] | null {
  const paired = timings.filter(t => t.kind === 'paired');
  if (paired.length === 0) return null;

  return rows.map(row => {
    let minStart = Infinity;
    let maxEnd = -Infinity;

    for (const binding of paired) {
      // TypeScript narrowing: we filtered to kind === 'paired' above
      if (binding.kind !== 'paired') continue;
      const startMs = cellToMs(row[binding.startColumn]);
      const endMs = cellToMs(row[binding.endColumn]);
      if (Number.isNaN(startMs) || Number.isNaN(endMs)) return NaN;
      if (startMs < minStart) minStart = startMs;
      if (endMs > maxEnd) maxEnd = endMs;
    }

    if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) return NaN;
    return maxEnd - minStart;
  });
}

/**
 * Compute Total_work_time per row: sum of individual step durations across
 * ALL binding kinds.
 *
 * - Paired steps contribute `(end – start)` ms per row.
 * - Duration steps contribute the raw cell value from `durationColumn`.
 *   **Engine assumption**: duration column values are in milliseconds. Unit
 *   conversion (e.g. minutes → ms) is the responsibility of the UI seam that
 *   constructs the `StepTimingBinding` list.
 *
 * Returns `null` when `timings` is empty.
 *
 * Per-row missing or non-numeric cells produce `NaN` for that row.
 */
export function computeTotalWorkTimeColumn(
  rows: Record<string, unknown>[],
  timings: StepTimingBinding[]
): number[] | null {
  if (timings.length === 0) return null;

  return rows.map(row => {
    let total = 0;

    for (const binding of timings) {
      if (binding.kind === 'paired') {
        const startMs = cellToMs(row[binding.startColumn]);
        const endMs = cellToMs(row[binding.endColumn]);
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) return NaN;
        total += endMs - startMs;
      } else {
        // duration kind — value is assumed to be numeric milliseconds
        const raw = row[binding.durationColumn];
        if (typeof raw !== 'number' || Number.isNaN(raw)) return NaN;
        total += raw;
      }
    }

    return total;
  });
}

/**
 * Compute Wait_time per row: `Lead_time – Total_work_time`.
 *
 * Returns `null` when Lead_time would be null (i.e. no paired bindings) or
 * when `timings` is empty. NaN propagates from either operand.
 */
export function computeWaitTimeColumn(
  rows: Record<string, unknown>[],
  timings: StepTimingBinding[]
): number[] | null {
  const lead = computeLeadTimeColumn(rows, timings);
  if (lead === null) return null;

  const total = computeTotalWorkTimeColumn(rows, timings);
  // total cannot be null here because lead being non-null implies timings.length > 0
  // (at least one paired binding exists), so timings.length >= 1.
  if (total === null) return null;

  return lead.map((leadVal, i) => leadVal - total[i]!);
}
