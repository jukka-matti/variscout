import React from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';

interface IPDetailHeaderProps {
  ip: ImprovementProject;
  onBackToList: () => void;
  /** Day counter — computed by caller (typically Math.floor((now - createdAt) / DAY_MS)). */
  dayCounter?: number;
}

const STATUS_COLORS: Record<ImprovementProject['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-indigo-100 text-indigo-700',
};

const IPDetailHeader: React.FC<IPDetailHeaderProps> = ({ ip, onBackToList, dayCounter }) => {
  const goalSummary = (() => {
    // Legacy first-outcome read — multi-outcome header summary is a later phase
    // (Spec 2 §3.2.2 / PR-CCJ-C1).
    const first = ip.goal.outcomeGoals[0];
    if (!first) return 'No outcome target';
    const Ytarget = first.target;
    const baseline = first.baseline;
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
          ← All Projects
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

        <div className="text-right text-xs text-content-secondary">Local Workspace</div>
      </div>
    </div>
  );
};

export default IPDetailHeader;
