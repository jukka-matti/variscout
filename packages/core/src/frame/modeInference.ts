/**
 * Deterministic mode inference for the FRAME workspace.
 *
 * Replaces the scattered keyword-based mode guessing in
 * `packages/core/src/parser/detection.ts` (which inspects column names like
 * "step", "cycle time", "defect", etc.) with a rule table that reads the
 * user-built Process Map + the mapping state, in priority order.
 *
 * Pure function. No side effects, no React, no stores. Testable in isolation.
 *
 * See `docs/07-decisions/adr-070-frame-workspace.md`.
 */

import type { ModeInferenceInput, ModeInferenceResult, ModeInferenceRuleId } from './types';

/** Does a value look like a meaningful spec limit (finite number)? */
function hasFiniteSpec(value: number | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Infer the analysis mode from map shape + column roles + existing mappings.
 *
 * Rules, in priority order (first match wins):
 *
 *   1. yamazumi.tripletPresent — activityType + cycleTime + step columns declared.
 *   2. defect.typeAndCount    — defect type AND count columns declared.
 *   3. defect.passFail        — defect dataShape is 'pass-fail' with a result column.
 *   4. performance.threeOrMoreChannels — 3+ channel columns detected.
 *   5. capability.outcomeSpecsAndSubgroups — outcome + spec (LSL or USL) + at least one
 *      subgroup axis declared on the Process Map.
 *   6. standard.fallback — nothing above matched.
 *
 * The caller passes whatever it knows; missing fields simply fail their rules.
 */
export function inferMode(input: ModeInferenceInput = {}): ModeInferenceResult {
  const rulesSatisfied: ModeInferenceRuleId[] = [];

  // Rule 1 — yamazumi
  const y = input.yamazumiMapping;
  if (y && y.activityTypeColumn && y.cycleTimeColumn && y.stepColumn) {
    rulesSatisfied.push('yamazumi.tripletPresent');
    return {
      mode: 'yamazumi',
      reason:
        'Yamazumi mapping complete — activity type, cycle time, and step columns all declared.',
      rulesSatisfied,
    };
  }

  // Rule 2 — defect via type + count
  const d = input.defectMapping;
  if (d && d.defectTypeColumn && d.countColumn) {
    rulesSatisfied.push('defect.typeAndCount');
    return {
      mode: 'defect',
      reason: 'Defect data — defect-type and count columns declared.',
      rulesSatisfied,
    };
  }

  // Rule 3 — defect via pass/fail
  if (d && d.dataShape === 'pass-fail' && d.resultColumn) {
    rulesSatisfied.push('defect.passFail');
    return {
      mode: 'defect',
      reason: 'Defect data — pass/fail shape with a result column declared.',
      rulesSatisfied,
    };
  }

  // Rule 4 — performance (multi-channel)
  const channels = input.performanceChannels ?? [];
  if (channels.length >= 3) {
    rulesSatisfied.push('performance.threeOrMoreChannels');
    return {
      mode: 'performance',
      reason: `Performance data — ${channels.length} channel columns detected.`,
      rulesSatisfied,
    };
  }

  // Rule 5 — capability
  const specs = input.specs;
  const hasSpec = !!specs && (hasFiniteSpec(specs.lsl) || hasFiniteSpec(specs.usl));
  const subgroupAxes = input.processMap?.subgroupAxes ?? [];
  if (input.outcomeColumn && hasSpec && subgroupAxes.length > 0) {
    rulesSatisfied.push('capability.outcomeSpecsAndSubgroups');
    return {
      mode: 'capability',
      reason:
        'Outcome + spec limit + rational subgroup declared — Cpk stability is the natural lens.',
      rulesSatisfied,
    };
  }

  // Rule 6 — fallback
  rulesSatisfied.push('standard.fallback');
  return {
    mode: 'standard',
    reason: 'No mode-specific structure declared — Four Lenses standard view.',
    rulesSatisfied,
  };
}

/** Convenience re-export so call-sites can import both together. */
export type { InferredMode, ModeInferenceInput, ModeInferenceResult } from './types';
