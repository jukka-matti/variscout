import type { FormulaBinding, FormulaTerm } from '@variscout/core';
import { evaluateFormulaRow } from '@variscout/core';

/**
 * Locale-format a number with up to 2 decimal places (en-US).
 * Produces commas for thousands separators: 1000000 → "1,000,000".
 */
function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Resolve a column term's value for display substitution.
 * Returns the numeric value as a string (e.g. "85"), or "—" when missing/NaN.
 */
function resolveTermDisplay(
  term: FormulaTerm,
  row: Record<string, unknown>,
  augmentedColumns: Record<string, number[]>,
  rowIndex: number
): string {
  if (term.kind === 'constant') {
    return fmtNum(term.value);
  }
  // Try row first
  if (Object.prototype.hasOwnProperty.call(row, term.column)) {
    const raw = row[term.column];
    if (raw === null || raw === undefined || raw === '') return '—';
    const n = Number(raw);
    if (!Number.isFinite(n)) return '—';
    return fmtNum(n);
  }
  // Fall back to augmentedColumns
  const aug = augmentedColumns[term.column];
  if (aug !== undefined && rowIndex < aug.length) {
    const v = aug[rowIndex];
    if (Number.isFinite(v)) return fmtNum(v);
  }
  return '—';
}

/**
 * Build an expression string for a list of terms (numerator or denominator).
 *
 * Examples:
 *   [A:+, B:+] → "85 + 10"
 *   [A:+, B:-] → "85 - 10"
 *   [A:+]      → "85"
 */
function buildTermsExpression(
  terms: FormulaTerm[],
  row: Record<string, unknown>,
  augmentedColumns: Record<string, number[]>,
  rowIndex: number
): string {
  if (terms.length === 0) return '—';

  const parts: string[] = [];
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    const display = resolveTermDisplay(term, row, augmentedColumns, rowIndex);
    if (i === 0) {
      // First term: sign only shown if negative column term
      if (term.kind === 'column' && term.sign === '-') {
        parts.push(`-${display}`);
      } else {
        parts.push(display);
      }
    } else {
      // Subsequent terms: show sign as operator
      const sign = term.kind === 'column' ? term.sign : '+';
      parts.push(sign === '-' ? `- ${display}` : `+ ${display}`);
    }
  }
  return parts.join(' ');
}

/**
 * Render a single sample row's formula evaluation as readable text.
 *
 * Format:
 *   - Ratio with multiple numerator terms: "(85 + 10) / 100 × 100 = 95.0"
 *   - Numerator-only (no denominator):     "5 × 100 = 500.0" or "5 = 5.0"
 *   - NaN result renders "... = —"
 *   - Multiplier is omitted when === 1 (not shown as "× 1")
 *   - Numbers locale-formatted with commas (en-US)
 *
 * Decisions:
 *   - Multiplier=1 is OMITTED (e.g. "5 = 5.0" NOT "5 × 1 = 5.0")
 *   - Numerator-only with multiplier=1: "5 = 5.0"
 *   - Single-term numerator with denominator: "5 / 100 × 1,000,000 = 50,000.0"
 *   - Multi-term numerator wraps in parens: "(85 + 10) / 100 × 100 = 95.0"
 *
 * Pure function — no side effects.
 */
export function formatFormulaPreview(
  binding: FormulaBinding,
  row: Record<string, unknown>,
  rowIndex: number,
  augmentedColumns: Record<string, number[]> = {}
): string {
  const numExpr = buildTermsExpression(binding.numerator, row, augmentedColumns, rowIndex);
  const hasDenominator = binding.denominator.length > 0;
  const hasMultiplier = binding.multiplier !== 1;

  // Wrap numerator in parens when it has multiple terms AND there is a denominator
  const multipleNumeratorTerms = binding.numerator.length > 1;
  const numeratorStr = multipleNumeratorTerms && hasDenominator ? `(${numExpr})` : numExpr;

  // Build the left-hand expression
  let lhs: string;
  if (hasDenominator) {
    const denExpr = buildTermsExpression(binding.denominator, row, augmentedColumns, rowIndex);
    lhs = hasMultiplier
      ? `${numeratorStr} / ${denExpr} × ${fmtNum(binding.multiplier)}`
      : `${numeratorStr} / ${denExpr}`;
  } else {
    lhs = hasMultiplier ? `${numeratorStr} × ${fmtNum(binding.multiplier)}` : numeratorStr;
  }

  // Compute the result
  const result = evaluateFormulaRow(row, binding, augmentedColumns, rowIndex);
  const resultStr = Number.isFinite(result) ? fmtNum(result) : '—';

  return `${lhs} = ${resultStr}`;
}
