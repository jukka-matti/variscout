import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  ControlHandoff,
  EvidenceSnapshot,
  ControlRecord,
  ControlReview,
} from '@variscout/core';
import type { ControlBaseline } from '@variscout/core';
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

function makeBaseline(overrides: Partial<ControlBaseline> = {}): ControlBaseline {
  return {
    capturedAt: NOW,
    window: {
      startISO: '2026-04-01T00:00:00.000Z',
      endISO: '2026-05-31T23:59:59.999Z',
    },
    measure: 'fill_weight',
    n: 42,
    mean: 100.2,
    sigma: 0.8,
    cpk: 1.42,
    ...overrides,
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
    projectId: 'inv-1',
    hubId,
    status: 'verifying',
    improvementDate: '2026-06-01T00:00:00.000Z',
    baseline: makeBaseline(),
    ladder: [7, 30, 90, 180],
    ladderStep: 0,
    nextCheckSuggestedAt: '2026-06-08T00:00:00.000Z',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
    lastEvaluatedSnapshotId: overrides.lastEvaluatedSnapshotId ?? undefined,
  };
}

function makeReview(
  record: ControlRecord,
  verdict: ControlReview['verdict'] = 'holding'
): ControlReview {
  return {
    id: 'review-1',
    recordId: record.id,
    projectId: record.projectId,
    hubId: record.hubId,
    reviewedAt: NOW,
    reviewer: { displayName: 'Analyst' },
    verdict,
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
    observation: 'Capability is holding.',
    createdAt: NOW,
    deletedAt: null,
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

beforeEach(async () => {
  await Promise.all([
    db.processHubs.clear(),
    db.controlRecords.clear(),
    db.controlReviews.clear(),
    db.controlHandoffs.clear(),
    db.evidenceSnapshots.clear(),
  ]);
});

afterEach(async () => {
  await Promise.all([
    db.processHubs.clear(),
    db.controlRecords.clear(),
    db.controlReviews.clear(),
    db.controlHandoffs.clear(),
    db.evidenceSnapshots.clear(),
  ]);
});

describe('applyAction (Azure) — sustainment records', () => {
  it('creates, updates, archives, and persists analyst re-checks', async () => {
    await db.processHubs.put(makeHub('hub-1'));
    const record = makeRecord('record-1', 'hub-1');
    const updatedRecord = {
      ...record,
      ladderStep: 1,
      nextCheckSuggestedAt: '2026-07-01T00:00:00.000Z',
      latestReviewAt: new Date(NOW).toISOString(),
      latestReviewId: 'review-1',
      updatedAt: NOW,
    };

    await applyAction({ kind: 'SUSTAINMENT_RECORD_CREATE', hubId: 'hub-1', record });
    await applyAction({
      kind: 'SUSTAINMENT_RECORD_UPDATE',
      recordId: 'record-1',
      patch: { targetSummary: 'Cpk >= 1.33' },
    });
    await applyAction({
      kind: 'SUSTAINMENT_RECHECK_LOGGED',
      record: updatedRecord,
      review: makeReview(updatedRecord),
    });
    await applyAction({ kind: 'SUSTAINMENT_RECORD_ARCHIVE', recordId: 'record-1' });

    const stored = await db.controlRecords.get('record-1');
    expect(stored).toMatchObject({
      targetSummary: 'Cpk >= 1.33',
      ladderStep: 1,
      nextCheckSuggestedAt: '2026-07-01T00:00:00.000Z',
      latestReviewId: 'review-1',
      deletedAt: expect.any(Number),
    });
    expect(await db.controlReviews.get('review-1')).toMatchObject({
      recordId: 'record-1',
      verdict: 'holding',
      dataStamp: { rowCount: 64, snapshotId: 'snapshot-1' },
    });
  });

  it('rejects create payloads whose record hubId does not match the action hubId', async () => {
    await db.processHubs.put(makeHub('hub-guard'));

    await expect(
      applyAction({
        kind: 'SUSTAINMENT_RECORD_CREATE',
        hubId: 'hub-guard',
        record: makeRecord('record-mismatch', 'other-hub'),
      })
    ).rejects.toThrow(/hubId mismatch/);

    expect(await db.controlRecords.get('record-mismatch')).toBeUndefined();
  });

  it('does not write control status or reviews when evidence snapshots are added', async () => {
    await db.processHubs.put(makeHub('hub-2'));
    const record = makeRecord('record-2', 'hub-2', {
      ladderStep: 2,
      status: 'verifying',
      nextCheckSuggestedAt: '2026-06-08T00:00:00.000Z',
    });
    await applyAction({
      kind: 'SUSTAINMENT_RECORD_CREATE',
      hubId: 'hub-2',
      record,
    });

    await applyAction({
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
      provenance: [],
    });

    const stored = await db.controlRecords.get('record-2');
    expect(stored).toMatchObject({
      status: 'verifying',
      ladderStep: 2,
      nextCheckSuggestedAt: '2026-06-08T00:00:00.000Z',
    });
    expect(await db.controlReviews.where('recordId').equals('record-2').count()).toBe(0);
  });
});

function makeHandoff(
  id: string,
  hubId: string,
  overrides: Partial<ControlHandoff> = {}
): ControlHandoff {
  return {
    id,
    projectId: 'inv-1',
    hubId,
    surface: 'qms-procedure',
    systemName: 'QMS-42',
    operationalOwner: { displayName: 'Process owner' },
    handoffDate: NOW,
    description: 'Control handoff',
    recordedBy: { displayName: 'Analyst' },
    createdAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

describe('applyAction (Azure) — control handoffs', () => {
  it('creates, updates, and archives simplified handoffs', async () => {
    await db.processHubs.put(makeHub('hub-handoff'));

    await applyAction({
      kind: 'CONTROL_HANDOFF_CREATE',
      hubId: 'hub-handoff',
      handoff: makeHandoff('handoff-1', 'hub-handoff'),
    });
    await applyAction({
      kind: 'CONTROL_HANDOFF_UPDATE',
      handoffId: 'handoff-1',
      patch: { escalationPath: 'Escalate to manager', reactionPlan: 'Return to standard work' },
    });
    await applyAction({ kind: 'CONTROL_HANDOFF_ARCHIVE', handoffId: 'handoff-1' });

    const stored = await db.controlHandoffs.get('handoff-1');
    expect(stored).toMatchObject({
      escalationPath: 'Escalate to manager',
      reactionPlan: 'Return to standard work',
      deletedAt: expect.any(Number),
    });
  });

  it('rejects create payloads whose handoff hubId does not match the action hubId', async () => {
    await db.processHubs.put(makeHub('hub-guard'));

    await expect(
      applyAction({
        kind: 'CONTROL_HANDOFF_CREATE',
        hubId: 'hub-guard',
        handoff: makeHandoff('handoff-mismatch', 'other-hub'),
      })
    ).rejects.toThrow(/hubId mismatch/);

    expect(await db.controlHandoffs.get('handoff-mismatch')).toBeUndefined();
  });
});
