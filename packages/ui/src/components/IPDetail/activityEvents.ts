import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import type { ControlHandoff, SustainmentRecord } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';

export type IPActivityEventKind =
  | 'section-edit'
  | 'goal-changed'
  | 'hypothesis-linked'
  | 'idea-selected'
  | 'action-status'
  | 'signoff-requested'
  | 'signoff-approved'
  | 'sustainment-updated'
  | 'handoff-updated';

export interface IPActivityEvent {
  id: string;
  kind: IPActivityEventKind;
  at: number;
  actor: string;
  verb: string;
  object: string;
  label: string;
}

export interface DeriveIPActivityEventsInput {
  ip: ImprovementProject;
  ideas?: readonly ImprovementIdea[];
  actions?: readonly ActionItem[];
  sustainmentRecord?: SustainmentRecord;
  controlHandoff?: ControlHandoff;
  now: number;
}

const systemActor = 'System';

function relativeTime(at: number, now: number): string {
  const diff = Math.max(0, now - at);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) {
    const minutes = Math.max(1, Math.floor(diff / minute));
    return `${minutes}m ago`;
  }
  if (diff < day) {
    const hours = Math.max(1, Math.floor(diff / hour));
    return `${hours}h ago`;
  }
  const days = Math.max(1, Math.floor(diff / day));
  return `${days}d ago`;
}

function labelFor(event: Omit<IPActivityEvent, 'label'>, now: number): string {
  return `${event.actor} ${event.verb} ${event.object} · ${relativeTime(event.at, now)}`;
}

function pushEvent(
  events: Array<Omit<IPActivityEvent, 'label'>>,
  event: Omit<IPActivityEvent, 'label'> | undefined
): void {
  if (!event || !Number.isFinite(event.at)) return;
  events.push(event);
}

function statusLabel(status: ActionItem['status']): string {
  if (status === 'in-progress') return 'in progress';
  return status ?? 'open';
}

export function deriveIPActivityEvents(input: DeriveIPActivityEventsInput): IPActivityEvent[] {
  const { now } = input;
  const events: Array<Omit<IPActivityEvent, 'label'>> = [];
  const { ip } = input;

  if (ip.goal.updatedAt !== undefined) {
    pushEvent(events, {
      id: `${ip.id}:goal:${ip.goal.updatedAt}`,
      kind: 'goal-changed',
      at: ip.goal.updatedAt,
      actor: systemActor,
      verb: 'changed',
      object: 'goal',
    });
  }

  const sectionEvents: Array<[keyof ImprovementProject['sections'], string]> = [
    ['background', 'Background'],
    ['investigationLineage', 'Investigation lineage'],
    ['approach', 'Approach'],
    ['outcomeReference', 'Outcome reference'],
  ];
  sectionEvents.forEach(([key, label]) => {
    const at = ip.sections[key].updatedAt;
    if (at === undefined) return;
    pushEvent(events, {
      id: `${ip.id}:section:${key}:${at}`,
      kind: 'section-edit',
      at,
      actor: systemActor,
      verb: 'updated',
      object: label,
    });
  });

  const lineageUpdatedAt = ip.sections.investigationLineage.updatedAt;
  const hypothesisCount = ip.sections.investigationLineage.hypothesisIds?.length ?? 0;
  if (lineageUpdatedAt !== undefined && hypothesisCount > 0) {
    pushEvent(events, {
      id: `${ip.id}:hypotheses:${lineageUpdatedAt}`,
      kind: 'hypothesis-linked',
      at: lineageUpdatedAt,
      actor: systemActor,
      verb: 'linked',
      object: `${hypothesisCount} ${hypothesisCount === 1 ? 'hypothesis' : 'hypotheses'}`,
    });
  }

  (input.ideas ?? []).forEach(idea => {
    if (idea.deletedAt !== null || idea.selected !== true || idea.updatedAt === undefined) return;
    pushEvent(events, {
      id: `${idea.id}:selected:${idea.updatedAt}`,
      kind: 'idea-selected',
      at: idea.updatedAt,
      actor: systemActor,
      verb: 'selected',
      object: `idea ${idea.text}`,
    });
  });

  (input.actions ?? []).forEach(action => {
    if (action.deletedAt !== null || action.updatedAt === undefined || action.status === undefined)
      return;
    pushEvent(events, {
      id: `${action.id}:status:${action.updatedAt}`,
      kind: 'action-status',
      at: action.updatedAt,
      actor: action.assignedTo?.displayName ?? action.createdBy?.displayName ?? systemActor,
      verb: 'moved',
      object: `action ${action.text} to ${statusLabel(action.status)}`,
    });
  });

  if (ip.signoff?.requestedAt !== undefined) {
    pushEvent(events, {
      id: `${ip.id}:signoff-requested:${ip.signoff.requestedAt}`,
      kind: 'signoff-requested',
      at: ip.signoff.requestedAt,
      actor: systemActor,
      verb: 'requested',
      object: 'signoff',
    });
  }

  if (ip.signoff?.approvedAt !== undefined) {
    pushEvent(events, {
      id: `${ip.id}:signoff-approved:${ip.signoff.approvedAt}`,
      kind: 'signoff-approved',
      at: ip.signoff.approvedAt,
      actor: ip.signoff.approvedBy?.displayName ?? systemActor,
      verb: 'approved',
      object: 'signoff',
    });
  }

  if (input.sustainmentRecord && input.sustainmentRecord.deletedAt === null) {
    pushEvent(events, {
      id: `${input.sustainmentRecord.id}:updated:${input.sustainmentRecord.updatedAt}`,
      kind: 'sustainment-updated',
      at: input.sustainmentRecord.updatedAt,
      actor: input.sustainmentRecord.owner?.displayName ?? systemActor,
      verb: 'updated',
      object: `sustainment ${input.sustainmentRecord.title}`,
    });
  }

  if (input.controlHandoff && input.controlHandoff.deletedAt === null) {
    pushEvent(events, {
      id: `${input.controlHandoff.id}:created:${input.controlHandoff.createdAt}`,
      kind: 'handoff-updated',
      at: input.controlHandoff.createdAt,
      actor: input.controlHandoff.recordedBy.displayName,
      verb: 'started',
      object: `handoff ${input.controlHandoff.systemName}`,
    });
  }

  return events
    .sort((a, b) => b.at - a.at || a.id.localeCompare(b.id))
    .map(event => ({
      ...event,
      label: labelFor(event, now),
    }));
}
