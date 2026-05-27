import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  ControlHandoff,
  EvidenceSnapshot,
  RowProvenanceTag,
  ControlRecord,
} from '@variscout/core';
import type { ProcessHub } from '@variscout/core/processHub';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';

const NOW = 1_746_352_800_000;

function makeHub(id: string): ProcessHub {
  return {
    id,
    name: `Hub ${id}`,
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeRecord(
  id: string,
  hubId: string,
  overrides: Partial<ControlRecord> = {}
): ControlRecord {
  return {
    id,
    title: 'Hold improved fill weight',
    investigationId: 'inv-1',
    hubId,
    cadence: 'weekly',
    status: 'pending',
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function makeSnapshot(
  id: string,
  hubId: string,
  overrides: Partial<EvidenceSnapshot> = {}
): EvidenceSnapshot {
  return {
    id,
    hubId,
    sourceId: 'source-1',
    capturedAt: '2026-05-12T00:00:00.000Z',
    rowCount: 10,
    origin: 'paste',
    importedAt: NOW,
    createdAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function makeTag(id: string): RowProvenanceTag {
  return {
    id,
    snapshotId: '',
    rowKey: '0',
    source: 'source-1',
    joinKey: 'batch',
    createdAt: NOW,
    deletedAt: null,
  };
}

beforeEach(async () => {
  await Promise.all([
    db.hubs.clear(),
    db.controlRecords.clear(),
    db.controlReviews.clear(),
    db.controlHandoffs.clear(),
    db.evidenceSnapshots.clear(),
    db.rowProvenance.clear(),
  ]);
});

afterEach(async () => {
  await Promise.all([
    db.hubs.clear(),
    db.controlRecords.clear(),
    db.controlReviews.clear(),
    db.controlHandoffs.clear(),
    db.evidenceSnapshots.clear(),
    db.rowProvenance.clear(),
  ]);
});

describe('applyAction — sustainment records', () => {
  it('creates, updates, archives, and persists tick evaluations', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-1') });
    const record = makeRecord('record-1', 'hub-1');

    await applyAction(db, { kind: 'SUSTAINMENT_RECORD_CREATE', hubId: 'hub-1', record });
    await applyAction(db, {
      kind: 'SUSTAINMENT_RECORD_UPDATE',
      recordId: 'record-1',
      patch: { targetSummary: 'Cpk >= 1.33' },
    });
    await applyAction(db, {
      kind: 'SUSTAINMENT_TICK_EVALUATED',
      record: { ...record, consecutiveOnTargetTicks: 1, lastEvaluatedSnapshotId: 'snapshot-1' },
      review: {
        id: 'review-1',
        recordId: 'record-1',
        investigationId: 'inv-1',
        hubId: 'hub-1',
        reviewedAt: NOW,
        reviewer: { displayName: 'System' },
        verdict: 'holding',
        snapshotId: 'snapshot-1',
        createdAt: NOW,
        deletedAt: null,
      },
    });
    await applyAction(db, { kind: 'SUSTAINMENT_RECORD_ARCHIVE', recordId: 'record-1' });

    const stored = await db.controlRecords.get('record-1');
    expect(stored?.targetSummary).toBe('Cpk >= 1.33');
    expect(stored?.lastEvaluatedSnapshotId).toBe('snapshot-1');
    expect(stored?.deletedAt).toEqual(expect.any(Number));
    expect(await db.controlReviews.get('review-1')).toMatchObject({
      recordId: 'record-1',
      verdict: 'holding',
    });
  });

  it('rejects create payloads whose record hubId does not match the action hubId', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-guard') });

    await expect(
      applyAction(db, {
        kind: 'SUSTAINMENT_RECORD_CREATE',
        hubId: 'hub-guard',
        record: makeRecord('record-mismatch', 'other-hub'),
      })
    ).rejects.toThrow(/hubId mismatch/);

    expect(await db.controlRecords.get('record-mismatch')).toBeUndefined();
  });

  it('evaluates live records when evidence snapshots are added', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-2') });
    await applyAction(db, {
      kind: 'SUSTAINMENT_RECORD_CREATE',
      hubId: 'hub-2',
      record: makeRecord('record-2', 'hub-2', { consecutiveOnTargetTicks: 3 }),
    });

    await applyAction(db, {
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-2',
      snapshot: makeSnapshot('snapshot-green', 'hub-2', {
        latestSignals: [
          {
            id: 'signal-green',
            label: 'Cpk',
            value: 1.41,
            severity: 'green',
            capturedAt: '2026-05-12T00:00:00.000Z',
          },
        ],
      }),
      provenance: [makeTag('tag-1')],
    });

    const record = await db.controlRecords.get('record-2');
    expect(record?.status).toBe('confirmed-sustained');
    expect(record?.consecutiveOnTargetTicks).toBe(4);
    expect(record?.lastEvaluatedSnapshotId).toBe('snapshot-green');
    const reviews = await db.controlReviews.where('recordId').equals('record-2').toArray();
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({ snapshotId: 'snapshot-green', verdict: 'holding' });
    expect(await db.rowProvenance.where('snapshotId').equals('snapshot-green').count()).toBe(1);
  });
});

function makeHandoff(
  id: string,
  hubId: string,
  overrides: Partial<ControlHandoff> = {}
): ControlHandoff {
  return {
    id,
    investigationId: 'inv-1',
    hubId,
    status: 'pending',
    surface: 'qms-procedure',
    systemName: 'QMS-42',
    operationalOwner: { displayName: 'Process owner' },
    handoffDate: NOW,
    description: 'Control handoff',
    retainControlReview: true,
    recordedBy: { displayName: 'Analyst' },
    createdAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

describe('applyAction — control handoffs', () => {
  it('creates, updates, acknowledges, signs off, marks operational, and archives handoffs', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-handoff') });

    await applyAction(db, {
      kind: 'CONTROL_HANDOFF_CREATE',
      hubId: 'hub-handoff',
      handoff: makeHandoff('handoff-1', 'hub-handoff'),
    });
    await applyAction(db, {
      kind: 'CONTROL_HANDOFF_UPDATE',
      handoffId: 'handoff-1',
      patch: { escalationPath: 'Escalate to manager', reactionPlan: 'Return to standard work' },
    });
    await applyAction(db, {
      kind: 'CONTROL_HANDOFF_ACKNOWLEDGE',
      handoffId: 'handoff-1',
      acknowledgedAt: NOW + 1,
      acknowledgedBy: { displayName: 'Process owner' },
      notes: 'Accepted',
    });
    await applyAction(db, {
      kind: 'CONTROL_HANDOFF_SIGNOFF',
      handoffId: 'handoff-1',
      signoff: { approvedAt: NOW + 2, approvedBy: { displayName: 'Sponsor' } },
    });
    await applyAction(db, {
      kind: 'CONTROL_HANDOFF_MARK_OPERATIONAL',
      handoffId: 'handoff-1',
      operationalAt: NOW + 3,
    });
    await applyAction(db, { kind: 'CONTROL_HANDOFF_ARCHIVE', handoffId: 'handoff-1' });

    const stored = await db.controlHandoffs.get('handoff-1');
    expect(stored).toMatchObject({
      status: 'operational',
      escalationPath: 'Escalate to manager',
      reactionPlan: 'Return to standard work',
      acknowledgedAt: NOW + 1,
      operationalAt: NOW + 3,
      ownerAcknowledgement: {
        acknowledgedBy: { displayName: 'Process owner' },
        notes: 'Accepted',
      },
      signoff: { approvedAt: NOW + 2, approvedBy: { displayName: 'Sponsor' } },
    });
    expect(stored?.deletedAt).toEqual(expect.any(Number));
  });

  it('rejects create payloads whose handoff hubId does not match the action hubId', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-guard') });

    await expect(
      applyAction(db, {
        kind: 'CONTROL_HANDOFF_CREATE',
        hubId: 'hub-guard',
        handoff: makeHandoff('handoff-mismatch', 'other-hub'),
      })
    ).rejects.toThrow(/hubId mismatch/);

    expect(await db.controlHandoffs.get('handoff-mismatch')).toBeUndefined();
  });
});
