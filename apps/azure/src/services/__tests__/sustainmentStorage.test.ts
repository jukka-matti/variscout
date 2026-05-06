import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/schema';
import {
  saveSustainmentRecordToIndexedDB,
  listSustainmentRecordsFromIndexedDB,
  saveSustainmentReviewToIndexedDB,
  listSustainmentReviewsFromIndexedDB,
  saveControlHandoffToIndexedDB,
  listControlHandoffsFromIndexedDB,
  buildSustainmentProjection,
  recomputeSustainmentProjectionForRecord,
  tombstoneSustainmentRecordsForInvestigation,
} from '../localDb';
import type {
  SustainmentRecord,
  SustainmentReview,
  ControlHandoff,
  ProjectMetadata,
} from '@variscout/core';

const makeRecord = (overrides: Partial<SustainmentRecord> = {}): SustainmentRecord => ({
  id: 'rec-1',
  investigationId: 'inv-1',
  hubId: 'hub-1',
  cadence: 'monthly',
  nextReviewDue: '2026-05-26T00:00:00.000Z',
  createdAt: 1745625600000, // 2026-04-26T00:00:00.000Z
  updatedAt: 1745625600000, // 2026-04-26T00:00:00.000Z
  deletedAt: null,
  ...overrides,
});

describe('sustainment storage round-trip', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('round-trips a SustainmentRecord', async () => {
    await saveSustainmentRecordToIndexedDB(makeRecord());
    const result = await listSustainmentRecordsFromIndexedDB('hub-1');
    expect(result).toHaveLength(1);
    expect(result[0].cadence).toBe('monthly');
  });

  it('appends SustainmentReviews and reads them ordered by reviewedAt desc', async () => {
    const r1: SustainmentReview = {
      id: 'r-1',
      recordId: 'rec-1',
      investigationId: 'inv-1',
      hubId: 'hub-1',
      reviewedAt: 1745107200000, // 2026-04-20T00:00:00.000Z
      createdAt: 1745107200000,
      deletedAt: null,
      reviewer: { userId: 'u-1', displayName: 'Alice' },
      verdict: 'holding',
    };
    const r2: SustainmentReview = {
      ...r1,
      id: 'r-2',
      reviewedAt: 1745625600000, // 2026-04-26T00:00:00.000Z
      createdAt: 1745625600000,
    };

    await saveSustainmentReviewToIndexedDB(r1);
    await saveSustainmentReviewToIndexedDB(r2);

    const result = await listSustainmentReviewsFromIndexedDB('rec-1');
    expect(result.map(r => r.id)).toEqual(['r-2', 'r-1']);
  });

  it('round-trips a ControlHandoff', async () => {
    const handoff: ControlHandoff = {
      id: 'h-1',
      investigationId: 'inv-1',
      hubId: 'hub-1',
      surface: 'mes-recipe',
      systemName: 'MES',
      operationalOwner: { userId: 'u-1', displayName: 'Op' },
      handoffDate: 1745625600000, // 2026-04-26T00:00:00.000Z
      description: 'Recipe lock',
      retainSustainmentReview: false,
      createdAt: 1745625600000, // 2026-04-26T00:00:00.000Z (formerly recordedAt)
      deletedAt: null,
      recordedBy: { userId: 'u-1', displayName: 'Op' },
    };
    await saveControlHandoffToIndexedDB(handoff);
    const result = await listControlHandoffsFromIndexedDB('hub-1');
    expect(result).toHaveLength(1);
    expect(result[0].surface).toBe('mes-recipe');
  });
});

const seedProject = async () => {
  await db.projects.put({
    name: 'inv-1',
    location: 'personal' as const,
    modified: new Date('2026-04-26T00:00:00.000Z'),
    synced: true,
    data: {},
    meta: {
      phase: 'frame',
      findingCounts: {},
      questionCounts: {},
      actionCounts: { total: 0, completed: 0, overdue: 0 },
      assignedTaskCount: 0,
      hasOverdueTasks: false,
      lastViewedAt: {},
    } satisfies ProjectMetadata,
  });
};

describe('sustainment projection recompute', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('updates project meta.sustainment when a record is recomputed', async () => {
    await seedProject();

    const record: SustainmentRecord = makeRecord();
    await recomputeSustainmentProjectionForRecord(record);

    const updated = await db.projects.get('inv-1');
    expect(updated?.meta?.sustainment).toBeDefined();
    expect(updated?.meta?.sustainment?.recordId).toBe('rec-1');
    expect(updated?.meta?.sustainment?.cadence).toBe('monthly');
  });

  it('no-ops when no project matches the investigationId', async () => {
    const record: SustainmentRecord = makeRecord({ investigationId: 'nonexistent' });
    await expect(recomputeSustainmentProjectionForRecord(record)).resolves.toBeUndefined();
  });

  it('builds projection with handoff surface when controlHandoffId resolves', async () => {
    const handoff: ControlHandoff = {
      id: 'h-1',
      investigationId: 'inv-1',
      hubId: 'hub-1',
      surface: 'mes-recipe',
      systemName: 'MES',
      operationalOwner: { userId: 'u-1', displayName: 'Op' },
      handoffDate: 1745625600000,
      description: 'Recipe lock',
      retainSustainmentReview: false,
      createdAt: 1745625600000,
      deletedAt: null,
      recordedBy: { userId: 'u-1', displayName: 'Op' },
    };
    await saveControlHandoffToIndexedDB(handoff);

    const record: SustainmentRecord = makeRecord({ controlHandoffId: 'h-1' });
    const projection = buildSustainmentProjection(record, handoff);
    expect(projection.handoffSurface).toBe('mes-recipe');
  });

  it('updates project meta.sustainment including handoff surface', async () => {
    await seedProject();

    const handoff: ControlHandoff = {
      id: 'h-2',
      investigationId: 'inv-1',
      hubId: 'hub-1',
      surface: 'qms-procedure',
      systemName: 'Doc Control',
      operationalOwner: { userId: 'u-1', displayName: 'Op' },
      handoffDate: 1745625600000,
      description: 'SOP lock',
      retainSustainmentReview: true,
      createdAt: 1745625600000,
      deletedAt: null,
      recordedBy: { userId: 'u-1', displayName: 'Op' },
    };
    await saveControlHandoffToIndexedDB(handoff);

    const record: SustainmentRecord = makeRecord({ controlHandoffId: 'h-2' });
    await recomputeSustainmentProjectionForRecord(record);

    const updated = await db.projects.get('inv-1');
    expect(updated?.meta?.sustainment?.handoffSurface).toBe('qms-procedure');
  });
});

describe('tombstone on investigation reopen', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });
  afterEach(async () => {
    await db.delete();
  });

  it('sets deletedAt on all matching records', async () => {
    await saveSustainmentRecordToIndexedDB(makeRecord({ id: 'rec-1' }));
    await saveSustainmentRecordToIndexedDB(makeRecord({ id: 'rec-2' }));
    const deletedAt = 1745712000000; // 2026-04-27T00:00:00.000Z
    const updated = await tombstoneSustainmentRecordsForInvestigation('inv-1', deletedAt);
    expect(updated).toBe(2);

    const records = await listSustainmentRecordsFromIndexedDB('hub-1');
    expect(records.every(r => r.deletedAt === deletedAt)).toBe(true);
    expect(records.every(r => r.updatedAt === deletedAt)).toBe(true);
  });

  it('skips records that are already soft-deleted', async () => {
    const earlyDeletedAt = 1745107200000; // 2026-04-20T00:00:00.000Z
    await saveSustainmentRecordToIndexedDB(makeRecord({ id: 'rec-1', deletedAt: earlyDeletedAt }));
    const updated = await tombstoneSustainmentRecordsForInvestigation(
      'inv-1',
      1745712000000 // 2026-04-27T00:00:00.000Z
    );
    expect(updated).toBe(0);
    const [record] = await listSustainmentRecordsFromIndexedDB('hub-1');
    expect(record.deletedAt).toBe(earlyDeletedAt); // not overwritten
  });

  it('returns 0 when no records exist for the investigation', async () => {
    const updated = await tombstoneSustainmentRecordsForInvestigation(
      'nonexistent',
      1745712000000 // 2026-04-27T00:00:00.000Z
    );
    expect(updated).toBe(0);
  });

  it('clears project meta.sustainment when records are soft-deleted', async () => {
    await seedProject();
    await saveSustainmentRecordToIndexedDB(makeRecord({ id: 'rec-1' }));
    await recomputeSustainmentProjectionForRecord(makeRecord({ id: 'rec-1' }));

    // Sanity: projection is set before soft-delete
    const before = await db.projects.get('inv-1');
    expect(before?.meta?.sustainment).toBeDefined();

    await tombstoneSustainmentRecordsForInvestigation('inv-1', 1745712000000);

    const after = await db.projects.get('inv-1');
    expect(after?.meta?.sustainment).toBeUndefined();
    // Other meta fields preserved.
    expect(after?.meta?.phase).toBe('frame');
  });

  it('leaves project meta untouched when no records were soft-deleted (idempotent)', async () => {
    await seedProject();
    // Pre-existing soft-deleted record — should not trigger a clear.
    await saveSustainmentRecordToIndexedDB(
      makeRecord({ id: 'rec-1', deletedAt: 1745107200000 }) // 2026-04-20T00:00:00.000Z
    );
    await db.projects.update('inv-1', {
      meta: {
        phase: 'frame',
        findingCounts: {},
        questionCounts: {},
        actionCounts: { total: 0, completed: 0, overdue: 0 },
        assignedTaskCount: 0,
        hasOverdueTasks: false,
        lastViewedAt: {},
        sustainment: {
          recordId: 'rec-1',
          cadence: 'monthly',
        },
      } satisfies ProjectMetadata,
    });

    await tombstoneSustainmentRecordsForInvestigation('inv-1', 1745712000000);

    const after = await db.projects.get('inv-1');
    expect(after?.meta?.sustainment).toBeDefined();
  });
});
