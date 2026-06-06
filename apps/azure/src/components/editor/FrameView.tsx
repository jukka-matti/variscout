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
  OutcomeNoMatchBanner,
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
import type { CanvasAnalyzeFocus, CanvasStepCardModel } from '@variscout/hooks';
import type {
  AnalysisMode,
  ControlHandoff,
  DefectDataShape,
  DefectDetection,
  DefectMapping,
  EvidenceSnapshot,
  StepCapabilityStamp,
  ControlRecord,
  WideFormatDetection,
} from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  createStepQuickActionItem,
  type ActionItem,
  type FindingContext,
} from '@variscout/core/findings';
import type { ExploreLandingView } from '@variscout/core/exploreRouting';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type { ReingestPendingMatch } from '@variscout/core/autoLink';
import { surveyInboxRules } from '@variscout/core/survey';
import { azureHubRepository } from '../../persistence';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useAnalyzeFeatureStore } from '../../features/analyze/analyzeStore';
import type { QuietTimeExtractionChip } from '../../features/data-flow/useEditorDataFlow';

const EMPTY_PRIOR_STEP_STATS: ReadonlyMap<string, StepCapabilityStamp> = new Map();
const EMPTY_ACTION_ITEMS: ActionItem[] = [];
const EMPTY_CONTROL_RECORDS: ControlRecord[] = [];
const EMPTY_CONTROL_HANDOFFS: ControlHandoff[] = [];

const DEFECT_SHAPE_LABELS: Record<DefectDataShape, string> = {
  'event-log': 'Event log',
  'pre-aggregated': 'Pre-aggregated counts',
  'pass-fail': 'Pass/fail results',
};

function columnOptions(columnNames: readonly string[], allowNone = false) {
  return (
    <>
      {allowNone ? <option value="">None</option> : null}
      {columnNames.map(column => (
        <option key={column} value={column}>
          {column}
        </option>
      ))}
    </>
  );
}

interface B0DefectModeBannerProps {
  detection: DefectDetection;
  columnNames: readonly string[];
  onAccept: (mapping: DefectMapping) => void;
  onDismiss: () => void;
}

function B0DefectModeBanner({
  detection,
  columnNames,
  onAccept,
  onDismiss,
}: B0DefectModeBannerProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [dataShape, setDataShape] = React.useState<DefectDataShape>(detection.dataShape);
  const [defectTypeColumn, setDefectTypeColumn] = React.useState<string | undefined>(
    detection.suggestedMapping.defectTypeColumn
  );
  const [countColumn, setCountColumn] = React.useState<string | undefined>(
    detection.suggestedMapping.countColumn
  );
  const [resultColumn, setResultColumn] = React.useState<string | undefined>(
    detection.suggestedMapping.resultColumn
  );
  const [aggregationUnit, setAggregationUnit] = React.useState<string>(
    detection.suggestedMapping.aggregationUnit ?? columnNames[0] ?? ''
  );
  const [unitsProducedColumn, setUnitsProducedColumn] = React.useState<string | undefined>(
    detection.suggestedMapping.unitsProducedColumn
  );

  const accept = () => {
    onAccept({
      dataShape,
      aggregationUnit,
      defectTypeColumn,
      countColumn,
      resultColumn,
      unitsProducedColumn,
    });
  };

  return (
    <div
      data-testid="b0-defect-banner"
      className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-content"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">These rows look like defect events</span>
        <span className="text-content-secondary">one row per defect.</span>
        <button
          type="button"
          data-testid="b0-defect-expand"
          onClick={() => setExpanded(true)}
          className="ml-auto rounded border border-red-400/40 px-2 py-1 text-xs font-medium text-content hover:bg-red-500/10"
        >
          Confirm defect setup
        </button>
        <button
          type="button"
          data-testid="b0-defect-dismiss"
          onClick={onDismiss}
          className="rounded px-2 py-1 text-xs text-content-secondary hover:text-content"
        >
          Not now
        </button>
      </div>

      {expanded ? (
        <div
          data-testid="b0-defect-confirm-panel"
          className="mt-3 grid gap-3 rounded border border-edge bg-surface-primary p-3 text-xs"
        >
          <div>
            <div className="mb-1 font-semibold text-content">DATA TYPE</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DEFECT_SHAPE_LABELS).map(([shape, label]) => (
                <button
                  key={shape}
                  type="button"
                  aria-pressed={dataShape === shape}
                  onClick={() => setDataShape(shape as DefectDataShape)}
                  className={`rounded border px-2 py-1 ${
                    dataShape === shape
                      ? 'border-red-400 bg-red-500/10 text-content'
                      : 'border-edge text-content-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-1">
            <span className="font-medium text-content-secondary">Defect type</span>
            <select
              value={defectTypeColumn ?? ''}
              onChange={event => setDefectTypeColumn(event.target.value || undefined)}
              className="rounded border border-edge bg-surface-secondary px-2 py-1 text-content"
            >
              {columnOptions(columnNames, true)}
            </select>
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="font-medium text-content-secondary">Count column</span>
              <select
                value={countColumn ?? ''}
                onChange={event => setCountColumn(event.target.value || undefined)}
                className="rounded border border-edge bg-surface-secondary px-2 py-1 text-content"
              >
                {columnOptions(columnNames, true)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-medium text-content-secondary">Result column</span>
              <select
                value={resultColumn ?? ''}
                onChange={event => setResultColumn(event.target.value || undefined)}
                className="rounded border border-edge bg-surface-secondary px-2 py-1 text-content"
              >
                {columnOptions(columnNames, true)}
              </select>
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="font-medium text-content-secondary">Group by</span>
              <select
                value={aggregationUnit}
                onChange={event => setAggregationUnit(event.target.value)}
                className="rounded border border-edge bg-surface-secondary px-2 py-1 text-content"
              >
                {columnOptions(columnNames)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-medium text-content-secondary">Units produced</span>
              <select
                value={unitsProducedColumn ?? ''}
                onChange={event => setUnitsProducedColumn(event.target.value || undefined)}
                className="rounded border border-edge bg-surface-secondary px-2 py-1 text-content"
              >
                {columnOptions(columnNames, true)}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded px-2 py-1 text-content-secondary hover:text-content"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="b0-defect-accept"
              onClick={accept}
              className="rounded bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-500"
            >
              Use defect framing
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface B0PerformanceModeBannerProps {
  detection: WideFormatDetection;
  onAccept: (columns: string[], label: string) => void;
  onDismiss: () => void;
  onStack: () => void;
}

function B0PerformanceModeBanner({
  detection,
  onAccept,
  onDismiss,
  onStack,
}: B0PerformanceModeBannerProps) {
  const channelIds = React.useMemo(
    () => detection.channels.map(channel => channel.id),
    [detection]
  );
  const preview = channelIds.slice(0, 6).join(', ');
  const suffix = channelIds.length > 6 ? ` and ${channelIds.length - 6} more` : '';

  return (
    <div
      data-testid="b0-performance-banner"
      className="rounded-md border border-blue-400/40 bg-blue-500/10 px-3 py-2 text-sm text-content"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">These look like parallel channel measurements</span>
        <span className="text-content-secondary">
          {preview}
          {suffix}
        </span>
        <button
          type="button"
          data-testid="b0-performance-accept"
          onClick={() => onAccept(channelIds, 'Channel')}
          className="ml-auto rounded border border-blue-400/40 px-2 py-1 text-xs font-medium text-content hover:bg-blue-500/10"
        >
          Use performance framing
        </button>
        <button
          type="button"
          data-testid="b0-performance-stack"
          onClick={onStack}
          className="rounded px-2 py-1 text-xs text-content-secondary hover:text-content"
        >
          Combine into one measure
        </button>
        <button
          type="button"
          data-testid="b0-performance-dismiss"
          onClick={onDismiss}
          className="rounded px-2 py-1 text-xs text-content-secondary hover:text-content"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

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
  /**
   * PR-CS-11 — the re-ingest confirm prompt's NAVIGATE-only breadcrumb. The
   * live (non-dismissed) pending matches from Editor.tsx. Composed into the
   * Inbox digest as one entry per match; clicking opens Analyze focused on the
   * match's hypothesis (the CS-5 focus path). NO apply here — the Wall chip is
   * the single apply surface ("hints navigate, chips apply"). Optional/empty →
   * no breadcrumbs.
   */
  reingestPendingMatches?: ReingestPendingMatch[];
  /**
   * FSJ-3b — opens the demoted ColumnMapping wizard in re-edit mode. Used by
   * both the "Fix data…" hatch (top-bar) and the "+ track another outcome"
   * link (belowY slot) — both are deliberate parity: the same re-edit surface
   * from two entry points (spec §7, settled decision). Optional → buttons
   * hidden when not wired.
   */
  onFixData?: () => void;
  /**
   * FSJ-3b — column rename handler forwarded from dataFlow. Passed to
   * OutcomeNoMatchBanner's onRename prop (type contract). Column rename forwarded
   * to OutcomeNoMatchBanner; the confirmation UI lives inside the ColumnMapping
   * re-edit wizard (plan decision 11).
   */
  onRenameColumn?: (oldName: string, alias: string) => void;
  quietTimeExtraction?: QuietTimeExtractionChip | null;
  onDismissQuietTimeExtraction?: () => void;
  onUndoQuietTimeExtraction?: () => void;
  defectDetection?: DefectDetection | null;
  onAcceptDefectDetection?: (mapping: DefectMapping) => void;
  onDismissDefectDetection?: () => void;
  wideFormatDetection?: WideFormatDetection | null;
  onAcceptWideFormatDetection?: (columns: string[], label: string) => void;
  onDismissWideFormatDetection?: () => void;
}

const FrameView: React.FC<FrameViewProps> = ({
  canEditCanvas,
  activeIP,
  outcomeSpecs = [],
  reingestPendingMatches = [],
  onFixData,
  onRenameColumn,
  quietTimeExtraction = null,
  onDismissQuietTimeExtraction,
  onUndoQuietTimeExtraction,
  defectDetection = null,
  onAcceptDefectDetection,
  onDismissDefectDetection,
  wideFormatDetection = null,
  onAcceptWideFormatDetection,
  onDismissWideFormatDetection,
}) => {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const defectMapping = useProjectStore(s => s.defectMapping);
  const measureColumns = useProjectStore(s => s.measureColumns);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  // FSJ-3b b0 landing: provenance metadata.
  // DataQualityReport carries totalRows/validRows/columnIssues but no pre-computed
  // missing-% by column — omitting that segment avoids an O(n*m) pass here (same
  // decision as the PWA FrameView, 2026-06-06).
  const dataFilename = useProjectStore(s => s.dataFilename);
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

  const inboxPrompts = React.useMemo<InboxDigestPrompt[]>(() => {
    const surveyPrompts = surveyInboxRules({
      improvementProject: liveProject,
      controlRecords,
      controlHandoffs,
      now: Date.now(),
    });
    // PR-CS-11 — re-ingest confirm breadcrumb: one navigate-only entry per pending
    // match. opensSurface 'analyze-focus' + opensId=hypothesisId routes to the CS-5
    // focus path in handleInboxNavigate. No apply callback (chips apply, hints navigate).
    const reingestPrompts: InboxDigestPrompt[] = reingestPendingMatches.map(m => ({
      id: `reingest:${m.id}`,
      severity: 'info' as const,
      message: `Needed factor "${m.column}" arrived for "${m.planLabel}"`,
      action: {
        label: 'Review on the Wall',
        opensSurface: 'analyze-focus',
        opensId: m.hypothesisId,
      },
    }));
    return [...reingestPrompts, ...surveyPrompts];
  }, [activeHubId, controlHandoffs, liveProject, controlRecords, reingestPendingMatches]);

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

  // PR-CS-5 Part 2: capture-from-step. Creates a step-noted Finding
  // (`originStepId = card.stepId`) so it surfaces on this step's overlay (UNION
  // with column-derived findings). Pre-seeds activeFilters from the step's
  // assigned columns + stats from the step card. Editing stays in the findings
  // surfaces — this is a one-click capture.
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

  const handleInboxNavigate = React.useCallback(
    (prompt: InboxDigestPrompt) => {
      const surface = prompt.action?.opensSurface;
      if (surface === 'sustainment') {
        usePanelsStore.getState().showControl(prompt.action?.opensId);
        return;
      }
      if (surface === 'improvement-projects') {
        usePanelsStore.getState().showCharter();
        return;
      }
      // PR-CS-11 — re-ingest breadcrumb: open Analyze focused on the hypothesis
      // (CS-5 focus path). Navigate-only; the apply lives on the Wall chip.
      if (surface === 'analyze-focus' && prompt.action?.opensId) {
        handleOpenInvestigationFocus({ kind: 'suspected-cause', id: prompt.action.opensId });
        return;
      }
      usePanelsStore.getState().showAnalyze();
    },
    [handleOpenInvestigationFocus]
  );

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

  // FSJ-3b b0 landing slots (spec §4.1; wireframe b0-landing).
  // Hardcoded English per the OutcomeNoMatchBanner precedent — the 32-catalog
  // i18n sweep is a logged follow-up, not this PR.
  //
  // DataQualityReport carries totalRows/validRows/columnIssues but no pre-computed
  // missing-% by column, so omitting the missingSegment avoids an O(n*m) pass here.
  // The provenance bar shows filename · rows · columns which matches the wireframe.
  // Azure-specific fallback: 'Pasted Data' (always arrives via paste); PWA uses 'Data' — deliberate divergence.
  const b0Slots = React.useMemo(() => {
    const columnCount = rawData.length > 0 ? Object.keys(rawData[0]).length : 0;
    const columnNames = rawData.length > 0 ? Object.keys(rawData[0]) : [];
    const acceptedPerformanceColumns = measureColumns.filter(column =>
      columnNames.includes(column)
    );
    const showQuietTimeChip =
      quietTimeExtraction != null &&
      !quietTimeExtraction.dismissed &&
      quietTimeExtraction.newColumns.length > 0;
    const selectionDisabled =
      defectDetection != null || wideFormatDetection != null ? (
        <div className="rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm text-content-secondary">
          Choose an option in the banner above to continue.
        </div>
      ) : undefined;
    const performanceAccepted =
      analysisMode === 'performance' && acceptedPerformanceColumns.length > 0 ? (
        <div
          data-testid="b0-performance-accepted"
          className="rounded-md border border-blue-400/40 bg-blue-500/10 px-3 py-2 text-sm text-content"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              Tracking {acceptedPerformanceColumns.length} channel measurements
            </span>
            <span className="text-content-secondary">{acceptedPerformanceColumns.join(', ')}</span>
            {onFixData ? (
              <button
                type="button"
                data-testid="b0-performance-accepted-stack"
                onClick={onFixData}
                className="ml-auto rounded border border-blue-400/40 px-2 py-1 text-xs font-medium text-content hover:bg-blue-500/10"
              >
                Combine into one measure
              </button>
            ) : null}
          </div>
        </div>
      ) : undefined;
    return {
      topBar: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-xs text-content-muted">
            <span data-testid="b0-provenance">
              {`${dataFilename ?? 'Pasted Data'} · ${rawData.length} rows · ${columnCount} columns`}
            </span>
            {onFixData && (
              <button
                type="button"
                data-testid="b0-fix-data"
                onClick={onFixData}
                className="text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline"
              >
                Fix data…
              </button>
            )}
          </div>
          {defectDetection && onAcceptDefectDetection && onDismissDefectDetection ? (
            <B0DefectModeBanner
              detection={defectDetection}
              columnNames={columnNames}
              onAccept={onAcceptDefectDetection}
              onDismiss={onDismissDefectDetection}
            />
          ) : null}
          {wideFormatDetection && onAcceptWideFormatDetection && onDismissWideFormatDetection ? (
            <B0PerformanceModeBanner
              detection={wideFormatDetection}
              onAccept={onAcceptWideFormatDetection}
              onDismiss={onDismissWideFormatDetection}
              onStack={() => onFixData?.()}
            />
          ) : null}
          {showQuietTimeChip ? (
            <div
              data-testid="b0-time-chip"
              className="flex flex-wrap items-center gap-2 rounded-md border border-edge bg-surface-secondary px-3 py-2 text-xs text-content-secondary"
            >
              <span className="font-medium text-content">
                Dates detected in {quietTimeExtraction.timeColumn}
              </span>
              <span>added Month + Day of Week.</span>
              {onFixData ? (
                <button
                  type="button"
                  data-testid="b0-time-chip-adjust"
                  onClick={onFixData}
                  className="text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline"
                >
                  Adjust
                </button>
              ) : null}
              {onUndoQuietTimeExtraction ? (
                <button
                  type="button"
                  data-testid="b0-time-chip-undo"
                  onClick={onUndoQuietTimeExtraction}
                  className="text-content hover:text-content-secondary underline-offset-2 hover:underline"
                >
                  Undo
                </button>
              ) : null}
              {onDismissQuietTimeExtraction ? (
                <button
                  type="button"
                  data-testid="b0-time-chip-dismiss"
                  aria-label="Dismiss date chip"
                  onClick={onDismissQuietTimeExtraction}
                  className="ml-auto text-content-muted hover:text-content"
                >
                  ×
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ),
      belowY: onFixData ? (
        <button
          type="button"
          data-testid="b0-track-another-outcome"
          onClick={onFixData}
          className="text-xs text-content-muted hover:text-content underline-offset-2 hover:underline"
        >
          ＋ track another outcome
        </button>
      ) : undefined,
      // Deliberately constructed unconditionally (unlike belowY): FrameViewB0 owns
      // the no-Y gate (yCandidates is derived inside CanvasWorkspace, not here —
      // duplicating that detection heuristic in this file would couple two layers).
      // An unrendered React element is an inert descriptor; no hooks run unmounted.
      noYBanner: (
        <OutcomeNoMatchBanner
          onRename={(oldName, newName) => onRenameColumn?.(oldName, newName)}
          onExpectedChange={() => {
            // Parity with the wizard mount: the note has no store home yet
            // (ProcessHub field pending — known gap, logged in investigations.md).
          }}
          onSkip={handleSeeData}
        />
      ),
      selectionDisabled,
      emptyY: performanceAccepted,
    };
  }, [
    rawData,
    dataFilename,
    analysisMode,
    measureColumns,
    onFixData,
    onRenameColumn,
    handleSeeData,
    onDismissQuietTimeExtraction,
    onUndoQuietTimeExtraction,
    quietTimeExtraction,
    defectDetection,
    onAcceptDefectDetection,
    onDismissDefectDetection,
    wideFormatDetection,
    onAcceptWideFormatDetection,
    onDismissWideFormatDetection,
  ]);

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
        analysisMode={analysisMode as AnalysisMode}
        defectMapping={defectMapping}
        measureColumns={measureColumns}
        setOutcome={setOutcome}
        setFactors={setFactors}
        measureSpecs={measureSpecs}
        setMeasureSpec={setMeasureSpec}
        processContext={processContext}
        setProcessContext={setProcessContext}
        onSeeData={handleSeeData}
        onLogQuickAction={handleLogQuickAction}
        findings={findings}
        hypotheses={hypotheses}
        causalLinks={causalLinks}
        onOpenWall={handleOpenWall}
        onOpenInvestigationFocus={handleOpenInvestigationFocus}
        onAddCausalLink={handleAddCausalLink}
        onRemoveCausalLink={handleRemoveCausalLink}
        contextLinkGroups={contextLinkGroups}
        onNavigateContextLink={handleNavigateContextLink}
        onCaptureFindingFromStep={handleCaptureFindingFromStep}
        priorStepStats={priorStepStats}
        canEditCanvas={canEditCanvas}
        actionItems={actionItems}
        activeIP={activeIP}
        onPersistCanvasState={upsertProject}
        outcomeSpecs={outcomeSpecs}
        onExploreExit={handleExploreExit}
        onChipExploreJump={handleChipExploreJump}
        b0Slots={b0Slots}
      />
    </div>
  );
};

export default FrameView;
