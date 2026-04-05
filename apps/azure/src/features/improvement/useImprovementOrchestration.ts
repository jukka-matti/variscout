/**
 * useImprovementOrchestration - Improvement workspace orchestration for Azure Editor
 *
 * Owns the improvement workspace data assembly: filters questions with ideas,
 * computes linked findings, selected idea IDs, projected Cpk map, and converted
 * idea IDs. Syncs computed state to the Zustand improvementStore for selector-based
 * reads, and provides DataContext-dependent action callbacks (popout sync,
 * synthesis change, idea-to-action conversion).
 */
import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import type {
  Finding,
  FindingAssignee,
  FindingOutcome,
  Question,
  ProcessContext,
  DataRow,
  SpecLimits,
  StagedStatsResult,
} from '@variscout/core';
import { calculateStats, toNumericValue } from '@variscout/core';
import { calculateStagedComparison, toVerificationData } from '@variscout/core/stats';
import { assignCauseColors } from '@variscout/core/findings';
import { useInvestigationFeatureStore } from '../investigation/investigationStore';
import type { UseQuestionsReturn } from '@variscout/hooks';
import type { MatrixIdea, CauseSummary, TrackedAction, SelectedIdea } from '@variscout/ui';
import {
  openImprovementPopout,
  updateImprovementPopout,
  IMPROVEMENT_ACTION_KEY,
  type ImprovementSyncData,
  type ImprovementAction,
} from '../../components/ImprovementWindow';
import { useImprovementFeatureStore } from './improvementStore';

export type { ImprovementQuestion } from './improvementStore';

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

export interface UseImprovementOrchestrationOptions {
  questionsState: UseQuestionsReturn;
  findingsState: FindingsStateSlice;
  persistedQuestions: Question[] | undefined;
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
  /** Map of questionId → hex color for cause grouping */
  causeColors: Map<string, string>;
  /** Labels for cause legend (questionId → display name) */
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

// ── Hook ──────────────────────────────────────────────────────────────────

export function useImprovementOrchestration({
  questionsState,
  findingsState,
  persistedQuestions,
  processContext,
  setProcessContext,
  rawData,
  outcome,
  specs,
  stagedStats,
}: UseImprovementOrchestrationOptions): UseImprovementOrchestrationReturn {
  // Questions with answered/investigating status that have ideas -> feed workspace
  const improvementQuestions = useMemo(() => {
    return (persistedQuestions ?? [])
      .filter(h => (h.status === 'answered' || h.status === 'investigating') && h.ideas?.length)
      .map(h => ({
        id: h.id,
        text: h.text,
        causeRole: h.causeRole,
        factor: h.factor,
        ideas: h.ideas ?? [],
        linkedFindingName: findingsState.findings
          .find(f => f.questionId === h.id)
          ?.text?.slice(0, 60),
      }));
  }, [persistedQuestions, findingsState.findings]);

  // Findings linked to any question with ideas
  const improvementLinkedFindings = useMemo(() => {
    const questionIds = new Set(improvementQuestions.map(h => h.id));
    return findingsState.findings
      .filter(f => f.questionId && questionIds.has(f.questionId))
      .map(f => ({ id: f.id, text: f.text }));
  }, [improvementQuestions, findingsState.findings]);

  // Set of selected idea IDs across all questions
  const selectedIdeaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const h of persistedQuestions ?? []) {
      for (const idea of h.ideas ?? []) {
        if (idea.selected) ids.add(idea.id);
      }
    }
    return ids;
  }, [persistedQuestions]);

  // Projected Cpk map: finding ID -> projected Cpk from linked improvement idea
  const projectedCpkMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of persistedQuestions ?? []) {
      const linkedFinding = findingsState.findings.find(f => f.questionId === h.id);
      if (!linkedFinding) continue;
      const projectedIdea =
        (h.ideas ?? []).find(i => i.selected && i.projection?.projectedCpk != null) ??
        (h.ideas ?? []).find(i => i.projection?.projectedCpk != null);
      if (projectedIdea?.projection?.projectedCpk != null) {
        map[linkedFinding.id] = projectedIdea.projection.projectedCpk;
      }
    }
    return map;
  }, [persistedQuestions, findingsState.findings]);

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

  // Cause colors for matrix dots and context panel
  const causeColors = useMemo(() => {
    const ids = (persistedQuestions ?? [])
      .filter(q => q.causeRole === 'suspected-cause' || q.causeRole === 'contributing')
      .map(q => q.id);
    return assignCauseColors(ids);
  }, [persistedQuestions]);

  // Cause labels for matrix legend
  const causeLabels = useMemo(() => {
    const map = new Map<string, string>();
    (persistedQuestions ?? [])
      .filter(q => q.causeRole === 'suspected-cause' || q.causeRole === 'contributing')
      .forEach(q => {
        map.set(q.id, q.factor ?? q.text);
      });
    return map;
  }, [persistedQuestions]);

  // Cause summaries for context panel
  const causeSummaries: CauseSummary[] = useMemo(() => {
    return (persistedQuestions ?? [])
      .filter(q => q.causeRole === 'suspected-cause' || q.causeRole === 'contributing')
      .map(q => ({
        id: q.id,
        factor: q.factor ?? q.text,
        evidence:
          q.evidence?.rSquaredAdj != null
            ? `R\u00B2adj ${Math.round(q.evidence.rSquaredAdj * 100)}%`
            : q.evidence?.etaSquared != null
              ? `\u03B7\u00B2 ${Math.round(q.evidence.etaSquared * 100)}%`
              : '',
        role: (q.causeRole ?? 'suspected-cause') as
          | 'suspected-cause'
          | 'contributing'
          | 'ruled-out',
        ideaCount: q.ideas?.length ?? 0,
        actionCount: findingsState.findings
          .filter(f => f.questionId === q.id)
          .reduce((sum, f) => sum + (f.actions?.length ?? 0), 0),
        color: causeColors.get(q.id) ?? '#94a3b8',
      }));
  }, [persistedQuestions, causeColors, findingsState.findings]);

  // Matrix ideas (transform improvement questions to MatrixIdea shape)
  const matrixIdeas: MatrixIdea[] = useMemo(() => {
    return improvementQuestions.flatMap(q =>
      (q.ideas ?? []).map(idea => ({
        id: idea.id,
        text: idea.text,
        questionId: q.id,
        timeframe: idea.timeframe,
        cost: idea.cost,
        risk: idea.risk,
        projection: idea.projection,
        impactOverride: idea.impactOverride,
        selected: selectedIdeaIds.has(idea.id),
      }))
    );
  }, [improvementQuestions, selectedIdeaIds]);

  // ── Aggregated actions for Track view ────────────────────────────────────

  const aggregatedActions = useMemo((): TrackedAction[] => {
    return findingsState.findings
      .filter(f => f.actions && f.actions.length > 0)
      .flatMap(f =>
        f.actions!.map(a => {
          const q = (persistedQuestions ?? []).find(q => q.id === f.questionId);
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
            causeColor: q ? causeColors.get(q.id) : undefined,
            causeName: q?.factor ?? undefined,
            projectedCpk: projectedCpkMap[f.id],
          };
        })
      );
  }, [findingsState.findings, persistedQuestions, causeColors, projectedCpkMap]);

  // ── Selected ideas recap for Track view PlanRecap ──────────────────────

  const selectedIdeasForRecap = useMemo((): SelectedIdea[] => {
    return improvementQuestions.flatMap(q =>
      (q.ideas ?? [])
        .filter(i => selectedIdeaIds.has(i.id))
        .map(i => ({
          id: i.id,
          text: i.text,
          causeColor: causeColors.get(q.id),
          projectedCpk: i.projection?.projectedCpk,
        }))
    );
  }, [improvementQuestions, selectedIdeaIds, causeColors]);

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

  // ── Sync computed state to Zustand store ────────────────────────────────
  useEffect(() => {
    useImprovementFeatureStore.getState().syncState({
      improvementQuestions,
      improvementLinkedFindings,
      selectedIdeaIds,
      projectedCpkMap,
      convertedIdeaIds,
    });
  }, [
    improvementQuestions,
    improvementLinkedFindings,
    selectedIdeaIds,
    projectedCpkMap,
    convertedIdeaIds,
  ]);

  // Convert all selected ideas to action items on their linked findings
  const handleConvertIdeasToActions = useCallback(() => {
    for (const h of persistedQuestions ?? []) {
      const linkedFinding = findingsState.findings.find(f => f.questionId === h.id);
      if (!linkedFinding) continue;
      for (const idea of h.ideas ?? []) {
        if (!idea.selected) continue;
        if (linkedFinding.actions?.some(a => a.ideaId === idea.id)) continue;
        findingsState.addAction(linkedFinding.id, idea.text, undefined, undefined, idea.id);
      }
    }
  }, [persistedQuestions, findingsState]);

  // ── Improvement Popout ─────────────────────────────────────────────────
  const improvementPopoutRef = React.useRef<Window | null>(null);

  const buildImprovementSyncData = useCallback(
    (): ImprovementSyncData => ({
      synthesis: processContext?.synthesis,
      questions: improvementQuestions,
      linkedFindings: improvementLinkedFindings,
      selectedIdeaIds: Array.from(selectedIdeaIds),
      convertedIdeaIds: Array.from(convertedIdeaIds),
      targetCpk: processContext?.targetValue,
      timestamp: Date.now(),
    }),
    [
      processContext,
      improvementQuestions,
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

  // Listen for actions from the popout window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== IMPROVEMENT_ACTION_KEY || !e.newValue) return;
      try {
        const action = JSON.parse(e.newValue) as ImprovementAction;
        switch (action.type) {
          case 'synthesis-change':
            setProcessContext({ ...processContext, synthesis: action.text });
            break;
          case 'toggle-select':
            questionsState.selectIdea(action.questionId, action.ideaId, action.selected);
            break;
          case 'update-timeframe':
            questionsState.updateIdea(action.questionId, action.ideaId, {
              timeframe: action.timeframe,
            });
            break;
          case 'update-direction':
            questionsState.updateIdea(action.questionId, action.ideaId, {
              direction: action.direction,
            });
            break;
          case 'update-cost':
            questionsState.updateIdea(action.questionId, action.ideaId, {
              cost: action.cost,
            });
            break;
          case 'remove-idea':
            questionsState.removeIdea(action.questionId, action.ideaId);
            break;
          case 'add-idea':
            questionsState.addIdea(action.questionId, action.text);
            break;
          case 'convert-to-actions':
            handleConvertIdeasToActions();
            break;
        }
      } catch (err) {
        console.error('[Editor] Failed to parse improvement action:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [processContext, setProcessContext, questionsState, handleConvertIdeasToActions]);

  // Synthesis text change handler
  const handleSynthesisChange = useCallback(
    (text: string) => {
      setProcessContext({ ...processContext, synthesis: text });
    },
    [processContext, setProcessContext]
  );

  // ── Projection reference context (subset vs complement stats) ───────────
  const projectionReferenceContext = useMemo(() => {
    const projTarget = useInvestigationFeatureStore.getState().projectionTarget;
    if (!projTarget || !rawData?.length || !outcome) return undefined;

    const question = (persistedQuestions ?? []).find(q => q.id === projTarget.questionId);
    if (!question?.factor || !question?.level) return undefined;

    const factor = question.factor;
    const level = question.level;

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
  }, [rawData, outcome, specs, persistedQuestions]);

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
