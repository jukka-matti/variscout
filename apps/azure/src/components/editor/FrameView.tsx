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
  NoActiveProjectGuidance,
  navigateToExploreForChip,
  type ChipNavigationTarget,
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
import type { CanvasAnalyzeFocus } from '@variscout/hooks';
import type {
  ControlHandoff,
  EvidenceSnapshot,
  StepCapabilityStamp,
  ControlRecord,
} from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { createStepQuickActionItem, type ActionItem } from '@variscout/core/findings';
import type { ExploreLandingView } from '@variscout/core/exploreRouting';
import type { OutcomeSpec } from '@variscout/core/processHub';
import { surveyInboxRules } from '@variscout/core/survey';
import { azureHubRepository } from '../../persistence';
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

interface FrameViewProps {
  /** Lead-only Edit mode gate. Computed in Editor.tsx from canAccess(currentUserId, members, 'edit').
   *  When omitted, the workspace defaults to permissive (used by tests + non-membership callers like PWA). */
  canEditCanvas?: boolean;
  /** The active ImprovementProject (E1 T5). Resolved by Editor.tsx via
   *  `useActiveIPContext(activeHub, { userId: currentUser?.email })`. Forwarded to
   *  `CanvasWorkspace` so Canvas Edit-mode state (processSteps / stepTimings /
   *  formulaBindings / timeDecompositionBindings) reads from + writes to the
   *  active IP. When `null`, CanvasWorkspace falls back to local state — the
   *  pre-E1 behaviour preserved for the bootstrap window. */
  activeIP?: ImprovementProject | null;
  /**
   * F1 Task 6: live outcome specs owned by the active ProcessHub
   * (`hub.outcomes` filtered to `deletedAt === null`). Threaded from
   * Editor.tsx via `(activeHub?.outcomes ?? []).filter(o => !o.deletedAt)`.
   * Controls the → Explore button soft-gate inside CanvasWorkspace (disabled
   * until at least one spec is present). Optional so test callers that
   * pre-date F1 compile unchanged (defaults to []).
   */
  outcomeSpecs?: OutcomeSpec[];
}

const FrameView: React.FC<FrameViewProps> = ({ canEditCanvas, activeIP, outcomeSpecs = [] }) => {
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
  const activeHubId = useProjectStore(s => s.processContext?.processHubId ?? null);
  const liveProject = useImprovementProjectStore(s =>
    activeHubId ? s.getProjectForHub(activeHubId) : undefined
  );
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);
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
    setControlRecords(EMPTY_CONTROL_RECORDS);
    setControlHandoffs(EMPTY_CONTROL_HANDOFFS);

    if (!activeHubId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [items, records, handoffs] = await Promise.all([
          azureHubRepository.actionItems.listByHub(activeHubId),
          azureHubRepository.controlRecords.listByHub(activeHubId),
          azureHubRepository.controlHandoffs.listByHub(activeHubId),
        ]);
        if (!cancelled) {
          setActionItems(items);
          setControlRecords(records.filter((record: ControlRecord) => record.deletedAt === null));
          setControlHandoffs(handoffs.filter(handoff => handoff.deletedAt === null));
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
  }, [activeHubId, controlHandoffs, hypotheses, liveProject, controlRecords]);

  const inboxPrompts = React.useMemo(() => {
    return surveyInboxRules({
      improvementProject: liveProject,
      controlRecords,
      controlHandoffs,
      now: Date.now(),
    });
  }, [activeHubId, controlHandoffs, liveProject, controlRecords]);

  // CS-0 Task 5: seed Explore Y from the project outcome so Explore opens
  // anchored on what's being investigated. Read outcome imperatively so deps
  // stay empty. Guard on truthiness — outcome is `string | null`.
  const handleSeeData = React.useCallback(() => {
    const outcome = useProjectStore.getState().outcome;
    if (outcome) {
      useAnalysisScopeStore.getState().setY(outcome);
    }
    usePanelsStore.getState().showExplore();
  }, []);

  // F1 Task 6: real → Explore navigation. `landing.isEnabled` is always true
  // when this callback is invoked (ExploreExitButton guards the click); the
  // non-null assertion on `focusedChart` is safe because
  // `deriveExploreLandingView` only returns `isEnabled: true` when
  // `focusedChart` is set (see exploreRouting invariant in Task 1 logic).
  const handleExploreExit = React.useCallback((landing: ExploreLandingView) => {
    if (!landing.isEnabled) return;
    usePanelsStore.getState().showExplore({
      focusedChart: landing.focusedChart!,
      boxplotFactor: landing.boxplotFactor,
    });
  }, []);

  // LV1-D: per-chip "Open in Explore" handler. Mutates analysisScopeStore
  // (setY / setBoxplotFactor / setStepId) then switches to Explore.
  // No focusedChart or pendingExploreIntent — spec D8.1 chip path is plain
  // showExplore() with no intent.
  const handleChipExploreJump = React.useCallback((target: ChipNavigationTarget) => {
    navigateToExploreForChip(target, () => usePanelsStore.getState().showExplore());
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
    usePanelsStore.getState().showAnalyze();
  }, []);

  const handleOpenWall = React.useCallback(() => {
    const panelsStore = usePanelsStore.getState();
    useCanvasViewportStore.getState().setViewMode('wall');
    panelsStore.setAnalyzeViewMode('map');
    panelsStore.showAnalyze();
  }, []);

  const handleOpenInvestigationFocus = React.useCallback((focus: CanvasAnalyzeFocus) => {
    // Focus a hypothesis hub node by its hub id (the Question entity is retired
    // per ADR-085, so 'suspected-cause' is the only hub-resolving focus kind).
    if (focus.kind === 'suspected-cause') {
      // CoScout panel focus (unchanged — feeds the AI interpretation partner).
      useAnalyzeFeatureStore.getState().expandToHypothesis(focus.id);
      // PR-CS-5 Part 1: the *visible* Wall focus is `focusedWallEntityId` —
      // WallCanvas dims via wallDegreeOfInterest and AnalyzeWorkspace pans the
      // viewport to center the node on arrival (pan-on-focus effect). Force the
      // Wall map view so the analyst lands focused, not unfocused.
      useViewStore.getState().setFocusedWallEntity(focus.id);
      const panelsStore = usePanelsStore.getState();
      useCanvasViewportStore.getState().setViewMode('wall');
      panelsStore.setAnalyzeViewMode('map');
      panelsStore.showAnalyze();
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
      const isImprovementProject =
        activeHubId !== null &&
        useImprovementProjectStore.getState().getProjectForHub(activeHubId)?.id === item.id;
      if (isImprovementProject) {
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
      // PR-CS-5 Part 1: a hypothesis context-link should land the analyst FOCUSED
      // on the Wall (dim + pan-to-node), not on an unfocused Analyze tab. Reconstruct
      // the focus by id-match here rather than widening the shared ContextLinkItem
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
  // route the user back to Home instead of rendering Canvas chrome. The
  // production-runtime path therefore always has a non-null activeIP inside
  // CanvasWorkspace; the `null` branch in CanvasWorkspace (T5) remains the
  // pre-E1 bootstrap fallback used by tests + non-membership callers.
  if (activeIP == null) {
    return (
      <NoActiveProjectGuidance
        onGoHome={() => usePanelsStore.getState().showDashboard()}
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
        priorStepStats={priorStepStats}
        canEditCanvas={canEditCanvas}
        actionItems={actionItems}
        activeIP={activeIP}
        onPersistCanvasState={upsertProject}
        outcomeSpecs={outcomeSpecs}
        onExploreExit={handleExploreExit}
        onChipExploreJump={handleChipExploreJump}
      />
    </div>
  );
};

export default FrameView;
