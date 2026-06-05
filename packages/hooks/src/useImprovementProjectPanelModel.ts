import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProcessHub } from '@variscout/core';
import type { Finding, Hypothesis } from '@variscout/core/findings';
import type {
  ImprovementProject,
  ImprovementProjectGoal,
  ImprovementProjectMetadata,
  ImprovementProjectOutcomeGoal,
  ImprovementProjectSignoff,
} from '@variscout/core/improvementProject';
import type { HubRepository } from '@variscout/core/persistence';
import type { OutcomeSpec } from '@variscout/core/processHub';
import { useAnalyzeStore, useImprovementProjectStore } from '@variscout/stores';
import { useReturnNavigation } from './useReturnNavigation';

export type ImprovementProjectPanelPatch = {
  status?: ImprovementProject['status'];
  metadata?: Partial<ImprovementProjectMetadata>;
  /** Goal patch: outcomeGoals[] replaces wholesale; consumers rebuild the full list. */
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

export interface UseImprovementProjectPanelModelOptions {
  activeHub?: ProcessHub;
  repository: Pick<HubRepository, 'dispatch'>;
  onOpenWall?: () => void;
}

export interface UseImprovementProjectPanelModelReturn {
  projects: ImprovementProject[];
  selectedProject: ImprovementProject | null;
  outcomes: OutcomeSpec[];
  hypotheses: Hypothesis[];
  findings: Finding[];
  error: string | null;
  heading: string;
  selectProject: (project: ImprovementProject) => void;
  updateSelectedProject: (patch: ImprovementProjectPanelPatch) => void;
  handleLineageNavigate: (target: { kind: 'hypothesis' | 'finding'; id: string }) => void;
}

function liveProjects(project: ImprovementProject | undefined): ImprovementProject[] {
  return project && project.deletedAt === null ? [project] : [];
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
      approach: {},
      outcomeReference: {},
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function mergeProjectPatch(
  project: ImprovementProject,
  patch: ImprovementProjectPanelPatch
): ImprovementProject {
  return {
    ...project,
    ...patch,
    metadata: patch.metadata ? { ...project.metadata, ...patch.metadata } : project.metadata,
    goal: patch.goal
      ? {
          ...project.goal,
          ...patch.goal,
          outcomeGoals: patch.goal.outcomeGoals ?? project.goal.outcomeGoals,
        }
      : project.goal,
    sections: patch.sections
      ? {
          background: { ...project.sections.background, ...patch.sections.background },
          approach: { ...project.sections.approach, ...patch.sections.approach },
          outcomeReference: {
            ...project.sections.outcomeReference,
            ...patch.sections.outcomeReference,
          },
        }
      : project.sections,
    signoff: patch.signoff ? { ...(project.signoff ?? {}), ...patch.signoff } : project.signoff,
    updatedAt: Date.now(),
  };
}

function toRepositoryPatch(
  project: ImprovementProject,
  patch: ImprovementProjectPanelPatch
): RepositoryProjectPatch {
  return {
    ...patch,
    metadata: patch.metadata ? { ...project.metadata, ...patch.metadata } : undefined,
    goal: patch.goal
      ? {
          ...project.goal,
          ...patch.goal,
          outcomeGoals: patch.goal.outcomeGoals ?? project.goal.outcomeGoals,
        }
      : undefined,
    signoff: patch.signoff ? { ...(project.signoff ?? {}), ...patch.signoff } : undefined,
  };
}

export function useImprovementProjectPanelModel({
  activeHub,
  repository,
  onOpenWall,
}: UseImprovementProjectPanelModelOptions): UseImprovementProjectPanelModelReturn {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const creatingForHubRef = useRef<string | null>(null);
  const { captureReturnTarget } = useReturnNavigation();

  const storedProject = useImprovementProjectStore(state =>
    activeHub ? state.getProjectForHub(activeHub.id) : undefined
  );
  const setProjectForHub = useImprovementProjectStore(state => state.setProjectForHub);
  const upsertProject = useImprovementProjectStore(state => state.upsertProject);
  const hypotheses = useAnalyzeStore(state => state.hypotheses);
  const findings = useAnalyzeStore(state => state.findings);

  const projects = useMemo(
    () => liveProjects(storedProject ?? activeHub?.improvementProject),
    [storedProject, activeHub]
  );

  useEffect(() => {
    if (!activeHub || !activeHub.improvementProject) return;
    setProjectForHub(activeHub.id, activeHub.improvementProject);
  }, [activeHub, setProjectForHub]);

  useEffect(() => {
    if (!activeHub || projects.length > 0 || creatingForHubRef.current === activeHub.id) return;

    const createHubId = activeHub.id;
    const project = buildDraftProject(activeHub);
    creatingForHubRef.current = createHubId;
    setError(null);
    let cancelled = false;

    void repository
      .dispatch({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: activeHub.id, project })
      .then(() => {
        if (cancelled || creatingForHubRef.current !== createHubId) return;
        upsertProject(project);
        setSelectedProjectId(project.id);
      })
      .catch(() => {
        if (!cancelled) setError('Could not create a Project draft.');
      })
      .finally(() => {
        if (creatingForHubRef.current === createHubId) creatingForHubRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [activeHub, projects.length, repository, upsertProject]);

  const selectedProject =
    projects.length === 1
      ? projects[0]
      : (projects.find(project => project.id === selectedProjectId) ?? null);

  const updateSelectedProject = useCallback(
    (patch: ImprovementProjectPanelPatch) => {
      if (!selectedProject) return;
      const next = mergeProjectPatch(selectedProject, patch);
      upsertProject(next);
      void repository
        .dispatch({
          kind: 'IMPROVEMENT_PROJECT_UPDATE',
          projectId: selectedProject.id,
          patch: toRepositoryPatch(selectedProject, patch),
        })
        .catch(() => {
          setError('Could not save the Project changes.');
        });
    },
    [repository, selectedProject, upsertProject]
  );

  const selectProject = useCallback(
    (project: ImprovementProject) => {
      upsertProject(project);
      setSelectedProjectId(project.id);
    },
    [upsertProject]
  );

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

  const outcomes = useMemo(() => (activeHub ? liveOutcomes(activeHub) : []), [activeHub]);
  const heading = useMemo(() => activeHub?.name ?? 'No active hub', [activeHub]);

  return {
    projects,
    selectedProject,
    outcomes,
    hypotheses,
    findings,
    error,
    heading,
    selectProject,
    updateSelectedProject,
    handleLineageNavigate,
  };
}
