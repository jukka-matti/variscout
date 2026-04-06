/**
 * DashboardSection — Chart grid section for the Azure editor.
 *
 * Wraps the Dashboard component and wires it to app-level state from stores
 * and passed-in props. Reads UI state from panelsStore (highlightedChartPoint,
 * highlightedFactor).
 *
 * Props it reads from stores:
 * - panelsStore: highlightedChartPoint, highlightedFactor
 * - useIsMobile for phone detection
 */

import React from 'react';
import Dashboard from '../Dashboard';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import { usePanelsStore } from '../../features/panels/panelsStore';
import type { UseEditorDataFlowReturn } from '../../hooks/useEditorDataFlow';
import type { UseFilterNavigationReturn } from '../../hooks';
import type { UseQuestionsReturn, UseFindingsReturn } from '@variscout/hooks';
import type { UseAIOrchestrationReturn } from '../../features/ai';
import type { AzureFindingsCallbacks } from '@variscout/ui';
import type { ViewState } from '@variscout/hooks';
import type { FactorMainEffect } from '@variscout/core/stats';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DashboardSectionProps {
  /** Data flow state — provides drill-from-performance, open factor manager */
  dataFlow: UseEditorDataFlowReturn;
  /** Filter navigation state — breadcrumb chips, drill-down */
  filterNav: UseFilterNavigationReturn;
  /** Questions state — for any question-triggered chart navigation */
  questionsState: UseQuestionsReturn;
  /** Findings state — for chart annotation/observation creation */
  findingsState: UseFindingsReturn;
  /** AI orchestration — narration, CoScout integration, chart insights */
  aiOrch: UseAIOrchestrationReturn;
  /** Factor switch request from question click — sets boxplot + pareto factor */
  factorRequest: { factor: string; seq: number } | null;

  /** Persisted view state for Dashboard (focused chart, active tab, etc.) */
  viewState?: ViewState;
  /** Called when Dashboard view state changes (for persistence) */
  onViewStateChange?: (partial: Partial<ViewState>) => void;
  /** Findings callbacks for chart annotations (add/edit/delete observations) */
  findingsCallbacks?: AzureFindingsCallbacks;
  /** Handler for pinning a finding from the dashboard */
  onPinFinding?: (noteText?: string) => void;
  /** Handler for sharing a chart */
  onShareChart?: (chartType: string) => void;
  /** Handler for clicking "Investigate" on a Factor Intelligence factor */
  onInvestigateFactor?: (effect: FactorMainEffect) => void;
  /** Projected Cpk map from improvement workspace */
  projectedCpkMap?: Record<string, number>;
  /** Whether AI is available and enabled */
  aiAvailable?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  dataFlow,
  filterNav,
  questionsState: _questionsState,
  findingsState,
  aiOrch,
  factorRequest,
  viewState,
  onViewStateChange,
  findingsCallbacks,
  onPinFinding,
  onShareChart,
  onInvestigateFactor,
  projectedCpkMap,
  aiAvailable = false,
}) => {
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const highlightedChartPoint = usePanelsStore(s => s.highlightedChartPoint);

  const { narration, fetchChartInsight, handleNarrativeAsk, handleAskCoScoutFromCategory } = aiOrch;

  return (
    <Dashboard
      projectedCpkMap={projectedCpkMap}
      onPointClick={isPhone ? undefined : usePanelsStore.getState().handlePointClick}
      highlightedPointIndex={isPhone ? undefined : highlightedChartPoint}
      filterNav={filterNav}
      initialViewState={viewState}
      onViewStateChange={onViewStateChange}
      onManageFactors={dataFlow.openFactorManager}
      requestedFactor={factorRequest}
      onPinFinding={onPinFinding}
      onShareChart={onShareChart}
      findingsCallbacks={findingsCallbacks}
      findings={findingsState.findings}
      onInvestigateFactor={onInvestigateFactor}
      performance={{
        drillFromPerformance: dataFlow.drillFromPerformance,
        onBackToPerformance: dataFlow.handleBackToPerformance,
        onDrillToMeasure: dataFlow.handleDrillToMeasure,
      }}
      ai={{
        fetchChartInsight: fetchChartInsight,
        aiContext: aiOrch.aiContext.context,
        aiEnabled: aiAvailable,
        narrative: narration.narrative,
        narrativeLoading: narration.isLoading,
        narrativeCached: narration.isCached,
        narrativeError: narration.error,
        onNarrativeRetry: narration.refresh,
        onNarrativeAsk: handleNarrativeAsk,
        onAskCoScoutFromCategory: handleAskCoScoutFromCategory,
      }}
    />
  );
};
