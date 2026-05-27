import { describe, expect, it } from 'vitest';
import { formatDuration } from '../formatDuration';

// formatDuration choices (documented):
// - `0 ms` → '0 s' (zero is a valid measurement, not "missing")
// - sub-minute durations render in seconds at 0 decimals (so 1500 ms → '2 s'; NOT '1.5 s')
// - 60_000 ms (exactly 1 minute) crosses over to minute formatting
// - minute range renders without decimals (so 2_520_000 ms → '42 min')
// - >= 1 hour renders in hours; whole hours have no decimal ('1 h'), otherwise one decimal ('1.2 h')
// - non-finite input (NaN, Infinity) renders '—' (em-dash) so callers can use the helper for the
//   "no data" state without conditional rendering at the call site.

describe('formatDuration', () => {
  it('returns "0 s" for 0 ms', () => {
    expect(formatDuration(0)).toBe('0 s');
  });

  it('rounds 1500 ms to "2 s" (no decimal in seconds range)', () => {
    expect(formatDuration(1500)).toBe('2 s');
  });

  it('returns "38 s" for 38000 ms', () => {
    expect(formatDuration(38_000)).toBe('38 s');
  });

  it('crosses over to minute formatting at exactly 60_000 ms', () => {
    expect(formatDuration(60_000)).toBe('1 min');
  });

  it('returns "42 min" for 2_520_000 ms (42 minutes)', () => {
    expect(formatDuration(2_520_000)).toBe('42 min');
  });

  it('returns "1 h" for exactly 3_600_000 ms (1 hour, no decimal for whole hours)', () => {
    expect(formatDuration(3_600_000)).toBe('1 h');
  });

  it('returns "1.2 h" for 4_320_000 ms (72 minutes)', () => {
    expect(formatDuration(4_320_000)).toBe('1.2 h');
  });

  it('returns em-dash for NaN', () => {
    expect(formatDuration(NaN)).toBe('—');
  });

  it('returns em-dash for Infinity', () => {
    expect(formatDuration(Infinity)).toBe('—');
  });

  it('returns em-dash for -Infinity', () => {
    expect(formatDuration(-Infinity)).toBe('—');
  });
});
