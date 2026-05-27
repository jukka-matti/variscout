import { parseTimeValue, extractTimeComponents, formatTimeBucket } from '../time';
import type { HourGranularityMinutes, TimeDecompositionBinding, TimeDimension } from './types';

/**
 * Derive the canonical column name for a time decomposition dimension.
 *
 * Convention: `{source}.{dim-kebab}` with an optional granularity suffix for
 * sub-hour intervals.
 *
 * @example
 * derivedTimeColumnName('Date', 'year')       // "Date.year"
 * derivedTimeColumnName('Date', 'dayOfWeek')  // "Date.day-of-week"
 * derivedTimeColumnName('Date', 'hour', 15)   // "Date.hour-15min"
 * derivedTimeColumnName('Date', 'hour', 60)   // "Date.hour"
 */
export function derivedTimeColumnName(
  source: string,
  dim: TimeDimension,
  granularity?: HourGranularityMinutes
): string {
  switch (dim) {
    case 'year':
      return `${source}.year`;
    case 'quarter':
      return `${source}.quarter`;
    case 'month':
      return `${source}.month`;
    case 'week':
      return `${source}.week`;
    case 'dayOfWeek':
      return `${source}.day-of-week`;
    case 'hour':
      return granularity !== undefined && granularity !== 60
        ? `${source}.hour-${granularity}min`
        : `${source}.hour`;
  }
}

/**
 * Evaluate a TimeDecompositionBinding against a row array, producing one
 * categorical string column per requested dimension.
 *
 * Returns `null` per cell when:
 *  - The source column is absent from the row, OR
 *  - The cell value is unparseable as a date (via `parseTimeValue`).
 *
 * Hour at granularity 60 routes through `extractTimeComponents` (returns
 * `"HH:00"` when the date has a time component, `null` otherwise). Other
 * hour granularities route through `formatTimeBucket('minute', N)` directly.
 *
 * All 6 dimensions are extracted in a single pass per row.
 *
 * @param rows    - Dataset rows (unknown cell types)
 * @param binding - TimeDecompositionBinding specifying source column + dimensions
 * @returns       Record keyed by `derivedTimeColumnName(...)` with one value per row
 */
export function computeTimeDecompositionColumns(
  rows: Record<string, unknown>[],
  binding: TimeDecompositionBinding
): Record<string, (string | null)[]> {
  const granularity = binding.hourGranularityMinutes ?? 60;
  const { sourceColumn, dimensions } = binding;

  // Pre-build output arrays, one per dimension
  const out: Record<string, (string | null)[]> = {};
  for (const dim of dimensions) {
    out[derivedTimeColumnName(sourceColumn, dim, granularity)] = [];
  }

  for (const row of rows) {
    const raw = row[sourceColumn];

    // Treat missing column (undefined) as unparseable — null for all dims
    const date =
      raw !== undefined ? parseTimeValue(raw as Parameters<typeof parseTimeValue>[0]) : null;

    if (!date) {
      for (const dim of dimensions) {
        out[derivedTimeColumnName(sourceColumn, dim, granularity)].push(null);
      }
      continue;
    }

    // For year/quarter/month/week/dayOfWeek/hour@60 use extractTimeComponents.
    // extractHour only populates when hasTime(date) is true; hour@non-60 bypasses this.
    const needsExtract = dimensions.some(d => d !== 'hour' || granularity === 60);
    const needsHourExtract = dimensions.includes('hour') && granularity === 60;

    const components = needsExtract
      ? extractTimeComponents(raw as Parameters<typeof extractTimeComponents>[0], {
          extractYear: dimensions.includes('year'),
          extractMonth: dimensions.includes('month'),
          extractWeek: dimensions.includes('week'),
          extractDayOfWeek: dimensions.includes('dayOfWeek'),
          extractHour: needsHourExtract,
          extractQuarter: dimensions.includes('quarter'),
        })
      : {};

    for (const dim of dimensions) {
      const key = derivedTimeColumnName(sourceColumn, dim, granularity);
      switch (dim) {
        case 'year':
          out[key].push(components.year ?? null);
          break;
        case 'quarter':
          out[key].push(components.quarter ?? null);
          break;
        case 'month':
          out[key].push(components.month ?? null);
          break;
        case 'week':
          out[key].push(components.week ?? null);
          break;
        case 'dayOfWeek':
          out[key].push(components.dayOfWeek ?? null);
          break;
        case 'hour':
          if (granularity === 60) {
            out[key].push(components.hour ?? null);
          } else {
            // Sub-hour granularity: formatTimeBucket returns "Mon DD HH:mm" — that's
            // acceptable as a categorical label for binning.
            out[key].push(formatTimeBucket(date, 'minute', granularity));
          }
          break;
      }
    }
  }

  return out;
}
