import React from 'react';
import { ArrowRight, CircleAlert, Plus } from 'lucide-react';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';

interface ProcessHubCardProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  isSelected?: boolean;
  onOpen: () => void;
  onStartInvestigation: () => void;
}

const ProcessHubCard: React.FC<ProcessHubCardProps> = ({
  rollup,
  isSelected = false,
  onOpen,
  onStartInvestigation,
}) => {
  const { hub } = rollup;

  return (
    <div
      className={`rounded-lg border bg-surface-secondary p-4 transition-colors ${
        isSelected ? 'border-blue-500' : 'border-edge hover:bg-surface-primary'
      }`}
      data-testid="process-hub-card"
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" className="min-w-0 text-left" onClick={onOpen}>
          <h3 className="text-sm font-semibold text-content leading-snug">{hub.name}</h3>
          <p className="mt-1 text-xs text-content-secondary">
            {rollup.activeInvestigationCount} active investigation
            {rollup.activeInvestigationCount === 1 ? '' : 's'}
          </p>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onStartInvestigation}
            className="p-1.5 rounded-md text-content-secondary hover:text-content hover:bg-surface-primary"
            aria-label={`Start investigation in ${hub.name}`}
            title={`Start investigation in ${hub.name}`}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="p-1.5 rounded-md text-content-secondary hover:text-content hover:bg-surface-primary"
            aria-label={`Open ${hub.name}`}
            title={`Open ${hub.name}`}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[0.6875rem] text-content-secondary">
        {Object.entries(rollup.statusCounts).map(([status, count]) => (
          <span key={status} className="rounded-full border border-edge px-2 py-0.5">
            {status.replace(/-/g, ' ')}: {count}
          </span>
        ))}
        {rollup.overdueActionCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-600/50 px-2 py-0.5 text-amber-400">
            <CircleAlert size={12} />
            {rollup.overdueActionCount} overdue
          </span>
        )}
      </div>

      {(rollup.currentUnderstandingSummary ||
        rollup.problemConditionSummary ||
        rollup.nextMove) && (
        <div className="mt-3 space-y-1 text-xs text-content-secondary">
          {rollup.currentUnderstandingSummary && <p>{rollup.currentUnderstandingSummary}</p>}
          {rollup.problemConditionSummary && <p>{rollup.problemConditionSummary}</p>}
          {rollup.nextMove && <p className="text-content">Next: {rollup.nextMove}</p>}
        </div>
      )}
    </div>
  );
};

export default ProcessHubCard;
