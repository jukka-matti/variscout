import { describe, expect, it } from 'vitest';
import type { HubAction } from '../HubAction';
import type { ControlAction } from '../controlActions';

const baseline = {
  capturedAt: 1_746_352_800_000,
  window: {
    startISO: '2026-04-01T00:00:00.000Z',
    endISO: '2026-05-31T23:59:59.999Z',
  },
  measure: 'fill_weight',
  n: 42,
  mean: 100.2,
  sigma: 0.8,
  cpk: 1.42,
};

describe('ControlAction', () => {
  it('covers all sustainment action kinds and is included in HubAction', () => {
    const create: ControlAction = {
      kind: 'SUSTAINMENT_RECORD_CREATE',
      hubId: 'hub-1',
      record: {
        id: 'sustainment-1',
        title: 'Hold improved fill weight',
        projectId: 'inv-1',
        hubId: 'hub-1',
        status: 'verifying',
        improvementDate: '2026-06-01T00:00:00.000Z',
        baseline,
        ladder: [7, 30, 90, 180],
        ladderStep: 0,
        nextCheckSuggestedAt: '2026-06-08T00:00:00.000Z',
        createdAt: 1_746_352_800_000,
        updatedAt: 1_746_352_800_000,
        deletedAt: null,
      },
    };
    const update: ControlAction = {
      kind: 'SUSTAINMENT_RECORD_UPDATE',
      recordId: 'sustainment-1',
      patch: { targetSummary: 'Cpk >= 1.33' },
    };
    const archive: ControlAction = {
      kind: 'SUSTAINMENT_RECORD_ARCHIVE',
      recordId: 'sustainment-1',
    };
    const confirm: ControlAction = {
      kind: 'SUSTAINMENT_CONFIRM',
      recordId: 'sustainment-1',
    };
    const drifted: ControlAction = {
      kind: 'SUSTAINMENT_MARK_DRIFTED',
      recordId: 'sustainment-1',
    };
    const recheck: ControlAction = {
      kind: 'SUSTAINMENT_RECHECK_LOGGED',
      record: create.record,
      review: {
        id: 'review-1',
        recordId: 'sustainment-1',
        projectId: 'inv-1',
        hubId: 'hub-1',
        reviewedAt: 1_746_352_800_000,
        reviewer: { displayName: 'Analyst' },
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
        createdAt: 1_746_352_800_000,
        deletedAt: null,
      },
    };

    const actions: HubAction[] = [create, update, archive, confirm, drifted, recheck];

    expect(actions.map(action => action.kind)).toEqual([
      'SUSTAINMENT_RECORD_CREATE',
      'SUSTAINMENT_RECORD_UPDATE',
      'SUSTAINMENT_RECORD_ARCHIVE',
      'SUSTAINMENT_CONFIRM',
      'SUSTAINMENT_MARK_DRIFTED',
      'SUSTAINMENT_RECHECK_LOGGED',
    ]);
  });

  it('covers simplified control handoff action kinds and includes them in HubAction', () => {
    const actions: HubAction[] = [
      {
        kind: 'CONTROL_HANDOFF_CREATE',
        hubId: 'hub-1',
        handoff: {
          id: 'handoff-1',
          projectId: 'investigation-1',
          hubId: 'hub-1',
          surface: 'qms-procedure',
          systemName: 'QMS-42',
          operationalOwner: { displayName: 'Owner' },
          handoffDate: 1,
          description: 'Control transfer',
          recordedBy: { displayName: 'Analyst' },
          createdAt: 1,
          deletedAt: null,
        },
      },
      {
        kind: 'CONTROL_HANDOFF_UPDATE',
        handoffId: 'handoff-1',
        patch: { escalationPath: 'Escalate to production manager' },
      },
      { kind: 'CONTROL_HANDOFF_ARCHIVE', handoffId: 'handoff-1' },
    ];

    expect(actions.map(action => action.kind)).toEqual([
      'CONTROL_HANDOFF_CREATE',
      'CONTROL_HANDOFF_UPDATE',
      'CONTROL_HANDOFF_ARCHIVE',
    ]);
  });
});
