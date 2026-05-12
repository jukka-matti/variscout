import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { EvidenceSnapshot, RowProvenanceTag, SustainmentRecord } from '@variscout/core';
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
  overrides: Partial<SustainmentRecord> = {}
): SustainmentRecord {
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
    db.sustainmentRecords.clear(),
    db.sustainmentReviews.clear(),
    db.evidenceSnapshots.clear(),
    db.rowProvenance.clear(),
  ]);
});

afterEach(async () => {
  await Promise.all([
    db.hubs.clear(),
    db.sustainmentRecords.clear(),
    db.sustainmentReviews.clear(),
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

    const stored = await db.sustainmentRecords.get('record-1');
    expect(stored?.targetSummary).toBe('Cpk >= 1.33');
    expect(stored?.lastEvaluatedSnapshotId).toBe('snapshot-1');
    expect(stored?.deletedAt).toEqual(expect.any(Number));
    expect(await db.sustainmentReviews.get('review-1')).toMatchObject({
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

    expect(await db.sustainmentRecords.get('record-mismatch')).toBeUndefined();
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

    const record = await db.sustainmentRecords.get('record-2');
    expect(record?.status).toBe('confirmed-sustained');
    expect(record?.consecutiveOnTargetTicks).toBe(4);
    expect(record?.lastEvaluatedSnapshotId).toBe('snapshot-green');
    const reviews = await db.sustainmentReviews.where('recordId').equals('record-2').toArray();
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({ snapshotId: 'snapshot-green', verdict: 'holding' });
    expect(await db.rowProvenance.where('snapshotId').equals('snapshot-green').count()).toBe(1);
  });
});
