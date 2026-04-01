/**
 * useFindingsOrchestration - Findings orchestration for PWA
 *
 * Simplified version of Azure's orchestration (no Teams, no popout sync,
 * no photo comments). Owns useFindings CRUD engine, syncs to findingsStore,
 * and provides pin/restore/observation callbacks.
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useFindings, buildFindingContext, buildFindingSource } from '@variscout/hooks';
import type { DrillStep } from '@variscout/hooks';
import { useFindingsStore } from './findingsStore';
import { usePanelsStore } from '../panels/panelsStore';
import type { Finding, SpecLimits, DataRow } from '@variscout/core';
import type { FindingsCallbacks } from '@variscout/ui';

export interface UseFindingsOrchestrationOptions {
  persistedFindings: Finding[];
  setPersistedFindings: (findings: Finding[]) => void;
  filters: Record<string, (string | number)[]>;
  filteredData: DataRow[];
  outcome: string | null;
  specs: SpecLimits;
  drillPath: DrillStep[];
}

export interface UseFindingsOrchestrationReturn {
  findingsState: ReturnType<typeof useFindings>;
  findingsCallbacks: FindingsCallbacks;
  handlePinFinding: (noteText?: string) => void;
  handleRestoreFinding: (id: string) => void;
  handleSetFindingStatus: (id: string, status: import('@variscout/core').FindingStatus) => void;
  highlightedFindingId: string | null;
  setHighlightedFindingId: (id: string | null) => void;
}

export function useFindingsOrchestration({
  persistedFindings,
  setPersistedFindings,
  filters,
  filteredData,
  outcome,
  specs,
  drillPath,
}: UseFindingsOrchestrationOptions): UseFindingsOrchestrationReturn {
  const findingsState = useFindings({
    initialFindings: persistedFindings,
    onFindingsChange: setPersistedFindings,
  });

  // Sync to read-side store
  useEffect(() => {
    useFindingsStore.getState().syncFindings(findingsState.findings);
  }, [findingsState.findings]);

  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const setHighlightedFindingId = useFindingsStore(s => s.setHighlightedFindingId);

  // Auto-clear highlight after 3s
  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedFindingId, setHighlightedFindingId]);

  // Pin current filter state as a finding
  const handlePinFinding = useCallback(
    (noteText?: string) => {
      const existing = findingsState.findDuplicate(filters);
      if (existing) {
        usePanelsStore.getState().setFindingsOpen(true);
        setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding(noteText ?? '', context);
      usePanelsStore.getState().setFindingsOpen(true);
      setHighlightedFindingId(newFinding.id);
    },
    [filters, drillPath, filteredData, outcome, specs, findingsState, setHighlightedFindingId]
  );

  // Restore filter state from a finding (caller handles setFilters)
  const handleRestoreFinding = useCallback((_id: string) => {
    // Context restoration is handled by the caller (App.tsx setFilters)
  }, []);

  // Status change
  const handleSetFindingStatus = useCallback(
    (id: string, status: import('@variscout/core').FindingStatus) => {
      findingsState.setFindingStatus(id, status);
    },
    [findingsState]
  );

  // Chart observation
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
        setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding(noteText ?? '', context, source);
      usePanelsStore.getState().setFindingsOpen(true);
      setHighlightedFindingId(newFinding.id);
    },
    [filters, drillPath, filteredData, outcome, specs, findingsState, setHighlightedFindingId]
  );

  // Chart findings grouped for annotation display
  const chartFindings = useMemo(
    () => ({
      boxplot: findingsState.getChartFindings('boxplot'),
      pareto: findingsState.getChartFindings('pareto'),
      ichart: findingsState.getChartFindings('ichart'),
    }),
    [findingsState]
  );

  const findingsCallbacks: FindingsCallbacks = useMemo(
    () => ({
      onAddChartObservation: handleAddChartObservation,
      onEditFinding: findingsState.editFinding,
      onDeleteFinding: findingsState.deleteFinding,
      chartFindings,
    }),
    [handleAddChartObservation, findingsState, chartFindings]
  );

  return {
    findingsState,
    findingsCallbacks,
    handlePinFinding,
    handleRestoreFinding,
    handleSetFindingStatus,
    highlightedFindingId,
    setHighlightedFindingId,
  };
}
