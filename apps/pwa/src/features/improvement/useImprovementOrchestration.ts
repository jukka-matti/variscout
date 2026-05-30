/**
 * useImprovementOrchestration - Improvement workspace orchestration for PWA
 *
 * Simplified version of Azure's orchestration (no popout sync, no Teams).
 * Filters hypothesis hubs with ideas, computes selected idea IDs, projected Cpk
 * map, and returns them directly from the hook (no sync to Zustand store).
 *
 * IM-1 (ADR-085): operates on `Hypothesis` hubs (the suspected causes, carrying
 * re-homed `ideas`); findings link to a hub via `Hypothesis.findingIds`.
 */
import { useMemo, useCallback } from 'react';
import type { Finding, Hypothesis } from '@variscout/core';
import type { ImprovementHypothesis } from './improvementStore';

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
  /** Hypothesis hubs (the suspected causes) carrying re-homed ideas */
  hypotheses: Hypothesis[];
  findingsState: FindingsStateSlice;
}

export interface UseImprovementOrchestrationReturn {
  /** Convert selected ideas to action items on their linked findings */
  handleConvertIdeasToActions: () => void;
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
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Find the finding linked to a hypothesis (first of its findingIds present). */
function findLinkedFinding(hub: Hypothesis, findings: Finding[]): Finding | undefined {
  return findings.find(f => hub.findingIds.includes(f.id));
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useImprovementOrchestration({
  hypotheses,
  findingsState,
}: UseImprovementOrchestrationOptions): UseImprovementOrchestrationReturn {
  // ── Compute improvement data ────────────────────────────────────────

  const improvementHypotheses = useMemo((): ImprovementHypothesis[] => {
    return hypotheses
      .filter(h => h.ideas && h.ideas.length > 0)
      .map(h => ({
        id: h.id,
        text: h.name,
        status: h.status,
        ideas: h.ideas ?? [],
        linkedFindingName: findLinkedFinding(h, findingsState.findings)?.text,
      }));
  }, [hypotheses, findingsState.findings]);

  const improvementLinkedFindings = useMemo(() => {
    const liveHubIds = new Set(improvementHypotheses.map(h => h.id));
    const findingIds = new Set(
      hypotheses.filter(h => liveHubIds.has(h.id)).flatMap(h => h.findingIds)
    );
    return findingsState.findings
      .filter(f => findingIds.has(f.id))
      .map(f => ({ id: f.id, text: f.text }));
  }, [improvementHypotheses, hypotheses, findingsState.findings]);

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
    for (const h of hypotheses) {
      if (!h.ideas || h.ideas.length === 0) continue;
      const linkedFinding = findLinkedFinding(h, findingsState.findings);
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
  }, [hypotheses, findingsState.findings]);

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

  // ── Actions ────────────────────────────────────────────────────────

  const handleConvertIdeasToActions = useCallback(() => {
    for (const h of hypotheses) {
      if (!h.ideas || h.ideas.length === 0) continue;
      const linkedFinding = findLinkedFinding(h, findingsState.findings);
      if (!linkedFinding) continue;

      for (const idea of h.ideas) {
        if (idea.selected && !convertedIdeaIds.has(idea.id)) {
          findingsState.addAction(linkedFinding.id, idea.text, undefined, undefined, idea.id);
        }
      }
    }
  }, [hypotheses, findingsState, convertedIdeaIds]);

  return {
    handleConvertIdeasToActions,
    improvementHypotheses,
    improvementLinkedFindings,
    selectedIdeaIds,
    projectedCpkMap,
    convertedIdeaIds,
  };
}
