/**
 * Problem Statement auto-synthesis using Watson's 3 Questions framework.
 *
 * Watson's 3 questions:
 *   1. What measure needs to change?
 *   2. How should it change?
 *   3. What is the scope? (hypotheses)
 */

import type { CharacteristicType } from '../types';
import { formatStatistic } from '../i18n/format';

export interface ProblemStatementInput {
  /** The outcome measure (e.g., "Fill Weight") */
  outcome: string;
  /** Target value (e.g., target Cpk) */
  targetValue?: number;
  /**
   * Direction of desired change. Takes precedence over characteristicType when both are provided.
   */
  targetDirection?: 'increase' | 'decrease' | 'reduce-variation';
  /**
   * Characteristic type used to derive direction when targetDirection is not explicitly set.
   * - 'nominal' → reduce-variation
   * - 'smaller' → decrease
   * - 'larger' → increase
   */
  characteristicType?: CharacteristicType;
  /** Current Cpk (shown alongside target for context) */
  currentCpk?: number;
  /** Hypotheses identified during investigation */
  hypotheses: Array<{
    factor: string;
    level?: string;
    /** eta-squared or R²adj percentage (0-1 scale) */
    evidence?: number;
  }>;
  /** Optional level effect for the location factor (from best subsets model) */
  locationEffect?: { level: string; effect: number };
}

/**
 * Resolve the target direction from explicit targetDirection, then characteristicType,
 * falling back to 'reduce-variation' when neither is provided.
 */
function resolveDirection(
  input: Pick<ProblemStatementInput, 'targetDirection' | 'characteristicType'>
): 'increase' | 'decrease' | 'reduce-variation' {
  if (input.targetDirection != null) {
    return input.targetDirection;
  }
  if (input.characteristicType === 'smaller') {
    return 'decrease';
  }
  if (input.characteristicType === 'larger') {
    return 'increase';
  }
  return 'reduce-variation';
}

/**
 * Build a problem statement draft answering Watson's 3 questions.
 *
 * Output format: "{direction verb} {outcome} ({Cpk current → target}) driven by {causes}."
 */
export function buildProblemStatement(input: ProblemStatementInput): string {
  const parts: string[] = [];

  // Q1 + Q2: What measure, how should it change
  const direction = resolveDirection(input);
  const directionVerb =
    direction === 'increase'
      ? 'Increase'
      : direction === 'decrease'
        ? 'Decrease'
        : 'Reduce variation in';

  let measurePart = `${directionVerb} ${input.outcome}`;
  // Include location effect when available (e.g. "adds +0.8g")
  if (input.locationEffect) {
    const { level, effect } = input.locationEffect;
    const sign = effect >= 0 ? '+' : '';
    const effectAbs = Math.abs(effect);
    const effectStr = formatStatistic(effectAbs, 'en', effectAbs >= 10 ? 1 : 2);
    measurePart += ` for ${level} (adds ${sign}${effectStr}`;
    if (input.currentCpk != null && input.targetValue != null) {
      measurePart += `, Cpk ${formatStatistic(input.currentCpk, 'en', 2)} \u2192 ${formatStatistic(input.targetValue, 'en', 2)})`;
    } else {
      measurePart += ')';
    }
  } else if (input.currentCpk != null && input.targetValue != null) {
    measurePart += ` (Cpk ${formatStatistic(input.currentCpk, 'en', 2)} \u2192 target ${formatStatistic(input.targetValue, 'en', 2)})`;
  } else if (input.targetValue != null) {
    measurePart += ` to target ${formatStatistic(input.targetValue, 'en', 2)}`;
  }
  parts.push(measurePart);

  // Q3: Scope (hypotheses)
  if (input.hypotheses.length > 0) {
    const causeDescriptions = input.hypotheses.map(c => {
      let desc = c.factor;
      if (c.level) desc += ` (${c.level})`;
      if (c.evidence != null) desc += ` [${formatStatistic(c.evidence * 100, 'en', 0)}%]`;
      return desc;
    });
    parts.push(`driven by ${causeDescriptions.join(' and ')}`);
  }

  return parts.join(' ') + '.';
}
