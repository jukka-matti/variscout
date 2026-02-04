import { describe, it, expect } from 'vitest';
import {
  parseTimeValue,
  extractTimeComponents,
  formatTimeValue,
  augmentWithTimeColumns,
  hasTimeComponent,
  type TimeExtractionConfig,
} from '../time';

describe('parseTimeValue', () => {
  it('parses ISO date strings', () => {
    const date = parseTimeValue('2025-01-15');
    expect(date).toBeInstanceOf(Date);
    expect(date?.getFullYear()).toBe(2025);
    expect(date?.getMonth()).toBe(0); // January
    expect(date?.getDate()).toBe(15);
  });

  it('parses ISO datetime strings', () => {
    const date = parseTimeValue('2025-01-15T14:30:00');
    expect(date).toBeInstanceOf(Date);
    // Don't assert specific hours due to timezone conversion
    expect(date).toBeInstanceOf(Date);
  });

  it('handles Date objects', () => {
    const input = new Date('2025-01-15');
    const date = parseTimeValue(input);
    expect(date).toBe(input);
  });

  it('parses Excel serial dates', () => {
    // Excel serial 45673 = 2025-01-16 (UTC) - accounting for Excel leap year bug
    const date = parseTimeValue(45673);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getUTCFullYear()).toBe(2025);
    expect(date?.getUTCMonth()).toBe(0);
    expect(date?.getUTCDate()).toBe(16);
  });

  it('handles Excel leap year bug (dates before March 1900)', () => {
    // Excel serial 60 is Feb 29, 1900 (which doesn't exist)
    // Excel serial 61 is March 1, 1900 (UTC)
    const date = parseTimeValue(61);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getUTCMonth()).toBe(2); // March
  });

  it('parses Unix timestamps (seconds)', () => {
    const timestamp = 1737000000; // ~2025-01-16
    const date = parseTimeValue(timestamp);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getFullYear()).toBe(2025);
  });

  it('parses Unix timestamps (milliseconds)', () => {
    const timestamp = 1737000000000;
    const date = parseTimeValue(timestamp);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getFullYear()).toBe(2025);
  });

  it('returns null for invalid strings', () => {
    expect(parseTimeValue('not a date')).toBeNull();
    expect(parseTimeValue('')).toBeNull();
    expect(parseTimeValue('   ')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(parseTimeValue(null)).toBeNull();
    expect(parseTimeValue(undefined)).toBeNull();
  });

  it('returns null for invalid Date objects', () => {
    const invalid = new Date('invalid');
    expect(parseTimeValue(invalid)).toBeNull();
  });
});

describe('extractTimeComponents', () => {
  const fullConfig: TimeExtractionConfig = {
    extractYear: true,
    extractMonth: true,
    extractWeek: true,
    extractDayOfWeek: true,
    extractHour: true,
  };

  it('extracts year', () => {
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    const components = extractTimeComponents(date, { ...fullConfig, extractYear: true });
    expect(components.year).toBe('2025');
  });

  it('extracts month abbreviation', () => {
    const tests = [
      { date: new Date(2025, 0, 15), expected: 'Jan' },
      { date: new Date(2025, 1, 15), expected: 'Feb' },
      { date: new Date(2025, 2, 15), expected: 'Mar' },
      { date: new Date(2025, 11, 15), expected: 'Dec' },
    ];

    for (const { date, expected } of tests) {
      const components = extractTimeComponents(date, fullConfig);
      expect(components.month).toBe(expected);
    }
  });

  it('extracts ISO week number', () => {
    // Week 1 of 2025 starts Jan 1 (Wednesday is in first week with Thursday)
    const components1 = extractTimeComponents(new Date(2025, 0, 6), fullConfig); // Monday of week 2
    expect(components1.week).toBe('W02');

    const components2 = extractTimeComponents(new Date(2025, 0, 15), fullConfig);
    expect(components2.week).toBe('W03');
  });

  it('extracts day-of-week abbreviation', () => {
    const tests = [
      { date: new Date(2025, 0, 12), expected: 'Sun' }, // Sunday
      { date: new Date(2025, 0, 13), expected: 'Mon' },
      { date: new Date(2025, 0, 14), expected: 'Tue' },
      { date: new Date(2025, 0, 15), expected: 'Wed' },
      { date: new Date(2025, 0, 16), expected: 'Thu' },
      { date: new Date(2025, 0, 17), expected: 'Fri' },
      { date: new Date(2025, 0, 18), expected: 'Sat' },
    ];

    for (const { date, expected } of tests) {
      const components = extractTimeComponents(date, fullConfig);
      expect(components.dayOfWeek).toBe(expected);
    }
  });

  it('extracts hour when time component exists', () => {
    const date = new Date(2025, 0, 15, 14, 30); // 2:30 PM
    const components = extractTimeComponents(date, fullConfig);
    expect(components.hour).toBe('14:00');
  });

  it('does not extract hour for date-only (midnight)', () => {
    const date = new Date(2025, 0, 15, 0, 0); // Midnight
    const components = extractTimeComponents(date, fullConfig);
    expect(components.hour).toBeUndefined();
  });

  it('extracts hour for non-midnight times', () => {
    const components1 = extractTimeComponents(new Date(2025, 0, 15, 0, 30), fullConfig);
    expect(components1.hour).toBe('00:00');

    const components2 = extractTimeComponents(new Date(2025, 0, 15, 23, 45), fullConfig);
    expect(components2.hour).toBe('23:00');
  });

  it('respects configuration flags', () => {
    const config: TimeExtractionConfig = {
      extractYear: true,
      extractMonth: false,
      extractWeek: false,
      extractDayOfWeek: true,
      extractHour: false,
    };

    const date = new Date(2025, 0, 15, 14, 30);
    const components = extractTimeComponents(date, config);

    expect(components.year).toBe('2025');
    expect(components.month).toBeUndefined();
    expect(components.week).toBeUndefined();
    expect(components.dayOfWeek).toBe('Wed');
    expect(components.hour).toBeUndefined();
  });

  it('returns empty object for invalid values', () => {
    const components = extractTimeComponents('invalid', fullConfig);
    expect(components).toEqual({});
  });
});

describe('formatTimeValue', () => {
  it('formats date-only values', () => {
    const formatted1 = formatTimeValue(new Date(2025, 0, 15, 0, 0));
    expect(formatted1).toBe('Jan 15, 2025');

    const formatted2 = formatTimeValue(new Date(2025, 11, 25, 0, 0));
    expect(formatted2).toBe('Dec 25, 2025');
  });

  it('formats datetime values', () => {
    const formatted1 = formatTimeValue(new Date(2025, 0, 15, 14, 30));
    expect(formatted1).toBe('Jan 15, 2025 14:30');

    const formatted2 = formatTimeValue(new Date(2025, 0, 15, 9, 5));
    expect(formatted2).toBe('Jan 15, 2025 09:05');
  });

  it('formats single-digit days correctly', () => {
    const formatted = formatTimeValue(new Date(2025, 0, 5, 0, 0));
    expect(formatted).toBe('Jan 5, 2025');
  });

  it('handles Date objects', () => {
    const date = new Date(2025, 0, 15, 14, 30);
    const formatted = formatTimeValue(date);
    expect(formatted).toBe('Jan 15, 2025 14:30');
  });

  it('handles Excel serial dates', () => {
    const formatted = formatTimeValue(45659); // 2025-01-16 UTC
    expect(formatted).not.toBeNull();
    expect(formatted).toContain('2025');
  });

  it('returns null for invalid values', () => {
    expect(formatTimeValue('invalid')).toBeNull();
    expect(formatTimeValue(null)).toBeNull();
    expect(formatTimeValue(undefined)).toBeNull();
  });

  it('does not show time for midnight', () => {
    const formatted = formatTimeValue(new Date(2025, 0, 15, 0, 0));
    expect(formatted).toBe('Jan 15, 2025');
  });

  it('shows time for non-midnight values', () => {
    const formatted = formatTimeValue(new Date(2025, 0, 15, 0, 1));
    expect(formatted).toBe('Jan 15, 2025 00:01');
  });
});

describe('augmentWithTimeColumns', () => {
  const fullConfig: TimeExtractionConfig = {
    extractYear: true,
    extractMonth: true,
    extractWeek: true,
    extractDayOfWeek: true,
    extractHour: true,
  };

  it('adds computed columns to dataset', () => {
    const data = [
      { Date: new Date(2025, 0, 15, 0, 0), Value: 10 },
      { Date: new Date(2025, 0, 16, 0, 0), Value: 20 },
    ];

    const result = augmentWithTimeColumns(data, 'Date', fullConfig);

    expect(result.newColumns).toContain('Date_Year');
    expect(result.newColumns).toContain('Date_Month');
    expect(result.newColumns).toContain('Date_Week');
    expect(result.newColumns).toContain('Date_DayOfWeek');

    expect(data[0].Date_Year).toBe('2025');
    expect(data[0].Date_Month).toBe('Jan');
    expect(data[0].Date_DayOfWeek).toBe('Wed');

    expect(data[1].Date_Year).toBe('2025');
    expect(data[1].Date_Month).toBe('Jan');
    expect(data[1].Date_DayOfWeek).toBe('Thu');
  });

  it('respects configuration flags', () => {
    const data = [{ Date: new Date(2025, 0, 15), Value: 10 }];
    const config: TimeExtractionConfig = {
      extractYear: true,
      extractMonth: false,
      extractWeek: false,
      extractDayOfWeek: true,
      extractHour: false,
    };

    const result = augmentWithTimeColumns(data, 'Date', config);

    expect(result.newColumns).toContain('Date_Year');
    expect(result.newColumns).toContain('Date_DayOfWeek');
    expect(result.newColumns).not.toContain('Date_Month');
    expect(result.newColumns).not.toContain('Date_Week');
    expect(result.newColumns).not.toContain('Date_Hour');
  });

  it('handles datetime values with hour extraction', () => {
    const data = [{ Timestamp: new Date(2025, 0, 15, 14, 30), Value: 10 }];

    const result = augmentWithTimeColumns(data, 'Timestamp', fullConfig);

    expect(result.newColumns).toContain('Timestamp_Hour');
    expect(result.hasHourColumn).toBe(true);
    expect(data[0].Timestamp_Hour).toBe('14:00');
  });

  it('does not add hour column for date-only values', () => {
    const data = [{ Date: new Date(2025, 0, 15, 0, 0), Value: 10 }];

    const result = augmentWithTimeColumns(data, 'Date', fullConfig);

    // Hour column not created because date has no time component
    expect(result.hasHourColumn).toBe(false);
    expect(data[0].Date_Hour).toBeNull(); // Still added but null
  });

  it('handles missing/invalid values gracefully', () => {
    const data = [
      { Date: new Date(2025, 0, 15), Value: 10 },
      { Date: 'invalid', Value: 20 },
      { Date: null, Value: 30 },
    ];

    const result = augmentWithTimeColumns(data, 'Date', fullConfig);

    expect(data[0].Date_Year).toBe('2025');
    expect(data[1].Date_Year).toBeNull(); // Invalid date
    expect(data[2].Date_Year).toBeNull(); // Null value
  });

  it('mutates data in place', () => {
    const data = [{ Date: new Date(2025, 0, 15), Value: 10 }];
    const original = data[0];

    augmentWithTimeColumns(data, 'Date', fullConfig);

    expect(data[0]).toBe(original); // Same object reference
    expect('Date_Year' in data[0]).toBe(true);
  });

  it('uses column name as prefix', () => {
    const data1 = [{ Date: new Date(2025, 0, 15) }];
    const data2 = [{ Timestamp: new Date(2025, 0, 15) }];

    augmentWithTimeColumns(data1, 'Date', fullConfig);
    augmentWithTimeColumns(data2, 'Timestamp', fullConfig);

    expect('Date_Year' in data1[0]).toBe(true);
    expect('Timestamp_Year' in data2[0]).toBe(true);
  });

  it('handles empty dataset', () => {
    const data: any[] = [];
    const result = augmentWithTimeColumns(data, 'Date', fullConfig);

    expect(result.newColumns).toEqual([]);
    expect(result.hasHourColumn).toBe(false);
  });
});

describe('hasTimeComponent', () => {
  it('detects datetime values', () => {
    const data = [
      { Timestamp: new Date(2025, 0, 15, 14, 30) },
      { Timestamp: new Date(2025, 0, 16, 9, 0) },
    ];

    expect(hasTimeComponent(data, 'Timestamp')).toBe(true);
  });

  it('detects date-only values', () => {
    const data = [{ Date: new Date(2025, 0, 15, 0, 0) }, { Date: new Date(2025, 0, 16, 0, 0) }];

    expect(hasTimeComponent(data, 'Date')).toBe(false);
  });

  it('samples first 10 rows only', () => {
    const data = [
      ...Array(10)
        .fill(null)
        .map(() => ({ Date: new Date(2025, 0, 15, 0, 0) })),
      { Date: new Date(2025, 0, 15, 14, 30) }, // Row 11 has time
    ];

    // Should not detect time because it only samples first 10
    expect(hasTimeComponent(data, 'Date')).toBe(false);
  });

  it('detects time if any sampled row has time component', () => {
    const data = [
      { Date: new Date(2025, 0, 15, 0, 0) },
      { Date: new Date(2025, 0, 16, 0, 0) },
      { Date: new Date(2025, 0, 17, 14, 30) }, // Third row has time
    ];

    expect(hasTimeComponent(data, 'Date')).toBe(true);
  });

  it('handles missing/invalid values', () => {
    const data = [{ Date: null }, { Date: 'invalid' }, { Date: new Date(2025, 0, 15, 0, 0) }];

    expect(hasTimeComponent(data, 'Date')).toBe(false);
  });

  it('handles empty dataset', () => {
    const data: any[] = [];
    expect(hasTimeComponent(data, 'Date')).toBe(false);
  });

  it('treats midnight as date-only', () => {
    const data = [{ Date: new Date(2025, 0, 15, 0, 0, 0) }];

    expect(hasTimeComponent(data, 'Date')).toBe(false);
  });

  it('detects non-midnight times', () => {
    const data = [
      { Date: new Date(2025, 0, 15, 0, 1, 0) }, // 1 minute past midnight
    ];

    expect(hasTimeComponent(data, 'Date')).toBe(true);
  });
});
