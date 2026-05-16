import { useState } from 'react';
import type { Invitation } from '@variscout/core/projectMembership';

export interface PendingInvitesBannerProps {
  invites: Invitation[];
  onAccept: (id: Invitation['id']) => void;
  onDecline: (id: Invitation['id']) => void;
  /** Optional resolver to display a human-readable project name instead of the projectId UUID. */
  resolveProjectName?: (projectId: string) => string | undefined;
}

const ROLE_LABEL: Record<string, string> = {
  lead: 'Lead',
  member: 'Member',
  sponsor: 'Sponsor',
};

export function PendingInvitesBanner({
  invites,
  onAccept,
  onDecline,
  resolveProjectName,
}: PendingInvitesBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (invites.length === 0) return null;

  const headline = `${invites.length} pending invitation${invites.length === 1 ? '' : 's'}`;

  return (
    <section
      aria-label="Pending invitations"
      className="border border-edge rounded p-3 mb-4 bg-surface-secondary"
    >
      <header className="flex items-center justify-between">
        <span className="text-content text-sm font-medium">{headline}</span>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-content-secondary hover:text-content"
        >
          {expanded ? 'Hide invitations' : 'Show invitations'}
        </button>
      </header>

      {expanded && (
        <ul className="mt-3 divide-y divide-edge">
          {invites.map(inv => (
            <li key={inv.id} className="py-2 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-content truncate">
                  {resolveProjectName?.(inv.projectId) ?? inv.projectId}
                </div>
                <div className="text-xs text-content-muted">{ROLE_LABEL[inv.role] ?? inv.role}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onAccept(inv.id)}
                  aria-label={`Accept ${inv.role} invitation`}
                  className="px-3 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => onDecline(inv.id)}
                  aria-label={`Decline ${inv.role} invitation`}
                  className="px-3 py-1 rounded text-xs text-content-secondary hover:bg-surface-secondary transition-colors"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
