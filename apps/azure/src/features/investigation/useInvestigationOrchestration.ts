/**
 * useInvestigationOrchestration - Investigation/question orchestration for Azure Editor
 *
 * Owns the investigation workflow: calls useQuestions (CRUD engine from @variscout/hooks),
 * syncs computed state (questionsMap, ideaImpacts, suspectedCauses) to the Zustand
 * investigationStore for selector-based reads, and provides DataContext-dependent action callbacks.
 */
import { useMemo, useCallback, useEffect, useRef } from 'react';
import { computeIdeaImpact } from '@variscout/core';
import { migrateCauseRolesToHubs } from '@variscout/core/findings';
import { useInvestigationStore } from './investigationStore';
import { usePanelsStore } from '../panels/panelsStore';
import { useSuspectedCauses } from '@variscout/hooks';
import type {
  Finding,
  FindingProjection,
  FindingStatus,
  ProcessContext,
  StatsResult,
  SuspectedCause,
} from '@variscout/core';
import type { UseQuestionsReturn } from '@variscout/hooks';

// ── Interfaces ────────────────────────────────────────────────────────────

interface FindingsStateSlice {
  findings: Finding[];
  linkQuestion: (findingId: string, questionId: string) => void;
  setFindingStatus: (id: string, status: FindingStatus) => void;
  addAction: (findingId: string, text: string) => void;
}

export interface UseInvestigationOrchestrationOptions {
  questionsState: UseQuestionsReturn;
  findingsState: FindingsStateSlice;
  processContext: ProcessContext | undefined;
  stats: StatsResult | null;
}

export interface UseInvestigationOrchestrationReturn {
  /** Create question and link to finding */
  handleCreateQuestion: (findingId: string, text: string, factor?: string, level?: string) => void;
  /** Open What-If pre-loaded for a specific improvement idea. When inline=true, sets projection target without opening full-page What-If (for left panel embedding). */
  handleProjectIdea: (questionId: string, ideaId: string, inline?: boolean) => void;
  /** Save projection from What-If back to idea */
  handleSaveIdeaProjection: (projection: FindingProjection) => void;
  /** Clear the projection target (e.g., when closing What-If without saving) */
  clearProjectionTarget: () => void;
  /** Set finding status with automatic idea-to-action conversion */
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  /** Full suspected causes hook state — hub CRUD operations for the Investigation workspace */
  suspectedCausesState: {
    hubs: SuspectedCause[];
    createHub: (name: string, synthesis: string) => SuspectedCause;
    updateHub: (
      hubId: string,
      updates: Partial<Pick<SuspectedCause, 'name' | 'synthesis'>>
    ) => void;
    deleteHub: (hubId: string) => void;
    resetHubs: (newHubs: SuspectedCause[]) => void;
    connectQuestion: (hubId: string, questionId: string) => void;
    disconnectQuestion: (hubId: string, questionId: string) => void;
    connectFinding: (hubId: string, findingId: string) => void;
    disconnectFinding: (hubId: string, findingId: string) => void;
    setHubStatus: (hubId: string, status: SuspectedCause['status']) => void;
    getHubForQuestion: (questionId: string) => SuspectedCause | undefined;
    getHubForFinding: (findingId: string) => SuspectedCause | undefined;
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useInvestigationOrchestration({
  questionsState,
  findingsState,
  processContext,
  stats,
}: UseInvestigationOrchestrationOptions): UseInvestigationOrchestrationReturn {
  // ── Suspected cause hubs ──────────────────────────────────────────────
  const suspectedCausesState = useSuspectedCauses({
    initialHubs: [],
    onHubsChange: useInvestigationStore.getState().syncSuspectedCauses,
  });

  // One-time migration: if hubs are empty and questions have legacy causeRole markers,
  // create hubs from those questions. Runs only once per orchestration mount.
  // Uses resetHubs() so that hook state + store are updated atomically — avoiding
  // the race where the subsequent onHubsChange sync effect would overwrite the store
  // with the stale empty array from hook state.
  const migrationDoneRef = useRef(false);
  useEffect(() => {
    if (migrationDoneRef.current) return;
    if (suspectedCausesState.hubs.length > 0) {
      migrationDoneRef.current = true;
      return;
    }
    const questionsWithCauseRole = questionsState.questions.filter(
      q => q.causeRole === 'suspected-cause'
    );
    if (questionsWithCauseRole.length > 0) {
      const migratedHubs = migrateCauseRolesToHubs(questionsWithCauseRole);
      if (migratedHubs.length > 0) {
        suspectedCausesState.resetHubs(migratedHubs);
      }
    }
    migrationDoneRef.current = true;
    // Only run once on mount — intentionally omit questionsState.questions from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store sync is handled entirely by the onHubsChange: syncSuspectedCauses callback
  // passed to useSuspectedCauses above. No separate effect needed — a second effect
  // would cause a double-sync and overwrite migrated hubs with stale empty state.

  // ── Sync questions to Zustand store ──────────────────────────────────
  const syncQuestions = useInvestigationStore.getState().syncQuestions;
  useEffect(() => {
    syncQuestions(questionsState.questions);
  }, [questionsState.questions, syncQuestions]);

  // ── Sync questionsMap to store ───────────────────────────────────────
  const questionsMap = useMemo(() => {
    const map: Record<
      string,
      {
        text: string;
        status: string;
        factor?: string;
        level?: string;
        causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
      }
    > = {};
    for (const h of questionsState.questions) {
      map[h.id] = {
        text: h.text,
        status: h.status,
        factor: h.factor,
        level: h.level,
        causeRole: h.causeRole,
      };
    }
    return map;
  }, [questionsState.questions]);

  const syncQuestionsMap = useInvestigationStore.getState().syncQuestionsMap;
  useEffect(() => {
    syncQuestionsMap(questionsMap);
  }, [questionsMap, syncQuestionsMap]);

  // ── Sync ideaImpacts to store ─────────────────────────────────────────
  const ideaImpacts = useMemo(() => {
    const impacts: Record<string, ReturnType<typeof computeIdeaImpact>> = {};
    const target =
      processContext?.targetMetric && processContext?.targetValue !== undefined
        ? {
            metric: processContext.targetMetric,
            value: processContext.targetValue,
            direction: processContext.targetDirection ?? 'minimize',
          }
        : undefined;
    const currentStats = stats
      ? { mean: stats.mean, sigma: stats.stdDev, cpk: stats.cpk }
      : undefined;

    for (const h of questionsState.questions) {
      if (h.ideas) {
        for (const idea of h.ideas) {
          impacts[idea.id] = computeIdeaImpact(idea, target, currentStats);
        }
      }
    }
    return impacts;
  }, [questionsState.questions, processContext, stats]);

  const syncIdeaImpacts = useInvestigationStore.getState().syncIdeaImpacts;
  useEffect(() => {
    syncIdeaImpacts(ideaImpacts);
  }, [ideaImpacts, syncIdeaImpacts]);

  // ── DataContext-dependent actions ─────────────────────────────────────

  // Question creation from finding cards
  const handleCreateQuestion = useCallback(
    (findingId: string, text: string, factor?: string, level?: string) => {
      const question = questionsState.addQuestion(text, factor, level);
      questionsState.linkFinding(question.id, findingId);
      findingsState.linkQuestion(findingId, question.id);
    },
    [questionsState, findingsState]
  );

  // Open What-If pre-loaded for a specific improvement idea
  // When inline=true, sets projection target without opening full-page What-If (for left panel embedding)
  const handleProjectIdea = useCallback(
    (questionId: string, ideaId: string, inline?: boolean) => {
      const question = questionsState.getQuestion(questionId);
      const idea = question?.ideas?.find(i => i.id === ideaId);
      if (question && idea) {
        useInvestigationStore.getState().setProjectionTarget({
          questionId,
          ideaId,
          ideaText: idea.text,
          questionText: question.text,
        });
      }
      if (!inline) {
        usePanelsStore.getState().setWhatIfOpen(true);
      }
    },
    [questionsState]
  );

  // Clear the projection target
  const clearProjectionTarget = useCallback(() => {
    useInvestigationStore.getState().setProjectionTarget(null);
  }, []);

  // Save projection from What-If back to idea
  const handleSaveIdeaProjection = useCallback(
    (projection: FindingProjection) => {
      const target = useInvestigationStore.getState().projectionTarget;
      if (target) {
        questionsState.setIdeaProjection(target.questionId, target.ideaId, projection);
        useInvestigationStore.getState().setProjectionTarget(null);
        usePanelsStore.getState().setWhatIfOpen(false);
      }
    },
    [questionsState]
  );

  // Idea -> Action conversion: when a finding moves to 'improving', convert selected ideas
  const handleSetFindingStatus = useCallback(
    (id: string, status: FindingStatus) => {
      if (status === 'improving') {
        const finding = findingsState.findings.find(f => f.id === id);
        if (finding?.questionId) {
          const question = questionsState.getQuestion(finding.questionId);
          const selectedIdeas = question?.ideas?.filter(i => i.selected) ?? [];
          if (selectedIdeas.length > 0) {
            findingsState.setFindingStatus(id, status);
            for (const idea of selectedIdeas) {
              findingsState.addAction(id, idea.text);
            }
            return;
          }
        }
      }
      findingsState.setFindingStatus(id, status);
    },
    [findingsState, questionsState]
  );

  return {
    handleCreateQuestion,
    handleProjectIdea,
    handleSaveIdeaProjection,
    clearProjectionTarget,
    handleSetFindingStatus,
    suspectedCausesState,
  };
}
