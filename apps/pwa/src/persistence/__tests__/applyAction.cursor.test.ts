// apps/pwa/src/persistence/__tests__/applyAction.cursor.test.ts
//
// F3.5 P5.3 — tests for the EVIDENCE_SOURCE_UPDATE_CURSOR handler in the PWA
// applyAction dispatcher.
//
// Coverage:
//   1. EVIDENCE_SOURCE_UPDATE_CURSOR puts the cursor and is read back via
//      pwaHubRepository.evidenceSources.getCursor(hubId, sourceId)
//   2. EVIDENCE_SOURCE_UPDATE_CURSOR preserves a caller-provided synthetic id
//      (e.g., `cursor-${hubId}-${sourceId}` — the Azure useEvidenceSourceSync
//      pattern per audit S8)
//   3. EVIDENCE_SOURCE_UPDATE_CURSOR generates an id when the caller omits it
//      (defensive fallback per D5 — typed as string but cast via unknown to test
//      the runtime guard without a TypeScript error at the call-site)
//   4. EVIDENCE_SOURCE_UPDATE_CURSOR upsert — calling twice with the same id
//      replaces the row, not duplicates it
//
// Audit S6: The markSeen createdAt overwrite concern is intentionally NOT guarded
// here per D7. The handler just puts the cursor as-is; repeated puts will
// overwrite createdAt. That's the accepted behaviour for F3.5 scope.
//
// Audit S7: PWA has no production caller of EVIDENCE_SOURCE_UPDATE_CURSOR today.
// These tests exercise the handler in isolation.
//
// fake-indexeddb/auto must be the first import so Dexie sees the IndexedDB
// polyfill before db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { EvidenceSourceCursor } from '@variscout/core/evidenceSources';
import type { HubAction } from '@variscout/core/actions';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';
import { pwaHubRepository } from '../PwaHubRepository';

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

describe('applyAction (PWA) — EVIDENCE_SOURCE_UPDATE_CURSOR', () => {
  it('puts cursor and is read back via getCursor(hubId, sourceId)', async () => {
    const cursor = makeCursor('cursor-hub-1-src-1', 'hub-1', 'src-1');

    const action: HubAction = {
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-1',
      cursor,
    };

    await applyAction(db, action);

    // Read back via the repository's getCursor API (post-filter on hubId).
    const retrieved = await pwaHubRepository.evidenceSources.getCursor('hub-1', 'src-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('cursor-hub-1-src-1');
    expect(retrieved?.hubId).toBe('hub-1');
    expect(retrieved?.sourceId).toBe('src-1');
    expect(retrieved?.lastSeenSnapshotId).toBe('snap-1');
    expect(retrieved?.lastSeenAt).toBe(CREATED_AT);
    expect(retrieved?.deletedAt).toBeNull();
  });

  it('preserves caller-provided synthetic id like `cursor-${hubId}-${sourceId}`', async () => {
    // The Azure useEvidenceSourceSync produces ids of this form (audit S8).
    const syntheticId = 'cursor-hub-42-src-99';
    const cursor = makeCursor(syntheticId, 'hub-42', 'src-99');

    await applyAction(db, {
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-99',
      cursor,
    });

    // The persisted row must have exactly the id the caller provided.
    const row = await db.evidenceSourceCursors.get(syntheticId);
    expect(row).toBeDefined();
    expect(row?.id).toBe(syntheticId);

    // getCursor must find it.
    const retrieved = await pwaHubRepository.evidenceSources.getCursor('hub-42', 'src-99');
    expect(retrieved?.id).toBe(syntheticId);
  });

  it('generates an id when the caller omits it (defensive runtime fallback)', async () => {
    // EvidenceSourceCursor.id is typed as string, so the caller cannot omit it
    // at the TypeScript level. The runtime guard fires only when the value is
    // undefined cast through unknown. We test it here to document the safety net.
    const cursorWithoutId = {
      hubId: 'hub-5',
      sourceId: 'src-5',
      lastSeenSnapshotId: 'snap-5',
      lastSeenAt: CREATED_AT,
      createdAt: CREATED_AT,
      deletedAt: null,
    } as unknown as EvidenceSourceCursor;

    await applyAction(db, {
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-5',
      cursor: cursorWithoutId,
    });

    // A row must have been persisted with a non-empty generated id.
    const rows = await db.evidenceSourceCursors.where('sourceId').equals('src-5').toArray();
    const matching = rows.filter(r => r.hubId === 'hub-5');
    expect(matching).toHaveLength(1);
    expect(typeof matching[0]?.id).toBe('string');
    expect(matching[0]?.id.length).toBeGreaterThan(0);
  });

  it('upsert — calling twice with the same id replaces the row, not duplicates', async () => {
    const cursor = makeCursor('cursor-hub-1-src-1', 'hub-1', 'src-1', {
      lastSeenSnapshotId: 'snap-first',
    });

    await applyAction(db, {
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-1',
      cursor,
    });

    // Second put with updated lastSeenSnapshotId.
    const updatedCursor = makeCursor('cursor-hub-1-src-1', 'hub-1', 'src-1', {
      lastSeenSnapshotId: 'snap-second',
      lastSeenAt: 1714000001000,
    });

    await applyAction(db, {
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-1',
      cursor: updatedCursor,
    });

    // Only one row should exist (upsert, not duplicate).
    const allRows = await db.evidenceSourceCursors.toArray();
    expect(allRows).toHaveLength(1);

    // The row should reflect the second write.
    const retrieved = await pwaHubRepository.evidenceSources.getCursor('hub-1', 'src-1');
    expect(retrieved?.lastSeenSnapshotId).toBe('snap-second');
    expect(retrieved?.lastSeenAt).toBe(1714000001000);
  });
});
