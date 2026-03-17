/**
 * Tests for useProjectPersistence hook
 *
 * Validates all 8 persistence actions: saveProject, loadProject, listProjects,
 * deleteProject, renameProject, exportProject, importProject, newProject.
 *
 * Also covers backward-compat for old .vrs files (missing fields, mindmap→findings migration,
 * filter stack reconstruction, orphaned filter cleanup).
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectPersistence } from '../useProjectPersistence';
import type { ProjectPersistenceInputs } from '../useProjectPersistence';
import type { PersistenceAdapter, SavedProject, AnalysisState, ViewState } from '../types';
import type { DataRow, Finding, FilterAction } from '@variscout/core';

// ============================================================================
// Test helpers
// ============================================================================

function createMockPersistence(): PersistenceAdapter {
  return {
    saveProject: vi.fn().mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
      state: {
        version: '1',
        rawData: [],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
      },
      savedAt: '2026-03-01T00:00:00Z',
      rowCount: 4,
    } satisfies SavedProject),
    loadProject: vi.fn().mockResolvedValue(undefined),
    listProjects: vi.fn().mockResolvedValue([]),
    deleteProject: vi.fn().mockResolvedValue(undefined),
    renameProject: vi.fn().mockResolvedValue(undefined),
    exportToFile: vi.fn(),
    importFromFile: vi.fn().mockResolvedValue({
      version: '1',
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      filters: {},
      axisSettings: {},
    } satisfies AnalysisState),
  };
}

const sampleData: DataRow[] = [
  { Machine: 'A', Weight: 10 },
  { Machine: 'A', Weight: 20 },
  { Machine: 'B', Weight: 30 },
  { Machine: 'B', Weight: 40 },
];

const makeFinding = (id: string, text: string): Finding => ({
  id,
  text,
  createdAt: Date.now(),
  context: { activeFilters: {}, cumulativeScope: 0, stats: { mean: 10, samples: 100 } },
  status: 'observed',
  comments: [],
  statusChangedAt: Date.now(),
});

function createMockSetters() {
  return {
    setRawData: vi.fn(),
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setTimeColumn: vi.fn(),
    setSpecs: vi.fn(),
    setMeasureSpecs: vi.fn(),
    setFilters: vi.fn(),
    setAxisSettings: vi.fn(),
    setChartTitles: vi.fn(),
    setColumnAliases: vi.fn(),
    setValueLabels: vi.fn(),
    setDisplayOptions: vi.fn(),
    setCurrentProjectId: vi.fn(),
    setCurrentProjectName: vi.fn(),
    setHasUnsavedChanges: vi.fn(),
    setDataFilename: vi.fn(),
    setDataQualityReport: vi.fn(),
    setParetoMode: vi.fn(),
    setParetoAggregation: vi.fn(),
    setSeparateParetoData: vi.fn(),
    setSeparateParetoFilename: vi.fn(),
    setStageColumn: vi.fn(),
    setStageOrderMode: vi.fn(),
    setPerformanceMode: vi.fn(),
    setMeasureColumns: vi.fn(),
    setMeasureLabel: vi.fn(),
    setSelectedMeasure: vi.fn(),
    setCpkTarget: vi.fn(),
    setFilterStack: vi.fn(),
    setViewState: vi.fn(),
    setFindings: vi.fn(),
    setHypotheses: vi.fn(),
    setCategories: vi.fn(),
  };
}

function createDefaultInputs(
  overrides?: Partial<ProjectPersistenceInputs>
): ProjectPersistenceInputs {
  const setters = createMockSetters();
  return {
    persistence: createMockPersistence(),
    rawData: sampleData,
    outcome: 'Weight',
    factors: ['Machine'],
    specs: { lsl: 5, usl: 45 },
    measureSpecs: {},
    filters: {},
    axisSettings: {},
    columnAliases: {},
    valueLabels: {},
    displayOptions: { lockYAxisToFullData: true, showControlLimits: true },
    currentProjectId: null,
    cpkTarget: 1.33,
    stageColumn: null,
    stageOrderMode: 'auto',
    isPerformanceMode: false,
    measureColumns: [],
    selectedMeasure: null,
    measureLabel: 'Measure',
    chartTitles: {},
    paretoMode: 'derived',
    paretoAggregation: 'count',
    separateParetoData: null,
    timeColumn: null,
    filterStack: [],
    viewState: null,
    findings: [],
    hypotheses: [],
    categories: [],
    ...setters,
    ...overrides,
  };
}

/** Render the hook with given inputs, returning result + stable reference to setters */
function renderPersistence(overrides?: Partial<ProjectPersistenceInputs>) {
  const inputs = createDefaultInputs(overrides);
  const hookResult = renderHook(() => useProjectPersistence(inputs));
  return { inputs, result: hookResult.result };
}

// ============================================================================
// Tests
// ============================================================================

describe('useProjectPersistence', () => {
  // --------------------------------------------------------------------------
  // saveProject
  // --------------------------------------------------------------------------

  describe('saveProject', () => {
    it('calls persistence.saveProject with current state snapshot', async () => {
      const { inputs, result } = renderPersistence();

      await act(async () => {
        await result.current.saveProject('My Analysis');
      });

      expect(inputs.persistence.saveProject).toHaveBeenCalledWith(
        'My Analysis',
        expect.objectContaining({
          rawData: sampleData,
          outcome: 'Weight',
          factors: ['Machine'],
          specs: { lsl: 5, usl: 45 },
        })
      );
    });

    it('updates project ID, name, and marks as saved', async () => {
      const setters = createMockSetters();
      const { result } = renderPersistence(setters);

      await act(async () => {
        await result.current.saveProject('My Analysis');
      });

      expect(setters.setCurrentProjectId).toHaveBeenCalledWith('proj-1');
      expect(setters.setCurrentProjectName).toHaveBeenCalledWith('Test Project');
      expect(setters.setHasUnsavedChanges).toHaveBeenCalledWith(false);
    });

    it('returns the saved project', async () => {
      const { result } = renderPersistence();

      let project: SavedProject | undefined;
      await act(async () => {
        project = await result.current.saveProject('My Analysis');
      });

      expect(project?.id).toBe('proj-1');
      expect(project?.name).toBe('Test Project');
    });

    it('omits default-valued fields for compact serialization', async () => {
      const { inputs, result } = renderPersistence();

      await act(async () => {
        await result.current.saveProject('Compact');
      });

      const savedState = (inputs.persistence.saveProject as ReturnType<typeof vi.fn>).mock
        .calls[0][1];
      // Default values should not be present
      expect(savedState.cpkTarget).toBeUndefined();
      expect(savedState.stageColumn).toBeUndefined();
      expect(savedState.stageOrderMode).toBeUndefined();
      expect(savedState.isPerformanceMode).toBeUndefined();
      expect(savedState.measureColumns).toBeUndefined();
      expect(savedState.selectedMeasure).toBeUndefined();
      expect(savedState.measureLabel).toBeUndefined();
      expect(savedState.chartTitles).toBeUndefined();
      expect(savedState.paretoMode).toBeUndefined();
      expect(savedState.paretoAggregation).toBeUndefined();
      expect(savedState.separateParetoData).toBeUndefined();
      expect(savedState.timeColumn).toBeUndefined();
      expect(savedState.filterStack).toBeUndefined();
      expect(savedState.findings).toBeUndefined();
    });

    it('includes non-default fields in state snapshot', async () => {
      const { inputs, result } = renderPersistence({
        cpkTarget: 2.0,
        stageColumn: 'Stage',
        stageOrderMode: 'data-order',
        isPerformanceMode: true,
        measureColumns: ['Fill1', 'Fill2'],
        selectedMeasure: 'Fill1',
        measureLabel: 'Fill Head',
        chartTitles: { ichart: 'Control Chart' },
        paretoMode: 'separate',
        paretoAggregation: 'value',
        separateParetoData: [{ category: 'X', count: 5 }],
        timeColumn: 'Date',
        filterStack: [
          {
            id: 'f1',
            type: 'filter',
            source: 'boxplot',
            factor: 'Machine',
            values: ['A'],
            timestamp: 1000,
            label: 'Machine=A',
          },
        ] as FilterAction[],
        viewState: { activeTab: 'performance', isFindingsOpen: true },
        findings: [makeFinding('f-1', 'Test finding')],
      });

      await act(async () => {
        await result.current.saveProject('Full');
      });

      const savedState = (inputs.persistence.saveProject as ReturnType<typeof vi.fn>).mock
        .calls[0][1];
      expect(savedState.cpkTarget).toBe(2.0);
      expect(savedState.stageColumn).toBe('Stage');
      expect(savedState.stageOrderMode).toBe('data-order');
      expect(savedState.isPerformanceMode).toBe(true);
      expect(savedState.measureColumns).toEqual(['Fill1', 'Fill2']);
      expect(savedState.selectedMeasure).toBe('Fill1');
      expect(savedState.measureLabel).toBe('Fill Head');
      expect(savedState.chartTitles).toEqual({ ichart: 'Control Chart' });
      expect(savedState.paretoMode).toBe('separate');
      expect(savedState.paretoAggregation).toBe('value');
      expect(savedState.separateParetoData).toHaveLength(1);
      expect(savedState.timeColumn).toBe('Date');
      expect(savedState.filterStack).toHaveLength(1);
      expect(savedState.viewState).toEqual({ activeTab: 'performance', isFindingsOpen: true });
      expect(savedState.findings).toHaveLength(1);
    });

    it('includes measureSpecs only when non-empty', async () => {
      const { inputs, result } = renderPersistence({
        measureSpecs: { Fill1: { lsl: 10, usl: 20 } },
      });

      await act(async () => {
        await result.current.saveProject('WithMeasureSpecs');
      });

      const savedState = (inputs.persistence.saveProject as ReturnType<typeof vi.fn>).mock
        .calls[0][1];
      expect(savedState.measureSpecs).toEqual({ Fill1: { lsl: 10, usl: 20 } });
    });
  });

  // --------------------------------------------------------------------------
  // loadProject
  // --------------------------------------------------------------------------

  describe('loadProject', () => {
    const fullState: AnalysisState = {
      version: '1',
      rawData: sampleData,
      outcome: 'Weight',
      factors: ['Machine'],
      specs: { lsl: 5, usl: 45 },
      measureSpecs: { Fill1: { lsl: 10, usl: 20 } },
      filters: { Machine: ['A'] },
      axisSettings: { min: 0, max: 50 },
      columnAliases: { Machine: 'Equipment' },
      valueLabels: { Machine: { A: 'Machine Alpha' } },
      displayOptions: { lockYAxisToFullData: false, showViolin: true },
      cpkTarget: 2.0,
      stageColumn: 'Stage',
      stageOrderMode: 'data-order',
      isPerformanceMode: true,
      measureColumns: ['Fill1', 'Fill2'],
      selectedMeasure: 'Fill1',
      measureLabel: 'Fill Head',
      chartTitles: { boxplot: 'Variation by Machine' },
      paretoMode: 'separate',
      paretoAggregation: 'value',
      separateParetoData: [{ category: 'X', count: 5 }],
      timeColumn: 'Date',
      viewState: { activeTab: 'performance', isFindingsOpen: true },
      findings: [makeFinding('f-1', 'Test finding')],
    };

    it('restores all state fields from a full project', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'proj-1',
        name: 'Full Project',
        state: fullState,
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 4,
      });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('proj-1');
      });

      expect(setters.setRawData).toHaveBeenCalledWith(sampleData);
      expect(setters.setOutcome).toHaveBeenCalledWith('Weight');
      expect(setters.setFactors).toHaveBeenCalledWith(['Machine']);
      expect(setters.setSpecs).toHaveBeenCalledWith({ lsl: 5, usl: 45 });
      expect(setters.setMeasureSpecs).toHaveBeenCalledWith({ Fill1: { lsl: 10, usl: 20 } });
      expect(setters.setAxisSettings).toHaveBeenCalledWith({ min: 0, max: 50 });
      expect(setters.setColumnAliases).toHaveBeenCalledWith({ Machine: 'Equipment' });
      expect(setters.setValueLabels).toHaveBeenCalledWith({ Machine: { A: 'Machine Alpha' } });
      expect(setters.setDisplayOptions).toHaveBeenCalledWith({
        lockYAxisToFullData: false,
        showViolin: true,
      });
      expect(setters.setCpkTarget).toHaveBeenCalledWith(2.0);
      expect(setters.setStageColumn).toHaveBeenCalledWith('Stage');
      expect(setters.setStageOrderMode).toHaveBeenCalledWith('data-order');
      expect(setters.setPerformanceMode).toHaveBeenCalledWith(true);
      expect(setters.setMeasureColumns).toHaveBeenCalledWith(['Fill1', 'Fill2']);
      expect(setters.setSelectedMeasure).toHaveBeenCalledWith('Fill1');
      expect(setters.setMeasureLabel).toHaveBeenCalledWith('Fill Head');
      expect(setters.setChartTitles).toHaveBeenCalledWith({ boxplot: 'Variation by Machine' });
      expect(setters.setParetoMode).toHaveBeenCalledWith('separate');
      expect(setters.setParetoAggregation).toHaveBeenCalledWith('value');
      expect(setters.setSeparateParetoData).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ category: 'X' })])
      );
      expect(setters.setTimeColumn).toHaveBeenCalledWith('Date');
      expect(setters.setViewState).toHaveBeenCalledWith(
        expect.objectContaining({ activeTab: 'performance', isFindingsOpen: true })
      );
      expect(setters.setFindings).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'f-1' })])
      );
      expect(setters.setCurrentProjectId).toHaveBeenCalledWith('proj-1');
      expect(setters.setCurrentProjectName).toHaveBeenCalledWith('Full Project');
      expect(setters.setHasUnsavedChanges).toHaveBeenCalledWith(false);
    });

    it('does nothing when project not found', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('nonexistent');
      });

      expect(setters.setRawData).not.toHaveBeenCalled();
      expect(setters.setCurrentProjectId).not.toHaveBeenCalled();
    });

    // ---- Backward compatibility: old .vrs files ----

    it('applies defaults for missing optional fields (old .vrs)', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      // Minimal old .vrs state — only required fields
      const oldState: AnalysisState = {
        version: '1',
        rawData: sampleData,
        outcome: 'Weight',
        factors: ['Machine'],
        specs: { lsl: 5, usl: 45 },
        filters: { Machine: ['A'] },
        axisSettings: {},
      };
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'old-1',
        name: 'Old Project',
        state: oldState,
        savedAt: '2025-06-01T00:00:00Z',
        rowCount: 4,
      });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('old-1');
      });

      // Should apply sensible defaults
      expect(setters.setCpkTarget).toHaveBeenCalledWith(1.33);
      expect(setters.setStageColumn).toHaveBeenCalledWith(null);
      expect(setters.setStageOrderMode).toHaveBeenCalledWith('auto');
      expect(setters.setPerformanceMode).toHaveBeenCalledWith(false);
      expect(setters.setMeasureColumns).toHaveBeenCalledWith([]);
      expect(setters.setSelectedMeasure).toHaveBeenCalledWith(null);
      expect(setters.setMeasureLabel).toHaveBeenCalledWith('Measure');
      expect(setters.setChartTitles).toHaveBeenCalledWith({});
      expect(setters.setMeasureSpecs).toHaveBeenCalledWith({});
      expect(setters.setColumnAliases).toHaveBeenCalledWith({});
      expect(setters.setValueLabels).toHaveBeenCalledWith({});
      expect(setters.setParetoMode).toHaveBeenCalledWith('derived');
      expect(setters.setParetoAggregation).toHaveBeenCalledWith('count');
      expect(setters.setSeparateParetoData).toHaveBeenCalledWith(null);
      expect(setters.setTimeColumn).toHaveBeenCalledWith(null);
      expect(setters.setViewState).toHaveBeenCalledWith(null);
      expect(setters.setFindings).toHaveBeenCalledWith([]);
    });

    it('skips setDisplayOptions when displayOptions is undefined in old .vrs', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const oldState: AnalysisState = {
        version: '1',
        rawData: [],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
        // displayOptions intentionally absent
      };
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'old-2',
        name: 'No DisplayOpts',
        state: oldState,
        savedAt: '2025-01-01T00:00:00Z',
        rowCount: 0,
      });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('old-2');
      });

      expect(setters.setDisplayOptions).not.toHaveBeenCalled();
    });

    // ---- Filter stack reconstruction ----

    it('reconstructs flat filters from filterStack when present', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const filterStack: FilterAction[] = [
        {
          id: 'f1',
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
          timestamp: 1000,
          label: 'Machine=A',
        },
        {
          id: 'f2',
          type: 'filter',
          source: 'pareto',
          factor: 'Shift',
          values: ['Day', 'Night'],
          timestamp: 2000,
          label: 'Shift=Day, Night',
        },
      ];
      const stateWithStack: AnalysisState = {
        version: '1',
        rawData: sampleData,
        outcome: 'Weight',
        factors: ['Machine', 'Shift'],
        specs: {},
        filters: {}, // Will be derived from stack
        axisSettings: {},
        filterStack,
      };
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'stack-1',
        name: 'With Stack',
        state: stateWithStack,
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 4,
      });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('stack-1');
      });

      // filterStack should be set
      expect(setters.setFilterStack).toHaveBeenCalledWith(filterStack);
      // Flat filters derived from stack
      expect(setters.setFilters).toHaveBeenCalledWith({
        Machine: ['A'],
        Shift: ['Day', 'Night'],
      });
    });

    it('uses flat filters directly when filterStack is empty (old .vrs)', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const stateNoStack: AnalysisState = {
        version: '1',
        rawData: sampleData,
        outcome: 'Weight',
        factors: ['Machine'],
        specs: {},
        filters: { Machine: ['B'] },
        axisSettings: {},
        // No filterStack
      };
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'no-stack-1',
        name: 'No Stack',
        state: stateNoStack,
        savedAt: '2025-06-01T00:00:00Z',
        rowCount: 4,
      });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('no-stack-1');
      });

      expect(setters.setFilters).toHaveBeenCalledWith({ Machine: ['B'] });
      expect(setters.setFilterStack).toHaveBeenCalledWith([]);
    });

    it('ignores non-filter actions when deriving flat filters from stack', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const filterStack: FilterAction[] = [
        {
          id: 'h1',
          type: 'highlight',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
          timestamp: 1000,
          label: 'Machine=A',
        },
        {
          id: 'f1',
          type: 'filter',
          source: 'boxplot',
          factor: 'Machine',
          values: ['A'],
          timestamp: 2000,
          label: 'Machine=A',
        },
      ];
      const state: AnalysisState = {
        version: '1',
        rawData: sampleData,
        outcome: 'Weight',
        factors: ['Machine'],
        specs: {},
        filters: {},
        axisSettings: {},
        filterStack,
      };
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'hl-1',
        name: 'With Highlights',
        state,
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 4,
      });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('hl-1');
      });

      // Only 'filter' type actions produce flat filters, not 'highlight'
      expect(setters.setFilters).toHaveBeenCalledWith({ Machine: ['A'] });
    });

    // ---- ViewState mindmap→findings migration ----

    it('migrates isMindmapOpen to isFindingsOpen in old .vrs viewState', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const oldViewState = { isMindmapOpen: true, activeTab: 'analysis' } as unknown as ViewState;
      const state: AnalysisState = {
        version: '1',
        rawData: [],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
        viewState: oldViewState,
      };
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'mm-1',
        name: 'Old Mindmap',
        state,
        savedAt: '2025-01-01T00:00:00Z',
        rowCount: 0,
      });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('mm-1');
      });

      const setViewStateCall = setters.setViewState.mock.calls[0][0];
      expect(setViewStateCall.isFindingsOpen).toBe(true);
      expect(setViewStateCall).not.toHaveProperty('isMindmapOpen');
    });

    it('preserves isFindingsOpen when both mindmap and findings flags exist', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      // Edge case: both old and new flags present (isFindingsOpen takes precedence)
      const hybridViewState = {
        isMindmapOpen: true,
        isFindingsOpen: false,
      } as unknown as ViewState;
      const state: AnalysisState = {
        version: '1',
        rawData: [],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
        viewState: hybridViewState,
      };
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'hybrid-1',
        name: 'Hybrid',
        state,
        savedAt: '2025-06-01T00:00:00Z',
        rowCount: 0,
      });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.loadProject('hybrid-1');
      });

      // isFindingsOpen already set to false — should NOT be overwritten by isMindmapOpen
      const setViewStateCall = setters.setViewState.mock.calls[0][0];
      expect(setViewStateCall.isFindingsOpen).toBe(false);
      expect(setViewStateCall).not.toHaveProperty('isMindmapOpen');
    });
  });

  // --------------------------------------------------------------------------
  // listProjects
  // --------------------------------------------------------------------------

  describe('listProjects', () => {
    it('delegates to persistence.listProjects', async () => {
      const persistence = createMockPersistence();
      const projects: SavedProject[] = [
        {
          id: 'p1',
          name: 'Project 1',
          state: {} as AnalysisState,
          savedAt: '2026-01-01T00:00:00Z',
          rowCount: 10,
        },
        {
          id: 'p2',
          name: 'Project 2',
          state: {} as AnalysisState,
          savedAt: '2026-02-01T00:00:00Z',
          rowCount: 20,
        },
      ];
      (persistence.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

      const { result } = renderPersistence({ persistence });

      let listed: SavedProject[] = [];
      await act(async () => {
        listed = await result.current.listProjects();
      });

      expect(listed).toHaveLength(2);
      expect(listed[0].name).toBe('Project 1');
      expect(persistence.listProjects).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // deleteProject
  // --------------------------------------------------------------------------

  describe('deleteProject', () => {
    it('calls persistence.deleteProject with the ID', async () => {
      const persistence = createMockPersistence();
      const { result } = renderPersistence({ persistence });

      await act(async () => {
        await result.current.deleteProject('proj-1');
      });

      expect(persistence.deleteProject).toHaveBeenCalledWith('proj-1');
    });

    it('clears current project when deleting the active project', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const { result } = renderPersistence({
        persistence,
        currentProjectId: 'proj-1',
        ...setters,
      });

      await act(async () => {
        await result.current.deleteProject('proj-1');
      });

      expect(setters.setCurrentProjectId).toHaveBeenCalledWith(null);
      expect(setters.setCurrentProjectName).toHaveBeenCalledWith(null);
    });

    it('does not clear current project when deleting a different project', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const { result } = renderPersistence({
        persistence,
        currentProjectId: 'proj-1',
        ...setters,
      });

      await act(async () => {
        await result.current.deleteProject('proj-OTHER');
      });

      expect(setters.setCurrentProjectId).not.toHaveBeenCalled();
      expect(setters.setCurrentProjectName).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // renameProject
  // --------------------------------------------------------------------------

  describe('renameProject', () => {
    it('calls persistence.renameProject with ID and new name', async () => {
      const persistence = createMockPersistence();
      const { result } = renderPersistence({ persistence });

      await act(async () => {
        await result.current.renameProject('proj-1', 'New Name');
      });

      expect(persistence.renameProject).toHaveBeenCalledWith('proj-1', 'New Name');
    });

    it('updates current project name when renaming the active project', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const { result } = renderPersistence({
        persistence,
        currentProjectId: 'proj-1',
        ...setters,
      });

      await act(async () => {
        await result.current.renameProject('proj-1', 'Renamed');
      });

      expect(setters.setCurrentProjectName).toHaveBeenCalledWith('Renamed');
    });

    it('does not update name when renaming a different project', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const { result } = renderPersistence({
        persistence,
        currentProjectId: 'proj-1',
        ...setters,
      });

      await act(async () => {
        await result.current.renameProject('proj-OTHER', 'Renamed');
      });

      expect(setters.setCurrentProjectName).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // exportProject
  // --------------------------------------------------------------------------

  describe('exportProject', () => {
    it('calls persistence.exportToFile with state snapshot and filename', () => {
      const persistence = createMockPersistence();
      const { result } = renderPersistence({ persistence });

      act(() => {
        result.current.exportProject('my-analysis.vrs');
      });

      expect(persistence.exportToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          rawData: sampleData,
          outcome: 'Weight',
          factors: ['Machine'],
        }),
        'my-analysis.vrs'
      );
    });
  });

  // --------------------------------------------------------------------------
  // importProject
  // --------------------------------------------------------------------------

  describe('importProject', () => {
    const importedState: AnalysisState = {
      version: '1',
      rawData: [{ Temp: 25, Pressure: 100 }],
      outcome: 'Temp',
      factors: ['Pressure'],
      specs: { lsl: 20, usl: 30 },
      filters: { Pressure: [100] },
      axisSettings: { min: 15, max: 35 },
      columnAliases: { Temp: 'Temperature' },
      valueLabels: {},
      displayOptions: { showViolin: true },
      cpkTarget: 1.67,
      stageColumn: 'Stage',
      stageOrderMode: 'data-order',
      isPerformanceMode: true,
      measureColumns: ['Temp'],
      selectedMeasure: 'Temp',
      measureLabel: 'Temperature',
      chartTitles: { ichart: 'Temperature Trend' },
      measureSpecs: { Temp: { lsl: 20, usl: 30 } },
      paretoMode: 'separate',
      paretoAggregation: 'value',
      separateParetoData: [{ category: 'High', count: 3 }],
      timeColumn: 'Date',
      filterStack: [
        {
          id: 'f1',
          type: 'filter',
          source: 'boxplot',
          factor: 'Pressure',
          values: [100],
          timestamp: 1000,
          label: 'Pressure=100',
        },
      ],
      viewState: { focusedChart: 'ichart' },
      findings: [makeFinding('imp-1', 'Imported finding')],
    };

    it('restores all fields from imported file', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue(importedState);
      const file = new File(['{}'], 'analysis.vrs', { type: 'application/json' });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.importProject(file);
      });

      expect(setters.setRawData).toHaveBeenCalledWith([{ Temp: 25, Pressure: 100 }]);
      expect(setters.setOutcome).toHaveBeenCalledWith('Temp');
      expect(setters.setFactors).toHaveBeenCalledWith(['Pressure']);
      expect(setters.setSpecs).toHaveBeenCalledWith({ lsl: 20, usl: 30 });
      expect(setters.setMeasureSpecs).toHaveBeenCalledWith({ Temp: { lsl: 20, usl: 30 } });
      expect(setters.setAxisSettings).toHaveBeenCalledWith({ min: 15, max: 35 });
      expect(setters.setColumnAliases).toHaveBeenCalledWith({ Temp: 'Temperature' });
      expect(setters.setDisplayOptions).toHaveBeenCalledWith({ showViolin: true });
      expect(setters.setCpkTarget).toHaveBeenCalledWith(1.67);
      expect(setters.setStageColumn).toHaveBeenCalledWith('Stage');
      expect(setters.setStageOrderMode).toHaveBeenCalledWith('data-order');
      expect(setters.setPerformanceMode).toHaveBeenCalledWith(true);
      expect(setters.setMeasureColumns).toHaveBeenCalledWith(['Temp']);
      expect(setters.setSelectedMeasure).toHaveBeenCalledWith('Temp');
      expect(setters.setMeasureLabel).toHaveBeenCalledWith('Temperature');
      expect(setters.setChartTitles).toHaveBeenCalledWith({ ichart: 'Temperature Trend' });
      expect(setters.setParetoMode).toHaveBeenCalledWith('separate');
      expect(setters.setParetoAggregation).toHaveBeenCalledWith('value');
      expect(setters.setTimeColumn).toHaveBeenCalledWith('Date');
      expect(setters.setFindings).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'imp-1' })])
      );
    });

    it('sets project ID to null and marks as unsaved', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue(importedState);
      const file = new File(['{}'], 'my-analysis.vrs', { type: 'application/json' });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.importProject(file);
      });

      expect(setters.setCurrentProjectId).toHaveBeenCalledWith(null);
      expect(setters.setCurrentProjectName).toHaveBeenCalledWith('my-analysis');
      expect(setters.setHasUnsavedChanges).toHaveBeenCalledWith(true);
    });

    it('strips .vrs extension from filename for project name', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue({
        version: '1',
        rawData: [],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
      });
      const file = new File(['{}'], 'coffee-analysis.vrs', { type: 'application/json' });

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.importProject(file);
      });

      expect(setters.setCurrentProjectName).toHaveBeenCalledWith('coffee-analysis');
    });

    it('applies defaults for missing optional fields in imported file', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const minimalState: AnalysisState = {
        version: '1',
        rawData: [{ X: 1 }],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
      };
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue(minimalState);
      const file = new File(['{}'], 'old-export.vrs');

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.importProject(file);
      });

      expect(setters.setCpkTarget).toHaveBeenCalledWith(1.33);
      expect(setters.setStageColumn).toHaveBeenCalledWith(null);
      expect(setters.setStageOrderMode).toHaveBeenCalledWith('auto');
      expect(setters.setPerformanceMode).toHaveBeenCalledWith(false);
      expect(setters.setMeasureColumns).toHaveBeenCalledWith([]);
      expect(setters.setSelectedMeasure).toHaveBeenCalledWith(null);
      expect(setters.setMeasureLabel).toHaveBeenCalledWith('Measure');
      expect(setters.setChartTitles).toHaveBeenCalledWith({});
      expect(setters.setParetoMode).toHaveBeenCalledWith('derived');
      expect(setters.setParetoAggregation).toHaveBeenCalledWith('count');
      expect(setters.setSeparateParetoData).toHaveBeenCalledWith(null);
      expect(setters.setTimeColumn).toHaveBeenCalledWith(null);
      expect(setters.setViewState).toHaveBeenCalledWith(null);
      expect(setters.setFindings).toHaveBeenCalledWith([]);
    });

    it('skips conditional setters when fields are truly absent', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      // importFromFile returns AnalysisState where optional fields are undefined
      // and required fields that are falsy (outcome=null) skip their setter
      const sparseState = {
        version: '1',
        rawData: [{ X: 1 }],
        outcome: null, // falsy → setOutcome skipped
        factors: [], // truthy (array) → setFactors called with []
        specs: {}, // truthy (object) → setSpecs called with {}
        filters: {}, // truthy → setFilters called
        axisSettings: {}, // truthy → setAxisSettings called
        // columnAliases: undefined → skipped
        // valueLabels: undefined → skipped
        // displayOptions: undefined → skipped
        // measureSpecs: undefined → skipped
      } as AnalysisState;
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue(sparseState);
      const file = new File(['{}'], 'sparse.vrs');

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.importProject(file);
      });

      // rawData always set
      expect(setters.setRawData).toHaveBeenCalledWith([{ X: 1 }]);
      // null/falsy fields are skipped
      expect(setters.setOutcome).not.toHaveBeenCalled();
      // undefined optional fields are skipped
      expect(setters.setColumnAliases).not.toHaveBeenCalled();
      expect(setters.setValueLabels).not.toHaveBeenCalled();
      expect(setters.setDisplayOptions).not.toHaveBeenCalled();
      expect(setters.setMeasureSpecs).not.toHaveBeenCalled();
      // Empty arrays/objects are truthy → setters ARE called
      expect(setters.setFactors).toHaveBeenCalledWith([]);
      expect(setters.setSpecs).toHaveBeenCalledWith({});
      expect(setters.setAxisSettings).toHaveBeenCalledWith({});
    });

    it('reconstructs flat filters from filterStack in imported file', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const stateWithStack: AnalysisState = {
        version: '1',
        rawData: sampleData,
        outcome: 'Weight',
        factors: ['Machine'],
        specs: {},
        filters: {},
        axisSettings: {},
        filterStack: [
          {
            id: 'f1',
            type: 'filter',
            source: 'boxplot',
            factor: 'Machine',
            values: ['A'],
            timestamp: 1000,
            label: 'Machine=A',
          },
        ],
      };
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue(stateWithStack);
      const file = new File(['{}'], 'import.vrs');

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.importProject(file);
      });

      expect(setters.setFilterStack).toHaveBeenCalledWith(stateWithStack.filterStack);
      expect(setters.setFilters).toHaveBeenCalledWith({ Machine: ['A'] });
    });

    it('uses flat filters when filterStack is empty in imported file', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const stateNoStack: AnalysisState = {
        version: '1',
        rawData: sampleData,
        outcome: 'Weight',
        factors: ['Machine'],
        specs: {},
        filters: { Machine: ['B'] },
        axisSettings: {},
      };
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue(stateNoStack);
      const file = new File(['{}'], 'flat.vrs');

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.importProject(file);
      });

      expect(setters.setFilters).toHaveBeenCalledWith({ Machine: ['B'] });
      expect(setters.setFilterStack).toHaveBeenCalledWith([]);
    });

    it('migrates isMindmapOpen to isFindingsOpen in imported viewState', async () => {
      const setters = createMockSetters();
      const persistence = createMockPersistence();
      const state: AnalysisState = {
        version: '1',
        rawData: [],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
        viewState: { isMindmapOpen: true } as unknown as ViewState,
      };
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue(state);
      const file = new File(['{}'], 'old-mindmap.vrs');

      const { result } = renderPersistence({ persistence, ...setters });

      await act(async () => {
        await result.current.importProject(file);
      });

      const setViewStateCall = setters.setViewState.mock.calls[0][0];
      expect(setViewStateCall.isFindingsOpen).toBe(true);
      expect(setViewStateCall).not.toHaveProperty('isMindmapOpen');
    });
  });

  // --------------------------------------------------------------------------
  // newProject
  // --------------------------------------------------------------------------

  describe('newProject', () => {
    it('resets all state to defaults', () => {
      const setters = createMockSetters();
      const { result } = renderPersistence(setters);

      act(() => {
        result.current.newProject();
      });

      expect(setters.setRawData).toHaveBeenCalledWith([]);
      expect(setters.setOutcome).toHaveBeenCalledWith(null);
      expect(setters.setFactors).toHaveBeenCalledWith([]);
      expect(setters.setTimeColumn).toHaveBeenCalledWith(null);
      expect(setters.setSpecs).toHaveBeenCalledWith({});
      expect(setters.setMeasureSpecs).toHaveBeenCalledWith({});
      expect(setters.setFilters).toHaveBeenCalledWith({});
      expect(setters.setAxisSettings).toHaveBeenCalledWith({});
      expect(setters.setChartTitles).toHaveBeenCalledWith({});
      expect(setters.setColumnAliases).toHaveBeenCalledWith({});
      expect(setters.setValueLabels).toHaveBeenCalledWith({});
      expect(setters.setDisplayOptions).toHaveBeenCalledWith({
        lockYAxisToFullData: true,
        showControlLimits: true,
        showViolin: false,
        showFilterContext: true,
      });
      expect(setters.setCurrentProjectId).toHaveBeenCalledWith(null);
      expect(setters.setCurrentProjectName).toHaveBeenCalledWith(null);
      expect(setters.setHasUnsavedChanges).toHaveBeenCalledWith(false);
      expect(setters.setDataFilename).toHaveBeenCalledWith(null);
      expect(setters.setDataQualityReport).toHaveBeenCalledWith(null);
      expect(setters.setParetoMode).toHaveBeenCalledWith('derived');
      expect(setters.setParetoAggregation).toHaveBeenCalledWith('count');
      expect(setters.setSeparateParetoData).toHaveBeenCalledWith(null);
      expect(setters.setSeparateParetoFilename).toHaveBeenCalledWith(null);
      expect(setters.setStageColumn).toHaveBeenCalledWith(null);
      expect(setters.setStageOrderMode).toHaveBeenCalledWith('auto');
      expect(setters.setPerformanceMode).toHaveBeenCalledWith(false);
      expect(setters.setMeasureColumns).toHaveBeenCalledWith([]);
      expect(setters.setMeasureLabel).toHaveBeenCalledWith('Measure');
      expect(setters.setSelectedMeasure).toHaveBeenCalledWith(null);
      expect(setters.setCpkTarget).toHaveBeenCalledWith(1.33);
      expect(setters.setFilterStack).toHaveBeenCalledWith([]);
      expect(setters.setViewState).toHaveBeenCalledWith(null);
      expect(setters.setFindings).toHaveBeenCalledWith([]);
    });
  });
});
