/**
 * Time-based data utilities for VariScout
 *
 * Provides:
 * - Date/time parsing (ISO, Excel serial, Unix timestamps)
 * - Time component extraction (Year, Month, Week, Day-of-Week, Hour)
 * - Tooltip formatting for IChart
 * - Dataset augmentation with computed time columns
 */

import type { DataCellValue, DataRow } from './types';

/** Time interval granularity for time-based subgrouping */
export type TimeGranularity = 'minute' | 'hour' | 'day' | 'week';

/**
 * Extracted time components from a date value
 */
export interface TimeComponents {
  year?: string; // "2025"
  quarter?: string; // "Q1"
  month?: string; // "Jan"
  week?: string; // "W03"
  dayOfWeek?: string; // "Mon"
  hour?: string; // "14:00"
}

/**
 * Configuration for time component extraction
 */
export interface TimeExtractionConfig {
  extractYear: boolean;
  extractQuarter?: boolean;
  extractMonth: boolean;
  extractWeek: boolean;
  extractDayOfWeek: boolean;
  extractHour: boolean;
  /** Minute-interval extraction: 1, 5, 15, or 30. Creates column like 'timestamp_15min'. */
  extractMinuteInterval?: number;
}

/**
 * Month abbreviations (0-indexed, Jan=0)
 */
export const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Full month names (0-indexed, January=0)
 */
export const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Day-of-week abbreviations used for extraction (0=Sunday, Sun-first).
 * Do NOT change this order — extractTimeComponents depends on Date.getDay() (0=Sun).
 */
export const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Weekday abbreviations in Mon-first display order (ISO/practitioner convention).
 * Used for natural sort ordering; do NOT confuse with DAY_ABBR (Sun-first).
 */
export const WEEKDAY_DISPLAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Full weekday names in Mon-first display order.
 */
export const WEEKDAY_FULL_DISPLAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Day-part vocabulary in natural time order.
 */
export const DAY_PART_ORDER = ['Morning', 'Afternoon', 'Evening', 'Night'];

// ─── Natural-category comparator ─────────────────────────────────────────────

/**
 * Vocabulary definitions for natural-category detection.
 * Each entry is a tuple of [abbreviation set, full-name set] (both sets
 * contain lowercase keys for case-insensitive matching).
 *
 * Membership check: a key belongs to a vocabulary if it matches ANY entry
 * in EITHER the abbreviation set or the full-name set.
 */
const NATURAL_VOCABULARIES: Array<{
  name: string;
  order: string[]; // canonical order, mixed case (the display labels)
  fullNames?: readonly string[]; // optional full-name aliases (same positional index as order)
  members: Set<string>; // lowercase keys for membership testing
}> = [
  {
    name: 'weekday',
    order: WEEKDAY_DISPLAY_ORDER,
    fullNames: WEEKDAY_FULL_DISPLAY_ORDER,
    members: new Set([
      ...WEEKDAY_DISPLAY_ORDER.map(s => s.toLowerCase()),
      ...WEEKDAY_FULL_DISPLAY_ORDER.map(s => s.toLowerCase()),
    ]),
  },
  {
    name: 'month',
    order: MONTH_ABBR,
    fullNames: MONTH_FULL,
    members: new Set([
      ...MONTH_ABBR.map(s => s.toLowerCase()),
      ...MONTH_FULL.map(s => s.toLowerCase()),
    ]),
  },
  {
    name: 'day-part',
    order: DAY_PART_ORDER,
    members: new Set(DAY_PART_ORDER.map(s => s.toLowerCase())),
  },
];

/**
 * Build a vocab-index map for the given vocabulary entry.
 * For a full-name key that appears in a vocabulary, returns the index
 * of the matching abbreviation / canonical entry.
 */
function buildVocabIndex(vocab: (typeof NATURAL_VOCABULARIES)[0]): Map<string, number> {
  const map = new Map<string, number>();
  // Index by canonical order (abbreviations or primary label)
  for (let i = 0; i < vocab.order.length; i++) {
    map.set(vocab.order[i].toLowerCase(), i);
  }
  // Also index full-name aliases at the same positional index (if provided)
  if (vocab.fullNames) {
    for (let i = 0; i < vocab.fullNames.length; i++) {
      map.set(vocab.fullNames[i].toLowerCase(), i);
    }
  }
  return map;
}

/**
 * Detect whether all keys in `uniqueKeys` belong to a single natural vocabulary.
 * Returns a comparator function if detected, or `null` if no vocabulary matches.
 *
 * Detection rules:
 * - Every unique key must belong to the SAME vocabulary (case-insensitive).
 * - Subsets are allowed (e.g., Mon–Fri only).
 * - A single non-member key → returns null (existing sort behaviour applies).
 *
 * @param uniqueKeys - The full set of unique category keys in the data.
 * @param dir - Sort direction multiplier (1=asc, -1=desc).
 * @returns A comparator (a, b) => number or null.
 */
export function detectNaturalVocabComparator(
  uniqueKeys: string[],
  dir: 1 | -1
): ((a: string, b: string) => number) | null {
  if (uniqueKeys.length === 0) return null;

  const lowered = uniqueKeys.map(k => k.toLowerCase());

  for (const vocab of NATURAL_VOCABULARIES) {
    if (lowered.every(k => vocab.members.has(k))) {
      const indexMap = buildVocabIndex(vocab);
      return (a: string, b: string) => {
        const ia = indexMap.get(a.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        const ib = indexMap.get(b.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        return (ia - ib) * dir;
      };
    }
  }

  return null;
}

/**
 * Parse a value into a Date object
 *
 * Supports:
 * - ISO strings: "2025-01-15T14:30:00Z"
 * - Date objects (pass-through)
 * - Excel serial dates (numbers)
 * - Unix timestamps (numbers > 10000000000)
 *
 * @param value - Value to parse
 * @returns Date object or null if unparseable
 */
export function parseTimeValue(value: DataCellValue | Date): Date | null {
  if (value == null) return null;

  // Already a Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // String parsing
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Number parsing (Excel serial or Unix timestamp)
  if (typeof value === 'number') {
    // Excel serial date (days since 1900-01-01, accounting for Excel bug)
    if (value > 0 && value < 100000) {
      // Excel incorrectly treats 1900 as a leap year
      // Serial 1 = Jan 1, 1900 UTC
      // Serial 60 = Feb 29, 1900 (doesn't exist)
      // Serial 61 = March 1, 1900
      const excelEpoch = new Date(Date.UTC(1899, 11, 31)); // Dec 31, 1899 UTC (so serial 1 = Jan 1, 1900)
      const days = value >= 60 ? value - 1 : value; // Adjust for Excel's leap year bug after Feb 29, 1900
      const ms = days * 24 * 60 * 60 * 1000;
      return new Date(excelEpoch.getTime() + ms);
    }

    // Unix timestamp (seconds or milliseconds)
    if (value > 10000000000) {
      return new Date(value); // Milliseconds
    } else if (value > 1000000000) {
      return new Date(value * 1000); // Seconds
    }
  }

  return null;
}

/**
 * Calculate ISO week number (ISO 8601 standard)
 *
 * Week 1 is the first week with a Thursday in it
 *
 * @param date - Date to calculate week for
 * @returns ISO week number (1-53)
 */
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.getTime());

  // Set to Thursday of this week (ISO week always contains Thursday)
  const dayNum = (date.getDay() + 6) % 7; // Mon=0, Sun=6
  target.setDate(target.getDate() - dayNum + 3);

  // Get first Thursday of the year
  const jan4 = new Date(target.getFullYear(), 0, 4);
  const jan4DayNum = (jan4.getDay() + 6) % 7;
  const firstThursday = new Date(jan4.getTime() - jan4DayNum * 24 * 60 * 60 * 1000);

  // Calculate week number
  const weekNum =
    Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return weekNum;
}

/**
 * Check if a date has a time component (not midnight in local timezone)
 *
 * @param date - Date to check
 * @returns True if time component exists
 */
function hasTime(date: Date): boolean {
  return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
}

/**
 * Extract time components from a date value
 *
 * @param value - Date value to extract from
 * @param config - Which components to extract
 * @returns Object with requested time components
 */
export function extractTimeComponents(
  value: DataCellValue,
  config: TimeExtractionConfig
): TimeComponents {
  const date = parseTimeValue(value);
  if (!date) return {};

  const components: TimeComponents = {};

  if (config.extractYear) {
    components.year = String(date.getFullYear());
  }

  if (config.extractQuarter) {
    const quarterNum = Math.floor(date.getMonth() / 3) + 1;
    components.quarter = `Q${quarterNum}`;
  }

  if (config.extractMonth) {
    components.month = MONTH_ABBR[date.getMonth()];
  }

  if (config.extractWeek) {
    const weekNum = getISOWeekNumber(date);
    components.week = `W${String(weekNum).padStart(2, '0')}`;
  }

  if (config.extractDayOfWeek) {
    components.dayOfWeek = DAY_ABBR[date.getDay()];
  }

  if (config.extractHour && hasTime(date)) {
    components.hour = `${String(date.getHours()).padStart(2, '0')}:00`;
  }

  return components;
}

/**
 * Format a date value for tooltip display
 *
 * @param value - Date value to format
 * @returns Formatted string or null if invalid
 *
 * @example
 * formatTimeValue("2025-01-15") // "Jan 15, 2025"
 * formatTimeValue("2025-01-15T14:30:00Z") // "Jan 15, 2025 14:30"
 */
export function formatTimeValue(value: DataCellValue): string | null {
  const date = parseTimeValue(value);
  if (!date) return null;

  const month = MONTH_ABBR[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  let result = `${month} ${day}, ${year}`;

  // Add time component if present
  if (hasTime(date)) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    result += ` ${hours}:${minutes}`;
  }

  return result;
}

/**
 * Format a date into a bucket label for the given granularity.
 *
 * @param date - Date to format
 * @param granularity - Time granularity
 * @param minuteInterval - Minute interval (only used when granularity = 'minute')
 * @returns Formatted bucket label
 */
export function formatTimeBucket(
  date: Date,
  granularity: TimeGranularity,
  minuteInterval: number = 15
): string {
  const month = MONTH_ABBR[date.getMonth()];
  const day = date.getDate();

  switch (granularity) {
    case 'minute': {
      const effectiveInterval = Math.max(1, minuteInterval);
      const floored = Math.floor(date.getMinutes() / effectiveInterval) * effectiveInterval;
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(floored).padStart(2, '0');
      return `${month} ${day} ${hh}:${mm}`;
    }
    case 'hour': {
      const hh = String(date.getHours()).padStart(2, '0');
      return `${month} ${day} ${hh}:00`;
    }
    case 'day':
      return `${month} ${day}`;
    case 'week': {
      // ISO week number
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return `W${String(weekNum).padStart(2, '0')} ${d.getUTCFullYear()}`;
    }
  }
}

/**
 * Augment dataset with computed time columns
 *
 * IMPORTANT: Mutates the data array in place by adding new properties to each row
 *
 * @param data - Dataset to augment (mutated in place)
 * @param timeColumn - Name of the source time column
 * @param config - Which components to extract
 * @returns Object with list of created column names and whether hour column was created
 *
 * @example
 * augmentWithTimeColumns(data, "Date", { extractYear: true, extractMonth: true, ... })
 * // Adds columns: "Date_Year", "Date_Month", etc.
 */
export function augmentWithTimeColumns(
  data: DataRow[],
  timeColumn: string,
  config: TimeExtractionConfig
): { newColumns: string[]; hasHourColumn: boolean } {
  const newColumns: string[] = [];
  let hasHourColumn = false;

  // Define column mappings
  const columnMap: Array<{ key: keyof TimeComponents; suffix: string; enabled: boolean }> = [
    { key: 'year', suffix: 'Year', enabled: config.extractYear },
    { key: 'month', suffix: 'Month', enabled: config.extractMonth },
    { key: 'week', suffix: 'Week', enabled: config.extractWeek },
    { key: 'dayOfWeek', suffix: 'DayOfWeek', enabled: config.extractDayOfWeek },
    { key: 'hour', suffix: 'Hour', enabled: config.extractHour },
  ];

  // Extract components for each row
  for (const row of data) {
    const value = row[timeColumn];
    const components = extractTimeComponents(value, config);

    for (const { key, suffix, enabled } of columnMap) {
      if (!enabled) continue;

      const columnName = `${timeColumn}_${suffix}`;

      // Track new columns (first row only)
      if (row === data[0] && components[key] !== undefined) {
        newColumns.push(columnName);
        if (key === 'hour') hasHourColumn = true;
      }

      // Add component to row
      row[columnName] = components[key] ?? null;
    }
  }

  // Minute-interval extraction
  if (config.extractMinuteInterval && config.extractMinuteInterval > 0) {
    const interval = config.extractMinuteInterval;
    const colName = `${timeColumn}_${interval}min`;
    newColumns.push(colName);
    for (const row of data) {
      const date = parseTimeValue(row[timeColumn]);
      if (date) {
        row[colName] = formatTimeBucket(date, 'minute', interval);
      } else {
        row[colName] = '';
      }
    }
  }

  return { newColumns, hasHourColumn };
}

/**
 * Check if a time column has time component (not just date)
 *
 * Samples first 10 rows to detect datetime vs date-only
 *
 * @param data - Dataset to check
 * @param timeColumn - Name of the time column
 * @returns True if time component detected
 */
export function hasTimeComponent(data: DataRow[], timeColumn: string): boolean {
  const sampleSize = Math.min(10, data.length);

  for (let i = 0; i < sampleSize; i++) {
    const value = data[i][timeColumn];
    const date = parseTimeValue(value);

    if (date && hasTime(date)) {
      return true;
    }
  }

  return false;
}
