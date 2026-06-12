import React, { useMemo, useState } from 'react';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import type { ControlHandoff, ProcessHub, ControlRecord } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { isCollaborative } from '@variscout/core/improvementProject';
import { deriveIPActivityEvents, type IPActivityEvent } from './activityEvents';

interface IPDetailTeamRailProps {
  ip: ImprovementProject;
  activeHub?: ProcessHub;
  ideas?: readonly ImprovementIdea[];
  actions?: readonly ActionItem[];
  controlRecord?: ControlRecord;
  controlHandoff?: ControlHandoff;
  now?: number;
  onRequestSignoff?: () => void;
  onNudgeSignoff?: () => void;
  onApproveSignoff?: () => void;
  className?: string;
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
  // `activeHub` stays on the props contract (callers still pass it) but the rail
  // no longer reads `processOwner`: sign-off is decoupled from the process owner
  // (IM-7 Task 3). Intentionally not destructured here.
  ideas = [],
  actions = [],
  controlRecord,
  controlHandoff,
  now,
  onRequestSignoff,
  onNudgeSignoff,
  onApproveSignoff,
  className = 'hidden w-[280px] flex-shrink-0 border-l border-edge bg-slate-50 p-4 text-xs lg:block',
}) => {
  const [activityOpen, setActivityOpen] = useState(false);
  const effectiveNow = now ?? Date.now();
  const events = useMemo(
    () =>
      deriveIPActivityEvents({
        ip,
        ideas,
        actions,
        controlRecord,
        controlHandoff,
        now: effectiveNow,
      }),
    [actions, controlHandoff, effectiveNow, ideas, ip, controlRecord]
  );
  const recentEvents = events.slice(0, 5);
  const pendingSignoff = Boolean(ip.signoff?.requestedAt && !ip.signoff.approvedAt);
  // Sign-off is decoupled from the process owner and never blocks closure:
  // any acting reviewer may approve while a request is pending. The approver
  // identity is captured at the dispatch site (the acting user), not here.
  const canApprove = pendingSignoff;
  const collaborative =
    isCollaborative(ip) && (!!onRequestSignoff || !!onApproveSignoff || !!onNudgeSignoff);

  return (
    <aside
      className={className}
      data-testid="ip-detail-activity-rail"
      aria-label="Project activity"
    >
      <div className="uppercase tracking-wide text-content-tertiary">Project activity</div>
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

      {collaborative ? (
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
                Awaiting approval · {daysAgo(ip.signoff!.requestedAt!, effectiveNow)} days ago
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
      ) : null}

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
