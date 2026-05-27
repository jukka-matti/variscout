import type { DataRow } from '../types';
import type { ColumnParsingProfile, ParsingInterpretation } from './types';

/**
 * Profile every column in the dataset for parsing confidence + alternatives.
 * Pure function — runs deterministically on raw cell values.
 *
 * Detection lanes (in priority order): numeric formats (plain / EU / US),
 * date formats, affix-stripping, ID heuristics, categorical. Each lane lands
 * across Tasks 3–6 of the B2.1 sub-plan.
 */
export function profileColumns(rows: DataRow[]): ColumnParsingProfile[] {
  if (rows.length === 0) return [];
  const columnNames = collectColumnNames(rows);
  return columnNames.map(columnName => profileOneColumn(columnName, rows));
}

function collectColumnNames(rows: DataRow[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      seen.add(key);
    }
  }
  return Array.from(seen);
}

interface NumericInterpretationDetail extends Record<string, unknown> {
  decimalSeparator: '.' | ',';
  thousandsSeparator?: ',' | '.' | ' ';
  hasDecimals: boolean;
}

interface NumericMatch {
  label: string;
  detail: NumericInterpretationDetail;
  parsed: number;
}

type NumericFormat = 'plain' | 'eu' | 'us';

function tryParseNumeric(value: unknown, format: NumericFormat): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;

  if (format === 'plain') {
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  if (format === 'eu') {
    // EU decimal: optional thousands ".", decimal ",". Examples: "1.234,5", "182,5", "100".
    if (!/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(trimmed) && !/^-?\d+(,\d+)?$/.test(trimmed))
      return null;
    const normalised = trimmed.replace(/\./g, '').replace(',', '.');
    const n = Number(normalised);
    return Number.isFinite(n) ? n : null;
  }
  // 'us' — optional thousands ",", decimal ".". Examples: "1,234.5", "987.6", "100".
  if (!/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(trimmed) && !/^-?\d+(\.\d+)?$/.test(trimmed))
    return null;
  const normalised = trimmed.replace(/,/g, '');
  const n = Number(normalised);
  return Number.isFinite(n) ? n : null;
}

function detectNumericFormat(values: unknown[]): NumericMatch[] {
  const formats: NumericFormat[] = ['plain', 'us', 'eu'];
  const matches: NumericMatch[] = [];
  for (const format of formats) {
    let parseCount = 0;
    let anyDecimal = false;
    for (const v of values) {
      const n = tryParseNumeric(v, format);
      if (n !== null) {
        parseCount++;
        if (typeof v === 'string' && /[.,]\d+$/.test(v.trim())) anyDecimal = true;
      }
    }
    if (parseCount === 0) continue;
    const label =
      format === 'plain'
        ? anyDecimal
          ? 'numeric · plain'
          : 'numeric · plain integer'
        : format === 'eu'
          ? 'numeric · EU decimal'
          : 'numeric · US format';
    matches.push({
      label,
      detail: {
        decimalSeparator: format === 'eu' ? ',' : '.',
        thousandsSeparator: format === 'eu' ? '.' : format === 'us' ? ',' : undefined,
        hasDecimals: anyDecimal,
      },
      parsed: parseCount,
    });
  }
  matches.sort((a, b) => b.parsed - a.parsed);
  return matches;
}

// ---------------------------------------------------------------------------
// Detection lane 2: date formats (ISO + slash variants)
// ---------------------------------------------------------------------------

type DateFormat = 'iso' | 'ddmmyyyy' | 'mmddyyyy';

interface DateMatch {
  format: DateFormat;
  label: string;
  parseCount: number;
  ambiguous: boolean;
}

function tryParseDate(value: unknown, format: DateFormat): Date | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (format === 'iso') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!m) return null;
    const [, y, mo, d] = m;
    const year = Number(y);
    const month = Number(mo);
    const day = Number(d);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    // Reject Date-constructor silent overflow (e.g. month 13 → Jan next year).
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return date;
  }
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!slash) return null;
  const [, a, b, y] = slash;
  const year = Number(y);
  const day = format === 'ddmmyyyy' ? Number(a) : Number(b);
  const month = format === 'ddmmyyyy' ? Number(b) : Number(a);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  // Same overflow guard for invalid day-of-month (e.g. 30/02).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function detectDateFormat(values: unknown[]): DateMatch[] {
  const matches: DateMatch[] = [];
  const formats: Array<{ key: DateFormat; label: string }> = [
    { key: 'iso', label: 'ISO date (YYYY-MM-DD)' },
    { key: 'ddmmyyyy', label: 'DD/MM/YYYY' },
    { key: 'mmddyyyy', label: 'MM/DD/YYYY' },
  ];
  const slashPattern = /^(\d{1,2})\/(\d{1,2})\/\d{4}$/;
  for (const { key, label } of formats) {
    let parseCount = 0;
    let firstPositionMax = 0;
    let secondPositionMax = 0;
    for (const v of values) {
      const d = tryParseDate(v, key);
      if (d !== null) parseCount++;
      if (typeof v === 'string') {
        const slash = slashPattern.exec(v.trim());
        if (slash) {
          firstPositionMax = Math.max(firstPositionMax, Number(slash[1]));
          secondPositionMax = Math.max(secondPositionMax, Number(slash[2]));
        }
      }
    }
    if (parseCount === 0) continue;
    // Slash formats are ambiguous when neither position contains a value > 12.
    const ambiguous = key !== 'iso' && firstPositionMax <= 12 && secondPositionMax <= 12;
    matches.push({ format: key, label, parseCount, ambiguous });
  }
  matches.sort((a, b) => b.parseCount - a.parseCount);
  return matches;
}

// ---------------------------------------------------------------------------
// Detection lane 1b: numeric with affix ($, %, parens)
// ---------------------------------------------------------------------------

interface AffixMatch {
  label: string;
  detail: Record<string, unknown>;
  parseCount: number;
  transform: (raw: string) => string;
}

function detectAffix(values: unknown[]): AffixMatch | null {
  const strings = values.filter((v): v is string => typeof v === 'string').map(v => v.trim());
  if (strings.length === 0) return null;

  // Currency prefix: $ € £
  const currencyMatch = strings.every(s => /^[$€£]\s?-?[\d.,]+$/.test(s));
  if (currencyMatch) {
    const prefix = strings[0][0];
    return {
      label: `numeric · ${prefix} prefix`,
      detail: { stripPrefix: prefix, decimalSeparator: '.' },
      parseCount: strings.length,
      transform: raw => {
        const cleaned = raw.replace(/^[$€£]\s?/, '').replace(/,/g, '');
        const n = Number(cleaned);
        return Number.isFinite(n) ? String(n) : raw;
      },
    };
  }

  // Percent suffix
  if (strings.every(s => /^-?[\d.,]+%$/.test(s))) {
    return {
      label: 'numeric · % suffix',
      detail: { stripSuffix: '%' },
      parseCount: strings.length,
      transform: raw => {
        const cleaned = raw.replace(/%$/, '').replace(/,/g, '');
        const n = Number(cleaned);
        return Number.isFinite(n) ? String(n) : raw;
      },
    };
  }

  // Parens for negatives (accounting): (45) → -45. Mixed with plain integers OK.
  const parensOrPlain = strings.every(s => /^(\(\d+(?:\.\d+)?\)|-?\d+(?:\.\d+)?)$/.test(s));
  const anyParens = strings.some(s => /^\(\d/.test(s));
  if (parensOrPlain && anyParens) {
    return {
      label: 'numeric · parens negative',
      detail: { parensNegative: true },
      parseCount: strings.length,
      transform: raw => {
        const m = /^\((\d+(?:\.\d+)?)\)$/.exec(raw);
        if (m) return `-${Number(m[1])}`;
        const n = Number(raw);
        return Number.isFinite(n) ? String(n) : raw;
      },
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Detection lane 3: ID heuristic (leading-zero numeric OR alphanumeric fixed-width)
// ---------------------------------------------------------------------------

function detectIdHeuristic(
  values: unknown[]
): { label: string; detail: Record<string, unknown> } | null {
  const strings = values.filter((v): v is string => typeof v === 'string').map(v => v.trim());
  if (strings.length < 3 || strings.length !== values.length) return null;

  // Pattern A: leading zeros + same width + all numeric content
  const allFixedWidthNumeric =
    strings.every(s => /^\d+$/.test(s)) &&
    strings.every(s => s.length === strings[0].length) &&
    strings.some(s => s.startsWith('0'));

  // Pattern B: alphanumeric prefix + numeric suffix (fixed-width)
  const alphaPrefixMatch = strings[0].match(/^([A-Za-z]+)(\d+)$/);
  const allAlphanumeric =
    alphaPrefixMatch !== null &&
    strings.every(s => {
      const m = s.match(/^([A-Za-z]+)(\d+)$/);
      return (
        m !== null && m[1] === alphaPrefixMatch[1] && m[2].length === alphaPrefixMatch[2].length
      );
    });

  if (!allFixedWidthNumeric && !allAlphanumeric) return null;

  const uniqueCount = new Set(strings).size;
  return {
    label: `id · ${uniqueCount} unique`,
    detail: {
      pattern: allAlphanumeric ? 'alphanumeric-fixed-width' : 'numeric-leading-zero',
      width: strings[0].length,
    },
  };
}

// ---------------------------------------------------------------------------

function profileOneColumn(columnName: string, rows: DataRow[]): ColumnParsingProfile {
  const allValues = rows.map(r => r[columnName]);
  // '' represents a missing CSV cell (Papa Parse default); exclude alongside null/undefined.
  const nonNull = allValues.filter(v => v !== null && v !== undefined && v !== '');

  if (nonNull.length === 0) {
    return {
      columnName,
      status: 'error',
      confidence: 0,
      primary: null,
      alternatives: [],
      transformedSamples: [],
    };
  }

  // Detection lane 0: ID columns (leading-zero numeric OR alphanumeric fixed-width).
  // Must run before numeric so leading-zero strings ("001") are not captured as integers.
  const idMatch = detectIdHeuristic(nonNull);
  if (idMatch) {
    const primary: ParsingInterpretation = {
      kind: 'id',
      label: idMatch.label,
      detail: idMatch.detail,
    };
    return {
      columnName,
      status: 'ok',
      confidence: 100,
      primary,
      alternatives: [],
      transformedSamples: [],
    };
  }

  // Detection lane 1: pure numeric (plain / EU / US)
  const numericMatches = detectNumericFormat(nonNull);
  if (numericMatches.length > 0 && numericMatches[0].parsed === nonNull.length) {
    const top = numericMatches[0];
    const primary: ParsingInterpretation = {
      kind: 'numeric',
      label: top.label,
      detail: top.detail,
    };
    const sampleStrings = nonNull.filter((v): v is string => typeof v === 'string').slice(0, 3);
    const format: NumericFormat =
      top.detail.decimalSeparator === ','
        ? 'eu'
        : top.detail.thousandsSeparator === ','
          ? 'us'
          : 'plain';
    const transformedSamples = sampleStrings.map(raw => {
      const parsed = tryParseNumeric(raw, format);
      return { raw, transformed: parsed === null ? raw : String(parsed) };
    });
    return {
      columnName,
      status: 'ok',
      confidence: 100,
      primary,
      alternatives: [],
      transformedSamples,
    };
  }

  // Detection lane 1b: numeric with affix ($, %, parens)
  const affix = detectAffix(nonNull);
  if (affix && affix.parseCount === nonNull.length) {
    const primary: ParsingInterpretation = {
      kind: 'numeric',
      label: affix.label,
      detail: affix.detail,
    };
    const sampleStrings = nonNull.filter((v): v is string => typeof v === 'string').slice(0, 3);
    const transformedSamples = sampleStrings.map(raw => ({
      raw,
      transformed: affix.transform(raw),
    }));
    return {
      columnName,
      status: 'ok',
      confidence: 100,
      primary,
      alternatives: [],
      transformedSamples,
    };
  }

  // Detection lane 2: dates (ISO + DD/MM + MM/DD)
  const dateMatches = detectDateFormat(nonNull);
  if (dateMatches.length > 0 && dateMatches[0].parseCount === nonNull.length) {
    // ISO is preferred when it parses everything; otherwise pick the unambiguous slash format.
    const iso = dateMatches.find(m => m.format === 'iso');
    const unambiguousSlash = dateMatches.find(m => m.format !== 'iso' && !m.ambiguous);
    const top = iso ?? unambiguousSlash ?? dateMatches[0];
    const primary: ParsingInterpretation = {
      kind: 'date',
      label: top.label,
      detail: { format: top.format, ambiguous: top.ambiguous },
    };
    const sampleStrings = nonNull.filter((v): v is string => typeof v === 'string').slice(0, 3);
    const transformedSamples = sampleStrings.map(raw => {
      const parsed = tryParseDate(raw, top.format);
      return { raw, transformed: parsed ? parsed.toISOString().slice(0, 10) : raw };
    });
    return {
      columnName,
      status: top.ambiguous ? 'warning' : 'ok',
      confidence: 100,
      primary,
      alternatives: [],
      transformedSamples,
    };
  }

  // Detection lane 4+ (categorical) lands in Task 6.
  // Anything not matched above falls through to a text placeholder.
  return {
    columnName,
    status: 'ok',
    confidence: 100,
    primary: { kind: 'text', label: 'text', detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}
