/**
 * hypothesisTestPlan.ts — the hypothesis test-plan triad read-model + the
 * one-tap `evaluate` classification (Factors & Evaluation Increment 2a, spec §4).
 *
 * The triad is a DERIVED read-model (no new `Hypothesis` field, spec §2):
 *
 *   1. Relevant FACTORS — `deriveHypothesisFactors` (the cause's condition columns,
 *      falling back to its linked findings' filter columns). Same projection
 *      `mechanismBranch.deriveBranchColumns` computes today + discards at the UI.
 *   2. The auto-suggested analytical TOOL per factor's data type — categorical →
 *      boxplot + 2-sample comparison; continuous → scatter + regression; a spread
 *      question → capability (Cp/Cpk). The engine pre-picks; the analyst confirms.
 *   3. DATA-READINESS — `ready` (the column exists in the active data) → one-tap
 *      `evaluate`; `gap` (absent) → "+ Measurement Plan".
 *
 * `evaluateHypothesisFactor` runs the suggested test and classifies the result
 * into the EXISTING `Finding.validationStatus` semantics (spec §4, locked):
 *
 *   significant relationship consistent with the cause   → 'supports'
 *   significant + clearly counter (adverse)              → 'contradicts' (+ refutes)
 *   not significant                                      → 'inconclusive'
 *
 * The honesty rule (mirrors the IM-3 auto-link fix): a NON-significant result is
 * 'inconclusive' (routes to NOT-tested), NEVER 'supports' — so the Supported gate
 * stays honest. This module invents no new evidence model; it only computes the
 * `validationStatus` the Wall already reads (`mechanismBranch.ts:148-153`).
 *
 * The Supported/`needs-disconfirmation` gate enforces this end-to-end:
 * `evidenceTypesForHypothesis` (hypothesisEvidence.ts) EXCLUDES `'inconclusive'`
 * findings from the distinct-evidence-type set, so a null evaluate genuinely does
 * not count as evidence — a single inconclusive `data` finding plus one `gemba`
 * finding stays `evidenced`, it does not advance to `needs-disconfirmation`.
 *
 * Deterministic: no Date.now / Math.random / argless `new Date`.
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import { calculateAnova } from '../stats/anova';
import { getBestSingleFactor } from '../stats/bestSubsets';
import { classifyFactorType } from '../stats/factorTypeDetection';
import type { Finding, Hypothesis } from './types';
import { collectReferencedColumns } from './hypothesisCondition';

/** Significance threshold for the one-tap evaluate (confirmatory, p < .05). */
export const EVALUATE_SIGNIFICANCE_THRESHOLD = 0.05;

/**
 * The analytical tool the engine pre-picks from a factor's data type (spec §4):
 * - `two-sample` — categorical factor → boxplot + 2-sample comparison (ANOVA/t).
 * - `regression` — continuous factor → scatter + regression.
 * - `capability` — a spread question → capability (Cp/Cpk). Reserved; the V1
 *   triad auto-picks two-sample/regression from the factor's type. Callers may
 *   request `capability` explicitly for a spread-framed evaluate.
 */
export type AnalyticalTool = 'two-sample' | 'regression' | 'capability';

/** Per-factor data-readiness in the active dataset. */
export type FactorReadiness = 'ready' | 'gap';

/** One row of the hypothesis test-plan triad (a derived read-model entry). */
export interface HypothesisTestPlanFactor {
  /** The factor column. */
  factor: string;
  /** `ready` when the column is present in the active data; `gap` when absent. */
  readiness: FactorReadiness;
  /** The auto-suggested analytical tool (only meaningful when `ready`). */
  tool: AnalyticalTool | null;
}

/** The typed result of a one-tap evaluate, ready to attach as a Finding. */
export interface HypothesisFactorEvaluation {
  /** The factor that was evaluated. */
  factor: string;
  /** The tool that produced the result. */
  tool: AnalyticalTool;
  /** The test p-value (overall-F / regression / between-group). */
  pValue: number;
  /** Whether the relationship is statistically significant (p < threshold). */
  isSignificant: boolean;
  /**
   * The existing `Finding.validationStatus` classification (spec §4):
   * 'supports' (significant, consistent) | 'contradicts' (significant, adverse)
   * | 'inconclusive' (not significant → NOT-tested, never supporting).
   */
  validationStatus: 'supports' | 'contradicts' | 'inconclusive';
  /** Explicit refutation flag for the Survey gate — true only for adverse-significant. */
  refutes: boolean;
  /** Human-readable finding text using factor-side verbs ("accounts for the spread"). */
  findingText: string;
}

/**
 * Columns this hypothesis is "about" — the same projection
 * `mechanismBranch.deriveBranchColumns` computes (the cause's disconfirmable
 * `condition` columns, falling back to its linked findings' `activeFilters`
 * columns). Surfaced here as a public read-model so the card can render it
 * (today it is computed inside `projectMechanismBranch` + discarded).
 */
export function deriveHypothesisFactors(hub: Hypothesis, findings: Finding[]): string[] {
  if (hub.condition) {
    return [...collectReferencedColumns(hub.condition)];
  }
  const columns = new Set<string>();
  const linkedIds = new Set(hub.findingIds);
  for (const finding of findings) {
    if (!linkedIds.has(finding.id)) continue;
    for (const column of Object.keys(finding.context.activeFilters)) {
      columns.add(column);
    }
  }
  return [...columns];
}

/** Compute (uniqueCount, isNumeric) for a column from the active rows. */
function columnStats(
  data: ReadonlyArray<DataRow>,
  column: string
): { uniqueCount: number; isNumeric: boolean; present: boolean } {
  const unique = new Set<string>();
  let isNumeric = true;
  let present = false;
  for (const row of data) {
    const raw = row[column];
    if (raw === null || raw === undefined) continue;
    present = true;
    const num = toNumericValue(raw);
    if (num === undefined) {
      isNumeric = false;
      unique.add(String(raw));
    } else {
      unique.add(String(num));
    }
  }
  return { uniqueCount: unique.size, isNumeric, present };
}

/**
 * The analytical tool auto-suggested from a factor's data type (spec §4):
 * categorical → `two-sample`; continuous → `regression`. Uses the SAME
 * `classifyFactorType` heuristic the GLM engine uses, so the suggestion matches
 * how the deterministic engine would actually model the factor.
 */
export function suggestToolForFactor(data: ReadonlyArray<DataRow>, factor: string): AnalyticalTool {
  const { uniqueCount, isNumeric } = columnStats(data, factor);
  const classification = classifyFactorType([...data], factor, uniqueCount, isNumeric);
  return classification.type === 'continuous' ? 'regression' : 'two-sample';
}

/**
 * Build the per-factor test-plan triad for a hypothesis: each relevant factor
 * tagged with its data-readiness + (when ready) the auto-suggested tool.
 *
 * A factor is `ready` when its column is present (non-null) in the active data,
 * else a `gap` (→ "+ Measurement Plan"). Tool is null for a gap (no data to pick
 * from) and for the global no-outcome case.
 */
export function buildHypothesisTestPlan(
  hub: Hypothesis,
  findings: Finding[],
  data: ReadonlyArray<DataRow>,
  outcome: string | null
): HypothesisTestPlanFactor[] {
  const factors = deriveHypothesisFactors(hub, findings);
  return factors.map(factor => {
    const { present } = columnStats(data, factor);
    if (!present || !outcome) {
      return { factor, readiness: 'gap' as const, tool: null };
    }
    return { factor, readiness: 'ready' as const, tool: suggestToolForFactor(data, factor) };
  });
}

/**
 * Run the auto-suggested test for `factor` against `outcome` and classify the
 * result into the existing `Finding.validationStatus` semantics (spec §4).
 *
 * - categorical (`two-sample`): one-way ANOVA (= 2-sample t when 2 groups). The
 *   factor "accounts for the spread" when the between-group difference is
 *   significant.
 * - continuous (`regression`): single-factor best-subset regression. The factor
 *   "accounts for the spread" when the slope is significant.
 *
 * Classification (honest, V1):
 *   significant   → 'supports'      (the data is consistent with the cause)
 *   not significant → 'inconclusive' (routes to NOT-tested, never supporting)
 *
 * Counts-against (`'contradicts'` + `refutes:true`) is produced ONLY by the
 * disconfirmation path (Increment 2b's "Try to break it" checkbox), which feeds
 * the SAME engine result through an inverted prediction. The plain 2a evaluate
 * never self-classifies a significant result as adverse — it has no
 * wrongness-prediction to read against. (Spec §4.2 table, deferred to 2b.)
 *
 * Returns null when the test can't run (factor constant, too few rows/groups,
 * or no numeric outcome) so the UI can keep the evaluate inert rather than
 * fabricate a verdict.
 */
export function evaluateHypothesisFactor(
  data: ReadonlyArray<DataRow>,
  factor: string,
  outcome: string,
  options?: { tool?: AnalyticalTool; significanceThreshold?: number }
): HypothesisFactorEvaluation | null {
  const threshold = options?.significanceThreshold ?? EVALUATE_SIGNIFICANCE_THRESHOLD;
  const tool = options?.tool ?? suggestToolForFactor(data, factor);

  let pValue: number | null = null;

  if (tool === 'regression') {
    const subset = getBestSingleFactor([...data], outcome, [factor]);
    if (!subset || !Number.isFinite(subset.pValue)) return null;
    pValue = subset.pValue;
  } else {
    // two-sample / capability both lean on the group comparison for V1 — a
    // categorical factor's effect on the outcome's spread is the between-group test.
    const anova = calculateAnova([...data], outcome, factor);
    if (!anova || !Number.isFinite(anova.pValue) || anova.groups.length < 2) return null;
    pValue = anova.pValue;
  }

  if (pValue === null || !Number.isFinite(pValue)) return null;

  const isSignificant = pValue < threshold;
  const validationStatus: HypothesisFactorEvaluation['validationStatus'] = isSignificant
    ? 'supports'
    : 'inconclusive';

  const findingText = evaluateFindingText(factor, isSignificant, pValue);

  return {
    factor,
    tool,
    pValue,
    isSignificant,
    validationStatus,
    refutes: false,
    findingText,
  };
}

/**
 * The deterministic finding text an evaluate produces. Single source of truth so
 * `isEvaluateFindingForFactor` can recognise a prior evaluate of the same factor
 * (FE-2a idempotency — a re-evaluate refreshes the existing finding instead of
 * appending a duplicate). Both branches begin with `"${factor} "`.
 */
export function evaluateFindingText(
  factor: string,
  isSignificant: boolean,
  pValue: number
): string {
  return isSignificant
    ? `${factor} accounts for the spread in this data (p ${formatP(pValue)}).`
    : `${factor} does not clearly account for the spread in this data (p ${formatP(pValue)}) — inconclusive.`;
}

/**
 * `true` when `finding.text` was produced by `evaluateHypothesisFactor` for
 * `factor` (either the significant or inconclusive template). Lets the evaluate
 * call-site find a prior evaluate of the SAME (hypothesis × factor) among a hub's
 * linked findings and refresh it in place, keeping a repeat tap idempotent.
 *
 * Matches the stable, factor-specific suffix of each template (not just the
 * `"${factor} "` prefix) so a factor name that happens to be a prefix of another
 * does not cross-match.
 */
export function isEvaluateFindingForFactor(text: string, factor: string): boolean {
  return (
    text.startsWith(`${factor} accounts for the spread in this data (p `) ||
    text.startsWith(`${factor} does not clearly account for the spread in this data (p `)
  );
}

/** Compact p formatting for finding text: <.001 collapses, else 3 decimals. */
function formatP(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value < 0.001) return '< .001';
  return `= ${value.toFixed(3)}`;
}
