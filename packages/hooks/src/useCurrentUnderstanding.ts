import { useEffect, useMemo } from 'react';
import {
  buildCurrentUnderstanding,
  buildProblemCondition,
  type CurrentUnderstanding,
  type ProblemCondition,
  type ProcessContext,
  type Hypothesis,
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
  hypothesisHubs?: Hypothesis[];
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

function activeMechanismsFromHubs(hubs: Hypothesis[]) {
  return hubs
    .filter(hub => hub.status !== 'refuted')
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
  hypothesisHubs = [],
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
    const mechanisms = activeMechanismsFromHubs(hypothesisHubs);
    const liveStatement =
      problemStatement?.draft ??
      problemStatement?.liveStatement ??
      problemStatement?.generatedDraft;

    return buildCurrentUnderstanding({
      issueStatement: processContext?.issueStatement,
      problemCondition,
      scopedPattern: scopedPattern ?? undefined,
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
    scopedPattern,
    hypothesisHubs,
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
