import React from 'react';
import type { ProcessHub, ControlRecord, ControlHandoff } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { HubAction } from '@variscout/core/actions';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { useImprovementProjectStore } from '@variscout/stores';
import { IPDetailPage } from '@variscout/ui/ipDetail';
import type { CauseProjectionInputs, CauseRow, ControlClosureInputs } from '@variscout/ui/ipDetail';

// PWA is single-user (no auth). Use a stable session-local identity so
// wedge ACL guards treat the current user as a member of any project they created.
const PWA_USER_ID = 'analyst@local';

interface ProjectsTabViewProps {
  activeHub?: ProcessHub;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onJumpOut?: (target: 'analyze' | 'explore' | 'process' | 'improve-workbench' | 'report') => void;
  approachInputs?: CauseProjectionInputs;
  onOpenCauseWorkbench?: (cause: CauseRow) => void;
  controlRecord?: ControlRecord;
  controlHandoff?: ControlHandoff;
  /** Closure checklist derived from controlHandoff (folded in from former Handoff stage). */
  closureInputs?: ControlClosureInputs;
  onOpenLegacyControl?: () => void;
  onNudgeProcessOwner?: () => void;
  onProjectPatch?: (
    projectId: ImprovementProject['id'],
    patch: Extract<HubAction, { kind: 'IMPROVEMENT_PROJECT_UPDATE' }>['patch']
  ) => void;
  // PWA never exposes sign-off (IM-7 §9.2): no onNudgeSignoff / onApproveSignoff.
  onStartNewProject?: () => void;
}

function liveProjects(hub: ProcessHub | undefined): ImprovementProject[] {
  const p = hub?.improvementProject;
  return p && p.deletedAt === null ? [p] : [];
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
          // outcomeGoals[] replaces wholesale (consistent with other arrays in the contract).
          outcomeGoals: patch.goal.outcomeGoals ?? project.goal.outcomeGoals,
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
  controlRecord,
  controlHandoff,
  closureInputs,
  onOpenLegacyControl,
  onNudgeProcessOwner,
  onProjectPatch,
  onStartNewProject,
}) => {
  const [now] = React.useState(() => Date.now());
  const storedProject = useImprovementProjectStore(s =>
    activeHub ? s.getProjectForHub(activeHub.id) : undefined
  );
  const setProjectForHub = useImprovementProjectStore(s => s.setProjectForHub);
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);

  React.useEffect(() => {
    if (!activeHub || !activeHub.improvementProject) return;
    setProjectForHub(activeHub.id, activeHub.improvementProject);
  }, [activeHub, setProjectForHub]);

  const projects = storedProject
    ? [storedProject].filter(p => p.deletedAt === null)
    : liveProjects(activeHub);

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
          Project {selectedProjectId} not found on this hub.
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
        controlRecord={controlRecord}
        controlHandoff={controlHandoff}
        closureInputs={closureInputs}
        onOpenLegacyControl={onOpenLegacyControl}
        onNudgeProcessOwner={onNudgeProcessOwner}
        activeHub={activeHub}
        ideas={approachInputs?.ideas}
        actions={approachInputs?.actions}
        now={now}
        currentUserId={PWA_USER_ID}
        onMembersChange={(members: ProjectMember[]) => {
          const prevCount = selected.metadata.members?.length ?? 0;
          // Set the durable collaboration marker ONCE, when the roster first
          // grows beyond its solo creator (first invite). Never re-stamped and
          // never cleared on removal — see ImprovementProject.collaboratedAt.
          const markFirstInvite =
            members.length > prevCount && !selected.collaboratedAt ? { collaboratedAt: now } : {};
          applyProjectPatch(selected, {
            metadata: { ...selected.metadata, members },
            ...markFirstInvite,
          });
        }}
        // PWA never exposes sign-off (IM-7 §9.2): it is a single-user, Mode-1
        // solo surface. No onRequestSignoff / onNudgeSignoff / onApproveSignoff
        // is wired here. The team rail gates the sign-off section on BOTH
        // isCollaborative(ip) AND at least one sign-off callback being present,
        // so the section is fully absent — even after collaboratedAt is stamped
        // by a local invite — because no callbacks are wired in the PWA.
      />
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-content">No Projects yet</h2>
        <p className="mt-2 text-sm text-content-secondary">
          Launch one from a canvas card drill-down, or click below to draft one directly.
        </p>
        <button
          type="button"
          onClick={onStartNewProject}
          className="mt-4 rounded-md bg-[var(--vs-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--vs-accent-hover)]"
        >
          + Start your first Project
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content">Projects</h2>
        <button
          type="button"
          onClick={onStartNewProject}
          className="text-sm text-[var(--vs-accent)] hover:text-[var(--vs-accent-hover)]"
        >
          + New Project
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
