import type { ImprovementProject } from './types';

/**
 * ADR-093 removes live membership/collaboration from V1. Kept as a narrow
 * compatibility predicate for legacy callers that still need a stable false.
 */
export function isCollaborative(ip: ImprovementProject): boolean {
  void ip;
  return false;
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function hasDeliberateCharterContent(ip: ImprovementProject): boolean {
  return (
    hasText(ip.metadata.businessCase) ||
    ip.metadata.financialImpact?.amount !== undefined ||
    (ip.goal.outcomeGoals?.length ?? 0) > 0 ||
    (ip.goal.factorControls?.length ?? 0) > 0 ||
    (ip.goal.mechanismGoals?.length ?? 0) > 0 ||
    hasText(ip.goal.freeText) ||
    hasText(ip.issueStatement) ||
    hasText(ip.sections.background.manualNarrative) ||
    hasText(ip.sections.background.snapshotText) ||
    hasText(ip.sections.approach.narrative) ||
    (ip.sections.approach.improvementIdeaIds?.length ?? 0) > 0 ||
    (ip.sections.approach.actionItemIds?.length ?? 0) > 0 ||
    Boolean(ip.sections.outcomeReference.sustainmentRecordId) ||
    Boolean(ip.sections.outcomeReference.controlHandoffId)
  );
}

export function isFormalizedProject(ip: ImprovementProject): boolean {
  return Boolean(ip.metadata.formalizedAt) || hasDeliberateCharterContent(ip);
}
