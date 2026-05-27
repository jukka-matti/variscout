import type { ColumnParsingProfile } from '../../parser/types';

/**
 * Result of the batch-data detection heuristic.
 *
 * Captures which numeric columns carry mass-shaped names that imply
 * an input/output mass-balance pattern (e.g. kg in → kg grade-A + kg scrap).
 */
export interface BatchDataResult {
  inputColumns: string[];
  outputColumns: string[];
  scrapColumns: string[];
  isLikelyBatch: boolean;
}

/**
 * Regex that identifies a "mass-shaped" column name.
 * Matches a unit suffix immediately after an underscore at a word boundary:
 * _kg, _g, _lb, _units, _tonne, _tonnes
 * Word boundary ensures `_kg_ratio` still matches (suffix present) but `_kgrams` does NOT.
 */
const MASS_SUFFIX_RE = /_(kg|g|lb|units|tonnes?)\b/i;

/**
 * Scans column profiles for input/output mass-balance patterns and returns a
 * `BatchDataResult` when both input and output sides are detected, or `null`
 * when the signal is insufficient.
 *
 * Algorithm:
 * 1. Filter to profiles whose `primary.kind === 'numeric'`.
 * 2. Among those, filter to names matching the mass-suffix regex.
 * 3. Bucket by keyword (case-insensitive):
 *    - inputColumns  : name contains "input"
 *    - outputColumns : name contains "output" or "grade"
 *    - scrapColumns  : name contains "scrap", "waste", or "loss"
 * 4. Precedence: "input" wins over all others if a name matches multiple keywords.
 *    In practice the keywords are mutually exclusive; precedence is a safety net.
 * 5. Returns null when inputColumns or outputColumns is empty (not enough signal).
 */
export function detectBatchData(profiles: ColumnParsingProfile[]): BatchDataResult | null {
  const numericMassShaped = profiles.filter(
    p => p.primary?.kind === 'numeric' && MASS_SUFFIX_RE.test(p.columnName)
  );

  const inputColumns: string[] = [];
  const outputColumns: string[] = [];
  const scrapColumns: string[] = [];

  for (const profile of numericMassShaped) {
    const lower = profile.columnName.toLowerCase();

    // Input takes highest precedence
    if (lower.includes('input')) {
      inputColumns.push(profile.columnName);
    } else if (lower.includes('output') || lower.includes('grade')) {
      outputColumns.push(profile.columnName);
    } else if (lower.includes('scrap') || lower.includes('waste') || lower.includes('loss')) {
      scrapColumns.push(profile.columnName);
    }
  }

  if (inputColumns.length === 0 || outputColumns.length === 0) {
    return null;
  }

  return {
    inputColumns,
    outputColumns,
    scrapColumns,
    isLikelyBatch: true,
  };
}
