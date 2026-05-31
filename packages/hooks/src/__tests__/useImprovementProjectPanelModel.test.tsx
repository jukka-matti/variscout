import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import type { HubRepository } from '@variscout/core/persistence';
import type { Hypothesis } from '@variscout/core/findings';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  getAnalyzeInitialState,
  getImprovementProjectInitialState,
  useAnalyzeStore,
  useImprovementProjectStore,
} from '@variscout/stores';
import { RETURN_NAVIGATION_STORAGE_KEY } from '../useReturnNavigation';
import { useImprovementProjectPanelModel } from '../useImprovementProjectPanelModel';

type ProjectRepository = Pick<HubRepository, 'dispatch'>;

function makeRepository(): ProjectRepository {
  return {
    dispatch: vi.fn().mockResolvedValue(undefined),
  };
}

function makeOutcome(overrides: Partial<OutcomeSpec> = {}): OutcomeSpec {
  return {
    id: 'outcome-1',
    hubId: 'hub-1',
    columnName: 'First pass yield',
    characteristicType: 'largerIsBetter',
    target: 98,
    createdAt: 1_714_000_000_000,
    deletedAt: null,
    ...overrides,
  };
}

function makeProject(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'draft',
    metadata: {
      title: 'Reduce rework',
      businessCase: 'Reduce first-pass escapes.',
    },
    goal: {
      outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }],
      freeText: 'Raise first pass yield.',
    },
    sections: {
      background: { manualNarrative: 'Current rework is high.' },
      investigationLineage: { hypothesisIds: ['h-0'] },
      approach: { narrative: 'Stabilize nozzle temp.' },
      outcomeReference: { snapshotText: 'Baseline Cpk 0.9.' },
    },
    signoff: { requestedAt: 1_714_000_000_000 },
    createdAt: 1_714_000_000_000,
    updatedAt: 1_714_000_000_000,
    deletedAt: null,
    ...overrides,
  };
}

function makeHub(overrides: Partial<ProcessHub> = {}): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Paint line',
    createdAt: 1_714_000_000_000,
    deletedAt: null,
    outcomes: [makeOutcome()],
    ...overrides,
  };
}

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h-1',
    name: 'Nozzle wear',
    status: 'evidenced',
    synthesis: '',
    findingIds: [],
    investigationId: 'inv-1',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
  window.sessionStorage.clear();
  useImprovementProjectStore.setState(getImprovementProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
});

describe('useImprovementProjectPanelModel', () => {
  it('does not dispatch without an active hub', () => {
    const repository = makeRepository();

    const { result } = renderHook(() =>
      useImprovementProjectPanelModel({ activeHub: undefined, repository })
    );

    expect(result.current.heading).toBe('No active hub');
    expect(result.current.projects).toEqual([]);
    expect(result.current.selectedProject).toBeNull();
    expect(result.current.outcomes).toEqual([]);
    expect(repository.dispatch).not.toHaveBeenCalled();
  });

  it('creates and selects a draft project from the first live outcome', async () => {
    const repository = makeRepository();
    const hub = makeHub();

    const { result } = renderHook(() =>
      useImprovementProjectPanelModel({ activeHub: hub, repository })
    );

    await waitFor(() => expect(repository.dispatch).toHaveBeenCalledTimes(1));
    expect(repository.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'IMPROVEMENT_PROJECT_CREATE',
        hubId: 'hub-1',
        project: expect.objectContaining({
          hubId: 'hub-1',
          status: 'draft',
          metadata: { title: 'Improve First pass yield' },
          goal: {
            outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 98 }],
            freeText: 'Draft outcome target for First pass yield.',
          },
          sections: {
            background: {},
            investigationLineage: {},
            approach: {},
            outcomeReference: {},
          },
          createdAt: 1_800_000_000_000,
          updatedAt: 1_800_000_000_000,
          deletedAt: null,
        }),
      })
    );
    await waitFor(() =>
      expect(result.current.selectedProject?.metadata.title).toBe('Improve First pass yield')
    );
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-1')).toEqual(
      result.current.selectedProject
    );
  });

  it('creates a fallback draft when the hub has no live outcomes', async () => {
    const repository = makeRepository();
    const hub = makeHub({ outcomes: [makeOutcome({ deletedAt: 1_800_000_000_000 })] });

    const { result } = renderHook(() =>
      useImprovementProjectPanelModel({ activeHub: hub, repository })
    );

    await waitFor(() =>
      expect(result.current.selectedProject?.metadata.title).toBe(
        'Improvement project for Paint line'
      )
    );
    expect(result.current.selectedProject?.goal).toEqual({
      outcomeGoals: [{ outcomeSpecId: 'hub-1:draft-outcome', target: 1 }],
      freeText: 'Draft outcome target to define during framing.',
    });
    expect(result.current.outcomes).toEqual([]);
  });

  it('hydrates and selects an existing live project without creating', async () => {
    const repository = makeRepository();
    const project = makeProject();
    const hub = makeHub({ improvementProject: project });

    const { result } = renderHook(() =>
      useImprovementProjectPanelModel({ activeHub: hub, repository })
    );

    await waitFor(() => expect(result.current.selectedProject?.id).toBe('ip-1'));
    expect(repository.dispatch).not.toHaveBeenCalled();
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-1')).toEqual(project);
  });

  it('treats a deleted project as absent and creates a new draft', async () => {
    const repository = makeRepository();
    const hub = makeHub({
      improvementProject: makeProject({ deletedAt: 1_800_000_000_000 }),
    });

    const { result } = renderHook(() =>
      useImprovementProjectPanelModel({ activeHub: hub, repository })
    );

    await waitFor(() => expect(repository.dispatch).toHaveBeenCalledTimes(1));
    expect(result.current.selectedProject?.deletedAt).toBeNull();
    expect(result.current.selectedProject?.metadata.title).toBe('Improve First pass yield');
  });

  it('optimistically deep-merges project patches and dispatches the repository update', async () => {
    const repository = makeRepository();
    const project = makeProject();
    const hub = makeHub({ improvementProject: project });

    const { result } = renderHook(() =>
      useImprovementProjectPanelModel({ activeHub: hub, repository })
    );

    await waitFor(() => expect(result.current.selectedProject?.id).toBe('ip-1'));

    act(() =>
      result.current.updateSelectedProject({
        metadata: { title: 'Updated project' },
        goal: { freeText: 'Updated goal.' },
        sections: {
          background: { snapshottedAt: '2026-05-31T00:00:00.000Z' },
          approach: { actionItemIds: ['action-1'] },
        },
        signoff: { approvedAt: 1_800_000_000_000 },
      })
    );

    const stored = useImprovementProjectStore.getState().getProjectForHub('hub-1');
    expect(stored).toMatchObject({
      metadata: {
        title: 'Updated project',
        businessCase: 'Reduce first-pass escapes.',
      },
      goal: {
        outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }],
        freeText: 'Updated goal.',
      },
      sections: {
        background: {
          manualNarrative: 'Current rework is high.',
          snapshottedAt: '2026-05-31T00:00:00.000Z',
        },
        investigationLineage: { hypothesisIds: ['h-0'] },
        approach: {
          narrative: 'Stabilize nozzle temp.',
          actionItemIds: ['action-1'],
        },
        outcomeReference: { snapshotText: 'Baseline Cpk 0.9.' },
      },
      signoff: {
        requestedAt: 1_714_000_000_000,
        approvedAt: 1_800_000_000_000,
      },
      updatedAt: 1_800_000_000_000,
    });
    await waitFor(() =>
      expect(repository.dispatch).toHaveBeenCalledWith({
        kind: 'IMPROVEMENT_PROJECT_UPDATE',
        projectId: 'ip-1',
        patch: expect.objectContaining({
          metadata: {
            title: 'Updated project',
            businessCase: 'Reduce first-pass escapes.',
          },
          goal: {
            outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }],
            freeText: 'Updated goal.',
          },
          sections: {
            background: { snapshottedAt: '2026-05-31T00:00:00.000Z' },
            approach: { actionItemIds: ['action-1'] },
          },
          signoff: {
            requestedAt: 1_714_000_000_000,
            approvedAt: 1_800_000_000_000,
          },
        }),
      })
    );
  });

  it('sets current create and update error messages on repository failures', async () => {
    const createRepository = makeRepository();
    vi.mocked(createRepository.dispatch).mockRejectedValue(new Error('create failed'));

    const created = renderHook(() =>
      useImprovementProjectPanelModel({ activeHub: makeHub(), repository: createRepository })
    );

    await waitFor(() =>
      expect(created.result.current.error).toBe('Could not create a Project draft.')
    );
    created.unmount();

    const updateRepository = makeRepository();
    vi.mocked(updateRepository.dispatch).mockRejectedValue(new Error('update failed'));
    const updateHub = makeHub({ improvementProject: makeProject() });

    const updated = renderHook(() =>
      useImprovementProjectPanelModel({ activeHub: updateHub, repository: updateRepository })
    );

    await waitFor(() => expect(updated.result.current.selectedProject?.id).toBe('ip-1'));

    act(() => updated.result.current.updateSelectedProject({ metadata: { title: 'Updated' } }));

    await waitFor(() =>
      expect(updated.result.current.error).toBe('Could not save the Project changes.')
    );
  });

  it('writes the return target and opens the wall for lineage navigation', async () => {
    const repository = makeRepository();
    const onOpenWall = vi.fn();
    const project = makeProject();
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      hypotheses: [makeHypothesis()],
    });

    const { result } = renderHook(() =>
      useImprovementProjectPanelModel({
        activeHub: makeHub({ improvementProject: project }),
        repository,
        onOpenWall,
      })
    );

    await waitFor(() => expect(result.current.hypotheses.map(h => h.id)).toEqual(['h-1']));

    act(() => result.current.handleLineageNavigate({ kind: 'hypothesis', id: 'h-1' }));

    expect(onOpenWall).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY) ?? '')).toEqual(
      expect.objectContaining({
        sourceSurface: 'improvement-project',
        params: { projectId: 'ip-1', targetKind: 'hypothesis', targetId: 'h-1' },
        uiState: { section: 'lineage' },
      })
    );
  });
});
