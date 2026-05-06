/**
 * Integration tests: full save→load roundtrip through useProjectActions
 *
 * Uses a real in-memory PersistenceAdapter (no mocks) to verify that
 * state set in Zustand stores survives save→reset→load intact.
 *
 * Covers:
 *  1. Full project roundtrip (rawData, outcome, factors, specs)
 *  2. Investigation roundtrip (findings, questions from investigationStore)
 *  3. Non-default analysis config (mode, specs, displayOptions, paretoMode)
 *  4. filterStack derivation: filterStack → flat filters on load
 *  5. viewState migration: isMindmapOpen → isFindingsOpen
 *  6. newProject resets both stores
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectActions } from '../useProjectActions';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useInvestigationStore, getInvestigationInitialState } from '@variscout/stores';
import type { PersistenceAdapter, SavedProject, AnalysisState } from '../types';
import type { DataRow, Finding, Question, FilterAction } from '@variscout/core';

// ============================================================================
// In-memory PersistenceAdapter
// ============================================================================

function createInMemoryAdapter(): PersistenceAdapter {
  const storage = new Map<string, { name: string; state: Omit<AnalysisState, 'version'> }>();
  let nextId = 1;

  return {
    saveProject: async (name, state) => {
      const id = `project-${nextId++}`;
      storage.set(id, { name, state });
      return {
        id,
        name,
        state: state as AnalysisState,
        savedAt: new Date().toISOString(),
        rowCount: (state.rawData ?? []).length,
      } satisfies SavedProject;
    },

    loadProject: async id => {
      const entry = storage.get(id);
      if (!entry) return undefined;
      return {
        id,
        name: entry.name,
        state: entry.state as AnalysisState,
        savedAt: new Date().toISOString(),
        rowCount: (entry.state.rawData ?? []).length,
      } satisfies SavedProject;
    },

    listProjects: async () =>
      [...storage.entries()].map(([id, e]) => ({
        id,
        name: e.name,
        state: e.state as AnalysisState,
        savedAt: new Date().toISOString(),
        rowCount: (e.state.rawData ?? []).length,
      })),

    deleteProject: async id => {
      storage.delete(id);
    },

    renameProject: async (id, newName) => {
      const entry = storage.get(id);
      if (entry) entry.name = newName;
    },

    exportToFile: () => {
      /* no-op for tests */
    },

    importFromFile: async () =>
      ({
        rawData: [],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
      }) as unknown as AnalysisState,
  };
}

// ============================================================================
// Fixtures
// ============================================================================

const sampleData: DataRow[] = [
  { Machine: 'A', Weight: 10 },
  { Machine: 'A', Weight: 20 },
  { Machine: 'B', Weight: 30 },
  { Machine: 'B', Weight: 40 },
];

function makeFinding(id: string, text: string): Finding {
  return {
    id,
    text,
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: 0, stats: { mean: 15, samples: 4 } },
    status: 'observed',
    comments: [],
    statusChangedAt: 1714000000000,
  };
}

function makeQuestion(id: string, text: string): Question {
  return {
    id,
    text,
    status: 'open',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    linkedFindingIds: [],
  };
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  useProjectStore.setState({ ...getProjectInitialState() });
  useInvestigationStore.setState({ ...getInvestigationInitialState() });
});

// ============================================================================
// Tests
// ============================================================================

describe('useProjectActions persistence roundtrip', () => {
  // --------------------------------------------------------------------------
  // 1. Full project roundtrip
  // --------------------------------------------------------------------------

  it('roundtrip: rawData, outcome, factors, specs survive save → reset → load', async () => {
    const adapter = createInMemoryAdapter();
    const { result } = renderHook(() => useProjectActions(adapter));

    // Seed project store
    useProjectStore.getState().setRawData(sampleData);
    useProjectStore.getState().setOutcome('Weight');
    useProjectStore.getState().setFactors(['Machine']);
    useProjectStore.getState().setSpecs({ lsl: 5, usl: 45 });

    // Save
    let savedProject!: SavedProject;
    await act(async () => {
      savedProject = await result.current.saveProject('Roundtrip Project');
    });

    // Reset stores to initial state
    useProjectStore.setState({ ...getProjectInitialState() });
    useInvestigationStore.setState({ ...getInvestigationInitialState() });

    // Verify stores are clean
    expect(useProjectStore.getState().rawData).toEqual([]);

    // Load
    await act(async () => {
      await result.current.loadProject(savedProject.id);
    });

    const ps = useProjectStore.getState();
    expect(ps.rawData).toEqual(sampleData);
    expect(ps.outcome).toBe('Weight');
    expect(ps.factors).toEqual(['Machine']);
    expect(ps.specs).toEqual({ lsl: 5, usl: 45 });
    expect(ps.projectId).toBe(savedProject.id);
    expect(ps.projectName).toBe('Roundtrip Project');
    expect(ps.hasUnsavedChanges).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 2. Investigation roundtrip
  // --------------------------------------------------------------------------

  it('roundtrip: findings and questions from investigationStore survive save → reset → load', async () => {
    const adapter = createInMemoryAdapter();
    const { result } = renderHook(() => useProjectActions(adapter));

    // investigationStore is the authority for findings/questions
    const findings = [
      makeFinding('f1', 'Weight spike on Machine B'),
      makeFinding('f2', 'Shift effect'),
    ];
    const questions = [makeQuestion('q1', 'Is Machine B the root cause?')];

    // getCurrentStateFromStores reads investigation data from investigationStore (authoritative)
    useProjectStore.getState().setRawData(sampleData);
    useProjectStore.getState().setOutcome('Weight');
    useProjectStore.getState().setFactors(['Machine']);
    useInvestigationStore.getState().loadInvestigationState({ findings, questions });

    // Save
    let savedId!: string;
    await act(async () => {
      const p = await result.current.saveProject('Investigation Project');
      savedId = p.id;
    });

    // Reset
    useProjectStore.setState({ ...getProjectInitialState() });
    useInvestigationStore.setState({ ...getInvestigationInitialState() });

    // Load
    await act(async () => {
      await result.current.loadProject(savedId);
    });

    // investigationStore is hydrated by loadProject
    const is = useInvestigationStore.getState();
    expect(is.findings).toHaveLength(2);
    expect(is.findings[0].id).toBe('f1');
    expect(is.findings[0].text).toBe('Weight spike on Machine B');
    expect(is.findings[1].id).toBe('f2');
    expect(is.questions).toHaveLength(1);
    expect(is.questions[0].id).toBe('q1');
    expect(is.questions[0].text).toBe('Is Machine B the root cause?');
  });

  // --------------------------------------------------------------------------
  // 3. Non-default analysis configuration
  // --------------------------------------------------------------------------

  it('roundtrip: non-default analysisMode, specs, displayOptions, paretoConfig survive', async () => {
    const adapter = createInMemoryAdapter();
    const { result } = renderHook(() => useProjectActions(adapter));

    useProjectStore.getState().setRawData(sampleData);
    useProjectStore.getState().setOutcome('Weight');
    useProjectStore.getState().setFactors(['Machine']);
    useProjectStore.getState().setAnalysisMode('performance');
    useProjectStore.getState().setCpkTarget(1.67);
    useProjectStore.getState().setDisplayOptions({ showViolin: true, showControlLimits: false });
    useProjectStore.getState().setParetoMode('separate');
    useProjectStore.getState().setParetoAggregation('value');

    let savedId!: string;
    await act(async () => {
      const p = await result.current.saveProject('Config Project');
      savedId = p.id;
    });

    // Reset
    useProjectStore.setState({ ...getProjectInitialState() });
    useInvestigationStore.setState({ ...getInvestigationInitialState() });

    // Load
    await act(async () => {
      await result.current.loadProject(savedId);
    });

    const ps = useProjectStore.getState();
    expect(ps.analysisMode).toBe('performance');
    expect(ps.cpkTarget).toBe(1.67);
    expect(ps.displayOptions.showViolin).toBe(true);
    expect(ps.displayOptions.showControlLimits).toBe(false);
    expect(ps.paretoMode).toBe('separate');
    expect(ps.paretoAggregation).toBe('value');
  });

  // --------------------------------------------------------------------------
  // 4. filterStack derivation
  // --------------------------------------------------------------------------

  it('roundtrip: filterStack saved → derived flat filters correct on load', async () => {
    const adapter = createInMemoryAdapter();
    const { result } = renderHook(() => useProjectActions(adapter));

    const filterStack: FilterAction[] = [
      {
        id: 'fa-1',
        type: 'filter',
        source: 'boxplot',
        factor: 'Machine',
        values: ['A'],
        timestamp: 1714000000000,
        label: 'Machine = A',
      },
      {
        id: 'fa-2',
        type: 'filter',
        source: 'boxplot',
        factor: 'Line',
        values: ['L1', 'L2'],
        timestamp: 1714000001000,
        label: 'Line = L1, L2',
      },
    ];

    useProjectStore.getState().setRawData(sampleData);
    useProjectStore.getState().setOutcome('Weight');
    useProjectStore.getState().setFactors(['Machine']);
    useProjectStore.getState().setFilterStack(filterStack);

    let savedId!: string;
    await act(async () => {
      const p = await result.current.saveProject('Filtered Project');
      savedId = p.id;
    });

    // Reset
    useProjectStore.setState({ ...getProjectInitialState() });
    useInvestigationStore.setState({ ...getInvestigationInitialState() });

    // Load
    await act(async () => {
      await result.current.loadProject(savedId);
    });

    const ps = useProjectStore.getState();
    expect(ps.filterStack).toEqual(filterStack);
    // Derived flat filters must reflect all filterStack entries
    expect(ps.filters).toEqual({
      Machine: ['A'],
      Line: ['L1', 'L2'],
    });
  });

  // --------------------------------------------------------------------------
  // 5. viewState migration: isMindmapOpen → isFindingsOpen
  // --------------------------------------------------------------------------

  it('roundtrip: old .vrs with isMindmapOpen:true loads as isFindingsOpen:true', async () => {
    const adapter = createInMemoryAdapter();

    // Inject an old-format project directly into the adapter's storage by
    // using loadProject with a manually-constructed saved project that has
    // the legacy isMindmapOpen field.
    const oldStyleState = {
      rawData: [] as DataRow[],
      outcome: null,
      factors: [] as string[],
      specs: {},
      filters: {},
      axisSettings: {},
      viewState: { isMindmapOpen: true } as Record<string, unknown>,
    };

    // Bypass the normal save flow to inject a legacy-format state directly
    let injectedId!: string;
    await act(async () => {
      const p = await adapter.saveProject(
        'Legacy Project',
        oldStyleState as Omit<AnalysisState, 'version'>
      );
      injectedId = p.id;
    });

    const { result } = renderHook(() => useProjectActions(adapter));

    await act(async () => {
      await result.current.loadProject(injectedId);
    });

    const ps = useProjectStore.getState();
    expect(ps.viewState?.isFindingsOpen).toBe(true);
    expect((ps.viewState as Record<string, unknown> | null)?.isMindmapOpen).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // 6. newProject resets both stores
  // --------------------------------------------------------------------------

  it('newProject: resets projectStore and investigationStore to initial state', async () => {
    const adapter = createInMemoryAdapter();
    const { result } = renderHook(() => useProjectActions(adapter));

    // Seed both stores
    useProjectStore.getState().setRawData(sampleData);
    useProjectStore.getState().setOutcome('Weight');
    useProjectStore.getState().setFactors(['Machine']);
    useProjectStore.getState().setProjectId('proj-before');
    useProjectStore.getState().setProjectName('Before Reset');

    useInvestigationStore.getState().addFinding('Must disappear', {
      activeFilters: {},
      cumulativeScope: 0,
      stats: { mean: 15, samples: 4 },
    });
    useInvestigationStore.getState().addQuestion('Must disappear too');

    // Verify seeding worked
    expect(useProjectStore.getState().rawData).toHaveLength(4);
    expect(useInvestigationStore.getState().findings).toHaveLength(1);
    expect(useInvestigationStore.getState().questions).toHaveLength(1);

    // Call newProject
    act(() => {
      result.current.newProject();
    });

    // projectStore should be reset
    const ps = useProjectStore.getState();
    expect(ps.rawData).toEqual([]);
    expect(ps.outcome).toBeNull();
    expect(ps.factors).toEqual([]);
    expect(ps.projectId).toBeNull();
    expect(ps.projectName).toBeNull();
    expect(ps.hasUnsavedChanges).toBe(false);

    // investigationStore should be reset
    const is = useInvestigationStore.getState();
    expect(is.findings).toEqual([]);
    expect(is.questions).toEqual([]);
    expect(is.categories).toEqual([]);
    expect(is.suspectedCauses).toEqual([]);
  });
});
