/**
 * Tests for useProjectActions hook
 *
 * Validates all 8 persistence actions using Zustand stores directly:
 * saveProject, loadProject, listProjects, deleteProject, renameProject,
 * exportProject, importProject, newProject.
 *
 * Also covers backward-compat for old .vrs files (missing fields,
 * mindmap→findings migration, filter stack reconstruction).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectActions } from '../useProjectActions';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useInvestigationStore, getInvestigationInitialState } from '@variscout/stores';
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

describe('useProjectActions', () => {
  // --------------------------------------------------------------------------
  // saveProject
  // --------------------------------------------------------------------------

  describe('saveProject', () => {
    it('should call persistence.saveProject with current store state', async () => {
      const persistence = createMockPersistence();

      // Seed project store with data
      useProjectStore.getState().setRawData(sampleData);
      useProjectStore.getState().setOutcome('Weight');
      useProjectStore.getState().setFactors(['Machine']);
      useProjectStore.getState().setSpecs({ LSL: 5, USL: 45 });

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.saveProject('Test Project');
      });

      expect(persistence.saveProject).toHaveBeenCalledWith(
        'Test Project',
        expect.objectContaining({
          rawData: sampleData,
          outcome: 'Weight',
          factors: ['Machine'],
          specs: { LSL: 5, USL: 45 },
        })
      );
    });

    it('should update project lifecycle state after save', async () => {
      const persistence = createMockPersistence();
      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.saveProject('Test Project');
      });

      const ps = useProjectStore.getState();
      expect(ps.projectId).toBe('proj-1');
      expect(ps.projectName).toBe('Test Project');
      expect(ps.hasUnsavedChanges).toBe(false);
    });

    it('should use compact serialization (skip default values)', async () => {
      const persistence = createMockPersistence();

      // Leave all fields at defaults
      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.saveProject('Empty');
      });

      const savedState = (persistence.saveProject as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(savedState.cpkTarget).toBeUndefined();
      expect(savedState.stageColumn).toBeUndefined();
      expect(savedState.analysisMode).toBeUndefined();
      expect(savedState.paretoMode).toBeUndefined();
      expect(savedState.filterStack).toBeUndefined();
      expect(savedState.findings).toBeUndefined();
      expect(savedState.questions).toBeUndefined();
      expect(savedState.categories).toBeUndefined();
    });

    it('should include non-default values in serialization', async () => {
      const persistence = createMockPersistence();

      useProjectStore.getState().setCpkTarget(1.67);
      useProjectStore.getState().setStageColumn('Stage');
      useProjectStore.getState().setAnalysisMode('performance');
      useProjectStore.getState().setParetoMode('separate');

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.saveProject('With Config');
      });

      const savedState = (persistence.saveProject as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(savedState.cpkTarget).toBe(1.67);
      expect(savedState.stageColumn).toBe('Stage');
      expect(savedState.analysisMode).toBe('performance');
      expect(savedState.paretoMode).toBe('separate');
    });

    it('should include findings from investigation store', async () => {
      const persistence = createMockPersistence();
      const findings = [makeFinding('f1', 'Test finding')];
      // Findings are edited in investigationStore (authoritative source)
      useInvestigationStore.getState().loadInvestigationState({ findings });

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.saveProject('With Findings');
      });

      const savedState = (persistence.saveProject as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(savedState.findings).toHaveLength(1);
      expect(savedState.findings[0].text).toBe('Test finding');
    });
  });

  // --------------------------------------------------------------------------
  // loadProject
  // --------------------------------------------------------------------------

  describe('loadProject', () => {
    it('should hydrate project store from loaded state', async () => {
      const persistence = createMockPersistence();
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'proj-1',
        name: 'Loaded Project',
        state: {
          version: '1',
          rawData: sampleData,
          outcome: 'Weight',
          factors: ['Machine'],
          specs: { LSL: 5, USL: 45 },
          filters: {},
          axisSettings: {},
          analysisMode: 'standard',
        } satisfies AnalysisState,
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 4,
      } satisfies SavedProject);

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.loadProject('proj-1');
      });

      const ps = useProjectStore.getState();
      expect(ps.projectId).toBe('proj-1');
      expect(ps.projectName).toBe('Loaded Project');
      expect(ps.rawData).toEqual(sampleData);
      expect(ps.outcome).toBe('Weight');
      expect(ps.factors).toEqual(['Machine']);
      expect(ps.specs).toEqual({ LSL: 5, USL: 45 });
      expect(ps.hasUnsavedChanges).toBe(false);
    });

    it('should handle missing project gracefully', async () => {
      const persistence = createMockPersistence();
      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.loadProject('missing-id');
      });

      // Store should remain unchanged
      expect(useProjectStore.getState().rawData).toEqual([]);
    });

    it('should derive flat filters from filterStack on load', async () => {
      const persistence = createMockPersistence();
      const filterStack: FilterAction[] = [
        { type: 'filter', factor: 'Machine', values: ['A'] },
        { type: 'filter', factor: 'Line', values: ['L1', 'L2'] },
      ];

      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'proj-2',
        name: 'Filtered',
        state: {
          version: '1',
          rawData: sampleData,
          outcome: 'Weight',
          factors: ['Machine'],
          specs: {},
          filters: {}, // Empty — should be derived from stack
          axisSettings: {},
          filterStack,
        } satisfies AnalysisState,
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 4,
      } satisfies SavedProject);

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.loadProject('proj-2');
      });

      const ps = useProjectStore.getState();
      expect(ps.filterStack).toEqual(filterStack);
      expect(ps.filters).toEqual({
        Machine: ['A'],
        Line: ['L1', 'L2'],
      });
    });

    it('should use flat filters directly when no filterStack (old .vrs)', async () => {
      const persistence = createMockPersistence();
      const oldFilters = { Machine: ['A'] };

      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'proj-3',
        name: 'Old Format',
        state: {
          version: '1',
          rawData: sampleData,
          outcome: 'Weight',
          factors: ['Machine'],
          specs: {},
          filters: oldFilters,
          axisSettings: {},
          // No filterStack
        } satisfies AnalysisState,
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 4,
      } satisfies SavedProject);

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.loadProject('proj-3');
      });

      const ps = useProjectStore.getState();
      expect(ps.filters).toEqual(oldFilters);
      expect(ps.filterStack).toEqual([]);
    });

    it('should migrate isMindmapOpen → isFindingsOpen on load', async () => {
      const persistence = createMockPersistence();
      const viewState = { isMindmapOpen: true } as ViewState & { isMindmapOpen?: boolean };

      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'proj-4',
        name: 'Old ViewState',
        state: {
          version: '1',
          rawData: [],
          outcome: null,
          factors: [],
          specs: {},
          filters: {},
          axisSettings: {},
          viewState,
        },
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 0,
      });

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.loadProject('proj-4');
      });

      const ps = useProjectStore.getState();
      expect(ps.viewState?.isFindingsOpen).toBe(true);
      expect((ps.viewState as Record<string, unknown>)?.isMindmapOpen).toBeUndefined();
    });

    it('should hydrate investigation store on load', async () => {
      const persistence = createMockPersistence();
      const findings = [makeFinding('f1', 'Finding 1')];
      const questions = [
        {
          id: 'q1',
          text: 'Why?',
          status: 'open' as const,
          createdAt: '2026-03-01',
          updatedAt: '2026-03-01',
          linkedFindingIds: [],
        },
      ];

      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'proj-5',
        name: 'With Investigation',
        state: {
          version: '1',
          rawData: sampleData,
          outcome: 'Weight',
          factors: ['Machine'],
          specs: {},
          filters: {},
          axisSettings: {},
          findings,
          questions,
        } satisfies AnalysisState,
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 4,
      } satisfies SavedProject);

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.loadProject('proj-5');
      });

      const is = useInvestigationStore.getState();
      expect(is.findings).toHaveLength(1);
      expect(is.findings[0].text).toBe('Finding 1');
      expect(is.questions).toHaveLength(1);
      expect(is.questions[0].text).toBe('Why?');
    });

    it('should load backward-compat fields with defaults for old .vrs files', async () => {
      const persistence = createMockPersistence();

      (persistence.loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'proj-6',
        name: 'Minimal',
        state: {
          version: '1',
          rawData: sampleData,
          outcome: 'Weight',
          factors: ['Machine'],
          specs: {},
          filters: {},
          axisSettings: {},
          // No optional fields at all
        } satisfies AnalysisState,
        savedAt: '2026-03-01T00:00:00Z',
        rowCount: 4,
      } satisfies SavedProject);

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.loadProject('proj-6');
      });

      const ps = useProjectStore.getState();
      expect(ps.analysisMode).toBe('standard');
      expect(ps.measureColumns).toEqual([]);
      expect(ps.measureLabel).toBe('Measure');
      expect(ps.paretoMode).toBe('derived');
      expect(ps.paretoAggregation).toBe('count');
      expect(ps.stageColumn).toBeNull();
      expect(ps.stageOrderMode).toBe('auto');
      expect(ps.timeColumn).toBeNull();
      expect(ps.columnAliases).toEqual({});
      expect(ps.valueLabels).toEqual({});
    });
  });

  // --------------------------------------------------------------------------
  // listProjects
  // --------------------------------------------------------------------------

  describe('listProjects', () => {
    it('should delegate to persistence.listProjects', async () => {
      const persistence = createMockPersistence();
      const mockList: SavedProject[] = [
        {
          id: 'proj-1',
          name: 'A',
          state: {} as AnalysisState,
          savedAt: '2026-01-01',
          rowCount: 10,
        },
      ];
      (persistence.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(mockList);

      const { result } = renderHook(() => useProjectActions(persistence));

      let projects: SavedProject[] = [];
      await act(async () => {
        projects = await result.current.listProjects();
      });

      expect(projects).toEqual(mockList);
    });
  });

  // --------------------------------------------------------------------------
  // deleteProject
  // --------------------------------------------------------------------------

  describe('deleteProject', () => {
    it('should call persistence.deleteProject', async () => {
      const persistence = createMockPersistence();
      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.deleteProject('proj-1');
      });

      expect(persistence.deleteProject).toHaveBeenCalledWith('proj-1');
    });

    it('should clear project ID/name if deleting current project', async () => {
      const persistence = createMockPersistence();
      useProjectStore.getState().setProjectId('proj-1');
      useProjectStore.getState().setProjectName('Current');

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.deleteProject('proj-1');
      });

      const ps = useProjectStore.getState();
      expect(ps.projectId).toBeNull();
      expect(ps.projectName).toBeNull();
    });

    it('should not clear project ID/name if deleting other project', async () => {
      const persistence = createMockPersistence();
      useProjectStore.getState().setProjectId('proj-1');
      useProjectStore.getState().setProjectName('Current');

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.deleteProject('proj-2');
      });

      const ps = useProjectStore.getState();
      expect(ps.projectId).toBe('proj-1');
      expect(ps.projectName).toBe('Current');
    });
  });

  // --------------------------------------------------------------------------
  // renameProject
  // --------------------------------------------------------------------------

  describe('renameProject', () => {
    it('should call persistence.renameProject', async () => {
      const persistence = createMockPersistence();
      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.renameProject('proj-1', 'New Name');
      });

      expect(persistence.renameProject).toHaveBeenCalledWith('proj-1', 'New Name');
    });

    it('should update project name if renaming current project', async () => {
      const persistence = createMockPersistence();
      useProjectStore.getState().setProjectId('proj-1');
      useProjectStore.getState().setProjectName('Old');

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.renameProject('proj-1', 'New Name');
      });

      expect(useProjectStore.getState().projectName).toBe('New Name');
    });
  });

  // --------------------------------------------------------------------------
  // exportProject
  // --------------------------------------------------------------------------

  describe('exportProject', () => {
    it('should call persistence.exportToFile with current store state', () => {
      const persistence = createMockPersistence();
      useProjectStore.getState().setRawData(sampleData);
      useProjectStore.getState().setOutcome('Weight');

      const { result } = renderHook(() => useProjectActions(persistence));

      act(() => {
        result.current.exportProject('test.vrs');
      });

      expect(persistence.exportToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          rawData: sampleData,
          outcome: 'Weight',
        }),
        'test.vrs'
      );
    });
  });

  // --------------------------------------------------------------------------
  // importProject
  // --------------------------------------------------------------------------

  describe('importProject', () => {
    it('should hydrate stores from imported file', async () => {
      const persistence = createMockPersistence();
      const importedState: AnalysisState = {
        version: '1',
        rawData: sampleData,
        outcome: 'Weight',
        factors: ['Machine'],
        specs: { LSL: 5, USL: 45 },
        filters: {},
        axisSettings: {},
        findings: [makeFinding('f1', 'Imported finding')],
      };
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue(importedState);

      const file = new File(['{}'], 'imported.vrs', { type: 'application/json' });

      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.importProject(file);
      });

      const ps = useProjectStore.getState();
      expect(ps.rawData).toEqual(sampleData);
      expect(ps.outcome).toBe('Weight');
      expect(ps.projectName).toBe('imported');
      expect(ps.projectId).toBeNull();
      expect(ps.hasUnsavedChanges).toBe(true);

      const is = useInvestigationStore.getState();
      expect(is.findings).toHaveLength(1);
      expect(is.findings[0].text).toBe('Imported finding');
    });

    it('should derive flat filters from filterStack on import', async () => {
      const persistence = createMockPersistence();
      const filterStack: FilterAction[] = [{ type: 'filter', factor: 'Machine', values: ['A'] }];
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue({
        version: '1',
        rawData: sampleData,
        outcome: 'Weight',
        factors: ['Machine'],
        specs: {},
        filters: {},
        axisSettings: {},
        filterStack,
      } satisfies AnalysisState);

      const file = new File(['{}'], 'test.vrs');
      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.importProject(file);
      });

      const ps = useProjectStore.getState();
      expect(ps.filterStack).toEqual(filterStack);
      expect(ps.filters).toEqual({ Machine: ['A'] });
    });

    it('should migrate viewState isMindmapOpen on import', async () => {
      const persistence = createMockPersistence();
      (persistence.importFromFile as ReturnType<typeof vi.fn>).mockResolvedValue({
        version: '1',
        rawData: [],
        outcome: null,
        factors: [],
        specs: {},
        filters: {},
        axisSettings: {},
        viewState: { isMindmapOpen: true },
      });

      const file = new File(['{}'], 'old.vrs');
      const { result } = renderHook(() => useProjectActions(persistence));

      await act(async () => {
        await result.current.importProject(file);
      });

      const ps = useProjectStore.getState();
      expect(ps.viewState?.isFindingsOpen).toBe(true);
      expect((ps.viewState as Record<string, unknown>)?.isMindmapOpen).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // newProject
  // --------------------------------------------------------------------------

  describe('newProject', () => {
    it('should reset both stores to initial state', () => {
      const persistence = createMockPersistence();

      // Seed stores with data
      useProjectStore.getState().setRawData(sampleData);
      useProjectStore.getState().setOutcome('Weight');
      useProjectStore.getState().setProjectId('proj-1');
      useInvestigationStore.getState().addFinding('Test', {
        activeFilters: {},
        cumulativeScope: 0,
        stats: { mean: 10, samples: 100 },
      });

      const { result } = renderHook(() => useProjectActions(persistence));

      act(() => {
        result.current.newProject();
      });

      const ps = useProjectStore.getState();
      expect(ps.rawData).toEqual([]);
      expect(ps.outcome).toBeNull();
      expect(ps.projectId).toBeNull();
      expect(ps.hasUnsavedChanges).toBe(false);

      const is = useInvestigationStore.getState();
      expect(is.findings).toEqual([]);
      expect(is.questions).toEqual([]);
      expect(is.categories).toEqual([]);
    });
  });
});
