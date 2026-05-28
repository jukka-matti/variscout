import type { ColumnParsingProfile } from '@variscout/core/parser';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';

/**
 * Ghost suggestion role for a palette column chip.
 * - 'outcome' — system detects an outcome-metric naming pattern
 * - 'factor'  — numeric column with sufficient confidence; no outcome-metric pattern
 * - null      — column is already bound, non-numeric, low confidence, or non-ok status
 */
export type SuggestedRole = 'outcome' | 'factor' | null;

/**
 * Input for useGhostSuggestions.
 *
 * NOTE on stepBindingColumns — there is no dedicated StepBinding type in @variscout/core
 * as of 2026-05-28. The spec called this "StepBinding" but the actual model distributes
 * step association across ImprovementProjectOutcomeGoal.stepId and
 * ImprovementProjectFactorControl.stepId. CanvasWorkspace passes an empty array for now;
 * the field is a string[] of column names for forward-compatibility when a unified
 * StepBinding type is introduced. Documented in decision-log as deferred V2 item.
 */
export interface UseGhostSuggestionsInput {
  columnProfiles: ReadonlyArray<ColumnParsingProfile>;
  outcomeSpecs: ReadonlyArray<OutcomeSpec>;
  factorControls: ReadonlyArray<ImprovementProjectFactorControl>;
  /**
   * Column names already bound to process steps. No dedicated StepBinding type exists
   * in core yet — callers pass the extracted column names directly (or an empty array
   * as a graceful fallback). See UseGhostSuggestionsInput JSDoc for context.
   */
  stepBindingColumns: ReadonlyArray<string>;
}

/**
 * Pattern that identifies outcome-metric column names.
 * Matches any of: _yield | _defect_rate | _cpk | _throughput at end of string.
 * Case-insensitive via the `i` flag.
 */
const OUTCOME_SUFFIX_RE = /(_yield|_defect_rate|_cpk|_throughput)$/i;

/** Minimum confidence (whole percent, 0–100) for a column to be ghost-suggested. */
const MIN_CONFIDENCE = 80;

/**
 * Pure derivation: maps each column profile to a ghost-suggested role.
 *
 * Bound columns (already in outcomeSpecs, factorControls, or stepBindingColumns)
 * always return null — we only suggest roles for unbound columns.
 *
 * For unbound numeric columns with status='ok' and confidence >= MIN_CONFIDENCE:
 * - Name matches OUTCOME_SUFFIX_RE → 'outcome'
 * - Otherwise → 'factor'
 *
 * All other cases (categorical, date, id, text, low confidence, non-ok) → null.
 *
 * Returns a Record<columnName, SuggestedRole> keyed by columnName.
 */
export function useGhostSuggestions(
  input: UseGhostSuggestionsInput
): Record<string, SuggestedRole> {
  const { columnProfiles, outcomeSpecs, factorControls, stepBindingColumns } = input;

  // Build the set of column names that are already bound (no suggestion needed)
  const boundColumns = new Set<string>();
  for (const spec of outcomeSpecs) {
    boundColumns.add(spec.columnName);
  }
  for (const control of factorControls) {
    boundColumns.add(control.factor);
  }
  for (const col of stepBindingColumns) {
    boundColumns.add(col);
  }

  const result: Record<string, SuggestedRole> = {};

  for (const p of columnProfiles) {
    if (boundColumns.has(p.columnName)) {
      result[p.columnName] = null;
      continue;
    }

    if (p.primary?.kind === 'numeric' && p.status === 'ok' && p.confidence >= MIN_CONFIDENCE) {
      result[p.columnName] = OUTCOME_SUFFIX_RE.test(p.columnName) ? 'outcome' : 'factor';
    } else {
      result[p.columnName] = null;
    }
  }

  return result;
}
