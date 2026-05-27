/**
 * Format a duration (in milliseconds) for compact display next to a process
 * step (e.g. the timing badge `⏱ ~ 42 min` on `<StepBox>` in Edit mode).
 *
 * Choices (documented for callers):
 * - `0 ms`            → `'0 s'`     (zero is a valid measurement, not "missing")
 * - sub-minute        → seconds with no decimal, rounded to nearest (`1500 → '2 s'`)
 * - exactly 60_000 ms → `'1 min'`  (crossover into minutes)
 * - 1 min .. < 1 h    → whole minutes, no decimal (`2_520_000 → '42 min'`)
 * - exactly 1 h       → `'1 h'`    (whole hours render without decimal)
 * - > 1 h, fractional → one decimal place (`4_320_000 → '1.2 h'`)
 * - NaN / ±Infinity   → `'—'`     (em-dash; callers use the helper to surface "missing")
 *
 * Intentionally locale-agnostic — VariScout's i18n pipeline (`formatStatistic`)
 * handles localized statistic display; this helper is the compact "rule of
 * thumb" representation in the canvas chrome where space is constrained.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return '—';

  if (ms < 60_000) {
    // Seconds range: no decimal, round to nearest.
    return `${Math.round(ms / 1_000)} s`;
  }

  if (ms < 3_600_000) {
    // Minutes range: whole minutes only.
    return `${Math.round(ms / 60_000)} min`;
  }

  // Hours range: whole hours render without decimal, otherwise 1 decimal.
  // We round to one decimal place by hand (no .toFixed): scale to tenths,
  // round, then either print as a whole number or as "<int>.<tenth>".
  const tenths = Math.round(ms / 360_000); // ms / 3_600_000 * 10
  const wholeHours = Math.floor(tenths / 10);
  const tenth = tenths % 10;
  if (tenth === 0) {
    return `${wholeHours} h`;
  }
  return `${wholeHours}.${tenth} h`;
}
