import { describe, it, expect } from 'vitest';
import { analyzeColumn, detectColumns } from '../detection';

describe('analyzeColumn date detection (FSJ-2 chrome-walk: dates must win over parseFloat-prefix numeric)', () => {
  // parseFloat('2026-05-01') === 2026, so before the fix every Excel-style date
  // column classified 'numeric' and the three declared datePatterns were unreachable
  // for their own target shapes. These pin the corrected precedence.

  it('classifies an ISO-date column as date, not numeric', () => {
    const data = [
      { Timestamp: '2026-05-01' },
      { Timestamp: '2026-05-02' },
      { Timestamp: '2026-05-03' },
    ];
    expect(analyzeColumn(data, 'Timestamp').type).toBe('date');
  });

  it('classifies an ISO-datetime column as date, not numeric', () => {
    const data = [
      { Timestamp: '2026-05-01T08:30:00' },
      { Timestamp: '2026-05-02T09:00:00' },
      { Timestamp: '2026-05-03T09:00:00' },
    ];
    expect(analyzeColumn(data, 'Timestamp').type).toBe('date');
  });

  it('classifies a US-format date column as date', () => {
    const data = [{ d: '05/01/2026' }, { d: '05/02/2026' }, { d: '05/03/2026' }];
    expect(analyzeColumn(data, 'd').type).toBe('date');
  });

  it('classifies a dash-format date column as date', () => {
    const data = [{ d: '01-05-2026' }, { d: '02-05-2026' }, { d: '03-05-2026' }];
    expect(analyzeColumn(data, 'd').type).toBe('date');
  });

  it('keeps a Mon DD YYYY text-date column as date via the Date.parse fallback', () => {
    const data = [{ d: 'May 01 2026' }, { d: 'May 02 2026' }, { d: 'May 03 2026' }];
    expect(analyzeColumn(data, 'd').type).toBe('date');
  });

  it('keeps a pure-numeric (decimal) column numeric', () => {
    const data = [{ x: '42.5' }, { x: '43.1' }, { x: '44.9' }];
    expect(analyzeColumn(data, 'x').type).toBe('numeric');
  });

  it('keeps a plain-integer-string column numeric (Date.parse must not swallow it)', () => {
    const data = [{ x: '42' }, { x: '43' }, { x: '44' }];
    expect(analyzeColumn(data, 'x').type).toBe('numeric');
  });

  it('pins current behavior: unit-suffixed strings ("42 mm") stay numeric (fix must not change this)', () => {
    // parseFloat('42 mm') === 42 → numeric; no date pattern matches and the
    // Date.parse fallback is gated on !isNumeric, so the fix is a no-op here.
    const data = [{ m: '42 mm' }, { m: '43 mm' }, { m: '44 mm' }];
    expect(analyzeColumn(data, 'm').type).toBe('numeric');
  });
});

describe('detectColumns with a measurement-shaped paste (Timestamp + numeric + categorical)', () => {
  const data = [
    { Timestamp: '2026-05-01', Cycle_Time_sec: 42.5, Step: 'Cut' },
    { Timestamp: '2026-05-02', Cycle_Time_sec: 43.1, Step: 'Weld' },
    { Timestamp: '2026-05-03', Cycle_Time_sec: 44.9, Step: 'Cut' },
  ];

  it('picks the ISO-date Timestamp column as the time column', () => {
    expect(detectColumns(data).timeColumn).toBe('Timestamp');
  });

  it('does NOT infer the date column as the outcome even though it is named "Timestamp"', () => {
    const result = detectColumns(data);
    expect(result.outcome).not.toBe('Timestamp');
    expect(result.outcome).toBe('Cycle_Time_sec');
  });
});

describe('detectColumns with goalContext biasing', () => {
  const data = [
    { weight_g: 4.5, defect_count: 0, oven_temp: 178 },
    { weight_g: 4.4, defect_count: 1, oven_temp: 180 },
  ];

  it('without goal context: prefers numeric outcome candidates by name keyword', () => {
    const result = detectColumns(data);
    expect(result.outcome).toBeTruthy();
  });

  it('with goal mentioning "weight": ranks weight_g higher', () => {
    const result = detectColumns(data, {
      goalContext: 'We mold barrels and customers care about weight accuracy.',
    });
    expect(result.outcome).toBe('weight_g');
  });

  it('with goal mentioning "defect": ranks defect_count higher', () => {
    const result = detectColumns(data, {
      goalContext: 'Reduce defect rate at our line.',
    });
    expect(result.outcome).toBe('defect_count');
  });
});
