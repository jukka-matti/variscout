/**
 * useEditorInvestigation - Investigation/hypothesis wiring logic extracted from Editor.tsx
 *
 * Contains hypothesis-related callbacks, idea impact calculations,
 * projection target management, and idea-to-action conversion logic.
 */
import { useMemo, useState, useCallback } from 'react';
import { computeIdeaImpact } from '@variscout/core';
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

export interface UseEditorInvestigationOptions {
  hypothesesState: UseHypothesesReturn;
  findingsState: FindingsStateSlice;
  processContext: ProcessContext | undefined;
  stats: StatsResult | null;
  panels: {
    setIsWhatIfOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  };
}

export interface ProjectionTarget {
  hypothesisId: string;
  ideaId: string;
  ideaText: string;
  hypothesisText: string;
}

export interface UseEditorInvestigationReturn {
  /** Map of hypothesis ID to display info for FindingCard */
  hypothesesMap: Record<
    string,
    {
      text: string;
      status: string;
      factor?: string;
      level?: string;
      causeRole?: 'primary' | 'contributing';
    }
  >;
  /** Create hypothesis and link to finding */
  handleCreateHypothesis: (
    findingId: string,
    text: string,
    factor?: string,
    level?: string
  ) => void;
  /** Computed idea impacts for all hypotheses */
  ideaImpacts: Record<string, ReturnType<typeof computeIdeaImpact>>;
  /** Current projection target for What-If round-trip */
  projectionTarget: ProjectionTarget | null;
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

export function useEditorInvestigation({
  hypothesesState,
  findingsState,
  processContext,
  stats,
  panels,
}: UseEditorInvestigationOptions): UseEditorInvestigationReturn {
  // Build hypothesesMap for FindingCard display
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

  // Hypothesis creation from finding cards (creates hypothesis + links to finding)
  const handleCreateHypothesis = useCallback(
    (findingId: string, text: string, factor?: string, level?: string) => {
      const hypothesis = hypothesesState.addHypothesis(text, factor, level);
      hypothesesState.linkFinding(hypothesis.id, findingId);
      findingsState.linkHypothesis(findingId, hypothesis.id);
    },
    [hypothesesState, findingsState]
  );

  // Compute idea impacts for all hypotheses (memoized)
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

  // Projection target state for Idea->What-If round-trip
  const [projectionTarget, setProjectionTarget] = useState<ProjectionTarget | null>(null);

  // Open What-If pre-loaded for a specific improvement idea
  const handleProjectIdea = useCallback(
    (hypothesisId: string, ideaId: string) => {
      const hypothesis = hypothesesState.getHypothesis(hypothesisId);
      const idea = hypothesis?.ideas?.find(i => i.id === ideaId);
      if (hypothesis && idea) {
        setProjectionTarget({
          hypothesisId,
          ideaId,
          ideaText: idea.text,
          hypothesisText: hypothesis.text,
        });
      }
      panels.setIsWhatIfOpen(true);
    },
    [panels, hypothesesState]
  );

  // Clear the projection target (e.g., when closing What-If without saving)
  const clearProjectionTarget = useCallback(() => {
    setProjectionTarget(null);
  }, []);

  // Save projection from What-If back to idea
  const handleSaveIdeaProjection = useCallback(
    (projection: FindingProjection) => {
      if (projectionTarget) {
        hypothesesState.setIdeaProjection(
          projectionTarget.hypothesisId,
          projectionTarget.ideaId,
          projection
        );
        setProjectionTarget(null);
        panels.setIsWhatIfOpen(false);
      }
    },
    [projectionTarget, hypothesesState, panels]
  );

  // Idea -> Action conversion: when a finding moves to 'improving', convert selected ideas to actions
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
    hypothesesMap,
    handleCreateHypothesis,
    ideaImpacts,
    projectionTarget,
    handleProjectIdea,
    handleSaveIdeaProjection,
    clearProjectionTarget,
    handleSetFindingStatus,
  };
}
