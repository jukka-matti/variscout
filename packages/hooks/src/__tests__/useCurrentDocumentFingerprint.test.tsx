import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  getAnalyzeInitialState,
  getImprovementProjectInitialState,
  getProjectInitialState,
  useAnalyzeStore,
  useCanvasStore,
  useImprovementProjectStore,
  useProjectStore,
} from '@variscout/stores';
import { useCurrentDocumentFingerprint } from '../useCurrentDocumentFingerprint';

const now = 1_714_000_000_000;

function resetStores() {
  useProjectStore.setState(getProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasStore.setState(useCanvasStore.getInitialState());
  useImprovementProjectStore.setState(getImprovementProjectInitialState());
}

function makeHub(overrides: Partial<ProcessHub> = {}): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Paint line',
    createdAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function makeProject(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'draft',
    metadata: { title: 'Reduce rework' },
    goal: { freeText: 'Raise first-pass yield.' },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  resetStores();
});

describe('useCurrentDocumentFingerprint', () => {
  it('returns a stable fingerprint for the initial empty document', () => {
    const { result, rerender } = renderHook(() => useCurrentDocumentFingerprint(null));
    const initial = result.current;

    rerender();

    expect(result.current).toBe(initial);
    expect(initial.length).toBeGreaterThan(0);
  });

  it('updates when the Project store changes', () => {
    const { result } = renderHook(() => useCurrentDocumentFingerprint(null));
    const initial = result.current;

    act(() => {
      useProjectStore.getState().setProjectName('Baseline capability study');
    });

    expect(result.current).not.toBe(initial);
  });

  it('updates when the Analyze store changes', () => {
    const { result } = renderHook(() => useCurrentDocumentFingerprint(null));
    const initial = result.current;

    act(() => {
      useAnalyzeStore.getState().loadAnalyzeState({
        findings: [
          {
            id: 'finding-1',
            text: 'Machine B runs high.',
            evidenceType: 'data',
            status: 'observed',
            context: { activeFilters: {}, cumulativeScope: null, stats: { samples: 2 } },
            comments: [],
            statusChangedAt: now,
            investigationId: 'inv-1',
            createdAt: now,
            deletedAt: null,
          },
        ],
      });
    });

    expect(result.current).not.toBe(initial);
  });

  it('updates when the Canvas document changes', () => {
    const { result } = renderHook(() => useCurrentDocumentFingerprint(null));
    const initial = result.current;

    act(() => {
      useCanvasStore.getState().hydrateCanvasDocument({
        canonicalMap: {
          version: 1,
          nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
          tributaries: [],
          assignments: {},
          arrows: [],
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
        canonicalMapVersion: 'canvas-map-custom',
      });
    });

    expect(result.current).not.toBe(initial);
  });

  it('updates when the active hub Improvement Project changes', () => {
    const activeHub = makeHub();
    const { result } = renderHook(() => useCurrentDocumentFingerprint(activeHub));
    const initial = result.current;

    act(() => {
      useImprovementProjectStore.getState().upsertProject(makeProject());
    });

    expect(result.current).not.toBe(initial);
  });
});
