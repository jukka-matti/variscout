// apps/pwa/src/db/__tests__/schema.v7.test.ts
//
// PR-CCJ-E1 Task 2 — verify the PWA Dexie schema bump v6 → v7 (no-op
// stores; flushes cached schema after ImprovementProject gained 5 optional
// flat root fields in T1).
//
// Mirrors the Azure schema v14 test pattern at
// apps/azure/src/db/__tests__/schema.v6.test.ts.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../schema';

describe('PWA IndexedDB schema v7 (E1)', () => {
  beforeEach(async () => {
    await db.delete();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('opens at version 7 from clean state', async () => {
    await db.open();
    // Dexie reports `verno` as the highest declared version after open().
    expect(db.verno).toBe(7);
  });

  it('opens cleanly without erroring on the v7 statement', async () => {
    // The v7 statement is an empty `.stores({})` bump with no upgrade
    // callback (per wedge V1 no-back-compat policy). If a stale upgrade
    // callback were registered or the version statement were malformed,
    // db.open() would throw here. Successful open + correct verno is the
    // implicit proof.
    await expect(db.open()).resolves.toBeDefined();
    expect(db.verno).toBe(7);
  });
});
