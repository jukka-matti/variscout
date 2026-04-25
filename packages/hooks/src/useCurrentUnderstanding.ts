import { useEffect, useMemo } from 'react';
import {
  buildCurrentUnderstanding,
  buildProblemCondition,
  type CurrentUnderstanding,
  type ProblemCondition,
  type ProcessContext,
  type Question,
  type SuspectedCause,
} from '@variscout/core';

export interface CurrentUnderstandingStats {
  mean?: number | undefined;
  stdDev?: number | undefined;
  sigma?: number | undefined;
  cpk?: number | undefined;
  yield?: number | undefined;
  passRate?: number | undefined;
}

export interface CurrentUnderstandingProblemStatementState {
  liveStatement?: string | null;
  draft?: string | null;
  generatedDraft?: string | null;
}

export interface UseCurrentUnderstandingOptions {
  processContext?: ProcessContext | null;
  stats?: CurrentUnderstandingStats | null;
  problemStatement?: CurrentUnderstandingProblemStatementState;
  questions?: Question[];
  suspectedCauseHubs?: SuspectedCause[];
  scopedPattern?: string | null;
  onCurrentUnderstandingChange?: (
    currentUnderstanding: CurrentUnderstanding | undefined,
    problemCondition: ProblemCondition | undefined
  ) => void;
}

export interface UseCurrentUnderstandingReturn {
  currentUnderstanding: CurrentUnderstanding | undefined;
  problemCondition: ProblemCondition | undefined;
  hasMeaningfulChange: boolean;
}

function currentValueForMetric(
  metric: ProcessContext['targetMetric'],
  stats: CurrentUnderstandingStats | null | undefined
): number | undefined {
  if (!metric || !stats) return undefined;

  switch (metric) {
    case 'mean':
      return stats.mean;
    case 'sigma':
      return stats.sigma ?? stats.stdDev;
    case 'cpk':
      return stats.cpk;
    case 'yield':
      return stats.yield ?? stats.passRate;
    case 'passRate':
      return stats.passRate;
    default:
      return undefined;
  }
}

function formatEvidenceLabel(question: Question): string | undefined {
  const r2 = question.evidence?.rSquaredAdj;
  if (r2 !== undefined && Number.isFinite(r2)) return `R2adj ${Math.round(r2 * 100)}%`;

  const eta = question.evidence?.etaSquared;
  if (eta !== undefined && Number.isFinite(eta)) return `eta2 ${Math.round(eta * 100)}%`;

  return undefined;
}

function mechanismNameFromQuestion(question: Question): string | undefined {
  if (!question.factor) return undefined;
  return question.level ? `${question.factor} = ${question.level}` : question.factor;
}

function activeMechanismsFromQuestions(questions: Question[]) {
  return questions
    .filter(question => question.causeRole === 'suspected-cause')
    .map(question => {
      const name = mechanismNameFromQuestion(question);
      if (!name) return null;

      return {
        id: question.id,
        name,
        synthesis: question.text,
        evidenceLabel: formatEvidenceLabel(question),
      };
    })
    .filter((mechanism): mechanism is NonNullable<typeof mechanism> => mechanism !== null);
}

function activeMechanismsFromHubs(hubs: SuspectedCause[]) {
  return hubs
    .filter(hub => hub.status !== 'not-confirmed')
    .map(hub => {
      const evidenceLabel = hub.evidence?.contribution.description;

      return {
        id: hub.id,
        name: hub.name,
        synthesis: hub.synthesis,
        evidenceLabel,
      };
    });
}

function firstScopedPattern(questions: Question[]): string | undefined {
  const scoped = questions.find(
    question => question.causeRole === 'suspected-cause' && question.factor
  );
  if (!scoped?.factor) return undefined;
  return scoped.level ? `${scoped.factor} = ${scoped.level}` : scoped.factor;
}

function signature(
  currentUnderstanding: CurrentUnderstanding | undefined,
  problemCondition: ProblemCondition | undefined
): string {
  return JSON.stringify({
    summary: currentUnderstanding?.summary,
    problemCondition,
  });
}

/**
 * Derives the stable EDA 2.0 Current Understanding vocabulary from live investigation state.
 */
export function useCurrentUnderstanding({
  processContext,
  stats,
  problemStatement,
  questions = [],
  suspectedCauseHubs = [],
  scopedPattern,
  onCurrentUnderstandingChange,
}: UseCurrentUnderstandingOptions): UseCurrentUnderstandingReturn {
  const problemCondition = useMemo(() => {
    const derived = buildProblemCondition({
      targetMetric: processContext?.targetMetric,
      targetValue: processContext?.targetValue,
      targetDirection: processContext?.targetDirection,
      currentValue: currentValueForMetric(processContext?.targetMetric, stats),
    });
    return derived ?? processContext?.problemCondition;
  }, [
    processContext?.problemCondition,
    processContext?.targetDirection,
    processContext?.targetMetric,
    processContext?.targetValue,
    stats,
  ]);

  const currentUnderstanding = useMemo(() => {
    const mechanisms =
      suspectedCauseHubs.length > 0
        ? activeMechanismsFromHubs(suspectedCauseHubs)
        : activeMechanismsFromQuestions(questions);
    const liveStatement =
      problemStatement?.draft ??
      problemStatement?.liveStatement ??
      problemStatement?.generatedDraft;

    return buildCurrentUnderstanding({
      issueStatement: processContext?.issueStatement,
      problemCondition,
      scopedPattern: scopedPattern ?? firstScopedPattern(questions),
      liveStatement,
      approvedProblemStatement: processContext?.problemStatement,
      activeSuspectedMechanisms: mechanisms,
    });
  }, [
    processContext?.issueStatement,
    processContext?.problemStatement,
    problemCondition,
    problemStatement?.draft,
    problemStatement?.generatedDraft,
    problemStatement?.liveStatement,
    questions,
    scopedPattern,
    suspectedCauseHubs,
  ]);

  const derivedSignature = signature(currentUnderstanding, problemCondition);
  const existingSignature = signature(
    processContext?.currentUnderstanding,
    processContext?.problemCondition
  );
  const hasMeaningfulChange = derivedSignature !== existingSignature;

  useEffect(() => {
    if (!onCurrentUnderstandingChange || !hasMeaningfulChange) return;
    onCurrentUnderstandingChange(currentUnderstanding, problemCondition);
  }, [currentUnderstanding, hasMeaningfulChange, onCurrentUnderstandingChange, problemCondition]);

  return { currentUnderstanding, problemCondition, hasMeaningfulChange };
}
