import React from 'react';
import type { ProcessHub, ControlRecord, ControlHandoff } from '@variscout/core';
import { useAnalysisScopeStore, useImprovementProjectStore } from '@variscout/stores';
import { deriveWorkspaceViewModel } from '@variscout/hooks';
import { deriveProjectOverviewSignals, IPDetailPage } from '@variscout/ui/ipDetail';
import type { CauseProjectionInputs, CauseRow, ControlClosureInputs } from '@variscout/ui/ipDetail';
import { PWA_USER_ID } from '../lib/pwaUser';

interface ProjectsTabViewProps {
  activeHub?: ProcessHub;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onJumpOut?: (target: 'analyze' | 'explore' | 'process' | 'improve-workbench' | 'report') => void;
  approachInputs?: CauseProjectionInputs;
  onOpenCauseWorkbench?: (cause: CauseRow) => void;
  controlRecord?: ControlRecord;
  controlHandoff?: ControlHandoff;
  /** Closure checklist derived from Control record + optional handoff. */
  closureInputs?: ControlClosureInputs;
  onOpenLegacyControl?: () => void;
  onNudgeProcessOwner?: () => void;
  // PWA never exposes sign-off (IM-7 §9.2): no onNudgeSignoff / onApproveSignoff.
  onStartNewProject?: () => void;
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
  onStartNewProject,
}) => {
  const [now] = React.useState(() => Date.now());
  const storedProject = useImprovementProjectStore(s =>
    activeHub ? s.getProjectForHub(activeHub.id) : undefined
  );
  const scopeYColumn = useAnalysisScopeStore(s => s.yColumn);
  const scopeBoxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const scopeStepId = useAnalysisScopeStore(s => s.stepId);
  const scopeCategoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const scopeConditionLeaves = useAnalysisScopeStore(s => s.conditionLeaves);
  const analysisScope = React.useMemo(
    () => ({
      yColumn: scopeYColumn,
      boxplotFactor: scopeBoxplotFactor,
      stepId: scopeStepId,
      categoricalFilters: scopeCategoricalFilters,
      conditionLeaves: scopeConditionLeaves,
    }),
    [scopeBoxplotFactor, scopeCategoricalFilters, scopeConditionLeaves, scopeStepId, scopeYColumn]
  );
  const setProjectForHub = useImprovementProjectStore(s => s.setProjectForHub);

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
        onNudgeProcessOwner={onNudgeProcessOwner}
        activeHub={activeHub}
        ideas={approachInputs?.ideas}
        actions={approachInputs?.actions}
        now={now}
        currentUserId={PWA_USER_ID}
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
