import { useMemo, useState, useCallback } from 'react';
import { buildProblemStatement } from '@variscout/core/findings';
import type { Question } from '@variscout/core';

export interface UseProblemStatementOptions {
  /** The outcome measure column name */
  outcome: string | null | undefined;
  /** Target Cpk value */
  targetCpk?: number;
  /** Current Cpk value */
  currentCpk?: number;
  /** All questions (filtered to suspected-cause internally) */
  questions: Question[];
  /** Existing accepted problem statement */
  existingStatement?: string;
  /** Callback when the analyst accepts a statement */
  onStatementChange?: (statement: string) => void;
}

export interface UseProblemStatementReturn {
  /** Whether there are enough suspected causes to generate */
  isReady: boolean;
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
 * Computes a Watson 3-questions draft from suspected causes,
 * lets the analyst edit before accepting.
 */
export function useProblemStatement({
  outcome,
  targetCpk,
  currentCpk,
  questions,
  existingStatement,
  onStatementChange,
}: UseProblemStatementOptions): UseProblemStatementReturn {
  const [draft, setDraft] = useState<string | null>(null);

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

  const isReady = suspectedCauses.length > 0 && outcome != null;

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
    draft,
    generatedDraft,
    existingStatement,
    generate,
    accept,
    dismiss,
  };
}
