/**
 * useImprovementOrchestration - Improvement workspace orchestration for PWA
 *
 * Simplified version of Azure's orchestration (no popout sync, no Teams).
 * Filters questions with ideas, computes selected idea IDs, projected Cpk map,
 * and syncs to Zustand improvementStore.
 */
import { useMemo, useCallback, useEffect } from 'react';
import type { Finding } from '@variscout/core';
import type { UseQuestionsReturn } from '@variscout/hooks';
import { useImprovementFeatureStore, type ImprovementQuestion } from './improvementStore';

export type { ImprovementQuestion };

// ── Types ────────────────────────────────────────────────────────────────

interface FindingsStateSlice {
  findings: Finding[];
  addAction: (
    findingId: string,
    text: string,
    assignee?: undefined,
    dueDate?: string,
    ideaId?: string
  ) => void;
}

export interface UseImprovementOrchestrationOptions {
  questionsState: UseQuestionsReturn;
  findingsState: FindingsStateSlice;
}

export interface UseImprovementOrchestrationReturn {
  /** Convert selected ideas to action items on their linked findings */
  handleConvertIdeasToActions: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useImprovementOrchestration({
  questionsState,
  findingsState,
}: UseImprovementOrchestrationOptions): UseImprovementOrchestrationReturn {
  // ── Compute improvement data ────────────────────────────────────────

  const improvementQuestions = useMemo((): ImprovementQuestion[] => {
    return questionsState.questions
      .filter(
        q =>
          (q.status === 'answered' || q.status === 'investigating') && q.ideas && q.ideas.length > 0
      )
      .map(q => {
        const linkedFinding = findingsState.findings.find(f => f.questionId === q.id);
        return {
          id: q.id,
          text: q.text,
          causeRole: q.causeRole,
          factor: q.factor,
          ideas: q.ideas ?? [],
          linkedFindingName: linkedFinding?.text,
        };
      });
  }, [questionsState.questions, findingsState.findings]);

  const improvementLinkedFindings = useMemo(() => {
    const questionIds = new Set(improvementQuestions.map(q => q.id));
    return findingsState.findings
      .filter(f => f.questionId && questionIds.has(f.questionId))
      .map(f => ({ id: f.id, text: f.text }));
  }, [improvementQuestions, findingsState.findings]);

  const selectedIdeaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const q of improvementQuestions) {
      for (const idea of q.ideas) {
        if (idea.selected) ids.add(idea.id);
      }
    }
    return ids;
  }, [improvementQuestions]);

  const projectedCpkMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of questionsState.questions) {
      if (!q.ideas || q.ideas.length === 0) continue;
      const linkedFinding = findingsState.findings.find(f => f.questionId === q.id);
      if (!linkedFinding) continue;
      const selectedWithProjection = q.ideas.find(
        i => i.selected && i.projection?.projectedCpk != null
      );
      const anyWithProjection = q.ideas.find(i => i.projection?.projectedCpk != null);
      const best = selectedWithProjection ?? anyWithProjection;
      if (best?.projection?.projectedCpk != null) {
        map[linkedFinding.id] = best.projection.projectedCpk;
      }
    }
    return map;
  }, [questionsState.questions, findingsState.findings]);

  const convertedIdeaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of findingsState.findings) {
      if (f.actions) {
        for (const action of f.actions) {
          if (action.ideaId) ids.add(action.ideaId);
        }
      }
    }
    return ids;
  }, [findingsState.findings]);

  // ── Sync to store ──────────────────────────────────────────────────

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

  // ── Actions ────────────────────────────────────────────────────────

  const handleConvertIdeasToActions = useCallback(() => {
    for (const q of questionsState.questions) {
      if (!q.ideas || q.ideas.length === 0) continue;
      const linkedFinding = findingsState.findings.find(f => f.questionId === q.id);
      if (!linkedFinding) continue;

      for (const idea of q.ideas) {
        if (idea.selected && !convertedIdeaIds.has(idea.id)) {
          findingsState.addAction(linkedFinding.id, idea.text, undefined, undefined, idea.id);
        }
      }
    }
  }, [questionsState.questions, findingsState, convertedIdeaIds]);

  return {
    handleConvertIdeasToActions,
  };
}
