import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImprovementProjectForm } from '@variscout/ui';
import { useImprovementProjectStore, useAnalyzeStore } from '@variscout/stores';
import { useReturnNavigation } from '@variscout/hooks';
import type { ProcessHub } from '@variscout/core';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type {
  ImprovementProject,
  ImprovementProjectFactorControl,
  ImprovementProjectGoal,
  ImprovementProjectMechanismGoal,
  ImprovementProjectMetadata,
  ImprovementProjectOutcomeGoal,
  ImprovementProjectSignoff,
} from '@variscout/core/improvementProject';
import { pwaHubRepository } from '../persistence';

interface ImprovementProjectPanelProps {
  activeHub?: ProcessHub;
  onBack: () => void;
  onOpenWall?: () => void;
}

type ProjectPatch = {
  status?: ImprovementProject['status'];
  metadata?: Partial<ImprovementProjectMetadata>;
  /** Goal patch: outcomeGoals[] replaces wholesale (no shallow-merge of array elements).
   *  Consumers reconstruct the full list when applying a per-outcome edit. */
  goal?: Partial<Omit<ImprovementProjectGoal, 'outcomeGoals'>> & {
    outcomeGoals?: ImprovementProjectOutcomeGoal[];
  };
  sections?: Partial<ImprovementProject['sections']>;
  signoff?: Partial<ImprovementProjectSignoff>;
};

type RepositoryProjectPatch = Partial<
  Omit<ImprovementProject, 'id' | 'createdAt' | 'hubId' | 'updatedAt' | 'deletedAt' | 'sections'>
> & {
  sections?: Partial<ImprovementProject['sections']>;
};

const buttonClassName =
  'rounded-md border border-edge bg-surface px-3 py-2 text-left text-sm font-medium text-content transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring';

function liveProjects(projects: ImprovementProject[] | undefined): ImprovementProject[] {
  return (projects ?? []).filter(project => project.deletedAt === null);
}

function liveOutcomes(hub: ProcessHub): OutcomeSpec[] {
  return (hub.outcomes ?? []).filter(outcome => outcome.deletedAt === null);
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ip-${Date.now()}`;
}

function buildDraftProject(hub: ProcessHub): ImprovementProject {
  const [firstOutcome] = liveOutcomes(hub);
  const now = Date.now();
  const title = firstOutcome?.columnName
    ? `Improve ${firstOutcome.columnName}`
    : `Improvement project for ${hub.name}`;

  return {
    id: makeId(),
    hubId: hub.id,
    status: 'draft',
    metadata: { title },
    goal: {
      outcomeGoals: [
        {
          outcomeSpecId: firstOutcome?.id ?? `${hub.id}:draft-outcome`,
          target: firstOutcome?.target ?? 1,
        },
      ],
      freeText: firstOutcome
        ? `Draft outcome target for ${firstOutcome.columnName}.`
        : 'Draft outcome target to define during framing.',
    },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function mergeProjectPatch(project: ImprovementProject, patch: ProjectPatch): ImprovementProject {
  return {
    ...project,
    ...patch,
    metadata: patch.metadata ? { ...project.metadata, ...patch.metadata } : project.metadata,
    goal: patch.goal
      ? {
          ...project.goal,
          ...patch.goal,
          // outcomeGoals[] replaces wholesale (consistent with factorControls[] /
          // mechanismGoals[]) — see improvementProjectActions.ts JSDoc.
          outcomeGoals: patch.goal.outcomeGoals ?? project.goal.outcomeGoals,
        }
      : project.goal,
    sections: patch.sections
      ? {
          background: { ...project.sections.background, ...patch.sections.background },
          investigationLineage: {
            ...project.sections.investigationLineage,
            ...patch.sections.investigationLineage,
          },
          approach: { ...project.sections.approach, ...patch.sections.approach },
          outcomeReference: {
            ...project.sections.outcomeReference,
            ...patch.sections.outcomeReference,
          },
        }
      : project.sections,
    updatedAt: Date.now(),
  };
}

function toRepositoryPatch(
  project: ImprovementProject,
  patch: ProjectPatch
): RepositoryProjectPatch {
  return {
    ...patch,
    metadata: patch.metadata ? { ...project.metadata, ...patch.metadata } : undefined,
    goal: patch.goal
      ? {
          ...project.goal,
          ...patch.goal,
          // outcomeGoals[] replaces wholesale.
          outcomeGoals: patch.goal.outcomeGoals ?? project.goal.outcomeGoals,
        }
      : undefined,
    signoff: patch.signoff ? { ...(project.signoff ?? {}), ...patch.signoff } : undefined,
  };
}

const ImprovementProjectPanel: React.FC<ImprovementProjectPanelProps> = ({
  activeHub,
  onBack,
  onOpenWall,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const creatingForHubRef = useRef<string | null>(null);
  const { captureReturnTarget } = useReturnNavigation();

  const projectsByHub = useImprovementProjectStore(state => state.projectsByHub);
  const setProjectsForHub = useImprovementProjectStore(state => state.setProjectsForHub);
  const upsertProject = useImprovementProjectStore(state => state.upsertProject);
  const hypotheses = useAnalyzeStore(state => state.hypotheses);
  const findings = useAnalyzeStore(state => state.findings);

  const hubProjects = useMemo(() => liveProjects(activeHub?.improvementProjects), [activeHub]);
  const storeProjects = activeHub ? projectsByHub[activeHub.id] : undefined;
  const projects = useMemo(
    () => liveProjects(storeProjects ?? hubProjects),
    [hubProjects, storeProjects]
  );

  useEffect(() => {
    if (!activeHub) return;
    if (activeHub.improvementProjects !== undefined) {
      setProjectsForHub(activeHub.id, hubProjects);
    }
  }, [activeHub, hubProjects, setProjectsForHub]);

  useEffect(() => {
    if (!activeHub || projects.length > 0 || creatingForHubRef.current === activeHub.id) return;

    const project = buildDraftProject(activeHub);
    creatingForHubRef.current = activeHub.id;
    setError(null);

    void pwaHubRepository
      .dispatch({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: activeHub.id, project })
      .then(() => {
        upsertProject(project);
        setSelectedProjectId(project.id);
      })
      .catch(() => {
        setError('Could not create a Project draft.');
      })
      .finally(() => {
        creatingForHubRef.current = null;
      });
  }, [activeHub, projects.length, upsertProject]);

  const selectedProject =
    projects.length === 1
      ? projects[0]
      : (projects.find(project => project.id === selectedProjectId) ?? null);

  const updateSelectedProject = useCallback(
    (patch: ProjectPatch) => {
      if (!selectedProject) return;
      const next = mergeProjectPatch(selectedProject, patch);
      upsertProject(next);
      void pwaHubRepository
        .dispatch({
          kind: 'IMPROVEMENT_PROJECT_UPDATE',
          projectId: selectedProject.id,
          patch: toRepositoryPatch(selectedProject, patch),
        })
        .catch(() => {
          setError('Could not save the Project changes.');
        });
    },
    [selectedProject, upsertProject]
  );

  const selectProject = (project: ImprovementProject) => {
    upsertProject(project);
    setSelectedProjectId(project.id);
  };

  const handleLineageNavigate = useCallback(
    (target: { kind: 'hypothesis' | 'finding'; id: string }) => {
      if (!selectedProject) return;
      captureReturnTarget({
        sourceSurface: 'improvement-project',
        params: {
          projectId: selectedProject.id,
          targetKind: target.kind,
          targetId: target.id,
        },
        uiState: { section: 'lineage' },
      });
      onOpenWall?.();
    },
    [captureReturnTarget, onOpenWall, selectedProject]
  );

  const outcomes = activeHub ? liveOutcomes(activeHub) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-surface-primary p-4 text-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Project</h2>
          <p className="text-sm text-content-secondary">{activeHub?.name ?? 'No active hub'}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Back to FRAME
        </button>
      </div>

      {!activeHub ? (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Create or select a Process Hub before opening a Project.
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm">
          {error}
        </p>
      ) : projects.length > 1 && !selectedProject ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-content">Choose a Project</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {projects.map(project => (
              <button
                key={project.id}
                type="button"
                className={buttonClassName}
                onClick={() => selectProject(project)}
              >
                {project.metadata.title}
              </button>
            ))}
          </div>
        </div>
      ) : selectedProject ? (
        <ImprovementProjectForm
          metadataProps={{
            ...selectedProject.metadata,
            onTitleChange: title => updateSelectedProject({ metadata: { title } }),
            onMembersChange: members => updateSelectedProject({ metadata: { members } }),
            onBusinessCaseChange: businessCase =>
              updateSelectedProject({ metadata: { businessCase } }),
            onFinancialImpactChange: financialImpact =>
              updateSelectedProject({ metadata: { financialImpact } }),
            onInvestigationIdChange: investigationId =>
              updateSelectedProject({ metadata: { investigationId } }),
          }}
          goalProps={{
            // Legacy first-outcome edit shape — GoalSection edits one outcome at a time;
            // multi-outcome editor is later phases (Spec 2 §3.2.2 / PR-CCJ-C1).
            outcomeGoal: selectedProject.goal.outcomeGoals[0],
            freeText: selectedProject.goal.freeText,
            factorControls: selectedProject.goal.factorControls,
            mechanismGoals: selectedProject.goal.mechanismGoals,
            outcomeOptions: outcomes.map(outcome => ({
              id: outcome.id,
              label: outcome.columnName,
              target: outcome.target,
            })),
            onOutcomeGoalChange: outcomeGoalPatch => {
              const existing = selectedProject.goal.outcomeGoals[0] ?? {
                outcomeSpecId: '',
                target: 0,
              };
              // Rebuild the list, replacing the first outcome.
              const merged = { ...existing, ...outcomeGoalPatch };
              const nextGoals = [merged, ...selectedProject.goal.outcomeGoals.slice(1)];
              updateSelectedProject({ goal: { outcomeGoals: nextGoals } });
            },
            onFreeTextChange: freeText => updateSelectedProject({ goal: { freeText } }),
            onFactorControlsChange: factorControls =>
              updateSelectedProject({
                goal: { factorControls: factorControls as ImprovementProjectFactorControl[] },
              }),
            onMechanismGoalsChange: mechanismGoals =>
              updateSelectedProject({
                goal: { mechanismGoals: mechanismGoals as ImprovementProjectMechanismGoal[] },
              }),
          }}
          backgroundProps={{
            manualNarrative: selectedProject.sections.background.manualNarrative,
            onManualNarrativeChange: manualNarrative =>
              updateSelectedProject({ sections: { background: { manualNarrative } } }),
          }}
          lineageProps={{
            hypotheses,
            findings,
            onNavigate: handleLineageNavigate,
          }}
          approachProps={{
            narrative: selectedProject.sections.approach.narrative,
            onNarrativeChange: narrative =>
              updateSelectedProject({ sections: { approach: { narrative } } }),
          }}
        />
      ) : (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Creating Project draft...
        </p>
      )}
    </div>
  );
};

export default ImprovementProjectPanel;
