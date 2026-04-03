import { useMemo, useState, useCallback } from 'react';
import { buildProblemStatement } from '@variscout/core/findings';
import type { Question, CharacteristicType } from '@variscout/core';

/**
 * Represents the Q3 "Where?" scope anchor — the first significant factor
 * identified at SCOUT Loop 1, before full suspected-cause questions are built.
 */
export interface LocationFactor {
  /** Factor column name (e.g., "Shift", "Machine") */
  factor: string;
  /** Most impactful level, if known */
  level?: string;
  /** eta-squared or R²adj (0-1 scale) */
  evidence?: number;
}

export interface UseProblemStatementOptions {
  /** The outcome measure column name */
  outcome: string | null | undefined;
  /** Target Cpk value */
  targetCpk?: number;
  /** Current Cpk value */
  currentCpk?: number;
  /**
   * Characteristic type used to derive Q2 direction when targetDirection is
   * not explicitly set. Known at FRAME from spec configuration.
   * - 'nominal' → reduce-variation
   * - 'smaller' → decrease
   * - 'larger' → increase
   */
  characteristicType?: CharacteristicType;
  /**
   * First significant factor from SCOUT Loop 1. Provides Q3 scope before
   * full suspected-cause questions are populated.
   */
  locationFactor?: LocationFactor;
  /** All questions (filtered to suspected-cause internally) */
  questions: Question[];
  /** Existing accepted problem statement */
  existingStatement?: string;
  /** Callback when the analyst accepts a statement */
  onStatementChange?: (statement: string) => void;
}

export interface UseProblemStatementReturn {
  /** Whether there are enough suspected causes to generate (legacy — checks question suspected causes) */
  isReady: boolean;
  /**
   * Whether the Problem Statement can form early from Watson Q1+Q2+Q3:
   *   Q1 (outcome) + Q2 (characteristicType) + Q3 (locationFactor) all present.
   * No suspected-cause questions required.
   */
  isFormable: boolean;
  /** Watson Q1 ready: outcome is set */
  q1Ready: boolean;
  /** Watson Q2 ready: characteristicType is set */
  q2Ready: boolean;
  /** Watson Q3 ready: locationFactor or at least one suspected-cause question present */
  q3Ready: boolean;
  /**
   * Auto-built statement when isFormable is true. Updates live as locationFactor
   * and questions change. No "Generate" button required.
   */
  liveStatement: string | null;
  /** The editable draft (null when not generating) */
  draft: string | null;
  /** The computed draft text (always available when isReady) */
  generatedDraft: string | null;
  /** The existing accepted statement */
  existingStatement: string | undefined;
  /** Show the draft for editing */
  generate: () => void;
  /** Accept the edited draft */
  accept: (text: string) => void;
  /** Dismiss the draft without accepting */
  dismiss: () => void;
}

/**
 * Manages problem statement auto-synthesis lifecycle.
 *
 * Supports two formation modes:
 * 1. **Early formation** (`isFormable`): Q1 (outcome) + Q2 (characteristicType) + Q3 (locationFactor)
 *    known at FRAME/SCOUT Loop 1 — produces `liveStatement` automatically.
 * 2. **Legacy formation** (`isReady`): Requires question-based suspected causes — produces
 *    `generatedDraft` via manual `generate()` call.
 *
 * Both modes are backward compatible: existing callers passing only `outcome` and `questions`
 * continue to work exactly as before.
 */
export function useProblemStatement({
  outcome,
  targetCpk,
  currentCpk,
  characteristicType,
  locationFactor,
  questions,
  existingStatement,
  onStatementChange,
}: UseProblemStatementOptions): UseProblemStatementReturn {
  const [draft, setDraft] = useState<string | null>(null);

  // Watson Q readiness
  const q1Ready = outcome != null && outcome !== '';
  const q2Ready = characteristicType != null;
  const q3Ready =
    locationFactor != null || questions.some(q => q.causeRole === 'suspected-cause' && q.factor);

  // Early formation: all three Watson questions answered
  const isFormable = q1Ready && q2Ready && q3Ready && locationFactor != null;

  // Legacy suspected causes from question tree
  const suspectedCauses = useMemo(
    () =>
      questions
        .filter(q => q.causeRole === 'suspected-cause' && q.factor)
        .map(q => ({
          factor: q.factor!,
          level: q.level,
          evidence: q.evidence?.rSquaredAdj ?? q.evidence?.etaSquared,
        })),
    [questions]
  );

  // Legacy readiness: requires at least one question-based suspected cause
  const isReady = suspectedCauses.length > 0 && q1Ready;

  // liveStatement: auto-built when isFormable, combining locationFactor + question causes
  const liveStatement = useMemo(() => {
    if (!isFormable || !outcome || !locationFactor) return null;

    // Q3 scope: locationFactor as first cause, then unique question causes
    const locationCause = {
      factor: locationFactor.factor,
      level: locationFactor.level,
      evidence: locationFactor.evidence,
    };
    const additionalCauses = suspectedCauses.filter(c => c.factor !== locationFactor.factor);

    return buildProblemStatement({
      outcome,
      targetValue: targetCpk,
      characteristicType,
      currentCpk,
      suspectedCauses: [locationCause, ...additionalCauses],
    });
  }, [
    isFormable,
    outcome,
    locationFactor,
    characteristicType,
    targetCpk,
    currentCpk,
    suspectedCauses,
  ]);

  // Legacy generatedDraft (for the manual generate() flow)
  const generatedDraft = useMemo(() => {
    if (!isReady || !outcome) return null;
    return buildProblemStatement({
      outcome,
      targetValue: targetCpk,
      targetDirection: 'reduce-variation',
      currentCpk,
      suspectedCauses,
    });
  }, [isReady, outcome, targetCpk, currentCpk, suspectedCauses]);

  const generate = useCallback(() => {
    if (generatedDraft) setDraft(generatedDraft);
  }, [generatedDraft]);

  const accept = useCallback(
    (text: string) => {
      onStatementChange?.(text);
      setDraft(null);
    },
    [onStatementChange]
  );

  const dismiss = useCallback(() => {
    setDraft(null);
  }, []);

  return {
    isReady,
    isFormable,
    q1Ready,
    q2Ready,
    q3Ready,
    liveStatement,
    draft,
    generatedDraft,
    existingStatement,
    generate,
    accept,
    dismiss,
  };
}
