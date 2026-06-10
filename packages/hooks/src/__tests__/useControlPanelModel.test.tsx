import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HubRepository } from '@variscout/core/persistence';
import type { ControlRecord, ControlReview, ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { useControlPanelModel } from '../useControlPanelModel';

type ControlRepository = Pick<HubRepository, 'dispatch' | 'controlRecords' | 'controlReviews'>;

function makeProject(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'closed',
    metadata: { title: 'Reduce defects', projectId: 'inv-1' },
    goal: {
      outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 98 }],
      freeText: 'Hold first pass yield at 98%.',
    },
    sections: {
      background: {},
      approach: { actionItemIds: ['action-1'] },
      outcomeReference: {},
    },
    createdAt: 1_714_000_000_000,
    updatedAt: 1_714_000_000_000,
    deletedAt: null,
    ...overrides,
  };
}

function makeHub(
  project: ImprovementProject | undefined = makeProject(),
  overrides: Partial<ProcessHub> = {}
): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Paint line',
    createdAt: 1_714_000_000_000,
    deletedAt: null,
    outcomes: [
      {
        id: 'outcome-1',
        hubId: 'hub-1',
        columnName: 'first_pass_yield',
        characteristicType: 'largerIsBetter',
        target: 98,
        createdAt: 1_714_000_000_000,
        deletedAt: null,
      },
    ],
    ...(project ? { improvementProject: project } : {}),
    ...overrides,
  };
}

function makeRecord(overrides: Partial<ControlRecord> = {}): ControlRecord {
  return {
    id: 'sr-1',
    hubId: 'hub-1',
    projectId: 'inv-1',
    status: 'verifying',
    title: 'Existing sustainment',
    lastEvaluatedSnapshotId: undefined,
    improvementDate: '2026-06-01T00:00:00.000Z',
    baseline: {
      capturedAt: 1_714_000_000_000,
      window: {
        startISO: '2026-04-01T00:00:00.000Z',
        endISO: '2026-05-31T23:59:59.999Z',
      },
      measure: 'fill_weight',
      n: 42,
      mean: 100.2,
      sigma: 0.8,
    },
    ladder: [7, 30, 90, 180],
    ladderStep: 0,
    nextCheckSuggestedAt: '2026-06-08T00:00:00.000Z',
    createdAt: 1_714_000_000_000,
    updatedAt: 1_714_000_000_000,
    deletedAt: null,
    ...overrides,
  };
}

function makeReview(overrides: Partial<ControlReview> = {}): ControlReview {
  return {
    id: 'review-1',
    recordId: 'sr-1',
    hubId: 'hub-1',
    projectId: 'inv-1',
    reviewedAt: 1_714_000_000_000,
    reviewer: { displayName: 'Reviewer' },
    verdict: 'holding',
    nowStats: {
      window: {
        startISO: '2026-06-01T00:00:00.000Z',
        endISO: '2026-06-30T23:59:59.999Z',
      },
      n: 12,
      mean: 100.8,
      sigma: 0.9,
    },
    dataStamp: { rowCount: 64, snapshotId: 'snapshot-1' },
    createdAt: 1_714_000_000_000,
    deletedAt: null,
    ...overrides,
  };
}

function makeRepository(): ControlRepository {
  return {
    dispatch: vi.fn().mockResolvedValue(undefined),
    controlRecords: {
      get: vi.fn(),
      listByHub: vi.fn().mockResolvedValue([]),
    },
    controlReviews: {
      get: vi.fn(),
      listByHub: vi.fn(),
      listByRecord: vi.fn().mockResolvedValue([]),
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
});

describe('useControlPanelModel', () => {
  it('does not call the repository without an active hub', () => {
    const repository = makeRepository();

    const { result } = renderHook(() => useControlPanelModel({ activeHub: undefined, repository }));

    expect(result.current.heading).toBe('No active hub');
    expect(result.current.selectedRecord).toBeNull();
    expect(result.current.records).toEqual([]);
    expect(result.current.reviews).toEqual([]);
    expect(result.current.isLoadingRecords).toBe(false);
    expect(repository.controlRecords.listByHub).not.toHaveBeenCalled();
    expect(repository.controlReviews.listByRecord).not.toHaveBeenCalled();
    expect(repository.dispatch).not.toHaveBeenCalled();
  });

  it('creates a sustainment record when the repository has no live records', async () => {
    const repository = makeRepository();
    const hub = makeHub();

    const { result } = renderHook(() => useControlPanelModel({ activeHub: hub, repository }));

    await waitFor(() => expect(repository.dispatch).toHaveBeenCalledTimes(1));
    expect(repository.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'SUSTAINMENT_RECORD_CREATE',
        hubId: 'hub-1',
        record: expect.objectContaining({
          hubId: 'hub-1',
          projectId: 'inv-1',
          improvementProjectId: 'ip-1',
          title: 'Sustain Reduce defects',
          goal: expect.objectContaining({ freeText: 'Hold first pass yield at 98%.' }),
          targetSummary: 'Hold first pass yield at 98%.',
          status: 'verifying',
          improvementDate: '2027-01-15T08:00:00.000Z',
          baseline: expect.objectContaining({ measure: 'first_pass_yield' }),
          ladder: [7, 30, 90, 180],
          ladderStep: 0,
          nextCheckSuggestedAt: '2027-01-22T08:00:00.000Z',
          lastEvaluatedSnapshotId: undefined,
          createdAt: 1_800_000_000_000,
          updatedAt: 1_800_000_000_000,
          deletedAt: null,
        }),
      })
    );
    await waitFor(() =>
      expect(result.current.selectedRecord?.title).toBe('Sustain Reduce defects')
    );
  });

  it('defaults the draft measure to the outcome column when id and column differ', async () => {
    const repository = makeRepository();
    const hub = makeHub(makeProject());

    renderHook(() => useControlPanelModel({ activeHub: hub, repository }));

    await waitFor(() => expect(repository.dispatch).toHaveBeenCalledTimes(1));
    expect(repository.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'SUSTAINMENT_RECORD_CREATE',
        record: expect.objectContaining({
          baseline: expect.objectContaining({ measure: 'first_pass_yield' }),
        }),
      })
    );
  });

  it('selects an existing live record, skips creation, and loads live reviews', async () => {
    const repository = makeRepository();
    const record = makeRecord();
    const review = makeReview();
    const deletedReview = makeReview({ id: 'review-deleted', deletedAt: 1_800_000_000_000 });
    vi.mocked(repository.controlRecords.listByHub).mockResolvedValue([record]);
    vi.mocked(repository.controlReviews.listByRecord).mockResolvedValue([review, deletedReview]);
    const hub = makeHub();

    const { result } = renderHook(() => useControlPanelModel({ activeHub: hub, repository }));

    await waitFor(() => expect(result.current.selectedRecord?.id).toBe('sr-1'));
    await waitFor(() => expect(result.current.reviews.map(r => r.id)).toEqual(['review-1']));
    expect(repository.dispatch).not.toHaveBeenCalled();
    expect(repository.controlReviews.listByRecord).toHaveBeenCalledWith('hub-1', 'sr-1');
  });

  it('prefers targetId matches and otherwise waits for explicit record selection', async () => {
    const repository = makeRepository();
    const first = makeRecord({ id: 'sr-1', title: 'First', improvementProjectId: 'ip-first' });
    const second = makeRecord({ id: 'sr-2', title: 'Second', improvementProjectId: 'ip-second' });
    vi.mocked(repository.controlRecords.listByHub).mockResolvedValue([first, second]);
    vi.mocked(repository.controlReviews.listByRecord).mockImplementation(
      async (_hubId, recordId) => [makeReview({ id: `review-${recordId}`, recordId })]
    );
    const hub = makeHub();

    const targeted = renderHook(() =>
      useControlPanelModel({ activeHub: hub, targetId: 'ip-second', repository })
    );

    await waitFor(() => expect(targeted.result.current.selectedRecord?.id).toBe('sr-2'));
    await waitFor(() =>
      expect(targeted.result.current.reviews.map(r => r.id)).toEqual(['review-sr-2'])
    );
    targeted.unmount();

    const untargeted = renderHook(() => useControlPanelModel({ activeHub: hub, repository }));

    await waitFor(() => expect(untargeted.result.current.records).toHaveLength(2));
    expect(untargeted.result.current.selectedRecord).toBeNull();

    act(() => untargeted.result.current.selectRecord('sr-1'));

    expect(untargeted.result.current.selectedRecord?.id).toBe('sr-1');
    await waitFor(() =>
      expect(untargeted.result.current.reviews.map(r => r.id)).toEqual(['review-sr-1'])
    );
  });

  it('optimistically updates the selected record and dispatches the patch', async () => {
    const repository = makeRepository();
    vi.mocked(repository.controlRecords.listByHub).mockResolvedValue([makeRecord()]);
    const hub = makeHub();

    const { result } = renderHook(() => useControlPanelModel({ activeHub: hub, repository }));

    await waitFor(() => expect(result.current.selectedRecord?.id).toBe('sr-1'));

    act(() => result.current.updateSelectedRecord({ title: 'Updated sustainment' }));

    expect(result.current.selectedRecord?.title).toBe('Updated sustainment');
    expect(result.current.selectedRecord?.updatedAt).toBe(1_800_000_000_000);
    await waitFor(() =>
      expect(repository.dispatch).toHaveBeenCalledWith({
        kind: 'SUSTAINMENT_RECORD_UPDATE',
        recordId: 'sr-1',
        patch: { title: 'Updated sustainment' },
      })
    );
  });

  it('logs a holding re-check and advances the verification ladder', async () => {
    const repository = makeRepository();
    vi.mocked(repository.controlRecords.listByHub).mockResolvedValue([makeRecord()]);
    const hub = makeHub();

    const { result } = renderHook(() => useControlPanelModel({ activeHub: hub, repository }));

    await waitFor(() => expect(result.current.selectedRecord?.id).toBe('sr-1'));

    act(() =>
      result.current.logRecheck({
        verdict: 'holding',
        observation: 'Still centered.',
        nowStats: {
          window: {
            startISO: '2026-06-01T00:00:00.000Z',
            endISO: '2026-06-14T00:00:00.000Z',
          },
          n: 14,
          mean: 100.4,
          sigma: 0.7,
        },
        dataStamp: {
          rowCount: 56,
          rowTimestampRange: {
            startISO: '2026-04-01T00:00:00.000Z',
            endISO: '2026-06-14T00:00:00.000Z',
          },
        },
      })
    );

    expect(result.current.selectedRecord?.ladderStep).toBe(1);
    expect(result.current.selectedRecord?.nextCheckSuggestedAt).toBe('2027-02-14T08:00:00.000Z');
    expect(result.current.selectedRecord?.status).toBe('verifying');
    await waitFor(() =>
      expect(repository.dispatch).toHaveBeenCalledWith({
        kind: 'SUSTAINMENT_RECHECK_LOGGED',
        record: expect.objectContaining({
          id: 'sr-1',
          ladderStep: 1,
          nextCheckSuggestedAt: '2027-02-14T08:00:00.000Z',
          latestReviewId: expect.any(String),
          latestReviewAt: '2027-01-15T08:00:00.000Z',
        }),
        review: expect.objectContaining({
          id: expect.any(String),
          recordId: 'sr-1',
          verdict: 'holding',
          observation: 'Still centered.',
          nowStats: expect.objectContaining({ n: 14, mean: 100.4, sigma: 0.7 }),
          dataStamp: expect.objectContaining({ rowCount: 56 }),
        }),
      })
    );
  });

  it('runs setup update into a holding re-check round trip', async () => {
    const repository = makeRepository();
    vi.mocked(repository.controlRecords.listByHub).mockResolvedValue([makeRecord()]);
    const hub = makeHub();

    const { result } = renderHook(() => useControlPanelModel({ activeHub: hub, repository }));

    await waitFor(() => expect(result.current.selectedRecord?.id).toBe('sr-1'));

    act(() =>
      result.current.updateSelectedRecord({
        improvementDate: '2026-06-15T00:00:00.000Z',
        baseline: {
          capturedAt: 1_800_000_000_000,
          window: {
            startISO: '2026-05-01T00:00:00.000Z',
            endISO: '2026-06-14T23:59:59.999Z',
          },
          measure: 'first_pass_yield',
          n: 45,
          mean: 98.1,
          sigma: 0.5,
        },
        ladder: [14, 45],
        ladderStep: 0,
        nextCheckSuggestedAt: '2026-06-29T00:00:00.000Z',
      })
    );

    expect(result.current.selectedRecord?.baseline.measure).toBe('first_pass_yield');

    act(() =>
      result.current.logRecheck({
        verdict: 'holding',
        nowStats: {
          window: {
            startISO: '2026-06-15T00:00:00.000Z',
            endISO: '2026-07-01T00:00:00.000Z',
          },
          n: 12,
          mean: 98.3,
          sigma: 0.4,
        },
        dataStamp: { rowCount: 57 },
      })
    );

    expect(result.current.selectedRecord?.ladder).toEqual([14, 45]);
    expect(result.current.selectedRecord?.ladderStep).toBe(1);
    expect(result.current.selectedRecord?.nextCheckSuggestedAt).toBe('2027-03-01T08:00:00.000Z');
    await waitFor(() =>
      expect(repository.dispatch).toHaveBeenCalledWith({
        kind: 'SUSTAINMENT_RECHECK_LOGGED',
        record: expect.objectContaining({
          baseline: expect.objectContaining({ measure: 'first_pass_yield', n: 45 }),
          ladder: [14, 45],
          ladderStep: 1,
        }),
        review: expect.objectContaining({
          verdict: 'holding',
          nowStats: expect.objectContaining({ n: 12, mean: 98.3 }),
        }),
      })
    );
  });

  it('logs a drifted re-check and resets the ladder', async () => {
    const repository = makeRepository();
    vi.mocked(repository.controlRecords.listByHub).mockResolvedValue([
      makeRecord({
        ladderStep: 2,
        nextCheckSuggestedAt: '2026-10-01T00:00:00.000Z',
      }),
    ]);
    const hub = makeHub();

    const { result } = renderHook(() => useControlPanelModel({ activeHub: hub, repository }));

    await waitFor(() => expect(result.current.selectedRecord?.id).toBe('sr-1'));

    act(() =>
      result.current.logRecheck({
        verdict: 'drifted',
        observation: 'Recent data moved away from the frozen baseline.',
        nowStats: {
          window: {
            startISO: '2026-06-01T00:00:00.000Z',
            endISO: '2026-06-14T00:00:00.000Z',
          },
          n: 14,
          mean: 103.4,
          sigma: 1.4,
        },
        dataStamp: { rowCount: 56 },
      })
    );

    expect(result.current.selectedRecord?.status).toBe('drifted');
    expect(result.current.selectedRecord?.ladderStep).toBe(0);
    expect(result.current.selectedRecord?.nextCheckSuggestedAt).toBe('2027-01-22T08:00:00.000Z');
    await waitFor(() =>
      expect(repository.dispatch).toHaveBeenCalledWith({
        kind: 'SUSTAINMENT_RECHECK_LOGGED',
        record: expect.objectContaining({
          id: 'sr-1',
          status: 'drifted',
          ladderStep: 0,
          nextCheckSuggestedAt: '2027-01-22T08:00:00.000Z',
        }),
        review: expect.objectContaining({
          verdict: 'drifted',
          observation: 'Recent data moved away from the frozen baseline.',
        }),
      })
    );
  });

  it('falls back to activeHub records and reviews when repository reads fail', async () => {
    const repository = makeRepository();
    const fallbackRecord = makeRecord({ id: 'fallback-record', title: 'Fallback record' });
    const fallbackReview = makeReview({ id: 'fallback-review', recordId: 'fallback-record' });
    vi.mocked(repository.controlRecords.listByHub).mockRejectedValue(new Error('offline'));
    vi.mocked(repository.controlReviews.listByRecord).mockRejectedValue(new Error('offline'));
    const hub = makeHub(undefined, {
      controlRecords: [fallbackRecord],
      controlReviews: [fallbackReview, makeReview({ id: 'other', recordId: 'other' })],
    });

    const { result } = renderHook(() =>
      useControlPanelModel({
        activeHub: hub,
        repository,
      })
    );

    await waitFor(() => expect(result.current.selectedRecord?.id).toBe('fallback-record'));
    await waitFor(() => expect(result.current.reviews.map(r => r.id)).toEqual(['fallback-review']));
  });

  it('sets the current create and update error messages on repository failures', async () => {
    const createRepository = makeRepository();
    vi.mocked(createRepository.controlRecords.listByHub).mockResolvedValue([]);
    vi.mocked(createRepository.dispatch).mockRejectedValue(new Error('create failed'));
    const createHub = makeHub();

    const created = renderHook(() =>
      useControlPanelModel({ activeHub: createHub, repository: createRepository })
    );

    await waitFor(() =>
      expect(created.result.current.error).toBe('Could not create a sustainment record.')
    );
    created.unmount();

    const updateRepository = makeRepository();
    vi.mocked(updateRepository.controlRecords.listByHub).mockResolvedValue([makeRecord()]);
    vi.mocked(updateRepository.dispatch).mockRejectedValue(new Error('update failed'));
    const updateHub = makeHub();

    const updated = renderHook(() =>
      useControlPanelModel({ activeHub: updateHub, repository: updateRepository })
    );

    await waitFor(() => expect(updated.result.current.selectedRecord?.id).toBe('sr-1'));

    act(() => updated.result.current.updateSelectedRecord({ targetSummary: 'Updated target' }));

    await waitFor(() =>
      expect(updated.result.current.error).toBe('Could not save the sustainment record changes.')
    );
  });
});
