import type { FormulaBinding, FormulaTerm } from './types';

/**
 * Evaluate a formula for a single row.
 *
 * This is a per-row derived-column evaluator (mirroring `computeLeadTimeColumn`
 * in `../leadTime.ts`), not a stats function. NaN signals "this row's value is
 * missing or undefined"; consumers like `computeFormulaColumn` keep the array
 * dense and downstream consumers (CanvasWorkspace's `numericValuesByColumn`)
 * filter NaN via `Number.isFinite` before display. The `number | undefined`
 * rule in `packages/core/CLAUDE.md` is scoped to stats functions (mean, stdev,
 * capability indices) whose outputs flow directly to `formatStatistic`.
 *
 * Returns NaN when:
 * - Any column referenced is missing from row AND augmentedColumns
 * - Any referenced cell value is not coercible to a finite number
 * - Denominator (non-empty) sums to zero (division by zero)
 *
 * String values that `Number(value)` resolves to a finite number ARE coerced
 * (e.g. '5.5' → 5.5). Empty strings, null, undefined, and non-numeric strings
 * propagate NaN.
 *
 * Empty numerator AND empty denominator → 0 × multiplier = 0. Empty denominator
 * alone → numeratorSum × multiplier (no division performed).
 */
export function evaluateFormulaRow(
  row: Record<string, unknown>,
  binding: FormulaBinding,
  augmentedColumns: Record<string, number[]>,
  rowIndex: number
): number {
  const numSum = sumTerms(binding.numerator, row, augmentedColumns, rowIndex);
  if (Number.isNaN(numSum)) return NaN;

  if (binding.denominator.length === 0) {
    return numSum * binding.multiplier;
  }

  const denSum = sumTerms(binding.denominator, row, augmentedColumns, rowIndex);
  if (Number.isNaN(denSum)) return NaN;
  if (denSum === 0) return NaN; // division-by-zero

  return (numSum / denSum) * binding.multiplier;
}

function sumTerms(
  terms: FormulaTerm[],
  row: Record<string, unknown>,
  augmentedColumns: Record<string, number[]>,
  rowIndex: number
): number {
  let sum = 0;
  for (const term of terms) {
    if (term.kind === 'constant') {
      sum += term.value;
      continue;
    }
    // term.kind === 'column'
    const resolved = resolveCellValue(term.column, row, augmentedColumns, rowIndex);
    if (Number.isNaN(resolved)) return NaN;
    sum += term.sign === '-' ? -resolved : resolved;
  }
  return sum;
}

function resolveCellValue(
  column: string,
  row: Record<string, unknown>,
  augmentedColumns: Record<string, number[]>,
  rowIndex: number
): number {
  // Row takes precedence; fall back to augmentedColumns
  if (Object.prototype.hasOwnProperty.call(row, column)) {
    const raw = row[column];
    if (raw === null || raw === undefined || raw === '') return NaN;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }
  const augmented = augmentedColumns[column];
  if (augmented !== undefined && rowIndex < augmented.length) {
    const v = augmented[rowIndex];
    return Number.isFinite(v) ? v : NaN;
  }
  return NaN;
}
