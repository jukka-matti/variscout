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

/**
 * Extracted time components from a date value
 */
export interface TimeComponents {
  year?: string; // "2025"
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
  extractMonth: boolean;
  extractWeek: boolean;
  extractDayOfWeek: boolean;
  extractHour: boolean;
}

/**
 * Month abbreviations (0-indexed)
 */
const MONTH_ABBR = [
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
 * Day-of-week abbreviations (0=Sunday)
 */
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
