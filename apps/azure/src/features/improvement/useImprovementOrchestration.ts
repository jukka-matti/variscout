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
import type { Finding, FindingAssignee, Question, ProcessContext } from '@variscout/core';
import type { UseQuestionsReturn } from '@variscout/hooks';
import {
  openImprovementPopout,
  updateImprovementPopout,
  IMPROVEMENT_ACTION_KEY,
  type ImprovementSyncData,
  type ImprovementAction,
} from '../../components/ImprovementWindow';
import { useImprovementStore } from './improvementStore';

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
}

export interface UseImprovementOrchestrationOptions {
  questionsState: UseQuestionsReturn;
  findingsState: FindingsStateSlice;
  persistedQuestions: Question[] | undefined;
  processContext: ProcessContext | undefined;
  setProcessContext: (ctx: ProcessContext) => void;
}

export interface UseImprovementOrchestrationReturn {
  /** Convert all selected ideas to action items on their linked findings */
  handleConvertIdeasToActions: () => void;
  /** Open improvement popout window */
  handleOpenImprovementPopout: () => void;
  /** Synthesis text change handler */
  handleSynthesisChange: (text: string) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useImprovementOrchestration({
  questionsState,
  findingsState,
  persistedQuestions,
  processContext,
  setProcessContext,
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

  // ── Sync computed state to Zustand store ────────────────────────────────
  const syncState = useImprovementStore.getState().syncState;
  useEffect(() => {
    syncState({
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
    syncState,
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
  };
}
