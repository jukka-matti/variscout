import React from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProcessParticipantRef } from '@variscout/core/processHub';

interface IPDetailHeaderProps {
  ip: ImprovementProject;
  onBackToList: () => void;
  onInviteClick?: () => void;
  /** Day counter — computed by caller (typically Math.floor((now - createdAt) / DAY_MS)). */
  dayCounter?: number;
}

const STATUS_COLORS: Record<ImprovementProject['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-indigo-100 text-indigo-700',
};

function avatarColor(name: string): string {
  // deterministic, no random
  const palette = ['bg-amber-200', 'bg-green-200', 'bg-blue-200', 'bg-rose-200', 'bg-purple-200'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length] ?? palette[0]!;
}

function initial(person: ProcessParticipantRef): string {
  return person.displayName.slice(0, 1).toUpperCase();
}

const IPDetailHeader: React.FC<IPDetailHeaderProps> = ({
  ip,
  onBackToList,
  onInviteClick,
  dayCounter,
}) => {
  const team = ip.metadata.team ?? [];
  const visible = team.slice(0, 5);
  const overflow = team.length - visible.length;

  const goalSummary = (() => {
    const Ytarget = ip.goal.outcomeGoal.target;
    const baseline = ip.goal.outcomeGoal.baseline;
    if (baseline !== undefined) {
      return `Lift outcome from ${baseline} → ${Ytarget}`;
    }
    return `Target ${Ytarget}`;
  })();

  return (
    <div className="border-b border-edge bg-surface px-6 py-4">
      <div className="flex items-center gap-2 text-xs text-content-secondary">
        <button
          type="button"
          onClick={onBackToList}
          className="hover:text-content"
          data-testid="ip-detail-back"
        >
          ← All Improvement Projects
        </button>
        <span>·</span>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[ip.status]}`}
        >
          {ip.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-2 flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-content" data-testid="ip-detail-title">
            {ip.metadata.title}
          </h1>
          <div className="mt-1 text-xs text-content-secondary">
            {goalSummary}
            {dayCounter !== undefined ? ` · Day ${dayCounter}` : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex">
            {visible.map((member, idx) => (
              <div
                key={`${idx}-${member.person.displayName ?? 'anon'}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-xs font-semibold text-content ${avatarColor(member.person.displayName)} ${idx > 0 ? '-ml-2' : ''}`}
                title={member.person.displayName}
              >
                {initial(member.person)}
              </div>
            ))}
            {overflow > 0 ? (
              <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-slate-200 text-xs font-semibold text-content">
                +{overflow}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onInviteClick}
            className="text-xs text-[var(--vs-accent)] hover:text-[var(--vs-accent-hover)]"
            data-testid="ip-detail-invite"
          >
            + Invite
          </button>
        </div>
      </div>
    </div>
  );
};

export default IPDetailHeader;
