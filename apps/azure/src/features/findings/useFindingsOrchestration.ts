/**
 * useFindingsOrchestration - Centralized findings orchestration for Azure Editor
 *
 * Owns the useFindings hook (CRUD engine from @variscout/hooks) and syncs
 * its state to the Zustand findingsStore for selector-based reads.
 * DataContext-dependent actions (pin, restore, chart observation) remain
 * as hook return values since they need filter/data context.
 */

import { useMemo, useCallback, useEffect } from 'react';
import {
  useFindings,
  useDrillPath,
  buildFindingContext,
  buildFindingSource,
} from '@variscout/hooks';
import { usePanelsStore } from '../panels/panelsStore';
import { useFindingsStore } from './findingsStore';
import { useStatusUpdateCards } from '../../hooks/useStatusUpdateCards';
import { usePopoutSync } from './usePopoutSync';
import type { UseFilterNavigationReturn } from '../../hooks/useFilterNavigation';
import type { FindingsCallbacks } from '../../types/findingsCallbacks';
import type {
  Finding,
  FindingSource,
  SpecLimits,
  DataRow,
  Hypothesis,
  ProcessContext,
} from '@variscout/core';
import type { ViewState } from '@variscout/hooks';

export interface UseFindingsOrchestrationOptions {
  /** Persisted findings from DataContext */
  persistedFindings: Finding[];
  /** Callback to persist findings changes */
  setPersistedFindings: (findings: Finding[]) => void;
  /** Current active filters */
  filters: Record<string, (string | number)[]>;
  /** Current filtered dataset */
  filteredData: DataRow[];
  /** Current outcome column */
  outcome: string | null;
  /** Current spec limits */
  specs: SpecLimits | undefined;
  /** Raw unfiltered data */
  rawData: DataRow[];
  /** Column display aliases */
  columnAliases: Record<string, string>;
  /** Filter navigation state */
  filterNav: UseFilterNavigationReturn;
  /** Callback to set filters (for restoring a finding's filter state) */
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  /** Share finding callback */
  shareFinding: (finding: Finding, assignee?: Finding['assignee']) => Promise<boolean>;
  /** Whether channel @mentions are available */
  canMentionInChannel: boolean;
  /** View state change handler (for navigate-to-chart) */
  onViewStateChange: (partial: Partial<ViewState>) => void;
  /** Hypotheses for popout sync */
  hypotheses?: Hypothesis[];
  /** Process context for popout sync */
  processContext?: ProcessContext;
  /** Current Cpk or mean value for popout sync */
  currentValue?: number;
  /** Projected metric value from selected improvement ideas */
  projectedValue?: number;
  /** Factor role classifications for sidebar */
  factorRoles?: Record<string, string>;
  /** Whether AI features are available */
  aiAvailable?: boolean;
  /** Notification callback for status update card feedback */
  addNotification?: (message: string, type: 'success' | 'error') => void;
  /** Current project name for deep link construction */
  projectName?: string;
}

export interface UseFindingsOrchestrationReturn {
  /** The underlying findings state from useFindings */
  findingsState: ReturnType<typeof useFindings>;
  /** Pin current filter state as a finding */
  handlePinFinding: (noteText?: string) => void;
  /** Restore a finding's filter state to the dashboard */
  handleRestoreFinding: (id: string) => void;
  /** Create a chart observation (Finding with source metadata) */
  handleAddChartObservation: (
    chartType: 'boxplot' | 'pareto' | 'ichart',
    categoryKey?: string,
    noteText?: string,
    anchorX?: number,
    anchorY?: number
  ) => Finding | void;
  /** Pre-built findings callbacks for Dashboard */
  findingsCallbacks: FindingsCallbacks;
  /** Open findings in a popout window */
  handleOpenFindingsPopout: () => void;
  /** Navigate to chart from finding source badge */
  handleNavigateToChart: (source: FindingSource) => void;
  /** Share a finding by ID */
  handleShareFinding: (findingId: string) => Promise<void>;
  /** Drill path for findings context */
  drillPath: ReturnType<typeof useDrillPath>['drillPath'];
}

export function useFindingsOrchestration({
  persistedFindings,
  setPersistedFindings,
  filters,
  filteredData,
  outcome,
  specs,
  rawData,
  columnAliases,
  filterNav,
  setFilters,
  shareFinding,
  canMentionInChannel,
  onViewStateChange,
  hypotheses,
  processContext,
  currentValue,
  projectedValue,
  factorRoles,
  aiAvailable,
  addNotification,
  projectName,
}: UseFindingsOrchestrationOptions): UseFindingsOrchestrationReturn {
  // Status update cards (Teams channel integration)
  const { onStatusChanged } = useStatusUpdateCards({
    hypotheses,
    addNotification,
    projectName,
  });

  // Core findings state (CRUD engine from @variscout/hooks)
  const findingsState = useFindings({
    initialFindings: persistedFindings,
    onFindingsChange: setPersistedFindings,
    onStatusChange: onStatusChanged,
  });

  // Drill path for context building
  const { drillPath } = useDrillPath(rawData, filterNav.filterStack, outcome, specs);

  // ── Sync findings to Zustand store ──────────────────────────────────────
  const syncFindings = useFindingsStore.getState().syncFindings;
  useEffect(() => {
    syncFindings(findingsState.findings);
  }, [findingsState.findings, syncFindings]);

  // ── Highlight auto-clear (3s) ──────────────────────────────────────────
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const setHighlightedFindingId = useFindingsStore.getState().setHighlightedFindingId;

  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedFindingId, setHighlightedFindingId]);

  // ── Chart findings from store ──────────────────────────────────────────
  const chartFindings = useFindingsStore(s => s.chartFindings);

  // ── DataContext-dependent actions ──────────────────────────────────────

  // Pin current filter state
  const handlePinFinding = useCallback(
    (noteText?: string) => {
      const existing = findingsState.findDuplicate(filters);
      if (existing) {
        usePanelsStore.getState().setFindingsOpen(true);
        useFindingsStore.getState().setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding(noteText || '', context);
      usePanelsStore.getState().setFindingsOpen(true);
      useFindingsStore.getState().setHighlightedFindingId(newFinding.id);
    },
    [filters, drillPath, filteredData, outcome, specs, findingsState]
  );

  // Restore a finding's filters
  const handleRestoreFinding = useCallback(
    (id: string) => {
      const ctx = findingsState.getFindingContext(id);
      if (!ctx) return;
      setFilters(ctx.activeFilters);
    },
    [findingsState, setFilters]
  );

  // Chart observation: Finding with source metadata
  const handleAddChartObservation = useCallback(
    (
      chartType: 'boxplot' | 'pareto' | 'ichart',
      categoryKey?: string,
      noteText?: string,
      anchorX?: number,
      anchorY?: number
    ) => {
      const source = buildFindingSource(chartType, categoryKey, anchorX, anchorY);
      const existing = findingsState.findDuplicateSource(source);
      if (existing) {
        usePanelsStore.getState().setFindingsOpen(true);
        useFindingsStore.getState().setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding(noteText ?? '', context, source);
      usePanelsStore.getState().setFindingsOpen(true);
      useFindingsStore.getState().setHighlightedFindingId(newFinding.id);
      return newFinding;
    },
    [filters, drillPath, filteredData, outcome, specs, findingsState]
  );

  // Navigate to chart from finding source
  const handleNavigateToChart = useCallback(
    (source: FindingSource) => {
      onViewStateChange({ focusedChart: source.chart });
    },
    [onViewStateChange]
  );

  // Share a finding by ID
  const handleShareFinding = useCallback(
    async (findingId: string) => {
      const finding = findingsState.findings.find(f => f.id === findingId);
      if (!finding) return;
      await shareFinding(finding, finding.assignee);
    },
    [findingsState.findings, shareFinding]
  );

  // Pre-built callbacks for Dashboard
  const findingsCallbacks = useMemo<FindingsCallbacks>(
    () => ({
      onAddChartObservation: handleAddChartObservation,
      chartFindings,
      onEditFinding: findingsState.editFinding,
      onDeleteFinding: findingsState.deleteFinding,
      canMentionInChannel,
      onShareFinding: shareFinding,
      onSetFindingAssignee: findingsState.setFindingAssignee,
    }),
    [handleAddChartObservation, chartFindings, findingsState, canMentionInChannel, shareFinding]
  );

  // ── Popout window management (extracted hook) ──────────────────────────
  const { handleOpenFindingsPopout } = usePopoutSync({
    findings: findingsState.findings,
    columnAliases,
    drillPath,
    findingsState,
    hypotheses,
    processContext,
    currentValue,
    projectedValue,
    factorRoles,
    aiAvailable,
  });

  return {
    findingsState,
    handlePinFinding,
    handleRestoreFinding,
    handleAddChartObservation,
    findingsCallbacks,
    handleOpenFindingsPopout,
    handleNavigateToChart,
    handleShareFinding,
    drillPath,
  };
}
