import React from 'react';
import type { WorkspaceProjectScopeLabels } from './workspaceProjectScope';

export interface WorkspaceProjectScopeRibbonProps {
  title: string;
  labels: WorkspaceProjectScopeLabels;
  surface: 'Process' | 'Explore' | 'Analyze' | 'Improve' | 'Report';
}

export function WorkspaceProjectScopeRibbon({
  title,
  labels,
  surface,
}: WorkspaceProjectScopeRibbonProps) {
  const chips = [
    labels.outcomeLabel ? `Outcome: ${labels.outcomeLabel}` : null,
    ...labels.factorLabels.map(label => `Factor: ${label}`),
    labels.timelineLabel,
  ].filter((label): label is string => Boolean(label));

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface-secondary px-3 py-2 text-xs"
      data-testid="workspace-project-scope-ribbon"
    >
      <span className="font-medium text-content">
        {surface} scoped to {title}
      </span>
      {chips.map(chip => (
        <span
          key={chip}
          className="rounded-full border border-edge bg-surface px-2 py-0.5 text-content-secondary"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
