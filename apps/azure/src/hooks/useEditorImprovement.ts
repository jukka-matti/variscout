/**
 * useEditorImprovement - Improvement workspace data preparation extracted from Editor.tsx
 *
 * Contains improvement workspace data assembly, popout window synchronization,
 * synthesis handler, and idea-to-action conversion logic.
 */
import React, { useMemo, useCallback, useEffect } from 'react';
import type { Finding, FindingAssignee, Hypothesis, ProcessContext } from '@variscout/core';
import type { UseHypothesesReturn } from '@variscout/hooks';
import {
  openImprovementPopout,
  updateImprovementPopout,
  IMPROVEMENT_ACTION_KEY,
  type ImprovementSyncData,
  type ImprovementAction,
} from '../components/ImprovementWindow';

// ── Interfaces ────────────────────────────────────────────────────────────

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

export interface UseEditorImprovementOptions {
  hypothesesState: UseHypothesesReturn;
  findingsState: FindingsStateSlice;
  persistedHypotheses: Hypothesis[] | undefined;
  processContext: ProcessContext | undefined;
  setProcessContext: (ctx: ProcessContext) => void;
}

export interface ImprovementHypothesis {
  id: string;
  text: string;
  causeRole?: 'primary' | 'contributing';
  factor?: string;
  ideas: NonNullable<Hypothesis['ideas']>;
  linkedFindingName?: string;
}

export interface UseEditorImprovementReturn {
  /** Hypotheses with supported/partial status that have ideas */
  improvementHypotheses: ImprovementHypothesis[];
  /** Findings linked to any hypothesis with ideas */
  improvementLinkedFindings: Array<{ id: string; text: string }>;
  /** Set of selected idea IDs across all hypotheses */
  selectedIdeaIds: Set<string>;
  /** Projected Cpk map: finding ID -> projected Cpk */
  projectedCpkMap: Record<string, number>;
  /** Ideas that already have matching action items */
  convertedIdeaIds: Set<string>;
  /** Convert all selected ideas to action items on their linked findings */
  handleConvertIdeasToActions: () => void;
  /** Open improvement popout window */
  handleOpenImprovementPopout: () => void;
  /** Synthesis text change handler */
  handleSynthesisChange: (text: string) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useEditorImprovement({
  hypothesesState,
  findingsState,
  persistedHypotheses,
  processContext,
  setProcessContext,
}: UseEditorImprovementOptions): UseEditorImprovementReturn {
  // Hypotheses with supported/partial status that have ideas -> feed workspace
  const improvementHypotheses = useMemo(() => {
    return (persistedHypotheses ?? [])
      .filter(h => (h.status === 'supported' || h.status === 'partial') && h.ideas?.length)
      .map(h => ({
        id: h.id,
        text: h.text,
        causeRole: h.causeRole,
        factor: h.factor,
        ideas: h.ideas ?? [],
        linkedFindingName: findingsState.findings
          .find(f => f.hypothesisId === h.id)
          ?.text?.slice(0, 60),
      }));
  }, [persistedHypotheses, findingsState.findings]);

  // Findings linked to any hypothesis with ideas
  const improvementLinkedFindings = useMemo(() => {
    const hypothesisIds = new Set(improvementHypotheses.map(h => h.id));
    return findingsState.findings
      .filter(f => f.hypothesisId && hypothesisIds.has(f.hypothesisId))
      .map(f => ({ id: f.id, text: f.text }));
  }, [improvementHypotheses, findingsState.findings]);

  // Set of selected idea IDs across all hypotheses
  const selectedIdeaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const h of persistedHypotheses ?? []) {
      for (const idea of h.ideas ?? []) {
        if (idea.selected) ids.add(idea.id);
      }
    }
    return ids;
  }, [persistedHypotheses]);

  // Projected Cpk map: finding ID -> projected Cpk from linked improvement idea
  const projectedCpkMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of persistedHypotheses ?? []) {
      const linkedFinding = findingsState.findings.find(f => f.hypothesisId === h.id);
      if (!linkedFinding) continue;
      const projectedIdea =
        (h.ideas ?? []).find(i => i.selected && i.projection?.projectedCpk != null) ??
        (h.ideas ?? []).find(i => i.projection?.projectedCpk != null);
      if (projectedIdea?.projection?.projectedCpk != null) {
        map[linkedFinding.id] = projectedIdea.projection.projectedCpk;
      }
    }
    return map;
  }, [persistedHypotheses, findingsState.findings]);

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

  // Convert all selected ideas to action items on their linked findings
  const handleConvertIdeasToActions = useCallback(() => {
    for (const h of persistedHypotheses ?? []) {
      const linkedFinding = findingsState.findings.find(f => f.hypothesisId === h.id);
      if (!linkedFinding) continue;
      for (const idea of h.ideas ?? []) {
        if (!idea.selected) continue;
        if (linkedFinding.actions?.some(a => a.ideaId === idea.id)) continue;
        findingsState.addAction(linkedFinding.id, idea.text, undefined, undefined, idea.id);
      }
    }
  }, [persistedHypotheses, findingsState]);

  // ── Improvement Popout ─────────────────────────────────────────────────
  const improvementPopoutRef = React.useRef<Window | null>(null);

  const buildImprovementSyncData = useCallback(
    (): ImprovementSyncData => ({
      synthesis: processContext?.synthesis,
      hypotheses: improvementHypotheses,
      linkedFindings: improvementLinkedFindings,
      selectedIdeaIds: Array.from(selectedIdeaIds),
      convertedIdeaIds: Array.from(convertedIdeaIds),
      targetCpk: processContext?.targetValue,
      timestamp: Date.now(),
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
            hypothesesState.selectIdea(action.hypothesisId, action.ideaId, action.selected);
            break;
          case 'update-timeframe':
            hypothesesState.updateIdea(action.hypothesisId, action.ideaId, {
              timeframe: action.timeframe,
            });
            break;
          case 'update-direction':
            hypothesesState.updateIdea(action.hypothesisId, action.ideaId, {
              direction: action.direction,
            });
            break;
          case 'update-cost':
            hypothesesState.updateIdea(action.hypothesisId, action.ideaId, {
              cost: action.cost,
            });
            break;
          case 'remove-idea':
            hypothesesState.removeIdea(action.hypothesisId, action.ideaId);
            break;
          case 'add-idea':
            hypothesesState.addIdea(action.hypothesisId, action.text);
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
  }, [processContext, setProcessContext, hypothesesState, handleConvertIdeasToActions]);

  // Synthesis text change handler
  const handleSynthesisChange = useCallback(
    (text: string) => {
      setProcessContext({ ...processContext, synthesis: text });
    },
    [processContext, setProcessContext]
  );

  return {
    improvementHypotheses,
    improvementLinkedFindings,
    selectedIdeaIds,
    projectedCpkMap,
    convertedIdeaIds,
    handleConvertIdeasToActions,
    handleOpenImprovementPopout,
    handleSynthesisChange,
  };
}
