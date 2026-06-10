import type { ControlMetadataProjection } from '@variscout/core';
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

function ordinal(value: number): string {
  const n = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
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

function isSustainmentCheckSuggested(
  sustainment: ControlMetadataProjection | undefined,
  now: number
): boolean {
  if (!sustainment?.nextCheckSuggestedAt) return false;
  if (sustainment.status === 'confirmed-sustained') return false;
  const suggestedAtMs = Date.parse(sustainment.nextCheckSuggestedAt);
  return Number.isFinite(suggestedAtMs) && suggestedAtMs <= now;
}

export function getWorkspaceProjectUrgentLine(
  ip: ImprovementProject,
  now = Date.now(),
  sustainment?: ControlMetadataProjection
): string {
  const stage = getWorkspaceProjectStageLabel(ip);

  if (stage === 'Charter') {
    // Legacy first-outcome check — multi-outcome activity copy is a later phase
    // (Spec 2 §3.2.2 / PR-CCJ-C1).
    return ip.goal.outcomeGoals[0]?.target === undefined
      ? 'Goal not yet set'
      : 'Pat awaiting Charter signoff';
  }

  if (stage === 'Approach') return 'Pat awaiting your Approach signoff';

  if (isSustainmentCheckSuggested(sustainment, now)) {
    return `Control: re-ingest to verify - ${ordinal(sustainment!.ladderStep + 1)} check suggested`;
  }

  // Control: closed/handoff-pending vs ongoing sustainment setup.
  if (ip.status === 'closed') return "Control plan pending Pat's acknowledgment";
  return 'Control setup ready';
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
  now = Date.now(),
  sustainment?: ControlMetadataProjection
): WorkspaceProjectPresentation {
  return {
    id: ip.id,
    title: ip.metadata.title,
    statusLabel: ip.status.toUpperCase(),
    stageLabel: getWorkspaceProjectStageLabel(ip),
    dayCounter: getWorkspaceProjectDayCounter(ip, now),
    urgentLine: getWorkspaceProjectUrgentLine(ip, now, sustainment),
    recentActivity: getWorkspaceProjectRecentActivityFallback(ip, now),
  };
}
