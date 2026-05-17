import React, { useMemo, useState } from 'react';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import type { ControlHandoff, ProcessHub, SustainmentRecord } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import IPDetailAvatar from './IPDetailAvatar';
import { deriveIPActivityEvents, type IPActivityEvent } from './activityEvents';

interface IPDetailTeamRailProps {
  ip: ImprovementProject;
  raciOverrides?: Record<string, RaciAssignment>;
  activeHub?: ProcessHub;
  ideas?: readonly ImprovementIdea[];
  actions?: readonly ActionItem[];
  sustainmentRecord?: SustainmentRecord;
  controlHandoff?: ControlHandoff;
  now?: number;
  onRequestSignoff?: () => void;
  onNudgeSignoff?: () => void;
  onApproveSignoff?: () => void;
  className?: string;
}

type TeamMember = NonNullable<ImprovementProject['metadata']['team']>[number];
type TeamRole = TeamMember['role'];
export type RaciAssignment = 'R' | 'A' | 'C' | 'I';

const ROLE_LABELS: Record<TeamRole, string> = {
  champion: 'Champion',
  sponsor: 'Sponsor',
  projectLead: 'Project lead',
  teamMember: 'Team member',
  processOwner: 'Process owner',
};

const ROLE_RACI_DEFAULTS: Record<TeamRole, RaciAssignment> = {
  champion: 'A',
  sponsor: 'A',
  projectLead: 'R',
  teamMember: 'C',
  processOwner: 'A',
};

export function teamMemberKey(member: TeamMember): string {
  return member.person.upn ?? member.person.userId ?? member.person.displayName;
}

function teamMemberRaci(
  member: TeamMember,
  raciOverrides: Record<string, RaciAssignment>
): RaciAssignment {
  return member.raci ?? raciOverrides[teamMemberKey(member)] ?? ROLE_RACI_DEFAULTS[member.role];
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(timestamp));
}

function daysAgo(timestamp: number, now: number): number {
  return Math.max(0, Math.floor((now - timestamp) / (24 * 60 * 60 * 1000)));
}

function ActivityList({ events }: { events: IPActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-content-secondary">No recent activity yet</p>;
  }
  return (
    <ul className="space-y-2">
      {events.map(event => (
        <li key={event.id} className="rounded-md bg-surface px-2 py-1.5 text-content-secondary">
          {event.label}
        </li>
      ))}
    </ul>
  );
}

const IPDetailTeamRail: React.FC<IPDetailTeamRailProps> = ({
  ip,
  raciOverrides = {},
  activeHub,
  ideas = [],
  actions = [],
  sustainmentRecord,
  controlHandoff,
  now,
  onRequestSignoff,
  onNudgeSignoff,
  onApproveSignoff,
  className = 'hidden w-[280px] flex-shrink-0 border-l border-edge bg-slate-50 p-4 text-xs lg:block',
}) => {
  const team = ip.metadata.team ?? [];
  const [activityOpen, setActivityOpen] = useState(false);
  const effectiveNow = now ?? Date.now();
  const events = useMemo(
    () =>
      deriveIPActivityEvents({
        ip,
        ideas,
        actions,
        sustainmentRecord,
        controlHandoff,
        now: effectiveNow,
      }),
    [actions, controlHandoff, effectiveNow, ideas, ip, sustainmentRecord]
  );
  const recentEvents = events.slice(0, 5);
  const approver = activeHub?.processOwner;
  const pendingSignoff = Boolean(ip.signoff?.requestedAt && !ip.signoff.approvedAt);
  const canApprove = pendingSignoff && Boolean(approver);

  return (
    <aside className={className} data-testid="ip-detail-team-rail" aria-label="Team workspace">
      <div className="uppercase tracking-wide text-content-tertiary">Team · {team.length}</div>
      {team.length === 0 ? (
        <p className="mt-3 text-content-secondary">No team members yet</p>
      ) : (
        <div className="mt-3 space-y-2">
          {team.map((member, index) => (
            <div
              key={`${member.role}-${member.person.upn ?? member.person.displayName}-${index}`}
              className="flex items-center gap-2 rounded-md border border-edge bg-surface p-2"
              data-testid={`ip-team-row-${index}`}
            >
              <IPDetailAvatar person={member.person} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-content">{member.person.displayName}</div>
                <div className="text-[11px] text-content-secondary">{ROLE_LABELS[member.role]}</div>
              </div>
              <span
                className="flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-content-secondary"
                aria-label={`RACI ${teamMemberRaci(member, raciOverrides)}`}
              >
                {teamMemberRaci(member, raciOverrides)}
              </span>
            </div>
          ))}
        </div>
      )}
      <section className="mt-5" aria-labelledby="ip-activity-heading">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="ip-activity-heading"
            className="text-[11px] font-semibold uppercase tracking-wide text-content-tertiary"
          >
            Recent activity
          </h2>
          {events.length > 5 ? (
            <button
              type="button"
              className="text-[11px] text-[var(--vs-accent)] hover:text-[var(--vs-accent-hover)]"
              onClick={() => setActivityOpen(true)}
            >
              View all activity
            </button>
          ) : null}
        </div>
        <div className="mt-2" data-testid="ip-activity-feed">
          <ActivityList events={recentEvents} />
        </div>
      </section>

      <section
        className="mt-5 rounded-md border border-edge bg-surface p-3"
        aria-labelledby="ip-signoff-heading"
      >
        <h2
          id="ip-signoff-heading"
          className="text-[11px] font-semibold uppercase tracking-wide text-content-tertiary"
        >
          Signoff
        </h2>
        {ip.signoff?.approvedAt ? (
          <p className="mt-2 text-content-secondary">
            Approved by {ip.signoff.approvedBy?.displayName ?? 'Approver'} ·{' '}
            {formatDate(ip.signoff.approvedAt)}
          </p>
        ) : pendingSignoff ? (
          <div className="mt-2 space-y-2">
            <p className="text-content-secondary">
              {approver?.displayName ?? 'Approver'} awaiting ·{' '}
              {daysAgo(ip.signoff!.requestedAt!, effectiveNow)} days ago
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-edge px-2 py-1 text-[11px] text-content-secondary hover:text-content"
                onClick={onNudgeSignoff}
                disabled={!onNudgeSignoff}
              >
                Nudge
              </button>
              {canApprove ? (
                <button
                  type="button"
                  className="rounded-md bg-[var(--vs-accent)] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[var(--vs-accent-hover)]"
                  onClick={onApproveSignoff}
                  disabled={!onApproveSignoff}
                >
                  Approve
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <button
              type="button"
              className="rounded-md bg-[var(--vs-accent)] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[var(--vs-accent-hover)]"
              onClick={onRequestSignoff}
              disabled={!onRequestSignoff}
            >
              Request approval
            </button>
          </div>
        )}
      </section>

      {activityOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setActivityOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Activity log"
            className="max-h-[80vh] w-full max-w-md overflow-auto rounded-lg border border-edge bg-surface p-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-content">Activity log</h2>
              <button
                type="button"
                className="text-xs text-content-secondary hover:text-content"
                onClick={() => setActivityOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-3">
              <ActivityList events={events} />
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
};

export default IPDetailTeamRail;
