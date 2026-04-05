/**
 * useInvestigationOrchestration - Investigation/question orchestration for PWA
 *
 * Owns the investigation workflow: calls useQuestions (CRUD engine from @variscout/hooks),
 * computes derived state (questionsMap, ideaImpacts) as useMemo values returned from the hook,
 * and provides DataContext-dependent action callbacks.
 */
import { useMemo, useCallback, useEffect, useRef } from 'react';
import { migrateCauseRolesToHubs } from '@variscout/core/findings';
import {
  useInvestigationFeatureStore,
  buildQuestionsMap,
  buildIdeaImpacts,
} from './investigationStore';
import type { QuestionDisplayData } from './investigationStore';
import { usePanelsStore } from '../panels/panelsStore';
import { useSuspectedCauses } from '@variscout/hooks';
import type {
  Finding,
  FindingProjection,
  FindingStatus,
  IdeaImpact,
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
  /** Open What-If pre-loaded for a specific improvement idea */
  handleProjectIdea: (questionId: string, ideaId: string) => void;
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
  /** Map of question ID to display data for FindingCard */
  questionsMap: Record<string, QuestionDisplayData>;
  /** Computed idea impacts keyed by idea ID */
  ideaImpacts: Record<string, IdeaImpact | undefined>;
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

  // ── Compute derived data (returned from hook, not synced to store) ────
  const questionsMap = useMemo(
    () => buildQuestionsMap(questionsState.questions),
    [questionsState.questions]
  );

  const ideaImpacts = useMemo(
    () => buildIdeaImpacts(questionsState.questions, processContext, stats),
    [questionsState.questions, processContext, stats]
  );

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
  const handleProjectIdea = useCallback(
    (questionId: string, ideaId: string) => {
      const question = questionsState.getQuestion(questionId);
      const idea = question?.ideas?.find(i => i.id === ideaId);
      if (question && idea) {
        useInvestigationFeatureStore.getState().setProjectionTarget({
          questionId,
          ideaId,
          ideaText: idea.text,
          questionText: question.text,
        });
      }
      usePanelsStore.getState().setWhatIfOpen(true);
    },
    [questionsState]
  );

  // Clear the projection target
  const clearProjectionTarget = useCallback(() => {
    useInvestigationFeatureStore.getState().setProjectionTarget(null);
  }, []);

  // Save projection from What-If back to idea
  const handleSaveIdeaProjection = useCallback(
    (projection: FindingProjection) => {
      const target = useInvestigationFeatureStore.getState().projectionTarget;
      if (target) {
        questionsState.setIdeaProjection(target.questionId, target.ideaId, projection);
        useInvestigationFeatureStore.getState().setProjectionTarget(null);
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
    questionsMap,
    ideaImpacts,
  };
}
