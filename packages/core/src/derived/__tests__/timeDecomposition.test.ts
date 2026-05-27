import { describe, expect, it } from 'vitest';
import { computeTimeDecompositionColumns, derivedTimeColumnName } from '../timeDecomposition';
import type { TimeDecompositionBinding } from '../types';

function binding(overrides: Partial<TimeDecompositionBinding> = {}): TimeDecompositionBinding {
  return {
    id: 't1',
    sourceColumn: 'Date',
    dimensions: ['year'],
    ...overrides,
  };
}

describe('derivedTimeColumnName', () => {
  it('formats year', () => {
    expect(derivedTimeColumnName('Date', 'year')).toBe('Date.year');
  });
  it('formats quarter', () => {
    expect(derivedTimeColumnName('Date', 'quarter')).toBe('Date.quarter');
  });
  it('formats month', () => {
    expect(derivedTimeColumnName('Date', 'month')).toBe('Date.month');
  });
  it('formats week', () => {
    expect(derivedTimeColumnName('Date', 'week')).toBe('Date.week');
  });
  it('formats dayOfWeek as dot+kebab', () => {
    expect(derivedTimeColumnName('Date', 'dayOfWeek')).toBe('Date.day-of-week');
  });
  it('formats hour with default granularity (60)', () => {
    expect(derivedTimeColumnName('Date', 'hour')).toBe('Date.hour');
  });
  it('formats hour with granularity 60 explicitly', () => {
    expect(derivedTimeColumnName('Date', 'hour', 60)).toBe('Date.hour');
  });
  it('formats hour with granularity 15', () => {
    expect(derivedTimeColumnName('Date', 'hour', 15)).toBe('Date.hour-15min');
  });
  it('formats hour with granularity 5', () => {
    expect(derivedTimeColumnName('Date', 'hour', 5)).toBe('Date.hour-5min');
  });
  it('formats hour with granularity 30', () => {
    expect(derivedTimeColumnName('Date', 'hour', 30)).toBe('Date.hour-30min');
  });
  it('preserves source column name with underscores', () => {
    expect(derivedTimeColumnName('Order_Date', 'dayOfWeek')).toBe('Order_Date.day-of-week');
  });
});

describe('computeTimeDecompositionColumns', () => {
  it('returns empty arrays under each dimension key for empty rows', () => {
    const out = computeTimeDecompositionColumns([], binding({ dimensions: ['year', 'month'] }));
    expect(out).toEqual({ 'Date.year': [], 'Date.month': [] });
  });

  it('returns one key per dimension', () => {
    const out = computeTimeDecompositionColumns(
      [{ Date: '2025-01-15' }],
      binding({ dimensions: ['year', 'quarter', 'month', 'week', 'dayOfWeek', 'hour'] })
    );
    expect(Object.keys(out)).toHaveLength(6);
    expect(Object.keys(out).sort()).toEqual([
      'Date.day-of-week',
      'Date.hour',
      'Date.month',
      'Date.quarter',
      'Date.week',
      'Date.year',
    ]);
  });

  it('extracts year, quarter, and day-of-week from ISO dates', () => {
    const rows = [
      { Date: '2025-01-15' }, // Wed
      { Date: '2025-04-20' }, // Sun
      { Date: '2025-12-31' }, // Wed
    ];
    const out = computeTimeDecompositionColumns(
      rows,
      binding({ dimensions: ['year', 'quarter', 'dayOfWeek'] })
    );
    expect(out['Date.year']).toEqual(['2025', '2025', '2025']);
    expect(out['Date.quarter']).toEqual(['Q1', 'Q2', 'Q4']);
    // Day-of-week formatted strings depend on extractTimeComponents output ("Mon"/"Tue"/...).
    // Verify abbreviation length and uppercase-first-letter is consistent:
    expect(out['Date.day-of-week']).toHaveLength(3);
    expect(out['Date.day-of-week'][0]).toMatch(/^[A-Z][a-z]{2}$/);
  });

  it('returns null for unparseable date strings', () => {
    const out = computeTimeDecompositionColumns(
      [{ Date: 'banana' }],
      binding({ dimensions: ['year', 'month'] })
    );
    expect(out['Date.year']).toEqual([null]);
    expect(out['Date.month']).toEqual([null]);
  });

  it('propagates null per row independently (mixed ok/bad/ok)', () => {
    const out = computeTimeDecompositionColumns(
      [{ Date: '2025-01-15' }, { Date: 'banana' }, { Date: '2025-12-31' }],
      binding({ dimensions: ['year'] })
    );
    expect(out['Date.year']).toEqual(['2025', null, '2025']);
  });

  it('returns null for all dimensions when source column is missing', () => {
    const out = computeTimeDecompositionColumns(
      [{ OtherCol: 5 }],
      binding({ dimensions: ['year', 'quarter'] })
    );
    expect(out['Date.year']).toEqual([null]);
    expect(out['Date.quarter']).toEqual([null]);
  });

  it('formats hour at granularity 60 as "HH:00"', () => {
    const out = computeTimeDecompositionColumns(
      [{ Date: '2025-01-15T14:30:00Z' }],
      binding({ dimensions: ['hour'], hourGranularityMinutes: 60 })
    );
    expect(out['Date.hour']).toHaveLength(1);
    expect(out['Date.hour'][0]).toMatch(/^\d{2}:00$/);
  });

  it('formats hour at granularity 15 under hour-15min key', () => {
    const out = computeTimeDecompositionColumns(
      [{ Date: '2025-01-15T14:30:00Z' }],
      binding({ dimensions: ['hour'], hourGranularityMinutes: 15 })
    );
    expect(Object.keys(out)).toEqual(['Date.hour-15min']);
    expect(out['Date.hour-15min']).toHaveLength(1);
    expect(out['Date.hour-15min'][0]).not.toBeNull();
  });

  it('formats hour at granularity 5 under hour-5min key', () => {
    const out = computeTimeDecompositionColumns(
      [{ Date: '2025-01-15T14:30:00Z' }],
      binding({ dimensions: ['hour'], hourGranularityMinutes: 5 })
    );
    expect(Object.keys(out)).toEqual(['Date.hour-5min']);
  });

  it('parses Excel serial date numbers', () => {
    // Excel serial 45672 = 2025-01-15 (UTC)
    const out = computeTimeDecompositionColumns(
      [{ Date: 45672 }],
      binding({ dimensions: ['year'] })
    );
    expect(out['Date.year'][0]).toBe('2025');
  });

  it('parses Unix epoch ms', () => {
    const ms = new Date('2025-04-20').getTime();
    const out = computeTimeDecompositionColumns(
      [{ Date: ms }],
      binding({ dimensions: ['quarter'] })
    );
    expect(out['Date.quarter'][0]).toBe('Q2');
  });

  it('handles all 6 dimensions in one pass', () => {
    const out = computeTimeDecompositionColumns(
      [{ Date: '2025-04-15T09:00:00Z' }],
      binding({ dimensions: ['year', 'quarter', 'month', 'week', 'dayOfWeek', 'hour'] })
    );
    expect(out['Date.year'][0]).toBe('2025');
    expect(out['Date.quarter'][0]).toBe('Q2');
    expect(out['Date.month'][0]).not.toBeNull();
    expect(out['Date.week'][0]).not.toBeNull();
    expect(out['Date.day-of-week'][0]).not.toBeNull();
    expect(out['Date.hour'][0]).not.toBeNull();
  });
});
