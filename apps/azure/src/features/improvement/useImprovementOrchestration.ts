/**
 * useImprovementOrchestration - Improvement workspace orchestration for Azure Editor
 *
 * Owns the improvement workspace data assembly: filters hypotheses (suspected
 * causes) with ideas, computes linked findings, selected idea IDs, projected Cpk
 * map, and converted idea IDs. Syncs computed state to the improvement popout,
 * and provides DataContext-dependent action callbacks (popout sync, synthesis
 * change, idea-to-action conversion).
 *
 * IM-1 (ADR-085): the workspace operates on `Hypothesis` hubs (with re-homed
 * `ideas`) rather than the retired `Question` entity. Findings link to a
 * hypothesis via `Hypothesis.findingIds`; cause badges derive from
 * `Hypothesis.status` (no `causeRole`).
 */
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import type {
  Finding,
  FindingAssignee,
  FindingOutcome,
  Hypothesis,
  ImprovementIdea,
  IdeaTimeframe,
  IdeaDirection,
  IdeaCostCategory,
  ProcessContext,
  DataRow,
  SpecLimits,
  StagedStatsResult,
} from '@variscout/core';
import { calculateStats, toNumericValue } from '@variscout/core';
import { calculateStagedComparison, toVerificationData } from '@variscout/core/stats';
import { assignCauseColors } from '@variscout/core/findings';
import type { HypothesisCondition } from '@variscout/core/findings';
import { useAnalyzeFeatureStore } from '../analyze/analyzeStore';
import type { MatrixIdea, CauseSummary, TrackedAction, SelectedIdea } from '@variscout/ui';
import { openImprovementPopout, updateImprovementPopout } from '../../components/ImprovementWindow';
import type { ImprovementSyncData, ImprovementActionMessage } from '@variscout/hooks';
import { usePopoutChannel } from '@variscout/hooks';
import type { ImprovementHypothesis } from './improvementStore';
export type { ImprovementHypothesis } from './improvementStore';

// ── Types ────────────────────────────────────────────────────────────────

interface FindingsStateSlice {
  findings: Finding[];
  addAction: (
    findingId: string,
    text: string,
    assignee?: FindingAssignee,
    dueDate?: string,
    ideaId?: string
  ) => void;
  setOutcome: (findingId: string, outcome: FindingOutcome) => void;
}

/** Idea write callbacks, keyed by hypothesisId (IM-1 — ideas live on Hypothesis). */
export interface IdeaActions {
  addIdea: (hypothesisId: string, text: string) => void;
  updateIdea: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'timeframe' | 'direction' | 'cost'>>
  ) => void;
  selectIdea: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  removeIdea: (hypothesisId: string, ideaId: string) => void;
}

export interface UseImprovementOrchestrationOptions {
  /** Persisted hypothesis hubs (the suspected causes) carrying re-homed ideas */
  hypotheses: Hypothesis[];
  /** Idea write callbacks keyed by hypothesisId */
  ideaActions: IdeaActions;
  findingsState: FindingsStateSlice;
  processContext: ProcessContext | undefined;
  setProcessContext: (ctx: ProcessContext) => void;
  /** Raw (unfiltered) data rows for reference context computation */
  rawData: DataRow[];
  /** Outcome column name */
  outcome: string | null;
  /** Spec limits (USL/LSL) */
  specs: SpecLimits;
  /** Staged stats for verification data (when stage column is set) */
  stagedStats?: StagedStatsResult | null;
}

export interface UseImprovementOrchestrationReturn {
  /** Convert all selected ideas to action items on their linked findings */
  handleConvertIdeasToActions: () => void;
  /** Open improvement popout window */
  handleOpenImprovementPopout: () => void;
  /** Synthesis text change handler */
  handleSynthesisChange: (text: string) => void;
  /** Hypotheses (suspected causes) that have ideas */
  improvementHypotheses: ImprovementHypothesis[];
  /** Findings linked to any hypothesis with ideas */
  improvementLinkedFindings: Array<{ id: string; text: string }>;
  /** Set of selected idea IDs across all hypotheses */
  selectedIdeaIds: Set<string>;
  /** Projected Cpk map: finding ID -> projected Cpk */
  projectedCpkMap: Record<string, number>;
  /** Ideas that already have matching action items */
  convertedIdeaIds: Set<string>;
  /** Map of hypothesisId → hex color for cause grouping */
  causeColors: Map<string, string>;
  /** Labels for cause legend (hypothesisId → display name) */
  causeLabels: Map<string, string>;
  /** Cause summaries for context panel */
  causeSummaries: CauseSummary[];
  /** Matrix-shaped ideas for PrioritizationMatrix */
  matrixIdeas: MatrixIdea[];
  /** Aggregated actions from all findings (for TrackView) */
  aggregatedActions: TrackedAction[];
  /** Selected ideas recap (for TrackView PlanRecap) */
  selectedIdeasForRecap: SelectedIdea[];
  /** Reference context for What-If subset vs reference stats */
  projectionReferenceContext?: {
    subsetLabel: string;
    subsetCount: number;
    subsetCpk?: number;
    referenceLabel: string;
    referenceCount: number;
    referenceCpk?: number;
  };
  /** Verification data from staged comparison */
  verificationData?: {
    cpkBefore: number;
    cpkAfter: number;
    passRateBefore: number;
    passRateAfter: number;
    meanShift: number;
    sigmaRatio: number;
    dataDate: string;
  };
  /** Whether verification data exists */
  hasVerification: boolean;
  /** Current outcome from focus finding */
  currentOutcome?: FindingOutcome;
  /** Outcome notes */
  outcomeNotes?: string;
  /** Set outcome on focus finding */
  handleOutcomeChange: (outcome: 'effective' | 'partial' | 'not-effective') => void;
  /** Update outcome notes */
  handleOutcomeNotesChange: (notes: string) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Find the finding linked to a hypothesis (first of its findingIds present). */
function findLinkedFinding(hub: Hypothesis, findings: Finding[]): Finding | undefined {
  return findings.find(f => hub.findingIds.includes(f.id));
}

/** Extract the standard-mode R²adj contribution from a hypothesis evidence facet. */
function evidenceDisplay(
  hub: Hypothesis
): { rSquaredAdj?: number; etaSquared?: number } | undefined {
  if (!hub.evidence) return undefined;
  const value = hub.evidence.contribution.value;
  // contribution.value is mode-aware; in standard mode it is R²adj (0-1).
  return hub.evidence.mode === 'standard' ? { rSquaredAdj: value } : undefined;
}

/**
 * Find the first `eq` leaf (column = scalar) anywhere in a HypothesisCondition
 * tree. Drives the What-If subset-vs-complement reference context now that the
 * factor/level no longer live on a Question entity (IM-1).
 */
function firstEqLeaf(
  condition: HypothesisCondition | undefined
): { factor: string; level: string } | undefined {
  if (!condition) return undefined;
  if (condition.kind === 'leaf') {
    if (
      condition.op === 'eq' &&
      (typeof condition.value === 'string' || typeof condition.value === 'number')
    ) {
      return { factor: condition.column, level: String(condition.value) };
    }
    return undefined;
  }
  if (condition.kind === 'not') {
    return firstEqLeaf(condition.child);
  }
  // and / or
  for (const child of condition.children) {
    const hit = firstEqLeaf(child);
    if (hit) return hit;
  }
  return undefined;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useImprovementOrchestration({
  hypotheses,
  ideaActions,
  findingsState,
  processContext,
  setProcessContext,
  rawData,
  outcome,
  specs,
  stagedStats,
}: UseImprovementOrchestrationOptions): UseImprovementOrchestrationReturn {
  // Hypotheses with ideas -> feed workspace
  const improvementHypotheses = useMemo<ImprovementHypothesis[]>(() => {
    return hypotheses
      .filter(h => h.ideas?.length)
      .map(h => ({
        id: h.id,
        text: h.name,
        status: h.status,
        ideas: h.ideas ?? [],
        linkedFindingName: findLinkedFinding(h, findingsState.findings)?.text?.slice(0, 60),
        evidence: evidenceDisplay(h),
      }));
  }, [hypotheses, findingsState.findings]);

  // Findings linked to any hypothesis with ideas
  const improvementLinkedFindings = useMemo(() => {
    const linkedIds = new Set(improvementHypotheses.flatMap(h => h.id));
    const findingIds = new Set(
      hypotheses.filter(h => linkedIds.has(h.id)).flatMap(h => h.findingIds)
    );
    return findingsState.findings
      .filter(f => findingIds.has(f.id))
      .map(f => ({ id: f.id, text: f.text }));
  }, [improvementHypotheses, hypotheses, findingsState.findings]);

  // Set of selected idea IDs across all hypotheses
  const selectedIdeaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const h of hypotheses) {
      for (const idea of h.ideas ?? []) {
        if (idea.selected) ids.add(idea.id);
      }
    }
    return ids;
  }, [hypotheses]);

  // Projected Cpk map: finding ID -> projected Cpk from linked improvement idea
  const projectedCpkMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of hypotheses) {
      const linkedFinding = findLinkedFinding(h, findingsState.findings);
      if (!linkedFinding) continue;
      const projectedIdea =
        (h.ideas ?? []).find(i => i.selected && i.projection?.projectedCpk != null) ??
        (h.ideas ?? []).find(i => i.projection?.projectedCpk != null);
      if (projectedIdea?.projection?.projectedCpk != null) {
        map[linkedFinding.id] = projectedIdea.projection.projectedCpk;
      }
    }
    return map;
  }, [hypotheses, findingsState.findings]);

  // Ideas that already have matching action items
  const convertedIdeaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of findingsState.findings) {
      for (const action of f.actions ?? []) {
        if (action.ideaId) ids.add(action.ideaId);
      }
    }
    return ids;
  }, [findingsState.findings]);

  // ── Cause colors, labels, summaries for split layout ────────────────────

  // Cause colors for matrix dots and context panel — keyed by hypothesis id
  // (IM-1: causeRole retired; every hypothesis with ideas is a cause node).
  const causeColors = useMemo(() => {
    const ids = hypotheses.filter(h => h.ideas?.length).map(h => h.id);
    return assignCauseColors(ids);
  }, [hypotheses]);

  // Cause labels for matrix legend
  const causeLabels = useMemo(() => {
    const map = new Map<string, string>();
    hypotheses
      .filter(h => h.ideas?.length)
      .forEach(h => {
        map.set(h.id, h.name);
      });
    return map;
  }, [hypotheses]);

  // Cause summaries for context panel
  const causeSummaries: CauseSummary[] = useMemo(() => {
    return hypotheses
      .filter(h => h.ideas?.length)
      .map(h => {
        const display = evidenceDisplay(h);
        return {
          id: h.id,
          factor: h.name,
          evidence:
            display?.rSquaredAdj != null
              ? `R²adj ${Math.round(display.rSquaredAdj * 100)}%`
              : display?.etaSquared != null
                ? `η² ${Math.round(display.etaSquared * 100)}%`
                : '',
          role: (h.status === 'confirmed' ? 'suspected-cause' : 'contributing') as
            | 'suspected-cause'
            | 'contributing'
            | 'ruled-out',
          ideaCount: h.ideas?.length ?? 0,
          actionCount: findingsState.findings
            .filter(f => h.findingIds.includes(f.id))
            .reduce((sum, f) => sum + (f.actions?.length ?? 0), 0),
          color: causeColors.get(h.id) ?? '#94a3b8',
        };
      });
  }, [hypotheses, causeColors, findingsState.findings]);

  // Matrix ideas (transform improvement hypotheses to MatrixIdea shape)
  const matrixIdeas: MatrixIdea[] = useMemo(() => {
    return improvementHypotheses.flatMap(h =>
      (h.ideas ?? []).map(idea => ({
        id: idea.id,
        text: idea.text,
        hypothesisId: h.id,
        timeframe: idea.timeframe,
        cost: idea.cost,
        risk: idea.risk,
        projection: idea.projection,
        impactOverride: idea.impactOverride,
        selected: selectedIdeaIds.has(idea.id),
      }))
    );
  }, [improvementHypotheses, selectedIdeaIds]);

  // ── Aggregated actions for Track view ────────────────────────────────────

  const aggregatedActions = useMemo((): TrackedAction[] => {
    return findingsState.findings
      .filter(f => f.actions && f.actions.length > 0)
      .flatMap(f =>
        f.actions!.map(a => {
          const hub = hypotheses.find(h => h.findingIds.includes(f.id));
          return {
            id: a.id,
            text: a.text,
            assignee: a.assignee
              ? { name: a.assignee.displayName, email: a.assignee.upn }
              : undefined,
            dueDate: a.dueDate,
            completedAt: a.completedAt,
            createdAt: a.createdAt,
            ideaId: a.ideaId,
            findingId: f.id,
            causeColor: hub ? causeColors.get(hub.id) : undefined,
            causeName: hub?.name ?? undefined,
            projectedCpk: projectedCpkMap[f.id],
          };
        })
      );
  }, [findingsState.findings, hypotheses, causeColors, projectedCpkMap]);

  // ── Selected ideas recap for Track view PlanRecap ──────────────────────

  const selectedIdeasForRecap = useMemo((): SelectedIdea[] => {
    return improvementHypotheses.flatMap(h =>
      (h.ideas ?? [])
        .filter(i => selectedIdeaIds.has(i.id))
        .map(i => ({
          id: i.id,
          text: i.text,
          causeColor: causeColors.get(h.id),
          projectedCpk: i.projection?.projectedCpk,
        }))
    );
  }, [improvementHypotheses, selectedIdeaIds, causeColors]);

  // ── Focus finding, verification data, and outcome state ─────────────────

  // Focus finding: the improving finding we're tracking
  const focusFinding = useMemo(() => {
    return (
      findingsState.findings.find(
        f => f.status === 'improving' && f.actions && f.actions.length > 0
      ) ?? null
    );
  }, [findingsState.findings]);

  // Verification data from staged comparison
  const verificationData = useMemo(() => {
    if (!stagedStats) return undefined;
    const comparison = calculateStagedComparison(stagedStats);
    if (!comparison) return undefined;
    return toVerificationData(comparison) ?? undefined;
  }, [stagedStats]);

  const hasVerification = !!verificationData;

  // Current outcome from focus finding
  const currentOutcome = focusFinding?.outcome;
  const outcomeNotes = currentOutcome?.notes;

  // Outcome callbacks
  const handleOutcomeChange = useCallback(
    (outcome: 'effective' | 'partial' | 'not-effective') => {
      if (!focusFinding) return;
      const effectiveMap = {
        effective: 'yes',
        partial: 'partial',
        'not-effective': 'no',
      } as const;
      findingsState.setOutcome(focusFinding.id, {
        effective: effectiveMap[outcome],
        cpkBefore: verificationData?.cpkBefore,
        cpkAfter: verificationData?.cpkAfter,
        notes: currentOutcome?.notes,
        verifiedAt: Date.now(),
      });
    },
    [focusFinding, findingsState, verificationData, currentOutcome]
  );

  const handleOutcomeNotesChange = useCallback(
    (notes: string) => {
      if (!focusFinding || !currentOutcome) return;
      findingsState.setOutcome(focusFinding.id, {
        ...currentOutcome,
        notes,
      });
    },
    [focusFinding, findingsState, currentOutcome]
  );

  // Convert all selected ideas to action items on their linked findings
  const handleConvertIdeasToActions = useCallback(() => {
    for (const h of hypotheses) {
      const linkedFinding = findLinkedFinding(h, findingsState.findings);
      if (!linkedFinding) continue;
      for (const idea of h.ideas ?? []) {
        if (!idea.selected) continue;
        if (linkedFinding.actions?.some(a => a.ideaId === idea.id)) continue;
        findingsState.addAction(linkedFinding.id, idea.text, undefined, undefined, idea.id);
      }
    }
  }, [hypotheses, findingsState]);

  // ── Improvement Popout ─────────────────────────────────────────────────
  const improvementPopoutRef = React.useRef<Window | null>(null);

  const buildImprovementSyncData = useCallback(
    (): ImprovementSyncData => ({
      synthesis: processContext?.synthesis,
      hypotheses: improvementHypotheses.map(h => ({
        id: h.id,
        name: h.text,
        status: h.status ?? 'proposed',
        factor: h.factor,
        ideas: h.ideas,
        linkedFindingName: h.linkedFindingName,
      })),
      linkedFindings: improvementLinkedFindings,
      selectedIdeaIds: Array.from(selectedIdeaIds),
      convertedIdeaIds: Array.from(convertedIdeaIds),
      targetCpk: processContext?.targetValue,
    }),
    [
      processContext,
      improvementHypotheses,
      improvementLinkedFindings,
      selectedIdeaIds,
      convertedIdeaIds,
    ]
  );

  const handleOpenImprovementPopout = useCallback(() => {
    const popup = openImprovementPopout(buildImprovementSyncData());
    improvementPopoutRef.current = popup;
  }, [buildImprovementSyncData]);

  // Keep popout in sync when data changes
  useEffect(() => {
    if (!improvementPopoutRef.current || improvementPopoutRef.current.closed) return;
    updateImprovementPopout(buildImprovementSyncData());
  }, [buildImprovementSyncData]);

  // Listen for actions from the popout window via BroadcastChannel
  const { lastMessage: improvementLastMessage } = usePopoutChannel<ImprovementActionMessage>({
    windowId: 'main',
  });

  useEffect(() => {
    if (!improvementLastMessage || improvementLastMessage.type !== 'improvement-action') return;
    const action = (improvementLastMessage as ImprovementActionMessage).payload;
    switch (action.action) {
      case 'synthesis-change':
        setProcessContext({ ...processContext, synthesis: action.text });
        break;
      case 'toggle-select':
        ideaActions.selectIdea(action.hypothesisId, action.ideaId, action.selected);
        break;
      case 'update-timeframe':
        ideaActions.updateIdea(action.hypothesisId, action.ideaId, {
          timeframe: action.timeframe as IdeaTimeframe | undefined,
        });
        break;
      case 'update-direction':
        ideaActions.updateIdea(action.hypothesisId, action.ideaId, {
          direction: action.direction as IdeaDirection | undefined,
        });
        break;
      case 'update-cost':
        ideaActions.updateIdea(action.hypothesisId, action.ideaId, {
          cost: action.cost as { category: IdeaCostCategory } | undefined,
        });
        break;
      case 'remove-idea':
        ideaActions.removeIdea(action.hypothesisId, action.ideaId);
        break;
      case 'add-idea':
        ideaActions.addIdea(action.hypothesisId, action.text);
        break;
      case 'convert-to-actions':
        handleConvertIdeasToActions();
        break;
    }
  }, [
    improvementLastMessage,
    processContext,
    setProcessContext,
    ideaActions,
    handleConvertIdeasToActions,
  ]);

  // Synthesis text change handler
  const handleSynthesisChange = useCallback(
    (text: string) => {
      setProcessContext({ ...processContext, synthesis: text });
    },
    [processContext, setProcessContext]
  );

  // ── Projection reference context (subset vs complement stats) ───────────
  const projectionReferenceContext = useMemo(() => {
    const projTarget = useAnalyzeFeatureStore.getState().projectionTarget;
    if (!projTarget || !rawData?.length || !outcome) return undefined;

    // The What-If projection target carries a factor=level subset derived from
    // the hypothesis's condition. Resolve it from the linked hypothesis's first
    // equality leaf (IM-1: factor/level no longer live on a Question).
    const hub = hypotheses.find(h => h.id === projTarget.hypothesisId);
    const eqLeaf = firstEqLeaf(hub?.condition);
    if (!eqLeaf) return undefined;

    const { factor, level } = eqLeaf;

    const subset = rawData.filter(row => String(row[factor]) === String(level));
    const complement = rawData.filter(row => String(row[factor]) !== String(level));

    if (!subset.length || !complement.length) return undefined;

    const subsetVals = subset
      .map(r => toNumericValue(r[outcome]))
      .filter((v): v is number => v !== undefined);
    const compVals = complement
      .map(r => toNumericValue(r[outcome]))
      .filter((v): v is number => v !== undefined);

    if (subsetVals.length < 2 || compVals.length < 2) return undefined;

    const subStats = calculateStats(subsetVals, specs?.usl, specs?.lsl);
    const compStats = calculateStats(compVals, specs?.usl, specs?.lsl);

    return {
      subsetLabel: `${factor} = ${level}`,
      subsetCount: subset.length,
      subsetCpk: subStats.cpk,
      referenceLabel: `${factor} ≠ ${level}`,
      referenceCount: complement.length,
      referenceCpk: compStats.cpk,
    };
  }, [rawData, outcome, specs, hypotheses]);

  // Pre-fill synthesis from problem statement on first visit to Improvement workspace
  const hasPreFilled = useRef(false);
  useEffect(() => {
    if (!hasPreFilled.current && processContext?.problemStatement && !processContext?.synthesis) {
      hasPreFilled.current = true;
      handleSynthesisChange(processContext.problemStatement);
    }
  }, [processContext?.problemStatement, processContext?.synthesis, handleSynthesisChange]);

  return {
    handleConvertIdeasToActions,
    handleOpenImprovementPopout,
    handleSynthesisChange,
    improvementHypotheses,
    improvementLinkedFindings,
    selectedIdeaIds,
    projectedCpkMap,
    convertedIdeaIds,
    causeColors,
    causeLabels,
    causeSummaries,
    matrixIdeas,
    aggregatedActions,
    selectedIdeasForRecap,
    projectionReferenceContext,
    verificationData,
    hasVerification,
    currentOutcome,
    outcomeNotes,
    handleOutcomeChange,
    handleOutcomeNotesChange,
  };
}
