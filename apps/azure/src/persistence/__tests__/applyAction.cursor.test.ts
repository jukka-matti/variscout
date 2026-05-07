// apps/azure/src/persistence/__tests__/applyAction.cursor.test.ts
//
// F3.5 P5.3 — tests for the EVIDENCE_SOURCE_UPDATE_CURSOR handler in the Azure
// applyAction dispatcher.
//
// Coverage:
//   1. EVIDENCE_SOURCE_UPDATE_CURSOR puts cursor on compound key [hubId+sourceId]
//      and is read back via azureHubRepository.evidenceSources.getCursor(hubId, sourceId)
//   2. EVIDENCE_SOURCE_UPDATE_CURSOR upsert — calling twice with the same compound
//      key replaces the row, not duplicates it
//   3. EVIDENCE_SOURCE_UPDATE_CURSOR cursors for two different hubs but the same
//      sourceId are independent rows (compound-key isolation test)
//
// Azure schema: evidenceSourceCursors '[hubId+sourceId]' compound primary key.
// The handler uses db.evidenceSourceCursors.put(action.cursor); Dexie auto-resolves
// the compound key from cursor.hubId + cursor.sourceId. No id needed (D5 asymmetry:
// Azure key is compound; PWA key is id-based).
//
// fake-indexeddb/auto must be the first import so Dexie sees the IndexedDB
// polyfill before db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { EvidenceSourceCursor } from '@variscout/core';
import type { HubAction } from '@variscout/core/actions';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';
import { azureHubRepository } from '../AzureHubRepository';

// ---------------------------------------------------------------------------
// Fixture helpers — deterministic literal IDs + timestamps (no Date.now() /
// crypto.randomUUID() in fixture VALUE positions)
// ---------------------------------------------------------------------------

const CREATED_AT = 1714000000000;

function makeCursor(
  id: string,
  hubId: string,
  sourceId: string,
  overrides: Partial<EvidenceSourceCursor> = {}
): EvidenceSourceCursor {
  return {
    id,
    hubId,
    sourceId,
    lastSeenSnapshotId: 'snap-1',
    lastSeenAt: CREATED_AT,
    createdAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.evidenceSourceCursors.clear();
});

afterEach(async () => {
  await db.evidenceSourceCursors.clear();
});

// ---------------------------------------------------------------------------
// EVIDENCE_SOURCE_UPDATE_CURSOR
// ---------------------------------------------------------------------------

describe('applyAction (Azure) — EVIDENCE_SOURCE_UPDATE_CURSOR', () => {
  it('puts cursor on compound key [hubId+sourceId] and is read back via getCursor', async () => {
    const cursor = makeCursor('cursor-hub-1-src-1', 'hub-1', 'src-1');

    const action: HubAction = {
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-1',
      cursor,
    };

    await applyAction(action);

    // Read back via the repository's getCursor API (compound key lookup).
    const retrieved = await azureHubRepository.evidenceSources.getCursor('hub-1', 'src-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.hubId).toBe('hub-1');
    expect(retrieved?.sourceId).toBe('src-1');
    expect(retrieved?.lastSeenSnapshotId).toBe('snap-1');
    expect(retrieved?.lastSeenAt).toBe(CREATED_AT);
    expect(retrieved?.deletedAt).toBeNull();
  });

  it('upsert — calling twice with the same compound key replaces the row, not duplicates', async () => {
    const cursor = makeCursor('cursor-hub-1-src-1', 'hub-1', 'src-1', {
      lastSeenSnapshotId: 'snap-first',
    });

    await applyAction({
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-1',
      cursor,
    });

    // Second put with updated fields.
    const updatedCursor = makeCursor('cursor-hub-1-src-1', 'hub-1', 'src-1', {
      lastSeenSnapshotId: 'snap-second',
      lastSeenAt: 1714000001000,
    });

    await applyAction({
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-1',
      cursor: updatedCursor,
    });

    // Only one row should exist (upsert, not duplicate) for hub-1/src-1.
    const allRows = await db.evidenceSourceCursors.toArray();
    expect(allRows).toHaveLength(1);

    // The row should reflect the second write.
    const retrieved = await azureHubRepository.evidenceSources.getCursor('hub-1', 'src-1');
    expect(retrieved?.lastSeenSnapshotId).toBe('snap-second');
    expect(retrieved?.lastSeenAt).toBe(1714000001000);
  });

  it('cursors for two different hubs with the same sourceId are independent rows (compound-key isolation)', async () => {
    // Both cursors share sourceId 'src-shared' but have different hubIds.
    // Compound key [hubId+sourceId] means they are two distinct rows.
    const cursorHub1 = makeCursor('cursor-hub-a-src-shared', 'hub-a', 'src-shared', {
      lastSeenSnapshotId: 'snap-hub-a',
    });
    const cursorHub2 = makeCursor('cursor-hub-b-src-shared', 'hub-b', 'src-shared', {
      lastSeenSnapshotId: 'snap-hub-b',
    });

    await applyAction({
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-shared',
      cursor: cursorHub1,
    });

    await applyAction({
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-shared',
      cursor: cursorHub2,
    });

    // Two distinct rows must exist.
    const allRows = await db.evidenceSourceCursors.toArray();
    expect(allRows).toHaveLength(2);

    // Each cursor is independent.
    const retrievedHub1 = await azureHubRepository.evidenceSources.getCursor('hub-a', 'src-shared');
    expect(retrievedHub1?.lastSeenSnapshotId).toBe('snap-hub-a');
    expect(retrievedHub1?.hubId).toBe('hub-a');

    const retrievedHub2 = await azureHubRepository.evidenceSources.getCursor('hub-b', 'src-shared');
    expect(retrievedHub2?.lastSeenSnapshotId).toBe('snap-hub-b');
    expect(retrievedHub2?.hubId).toBe('hub-b');
  });
});
