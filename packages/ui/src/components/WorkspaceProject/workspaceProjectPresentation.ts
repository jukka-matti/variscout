import type { ImprovementProject } from '@variscout/core/improvementProject';

const DAY_MS = 24 * 60 * 60 * 1000;

export type WorkspaceProjectStageLabel = 'Charter' | 'Approach' | 'Control';

export interface WorkspaceProjectPresentation {
  id: ImprovementProject['id'];
  title: string;
  statusLabel: string;
  stageLabel: WorkspaceProjectStageLabel;
  dayCounter: number;
  urgentLine: string;
  recentActivity: string[];
}

export function getWorkspaceProjectDayCounter(ip: ImprovementProject, now = Date.now()): number {
  return Math.max(1, Math.floor((now - ip.createdAt) / DAY_MS) + 1);
}

export function getWorkspaceProjectStageLabel(ip: ImprovementProject): WorkspaceProjectStageLabel {
  if (ip.status === 'draft') return 'Charter';

  const hasOutcomeReference =
    Boolean(ip.sections.outcomeReference.sustainmentRecordId) ||
    Boolean(ip.sections.outcomeReference.controlHandoffId);
  if (ip.status === 'closed' || hasOutcomeReference) return 'Control';

  const hasApproachWork =
    Boolean(ip.sections.approach.narrative?.trim()) ||
    (ip.sections.approach.improvementIdeaIds?.length ?? 0) > 0 ||
    (ip.sections.approach.actionItemIds?.length ?? 0) > 0;

  return hasApproachWork ? 'Control' : 'Approach';
}

export function getWorkspaceProjectUrgentLine(ip: ImprovementProject): string {
  const stage = getWorkspaceProjectStageLabel(ip);

  if (stage === 'Charter') {
    // Legacy first-outcome check — multi-outcome activity copy is a later phase
    // (Spec 2 §3.2.2 / PR-CCJ-C1).
    return ip.goal.outcomeGoals[0]?.target === undefined
      ? 'Goal not yet set'
      : 'Pat awaiting Charter signoff';
  }

  if (stage === 'Approach') return 'Pat awaiting your Approach signoff';
  // Control: two sub-reasons — closed/handoff-pending vs ongoing sustainment cadence
  if (ip.status === 'closed') return "Control plan pending Pat's acknowledgment";
  return 'Cadence tick due after sustainment setup';
}

function formatRelativeUpdatedAt(ip: ImprovementProject, now: number): string {
  const elapsedDays = Math.max(0, Math.floor((now - ip.updatedAt) / DAY_MS));
  if (elapsedDays === 0) return 'today';
  if (elapsedDays === 1) return '1d ago';
  return `${elapsedDays}d ago`;
}

export function getWorkspaceProjectRecentActivityFallback(
  ip: ImprovementProject,
  now = Date.now()
): string[] {
  const stage = getWorkspaceProjectStageLabel(ip);
  // Legacy first-outcome read — multi-outcome UI is later phases (Spec 2 §3.2.2 / PR-CCJ-C1).
  return [
    `${ip.metadata.title} opened · Day ${getWorkspaceProjectDayCounter(ip, now)}`,
    `${stage} stage active · ${formatRelativeUpdatedAt(ip, now)}`,
    `Target set to ${ip.goal.outcomeGoals[0]?.target ?? '—'} · current goal`,
  ];
}

export function deriveWorkspaceProjectPresentation(
  ip: ImprovementProject,
  now = Date.now()
): WorkspaceProjectPresentation {
  return {
    id: ip.id,
    title: ip.metadata.title,
    statusLabel: ip.status.toUpperCase(),
    stageLabel: getWorkspaceProjectStageLabel(ip),
    dayCounter: getWorkspaceProjectDayCounter(ip, now),
    urgentLine: getWorkspaceProjectUrgentLine(ip),
    recentActivity: getWorkspaceProjectRecentActivityFallback(ip, now),
  };
}
