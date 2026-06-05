import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ProcessHub } from '@variscout/core';
import {
  buildDocumentSnapshot,
  getAnalyzeInitialState,
  getProjectInitialState,
  useAnalyzeStore,
  useProjectStore,
  type DocumentSnapshot,
} from '@variscout/stores';
import { useProjectActions } from '../useProjectActions';
import type { PersistenceAdapter, SavedProject } from '../types';

const now = 1_714_000_000_000;

const activeHub: ProcessHub = {
  id: 'hub-1',
  name: 'Hub 1',
  processGoal: 'Reduce scrap.',
  createdAt: now,
  deletedAt: null,
};

function resetStores() {
  useProjectStore.setState(getProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
}

function seedProject() {
  useProjectStore.setState({
    ...getProjectInitialState(),
    rawData: [
      { Machine: 'A', Weight: 10 },
      { Machine: 'B', Weight: 20 },
    ],
    outcome: 'Weight',
    factors: ['Machine'],
    specs: { lsl: 5, usl: 25 },
    processContext: {
      processHubId: 'hub-1',
      analyzeDepth: 'focused',
      analyzeStatus: 'investigating',
    },
  });
  useAnalyzeStore.getState().loadAnalyzeState({
    findings: [
      {
        id: 'finding-1',
        text: 'Machine B is high.',
        evidenceType: 'data',
        status: 'observed',
        context: { activeFilters: {}, cumulativeScope: null, stats: { samples: 2 } },
        comments: [],
        statusChangedAt: now,
        createdAt: now,
        deletedAt: null,
      },
    ],
  });
}

function makeSavedProject(snapshot: DocumentSnapshot): SavedProject {
  return {
    id: 'saved-1',
    name: 'Saved Project',
    state: snapshot,
    savedAt: '2026-06-01T00:00:00.000Z',
    rowCount: snapshot.project.rawData.length,
  };
}

function makePersistence(overrides: Partial<PersistenceAdapter> = {}): PersistenceAdapter {
  return {
    saveProject: vi.fn(async (_name: string, state: DocumentSnapshot) => makeSavedProject(state)),
    loadProject: vi.fn(),
    listProjects: vi.fn(async () => []),
    deleteProject: vi.fn(async () => {}),
    renameProject: vi.fn(async () => {}),
    exportToFile: vi.fn(),
    importFromFile: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  resetStores();
});

describe('useProjectActions', () => {
  it('saves the current stores as a DocumentSnapshot', async () => {
    seedProject();
    const persistence = makePersistence();
    const { result } = renderHook(() =>
      useProjectActions(persistence, { getActiveHub: () => activeHub })
    );

    await act(async () => {
      await result.current.saveProject('Snapshot Project');
    });

    expect(persistence.saveProject).toHaveBeenCalledWith(
      'Snapshot Project',
      expect.objectContaining({
        schemaVersion: 1,
        hub: expect.objectContaining({ id: 'hub-1', processGoal: 'Reduce scrap.' }),
        project: expect.objectContaining({ outcome: 'Weight' }),
        analyze: expect.objectContaining({
          findings: [expect.objectContaining({ id: 'finding-1' })],
        }),
      })
    );
    expect(useProjectStore.getState()).toMatchObject({
      projectId: 'saved-1',
      projectName: 'Saved Project',
      hasUnsavedChanges: false,
    });
  });

  it('loads a saved DocumentSnapshot into the document stores', async () => {
    seedProject();
    const snapshot = buildDocumentSnapshot({ activeHub });
    resetStores();
    const persistence = makePersistence({
      loadProject: vi.fn(async () => makeSavedProject(snapshot)),
    });
    const { result } = renderHook(() => useProjectActions(persistence));

    await act(async () => {
      await result.current.loadProject('saved-1');
    });

    expect(useProjectStore.getState()).toMatchObject({
      rawData: [
        { Machine: 'A', Weight: 10 },
        { Machine: 'B', Weight: 20 },
      ],
      outcome: 'Weight',
      projectId: 'saved-1',
      projectName: 'Saved Project',
      hasUnsavedChanges: false,
    });
    expect(useAnalyzeStore.getState().findings).toEqual([
      expect.objectContaining({ id: 'finding-1' }),
    ]);
  });

  it('exports with the active hub context only', () => {
    const persistence = makePersistence();
    const { result } = renderHook(() =>
      useProjectActions(persistence, { getActiveHub: () => activeHub })
    );

    act(() => {
      result.current.exportProject('snapshot.vrs');
    });

    expect(persistence.exportToFile).toHaveBeenCalledWith('snapshot.vrs', { activeHub });
  });

  it('imports a snapshot file, hydrates stores, and marks it unsaved', async () => {
    seedProject();
    const snapshot = buildDocumentSnapshot({ activeHub });
    resetStores();
    const persistence = makePersistence({
      importFromFile: vi.fn(async () => ({
        kind: 'document-snapshot',
        file: {
          kind: 'variscout.document',
          version: 1,
          exportedAt: '2026-06-01T00:00:00.000Z',
          documentSnapshot: snapshot,
        },
      })),
    });
    const { result } = renderHook(() => useProjectActions(persistence));

    await act(async () => {
      await result.current.importProject(new File(['{}'], 'snapshot.vrs'));
    });

    expect(useProjectStore.getState()).toMatchObject({
      rawData: [
        { Machine: 'A', Weight: 10 },
        { Machine: 'B', Weight: 20 },
      ],
      outcome: 'Weight',
      projectId: null,
      projectName: 'snapshot',
      hasUnsavedChanges: true,
    });
  });
});
