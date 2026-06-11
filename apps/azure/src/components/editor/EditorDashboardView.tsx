/**
 * EditorDashboardView — Layout composer for the Azure editor analysis view.
 *
 * Delegates rendering to three section components:
 * - PISection (left sidebar: stats, questions, journal, docs)
 * - DashboardSection (center: chart grid with narration)
 *
 * Owns only cross-section concerns:
 * - useQuestionGeneration (bestSubsets + factorRequest shared by PI + Dashboard)
 * - handleInvestigateFactor callback (creates Finding + Question + Idea bundle)
 * - FactorPreviewSection (one-time overlay on Factor Intelligence completion)
 * - DataTableModal (triggered from PI overflow)
 * - AIOnboardingTooltip
 */

import React, { useCallback, useMemo } from 'react';
import { AIOnboardingTooltip } from '@variscout/ui';
import { computeBestSubsets, categoricalFiltersToActiveFilters } from '@variscout/core';
import type { ExclusionReason, FindingStatus } from '@variscout/core';
import type { ViewState, UseFindingsReturn } from '@variscout/hooks';
import { useJourneyPhase, useFilteredData } from '@variscout/hooks';
import { isAIAvailable } from '../../services/aiService';
import { useProjectStore, useAnalysisScopeStore, usePreferencesStore } from '@variscout/stores';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import type { UseEditorDataFlowReturn } from '../../hooks/useEditorDataFlow';
import type { UseFilterNavigationReturn } from '../../hooks';
import type { AzureFindingsCallbacks, WorkspaceProjectScopeLabels } from '@variscout/ui';
import type { UseFindingsOrchestrationReturn } from '../../features/findings/useFindingsOrchestration';
import type { UseAIOrchestrationReturn } from '../../features/ai';
import type { BinnedFactorBinding } from '@variscout/core/binning';

import DataTableModal from '../data/DataTableModal';
import { PISection } from './PISection';
import { DashboardSection } from './DashboardSection';
import { FactorPreviewSection } from './FactorPreviewSection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditorDashboardViewProps {
  dataFlow: UseEditorDataFlowReturn;
  filterNav: UseFilterNavigationReturn;
  viewState: ViewState | undefined;
  onViewStateChange: (partial: Partial<ViewState>) => void;
  /** Project ID for Document Shelf scoping */
  projectId?: string;
  // Findings (from useFindingsOrchestration)
  findingsState: UseFindingsReturn;
  findingsCallbacks: AzureFindingsCallbacks;
  handlePinFinding: UseFindingsOrchestrationReturn['handlePinFinding'];
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  // AI (from useAIOrchestration)
  aiOrch: UseAIOrchestrationReturn;
  handleShareChart: (chartType: string) => void;
  /** Export CSV handler (context-line Export menu — Azure CSV-only). */
  onExportCSV?: () => void;
  // Data quality
  controlViolations: Map<number, string[]> | undefined;
  excludedRowIndices: Set<number> | undefined;
  excludedReasons: Map<number, ExclusionReason[]> | undefined;
  // Improvement projection
  projectedCpkMap: Record<string, number>;
  workspaceProjectFactorRequest?: { factor: string; seq: number } | null;
  workspaceProjectScope?: {
    title: string;
    labels: WorkspaceProjectScopeLabels;
  } | null;
  /**
   * G1 Task 4: derived categorical columns from the active ImprovementProject.
   * Merged into the factor picker list and used for Boxplot/ProbabilityPlot data extraction.
   */
  categoricalValuesByColumn?: Record<string, (string | null)[]>;
  /** G1 Task 7: existing inflection-binning bindings from the Workspace Project. */
  binnedFactorBindings?: BinnedFactorBinding[];
  /** G1 Task 7: synchronous patch handler for `binnedFactorBindings`. */
  onBindingsChange?: (next: BinnedFactorBinding[]) => void;
  /**
   * ER-2: the active scope project id (Workspace Project id, or the
   * 'general-unassigned' sentinel). Used by the factor strip to refresh an
   * existing scope's what-if number — must match the id scopes are stored
   * under (the same value AnalyzeWorkspace receives).
   */
  scopeProjectId?: string;
  onOpenWall?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EditorDashboardView: React.FC<EditorDashboardViewProps> = ({
  dataFlow,
  filterNav,
  viewState,
  onViewStateChange,
  projectId,
  findingsState,
  findingsCallbacks,
  handlePinFinding,
  handleSetFindingStatus,
  aiOrch,
  handleShareChart,
  onExportCSV,
  controlViolations,
  excludedRowIndices,
  excludedReasons,
  projectedCpkMap,
  workspaceProjectFactorRequest,
  workspaceProjectScope,
  categoricalValuesByColumn,
  binnedFactorBindings,
  onBindingsChange,
  scopeProjectId,
  onOpenWall,
}) => {
  // ── Store selectors ──────────────────────────────────────────────────────
  const factors = useProjectStore(s => s.factors);
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const aiEnabled = usePreferencesStore(s => s.aiEnabled);
  const { filteredData } = useFilteredData();

  // ── Factor Intelligence (best subsets) — shared across PISection + Dashboard.
  // IM-1: computed directly (was sourced from the retired useQuestionGeneration).
  const bestSubsets = useMemo(() => {
    if (!filteredData?.length || !outcome || factors.length === 0) return null;
    return computeBestSubsets(filteredData, outcome, factors);
  }, [filteredData, outcome, factors]);
  const effectiveFactorRequest = workspaceProjectFactorRequest ?? null;

  // ── Journey phase badge ─────────────────────────────────────────────────
  const journeyPhase = useJourneyPhase(!!rawData?.length, findingsState.findings);

  // ── AI availability ─────────────────────────────────────────────────────
  const aiAvailable = aiEnabled && isAIAvailable();

  // ── Factor Intelligence → Findings bridge ──────────────────────────────
  // IM-1 (ADR-085): the Question entity is retired. Investigating a factor now
  // records a Finding only (the analyst promotes it to a hypothesis hub on the
  // Wall). The finding captures the factor's worst level as a boxplot source.
  const handleInvestigateFactor = useCallback(
    (effect: import('@variscout/core/stats').FactorMainEffect) => {
      if (!outcome || !filteredData || filteredData.length === 0) return;

      // IM-4a: snapshot the DRILL condition (the active scope chips), not the
      // legacy row-level projectStore.filters map.
      const activeFilters = categoricalFiltersToActiveFilters(
        useAnalysisScopeStore.getState().categoricalFilters
      );
      const pct = Math.round(effect.etaSquared * 100);
      const text = `${effect.factor} explains ~${pct}% of variation (worst at ${effect.worstLevel}).`;

      const addedFinding = findingsState.addFinding(
        text,
        { activeFilters, cumulativeScope: null },
        {
          chart: 'boxplot',
          category: effect.factor,
          timeLens: usePreferencesStore.getState().timeLens,
        }
      );

      handleSetFindingStatus(addedFinding.id, 'investigating');
      usePanelsStore.getState().setFindingsOpen(true);
      useFindingsStore.getState().setHighlightedFindingId(addedFinding.id);
    },
    [outcome, filteredData, findingsState, handleSetFindingStatus]
  );

  // ── Data Table state ────────────────────────────────────────────────────
  const isDataTableOpen = usePanelsStore(s => s.isDataTableOpen);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* PI sidebar (left) — handles its own visibility + resize */}
        <PISection
          bestSubsets={bestSubsets}
          projectedCpkMap={projectedCpkMap}
          onInvestigateFactor={handleInvestigateFactor}
          phaseBadge={journeyPhase ?? undefined}
          findingsState={findingsState}
          projectId={projectId}
        />

        {/* Chart grid (center) */}
        <DashboardSection
          dataFlow={dataFlow}
          filterNav={filterNav}
          findingsState={findingsState}
          aiOrch={aiOrch}
          factorRequest={effectiveFactorRequest}
          viewState={viewState ?? undefined}
          onViewStateChange={onViewStateChange}
          findingsCallbacks={findingsCallbacks}
          onPinFinding={handlePinFinding}
          onShareChart={handleShareChart}
          onExportCSV={onExportCSV}
          onInvestigateFactor={handleInvestigateFactor}
          onOpenWall={onOpenWall}
          projectedCpkMap={projectedCpkMap}
          workspaceProjectScope={workspaceProjectScope}
          aiAvailable={aiAvailable}
          categoricalValuesByColumn={categoricalValuesByColumn}
          binnedFactorBindings={binnedFactorBindings}
          onBindingsChange={onBindingsChange}
          scopeProjectId={scopeProjectId}
        />

        {/* AI onboarding tooltip */}
        <AIOnboardingTooltip
          isAIAvailable={aiAvailable}
          anchorSelector='[data-testid="narrative-ask-button"]'
        />
      </div>

      {/* Data Table Editor Modal */}
      <DataTableModal
        isOpen={isDataTableOpen}
        onClose={() => usePanelsStore.getState().closeDataTable()}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
        controlViolations={controlViolations}
      />

      {/* Factor Preview overlay — shown once when Factor Intelligence first completes */}
      <FactorPreviewSection bestSubsets={bestSubsets} />
    </>
  );
};
