/**
 * FrameView — PWA FRAME workspace shell.
 *
 * CanvasWorkspace owns the shared b0/b1 canvas composition. The PWA shell only
 * reads app/store state and wires the app-specific Analysis navigation.
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
  useAnalyzeStore,
  useProjectStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import type { CanvasAnalyzeFocus } from '@variscout/hooks';
import type {
  EvidenceSnapshot,
  StepCapabilityStamp,
  ControlHandoff,
  ControlRecord,
} from '@variscout/core';
import { createActionItem, type ActionItem } from '@variscout/core/findings';
import { surveyInboxRules } from '@variscout/core/survey';
import { pwaHubRepository } from '../../persistence';
import { useSession } from '../../store/sessionStore';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useAnalyzeFeatureStore } from '../../features/analyze/analyzeStore';

const EMPTY_PRIOR_STEP_STATS: ReadonlyMap<string, StepCapabilityStamp> = new Map();
const EMPTY_ACTION_ITEMS: ActionItem[] = [];
const EMPTY_CONTROL_RECORDS: ControlRecord[] = [];
const EMPTY_CONTROL_HANDOFFS: ControlHandoff[] = [];

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
  const findings = useAnalyzeStore(s => s.findings);
  const questions = useAnalyzeStore(s => s.questions);
  const hypotheses = useAnalyzeStore(s => s.hypotheses);
  const causalLinks = useAnalyzeStore(s => s.causalLinks);
  const activeHub = useSession().hub;
  const activeHubId = activeHub?.id ?? null;
  const canvasViewportHubId = processContext?.processHubId ?? activeHubId;
  const projectsByHub = useImprovementProjectStore(s => s.projectsByHub);
  const [priorStepStats, setPriorStepStats] =
    React.useState<ReadonlyMap<string, StepCapabilityStamp>>(EMPTY_PRIOR_STEP_STATS);
  const [actionItems, setActionItems] = React.useState<ActionItem[]>(EMPTY_ACTION_ITEMS);
  const [controlRecords, setControlRecords] =
    React.useState<ControlRecord[]>(EMPTY_CONTROL_RECORDS);
  const [controlHandoffs, setControlHandoffs] =
    React.useState<ControlHandoff[]>(EMPTY_CONTROL_HANDOFFS);
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
        const snapshots = await pwaHubRepository.evidenceSnapshots.listByHub(activeHubId);
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
    setControlRecords(EMPTY_CONTROL_RECORDS);
    setControlHandoffs(EMPTY_CONTROL_HANDOFFS);

    if (!activeHubId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [items, records, handoffs] = await Promise.all([
          pwaHubRepository.actionItems.listByHub(activeHubId),
          pwaHubRepository.controlRecords.listByHub(activeHubId),
          pwaHubRepository.controlHandoffs.listByHub(activeHubId),
        ]);
        if (!cancelled) {
          setActionItems(items);
          setControlRecords(records.filter((record: ControlRecord) => record.deletedAt === null));
          setControlHandoffs(handoffs.filter(handoff => handoff.deletedAt === null));
        }
      } catch {
        // Session-only hubs may not exist in IndexedDB; keep any in-memory quick actions.
        if (!cancelled) {
          setControlRecords(activeHub?.controlRecords ?? []);
          setControlHandoffs(activeHub?.controlHandoffs ?? []);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeHub?.controlHandoffs, activeHub?.controlRecords, activeHubId]);

  const contextLinkGroups: readonly ContextLinkGroup[] = React.useMemo(() => {
    const improvementProjects = (
      activeHubId ? (projectsByHub[activeHubId] ?? activeHub?.improvementProjects ?? []) : []
    ).filter(project => project.deletedAt === null);
    const liveControlRecords = controlRecords.filter(record => record.deletedAt === null);

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
        // Wedge V1 (ADR-082) folds Handoff into Control-closure; control handoffs surface here too.
        surfaceType: 'sustainment',
        items: [
          ...liveControlRecords.map(record => ({
            id: record.id,
            label: record.title,
            description: record.status,
          })),
          ...controlHandoffs.map(handoff => ({
            id: handoff.id,
            label: handoff.systemName || handoff.operationalOwner.displayName || 'Handoff',
            description: handoff.status,
          })),
        ],
      },
    ];
  }, [
    activeHub?.improvementProjects,
    activeHubId,
    controlHandoffs,
    hypotheses,
    projectsByHub,
    controlRecords,
  ]);

  const inboxPrompts = React.useMemo(() => {
    const improvementProjects = (
      activeHubId ? (projectsByHub[activeHubId] ?? activeHub?.improvementProjects ?? []) : []
    ).filter(project => project.deletedAt === null);

    return surveyInboxRules({
      hub: activeHub ?? undefined,
      improvementProjects,
      controlRecords,
      controlReviews: activeHub?.controlReviews ?? [],
      controlHandoffs,
      now: Date.now(),
    });
  }, [
    activeHub?.improvementProjects,
    activeHub?.controlReviews,
    activeHubId,
    controlHandoffs,
    projectsByHub,
    controlRecords,
  ]);

  const handleSeeData = React.useCallback(() => {
    usePanelsStore.getState().showExplore();
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
          await pwaHubRepository.dispatch({
            kind: 'ACTION_ITEM_ADD',
            hubId: activeHubId,
            actionItem,
          });
          const items = await pwaHubRepository.actionItems.listByHub(activeHubId);
          if (activeHubIdRef.current === activeHubId) setActionItems(items);
        } catch {
          // Session-only quick actions remain visible even when persistence is unavailable.
        }
      })();
    },
    [activeHubId]
  );

  const handleFocusedInvestigation = React.useCallback(() => {
    usePanelsStore.getState().showAnalyze();
  }, []);

  const handleOpenWall = React.useCallback(() => {
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().showAnalyze();
  }, []);

  const handleOpenInvestigationFocus = React.useCallback((focus: CanvasAnalyzeFocus) => {
    if (focus.questionId) useAnalyzeFeatureStore.getState().expandToQuestion(focus.questionId);
    usePanelsStore.getState().showAnalyze();
  }, []);

  const handleAddCausalLink = React.useCallback(
    (
      fromFactor: string,
      toFactor: string,
      whyStatement: string,
      options?: { questionIds?: string[] }
    ) => {
      const link = useAnalyzeStore.getState().addCausalLink(fromFactor, toFactor, whyStatement);

      if (!link || !options?.questionIds) return;

      for (const questionId of options.questionIds) {
        useAnalyzeStore.getState().linkQuestionToCausalLink(link.id, questionId);
      }
    },
    []
  );

  const handleRemoveCausalLink = React.useCallback((linkId: string) => {
    useAnalyzeStore.getState().removeCausalLink(linkId);
  }, []);

  const handleCharter = React.useCallback(() => {
    usePanelsStore.getState().showCharter();
  }, []);

  const handleInboxNavigate = React.useCallback((prompt: InboxDigestPrompt) => {
    const surface = prompt.action?.opensSurface;
    if (surface === 'sustainment') {
      usePanelsStore.getState().showControl(prompt.action?.opensId);
      return;
    }
    if (surface === 'improvement-projects') {
      usePanelsStore.getState().showCharter();
      return;
    }
    usePanelsStore.getState().showAnalyze();
  }, []);

  const handleNavigateContextLink = React.useCallback(
    (item: ContextLinkItem) => {
      if (
        useImprovementProjectStore
          .getState()
          .getProjectsForHub(activeHubId ?? '')
          .some(project => project.id === item.id)
      ) {
        usePanelsStore.getState().showCharter();
        return;
      }
      if (controlRecords.some(record => record.id === item.id)) {
        usePanelsStore.getState().showControl(item.id);
        return;
      }
      if (controlHandoffs.some(handoff => handoff.id === item.id)) {
        // Wedge V1 (ADR-082) folds Handoff into Control-closure.
        usePanelsStore.getState().showControl(item.id);
        return;
      }
      usePanelsStore.getState().showAnalyze();
    },
    [activeHubId, controlHandoffs, controlRecords]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="px-4 pt-4">
        <InboxDigest prompts={inboxPrompts} onNavigate={handleInboxNavigate} />
      </div>
      <CanvasWorkspace
        canvasViewportHubId={canvasViewportHubId}
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
        onCharter={handleCharter}
        contextLinkGroups={contextLinkGroups}
        onNavigateContextLink={handleNavigateContextLink}
        priorStepStats={priorStepStats}
        // PWA has no project-membership model (education tier per apps/pwa/CLAUDE.md);
        // Edit mode is always reachable. Azure derives this from canAccess(..., 'edit').
        canEditCanvas={true}
        actionItems={actionItems}
      />
    </div>
  );
};

export default FrameView;
