import type { DataRow } from '../types';
import type {
  ColumnParsingProfile,
  ParsingInterpretation,
  ParsingStatus,
  ParsingAlternative,
} from './types';

/**
 * Profile every column in the dataset for parsing confidence + alternatives.
 * Pure function — runs deterministically on raw cell values.
 *
 * Architecture: collects every interpretation that parses ≥ 1 non-null value
 * from each detection lane (ID → numeric → affix → date → categorical), picks
 * the candidate with the highest parseCount as `primary`, and reports the rest
 * as `alternatives` ranked by parseCount. Status downgrades to 'warning' when
 * parse rate < 70%, when a rival interpretation parses comparably (mixed
 * format), or when the top interpretation is an ambiguous slash-date.
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
// Detection lane 4: categorical (low-cardinality string columns)
// ---------------------------------------------------------------------------

function detectCategorical(
  values: unknown[]
): { label: string; detail: Record<string, unknown> } | null {
  const strings = values
    .filter((v): v is string | number | boolean => v !== null && v !== undefined)
    .map(v => String(v));
  if (strings.length === 0) return null;
  const unique = new Set(strings);
  const uniqueCount = unique.size;
  // Categorical heuristic: ≤ 30 distinct values AND ratio of unique/total ≤ 0.5
  // (catches "A,B,A,C,B,A" but not unique IDs or free-text columns).
  if (uniqueCount > 30) return null;
  if (uniqueCount > strings.length * 0.5) return null;
  return {
    label: `categorical · ${uniqueCount} levels`,
    detail: { levels: Array.from(unique) },
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

  // Gather every interpretation that parses ≥ 1 value, with its parseCount.
  const candidates: Array<{
    interpretation: ParsingInterpretation;
    parseCount: number;
    transform?: (raw: string) => string;
  }> = [];

  // ID first — leading-zero strings ("001") must beat plain-numeric detection.
  const idMatch = detectIdHeuristic(nonNull);
  if (idMatch) {
    candidates.push({
      interpretation: { kind: 'id', label: idMatch.label, detail: idMatch.detail },
      parseCount: nonNull.length,
    });
  }

  // Numeric (plain / EU / US)
  const numericMatches = detectNumericFormat(nonNull);
  for (const m of numericMatches) {
    const format: NumericFormat =
      m.detail.decimalSeparator === ','
        ? 'eu'
        : m.detail.thousandsSeparator === ','
          ? 'us'
          : 'plain';
    candidates.push({
      interpretation: { kind: 'numeric', label: m.label, detail: m.detail },
      parseCount: m.parsed,
      transform: raw => {
        const parsed = tryParseNumeric(raw, format);
        return parsed === null ? raw : String(parsed);
      },
    });
  }

  // Affix-stripping numeric ($, %, parens)
  const affix = detectAffix(nonNull);
  if (affix) {
    candidates.push({
      interpretation: { kind: 'numeric', label: affix.label, detail: affix.detail },
      parseCount: affix.parseCount,
      transform: affix.transform,
    });
  }

  // Dates (ISO + slash variants)
  const dateMatches = detectDateFormat(nonNull);
  for (const d of dateMatches) {
    candidates.push({
      interpretation: {
        kind: 'date',
        label: d.label,
        detail: { format: d.format, ambiguous: d.ambiguous },
      },
      parseCount: d.parseCount,
      transform: raw => {
        const parsed = tryParseDate(raw, d.format);
        return parsed ? parsed.toISOString().slice(0, 10) : raw;
      },
    });
  }

  // No structured interpretation matched anything → try categorical / fall back to text.
  if (candidates.length === 0) {
    const cat = detectCategorical(nonNull);
    if (cat) {
      return {
        columnName,
        status: 'ok',
        confidence: 100,
        primary: { kind: 'categorical', label: cat.label, detail: cat.detail },
        alternatives: [],
        transformedSamples: [],
      };
    }
    return {
      columnName,
      status: 'ok',
      confidence: 100,
      primary: { kind: 'text', label: 'text', detail: {} },
      alternatives: [],
      transformedSamples: [],
    };
  }

  // Stable sort by parseCount desc. Order within ties is determined by the
  // iteration order above (ID first, then numeric formats in their array order,
  // then affix, then dates).
  candidates.sort((a, b) => b.parseCount - a.parseCount);
  const top = candidates[0];
  const others = candidates.slice(1);

  const parseRate = top.parseCount / nonNull.length;
  const confidence = Math.round(parseRate * 100);

  // When all candidates are numeric and every one parses 100% of values, this
  // is the EU vs US ambiguous-comma case (e.g. "1,234" parses as both). Treat
  // as ok — the top format (US) is the correct tie-break, no genuine rivalry.
  const allNumericFullParse =
    top.interpretation.kind === 'numeric' &&
    parseRate === 1 &&
    others.every(o => o.interpretation.kind === 'numeric' && o.parseCount === nonNull.length);

  // Rival = another candidate within 1 of the top's parseCount (mixed-format territory).
  const hasRival = others.some(
    o => Math.abs(o.parseCount - top.parseCount) <= 1 && o.parseCount > 0
  );

  let status: ParsingStatus;
  if (parseRate < 0.7) {
    status = 'warning';
  } else if (hasRival && !allNumericFullParse) {
    status = 'warning';
  } else if (top.interpretation.kind === 'date' && top.interpretation.detail.ambiguous === true) {
    status = 'warning';
  } else {
    status = 'ok';
  }

  const sampleStrings = nonNull.filter((v): v is string => typeof v === 'string').slice(0, 3);
  const transformedSamples = top.transform
    ? sampleStrings.map(raw => ({ raw, transformed: top.transform!(raw) }))
    : [];

  const alternatives: ParsingAlternative[] = others.map(o => ({
    interpretation: o.interpretation,
    parseCount: o.parseCount,
    totalCount: nonNull.length,
  }));

  return {
    columnName,
    status,
    confidence,
    primary: top.interpretation,
    alternatives,
    transformedSamples,
  };
}
