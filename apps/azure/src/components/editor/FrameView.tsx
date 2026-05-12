/**
 * FrameView (Azure) — FRAME workspace shell.
 *
 * CanvasWorkspace owns the shared b0/b1 canvas composition. The Azure shell
 * only reads app/store state and wires the app-specific Analysis navigation.
 */
import React from 'react';
import {
  CanvasWorkspace,
  InboxDigest,
  type InboxDigestPrompt,
  type ContextLinkGroup,
  type ContextLinkItem,
  type LogActionPayload,
} from '@variscout/ui';
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
  SustainmentRecord,
  WorkflowReadinessSignals,
} from '@variscout/core';
import { createActionItem, type ActionItem } from '@variscout/core/findings';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { surveyInboxRules } from '@variscout/core/survey';
import { azureHubRepository } from '../../persistence';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useInvestigationFeatureStore } from '../../features/investigation/investigationStore';

const EMPTY_PRIOR_STEP_STATS: ReadonlyMap<string, StepCapabilityStamp> = new Map();
const EMPTY_ACTION_ITEMS: ActionItem[] = [];
const EMPTY_SUSTAINMENT_RECORDS: SustainmentRecord[] = [];

function mergeActionItems(
  current: readonly ActionItem[],
  next: readonly ActionItem[]
): ActionItem[] {
  const byId = new Map<string, ActionItem>();
  for (const item of current) byId.set(item.id, item);
  for (const item of next) byId.set(item.id, item);
  return Array.from(byId.values());
}

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

function hasCompletedInterventionEvidence(
  projects: readonly ImprovementProject[],
  items: readonly ActionItem[]
): boolean {
  const completedActionIds = new Set(
    items
      .filter(
        item =>
          item.deletedAt === null &&
          (item.completedAt !== undefined || item.status === 'done' || item.doneAt != null)
      )
      .map(item => item.id)
  );
  return projects.some(project => {
    if (project.deletedAt !== null || project.status !== 'closed') return false;
    const actionItemIds = project.sections.approach.actionItemIds ?? [];
    return actionItemIds.some(id => completedActionIds.has(id));
  });
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
  const [actionItems, setActionItems] = React.useState<ActionItem[]>(EMPTY_ACTION_ITEMS);
  const [sustainmentRecords, setSustainmentRecords] =
    React.useState<SustainmentRecord[]>(EMPTY_SUSTAINMENT_RECORDS);
  const activeHubIdRef = React.useRef<string | null>(activeHubId);

  React.useEffect(() => {
    activeHubIdRef.current = activeHubId;
  }, [activeHubId]);

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

  React.useEffect(() => {
    setActionItems(EMPTY_ACTION_ITEMS);
    setSustainmentRecords(EMPTY_SUSTAINMENT_RECORDS);

    if (!activeHubId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [items, records] = await Promise.all([
          azureHubRepository.actionItems.listByHub(activeHubId),
          azureHubRepository.sustainmentRecords.listByHub(activeHubId),
        ]);
        if (!cancelled) {
          setActionItems(items);
          setSustainmentRecords(
            records.filter((record: SustainmentRecord) => record.deletedAt === null)
          );
        }
      } catch {
        // Keep any in-memory quick actions if the local repository is unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeHubId]);

  const contextLinkGroups: readonly ContextLinkGroup[] = React.useMemo(() => {
    const improvementProjects = (activeHubId ? (projectsByHub[activeHubId] ?? []) : []).filter(
      project => project.deletedAt === null
    );
    const liveSustainmentRecords = sustainmentRecords.filter(record => record.deletedAt === null);

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
      {
        surfaceType: 'sustainment',
        items: liveSustainmentRecords.map(record => ({
          id: record.id,
          label: record.title,
          description: record.status,
        })),
      },
      { surfaceType: 'handoff', items: [] },
    ];
  }, [activeHubId, hypotheses, projectsByHub, sustainmentRecords]);

  const signals: WorkflowReadinessSignals = React.useMemo(() => {
    const improvementProjects = (activeHubId ? (projectsByHub[activeHubId] ?? []) : []).filter(
      project => project.deletedAt === null
    );

    return {
      hasIntervention: hasCompletedInterventionEvidence(improvementProjects, actionItems),
      sustainmentConfirmed: sustainmentRecords.some(
        record => record.deletedAt === null && record.status === 'confirmed-sustained'
      ),
    };
  }, [activeHubId, actionItems, projectsByHub, sustainmentRecords]);

  const inboxPrompts = React.useMemo(() => {
    const improvementProjects = (activeHubId ? (projectsByHub[activeHubId] ?? []) : []).filter(
      project => project.deletedAt === null
    );

    return surveyInboxRules({
      improvementProjects,
      sustainmentRecords,
      now: Date.now(),
    });
  }, [activeHubId, projectsByHub, sustainmentRecords]);

  const handleSeeData = React.useCallback(() => {
    usePanelsStore.getState().showAnalysis();
  }, []);

  const handleLogQuickAction = React.useCallback(
    (stepId: string, payload: LogActionPayload) => {
      if (!activeHubId) return;
      const actionItem = createActionItem(payload.text, {
        stepId,
        parentImprovementProjectId: null,
        parentImprovementIdeaId: null,
        assignedTo: payload.status === 'open' ? payload.assignedTo : null,
        dueAt: payload.status === 'open' ? (payload.dueAt ?? null) : null,
        status: payload.status,
        doneAt: payload.status === 'done' ? new Date().toISOString() : null,
        doneBy: null,
        createdBy: { displayName: 'Local browser' },
      });
      setActionItems(current => mergeActionItems(current, [actionItem]));
      void (async () => {
        try {
          await azureHubRepository.dispatch({
            kind: 'ACTION_ITEM_ADD',
            hubId: activeHubId,
            actionItem,
          });
          const items = await azureHubRepository.actionItems.listByHub(activeHubId);
          if (activeHubIdRef.current === activeHubId) setActionItems(items);
        } catch {
          // Keep the local quick action visible even when persistence is unavailable.
        }
      })();
    },
    [activeHubId]
  );

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

  const handleInboxNavigate = React.useCallback((prompt: InboxDigestPrompt) => {
    const surface = prompt.action?.opensSurface;
    if (surface === 'sustainment') {
      usePanelsStore.getState().showSustainment(prompt.action?.opensId);
      return;
    }
    if (surface === 'improvement-projects') {
      usePanelsStore.getState().showCharter();
      return;
    }
    usePanelsStore.getState().showInvestigation();
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
      if (sustainmentRecords.some(record => record.id === item.id)) {
        usePanelsStore.getState().showSustainment(item.id);
        return;
      }
      usePanelsStore.getState().showInvestigation();
    },
    [activeHubId, sustainmentRecords]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="px-4 pt-4">
        <InboxDigest prompts={inboxPrompts} onNavigate={handleInboxNavigate} />
      </div>
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
        onLogQuickAction={handleLogQuickAction}
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
        actionItems={actionItems}
      />
    </div>
  );
};

export default FrameView;
