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
  NoActiveProjectGuidance,
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
  useAnalysisScopeStore,
  useViewStore,
} from '@variscout/stores';
import type { CanvasAnalyzeFocus, CanvasStepCardModel } from '@variscout/hooks';
import type {
  EvidenceSnapshot,
  StepCapabilityStamp,
  ControlHandoff,
  ControlRecord,
} from '@variscout/core';
import type { ExploreLandingView } from '@variscout/core/exploreRouting';
import {
  createStepQuickActionItem,
  type ActionItem,
  type FindingContext,
} from '@variscout/core/findings';
import { surveyInboxRules } from '@variscout/core/survey';
import { useActiveIPContext } from '@variscout/hooks';
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
  const hypotheses = useAnalyzeStore(s => s.hypotheses);
  const causalLinks = useAnalyzeStore(s => s.causalLinks);
  const activeHub = useSession().hub;
  const activeHubId = activeHub?.id ?? null;
  const canvasViewportHubId = processContext?.processHubId ?? activeHubId;
  const liveProject = useImprovementProjectStore(s =>
    activeHubId ? s.getProjectForHub(activeHubId) : undefined
  );
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);
  // E1 T5: PWA active-IP cascade for Canvas Edit-mode state.
  // PWA passes `userId: 'local'` internally to `useActiveIPContext` (no
  // AD identity in the free tier); the hook still scopes per-hub.
  const { activeIP } = useActiveIPContext(activeHub);
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
    const improvementProjects = liveProject ? [liveProject] : [];
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
  }, [activeHubId, controlHandoffs, hypotheses, liveProject, controlRecords]);

  const inboxPrompts = React.useMemo(() => {
    return surveyInboxRules({
      hub: activeHub ?? undefined,
      improvementProject: liveProject,
      controlRecords,
      controlReviews: activeHub?.controlReviews ?? [],
      controlHandoffs,
      now: Date.now(),
    });
  }, [activeHub?.controlReviews, activeHubId, controlHandoffs, liveProject, controlRecords]);

  // CS-0 Task 6: seed Explore Y from the project outcome so Explore opens
  // anchored on what's being investigated. Read outcome imperatively so deps
  // stay empty. Guard on truthiness — outcome is `string | null`.
  const handleSeeData = React.useCallback(() => {
    const outcome = useProjectStore.getState().outcome;
    if (outcome) {
      useAnalysisScopeStore.getState().setY(outcome);
    }
    usePanelsStore.getState().showExplore();
  }, []);

  // F1 Task 6: PWA uses bare showExplore() (no intent payload) because the
  // PWA panelsStore.showExplore takes no arguments in V1. Routing intent
  // (pendingExploreIntent) is Azure-only for F1; deferred to a PWA-parity task
  // if/when the PWA Explore tab supports smart landing.
  const handleExploreExit = React.useCallback((_landing: ExploreLandingView) => {
    usePanelsStore.getState().showExplore();
  }, []);

  const handleLogQuickAction = React.useCallback(
    (stepId: string, payload: LogActionPayload) => {
      if (!activeHubId) return;
      const actionItem = createStepQuickActionItem({
        text: payload.text,
        stepId,
        assignedTo: payload.status === 'open' ? payload.assignedTo : null,
        dueAt: payload.status === 'open' ? (payload.dueAt ?? null) : null,
        status: payload.status,
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

  // PR-CS-5 Part 2: capture-from-step. Creates a step-noted Finding
  // (`originStepId = card.stepId`) so it surfaces on this step's overlay (UNION
  // with column-derived findings). Mirrors the Azure shell.
  const handleCaptureFindingFromStep = React.useCallback((card: CanvasStepCardModel) => {
    const activeFilters: Record<string, (string | number)[]> = {};
    for (const column of card.assignedColumns) activeFilters[column] = [];
    const context: FindingContext = {
      activeFilters,
      cumulativeScope: null,
      stats:
        card.metricKind === 'numeric' && card.stats
          ? {
              mean: card.stats.mean,
              median: card.stats.median,
              cpk: card.stats.cpk,
              samples: card.capability.n,
            }
          : undefined,
    };
    useAnalyzeStore
      .getState()
      .addFinding(`Observation at ${card.stepName}`, context, undefined, undefined, card.stepId);
  }, []);

  const handleFocusedInvestigation = React.useCallback(() => {
    usePanelsStore.getState().showAnalyze();
  }, []);

  const handleOpenWall = React.useCallback(() => {
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().showAnalyze();
  }, []);

  const handleOpenInvestigationFocus = React.useCallback((focus: CanvasAnalyzeFocus) => {
    // Focus a hypothesis hub node by its hub id (the Question entity is retired
    // per ADR-085, so 'suspected-cause' is the only hub-resolving focus kind).
    if (focus.kind === 'suspected-cause') {
      // CoScout panel focus (unchanged — feeds the AI interpretation partner).
      useAnalyzeFeatureStore.getState().expandToHypothesis(focus.id);
      // PR-CS-5 Part 1: the *visible* Wall focus is `focusedWallEntityId` —
      // WallCanvas dims via wallDegreeOfInterest and AnalyzeView pans the viewport
      // to center the node on arrival. Force the Wall view so the analyst lands
      // focused. (PWA panelsStore has no setAnalyzeViewMode — the Map/Wall sub-toggle
      // lives entirely in canvasViewportStore.viewMode here, unlike Azure.)
      useViewStore.getState().setFocusedWallEntity(focus.id);
      useCanvasViewportStore.getState().setViewMode('wall');
      usePanelsStore.getState().showAnalyze();
      return;
    }
    usePanelsStore.getState().showAnalyze();
  }, []);

  const handleAddCausalLink = React.useCallback(
    (
      fromFactor: string,
      toFactor: string,
      whyStatement: string,
      _options?: { questionIds?: string[] }
    ) => {
      // IM-1: causal links no longer carry questionIds (Question entity retired).
      useAnalyzeStore.getState().addCausalLink(fromFactor, toFactor, whyStatement);
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
        useImprovementProjectStore.getState().getProjectForHub(activeHubId ?? '')?.id === item.id
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
      // PR-CS-5 Part 1: a hypothesis context-link lands the analyst FOCUSED on
      // the Wall (dim + pan-to-node), not on an unfocused Analyze tab. Reconstruct
      // the focus by id-match rather than widening the shared ContextLinkItem
      // contract, then delegate to the single focus path.
      if (hypotheses.some(h => h.id === item.id)) {
        handleOpenInvestigationFocus({ kind: 'suspected-cause', id: item.id });
        return;
      }
      usePanelsStore.getState().showAnalyze();
    },
    [activeHubId, controlHandoffs, controlRecords, hypotheses, handleOpenInvestigationFocus]
  );

  // E1 T6: Process tab is project-scoped. When no active project is selected,
  // route the user back to Home instead of rendering Canvas chrome. PWA has no
  // AD identity in the free tier; `useActiveIPContext` returns `null` whenever
  // there is no IP for the active hub. The CanvasWorkspace `activeIP: null`
  // branch (T5) remains as the bootstrap fallback for tests + non-membership
  // callers, but the production Process tab never reaches it.
  if (activeIP == null) {
    return (
      <NoActiveProjectGuidance
        onGoHome={() => usePanelsStore.getState().showHome()}
        description="Process work happens inside a project. Pick a project from Home, or create a new one to start editing the Canvas."
      />
    );
  }

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
        hypotheses={hypotheses}
        causalLinks={causalLinks}
        onOpenWall={handleOpenWall}
        onOpenInvestigationFocus={handleOpenInvestigationFocus}
        onAddCausalLink={handleAddCausalLink}
        onRemoveCausalLink={handleRemoveCausalLink}
        onCharter={handleCharter}
        contextLinkGroups={contextLinkGroups}
        onNavigateContextLink={handleNavigateContextLink}
        onCaptureFindingFromStep={handleCaptureFindingFromStep}
        priorStepStats={priorStepStats}
        // PWA has no project-membership model (education tier per apps/pwa/CLAUDE.md);
        // Edit mode is always reachable. Azure derives this from canAccess(..., 'edit').
        canEditCanvas={true}
        actionItems={actionItems}
        activeIP={activeIP}
        onPersistCanvasState={upsertProject}
        outcomeSpecs={(activeHub?.outcomes ?? []).filter(o => o.deletedAt === null)}
        onExploreExit={handleExploreExit}
      />
    </div>
  );
};

export default FrameView;
