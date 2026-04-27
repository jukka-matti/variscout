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
} from '../localDb';
import type { SustainmentRecord, SustainmentReview, ControlHandoff } from '@variscout/core';

const makeRecord = (overrides: Partial<SustainmentRecord> = {}): SustainmentRecord => ({
  id: 'rec-1',
  investigationId: 'inv-1',
  hubId: 'hub-1',
  cadence: 'monthly',
  nextReviewDue: '2026-05-26T00:00:00.000Z',
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
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
      reviewedAt: '2026-04-20T00:00:00.000Z',
      reviewer: { id: 'u-1', displayName: 'Alice' },
      verdict: 'holding',
    };
    const r2: SustainmentReview = { ...r1, id: 'r-2', reviewedAt: '2026-04-26T00:00:00.000Z' };

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
      operationalOwner: { id: 'u-1', displayName: 'Op' },
      handoffDate: '2026-04-26T00:00:00.000Z',
      description: 'Recipe lock',
      retainSustainmentReview: false,
      recordedAt: '2026-04-26T00:00:00.000Z',
      recordedBy: { id: 'u-1', displayName: 'Op' },
    };
    await saveControlHandoffToIndexedDB(handoff);
    const result = await listControlHandoffsFromIndexedDB('hub-1');
    expect(result).toHaveLength(1);
    expect(result[0].surface).toBe('mes-recipe');
  });
});
