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

  // Detection lanes 2–4 (affix, date, ID, categorical) land in Tasks 4–6.
  // Until then, anything not pure numeric falls through to a text placeholder.
  return {
    columnName,
    status: 'ok',
    confidence: 100,
    primary: { kind: 'text', label: 'text', detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}
