import { describe, it, expect } from 'vitest';
import { formatStatistic, formatPercent, formatDate, formatInteger, formatPlural } from '../format';

describe('formatStatistic', () => {
  it('formats English numbers with period decimal separator', () => {
    expect(formatStatistic(1.33, 'en', 2)).toBe('1.33');
  });

  it('formats German numbers with comma decimal separator', () => {
    expect(formatStatistic(1.33, 'de', 2)).toBe('1,33');
  });

  it('formats French numbers with comma decimal separator', () => {
    expect(formatStatistic(1.33, 'fr', 2)).toBe('1,33');
  });

  it('formats Spanish numbers with comma decimal separator', () => {
    expect(formatStatistic(1.33, 'es', 2)).toBe('1,33');
  });

  it('formats Portuguese numbers with comma decimal separator', () => {
    expect(formatStatistic(1.33, 'pt', 2)).toBe('1,33');
  });

  it('defaults to English and 2 decimal places', () => {
    expect(formatStatistic(1.33)).toBe('1.33');
  });

  it('handles zero', () => {
    expect(formatStatistic(0, 'en', 2)).toBe('0.00');
  });

  it('handles negative values', () => {
    const result = formatStatistic(-1.5, 'de', 2);
    // German uses comma and may use different minus sign
    expect(result).toContain('1,50');
  });

  it('returns dash for NaN', () => {
    expect(formatStatistic(NaN)).toBe('—');
  });

  it('returns dash for Infinity', () => {
    expect(formatStatistic(Infinity)).toBe('—');
  });

  it('respects custom decimal places', () => {
    expect(formatStatistic(1.23456, 'en', 3)).toBe('1.235');
    expect(formatStatistic(1.23456, 'en', 0)).toBe('1');
  });

  it('formats large numbers with locale-appropriate thousands separator', () => {
    const enResult = formatStatistic(1234.56, 'en', 2);
    expect(enResult).toBe('1,234.56');

    const deResult = formatStatistic(1234.56, 'de', 2);
    expect(deResult).toBe('1.234,56');
  });
});

describe('formatPercent', () => {
  it('formats English percentages', () => {
    const result = formatPercent(0.955, 'en', 1);
    expect(result).toBe('95.5%');
  });

  it('formats German percentages with comma', () => {
    const result = formatPercent(0.955, 'de', 1);
    // German uses comma and may add space before %
    expect(result).toContain('95,5');
    expect(result).toContain('%');
  });

  it('returns dash for NaN', () => {
    expect(formatPercent(NaN)).toBe('—');
  });

  it('defaults to 1 decimal place', () => {
    const result = formatPercent(0.5, 'en');
    expect(result).toBe('50.0%');
  });
});

describe('formatDate', () => {
  const date = new Date(2026, 2, 17); // March 17, 2026

  it('formats English medium date', () => {
    const result = formatDate(date, 'en', 'medium');
    expect(result).toContain('Mar');
    expect(result).toContain('17');
    expect(result).toContain('2026');
  });

  it('formats German medium date', () => {
    const result = formatDate(date, 'de', 'medium');
    expect(result).toContain('17');
    expect(result).toContain('2026');
  });

  it('formats short dates', () => {
    const result = formatDate(date, 'en', 'short');
    expect(result).toContain('17');
  });
});

describe('formatInteger', () => {
  it('formats English integers with commas', () => {
    expect(formatInteger(1234, 'en')).toBe('1,234');
  });

  it('formats German integers with periods', () => {
    expect(formatInteger(1234, 'de')).toBe('1.234');
  });

  it('rounds to nearest integer', () => {
    expect(formatInteger(1234.7, 'en')).toBe('1,235');
  });

  it('returns dash for NaN', () => {
    expect(formatInteger(NaN)).toBe('—');
  });
});

describe('formatPlural', () => {
  const enForms = { one: 'investigation', other: 'investigations' };

  it('returns the singular form for count=1 in English', () => {
    expect(formatPlural(1, enForms, 'en')).toBe('investigation');
  });

  it('returns the plural form for count=2 in English', () => {
    expect(formatPlural(2, enForms, 'en')).toBe('investigations');
  });

  it('returns the plural form for count=0 in English', () => {
    expect(formatPlural(0, enForms, 'en')).toBe('investigations');
  });

  it('handles negative counts via Math.abs (English)', () => {
    expect(formatPlural(-1, enForms, 'en')).toBe('investigation');
  });

  it('honors the language plural rule (Polish has a "few" form)', () => {
    const plForms = {
      one: 'inwestygacja',
      few: 'inwestygacje',
      many: 'inwestygacji',
      other: 'inwestygacji',
    };
    // Polish: 'one' for 1, 'few' for 2-4, 'many' for 0/5+
    expect(formatPlural(1, plForms, 'pl')).toBe('inwestygacja');
    expect(formatPlural(3, plForms, 'pl')).toBe('inwestygacje');
    expect(formatPlural(5, plForms, 'pl')).toBe('inwestygacji');
  });

  it('falls back to "other" when the matched form is missing', () => {
    expect(formatPlural(3, { other: 'items' }, 'pl')).toBe('items');
  });
});
