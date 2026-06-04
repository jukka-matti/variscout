// apps/pwa/src/db/__tests__/schema.v7.test.ts
//
// Verifies the PWA Dexie schema opens at its latest declared version with the
// no-op `.stores({})` bumps applied cleanly. Tracks the running version:
//   v7  — PR-CCJ-E1 (ImprovementProject gained 5 optional flat root fields)
//   v8  — IM-0a (Hub↔Project 1:1 collapse)
//   v9  — IM-0b (process-step model reconciliation, ADR-087)
//   v10 — IM-1 (drop Question entity / questions table, ADR-085)
//   v11 — R6c (former DocumentSnapshot browser save table)
//   v12 — R6d (drop DocumentSnapshot browser save table; .vrs export-only)
//   v13 — PO-4 (drop never-written investigations table; ProcessHubAnalyze dissolved)
//
// Mirrors the Azure schema test pattern at
// apps/azure/src/db/__tests__/schema.v6.test.ts.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../schema';

const LATEST_SCHEMA_VERSION = 13;

describe('PWA IndexedDB schema (latest version)', () => {
  beforeEach(async () => {
    await db.delete();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('opens at the latest version from clean state', async () => {
    await db.open();
    // Dexie reports `verno` as the highest declared version after open().
    expect(db.verno).toBe(LATEST_SCHEMA_VERSION);
  });

  it('opens cleanly after the v12 documentSnapshots drop statement', async () => {
    // The latest version statement drops the former R6c documentSnapshots table.
    // If a stale upgrade callback were registered or the version statement were
    // malformed, db.open() would throw here. Successful open + correct verno is
    // the implicit proof.
    await expect(db.open()).resolves.toBeDefined();
    expect(db.verno).toBe(LATEST_SCHEMA_VERSION);
  });
});
