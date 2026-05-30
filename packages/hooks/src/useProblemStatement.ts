import { useMemo, useState, useCallback } from 'react';
import { buildProblemStatement } from '@variscout/core/findings';
import type { Hypothesis, CharacteristicType } from '@variscout/core';

/**
 * Represents the Q3 "Where?" scope anchor — the first significant factor
 * identified at SCOUT Loop 1, before full suspected-cause hypotheses are built.
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
   * full suspected-cause hypotheses are populated.
   */
  locationFactor?: LocationFactor;
  /** All hypothesis hubs (filtered to non-refuted internally) */
  hypothesisHubs?: Hypothesis[];
  /** Existing accepted problem statement */
  existingStatement?: string;
  /** Callback when the analyst accepts a statement */
  onStatementChange?: (statement: string) => void;
}

export interface UseProblemStatementReturn {
  /** Whether there are enough hypotheses to generate */
  isReady: boolean;
  /**
   * Whether the Problem Statement can form early from Watson Q1+Q2+Q3:
   *   Q1 (outcome) + Q2 (characteristicType) + Q3 (locationFactor) all present.
   * No suspected-cause hypotheses required.
   */
  isFormable: boolean;
  /** Watson Q1 ready: outcome is set */
  q1Ready: boolean;
  /** Watson Q2 ready: characteristicType is set */
  q2Ready: boolean;
  /** Watson Q3 ready: locationFactor or at least one non-refuted hypothesis hub present */
  hasScope: boolean;
  /** Whether a Problem Statement draft can be generated (from either early or legacy path) */
  canGenerateDraft: boolean;
  /**
   * Auto-built statement when isFormable is true. Updates live as locationFactor
   * and hubs change. No "Generate" button required.
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
 * 2. **Standard formation** (`isReady`): Requires hypothesis hubs — produces
 *    `generatedDraft` via manual `generate()` call.
 */
export function useProblemStatement({
  outcome,
  targetCpk,
  currentCpk,
  characteristicType,
  locationFactor,
  hypothesisHubs = [],
  existingStatement,
  onStatementChange,
}: UseProblemStatementOptions): UseProblemStatementReturn {
  const [draft, setDraft] = useState<string | null>(null);

  // Watson Q readiness
  const q1Ready = outcome != null && outcome !== '';
  const q2Ready = characteristicType != null;

  // Non-refuted hubs that have factor evidence (derived from their name / synthesis)
  const activeHubs = useMemo(
    () => hypothesisHubs.filter(h => h.status !== 'refuted'),
    [hypothesisHubs]
  );

  const hasScope = locationFactor != null || activeHubs.length > 0;

  // Early formation: all three Watson questions answered
  const isFormable = q1Ready && q2Ready && hasScope && locationFactor != null;

  // Hypotheses mapped to buildProblemStatement format (factor derived from hub name)
  const mappedHypotheses = useMemo(
    () =>
      activeHubs.map(h => ({
        factor: h.name,
        level: undefined,
        evidence: h.evidence?.contribution.value,
      })),
    [activeHubs]
  );

  // Standard readiness: requires at least one active hub
  const isReady = mappedHypotheses.length > 0 && q1Ready;

  // canGenerateDraft: true when either early or standard formation path is viable
  const canGenerateDraft = q1Ready && hasScope;

  // liveStatement: auto-built when isFormable, combining locationFactor + hub causes
  const liveStatement = useMemo(() => {
    if (!isFormable || !outcome || !locationFactor) return null;

    const locationCause = {
      factor: locationFactor.factor,
      level: locationFactor.level,
      evidence: locationFactor.evidence,
    };
    const additionalCauses = mappedHypotheses.filter(c => c.factor !== locationFactor.factor);

    return buildProblemStatement({
      outcome,
      targetValue: targetCpk,
      characteristicType,
      currentCpk,
      hypotheses: [locationCause, ...additionalCauses],
    });
  }, [
    isFormable,
    outcome,
    locationFactor,
    characteristicType,
    targetCpk,
    currentCpk,
    mappedHypotheses,
  ]);

  // generatedDraft (for the manual generate() flow)
  const generatedDraft = useMemo(() => {
    if (!isReady || !outcome) return null;
    return buildProblemStatement({
      outcome,
      targetValue: targetCpk,
      characteristicType,
      currentCpk,
      hypotheses: mappedHypotheses,
    });
  }, [isReady, outcome, targetCpk, characteristicType, currentCpk, mappedHypotheses]);

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
    hasScope,
    canGenerateDraft,
    liveStatement,
    draft,
    generatedDraft,
    existingStatement,
    generate,
    accept,
    dismiss,
  };
}
