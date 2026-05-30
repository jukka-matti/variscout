/**
 * useAnalyzeOrchestration - Hypothesis-hub orchestration for Azure Editor
 *
 * IM-1 (ADR-085): the Question entity is retired. This hook owns the
 * hypothesis-hub workflow: drives `useHypotheses` (hub CRUD from
 * @variscout/hooks), computes derived idea impacts from the hubs' re-homed
 * ideas, and provides DataContext-dependent What-If projection callbacks
 * (keyed by hypothesisId).
 */
import { useMemo, useCallback } from 'react';
import { useAnalyzeFeatureStore, buildIdeaImpacts } from './analyzeStore';
import { usePanelsStore } from '../panels/panelsStore';
import { useHypotheses, type HypothesisUpdate } from '@variscout/hooks';
import { useAnalyzeStore } from '@variscout/stores';
import type {
  Finding,
  FindingProjection,
  FindingStatus,
  IdeaImpact,
  ProcessContext,
  StatsResult,
  Hypothesis,
} from '@variscout/core';

// ── Interfaces ────────────────────────────────────────────────────────────

interface FindingsStateSlice {
  findings: Finding[];
  setFindingStatus: (id: string, status: FindingStatus) => void;
  addAction: (findingId: string, text: string) => void;
}

export interface UseAnalyzeOrchestrationOptions {
  findingsState: FindingsStateSlice;
  processContext: ProcessContext | undefined;
  stats: StatsResult | null;
}

export interface UseAnalyzeOrchestrationReturn {
  /**
   * Open What-If pre-loaded for a specific improvement idea. When inline=true,
   * sets projection target without opening full-page What-If (for left panel
   * embedding). Keyed by hypothesisId (IM-1).
   */
  handleProjectIdea: (hypothesisId: string, ideaId: string, inline?: boolean) => void;
  /** Save projection from What-If back to idea */
  handleSaveIdeaProjection: (projection: FindingProjection) => void;
  /** Clear the projection target (e.g., when closing What-If without saving) */
  clearProjectionTarget: () => void;
  /** Set finding status with automatic idea-to-action conversion */
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  /** Full hypotheses hook state — hub CRUD operations for the Investigation workspace */
  hypothesesState: {
    hubs: Hypothesis[];
    createHub: (name: string, synthesis: string) => Hypothesis;
    updateHub: (hubId: string, updates: HypothesisUpdate) => void;
    deleteHub: (hubId: string) => void;
    resetHubs: (newHubs: Hypothesis[]) => void;
    connectFinding: (hubId: string, findingId: string) => void;
    disconnectFinding: (hubId: string, findingId: string) => void;
    getHubForFinding: (findingId: string) => Hypothesis | undefined;
  };
  /** Computed idea impacts keyed by idea ID */
  ideaImpacts: Record<string, IdeaImpact | undefined>;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAnalyzeOrchestration({
  findingsState,
  processContext,
  stats,
}: UseAnalyzeOrchestrationOptions): UseAnalyzeOrchestrationReturn {
  // ── Suspected cause hubs ──────────────────────────────────────────────
  // Sync hubs to the domain store so that other components (e.g. EditorDashboardView)
  // can read them via useAnalyzeStore(s => s.hypotheses) without prop threading.
  const hypothesesState = useHypotheses({
    initialHubs: [],
    onHubsChange: useAnalyzeStore.getState().resetHubs,
  });

  // Idea actions (keyed by hypothesisId) live on the domain analyze store (IM-1 F2).
  const updateIdeaProjection = useAnalyzeStore(s => s.updateIdeaProjection);

  // ── Compute derived data ──────────────────────────────────────────────
  const ideaImpacts = useMemo(
    () => buildIdeaImpacts(hypothesesState.hubs, processContext, stats),
    [hypothesesState.hubs, processContext, stats]
  );

  // ── DataContext-dependent actions ─────────────────────────────────────

  // Open What-If pre-loaded for a specific improvement idea
  const handleProjectIdea = useCallback(
    (hypothesisId: string, ideaId: string, inline?: boolean) => {
      const hub = hypothesesState.hubs.find(h => h.id === hypothesisId);
      const idea = hub?.ideas?.find(i => i.id === ideaId);
      if (hub && idea) {
        useAnalyzeFeatureStore.getState().setProjectionTarget({
          hypothesisId,
          ideaId,
          ideaText: idea.text,
          hypothesisText: hub.name,
        });
      }
      if (!inline) {
        usePanelsStore.getState().setWhatIfOpen(true);
      }
    },
    [hypothesesState.hubs]
  );

  // Clear the projection target
  const clearProjectionTarget = useCallback(() => {
    useAnalyzeFeatureStore.getState().setProjectionTarget(null);
  }, []);

  // Save projection from What-If back to idea
  const handleSaveIdeaProjection = useCallback(
    (projection: FindingProjection) => {
      const target = useAnalyzeFeatureStore.getState().projectionTarget;
      if (target) {
        updateIdeaProjection(target.hypothesisId, target.ideaId, projection);
        useAnalyzeFeatureStore.getState().setProjectionTarget(null);
        usePanelsStore.getState().setWhatIfOpen(false);
      }
    },
    [updateIdeaProjection]
  );

  // Idea -> Action conversion: when a finding moves to 'improving', convert
  // selected ideas from the hub that owns the finding.
  const handleSetFindingStatus = useCallback(
    (id: string, status: FindingStatus) => {
      if (status === 'improving') {
        const hub = hypothesesState.hubs.find(h => h.findingIds.includes(id));
        const selectedIdeas = hub?.ideas?.filter(i => i.selected) ?? [];
        if (selectedIdeas.length > 0) {
          findingsState.setFindingStatus(id, status);
          for (const idea of selectedIdeas) {
            findingsState.addAction(id, idea.text);
          }
          return;
        }
      }
      findingsState.setFindingStatus(id, status);
    },
    [findingsState, hypothesesState.hubs]
  );

  return {
    handleProjectIdea,
    handleSaveIdeaProjection,
    clearProjectionTarget,
    handleSetFindingStatus,
    hypothesesState,
    ideaImpacts,
  };
}
