import React from 'react';
import type { CauseRow, CauseStatus } from './causeProjection';

interface ApproachCauseCardProps {
  cause: CauseRow;
  onOpenWorkbench: (cause: CauseRow) => void;
}

const STATUS_LABEL: Record<CauseStatus, string> = {
  'pending-idea': 'PENDING',
  'in-progress': 'IN PROGRESS',
  resolved: 'RESOLVED',
  'ruled-out': 'RULED OUT',
};

const STATUS_PILL: Record<CauseStatus, string> = {
  'pending-idea': 'bg-amber-100 text-amber-800',
  'in-progress': 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
  'ruled-out': 'bg-slate-100 text-slate-600',
};

function actionSummary(actions: CauseRow['actions']): string {
  if (actions.length === 0) return 'No actions yet';
  const done = actions.filter(a => a.status === 'done').length;
  const inProgress = actions.filter(a => a.status === 'in-progress').length;
  const pending = actions.length - done - inProgress;
  return `${done} done · ${inProgress} in progress · ${pending} pending`;
}

const ApproachCauseCard: React.FC<ApproachCauseCardProps> = ({ cause, onOpenWorkbench }) => {
  return (
    <div
      className={`rounded-md border p-4 ${
        cause.causeStatus === 'pending-idea'
          ? 'border-amber-300 bg-amber-50'
          : 'border-edge bg-slate-50'
      }`}
      data-testid={`cause-card-${cause.factor}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-medium text-content">{cause.factor}</div>
          <div className="mt-1 text-xs text-content-secondary">
            {cause.hypothesis ? cause.hypothesis.name : '—'} · target: {cause.targetCondition}
          </div>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${STATUS_PILL[cause.causeStatus]}`}
        >
          {STATUS_LABEL[cause.causeStatus]}
        </span>
      </div>

      {cause.selectedIdea ? (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-content-tertiary">Selected idea</div>
            <div className="mt-0.5 text-content">{cause.selectedIdea.text}</div>
          </div>
          <div className="text-right">
            <div className="text-content-tertiary">Actions</div>
            <div className="mt-0.5 font-mono text-content">{actionSummary(cause.actions)}</div>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs text-amber-900">
          No idea selected — brainstorm in the Improve workbench.
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenWorkbench(cause)}
        className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
        data-testid="cause-open-workbench"
      >
        Open in Improve workbench →
      </button>
    </div>
  );
};

export default ApproachCauseCard;
