import React from 'react';
import type {
  ProcessHub,
  ControlRecord,
  ControlHandoff,
  ProcessParticipantRef,
} from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { HubAction } from '@variscout/core/actions';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { useAnalysisScopeStore, useImprovementProjectStore } from '@variscout/stores';
import { deriveWorkspaceViewModel } from '@variscout/hooks';
import { deriveProjectOverviewSignals, IPDetailPage } from '@variscout/ui/ipDetail';
import type { CauseProjectionInputs, CauseRow, ControlClosureInputs } from '@variscout/ui/ipDetail';

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
  onNudgeSignoff?: (projectId: ImprovementProject['id']) => void;
  onStartNewProject?: () => void;
  /** Current user's identifier (EasyAuth email/UPN). Threads into IPDetailPage for wedge ACL guards. */
  currentUserId?: string;
  /** When set, invite affordances remain visible but disabled with this explanation. */
  inviteDisabledReason?: string;
  /**
   * App-provided Control region (PR-PO-2). Forwarded into IPDetailPage's Control
   * stage. Editor builds it from the single active project + its scoped control
   * record/handoff arrays.
   */
  controlRegionSlot?: React.ReactNode;
}

/**
 * Resolve the acting user as the sign-off approver. Sign-off is decoupled from
 * the process owner (IM-7 Task 3): the approver is whoever is acting now,
 * resolved from project membership by the signed-in user id, with a generic
 * fallback when the user is unknown (no auth context in tests).
 */
function actingApprover(
  project: ImprovementProject,
  currentUserId: string | undefined
): ProcessParticipantRef {
  const me = project.metadata.members?.find(m => m.userId === currentUserId);
  if (me) {
    return { userId: me.userId, displayName: me.displayName };
  }
  return { userId: currentUserId, displayName: 'Reviewer' };
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
  onNudgeSignoff,
  onStartNewProject,
  currentUserId,
  inviteDisabledReason,
  controlRegionSlot,
}) => {
  const [now] = React.useState(() => Date.now());
  const storedProject = useImprovementProjectStore(s =>
    activeHub ? s.getProjectForHub(activeHub.id) : undefined
  );
  const scopeYColumn = useAnalysisScopeStore(s => s.yColumn);
  const scopeBoxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const scopeStepId = useAnalysisScopeStore(s => s.stepId);
  const scopeCategoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const analysisScope = React.useMemo(
    () => ({
      yColumn: scopeYColumn,
      boxplotFactor: scopeBoxplotFactor,
      stepId: scopeStepId,
      categoricalFilters: scopeCategoricalFilters,
    }),
    [scopeBoxplotFactor, scopeCategoricalFilters, scopeStepId, scopeYColumn]
  );
  const setProjectForHub = useImprovementProjectStore(s => s.setProjectForHub);
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);

  React.useEffect(() => {
    if (!activeHub || !activeHub.improvementProject) return;
    setProjectForHub(activeHub.id, activeHub.improvementProject);
  }, [activeHub, setProjectForHub]);

  const workspace = React.useMemo(
    () =>
      deriveWorkspaceViewModel({
        hub: activeHub,
        project: storedProject,
        analysisScope,
      }),
    [activeHub, analysisScope, storedProject]
  );
  const workspaceProject =
    storedProject && storedProject.deletedAt === null
      ? storedProject
      : activeHub?.improvementProject?.deletedAt === null
        ? activeHub.improvementProject
        : null;
  const projects = workspace && workspaceProject ? [workspaceProject] : [];

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

  const selectedProject = selectedProjectId
    ? (projects.find(p => p.id === selectedProjectId) ?? null)
    : null;

  if (!activeHub) {
    return (
      <div className="p-4 text-sm text-content-secondary">
        Create or select a Process Hub before opening Projects.
      </div>
    );
  }

  if (selectedProjectId) {
    const selected = selectedProject;
    if (!selected) {
      return (
        <div className="p-4 text-sm text-content-secondary" role="alert">
          Project {selectedProjectId} not found on this hub.
        </div>
      );
    }
    const dayCounter = Math.floor((now - selected.createdAt) / (24 * 60 * 60 * 1000));
    const overviewSignals = deriveProjectOverviewSignals({
      ip: selected,
      hypotheses: approachInputs?.hypotheses,
      actions: approachInputs?.actions,
    });
    return (
      <IPDetailPage
        ip={selected}
        onBackToList={() => onSelectProject('')}
        dayCounter={dayCounter}
        onJumpOut={onJumpOut}
        approachInputs={approachInputs}
        overviewSignals={overviewSignals}
        onOpenCauseWorkbench={onOpenCauseWorkbench}
        controlRecord={controlRecord}
        controlHandoff={controlHandoff}
        closureInputs={closureInputs}
        onOpenLegacyControl={onOpenLegacyControl}
        controlRegionSlot={controlRegionSlot}
        onNudgeProcessOwner={onNudgeProcessOwner}
        activeHub={activeHub}
        ideas={approachInputs?.ideas}
        actions={approachInputs?.actions}
        now={now}
        currentUserId={currentUserId}
        inviteDisabledReason={inviteDisabledReason}
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
              // Acting user, not the process owner (sign-off decoupled, IM-7 Task 3).
              approvedBy: actingApprover(selected, currentUserId),
            },
          })
        }
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
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
          className="text-sm text-blue-600 hover:text-blue-700"
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
              <div className="font-medium text-content">
                {workspace?.project.title ?? project.metadata.title}
              </div>
              <div className="mt-1 text-xs text-content-secondary">
                {(workspace?.project.status ?? project.status).toUpperCase()}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectsTabView;
