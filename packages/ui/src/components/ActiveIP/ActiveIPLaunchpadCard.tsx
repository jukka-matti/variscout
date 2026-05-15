import React, { useMemo, useState } from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { deriveActiveIPPresentation } from './activeIPPresentation';

export interface ActiveIPLaunchpadCardProps {
  projects: ImprovementProject[];
  activeProjectId?: ImprovementProject['id'] | null;
  onSelectIP: (projectId: ImprovementProject['id']) => void;
  onExitIP: () => void;
  onStartNewIP: () => void;
}

const statusClass: Record<ImprovementProject['status'], string> = {
  draft: 'bg-surface-secondary text-content-secondary',
  active: 'bg-surface-secondary text-content',
  closed: 'bg-surface-secondary text-content-secondary',
};

function sortProjects(projects: ImprovementProject[]): ImprovementProject[] {
  return [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
}

export const ActiveIPLaunchpadCard: React.FC<ActiveIPLaunchpadCardProps> = ({
  projects,
  activeProjectId,
  onSelectIP,
  onExitIP,
  onStartNewIP,
}) => {
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const sortedProjects = useMemo(() => sortProjects(projects), [projects]);
  const activeProject = activeProjectId
    ? (sortedProjects.find(project => project.id === activeProjectId) ?? null)
    : null;

  if (projects.length === 0) {
    return (
      <section className="rounded-lg border border-edge bg-surface p-4 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
          Active Improvement Project
        </div>
        <div className="mt-3 text-sm text-content-secondary">
          Start an Improvement Project to focus the workspace.
        </div>
        <button
          type="button"
          onClick={onStartNewIP}
          className="mt-4 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
        >
          + Start your first Improvement Project
        </button>
      </section>
    );
  }

  if (!activeProject) {
    return (
      <section className="rounded-lg border border-edge bg-surface p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
              Active Improvement Project
            </div>
            <h2 className="mt-2 text-lg font-semibold text-content">Free roaming</h2>
            <p className="mt-1 text-sm text-content-secondary">
              Work across the whole Hub, or pick an Improvement Project to focus the workspace.
            </p>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSwitchOpen(value => !value)}
            className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-expanded={isSwitchOpen}
            aria-controls="active-ip-switcher"
          >
            Switch IP ▾
          </button>
          <button
            type="button"
            onClick={onStartNewIP}
            className="rounded-md border border-edge px-3 py-2 text-sm font-medium text-primary hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            + New Improvement Project
          </button>

          {isSwitchOpen ? (
            <div
              id="active-ip-switcher"
              data-testid="active-ip-switcher"
              className="absolute left-0 z-10 mt-2 w-72 rounded-lg border border-edge bg-surface p-1 shadow-lg"
            >
              {sortedProjects.map(project => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    onSelectIP(project.id);
                    setIsSwitchOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <span className="min-w-0 truncate">{project.metadata.title}</span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${statusClass[project.status]}`}
                  >
                    {project.status.toUpperCase()}
                  </span>
                </button>
              ))}
              <div className="my-1 border-t border-edge" />
              <button
                type="button"
                onClick={() => {
                  onStartNewIP();
                  setIsSwitchOpen(false);
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                + New Improvement Project
              </button>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const presentation = deriveActiveIPPresentation(activeProject);
  const canSwitchIP = sortedProjects.length > 1;

  return (
    <section className="rounded-lg border border-edge bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            Active Improvement Project
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-content">{presentation.title}</h2>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusClass[activeProject.status]}`}
            >
              {presentation.statusLabel}
            </span>
          </div>
          <div className="mt-1 text-xs text-content-secondary">
            {presentation.stageLabel} · Day {presentation.dayCounter}
          </div>
        </div>
        <button
          type="button"
          onClick={onExitIP}
          className="shrink-0 text-xs font-medium text-content-secondary hover:text-content focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Exit IP
        </button>
      </div>

      <p className="mt-3 text-sm font-medium text-content">{presentation.urgentLine}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {presentation.recentActivity.slice(0, 3).map(activity => (
          <span
            key={activity}
            className="rounded-md bg-surface-secondary px-2 py-1 text-xs text-content-secondary"
          >
            {activity}
          </span>
        ))}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-3">
        {canSwitchIP ? (
          <button
            type="button"
            onClick={() => setIsSwitchOpen(value => !value)}
            className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-expanded={isSwitchOpen}
            aria-controls="active-ip-switcher"
          >
            Switch IP ▾
          </button>
        ) : null}

        {canSwitchIP && isSwitchOpen ? (
          <div
            id="active-ip-switcher"
            data-testid="active-ip-switcher"
            className="absolute left-0 z-10 mt-2 w-72 rounded-lg border border-edge bg-surface p-1 shadow-lg"
          >
            {sortedProjects.map(project => (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  onSelectIP(project.id);
                  setIsSwitchOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span className="min-w-0 truncate">{project.metadata.title}</span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${statusClass[project.status]}`}
                >
                  {project.status.toUpperCase()}
                </span>
              </button>
            ))}
            <div className="my-1 border-t border-edge" />
            <button
              type="button"
              onClick={() => {
                onExitIP();
                setIsSwitchOpen(false);
              }}
              className="w-full rounded-md px-3 py-2 text-left text-sm text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Free roaming
            </button>
            <button
              type="button"
              onClick={() => {
                onStartNewIP();
                setIsSwitchOpen(false);
              }}
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              + New Improvement Project
            </button>
          </div>
        ) : null}
        {!canSwitchIP ? (
          <button
            type="button"
            onClick={onStartNewIP}
            className="rounded-md border border-edge px-3 py-2 text-sm font-medium text-primary hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            + New Improvement Project
          </button>
        ) : null}
      </div>
    </section>
  );
};
