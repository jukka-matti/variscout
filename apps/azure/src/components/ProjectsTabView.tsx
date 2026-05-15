import React from 'react';
import type { ProcessHub, SustainmentRecord, ControlHandoff } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { HubAction } from '@variscout/core/actions';
import { useImprovementProjectStore } from '@variscout/stores';
import { IPDetailPage } from '@variscout/ui/ipDetail';
import type {
  CauseProjectionInputs,
  CauseRow,
  HandoffChecklistInputs,
} from '@variscout/ui/ipDetail';

interface ProjectsTabViewProps {
  activeHub?: ProcessHub;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onJumpOut?: (
    target: 'investigation' | 'analyze' | 'process' | 'improve-workbench' | 'report'
  ) => void;
  approachInputs?: CauseProjectionInputs;
  onOpenCauseWorkbench?: (cause: CauseRow) => void;
  sustainmentRecord?: SustainmentRecord;
  controlHandoff?: ControlHandoff;
  handoffInputs?: HandoffChecklistInputs;
  onOpenLegacySustainment?: () => void;
  onOpenLegacyHandoff?: () => void;
  onNudgeProcessOwner?: () => void;
  onProjectPatch?: (
    projectId: ImprovementProject['id'],
    patch: Extract<HubAction, { kind: 'IMPROVEMENT_PROJECT_UPDATE' }>['patch']
  ) => void;
  onNudgeSignoff?: (projectId: ImprovementProject['id']) => void;
  onStartNewProject?: () => void;
}

function liveProjects(hub: ProcessHub | undefined): ImprovementProject[] {
  return (hub?.improvementProjects ?? []).filter(p => p.deletedAt === null);
}

function mergeProjectPatch(
  project: ImprovementProject,
  patch: Extract<HubAction, { kind: 'IMPROVEMENT_PROJECT_UPDATE' }>['patch'],
  updatedAt: number
): ImprovementProject {
  return {
    ...project,
    ...patch,
    metadata: patch.metadata ? { ...project.metadata, ...patch.metadata } : project.metadata,
    goal: patch.goal
      ? {
          ...project.goal,
          ...patch.goal,
          ...(patch.goal.outcomeGoal
            ? { outcomeGoal: { ...project.goal.outcomeGoal, ...patch.goal.outcomeGoal } }
            : {}),
        }
      : project.goal,
    signoff: patch.signoff ? { ...(project.signoff ?? {}), ...patch.signoff } : project.signoff,
    sections: patch.sections
      ? {
          background: { ...project.sections.background, ...(patch.sections.background ?? {}) },
          investigationLineage: {
            ...project.sections.investigationLineage,
            ...(patch.sections.investigationLineage ?? {}),
          },
          approach: { ...project.sections.approach, ...(patch.sections.approach ?? {}) },
          outcomeReference: {
            ...project.sections.outcomeReference,
            ...(patch.sections.outcomeReference ?? {}),
          },
        }
      : project.sections,
    updatedAt,
  };
}

const ProjectsTabView: React.FC<ProjectsTabViewProps> = ({
  activeHub,
  selectedProjectId,
  onSelectProject,
  onJumpOut,
  approachInputs,
  onOpenCauseWorkbench,
  sustainmentRecord,
  controlHandoff,
  handoffInputs,
  onOpenLegacySustainment,
  onOpenLegacyHandoff,
  onNudgeProcessOwner,
  onProjectPatch,
  onNudgeSignoff,
  onStartNewProject,
}) => {
  const [now] = React.useState(() => Date.now());
  const storedProjects = useImprovementProjectStore(s =>
    activeHub ? s.projectsByHub[activeHub.id] : undefined
  );
  const setProjectsForHub = useImprovementProjectStore(s => s.setProjectsForHub);
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);

  React.useEffect(() => {
    if (!activeHub) return;
    setProjectsForHub(activeHub.id, activeHub.improvementProjects ?? []);
  }, [activeHub, setProjectsForHub]);

  const projects = (storedProjects ?? liveProjects(activeHub)).filter(p => p.deletedAt === null);

  const applyProjectPatch = React.useCallback(
    (
      project: ImprovementProject,
      patch: Extract<HubAction, { kind: 'IMPROVEMENT_PROJECT_UPDATE' }>['patch']
    ) => {
      const updatedAt = Date.now();
      upsertProject(mergeProjectPatch(project, patch, updatedAt));
      onProjectPatch?.(project.id, patch);
    },
    [onProjectPatch, upsertProject]
  );

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
    const dayCounter = Math.floor((now - selected.createdAt) / (24 * 60 * 60 * 1000));
    return (
      <IPDetailPage
        ip={selected}
        onBackToList={() => onSelectProject('')}
        dayCounter={dayCounter}
        onJumpOut={onJumpOut}
        approachInputs={approachInputs}
        onOpenCauseWorkbench={onOpenCauseWorkbench}
        sustainmentRecord={sustainmentRecord}
        controlHandoff={controlHandoff}
        handoffInputs={handoffInputs}
        onOpenLegacySustainment={onOpenLegacySustainment}
        onOpenLegacyHandoff={onOpenLegacyHandoff}
        onNudgeProcessOwner={onNudgeProcessOwner}
        activeHub={activeHub}
        ideas={approachInputs?.ideas}
        actions={approachInputs?.actions}
        now={now}
        onTeamChange={team =>
          applyProjectPatch(selected, { metadata: { ...selected.metadata, team } })
        }
        onRequestSignoff={() =>
          applyProjectPatch(selected, {
            signoff: {
              ...(selected.signoff ?? {}),
              requestedAt: Date.now(),
              approvedAt: undefined,
              approvedBy: undefined,
            },
          })
        }
        onNudgeSignoff={() => onNudgeSignoff?.(selected.id)}
        onApproveSignoff={() =>
          applyProjectPatch(selected, {
            signoff: {
              ...(selected.signoff ?? {}),
              requestedAt: selected.signoff?.requestedAt ?? Date.now(),
              approvedAt: Date.now(),
              approvedBy: activeHub.processOwner ?? { displayName: 'Process owner' },
            },
          })
        }
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
          onClick={onStartNewProject}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
          onClick={onStartNewProject}
          className="text-sm text-blue-600 hover:text-blue-700"
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
