import type { ImprovementProject } from './types';

/**
 * True once a project has ever been collaborated on — i.e. its durable
 * `collaboratedAt` marker has been set by the first invite. The marker is
 * never cleared (removing members does not flip this back to false), so this
 * is distinct from a reversible `members.length > 1` check.
 *
 * Gates the Azure-only collaboration affordances (the optional, non-blocking
 * sign-off section). A solo PWA investigation never sets the marker, so it
 * stays in Mode-1 solo and the sign-off section stays hidden. (IM-7 §11 #6.)
 */
export function isCollaborative(ip: ImprovementProject): boolean {
  return Boolean(ip.collaboratedAt);
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
  const memberCount = ip.metadata.members?.length ?? 0;
  return (
    Boolean(ip.metadata.formalizedAt) ||
    isCollaborative(ip) ||
    memberCount > 1 ||
    hasDeliberateCharterContent(ip)
  );
}
