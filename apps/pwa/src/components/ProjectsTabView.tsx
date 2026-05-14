import React from 'react';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { IPDetailPage } from '@variscout/ui/ipDetail';

interface ProjectsTabViewProps {
  activeHub?: ProcessHub;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onJumpOut?: (
    target: 'investigation' | 'analyze' | 'process' | 'improve-workbench' | 'report'
  ) => void;
}

function liveProjects(hub: ProcessHub | undefined): ImprovementProject[] {
  return (hub?.improvementProjects ?? []).filter(p => p.deletedAt === null);
}

const ProjectsTabView: React.FC<ProjectsTabViewProps> = ({
  activeHub,
  selectedProjectId,
  onSelectProject,
  onJumpOut,
}) => {
  const projects = liveProjects(activeHub);

  if (!activeHub) {
    return (
      <div className="p-4 text-sm text-content-secondary">
        Create or select a Process Hub before opening Projects.
      </div>
    );
  }

  if (selectedProjectId) {
    const selected = projects.find(p => p.id === selectedProjectId);
    if (!selected) {
      return (
        <div className="p-4 text-sm text-content-secondary" role="alert">
          Improvement Project {selectedProjectId} not found on this hub.
        </div>
      );
    }
    const dayCounter = Math.floor((Date.now() - selected.createdAt) / (24 * 60 * 60 * 1000));
    return (
      <IPDetailPage
        ip={selected}
        onBackToList={() => onSelectProject('')}
        dayCounter={dayCounter}
        onJumpOut={onJumpOut}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-content">No Improvement Projects yet</h2>
        <p className="mt-2 text-sm text-content-secondary">
          Launch one from a canvas card drill-down, or click below to draft one directly.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-[var(--vs-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--vs-accent-hover)]"
        >
          + Start your first Improvement Project
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content">Improvement Projects</h2>
        <button
          type="button"
          className="text-sm text-[var(--vs-accent)] hover:text-[var(--vs-accent-hover)]"
        >
          + New Improvement Project
        </button>
      </div>
      <ul className="space-y-2">
        {projects.map(project => (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => onSelectProject(project.id)}
              className="w-full rounded-md border border-edge bg-surface p-3 text-left hover:bg-surface-secondary"
            >
              <div className="font-medium text-content">{project.metadata.title}</div>
              <div className="mt-1 text-xs text-content-secondary">
                {project.status.toUpperCase()}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectsTabView;
