import React, { useMemo } from 'react';
import type { ControlMetadataProjection, ControlRecord } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { isFormalizedProject } from '@variscout/core/improvementProject';
import { deriveWorkspaceProjectPresentation } from './workspaceProjectPresentation';

export interface WorkspaceProjectLaunchpadCardProps {
  projects: ImprovementProject[];
  controlRecords?: ControlRecord[];
  onStartNewWorkspace: () => void;
}

const statusClass: Record<ImprovementProject['status'], string> = {
  draft: 'bg-surface-secondary text-content-secondary',
  active: 'bg-surface-secondary text-content',
  closed: 'bg-surface-secondary text-content-secondary',
};

function sortProjects(projects: ImprovementProject[]): ImprovementProject[] {
  return [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
}

function projectSustainmentProjection(
  project: ImprovementProject,
  records: ControlRecord[] | undefined
): ControlMetadataProjection | undefined {
  const liveRecords = (records ?? []).filter(record => record.deletedAt === null);
  const referencedId = project.sections.outcomeReference.sustainmentRecordId;
  const record =
    liveRecords.find(candidate => referencedId !== undefined && candidate.id === referencedId) ??
    liveRecords.find(candidate => candidate.improvementProjectId === project.id);
  if (!record) return undefined;
  return {
    recordId: record.id,
    ladderStep: record.ladderStep,
    nextCheckSuggestedAt: record.nextCheckSuggestedAt,
    status: record.status,
  };
}

export const WorkspaceProjectLaunchpadCard: React.FC<WorkspaceProjectLaunchpadCardProps> = ({
  projects,
  controlRecords,
  onStartNewWorkspace,
}) => {
  const sortedProjects = useMemo(() => sortProjects(projects), [projects]);
  const activeProject = sortedProjects[0] ?? null;

  if (projects.length === 0) {
    return (
      <section className="rounded-lg border border-edge bg-surface p-4 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
          Workspace
        </div>
        <div className="mt-3 text-sm text-content-secondary">
          Start a Workspace to frame, analyze, improve, and report.
        </div>
        <button
          type="button"
          onClick={onStartNewWorkspace}
          className="mt-4 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
        >
          New Workspace
        </button>
      </section>
    );
  }

  if (!activeProject) {
    return null;
  }

  const presentation = deriveWorkspaceProjectPresentation(
    activeProject,
    Date.now(),
    projectSustainmentProjection(activeProject, controlRecords)
  );
  const formalized = isFormalizedProject(activeProject);

  return (
    <section className="rounded-lg border border-edge bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            Workspace
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-content">{presentation.title}</h2>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusClass[activeProject.status]}`}
            >
              {formalized ? presentation.statusLabel : 'Informal'}
            </span>
          </div>
          <div className="mt-1 text-xs text-content-secondary">
            {formalized ? `${presentation.stageLabel} Project` : 'Name & formalize when ready'}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-content">
        {formalized ? presentation.urgentLine : 'Quick analysis Workspace'}
      </p>
    </section>
  );
};
