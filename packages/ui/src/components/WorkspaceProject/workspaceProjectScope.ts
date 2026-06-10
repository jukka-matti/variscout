import type { ProcessHub } from '@variscout/core';
import type { CanvasLevel } from '@variscout/core/canvas';
import type { ImprovementProject } from '@variscout/core/improvementProject';

export interface WorkspaceProjectScopeLabels {
  outcomeLabel: string | null;
  factorLabels: string[];
  timelineLabel: string;
}

export interface WorkspaceProjectCanvasFocus {
  level: CanvasLevel;
  focalStepId?: string;
}

function formatDate(value: number): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function resolveOutcomeLabel(ip: ImprovementProject, hub?: ProcessHub | null): string | null {
  // Legacy first-outcome label — multi-outcome scope labels are a later phase
  // (Spec 2 §3.2.2 / PR-CCJ-C1; step-bound outcomes feed L3 view).
  const outcomeSpecId = ip.goal.outcomeGoals[0]?.outcomeSpecId;
  if (!outcomeSpecId) return null;
  const outcome = hub?.outcomes?.find(candidate => candidate.id === outcomeSpecId);
  return outcome?.columnName ?? outcomeSpecId;
}

export function deriveWorkspaceProjectScopeLabels(
  ip: ImprovementProject,
  hub?: ProcessHub | null,
  setAt?: number | null
): WorkspaceProjectScopeLabels {
  const factorLabels = (ip.goal.factorControls ?? []).map(control => control.factor);
  const since = setAt ?? ip.createdAt;
  return {
    outcomeLabel: resolveOutcomeLabel(ip, hub),
    factorLabels,
    timelineLabel: `Since ${formatDate(since)}`,
  };
}

export function deriveWorkspaceProjectCanvasFocus(
  ip: ImprovementProject,
  hub?: ProcessHub | null
): WorkspaceProjectCanvasFocus {
  const processMap = hub?.canonicalProcessMap;
  const outcomeLabel = resolveOutcomeLabel(ip, hub);
  const outcomeStep = processMap?.nodes.find(node => node.ctqColumn === outcomeLabel);
  const firstStep = processMap?.nodes.slice().sort((a, b) => a.order - b.order)[0];

  if ((ip.goal.mechanismGoals?.length ?? 0) > 0) {
    const focalStepId = outcomeStep?.id ?? firstStep?.id;
    return focalStepId ? { level: 'l3', focalStepId } : { level: 'l2' };
  }

  if ((ip.goal.factorControls?.length ?? 0) > 0) {
    return { level: 'l2' };
  }

  return { level: 'l1' };
}
