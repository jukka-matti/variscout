import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ProcessHub } from '@variscout/core';
import {
  getAnalyzeInitialState,
  getProjectInitialState,
  useAnalyzeStore,
  useProjectStore,
  type DocumentSnapshot,
} from '@variscout/stores';
import { useProjectActions } from '../useProjectActions';
import type { PersistenceAdapter, SavedProject } from '../types';

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Hub 1',
  createdAt: 1,
  deletedAt: null,
};

function resetStores() {
  useProjectStore.setState(getProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
}

function makeAdapter(): PersistenceAdapter {
  const storage = new Map<string, SavedProject>();
  return {
    saveProject: vi.fn(async (name: string, state: DocumentSnapshot) => {
      const saved: SavedProject = {
        id: name,
        name,
        state,
        savedAt: '2026-06-01T00:00:00.000Z',
        rowCount: state.project.rawData.length,
      };
      storage.set(name, saved);
      return saved;
    }),
    loadProject: vi.fn(async (id: string) => storage.get(id)),
    listProjects: vi.fn(async () => Array.from(storage.values())),
    deleteProject: vi.fn(async id => {
      storage.delete(id);
    }),
    renameProject: vi.fn(async (id, nextName) => {
      const saved = storage.get(id);
      if (!saved) return;
      storage.delete(id);
      storage.set(nextName, { ...saved, id: nextName, name: nextName });
    }),
    exportToFile: vi.fn(),
    importFromFile: vi.fn(),
  };
}

beforeEach(() => {
  resetStores();
});

describe('useProjectActions document snapshot roundtrip', () => {
  it('roundtrips filterStack and flat filters exactly through DocumentSnapshot save/load', async () => {
    const filterStack = [
      { column: 'Machine', values: ['A'] },
      { column: 'Line', values: ['L1', 'L2'] },
    ];
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ Machine: 'A', Line: 'L1', Weight: 10 }],
      outcome: 'Weight',
      factors: ['Machine', 'Line'],
      filters: { Machine: ['A'], Line: ['L1', 'L2'] },
      filterStack,
    });
    const adapter = makeAdapter();
    const { result } = renderHook(() => useProjectActions(adapter, { getActiveHub: () => hub }));

    await act(async () => {
      await result.current.saveProject('Roundtrip');
    });
    resetStores();
    await act(async () => {
      await result.current.loadProject('Roundtrip');
    });

    expect(useProjectStore.getState().filterStack).toEqual(filterStack);
    expect(useProjectStore.getState().filters).toEqual({
      Machine: ['A'],
      Line: ['L1', 'L2'],
    });
  });
});
