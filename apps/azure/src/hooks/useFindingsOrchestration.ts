/**
 * useFindingsOrchestration - Centralized findings orchestration for Azure Editor
 *
 * Extracts ~150 lines of findings handlers, popout sync, and chart grouping
 * from Editor.tsx into a testable hook.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useFindings,
  useDrillPath,
  buildFindingContext,
  buildFindingSource,
} from '@variscout/hooks';
import type { UseFilterNavigationReturn } from './useFilterNavigation';
import type { FindingsCallbacks } from '../types/findingsCallbacks';
import type {
  Finding,
  FindingSource,
  SpecLimits,
  DataRow,
  Hypothesis,
  ProcessContext,
} from '@variscout/core';
import type { ViewState } from '@variscout/hooks';
import {
  openFindingsPopout,
  updateFindingsPopout,
  FINDINGS_ACTION_KEY,
  type FindingsAction,
} from '@variscout/ui';

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
  /** Panel toggle for findings sidebar */
  setIsFindingsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
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
}

export interface UseFindingsOrchestrationReturn {
  /** The underlying findings state from useFindings */
  findingsState: ReturnType<typeof useFindings>;
  /** Highlighted finding ID for scroll-to animation */
  highlightedFindingId: string | null;
  /** Set highlighted finding ID */
  setHighlightedFindingId: (id: string | null) => void;
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
  /** Chart findings grouped by chart type */
  chartFindings: { boxplot: Finding[]; pareto: Finding[]; ichart: Finding[] };
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
  setIsFindingsOpen,
  shareFinding,
  canMentionInChannel,
  onViewStateChange,
  hypotheses,
  processContext,
  currentValue,
  projectedValue,
  factorRoles,
  aiAvailable,
}: UseFindingsOrchestrationOptions): UseFindingsOrchestrationReturn {
  // Core findings state
  const findingsState = useFindings({
    initialFindings: persistedFindings,
    onFindingsChange: setPersistedFindings,
  });

  // Drill path for context building
  const { drillPath } = useDrillPath(rawData, filterNav.filterStack, outcome, specs);

  // Highlighted finding (for scroll-to animation)
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedFindingId]);

  // Pin current filter state
  const handlePinFinding = useCallback(
    (noteText?: string) => {
      const existing = findingsState.findDuplicate(filters);
      if (existing) {
        setIsFindingsOpen(true);
        setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding(noteText || '', context);
      setIsFindingsOpen(true);
      setHighlightedFindingId(newFinding.id);
    },
    [filters, drillPath, filteredData, outcome, specs, findingsState, setIsFindingsOpen]
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
        setIsFindingsOpen(true);
        setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding(noteText ?? '', context, source);
      setIsFindingsOpen(true);
      setHighlightedFindingId(newFinding.id);
      return newFinding;
    },
    [filters, drillPath, filteredData, outcome, specs, findingsState, setIsFindingsOpen]
  );

  // Chart findings grouped by type
  const chartFindings = useMemo(
    () => ({
      boxplot: findingsState.getChartFindings('boxplot'),
      pareto: findingsState.getChartFindings('pareto'),
      ichart: findingsState.getChartFindings('ichart'),
    }),
    [findingsState]
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

  // Popout window management
  const popupRef = useRef<Window | null>(null);

  const popoutOptions = useMemo(
    () => ({ hypotheses, processContext, currentValue, projectedValue, factorRoles, aiAvailable }),
    [hypotheses, processContext, currentValue, projectedValue, factorRoles, aiAvailable]
  );

  const handleOpenFindingsPopout = useCallback(() => {
    popupRef.current = openFindingsPopout(
      findingsState.findings,
      columnAliases,
      drillPath,
      popoutOptions
    );
  }, [findingsState.findings, columnAliases, drillPath, popoutOptions]);

  // Sync popout when findings/drillPath change
  useEffect(() => {
    if (!popupRef.current || popupRef.current.closed) return;
    updateFindingsPopout(findingsState.findings, columnAliases, drillPath, popoutOptions);
  }, [findingsState.findings, columnAliases, drillPath, popoutOptions]);

  // Listen for actions from popout window
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== FINDINGS_ACTION_KEY || !e.newValue) return;
      try {
        const action = JSON.parse(e.newValue) as FindingsAction;
        switch (action.type) {
          case 'edit':
            if (action.text !== undefined) findingsState.editFinding(action.id, action.text);
            break;
          case 'delete':
            findingsState.deleteFinding(action.id);
            break;
          case 'set-status':
            if (action.status) findingsState.setFindingStatus(action.id, action.status);
            break;
          case 'set-tag':
            findingsState.setFindingTag(action.id, action.tag ?? null);
            break;
          case 'add-comment':
            if (action.text !== undefined) findingsState.addFindingComment(action.id, action.text);
            break;
          case 'edit-comment':
            if (action.commentId && action.text !== undefined)
              findingsState.editFindingComment(action.id, action.commentId, action.text);
            break;
          case 'delete-comment':
            if (action.commentId) findingsState.deleteFindingComment(action.id, action.commentId);
            break;
        }
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [findingsState]);

  return {
    findingsState,
    highlightedFindingId,
    setHighlightedFindingId,
    handlePinFinding,
    handleRestoreFinding,
    handleAddChartObservation,
    chartFindings,
    findingsCallbacks,
    handleOpenFindingsPopout,
    handleNavigateToChart,
    handleShareFinding,
    drillPath,
  };
}
