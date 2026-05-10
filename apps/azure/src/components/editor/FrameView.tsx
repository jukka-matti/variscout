/**
 * FrameView (Azure) — FRAME workspace shell.
 *
 * CanvasWorkspace owns the shared b0/b1 canvas composition. The Azure shell
 * only reads app/store state and wires the app-specific Analysis navigation.
 */
import React from 'react';
import { CanvasWorkspace, type ContextLinkGroup, type ContextLinkItem } from '@variscout/ui';
import {
  useImprovementProjectStore,
  useInvestigationStore,
  useProjectStore,
  useWallLayoutStore,
} from '@variscout/stores';
import type { CanvasInvestigationFocus } from '@variscout/hooks';
import type {
  EvidenceSnapshot,
  StepCapabilityStamp,
  WorkflowReadinessSignals,
} from '@variscout/core';
import { azureHubRepository } from '../../persistence';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useInvestigationFeatureStore } from '../../features/investigation/investigationStore';

const EMPTY_PRIOR_STEP_STATS: ReadonlyMap<string, StepCapabilityStamp> = new Map();

function priorStepStatsFromSnapshots(
  snapshots: readonly EvidenceSnapshot[]
): ReadonlyMap<string, StepCapabilityStamp> {
  const mostRecent = snapshots
    .filter(snapshot => snapshot.deletedAt === null)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
  const stamps = mostRecent?.stepCapabilities;
  if (!stamps || stamps.length === 0) return EMPTY_PRIOR_STEP_STATS;

  return new Map(stamps.map(stamp => [stamp.stepId, stamp]));
}

const FrameView: React.FC = () => {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const findings = useInvestigationStore(s => s.findings);
  const questions = useInvestigationStore(s => s.questions);
  const hypotheses = useInvestigationStore(s => s.hypotheses);
  const causalLinks = useInvestigationStore(s => s.causalLinks);
  const activeHubId = useProjectStore(s => s.processContext?.processHubId ?? null);
  const projectsByHub = useImprovementProjectStore(s => s.projectsByHub);
  const [priorStepStats, setPriorStepStats] =
    React.useState<ReadonlyMap<string, StepCapabilityStamp>>(EMPTY_PRIOR_STEP_STATS);

  React.useEffect(() => {
    if (!activeHubId) {
      setPriorStepStats(EMPTY_PRIOR_STEP_STATS);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const snapshots = await azureHubRepository.evidenceSnapshots.listByHub(activeHubId);
        if (!cancelled) setPriorStepStats(priorStepStatsFromSnapshots(snapshots));
      } catch {
        if (!cancelled) setPriorStepStats(EMPTY_PRIOR_STEP_STATS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeHubId]);

  const signals: WorkflowReadinessSignals = React.useMemo(
    () => ({ hasIntervention: false, sustainmentConfirmed: false }),
    []
  );

  const contextLinkGroups: readonly ContextLinkGroup[] = React.useMemo(() => {
    const improvementProjects = (activeHubId ? (projectsByHub[activeHubId] ?? []) : []).filter(
      project => project.deletedAt === null
    );

    return [
      {
        surfaceType: 'improvement-projects',
        items: improvementProjects.map(project => ({
          id: project.id,
          label: project.metadata.title,
          description: project.status,
        })),
      },
      {
        surfaceType: 'wall-threads',
        items: hypotheses.map(hypothesis => ({
          id: hypothesis.id,
          label: hypothesis.name,
          description: hypothesis.status,
        })),
      },
      { surfaceType: 'quick-actions', items: [] },
      { surfaceType: 'sustainment', items: [] },
      { surfaceType: 'handoff', items: [] },
    ];
  }, [activeHubId, hypotheses, projectsByHub]);

  const handleSeeData = React.useCallback(() => {
    usePanelsStore.getState().showAnalysis();
  }, []);

  const handleQuickAction = React.useCallback(() => {
    usePanelsStore.getState().showImprovement();
  }, []);

  const handleFocusedInvestigation = React.useCallback(() => {
    usePanelsStore.getState().showInvestigation();
  }, []);

  const handleOpenWall = React.useCallback(() => {
    const panelsStore = usePanelsStore.getState();
    useWallLayoutStore.getState().setViewMode('wall');
    panelsStore.setInvestigationViewMode('map');
    panelsStore.showInvestigation();
  }, []);

  const handleOpenInvestigationFocus = React.useCallback((focus: CanvasInvestigationFocus) => {
    if (focus.questionId)
      useInvestigationFeatureStore.getState().expandToQuestion(focus.questionId);
    usePanelsStore.getState().showInvestigation();
  }, []);

  const handleAddCausalLink = React.useCallback(
    (
      fromFactor: string,
      toFactor: string,
      whyStatement: string,
      options?: { questionIds?: string[] }
    ) => {
      const link = useInvestigationStore
        .getState()
        .addCausalLink(fromFactor, toFactor, whyStatement);

      if (!link || !options?.questionIds) return;

      for (const questionId of options.questionIds) {
        useInvestigationStore.getState().linkQuestionToCausalLink(link.id, questionId);
      }
    },
    []
  );

  const handleRemoveCausalLink = React.useCallback((linkId: string) => {
    useInvestigationStore.getState().removeCausalLink(linkId);
  }, []);

  const handleCharter = React.useCallback(() => {
    usePanelsStore.getState().showCharter();
  }, []);

  const handleSustainment = React.useCallback(() => {
    usePanelsStore.getState().showSustainment();
  }, []);

  const handleHandoff = React.useCallback(() => {
    usePanelsStore.getState().showHandoff();
  }, []);

  const handleNavigateContextLink = React.useCallback(
    (item: ContextLinkItem) => {
      const isImprovementProject =
        activeHubId !== null &&
        useImprovementProjectStore
          .getState()
          .getProjectsForHub(activeHubId)
          .some(project => project.id === item.id);
      if (isImprovementProject) {
        usePanelsStore.getState().showCharter();
        return;
      }
      usePanelsStore.getState().showInvestigation();
    },
    [activeHubId]
  );

  return (
    <CanvasWorkspace
      rawData={rawData}
      outcome={outcome}
      factors={factors}
      setOutcome={setOutcome}
      setFactors={setFactors}
      measureSpecs={measureSpecs}
      setMeasureSpec={setMeasureSpec}
      processContext={processContext}
      setProcessContext={setProcessContext}
      onSeeData={handleSeeData}
      onQuickAction={handleQuickAction}
      onFocusedInvestigation={handleFocusedInvestigation}
      findings={findings}
      questions={questions}
      hypotheses={hypotheses}
      causalLinks={causalLinks}
      onOpenWall={handleOpenWall}
      onOpenInvestigationFocus={handleOpenInvestigationFocus}
      onAddCausalLink={handleAddCausalLink}
      onRemoveCausalLink={handleRemoveCausalLink}
      signals={signals}
      onCharter={handleCharter}
      onSustainment={handleSustainment}
      onHandoff={handleHandoff}
      contextLinkGroups={contextLinkGroups}
      onNavigateContextLink={handleNavigateContextLink}
      priorStepStats={priorStepStats}
    />
  );
};

export default FrameView;
