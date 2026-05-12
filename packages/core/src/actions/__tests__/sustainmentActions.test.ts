import { describe, expect, it } from 'vitest';
import type { HubAction } from '../HubAction';
import type { SustainmentAction } from '../sustainmentActions';

describe('SustainmentAction', () => {
  it('covers all sustainment action kinds and is included in HubAction', () => {
    const create: SustainmentAction = {
      kind: 'SUSTAINMENT_RECORD_CREATE',
      hubId: 'hub-1',
      record: {
        id: 'sustainment-1',
        title: 'Hold improved fill weight',
        investigationId: 'inv-1',
        hubId: 'hub-1',
        cadence: 'weekly',
        status: 'pending',
        consecutiveOnTargetTicks: 0,
        hasOverride: false,
        lastEvaluatedSnapshotId: undefined,
        createdAt: 1_746_352_800_000,
        updatedAt: 1_746_352_800_000,
        deletedAt: null,
      },
    };
    const update: SustainmentAction = {
      kind: 'SUSTAINMENT_RECORD_UPDATE',
      recordId: 'sustainment-1',
      patch: { targetSummary: 'Cpk >= 1.33' },
    };
    const archive: SustainmentAction = {
      kind: 'SUSTAINMENT_RECORD_ARCHIVE',
      recordId: 'sustainment-1',
    };
    const confirm: SustainmentAction = {
      kind: 'SUSTAINMENT_CONFIRM',
      recordId: 'sustainment-1',
    };
    const drifted: SustainmentAction = {
      kind: 'SUSTAINMENT_MARK_DRIFTED',
      recordId: 'sustainment-1',
    };
    const tick: SustainmentAction = {
      kind: 'SUSTAINMENT_TICK_EVALUATED',
      record: create.record,
      review: {
        id: 'review-1',
        recordId: 'sustainment-1',
        investigationId: 'inv-1',
        hubId: 'hub-1',
        reviewedAt: 1_746_352_800_000,
        reviewer: { displayName: 'System' },
        verdict: 'holding',
        snapshotId: 'snapshot-1',
        createdAt: 1_746_352_800_000,
        deletedAt: null,
      },
    };

    const actions: HubAction[] = [create, update, archive, confirm, drifted, tick];

    expect(actions.map(action => action.kind)).toEqual([
      'SUSTAINMENT_RECORD_CREATE',
      'SUSTAINMENT_RECORD_UPDATE',
      'SUSTAINMENT_RECORD_ARCHIVE',
      'SUSTAINMENT_CONFIRM',
      'SUSTAINMENT_MARK_DRIFTED',
      'SUSTAINMENT_TICK_EVALUATED',
    ]);
  });
});
