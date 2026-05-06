// apps/pwa/src/persistence/optIn.ts
//
// Persistence opt-in flag — extracted from the deleted
// `apps/pwa/src/db/hubRepository.ts` so the legacy module can be removed.
//
// The PWA defaults to session-only operation; analysts opt in to local IDB
// persistence by clicking "Save to this browser". This flag lives in the
// `meta` table (preserved key + table semantics across the F3 schema swap).
// On opt-out (`setOptInFlag(false)`), the entire database is deleted —
// clearing every per-entity table at once. Dexie's `db.delete()` removes
// the underlying IDB database; subsequent reads on the same `db` instance
// trigger a fresh re-open against an empty database (Dexie's stores
// declaration is preserved on the instance).

import { db } from '../db/schema';

const OPT_IN_KEY = 'persistence.optIn';

/**
 * Reads the persistence opt-in flag.
 * Returns `false` when the flag has never been set.
 */
export async function getOptInFlag(): Promise<boolean> {
  const row = await db.meta.get(OPT_IN_KEY);
  return Boolean(row?.value);
}

/**
 * Writes the persistence opt-in flag. When set to `false`, also wipes the
 * entire database — clearing every per-entity table at once. Dexie's
 * `db.delete()` removes the underlying IDB database; the next read against
 * the `db` instance triggers a fresh re-open using the same stores
 * declaration, returning empty rows.
 */
export async function setOptInFlag(value: boolean): Promise<void> {
  if (value) {
    await db.meta.put({ key: OPT_IN_KEY, value });
    return;
  }

  // Opt-out path: wipe the entire IDB database. Dexie's instance `.delete()`
  // closes + drops the underlying IDB. Subsequent reads against `db` trigger
  // an automatic re-open into an empty database (the stores declaration is
  // retained on the Dexie instance).
  await db.delete();
}
