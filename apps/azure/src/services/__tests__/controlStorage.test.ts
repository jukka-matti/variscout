import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/schema';
import {
  saveControlRecordToIndexedDB,
  listControlRecordsFromIndexedDB,
  saveControlReviewToIndexedDB,
  listControlReviewsFromIndexedDB,
  saveControlHandoffToIndexedDB,
  listControlHandoffsFromIndexedDB,
  buildSustainmentProjection,
  recomputeSustainmentProjectionForRecord,
} from '../localDb';
import type {
  ControlRecord,
  ControlReview,
  ControlHandoff,
  ProjectMetadata,
} from '@variscout/core';

const makeRecord = (overrides: Partial<ControlRecord> = {}): ControlRecord => ({
  id: 'rec-1',
  title: 'Control cadence',
  projectId: 'inv-1',
  hubId: 'hub-1',
  status: 'pending',
  consecutiveOnTargetTicks: 0,
  hasOverride: false,
  lastEvaluatedSnapshotId: undefined,
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

  it('round-trips a ControlRecord', async () => {
    await saveControlRecordToIndexedDB(makeRecord());
    const result = await listControlRecordsFromIndexedDB('hub-1');
    expect(result).toHaveLength(1);
    expect(result[0].cadence).toBe('monthly');
  });

  it('appends ControlReviews and reads them ordered by reviewedAt desc', async () => {
    const r1: ControlReview = {
      id: 'r-1',
      recordId: 'rec-1',
      projectId: 'inv-1',
      hubId: 'hub-1',
      reviewedAt: 1745107200000, // 2026-04-20T00:00:00.000Z
      createdAt: 1745107200000,
      deletedAt: null,
      reviewer: { userId: 'u-1', displayName: 'Alice' },
      verdict: 'holding',
    };
    const r2: ControlReview = {
      ...r1,
      id: 'r-2',
      reviewedAt: 1745625600000, // 2026-04-26T00:00:00.000Z
      createdAt: 1745625600000,
    };

    await saveControlReviewToIndexedDB(r1);
    await saveControlReviewToIndexedDB(r2);

    const result = await listControlReviewsFromIndexedDB('rec-1');
    expect(result.map(r => r.id)).toEqual(['r-2', 'r-1']);
  });

  it('round-trips a ControlHandoff', async () => {
    const handoff: ControlHandoff = {
      id: 'h-1',
      projectId: 'inv-1',
      hubId: 'hub-1',
      status: 'operational',
      surface: 'mes-recipe',
      systemName: 'MES',
      operationalOwner: { userId: 'u-1', displayName: 'Op' },
      handoffDate: 1745625600000, // 2026-04-26T00:00:00.000Z
      description: 'Recipe lock',
      retainControlReview: false,
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
    data: {} as never,
    meta: {
      phase: 'frame',
      findingCounts: {},
      questionCounts: {},
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

    const record: ControlRecord = makeRecord();
    await recomputeSustainmentProjectionForRecord(record);

    const updated = await db.projects.get('inv-1');
    expect(updated?.meta?.sustainment).toBeDefined();
    expect(updated?.meta?.sustainment?.recordId).toBe('rec-1');
    expect(updated?.meta?.sustainment?.cadence).toBe('monthly');
  });

  it('no-ops when no project matches the projectId', async () => {
    const record: ControlRecord = makeRecord({ projectId: 'nonexistent' });
    await expect(recomputeSustainmentProjectionForRecord(record)).resolves.toBeUndefined();
  });

  it('builds projection with handoff surface when controlHandoffId resolves', async () => {
    const handoff: ControlHandoff = {
      id: 'h-1',
      projectId: 'inv-1',
      hubId: 'hub-1',
      status: 'operational',
      surface: 'mes-recipe',
      systemName: 'MES',
      operationalOwner: { userId: 'u-1', displayName: 'Op' },
      handoffDate: 1745625600000,
      description: 'Recipe lock',
      retainControlReview: false,
      createdAt: 1745625600000,
      deletedAt: null,
      recordedBy: { userId: 'u-1', displayName: 'Op' },
    };
    await saveControlHandoffToIndexedDB(handoff);

    const record: ControlRecord = makeRecord({ controlHandoffId: 'h-1' });
    const projection = buildSustainmentProjection(record, handoff);
    expect(projection.handoffSurface).toBe('mes-recipe');
  });

  it('updates project meta.sustainment including handoff surface', async () => {
    await seedProject();

    const handoff: ControlHandoff = {
      id: 'h-2',
      projectId: 'inv-1',
      hubId: 'hub-1',
      status: 'operational',
      surface: 'qms-procedure',
      systemName: 'Doc Control',
      operationalOwner: { userId: 'u-1', displayName: 'Op' },
      handoffDate: 1745625600000,
      description: 'SOP lock',
      retainControlReview: true,
      createdAt: 1745625600000,
      deletedAt: null,
      recordedBy: { userId: 'u-1', displayName: 'Op' },
    };
    await saveControlHandoffToIndexedDB(handoff);

    const record: ControlRecord = makeRecord({ controlHandoffId: 'h-2' });
    await recomputeSustainmentProjectionForRecord(record);

    const updated = await db.projects.get('inv-1');
    expect(updated?.meta?.sustainment?.handoffSurface).toBe('qms-procedure');
  });
});
