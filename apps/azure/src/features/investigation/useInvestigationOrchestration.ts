/**
 * useInvestigationOrchestration - Investigation/hypothesis orchestration for Azure Editor
 *
 * Owns the investigation workflow: calls useHypotheses (CRUD engine from @variscout/hooks),
 * syncs computed state (hypothesesMap, ideaImpacts) to the Zustand investigationStore
 * for selector-based reads, and provides DataContext-dependent action callbacks.
 */
import { useMemo, useCallback, useEffect } from 'react';
import { computeIdeaImpact } from '@variscout/core';
import { usePanelsStore } from '../panels/panelsStore';
import { useInvestigationStore } from './investigationStore';
import type {
  Finding,
  FindingProjection,
  FindingStatus,
  ProcessContext,
  StatsResult,
} from '@variscout/core';
import type { UseHypothesesReturn } from '@variscout/hooks';

// ── Interfaces ────────────────────────────────────────────────────────────

interface FindingsStateSlice {
  findings: Finding[];
  linkHypothesis: (findingId: string, hypothesisId: string) => void;
  setFindingStatus: (id: string, status: FindingStatus) => void;
  addAction: (findingId: string, text: string) => void;
}

export interface UseInvestigationOrchestrationOptions {
  hypothesesState: UseHypothesesReturn;
  findingsState: FindingsStateSlice;
  processContext: ProcessContext | undefined;
  stats: StatsResult | null;
}

export interface UseInvestigationOrchestrationReturn {
  /** Create hypothesis and link to finding */
  handleCreateHypothesis: (
    findingId: string,
    text: string,
    factor?: string,
    level?: string
  ) => void;
  /** Open What-If pre-loaded for a specific improvement idea */
  handleProjectIdea: (hypothesisId: string, ideaId: string) => void;
  /** Save projection from What-If back to idea */
  handleSaveIdeaProjection: (projection: FindingProjection) => void;
  /** Clear the projection target (e.g., when closing What-If without saving) */
  clearProjectionTarget: () => void;
  /** Set finding status with automatic idea-to-action conversion */
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useInvestigationOrchestration({
  hypothesesState,
  findingsState,
  processContext,
  stats,
}: UseInvestigationOrchestrationOptions): UseInvestigationOrchestrationReturn {
  // ── Sync hypotheses to Zustand store ──────────────────────────────────
  const syncHypotheses = useInvestigationStore.getState().syncHypotheses;
  useEffect(() => {
    syncHypotheses(hypothesesState.hypotheses);
  }, [hypothesesState.hypotheses, syncHypotheses]);

  // ── Sync hypothesesMap to store ───────────────────────────────────────
  const hypothesesMap = useMemo(() => {
    const map: Record<
      string,
      {
        text: string;
        status: string;
        factor?: string;
        level?: string;
        causeRole?: 'primary' | 'contributing';
      }
    > = {};
    for (const h of hypothesesState.hypotheses) {
      map[h.id] = {
        text: h.text,
        status: h.status,
        factor: h.factor,
        level: h.level,
        causeRole: h.causeRole,
      };
    }
    return map;
  }, [hypothesesState.hypotheses]);

  const syncHypothesesMap = useInvestigationStore.getState().syncHypothesesMap;
  useEffect(() => {
    syncHypothesesMap(hypothesesMap);
  }, [hypothesesMap, syncHypothesesMap]);

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

    for (const h of hypothesesState.hypotheses) {
      if (h.ideas) {
        for (const idea of h.ideas) {
          impacts[idea.id] = computeIdeaImpact(idea, target, currentStats);
        }
      }
    }
    return impacts;
  }, [hypothesesState.hypotheses, processContext, stats]);

  const syncIdeaImpacts = useInvestigationStore.getState().syncIdeaImpacts;
  useEffect(() => {
    syncIdeaImpacts(ideaImpacts);
  }, [ideaImpacts, syncIdeaImpacts]);

  // ── DataContext-dependent actions ─────────────────────────────────────

  // Hypothesis creation from finding cards
  const handleCreateHypothesis = useCallback(
    (findingId: string, text: string, factor?: string, level?: string) => {
      const hypothesis = hypothesesState.addHypothesis(text, factor, level);
      hypothesesState.linkFinding(hypothesis.id, findingId);
      findingsState.linkHypothesis(findingId, hypothesis.id);
    },
    [hypothesesState, findingsState]
  );

  // Open What-If pre-loaded for a specific improvement idea
  const handleProjectIdea = useCallback(
    (hypothesisId: string, ideaId: string) => {
      const hypothesis = hypothesesState.getHypothesis(hypothesisId);
      const idea = hypothesis?.ideas?.find(i => i.id === ideaId);
      if (hypothesis && idea) {
        useInvestigationStore.getState().setProjectionTarget({
          hypothesisId,
          ideaId,
          ideaText: idea.text,
          hypothesisText: hypothesis.text,
        });
      }
      usePanelsStore.getState().setWhatIfOpen(true);
    },
    [hypothesesState]
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
        hypothesesState.setIdeaProjection(target.hypothesisId, target.ideaId, projection);
        useInvestigationStore.getState().setProjectionTarget(null);
        usePanelsStore.getState().setWhatIfOpen(false);
      }
    },
    [hypothesesState]
  );

  // Idea -> Action conversion: when a finding moves to 'improving', convert selected ideas
  const handleSetFindingStatus = useCallback(
    (id: string, status: FindingStatus) => {
      if (status === 'improving') {
        const finding = findingsState.findings.find(f => f.id === id);
        if (finding?.hypothesisId) {
          const hypothesis = hypothesesState.getHypothesis(finding.hypothesisId);
          const selectedIdeas = hypothesis?.ideas?.filter(i => i.selected) ?? [];
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
    [findingsState, hypothesesState]
  );

  return {
    handleCreateHypothesis,
    handleProjectIdea,
    handleSaveIdeaProjection,
    clearProjectionTarget,
    handleSetFindingStatus,
  };
}
