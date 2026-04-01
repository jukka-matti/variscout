/**
 * Problem Statement auto-synthesis using Watson's 3 Questions framework.
 *
 * Watson's 3 questions:
 *   1. What measure needs to change?
 *   2. How should it change?
 *   3. What is the scope? (suspected causes)
 */

export interface ProblemStatementInput {
  /** The outcome measure (e.g., "Fill Weight") */
  outcome: string;
  /** Target value (e.g., target Cpk) */
  targetValue?: number;
  /** Direction of desired change */
  targetDirection?: 'increase' | 'decrease' | 'reduce-variation';
  /** Current Cpk (shown alongside target for context) */
  currentCpk?: number;
  /** Suspected causes identified during investigation */
  suspectedCauses: Array<{
    factor: string;
    level?: string;
    /** eta-squared or R²adj percentage (0-1 scale) */
    evidence?: number;
  }>;
}

/**
 * Build a problem statement draft answering Watson's 3 questions.
 *
 * Output format: "{direction verb} {outcome} ({Cpk current → target}) driven by {causes}."
 */
export function buildProblemStatement(input: ProblemStatementInput): string {
  const parts: string[] = [];

  // Q1 + Q2: What measure, how should it change
  const directionVerb =
    input.targetDirection === 'increase'
      ? 'Increase'
      : input.targetDirection === 'decrease'
        ? 'Decrease'
        : 'Reduce variation in';

  let measurePart = `${directionVerb} ${input.outcome}`;
  if (input.currentCpk != null && input.targetValue != null) {
    measurePart += ` (Cpk ${input.currentCpk.toFixed(2)} \u2192 target ${input.targetValue.toFixed(2)})`;
  } else if (input.targetValue != null) {
    measurePart += ` to target ${input.targetValue.toFixed(2)}`;
  }
  parts.push(measurePart);

  // Q3: Scope (suspected causes)
  if (input.suspectedCauses.length > 0) {
    const causeDescriptions = input.suspectedCauses.map(c => {
      let desc = c.factor;
      if (c.level) desc += ` (${c.level})`;
      if (c.evidence != null) desc += ` [${(c.evidence * 100).toFixed(0)}%]`;
      return desc;
    });
    parts.push(`driven by ${causeDescriptions.join(' and ')}`);
  }

  return parts.join(' ') + '.';
}
