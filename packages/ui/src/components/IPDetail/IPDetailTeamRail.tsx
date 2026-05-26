import React, { useMemo, useState } from 'react';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import type { ControlHandoff, ProcessHub, SustainmentRecord } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProjectMember, ProjectRole } from '@variscout/core/projectMembership';
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

export type RaciAssignment = 'R' | 'A' | 'C' | 'I';

const ROLE_LABELS: Record<ProjectRole, string> = {
  lead: 'Lead',
  member: 'Member',
  sponsor: 'Sponsor',
};

/**
 * Derive a display-layer RACI tag from the wedge V1 project role. RACI is NOT
 * stored on the entity in wedge V1 — it is computed for the team-rail chip
 * (and overridable per-member via raciOverrides for local UI scratchpad use).
 * Kept local to TeamRail because RACI is a display concern, not a domain rule.
 */
function roleToRaci(role: ProjectRole): RaciAssignment {
  switch (role) {
    case 'lead':
      return 'R';
    case 'sponsor':
      return 'A';
    case 'member':
      return 'C';
  }
}

export function memberKey(member: ProjectMember): string {
  return member.userId || member.displayName;
}

function memberRaci(
  member: ProjectMember,
  raciOverrides: Record<string, RaciAssignment>
): RaciAssignment {
  return raciOverrides[memberKey(member)] ?? roleToRaci(member.role);
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
  const members = ip.metadata.members ?? [];
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
      <div className="uppercase tracking-wide text-content-tertiary">Team · {members.length}</div>
      {members.length === 0 ? (
        <p className="mt-3 text-content-secondary">No team members yet</p>
      ) : (
        <div className="mt-3 space-y-2">
          {members.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center gap-2 rounded-md border border-edge bg-surface p-2"
              data-testid={`ip-team-row-${index}`}
            >
              <IPDetailAvatar person={{ displayName: member.displayName }} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-content">{member.displayName}</div>
                <div className="text-[11px] text-content-secondary">{ROLE_LABELS[member.role]}</div>
              </div>
              <span
                className="flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-content-secondary"
                aria-label={`RACI ${memberRaci(member, raciOverrides)}`}
              >
                {memberRaci(member, raciOverrides)}
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
