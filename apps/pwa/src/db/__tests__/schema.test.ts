// apps/pwa/src/db/__tests__/schema.test.ts
//
// Verifies the clean pre-launch PWA Dexie schema opens as a single v1
// declaration and excludes retired compatibility tables.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../schema';

const CLEAN_SCHEMA_VERSION = 1;

const CURRENT_TABLES = [
  'actionItems',
  'canvasState',
  'controlHandoffs',
  'controlRecords',
  'controlReviews',
  'evidenceSnapshots',
  'evidenceSourceCursors',
  'evidenceSources',
  'hubs',
  'improvementProjects',
  'measurementPlans',
  'meta',
  'outcomes',
  'rowProvenance',
].sort();

const RETIRED_TABLES = [
  'causalLinks',
  'documentSnapshots',
  'findings',
  'hypotheses',
  'investigations',
  'questions',
];

describe('PWA IndexedDB schema (clean v1)', () => {
  beforeEach(async () => {
    await db.delete();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('opens as clean schema v1 from clean state', async () => {
    await db.open();
    expect(db.verno).toBe(CLEAN_SCHEMA_VERSION);
  });

  it('declares only current PWA tables', async () => {
    await db.open();

    expect(db.tables.map(table => table.name).sort()).toEqual(CURRENT_TABLES);
    for (const tableName of RETIRED_TABLES) {
      expect(db.tables.some(table => table.name === tableName)).toBe(false);
    }
  });

  it('keeps PO-7 control indexes without investigationId', async () => {
    await db.open();

    expect(db.controlRecords.schema.indexes.map(index => index.name)).toEqual([
      'hubId',
      'nextCheckSuggestedAt',
      'updatedAt',
      'deletedAt',
    ]);
    expect(db.controlReviews.schema.indexes.map(index => index.name)).toEqual([
      'recordId',
      'hubId',
      'reviewedAt',
    ]);
    expect(db.controlHandoffs.schema.indexes.map(index => index.name)).toEqual([
      'hubId',
      'handoffDate',
      'deletedAt',
    ]);
  });
});
