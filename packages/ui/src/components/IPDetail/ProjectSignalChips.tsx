import React from 'react';
import type { ProjectOverviewSignals } from './projectOverviewSignals';

interface ProjectSignalChipsProps {
  signals?: ProjectOverviewSignals;
  groups?: Array<keyof ProjectOverviewSignals>;
  className?: string;
}

const LABELS: Record<keyof ProjectOverviewSignals, string> = {
  hypotheses: 'hypotheses',
  findings: 'findings',
  measurementPlans: 'measurement plans',
  actions: 'actions',
  team: 'teammates',
};

function formatLabel(group: keyof ProjectOverviewSignals, total: number): string {
  if (group === 'team') {
    return `${total} ${total === 1 ? 'teammate' : 'teammates'}`;
  }
  return `${total} ${LABELS[group]}`;
}

function formatDetails(
  group: keyof ProjectOverviewSignals,
  values: Record<string, number | undefined>
): string {
  const entries = Object.entries(values).filter(([key, value]) => key !== 'total' && value);
  if (entries.length === 0) return 'No status detail yet';
  return entries
    .map(([key, value]) => `${value} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
    .join(' · ');
}

const ProjectSignalChips: React.FC<ProjectSignalChipsProps> = ({
  signals,
  groups = ['hypotheses', 'findings', 'measurementPlans', 'actions', 'team'],
  className = '',
}) => {
  if (!signals) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} aria-label="Project signals">
      {groups.map(group => {
        const values = signals[group] as Record<string, number | undefined>;
        const total = values.total ?? 0;
        return (
          <div
            key={group}
            data-testid={`project-signal-${group.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-edge bg-surface px-3 py-1.5 text-xs text-content"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--vs-accent)]" aria-hidden="true" />
            <span className="font-medium">{formatLabel(group, total)}</span>
            <span className="text-content-secondary">{formatDetails(group, values)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectSignalChips;
