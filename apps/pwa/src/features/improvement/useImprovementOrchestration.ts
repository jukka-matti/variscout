/**
 * useImprovementOrchestration - Improvement workspace orchestration for PWA
 *
 * Simplified version of Azure's orchestration (no popout sync, no Teams).
 * Filters hypotheses with ideas, computes selected idea IDs, projected Cpk map,
 * and syncs to Zustand improvementStore.
 */
import { useMemo, useCallback, useEffect } from 'react';
import type { Finding } from '@variscout/core';
import type { UseHypothesesReturn } from '@variscout/hooks';
import { useImprovementStore, type ImprovementHypothesis } from './improvementStore';

export type { ImprovementHypothesis };

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
  hypothesesState: UseHypothesesReturn;
  findingsState: FindingsStateSlice;
}

export interface UseImprovementOrchestrationReturn {
  /** Convert selected ideas to action items on their linked findings */
  handleConvertIdeasToActions: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useImprovementOrchestration({
  hypothesesState,
  findingsState,
}: UseImprovementOrchestrationOptions): UseImprovementOrchestrationReturn {
  // ── Compute improvement data ────────────────────────────────────────

  const improvementHypotheses = useMemo((): ImprovementHypothesis[] => {
    return hypothesesState.hypotheses
      .filter(
        h => (h.status === 'supported' || h.status === 'partial') && h.ideas && h.ideas.length > 0
      )
      .map(h => {
        const linkedFinding = findingsState.findings.find(f => h.linkedFindingIds.includes(f.id));
        return {
          id: h.id,
          text: h.text,
          causeRole: h.causeRole,
          factor: h.factor,
          ideas: h.ideas ?? [],
          linkedFindingName: linkedFinding?.text,
        };
      });
  }, [hypothesesState.hypotheses, findingsState.findings]);

  const improvementLinkedFindings = useMemo(() => {
    const findingIds = new Set<string>();
    for (const h of hypothesesState.hypotheses) {
      if (h.ideas && h.ideas.length > 0) {
        for (const fid of h.linkedFindingIds) {
          findingIds.add(fid);
        }
      }
    }
    return findingsState.findings
      .filter(f => findingIds.has(f.id))
      .map(f => ({ id: f.id, text: f.text }));
  }, [hypothesesState.hypotheses, findingsState.findings]);

  const selectedIdeaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const h of improvementHypotheses) {
      for (const idea of h.ideas) {
        if (idea.selected) ids.add(idea.id);
      }
    }
    return ids;
  }, [improvementHypotheses]);

  const projectedCpkMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of hypothesesState.hypotheses) {
      if (!h.ideas || h.ideas.length === 0) continue;
      const linkedFinding = findingsState.findings.find(f => h.linkedFindingIds.includes(f.id));
      if (!linkedFinding) continue;
      const selectedWithProjection = h.ideas.find(
        i => i.selected && i.projection?.projectedCpk != null
      );
      const anyWithProjection = h.ideas.find(i => i.projection?.projectedCpk != null);
      const best = selectedWithProjection ?? anyWithProjection;
      if (best?.projection?.projectedCpk != null) {
        map[linkedFinding.id] = best.projection.projectedCpk;
      }
    }
    return map;
  }, [hypothesesState.hypotheses, findingsState.findings]);

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
    useImprovementStore.getState().syncState({
      improvementHypotheses,
      improvementLinkedFindings,
      selectedIdeaIds,
      projectedCpkMap,
      convertedIdeaIds,
    });
  }, [
    improvementHypotheses,
    improvementLinkedFindings,
    selectedIdeaIds,
    projectedCpkMap,
    convertedIdeaIds,
  ]);

  // ── Actions ────────────────────────────────────────────────────────

  const handleConvertIdeasToActions = useCallback(() => {
    for (const h of hypothesesState.hypotheses) {
      if (!h.ideas || h.ideas.length === 0) continue;
      const linkedFinding = findingsState.findings.find(f => h.linkedFindingIds.includes(f.id));
      if (!linkedFinding) continue;

      for (const idea of h.ideas) {
        if (idea.selected && !convertedIdeaIds.has(idea.id)) {
          findingsState.addAction(linkedFinding.id, idea.text, undefined, undefined, idea.id);
        }
      }
    }
  }, [hypothesesState.hypotheses, findingsState, convertedIdeaIds]);

  return {
    handleConvertIdeasToActions,
  };
}
