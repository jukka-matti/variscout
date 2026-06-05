---
tier: living
purpose: design
title: 'PO-8b · Concurrency + durability (Azure) — sub-plan (reload-or-branch dialog + Web Locks + persist/estimate + save telemetry + projection heal)'
audience: human
status: delivered
date: 2026-06-05
last-reviewed: 2026-06-05
layer: spec
topic:
  [
    persistence,
    concurrency,
    conflict-dialog,
    web-locks,
    storage-durability,
    telemetry,
    projection-heal,
    sub-plan,
    process-as-operations,
  ]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
  - docs/07-decisions/adr-091-two-tier-persistence-model.md
---

# PO-8b Concurrency + Durability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the silent auto-conflict-copy on 412 with an explicit reload-or-branch dialog (launch-blocking), retire the redundant timestamp pre-flight, serialize same-document writes under a Web Lock, request durable storage on a save gesture + surface the quota estimate, ship save-size/duration telemetry with the research-grounded re-architect trigger, and make the portfolio-projection writes merge-preserving (the load-time heal) — Azure only.

**Architecture:** `storage.ts#saveProject` becomes the single conflict surface: it returns a `SaveProjectResult` discriminated union, sets `pendingConflict` provider state on 412, and never auto-forks. The Editor renders a new azure-local `SaveConflictDialog` (native `<dialog>`, mirroring `ConfirmDialog` conventions) from that state; **Branch** = a full save under the shipped `"(conflict copy)"` name + Editor identity adoption (reuses `saveAndRecordBaseline`); **Reload** = a new `reloadProjectFromCloud` context member (cloud fetch + Dexie/ETag/merge-base refresh) followed by the existing local hydrate path. The wholesale Dexie-write + blob-PUT critical section wraps in a per-document exclusive Web Lock (two-phase: the lock releases BEFORE the dialog renders; resolutions re-acquire it). `loadBlobProject`/`loadFromCloud` start returning the blob ETag so a reload (and every cloud load) refreshes `syncState.etag` — without this, the post-reload save would 412 forever. All `ProjectMetadata` writers become merge-preserving for the Control-owned `sustainment` projection (the heal).

**Tech Stack:** TypeScript, React, Zustand, Dexie, Web Locks API (greenfield), StorageManager API (greenfield), App Insights (`safeTrackEvent`), Vitest + RTL + fake-indexeddb. No new dependencies. No Dexie version bump (no index changes).

**Scope authority (owner-ratified 2026-06-05, this session):**

1. **Heal = field-scoped MERGE + fix the existing clobbers** — never a wholesale meta overwrite. `buildProjectMetadata` never writes `sustainment` (the Control direct-Dexie bypass owns it; `ProjectCard` reads it); the existing cloud-load path (`storage.ts` loadProject cache-write) and list backfill both clobber it today — fixed in this PR.
2. **Phantom-ETag fallback fixed** — `cloudSync.saveToCloud`'s `etag: result.etag || now` fabrication is replaced (a fabricated timestamp as If-Match guarantees a false 412 → a spurious dialog).
3. **Worker-marshal serialization CUT** (spec §9.4 item amended; same class as the §16 PO-8a amendment). Research verdict (4 researchers + synthesis, 2026-06-05): postMessage structured-clone is synchronous on the SENDING thread and, for plain-object graphs, 2-3× SLOWER than `JSON.parse(JSON.stringify())` — marshal-then-stringify pays a serialization tax to avoid a serialization tax (Surma "Is postMessage slow?"; Salesforce workers retrospective; V8 stringify 2× faster in Chrome 138; tldraw/Excalidraw both serialize main-thread). What ships instead: **main-thread size/duration telemetry with a dual re-architect trigger** (>50MB size OR >50ms serialize long-task). Revive path on trigger: columnar transferable SoA (zero-copy) or OPFS worker-owned persistence — NEVER marshal-then-stringify. Recorded in decision-log + spec §17 + ADR-091 amendment (Task 8).
4. **Dialog on ANY 412** including autosave-triggered (autosave suspends while the conflict is pending; "Not now" defers autosave retries until resolution; a manual save re-opens the dialog).

**Grounded facts the implementer inherits (13-agent grounding workflow + 4 adversarial verifiers, 2026-06-05 — verified against main @ `ab23bfcb6`):**

- **TWO conflict-copy forks exist, not one**: the timestamp pre-flight (`storage.ts:333-348` — `if (syncState?.baseStateJson)` → `getCloudModifiedDate` → eager `"(conflict copy)"` save) and the 412 catch (`storage.ts:368-385` — `instanceof ProjectDocumentConflictErrorClass`). The dialog replaces BOTH. Locate by symbol (`baseStateJson` guard / `ProjectDocumentConflictErrorClass` catch), never by line.
- **`getCloudModifiedDate` has a SECOND live caller** — the load-time conflict detector (`storage.ts:449` inside `loadProject`). Delete ONLY the pre-flight call site; never the function.
- **No test exercises the pre-flight** (`mockSyncState.get` defaults to `null`, `storage.test.ts:281`). The test to rewrite is `'uses clear conflict-copy copy when ETag save detects a cloud conflict'` (`storage.test.ts:1228-1249`) — it covers the 412 catch fork with a type-dishonest `'concurrency-exhausted'` reason (not in `SaveBlobProjectResult`; `saveToCloud` only checks `!result.ok`).
- **No seam exists for a user decision**: `StorageContextValue.saveProject` is `Promise<void>`; both forks auto-resolve. Adding the result type + `pendingConflict` state is the keystone.
- **412 strictly dominates the pre-flight** (adversarially verified across first-save / offline-queue / direct-Dexie / evidence / multi-tab / etag-staleness): the server PUT writes `analysis.json` + `metadata.json` atomically, so ETag and the timestamp advance in lockstep; no state exists where the timestamp differs but the ETag matches.
- **ETag lives in Dexie `db.syncState`** keyed by project NAME (`{name, cloudId, lastSynced, etag, baseStateJson?}`). `loadProject` refreshes `baseStateJson` but NOT `etag` — so a Reload that doesn't refresh the ETag re-412s forever. The server GET already returns `etag` in the JSON body (`server.js` GET `/api/storage/projects/:projectId` → `{project, metadata, etag}`) — capture it.
- **Saves fire on a 2s debounce** (`useAutoSave`, `Editor.tsx:1626`) AND there is NO in-flight save mutex (`isSyncingRef` guards only the retry/sync queues) — autosave + manual save can self-inflict a 412. The Web Lock is the serializer.
- **Lock⟷dialog deadlock**: `navigator.locks.request` holds the lock for the callback's lifetime. NEVER await the dialog inside the lock — two-phase: locked-attempt → (lock released, state set) → lock-free human decision → resolutions re-acquire.
- **Comlink does NOT preserve custom error classes** and `cloudSync.ts` is not worker-safe (imports Dexie `db`) — part of why the worker-marshal was cut.
- **`buildProjectMetadata` never writes `sustainment`** (`projectMetadata.ts` interface declares it; the body doesn't produce it). The ONLY writer is `recomputeSustainmentProjectionForRecord` → `updateProjectSustainmentProjectionInIndexedDB` (`localDb.ts`, the sanctioned R13 bypass, fired from `saveControlRecord`). `ProjectCard.tsx` reads `metadata?.sustainment?.nextReviewDue` (load-bearing chip). Today's clobber sites: `storage.saveProject` meta build, `storage.loadProject` cache-write, `backfillProjectMetadataRecords` (runs on EVERY portfolio list!), and `lib/persistence.ts saveProjectLocally`/`updateProjectLocally` (full `put` with NO meta — wipes it before `storage.saveProject` even reads it).
- **Conflict copy + toasts are hardcoded English literals** (`storage.ts` `'Cloud copy changed. Saved your version as …'`), NOT i18n keys. The new dialog uses English literals too (matches the shipped azure-sync + PasteConflictToast convention; MessageCatalog keys are all-or-nothing across 32 locales — do NOT add them).
- **The evidence-snapshot path is EXEMPT and disjoint**: `saveBlobEvidenceSnapshot` / `updateBlobEvidenceSnapshotsConditional` / `saveEvidenceSnapshotToCloud` / `_emitPasteConflict` / `PasteConflictToast` share only `requestJson`/`requestMaybeJson` with the document path. Do NOT route the evidence PUT through the lock, do NOT change `requestJson`/`requestMaybeJson` signatures, do NOT touch the PasteConflict channel.
- **Web Locks + `navigator.storage.persist()/estimate()` are fully greenfield** (zero repo usage). jsdom implements NEITHER — product code must feature-detect (absent API → graceful no-op); tests install functional mocks via `Object.defineProperty(navigator, …)` (per `feedback_happy_dom_test_patterns`: defineProperty, not assign).
- **The standard Editor open path ignores meta entirely** (`projectActions.loadProject` → adapter → `loadProjectLocally` reads `record.data` only). The portfolio card self-heals on every Dashboard list via `backfillProjectMetadataRecords` (which already compare-and-writes via `metadataChanged`) — fixing THAT to merge-preserve + fixing `storage.loadProject`'s two paths IS the heal. `extractMetadataInputs` returns `null` on a malformed aggregate — a `null` recompute must SKIP the heal, never write null meta.
- **PO-8a seam inheritance**: `hydrateDocumentSnapshot` strict-asserts (typed errors) — the Reload path's hydrate can throw on a corrupt fetched copy; catch it and degrade (the user is mid-conflict; never strand them). The Editor's dirty fingerprint baseline (`savedFingerprint`/`savedDocumentName`) is Editor-local `useState` — Branch and Reload MUST reset it or autosave immediately re-fires (`loadProject:509-516` shows the reset pattern).
- **Editor partial `useStorage()` mocks return `undefined` for new members** — Editor code must use falsy checks (`!pendingConflict`, `Boolean(pendingConflict)`, `result?.status`), never `!== null`, and `Editor.test.tsx`'s mock gets the new members added.
- **Telemetry PII hard rule** (azure CLAUDE.md): bytes/ms/counts only; never project names or row contents.
- **App-scoping**: everything in this PR is `apps/azure` only. The PWA has zero project-document conflict surface (R6d) — no PWA file changes; `pnpm --filter @variscout/pwa test` must stay green untouched.
- Package filter is `@variscout/azure-app` (NOT `@variscout/azure`). Apps' build tsconfig covers test files — the turbo build is the tsc guard for test residues.
- Reviewer/implementer line refs drift mid-PR — locate by symbol/test name, never cited line numbers.

**Worktree:** `.worktrees/feat-po-8b-concurrency-durability` on branch `feat/po-8b-concurrency-durability`. This plan file is committed on the branch first. Baseline verified green 2026-06-05 (azure suite: 114 files / 1334 tests).

**Per-task verification budget:** scope test runs to the touched files (`pnpm --filter @variscout/azure-app test -- <pattern>` — the azure suite is slow; full runs are controller-level). Full `pr-ready-check.sh` + both app suites are CONTROLLER-level (Task 9), not implementer-level.

---

### Task 1: Web Locks helper + merge-preserving ProjectMetadata writes (TDD)

**Model:** Sonnet.

**Files:**

- Create: `apps/azure/src/services/saveLock.ts`
- Create: `apps/azure/src/services/__tests__/saveLock.test.ts`
- Modify: `apps/azure/src/services/localDb.ts` (add `mergeProjectMetadata`, export `metadataChanged`, fix backfill)
- Modify: `apps/azure/src/lib/persistence.ts` (`saveProjectLocally`/`updateProjectLocally`/`renameProjectLocally` preserve meta+access)
- Modify: `apps/azure/src/services/__tests__/localDb.test.ts` (backfill sustainment negative control)
- Modify: `apps/azure/src/lib/__tests__/persistence.test.ts` (adapter-save meta preservation)

- [ ] **Step 1: Write the failing tests**

`apps/azure/src/services/__tests__/saveLock.test.ts` (new file):

```typescript
import { afterEach, describe, expect, it } from 'vitest';
import { DOCUMENT_SAVE_LOCK_PREFIX, withDocumentSaveLock } from '../saveLock';

function installMockLockManager() {
  const queues = new Map<string, Promise<unknown>>();
  const requested: string[] = [];
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (name: string, _opts: unknown, cb: () => Promise<unknown>) => {
        requested.push(name);
        const prev = queues.get(name) ?? Promise.resolve();
        const next = prev.then(() => cb());
        queues.set(
          name,
          next.catch(() => undefined)
        );
        return next;
      },
    },
  });
  return requested;
}

afterEach(() => {
  Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
});

describe('withDocumentSaveLock (PO-8b)', () => {
  it('runs the callback without a lock when navigator.locks is absent (jsdom / older Safari)', async () => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    const result = await withDocumentSaveLock('doc-a', async () => 'ran');
    expect(result).toBe('ran');
  });

  it('requests an exclusive per-document lock named by the document', async () => {
    const requested = installMockLockManager();
    await withDocumentSaveLock('My Project', async () => undefined);
    expect(requested).toEqual([`${DOCUMENT_SAVE_LOCK_PREFIX}My Project`]);
  });

  it('serializes two callbacks on the SAME document (negative control: different documents run concurrently)', async () => {
    installMockLockManager();
    const events: string[] = [];
    const slow = (label: string) => async () => {
      events.push(`${label}-start`);
      await new Promise(resolve => setTimeout(resolve, 10));
      events.push(`${label}-end`);
    };

    await Promise.all([
      withDocumentSaveLock('same-doc', slow('a')),
      withDocumentSaveLock('same-doc', slow('b')),
    ]);
    expect(events).toEqual(['a-start', 'a-end', 'b-start', 'b-end']);

    events.length = 0;
    await Promise.all([
      withDocumentSaveLock('doc-1', slow('x')),
      withDocumentSaveLock('doc-2', slow('y')),
    ]);
    // different lock names → no serialization
    expect(events.slice(0, 2)).toEqual(['x-start', 'y-start']);
  });

  it('releases the lock when the callback throws (the next waiter still runs)', async () => {
    installMockLockManager();
    await expect(
      withDocumentSaveLock('same-doc', async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    const result = await withDocumentSaveLock('same-doc', async () => 'after-throw');
    expect(result).toBe('after-throw');
  });
});
```

Append to `apps/azure/src/services/__tests__/localDb.test.ts` (inside the top-level describe; add `backfillProjectMetadataInIndexedDB` is already imported; add `mergeProjectMetadata` to the `../localDb` import and `import type { ControlMetadataProjection, ProjectMetadata } from '@variscout/core';`):

```typescript
describe('PO-8b merge-preserving metadata (the heal contract)', () => {
  const seededSustainment: ControlMetadataProjection = {
    recordId: 'cr-1',
    cadence: 'weekly',
    nextReviewDue: '2026-07-01T00:00:00.000Z',
    latestVerdict: 'holding',
  };

  it('mergeProjectMetadata preserves the Control-owned sustainment projection over a recompute that lacks it', () => {
    const existing: ProjectMetadata = {
      phase: 'frame',
      findingCounts: { stale: 9 },
      questionCounts: {},
      lastViewedAt: {},
      sustainment: seededSustainment,
    };
    const recomputed: ProjectMetadata = {
      phase: 'scout',
      findingCounts: {},
      questionCounts: {},
      lastViewedAt: {},
    };
    const merged = mergeProjectMetadata(existing, recomputed);
    expect(merged.phase).toBe('scout'); // aggregate-derived field healed
    expect(merged.sustainment).toEqual(seededSustainment); // Control-owned field preserved
    // no existing meta → recompute passes through unchanged
    expect(mergeProjectMetadata(undefined, recomputed)).toEqual(recomputed);
  });

  it('backfill heals stale aggregate-derived meta while PRESERVING sustainment (PO-8b negative control)', async () => {
    await db.projects.put({
      name: 'heal-backfill',
      location: 'personal',
      modified: new Date(),
      synced: true,
      data: snapshot(),
      meta: {
        phase: 'improve', // stale vs the recompute
        findingCounts: { stale: 9 },
        questionCounts: {},
        lastViewedAt: {},
        sustainment: seededSustainment,
      } as ProjectMetadata,
    });

    const updated = await backfillProjectMetadataInIndexedDB('user-1');
    expect(updated).toBe(1);

    const record = await db.projects.get('heal-backfill');
    // healed from the aggregate…
    expect(record?.meta?.findingCounts).not.toHaveProperty('stale');
    // …but the distractor the heal must NOT touch survived byte-identical
    expect(record?.meta?.sustainment).toEqual(seededSustainment);
  });
});
```

Append to `apps/azure/src/lib/__tests__/persistence.test.ts` (this file has no IndexedDB today — add `import 'fake-indexeddb/auto';` as the FIRST import, then `import { db } from '../../db/schema';` and add `saveProjectLocally` to the `../persistence` import; reuse the file's existing `hub` const inside a snapshot literal is NOT needed — build a minimal `DocumentSnapshot` via the stores builder like the export test does):

```typescript
describe('PO-8b: adapter saves preserve portfolio meta + access', () => {
  it('saveProjectLocally no longer wipes record.meta / record.access', async () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const state = buildDocumentSnapshot({ activeHub: hub });

    const meta = {
      phase: 'scout',
      findingCounts: {},
      questionCounts: {},
      lastViewedAt: {},
      sustainment: {
        recordId: 'cr-1',
        cadence: 'weekly' as const,
        nextReviewDue: '2026-07-01T00:00:00.000Z',
        latestVerdict: 'holding' as const,
      },
    };
    const access = {
      ownerUserId: 'u1',
      memberUserIds: ['u1'],
      hubId: 'hub-1',
      projectId: null,
    };
    await db.projects.put({
      name: 'keep-meta',
      location: 'personal',
      modified: new Date(),
      synced: true,
      data: state,
      meta,
      access,
    });

    await saveProjectLocally('keep-meta', state, 'personal');

    const record = await db.projects.get('keep-meta');
    expect(record?.meta).toEqual(meta); // preserved, not wiped
    expect(record?.access).toEqual(access);
    expect(record?.synced).toBe(false); // save still marks unsynced
    await db.projects.delete('keep-meta');
  });
});
```

(Add `buildDocumentSnapshot` to the existing `@variscout/stores` import in that file.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/azure-app test -- "saveLock|localDb|persistence"`
Expected: FAIL — `saveLock` module missing; `mergeProjectMetadata` not exported; backfill clobbers `sustainment`; `saveProjectLocally` wipes meta.

- [ ] **Step 3: Implement**

`apps/azure/src/services/saveLock.ts` (new):

```typescript
// PO-8b same-user multi-tab safety (spec §9.4): the wholesale Dexie write +
// blob PUT critical section serializes under a per-document exclusive Web
// Lock. Greenfield — no other navigator.locks usage exists in the repo.
//
// Two-phase contract (lock⟷dialog deadlock, adversarially verified):
// navigator.locks.request holds the lock for the LIFETIME of the callback, so
// the reload-or-branch dialog must NEVER be awaited inside the callback —
// conflicts are returned as state, the lock releases, the dialog runs
// lock-free, and resolutions re-acquire the lock for their writes.
//
// Feature-detect: jsdom and older Safari have no LockManager — run unlocked
// rather than throw (single-tab behavior is then identical to today).

export const DOCUMENT_SAVE_LOCK_PREFIX = 'variscout-project-save:';

export async function withDocumentSaveLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks?.request) {
    return fn();
  }
  return locks.request(`${DOCUMENT_SAVE_LOCK_PREFIX}${name}`, { mode: 'exclusive' }, () =>
    fn()
  ) as Promise<T>;
}
```

In `apps/azure/src/services/localDb.ts`:

1. Change `function metadataChanged(` to `export function metadataChanged(` (the heal in storage.ts needs it).

2. Directly below `metadataChanged`, add:

```typescript
/**
 * PO-8b heal contract: ProjectMetadata writes are MERGES, never wholesale
 * replaces. buildProjectMetadata is a pure function of the loaded aggregate
 * and never produces `sustainment` — that projection is owned by the Control
 * direct-Dexie bypass (updateProjectSustainmentProjectionInIndexedDB, R13)
 * and read by the ProjectCard due-ness chip. A naive recompute-and-overwrite
 * clobbers it (the pre-PO-8b defect on every save / list / cloud load).
 */
export function mergeProjectMetadata(
  existing: ProjectMetadata | undefined,
  recomputed: ProjectMetadata
): ProjectMetadata {
  return { ...recomputed, sustainment: existing?.sustainment ?? recomputed.sustainment };
}
```

3. In `backfillProjectMetadataRecords`, replace the recompute line:

```typescript
const nextMeta = extractMetadataInputs(record.data, userId, record.meta?.lastViewedAt);
```

with:

```typescript
const recomputed = extractMetadataInputs(record.data, userId, record.meta?.lastViewedAt);
const nextMeta = recomputed ? mergeProjectMetadata(record.meta, recomputed) : null;
```

(The rest of the function body is unchanged — `if (!nextMeta || …)` already handles the null case.)

In `apps/azure/src/lib/persistence.ts`:

4. `saveProjectLocally` — replace the `db.projects.put({...})` block with:

```typescript
// PO-8b: preserve the portfolio projection across the adapter save — the
// previous full put wiped record.meta (incl. the Control-owned sustainment
// chip) and record.access on every Editor save.
const existing = await db.projects.get(name);
await db.projects.put({
  name: project.name,
  location: project.location,
  modified: new Date(),
  synced: false,
  data: state,
  meta: existing?.meta,
  access: existing?.access,
});
```

5. `updateProjectLocally` — same replacement (read `const existing = await db.projects.get(name);` then put with `meta: existing?.meta, access: existing?.access`).

6. `renameProjectLocally` — the new-name put gains `meta: record.meta, access: record.access` (the old record is already in scope).

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- "saveLock|localDb|persistence"`
Expected: PASS (all new + existing tests green)

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/services/saveLock.ts apps/azure/src/services/__tests__/saveLock.test.ts apps/azure/src/services/localDb.ts apps/azure/src/lib/persistence.ts apps/azure/src/services/__tests__/localDb.test.ts apps/azure/src/lib/__tests__/persistence.test.ts
git commit -m "feat(po-8b): Web Locks save helper + merge-preserving ProjectMetadata writes (sustainment no longer clobbered)"
```

---

### Task 2: ETag capture on load + phantom-ETag fix (TDD)

**Model:** Sonnet.

**Files:**

- Modify: `apps/azure/src/services/blobClient.ts` (`loadBlobProject` returns `{project, etag}`)
- Modify: `apps/azure/src/services/cloudSync.ts` (`loadFromCloud` shape; `saveToCloud` phantom-etag fix)
- Modify: `apps/azure/src/services/storage.ts` (mechanical call-site adaptation ONLY — the seam rewrite is Task 4)
- Modify: `apps/azure/src/services/__tests__/blobClient.test.ts`
- Modify: `apps/azure/src/services/__tests__/storage.test.ts` (mock shape + loadProject etag-refresh test)

- [ ] **Step 1: Write the failing tests**

In `apps/azure/src/services/__tests__/blobClient.test.ts`, locate the existing `loadBlobProject` test (if none exists, add to the projects describe) and add:

```typescript
it('PO-8b: loadBlobProject returns the blob ETag from the response body (header fallback)', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ project: { hubId: 'h1' }, etag: '"body-etag"' }), {
      status: 200,
    })
  );

  const loaded = await loadBlobProject('proj-1');
  expect(loaded).toEqual({ project: { hubId: 'h1' }, etag: '"body-etag"' });

  // header fallback when the body omits etag
  fetchSpy.mockResolvedValueOnce(
    new Response(JSON.stringify({ project: { hubId: 'h1' } }), {
      status: 200,
      headers: { ETag: '"header-etag"' },
    })
  );
  const fromHeader = await loadBlobProject('proj-1');
  expect(fromHeader?.etag).toBe('"header-etag"');

  // 404 still resolves null
  fetchSpy.mockResolvedValueOnce(new Response('', { status: 404 }));
  expect(await loadBlobProject('missing')).toBeNull();
  fetchSpy.mockRestore();
});
```

(Follow the file's existing fetch-spy idiom — locate the `'maps project save 412 to precondition-failed'` test for the pattern; reuse its setup helpers if the file wraps `fetch` differently.)

In `apps/azure/src/services/__tests__/storage.test.ts`:

1. Update the hoisted mock default (locate `mockLoadBlobProject: vi.fn().mockResolvedValue(null)` — `null` stays valid for the new shape).
2. Find every test that sets `mockLoadBlobProject.mockResolvedValue(<project>)` or `mockResolvedValueOnce(<project>)` (these exercise `loadProject` cloud hits) and wrap the value: `{ project: <project>, etag: '"cloud-etag"' }`.
3. Add to the `loadProject` describe:

```typescript
it('PO-8b: a cloud load refreshes the stored ETag + merge base (kills post-open false 412s)', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  mockSyncState.get.mockResolvedValue({
    name: 'etag-refresh',
    cloudId: 'cloud-9',
    lastSynced: '2026-06-01T00:00:00Z',
    etag: '"stale-etag"',
  });
  mockLoadBlobProject.mockResolvedValueOnce({ project: sampleProject, etag: '"fresh-etag"' });

  const { result } = renderHook(() => useStorage(), { wrapper });
  await act(async () => {
    await result.current.loadProject('etag-refresh', 'personal');
  });

  expect(mockSyncState.update).toHaveBeenCalledWith(
    'etag-refresh',
    expect.objectContaining({
      etag: '"fresh-etag"',
      baseStateJson: JSON.stringify(sampleProject),
    })
  );
});
```

4. Add a `saveToCloud` phantom-etag test to the save describe:

```typescript
it('PO-8b: an empty server ETag is never replaced by a fabricated timestamp (phantom-412 fix)', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  // markAsSynced only writes syncState when the project record exists
  mockProjects.get.mockResolvedValue({
    name: 'no-etag-project',
    location: 'personal',
    modified: new Date(),
    synced: false,
    data: sampleProject,
  });
  // PUT succeeds but returns no etag; the follow-up GET supplies the real one
  mockSaveBlobProject.mockResolvedValueOnce({ ok: true, etag: '' });
  mockLoadBlobProject.mockResolvedValueOnce({ project: sampleProject, etag: '"recovered-etag"' });

  const { result } = renderHook(() => useStorage(), { wrapper });
  await act(async () => {
    await result.current.saveProject(sampleProject, 'no-etag-project', 'personal');
  });

  // markAsSynced stored the RECOVERED etag — never a Date timestamp
  const syncPut = mockSyncState.put.mock.calls.at(-1)?.[0];
  expect(syncPut?.etag).toBe('"recovered-etag"');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter @variscout/azure-app test -- "blobClient.test|storage.test"`
Expected: FAIL — `loadBlobProject` returns the bare project; no syncState etag refresh on load; `saveToCloud` stores `now` for an empty etag.

- [ ] **Step 3: Implement**

In `apps/azure/src/services/blobClient.ts`, replace `loadBlobProject`:

```typescript
export interface LoadedBlobProject {
  project: Project;
  etag: string | null;
}

export async function loadBlobProject(projectId: string): Promise<LoadedBlobProject | null> {
  const loaded = await requestMaybeJson<{ project: Project; etag?: string }>(
    `/api/storage/projects/${encode(projectId)}`
  );
  if (!loaded?.data.project) return null;
  return {
    project: loaded.data.project,
    // server returns etag in the body (server.js GET handler); header is the fallback
    etag: loaded.data.etag ?? loaded.res.headers.get('ETag'),
  };
}
```

In `apps/azure/src/services/cloudSync.ts`:

1. `loadFromCloud` return type becomes the loaded pair (add `LoadedBlobProject` to the blobClient type import):

```typescript
export async function loadFromCloud(
  _token: string,
  name: string,
  _location: StorageLocation
): Promise<LoadedBlobProject | null> {
  const syncState = await db.syncState.get(name);
  if (!syncState?.cloudId) return null;
  return wrapBlobCall(() => loadBlobProject(syncState.cloudId));
}
```

2. In `saveToCloud`, replace `return { id: projectId, etag: result.etag || now };` with:

```typescript
// PO-8b phantom-412 fix: never fabricate an If-Match value. A timestamp
// stored as the etag can never match a real blob ETag → guaranteed false
// 412 → a spurious conflict dialog. If the PUT response omitted the etag
// (defensive path; Azure Blob always returns one), recover it with a GET;
// '' as the final fallback means the next save sends no If-Match (documented
// residual: requires a double server failure).
let etag = result.etag;
if (!etag) {
  const fresh = await wrapBlobCall(() => loadBlobProject(projectId)).catch(() => null);
  etag = fresh?.etag ?? '';
}
return { id: projectId, etag };
```

In `apps/azure/src/services/storage.ts` (mechanical adaptation only):

3. The pre-flight block (locate `const remoteProject = await loadFromCloud(token, name, location);` inside `saveProject`) — adapt minimally so tsc stays green (Task 4 deletes this block entirely):

```typescript
const remoteProject = (await loadFromCloud(token, name, location))?.project ?? null;
```

4. In `loadProject` (locate `const project = await loadFromCloud(token, name, location);`):

```typescript
const loaded = await loadFromCloud(token, name, location);
if (loaded) {
  const { project, etag } = loaded;
  // Cache locally
  const meta = extractMetadataInputs(project, userId) ?? undefined;
  await saveToIndexedDB(project, name, location, meta, userId);

  // Adopting the cloud copy: refresh the merge base AND the ETag —
  // the stored ETag is the If-Match basis for the next save (PO-8b).
  const existingSyncState = await db.syncState.get(name);
  if (existingSyncState) {
    await db.syncState.update(name, {
      baseStateJson: JSON.stringify(project),
      ...(etag ? { etag, lastSynced: new Date().toISOString() } : {}),
    });
  }

  return project;
}
```

- [ ] **Step 4: Run the storage + blobClient + cloudSync test files**

Run: `pnpm --filter @variscout/azure-app test -- "blobClient|cloudSync|storage.test"`
Expected: PASS — including the UNTOUCHED evidence-path tests (`blobClient.etag.test.ts`, `cloudSync.etag.test.ts` — the exempt path shares no changed symbol).

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/services/blobClient.ts apps/azure/src/services/cloudSync.ts apps/azure/src/services/storage.ts apps/azure/src/services/__tests__/blobClient.test.ts apps/azure/src/services/__tests__/storage.test.ts
git commit -m "feat(po-8b): ETag capture on cloud load + phantom-ETag fabrication fix"
```

---

### Task 3: Save-serialize telemetry with the dual re-architect trigger (TDD)

**Model:** Sonnet.

**Files:**

- Create: `apps/azure/src/lib/saveTelemetry.ts`
- Create: `apps/azure/src/lib/__tests__/saveTelemetry.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/azure/src/lib/__tests__/saveTelemetry.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSafeTrackEvent } = vi.hoisted(() => ({ mockSafeTrackEvent: vi.fn() }));
vi.mock('../appInsights', () => ({ safeTrackEvent: mockSafeTrackEvent }));

import {
  LONG_TASK_TRIGGER_MS,
  OVERSIZE_TRIGGER_BYTES,
  trackDocumentSaveSerialize,
} from '../saveTelemetry';

beforeEach(() => {
  mockSafeTrackEvent.mockClear();
});

describe('trackDocumentSaveSerialize (PO-8b — research-grounded dual trigger)', () => {
  it('emits a structural-only event (bytes + ms, never names/content)', () => {
    trackDocumentSaveSerialize({ sizeBytes: 1_500_000, serializeMs: 12.345 });

    expect(mockSafeTrackEvent).toHaveBeenCalledTimes(1);
    const [name, props] = mockSafeTrackEvent.mock.calls[0];
    expect(name).toBe('Document.Save.Serialize');
    expect(props).toEqual({
      sizeBytes: 1_500_000,
      serializeMs: 12.35,
      oversize: false,
      longTask: false,
    });
    // PII guard: the payload carries ONLY these structural keys
    expect(Object.keys(props).sort()).toEqual(['longTask', 'oversize', 'serializeMs', 'sizeBytes']);
  });

  it('fires the re-architect trigger on size (>50MB)', () => {
    trackDocumentSaveSerialize({ sizeBytes: OVERSIZE_TRIGGER_BYTES + 1, serializeMs: 5 });
    expect(mockSafeTrackEvent).toHaveBeenCalledWith(
      'Document.Save.ReArchitectTrigger',
      expect.objectContaining({ trigger: 'size' })
    );
  });

  it('fires the re-architect trigger on duration (>50ms long-task)', () => {
    trackDocumentSaveSerialize({ sizeBytes: 1000, serializeMs: LONG_TASK_TRIGGER_MS + 1 });
    expect(mockSafeTrackEvent).toHaveBeenCalledWith(
      'Document.Save.ReArchitectTrigger',
      expect.objectContaining({ trigger: 'duration' })
    );
  });

  it('negative control: a small fast save fires NO trigger event', () => {
    trackDocumentSaveSerialize({ sizeBytes: 1000, serializeMs: 3 });
    expect(mockSafeTrackEvent).toHaveBeenCalledTimes(1); // only the Serialize event
    expect(mockSafeTrackEvent.mock.calls[0][0]).toBe('Document.Save.Serialize');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @variscout/azure-app test -- saveTelemetry`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement**

`apps/azure/src/lib/saveTelemetry.ts`:

```typescript
/**
 * PO-8b save-serialize telemetry (spec §9.4 as amended by §17).
 *
 * The worker-marshal serialization was CUT on research grounds (2026-06-05):
 * postMessage structured-clone is synchronous on the sending thread and, for
 * plain-object graphs, slower than the stringify it would offload — so the
 * deliverable is MEASUREMENT, not a worker. This module is the dual
 * re-architect trigger:
 *   - size:     > 50 MB document (the spec's split-raw-rows line)
 *   - duration: > 50 ms serialize (the web.dev long-task threshold)
 * Revive path when a trigger fires on real customer data: columnar
 * transferable SoA (zero-copy postMessage) or OPFS worker-owned persistence —
 * never marshal-then-stringify. See decision-log 2026-06-05 + spec §17.
 *
 * PII hard rule (azure CLAUDE.md): structural numbers only — bytes, ms,
 * booleans. Never project names, labels, or row contents.
 */
import { safeTrackEvent } from './appInsights';

export const OVERSIZE_TRIGGER_BYTES = 50 * 1024 * 1024;
export const LONG_TASK_TRIGGER_MS = 50;

export interface DocumentSaveMeasurement {
  sizeBytes: number;
  serializeMs: number;
}

export function trackDocumentSaveSerialize({
  sizeBytes,
  serializeMs,
}: DocumentSaveMeasurement): void {
  const oversize = sizeBytes > OVERSIZE_TRIGGER_BYTES;
  const longTask = serializeMs > LONG_TASK_TRIGGER_MS;

  safeTrackEvent('Document.Save.Serialize', {
    sizeBytes,
    serializeMs: Math.round(serializeMs * 100) / 100,
    oversize,
    longTask,
  });

  if (oversize || longTask) {
    safeTrackEvent('Document.Save.ReArchitectTrigger', {
      sizeBytes,
      serializeMs: Math.round(serializeMs),
      trigger: oversize ? 'size' : 'duration',
    });
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @variscout/azure-app test -- saveTelemetry`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/lib/saveTelemetry.ts apps/azure/src/lib/__tests__/saveTelemetry.test.ts
git commit -m "feat(po-8b): save-serialize telemetry — dual re-architect trigger replaces the cut worker-marshal"
```

---

### Task 4: The conflict seam — storage.ts rewrite (TDD; the keystone)

**Model:** Opus.

**Files:**

- Modify: `apps/azure/src/services/storage.ts`
- Modify: `apps/azure/src/services/__tests__/storage.test.ts`

**Behavior contract:** `saveProject` returns `SaveProjectResult`; the timestamp pre-flight is DELETED; the 412 catch sets `pendingConflict` and returns `{status:'conflict'}` (NO auto-fork, NO conflict-copy toast); the IDB-write + blob-PUT critical section runs under `withDocumentSaveLock` (the dialog opens only after the lock releases — two-phase); `reloadProjectFromCloud` adopts the remote copy (Dexie + ETag + merge base) under the lock; `loadProject` becomes merge-preserving on the cloud path and heals meta on the local fallback; serialize telemetry fires per cloud save.

- [ ] **Step 1: Write the failing tests**

In `apps/azure/src/services/__tests__/storage.test.ts`:

**1a.** REPLACE the test `'uses clear conflict-copy copy when ETag save detects a cloud conflict'` (locate by name) with:

```typescript
it('PO-8b: a 412 ETag conflict surfaces the reload-or-branch decision instead of the silent auto-fork', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  mockSaveBlobProject.mockResolvedValueOnce({ ok: false, reason: 'precondition-failed' });

  const { result } = renderHook(() => useStorage(), { wrapper });

  let saveResult: Awaited<ReturnType<typeof result.current.saveProject>> | undefined;
  await act(async () => {
    saveResult = await result.current.saveProject(sampleProject, 'conflicted-project', 'personal');
  });

  expect(saveResult).toEqual({ status: 'conflict' });
  expect(result.current.pendingConflict).toEqual({
    name: 'conflicted-project',
    location: 'personal',
  });
  expect(result.current.syncStatus.status).toBe('conflict');
  // the silent auto-fork is GONE: exactly ONE blob PUT — no "(conflict copy)" save
  expect(mockSaveBlobProject).toHaveBeenCalledTimes(1);
  expect(result.current.notifications.some(n => n.message.includes('(conflict copy)'))).toBe(false);
});
```

**1b.** ADD these tests to the same describe:

```typescript
it('PO-8b negative control: a matching-ETag save writes silently — result saved, no conflict state', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  mockSyncState.get.mockResolvedValue({
    name: 'clean-project',
    cloudId: 'cloud-1',
    lastSynced: '2026-06-01T00:00:00Z',
    etag: '"current-etag"',
  });
  mockSaveBlobProject.mockResolvedValueOnce({ ok: true, etag: '"next-etag"' });

  const { result } = renderHook(() => useStorage(), { wrapper });
  let saveResult: Awaited<ReturnType<typeof result.current.saveProject>> | undefined;
  await act(async () => {
    saveResult = await result.current.saveProject(sampleProject, 'clean-project', 'personal');
  });

  expect(saveResult).toEqual({ status: 'saved' });
  expect(result.current.pendingConflict).toBeNull();
  // the stored ETag rode as the If-Match precondition (4th saveBlobProject arg)
  expect(mockSaveBlobProject).toHaveBeenCalledWith(
    expect.anything(),
    'cloud-1',
    expect.anything(),
    '"current-etag"'
  );
});

it('PO-8b: a stale stored ETag conflicts via If-Match/412 alone — the retired pre-flight adds nothing (no metadata GET, no eager remote load)', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  mockSyncState.get.mockResolvedValue({
    name: 'stale-project',
    cloudId: 'cloud-2',
    lastSynced: '2026-06-01T00:00:00Z',
    etag: '"stale-etag"',
    baseStateJson: JSON.stringify(sampleProject), // would have armed the OLD pre-flight
  });
  mockSaveBlobProject.mockResolvedValueOnce({ ok: false, reason: 'precondition-failed' });

  const { result } = renderHook(() => useStorage(), { wrapper });
  await act(async () => {
    await result.current.saveProject(sampleProject, 'stale-project', 'personal');
  });

  expect(result.current.pendingConflict).toEqual({ name: 'stale-project', location: 'personal' });
  // pre-flight retired: no loadBlobMetadata (getCloudModifiedDate) and no
  // loadBlobProject (eager remote fetch) during the SAVE path
  expect(mockLoadBlobMetadata).not.toHaveBeenCalled();
  expect(mockLoadBlobProject).not.toHaveBeenCalled();
});

it('PO-8b: dismissConflict clears the pending decision', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  mockSaveBlobProject.mockResolvedValueOnce({ ok: false, reason: 'precondition-failed' });

  const { result } = renderHook(() => useStorage(), { wrapper });
  await act(async () => {
    await result.current.saveProject(sampleProject, 'deferred-project', 'personal');
  });
  expect(result.current.pendingConflict).not.toBeNull();

  act(() => {
    result.current.dismissConflict();
  });
  expect(result.current.pendingConflict).toBeNull();
});

it('PO-8b: reloadProjectFromCloud adopts the remote copy — Dexie cache + ETag + merge base refresh; conflict cleared', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  const remote = makeSnapshot({
    project: {
      ...sampleProject.project,
      projectName: 'Remote version',
    } as DocumentSnapshot['project'],
  });
  mockSyncState.get.mockResolvedValue({
    name: 'conflicted-project',
    cloudId: 'cloud-3',
    lastSynced: '2026-06-01T00:00:00Z',
    etag: '"stale-etag"',
  });
  mockSaveBlobProject.mockResolvedValueOnce({ ok: false, reason: 'precondition-failed' });
  mockLoadBlobProject.mockResolvedValueOnce({ project: remote, etag: '"fresh-etag"' });

  const { result } = renderHook(() => useStorage(), { wrapper });
  await act(async () => {
    await result.current.saveProject(sampleProject, 'conflicted-project', 'personal');
  });
  expect(result.current.pendingConflict).not.toBeNull();

  let reloaded: DocumentSnapshot | null = null;
  await act(async () => {
    reloaded = await result.current.reloadProjectFromCloud('conflicted-project', 'personal');
  });

  expect(reloaded).toEqual(remote);
  expect(result.current.pendingConflict).toBeNull();
  expect(mockProjects.put).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'conflicted-project', data: remote })
  );
  expect(mockSyncState.update).toHaveBeenCalledWith(
    'conflicted-project',
    expect.objectContaining({
      etag: '"fresh-etag"',
      baseStateJson: JSON.stringify(remote),
    })
  );
});

it('PO-8b: a failed reload leaves the local copy untouched + surfaces an error notification', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  mockSyncState.get.mockResolvedValue({
    name: 'ghost-project',
    cloudId: 'cloud-4',
    lastSynced: '2026-06-01T00:00:00Z',
    etag: '"e"',
  });
  mockLoadBlobProject.mockResolvedValueOnce(null); // blob gone

  const { result } = renderHook(() => useStorage(), { wrapper });
  let reloaded: DocumentSnapshot | null = sampleProject;
  await act(async () => {
    reloaded = await result.current.reloadProjectFromCloud('ghost-project', 'personal');
  });

  expect(reloaded).toBeNull();
  expect(
    result.current.notifications.some(n => n.type === 'error' && /cloud version/i.test(n.message))
  ).toBe(true);
  expect(mockProjects.put).not.toHaveBeenCalled();
});

it('PO-8b: two concurrent saves of the same document cannot interleave under the Web Lock', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  // functional LockManager: a real exclusive queue per lock name
  const queues = new Map<string, Promise<unknown>>();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (lockName: string, _opts: unknown, cb: () => Promise<unknown>) => {
        const prev = queues.get(lockName) ?? Promise.resolve();
        const next = prev.then(() => cb());
        queues.set(
          lockName,
          next.catch(() => undefined)
        );
        return next;
      },
    },
  });

  // markAsSynced only writes syncState when the project record exists
  mockProjects.get.mockResolvedValue({
    name: 'same-doc',
    location: 'personal',
    modified: new Date(),
    synced: false,
    data: sampleProject,
  });

  const events: string[] = [];
  mockProjects.put.mockImplementation(async () => {
    events.push('idb-write');
  });
  mockSaveBlobProject.mockImplementation(async () => {
    events.push('put-start');
    await new Promise(resolve => setTimeout(resolve, 20));
    events.push('put-end');
    return { ok: true, etag: '"e"' };
  });
  mockSyncState.put.mockImplementation(async () => {
    events.push('mark-synced');
  });

  const { result } = renderHook(() => useStorage(), { wrapper });
  await act(async () => {
    await Promise.all([
      result.current.saveProject(sampleProject, 'same-doc', 'personal'),
      result.current.saveProject(sampleProject, 'same-doc', 'personal'),
    ]);
  });

  // tab B's wholesale write begins only AFTER tab A's full critical section
  expect(events).toEqual([
    'idb-write',
    'put-start',
    'put-end',
    'mark-synced',
    'idb-write',
    'put-start',
    'put-end',
    'mark-synced',
  ]);

  Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
});

it('PO-8b: a document save preserves the Control-owned sustainment projection (no clobber)', async () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  const seededSustainment = {
    recordId: 'cr-1',
    cadence: 'weekly',
    nextReviewDue: '2026-07-01T00:00:00.000Z',
    latestVerdict: 'holding',
  };
  mockProjects.get.mockResolvedValue({
    name: 'control-project',
    location: 'personal',
    modified: new Date(),
    synced: true,
    data: sampleProject,
    meta: {
      phase: 'scout',
      findingCounts: {},
      questionCounts: {},
      lastViewedAt: {},
      sustainment: seededSustainment,
    },
  });

  const { result } = renderHook(() => useStorage(), { wrapper });
  await act(async () => {
    await result.current.saveProject(sampleProject, 'control-project', 'personal');
  });

  expect(mockProjects.put).toHaveBeenCalledWith(
    expect.objectContaining({
      meta: expect.objectContaining({ sustainment: seededSustainment }),
    })
  );
});

it('PO-8b heal: an offline open recomputes stale aggregate-derived meta while PRESERVING sustainment', async () => {
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
  const seededSustainment = {
    recordId: 'cr-1',
    cadence: 'weekly',
    nextReviewDue: '2026-07-01T00:00:00.000Z',
    latestVerdict: 'holding',
  };
  mockProjects.get.mockResolvedValue({
    name: 'heal-me',
    location: 'personal',
    modified: new Date(),
    synced: true,
    data: sampleProject,
    meta: {
      phase: 'improve', // stale — the mocked buildProjectMetadata recomputes 'scout'
      findingCounts: { stale: 99 },
      questionCounts: {},
      lastViewedAt: {},
      sustainment: seededSustainment,
    },
  });

  const { result } = renderHook(() => useStorage(), { wrapper });
  let loaded: DocumentSnapshot | null = null;
  await act(async () => {
    loaded = await result.current.loadProject('heal-me', 'personal');
  });

  expect(loaded).toEqual(sampleProject);
  expect(mockProjects.update).toHaveBeenCalledWith('heal-me', {
    meta: expect.objectContaining({ phase: 'scout', sustainment: seededSustainment }),
  });
});

it('PO-8b heal negative control: an up-to-date meta is NOT rewritten on open', async () => {
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
  // exactly what the mocked buildProjectMetadata recomputes (no sustainment seeded)
  mockProjects.get.mockResolvedValue({
    name: 'already-clean',
    location: 'personal',
    modified: new Date(),
    synced: true,
    data: sampleProject,
    meta: { phase: 'scout', findingCounts: {}, questionCounts: {}, lastViewedAt: {} },
  });

  const { result } = renderHook(() => useStorage(), { wrapper });
  await act(async () => {
    await result.current.loadProject('already-clean', 'personal');
  });

  expect(mockProjects.update).not.toHaveBeenCalled();
});
```

**1c.** Other existing tests in this file await `saveProject` and ignore the return — they keep passing unchanged. If any asserts the OLD conflict-copy toast/second-PUT behavior elsewhere, rewrite it to the new contract (there is exactly one: the test replaced in 1a).

- [ ] **Step 2: Run to verify the new tests fail**

Run: `pnpm --filter @variscout/azure-app test -- storage.test`
Expected: FAIL — `pendingConflict`/`reloadProjectFromCloud`/`dismissConflict` don't exist; saveProject returns void; the auto-fork double-PUT still fires; pre-flight still calls loadBlobMetadata; sustainment still clobbered.

- [ ] **Step 3: Implement the storage.ts rewrite**

1. New imports:

```typescript
import { withDocumentSaveLock } from './saveLock';
import { trackDocumentSaveSerialize } from '../lib/saveTelemetry';
```

and extend the `./localDb` import list with `mergeProjectMetadata, metadataChanged`. (`loadFromIndexedDB` becomes unused after step 6b below — REMOVE it from the import.)

2. New exported types + context members (place above `StorageContextValue`):

```typescript
/** PO-8b: the save outcome the Editor branches on (only 'conflict' changes its behavior). */
export type SaveProjectResult =
  | { status: 'saved' }
  | { status: 'offline' }
  | { status: 'conflict' }
  | { status: 'error' };

/** PO-8b: a 412 awaiting the user's reload-or-branch decision. */
export interface PendingSaveConflict {
  name: string;
  location: StorageLocation;
}
```

In `StorageContextValue`:

```typescript
  saveProject: (project: Project, name: string, location: StorageLocation) => Promise<SaveProjectResult>;
  /** PO-8b: non-null while a 412 conflict awaits the user's reload-or-branch decision. */
  pendingConflict: PendingSaveConflict | null;
  /** PO-8b "Not now": clears the pending decision (the doc stays conflicted; a manual save re-opens it). */
  dismissConflict: () => void;
  /** PO-8b "Load cloud version": fetch remote, refresh Dexie cache + ETag + merge base, clear the conflict. */
  reloadProjectFromCloud: (name: string, location: StorageLocation) => Promise<Project | null>;
```

3. Provider state (next to `notifications`):

```typescript
const [pendingConflict, setPendingConflict] = useState<PendingSaveConflict | null>(null);
```

4. **Rewrite `saveProject`** (full replacement of the callback body):

```typescript
const saveProject = useCallback(
  async (project: Project, name: string, location: StorageLocation): Promise<SaveProjectResult> => {
    // Build lightweight metadata for portfolio view
    const user = await getEasyAuthUser().catch(() => null);
    const userId = user?.userId || user?.email || 'local';
    // Read the existing record so the rebuild preserves lastViewedAt AND the
    // Control-owned sustainment projection (PO-8b heal contract: merge, never clobber)
    const existingRecord = await db.projects.get(name).catch(() => null);
    const recomputedMeta = extractMetadataInputs(
      project,
      userId,
      existingRecord?.meta?.lastViewedAt
    );
    const meta = recomputedMeta
      ? mergeProjectMetadata(existingRecord?.meta, recomputedMeta)
      : undefined;

    // PO-8b two-phase concurrency: the wholesale IDB write + blob PUT run under
    // an exclusive per-document Web Lock. On 412 the callback RETURNS (releasing
    // the lock) carrying the conflict — the dialog renders lock-free; Branch and
    // Reload re-acquire the lock for their writes. Never await human input here.
    return withDocumentSaveLock(name, async (): Promise<SaveProjectResult> => {
      // Always save to IndexedDB first (instant feedback)
      try {
        await saveToIndexedDB(project, name, location, meta, userId);
      } catch (dbError) {
        const isQuota = dbError instanceof DOMException && dbError.name === 'QuotaExceededError';
        const message = isQuota
          ? 'Storage quota exceeded. Delete old projects to free space.'
          : 'Local save failed. Your data may not be persisted.';
        setSyncStatus({ status: 'error', message });
        addNotification({ type: 'error', message, dismissAfter: isQuota ? 10000 : 5000 });
        return { status: 'error' }; // Do not attempt cloud sync if local save failed
      }

      if (!navigator.onLine) {
        await addToSyncQueue({ project, name, location });
        setSyncStatus({
          status: 'offline',
          message: 'Saved offline, will sync when connected',
        });
        addNotification({
          type: 'info',
          message: 'Saved offline, will sync when connected',
          dismissAfter: 3000,
        });
        return { status: 'offline' };
      }

      const token = STORAGE_API_BOUNDARY;

      // Online: sync immediately. The 412/If-Match check in saveToCloud is the
      // SOLE conflict surface — the timestamp pre-flight is retired (PO-8b; it
      // was strictly dominated: the server PUT advances analysis.json's ETag
      // and metadata.json's timestamp atomically, so If-Match catches every
      // state the timestamp compare caught, one round-trip cheaper).
      try {
        setSyncStatus({ status: 'syncing', message: 'Saving to cloud...' });
        const access = extractDocumentAccess(project, userId);

        // PO-8b telemetry: the merge-base string doubles as the size/duration
        // measurement — no extra stringify pass.
        const serializeStart = performance.now();
        const baseStateForSync = JSON.stringify(project);
        trackDocumentSaveSerialize({
          sizeBytes: baseStateForSync.length,
          serializeMs: performance.now() - serializeStart,
        });

        const { id, etag } = await saveToCloud(token, project, name, location, meta, access);

        // Fire-and-forget: write metadata sidecar alongside .vrs
        if (meta) {
          saveSidecarToCloud(token, meta, name, location).catch(e => {
            if (import.meta.env.DEV) console.warn('[Storage] Sidecar write failed:', e);
          });
        }

        await markAsSynced(name, id, etag, baseStateForSync);
        setSyncStatus({
          status: 'synced',
          message: 'Saved to cloud',
          lastSynced: new Date(),
        });
        addNotification({ type: 'success', message: 'Saved to cloud', dismissAfter: 3000 });
        return { status: 'saved' };
      } catch (error) {
        if (error instanceof ProjectDocumentConflictErrorClass) {
          // PO-8b: the explicit reload-or-branch dialog replaces the silent
          // auto-fork. State set inside the lock is fine — React renders the
          // dialog only after this callback returns and the lock releases.
          setPendingConflict({ name, location });
          setSyncStatus({ status: 'conflict', message: 'Cloud version changed' });
          return { status: 'conflict' };
        }
        if (error instanceof CloudSyncUnavailableErrorClass) {
          // Cloud sync not yet available (ADR-059 Phase 2 pending)
          setSyncStatus({ status: 'saved', message: 'Saved locally' });
          addNotification({
            type: 'info',
            message: 'Cloud sync unavailable — Blob Storage migration pending. Data saved locally.',
            dismissAfter: 5000,
          });
          return { status: 'saved' };
        }

        if (import.meta.env.DEV) console.error('Cloud save failed:', error);
        const classified = classifySyncError(error);

        await addToSyncQueue({ project, name, location });

        if (classified.category === 'auth') {
          setSyncStatus({ status: 'error', message: 'Authentication expired' });
          addNotification({
            type: 'error',
            message: 'Session expired. Please sign in again.',
            action: {
              label: 'Sign in',
              onClick: () => {
                window.location.href = '/.auth/login/aad';
              },
            },
          });
          return { status: 'error' };
        } else if (classified.retryable) {
          setSyncStatus({
            status: 'offline',
            message: classified.message,
          });
          // Queue for retry with backoff
          retryQueue.current.push({ project, name, location, attempt: 1 });
          const delay = RETRY_DELAYS[0];
          scheduleRetry(delay);
          addNotification({ type: 'warning', message: classified.message, dismissAfter: 5000 });
          return { status: 'offline' };
        } else {
          setSyncStatus({
            status: 'offline',
            message: 'Save failed, will retry when connected',
          });
          return { status: 'offline' };
        }
      }
    });
  },
  [addNotification, scheduleRetry]
);
```

(Note what is GONE: the `syncState?.baseStateJson` pre-flight block — `getCloudModifiedDate` + eager `loadFromCloud` + the eager conflict-copy `saveToCloud` + its warning toast — and the entire `ProjectDocumentConflictErrorClass` auto-fork. `getCloudModifiedDate` and `loadFromCloud` stay imported: `loadProject` uses both.)

5. **Add `dismissConflict` + `reloadProjectFromCloud`** (after `loadProject`):

```typescript
// ── PO-8b conflict resolution ──────────────────────────────────────

const dismissConflict = useCallback(() => {
  setPendingConflict(null);
}, []);

const reloadProjectFromCloud = useCallback(
  async (name: string, location: StorageLocation): Promise<Project | null> => {
    const token = STORAGE_API_BOUNDARY;
    const user = await getEasyAuthUser().catch(() => null);
    const userId = user?.userId || user?.email || 'local';

    let loaded: Awaited<ReturnType<typeof loadFromCloud>> = null;
    try {
      loaded = await loadFromCloud(token, name, location);
    } catch (error) {
      errorService.logWarning('Conflict reload failed', {
        component: 'storage',
        action: 'reloadProjectFromCloud',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
    }
    if (!loaded) {
      addNotification({
        type: 'error',
        message: 'Could not load the cloud version. Your local copy is unchanged.',
        dismissAfter: 8000,
      });
      return null;
    }
    const { project, etag } = loaded;

    // Adopting the remote copy is a wholesale write — same lock as a save.
    await withDocumentSaveLock(name, async () => {
      const existingRecord = await db.projects.get(name).catch(() => null);
      const recomputed = extractMetadataInputs(project, userId, existingRecord?.meta?.lastViewedAt);
      const meta = recomputed ? mergeProjectMetadata(existingRecord?.meta, recomputed) : undefined;
      await saveToIndexedDB(project, name, location, meta, userId);

      const syncState = await db.syncState.get(name);
      if (syncState) {
        // The fresh ETag is the If-Match basis for the next save — without
        // this refresh, every post-reload save would 412 forever.
        await db.syncState.update(name, {
          lastSynced: new Date().toISOString(),
          baseStateJson: JSON.stringify(project),
          ...(etag ? { etag } : {}),
        });
      }
    });

    setPendingConflict(null);
    setSyncStatus({ status: 'synced', message: 'Cloud version loaded', lastSynced: new Date() });
    return project;
  },
  [addNotification]
);
```

6. **`loadProject` heal** — two edits:

   a. Cloud path: the Task-2 cache-write gains the merge (replace `const meta = extractMetadataInputs(project, userId) ?? undefined;`):

```typescript
const existingRecord = await db.projects.get(name).catch(() => null);
const recomputed = extractMetadataInputs(project, userId, existingRecord?.meta?.lastViewedAt);
const meta = recomputed ? mergeProjectMetadata(existingRecord?.meta, recomputed) : undefined;
```

b. Local fallback: replace the final `return loadFromIndexedDB(name);` with:

```typescript
// Fallback to local — heal the portfolio projection on open (PO-8b):
// recompute the aggregate-derived fields, merge-preserving the Control-owned
// sustainment projection; write only on an actual change; a null recompute
// (malformed aggregate) skips the heal — never write null meta.
const record = await db.projects.get(name).catch(() => null);
if (!record) return null;
const recomputed = extractMetadataInputs(record.data, userId, record.meta?.lastViewedAt);
if (recomputed) {
  const merged = mergeProjectMetadata(record.meta, recomputed);
  if (metadataChanged(record.meta, merged)) {
    await db.projects.update(name, { meta: merged });
  }
}
return record.data;
```

c. The local fallback now needs `userId` — HOIST the user fetch to the top of the `loadProject` callback (before `if (navigator.onLine)`), removing the duplicate inside the online block:

```typescript
const user = await getEasyAuthUser().catch(() => null);
const userId = user?.userId || user?.email || 'local';
```

d. `loadFromIndexedDB` is no longer called — remove it from the `./localDb` import.

7. **Context value**: add `pendingConflict, dismissConflict, reloadProjectFromCloud` to the `value` object.

- [ ] **Step 4: Run the storage suite**

Run: `pnpm --filter @variscout/azure-app test -- storage.test`
Expected: PASS — all new tests + every untouched existing test (offline queue, retry, auth, evidence, notifications).

- [ ] **Step 5: Acceptance greps**

```bash
grep -n "baseStateJson" apps/azure/src/services/storage.ts
# Expected: hits ONLY in markAsSynced call args / reload / loadProject merge-base refresh — NO `if (syncState?.baseStateJson)` pre-flight guard
grep -n "conflict copy" apps/azure/src/services/storage.ts
# Expected: ZERO hits (the auto-fork is gone from storage; the name lives in the Editor's Branch handler)
grep -n "getCloudModifiedDate" apps/azure/src/services/storage.ts
# Expected: exactly ONE call site (loadProject's load-time conflict detector) + the import
```

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/services/storage.ts apps/azure/src/services/__tests__/storage.test.ts
git commit -m "feat(po-8b): conflict seam — SaveProjectResult + pendingConflict + reload; pre-flight retired; Web Lock around the wholesale write; meta heal on load"
```

---

### Task 5: SaveConflictDialog component (TDD)

**Model:** Sonnet.

**Files:**

- Create: `apps/azure/src/components/SaveConflictDialog.tsx`
- Create: `apps/azure/src/components/__tests__/SaveConflictDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

`apps/azure/src/components/__tests__/SaveConflictDialog.test.tsx` (the showModal polyfill mirrors `packages/ui` ConfirmDialog's test):

```typescript
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SaveConflictDialog } from '../SaveConflictDialog';

beforeAll(() => {
  // jsdom <dialog> polyfill (same approach as packages/ui ConfirmDialog tests)
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});

function renderDialog(overrides: Partial<Parameters<typeof SaveConflictDialog>[0]> = {}) {
  const handlers = {
    onReload: vi.fn(),
    onBranch: vi.fn(),
    onDismiss: vi.fn(),
  };
  render(
    <SaveConflictDialog
      isOpen
      documentName="Line 4 scrap"
      {...handlers}
      {...overrides}
    />
  );
  return handlers;
}

describe('SaveConflictDialog (PO-8b reload-or-branch)', () => {
  it('names the conflicted document and makes the discard consequence explicit', () => {
    renderDialog();
    expect(screen.getByText('Cloud copy has changed')).toBeInTheDocument();
    expect(screen.getByText(/Line 4 scrap/)).toBeInTheDocument();
    expect(screen.getByText(/unsaved changes are discarded/i)).toBeInTheDocument();
  });

  it('"Keep mine as a copy" fires onBranch only (negative control: not reload/dismiss)', () => {
    const handlers = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /keep mine as a copy/i }));
    expect(handlers.onBranch).toHaveBeenCalledTimes(1);
    expect(handlers.onReload).not.toHaveBeenCalled();
    expect(handlers.onDismiss).not.toHaveBeenCalled();
  });

  it('"Load cloud version" fires onReload only', () => {
    const handlers = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /load cloud version/i }));
    expect(handlers.onReload).toHaveBeenCalledTimes(1);
    expect(handlers.onBranch).not.toHaveBeenCalled();
  });

  it('"Not now" and ESC both defer via onDismiss', () => {
    const handlers = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /not now/i }));
    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);

    // ESC → native cancel event
    fireEvent(screen.getByRole('alertdialog'), new Event('cancel'));
    expect(handlers.onDismiss).toHaveBeenCalledTimes(2);
    expect(handlers.onReload).not.toHaveBeenCalled();
    expect(handlers.onBranch).not.toHaveBeenCalled();
  });

  it('closed when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.getByTestId('save-conflict-dialog')).not.toHaveAttribute('open');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @variscout/azure-app test -- SaveConflictDialog`
Expected: FAIL — component does not exist

- [ ] **Step 3: Implement**

`apps/azure/src/components/SaveConflictDialog.tsx`:

```tsx
import React, { useEffect, useId, useRef } from 'react';

export interface SaveConflictDialogProps {
  isOpen: boolean;
  documentName: string;
  /** Load the cloud version — discards unsaved local changes (the lossy choice, stated in the copy). */
  onReload: () => void;
  /** Keep the local version as a new "(conflict copy)" document (the lossless choice — primary). */
  onBranch: () => void;
  /** Defer the decision: "Not now" / ESC / backdrop. Autosave stays suspended; a manual save re-opens. */
  onDismiss: () => void;
}

/**
 * SaveConflictDialog — PO-8b explicit reload-or-branch resolution for a 412
 * cloud conflict (replaces the silent auto-conflict-copy; spec §9.4 as amended
 * by §17). Mirrors the packages/ui ConfirmDialog native-<dialog> conventions
 * (showModal focus trap, ESC → cancel event, backdrop click) with a third
 * action — azure-local because the copy and flow are Azure-cloud-sync
 * specific. Deliberately a React component, never window.confirm: native
 * dialogs wedge CDP and cannot be test- or chrome-driven (PO-3/PO-5 lesson).
 * English literals match the shipped azure-sync toast convention (no
 * MessageCatalog keys — those are all-or-nothing across 32 locales).
 */
export const SaveConflictDialog: React.FC<SaveConflictDialogProps> = ({
  isOpen,
  documentName,
  onReload,
  onBranch,
  onDismiss,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (isOpen && !el.open) {
      el.showModal();
    } else if (!isOpen && el.open) {
      el.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onDismiss();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={onDismiss}
      onClick={handleBackdropClick}
      data-testid="save-conflict-dialog"
      className="rounded-lg bg-surface-primary shadow-xl backdrop:bg-black/30 p-0 border-0"
    >
      <div className="flex flex-col gap-4 px-6 py-5 min-w-72 max-w-md">
        <h2 id={titleId} className="text-lg font-semibold text-content">
          Cloud copy has changed
        </h2>
        <p id={messageId} className="text-sm text-content-muted">
          Someone else saved “{documentName}” after you last synced. Load the cloud version (your
          unsaved changes are discarded), or keep your version as a separate copy.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onReload}
            className="px-4 py-2 text-sm text-content-secondary border border-edge hover:bg-surface-secondary rounded-lg transition-colors"
          >
            Load cloud version
          </button>
          <button
            type="button"
            onClick={onBranch}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Keep mine as a copy
          </button>
        </div>
      </div>
    </dialog>
  );
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @variscout/azure-app test -- SaveConflictDialog`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/SaveConflictDialog.tsx apps/azure/src/components/__tests__/SaveConflictDialog.test.tsx
git commit -m "feat(po-8b): SaveConflictDialog — reload-or-branch, native <dialog>, chrome-drivable"
```

---

### Task 6: Storage durability — persist()/estimate() + Admin health check (TDD)

**Model:** Sonnet.

**Files:**

- Create: `apps/azure/src/services/storageDurability.ts`
- Create: `apps/azure/src/services/__tests__/storageDurability.test.ts`
- Modify: `apps/azure/src/hooks/useAdminHealthChecks.ts` (new check + `detail` field)
- Modify: `apps/azure/src/components/admin/AdminStatusTab.tsx` (render `detail`)
- Modify: `apps/azure/src/hooks/__tests__/useAdminHealthChecks.test.ts`

- [ ] **Step 1: Write the failing tests**

`apps/azure/src/services/__tests__/storageDurability.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetPersistRequestedForTests,
  formatStorageEstimate,
  getStorageEstimate,
  requestPersistentStorageOnce,
} from '../storageDurability';

function installStorageManager(overrides: Partial<StorageManager> = {}) {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: {
      persist: vi.fn().mockResolvedValue(true),
      persisted: vi.fn().mockResolvedValue(false),
      estimate: vi.fn().mockResolvedValue({ usage: 12_582_912, quota: 2_147_483_648 }),
      ...overrides,
    },
  });
}

beforeEach(() => {
  _resetPersistRequestedForTests();
});

afterEach(() => {
  Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });
});

describe('storageDurability (PO-8b — greenfield StorageManager wiring)', () => {
  it('requestPersistentStorageOnce asks once per session (the gesture guard)', async () => {
    installStorageManager();
    const first = await requestPersistentStorageOnce();
    const second = await requestPersistentStorageOnce();
    expect(first).toBe(true);
    expect(second).toBeNull(); // once-guard
    expect((navigator.storage.persist as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('already-persisted short-circuits without prompting', async () => {
    installStorageManager({ persisted: vi.fn().mockResolvedValue(true) });
    expect(await requestPersistentStorageOnce()).toBe(true);
    expect(navigator.storage.persist).not.toHaveBeenCalled();
  });

  it('absent API → null, never a throw (jsdom / older Safari)', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });
    expect(await requestPersistentStorageOnce()).toBeNull();
    expect(await getStorageEstimate()).toBeNull();
  });

  it('getStorageEstimate + formatter produce the human summary (structural numbers only)', async () => {
    installStorageManager({ persisted: vi.fn().mockResolvedValue(true) });
    const info = await getStorageEstimate();
    expect(info).toEqual({ usageBytes: 12_582_912, quotaBytes: 2_147_483_648, persisted: true });
    expect(formatStorageEstimate(info!)).toBe('Using 12.0 MB of 2.0 GB · persistent: yes');
  });
});
```

Append to `apps/azure/src/hooks/__tests__/useAdminHealthChecks.test.ts` (follow the file's existing render/run idiom — locate an existing `runOne` test for the harness; mock `../../services/storageDurability` at the top of the file with the file's `vi.mock` style):

```typescript
it('PO-8b: storage-durability check reports the quota estimate as detail', async () => {
  // module mock added at file top:
  // vi.mock('../../services/storageDurability', () => ({
  //   getStorageEstimate: vi.fn().mockResolvedValue({ usageBytes: 1048576, quotaBytes: 10485760, persisted: false }),
  //   formatStorageEstimate: vi.fn().mockReturnValue('Using 1.0 MB of 10.0 MB · persistent: no'),
  // }));
  const { result } = renderHook(() => useAdminHealthChecks());
  await act(async () => {
    await result.current.runOne('storage-durability');
  });
  const check = result.current.checks.find(c => c.id === 'storage-durability');
  expect(check?.status).toBe('pass');
  expect(check?.detail).toBe('Using 1.0 MB of 10.0 MB · persistent: no');
});
```

(Write the `vi.mock` uncommented at the file top per the file's existing mock conventions.)

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter @variscout/azure-app test -- "storageDurability|useAdminHealthChecks"`
Expected: FAIL — module missing; unknown check id

- [ ] **Step 3: Implement**

`apps/azure/src/services/storageDurability.ts`:

```typescript
/**
 * PO-8b IDB-eviction durability (spec §9.4): navigator.storage.persist()
 * requested on a real save gesture + estimate() surfaced in the Admin status
 * tab. The cloud blob remains the durability source of truth — origin-wide
 * eviction degrades to a re-sync, not data loss — so a denied/absent persist
 * is informational, never an error. Greenfield: feature-detect everything
 * (jsdom and older Safari have no StorageManager; Safari private mode can
 * throw — ADR-075 try/catch precedent).
 */

let persistRequested = false;

export function _resetPersistRequestedForTests(): void {
  persistRequested = false;
}

/**
 * Request persistent storage at most once per session, on a user save
 * gesture (Save As). Returns true/false from the browser, or null when
 * skipped (already requested this session, or API absent).
 */
export async function requestPersistentStorageOnce(): Promise<boolean | null> {
  if (persistRequested) return null;
  persistRequested = true;
  try {
    const storage = navigator.storage;
    if (!storage?.persist) return null;
    if (storage.persisted && (await storage.persisted())) return true;
    return await storage.persist();
  } catch {
    return null;
  }
}

export interface StorageEstimateInfo {
  usageBytes: number | null;
  quotaBytes: number | null;
  persisted: boolean | null;
}

export async function getStorageEstimate(): Promise<StorageEstimateInfo | null> {
  try {
    const storage = navigator.storage;
    if (!storage?.estimate) return null;
    const estimate = await storage.estimate();
    const persisted = storage.persisted ? await storage.persisted() : null;
    return {
      usageBytes: estimate.usage ?? null,
      quotaBytes: estimate.quota ?? null,
      persisted,
    };
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatStorageEstimate(info: StorageEstimateInfo): string {
  const usage = info.usageBytes != null ? formatBytes(info.usageBytes) : 'unknown';
  const quota = info.quotaBytes != null ? formatBytes(info.quotaBytes) : 'unknown';
  const persisted = info.persisted == null ? 'unknown' : info.persisted ? 'yes' : 'no';
  return `Using ${usage} of ${quota} · persistent: ${persisted}`;
}
```

In `apps/azure/src/hooks/useAdminHealthChecks.ts`:

1. `import { formatStorageEstimate, getStorageEstimate } from '../services/storageDurability';`
2. `HealthCheck` gains `detail?: string;` (after `error?`).
3. `runCheck` return type becomes `Promise<{ status: CheckStatus; error?: string; detail?: string }>`.
4. Append to `CHECK_DEFINITIONS`:

```typescript
  {
    id: 'storage-durability',
    label: 'Local storage durability',
    description: 'Persistent-storage grant + usage vs quota (cloud blob remains source of truth)',
  },
```

5. Add the `runCheck` case (before `default`):

```typescript
case 'storage-durability': {
  const info = await getStorageEstimate();
  if (!info) return { status: 'na', error: 'navigator.storage not available in this browser' };
  return { status: 'pass', detail: formatStorageEstimate(info) };
}
```

6. In `runOne`, the `updateCheck(id, result)` call already spreads `detail` through `Partial<HealthCheck>` — but clear stale detail like `error`: change `updateCheck(id, { status: 'running', error: undefined });` to `updateCheck(id, { status: 'running', error: undefined, detail: undefined });` (and the parallel reset inside `runAll` similarly). The `runAll` settled-merge gains `detail: settled.value.detail`.

In `apps/azure/src/components/admin/AdminStatusTab.tsx`, after the description `<p>` (locate `{check.description}`), add:

```tsx
{
  check.detail && <p className="text-xs text-content-muted mt-0.5">{check.detail}</p>;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- "storageDurability|useAdminHealthChecks"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/services/storageDurability.ts apps/azure/src/services/__tests__/storageDurability.test.ts apps/azure/src/hooks/useAdminHealthChecks.ts apps/azure/src/hooks/__tests__/useAdminHealthChecks.test.ts apps/azure/src/components/admin/AdminStatusTab.tsx
git commit -m "feat(po-8b): storage durability — persist-once helper + quota estimate in the Admin status tab"
```

---

### Task 7: Editor wiring — dialog mount, result handling, autosave suspension, persist gesture (TDD-light)

**Model:** Opus.

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify: `apps/azure/src/pages/__tests__/Editor.test.tsx` (useStorage mock gains the new members)

**Why TDD-light:** Editor.tsx is a 2000+-line composition root; its conflict flow is proven by the Task-4 storage tests + the Task-5 component tests + the controller's `--chrome` live verify. The Editor changes here are wiring. The one REQUIRED test change is the `useStorage` mock update (partial mocks returning `undefined` for the new members would otherwise crash `result.status` reads — hence the defensive `?.` in the code below).

- [ ] **Step 1: Update the Editor.test.tsx useStorage mock**

Locate the `useStorage: vi.fn(() => ({ … }))` mock (around `Editor.test.tsx:304`) and extend the returned object:

```typescript
    saveProject: vi.fn(() => Promise.resolve({ status: 'saved' as const })),
    pendingConflict: null,
    dismissConflict: vi.fn(),
    reloadProjectFromCloud: vi.fn(() => Promise.resolve(null)),
```

(The `saveProject` line REPLACES the existing `saveProject: vi.fn(),` — the result object keeps `saveAndRecordBaseline` honest.)

- [ ] **Step 2: Wire the Editor**

In `apps/azure/src/pages/Editor.tsx`:

1. New imports:

```typescript
import { SaveConflictDialog } from '../components/SaveConflictDialog';
import { requestPersistentStorageOnce } from '../services/storageDurability';
```

2. Extend the `useStorage()` destructure (locate `saveProject: saveToCloud,`):

```typescript
const {
  syncStatus,
  listProjects,
  listProcessHubs,
  saveProject: saveToCloud,
  saveProcessHub,
  pendingConflict,
  dismissConflict,
  reloadProjectFromCloud,
} = useStorage();
```

3. The `saveProject` wrapper (locate `// Wrap saveProject with cloud sync`) now returns the save result:

```typescript
// Wrap saveProject with cloud sync
const saveProject = useCallback(
  async (name: string) => {
    const trimmedName = name.trim() || defaultSaveName(dataFilename);
    setDefaultLocation('personal');
    useProjectStore.setState({ projectName: trimmedName });
    await projectActions.saveProject(trimmedName);
    // Trigger cloud sync with current store state snapshot
    const state = buildDocumentSnapshot({ activeHub });
    return saveToCloud(state, trimmedName, 'personal');
  },
  [activeHub, dataFilename, projectActions, saveToCloud]
);
```

4. `saveAndRecordBaseline` (locate by name) — conflict skips the baseline:

```typescript
const saveAndRecordBaseline = useCallback(
  async (name: string) => {
    const targetName = name.trim();
    if (!targetName) return;

    setSaveStatus('saving');
    try {
      const result = await saveProject(targetName);
      if (result?.status === 'conflict') {
        // PO-8b: the cloud document was NOT saved — the reload-or-branch
        // dialog owns resolution. Keep the dirty baseline (no false "saved").
        setSaveStatus('idle');
        return;
      }
      const savedName = useProjectStore.getState().projectName || targetName;
      setSavedDocumentName(savedName);
      setSavedFingerprint(computeCurrentFingerprint());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  },
  [computeCurrentFingerprint, saveProject]
);
```

(`result?.` is deliberate — partial useStorage mocks in older tests resolve `undefined`.)

5. Conflict-resolution handlers + the deferral latch (add directly after `handleSaveAs`):

```typescript
// ── PO-8b conflict resolution (the reload-or-branch dialog) ──────────────
// Deferral latch: "Not now" suspends AUTOSAVE retries (each would re-412 and
// re-open the dialog every 2s); a MANUAL save re-opens it via a fresh 412.
const [conflictDeferred, setConflictDeferred] = useState(false);

const handleConflictBranch = useCallback(async () => {
  const conflictedName = pendingConflict?.name;
  if (!conflictedName) return;
  dismissConflict();
  setConflictDeferred(false);
  // Branch = the shipped "(conflict copy)" naming, now user-chosen: a full
  // save under the copy name; the Editor adopts the copy as its active
  // document (fresh identity → no stale ETag → next save round-trips clean).
  await saveAndRecordBaseline(`${conflictedName} (conflict copy)`);
}, [dismissConflict, pendingConflict, saveAndRecordBaseline]);

const handleConflictReload = useCallback(async () => {
  const conflictedName = pendingConflict?.name;
  const conflictedLocation = pendingConflict?.location ?? 'personal';
  if (!conflictedName) return;
  dismissConflict();
  setConflictDeferred(false);
  const remote = await reloadProjectFromCloud(conflictedName, conflictedLocation);
  if (!remote) return; // storage surfaced the error notification; local copy unchanged
  try {
    await projectActions.loadProject(conflictedName);
    setSavedDocumentName(conflictedName);
    setSavedFingerprint(computeCurrentFingerprint());
  } catch {
    // PO-8a strict-assert seam: a corrupt fetched copy refuses to hydrate.
    // The in-memory document is unchanged; the user can retry or branch.
    setSaveStatus('error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  }
}, [
  computeCurrentFingerprint,
  dismissConflict,
  pendingConflict,
  projectActions,
  reloadProjectFromCloud,
]);

const handleConflictDismiss = useCallback(() => {
  dismissConflict();
  setConflictDeferred(true);
}, [dismissConflict]);
```

6. Autosave suspension (locate the `useAutoSave(handleSave, …)` call):

```typescript
useAutoSave(
  handleSave,
  [currentFingerprint],
  hasActiveSavedAzureDocument && isDocumentDirty && !pendingConflict && !conflictDeferred
);
```

(`!pendingConflict` not `=== null` — partial test mocks return `undefined`.)

7. Persist-on-gesture in `handleSaveAs` (after the `if (!newName) return;` line):

```typescript
void requestPersistentStorageOnce(); // PO-8b: durable-by-default on a real save gesture
```

8. Mount the dialog directly after the `<EditorModals … />` element (locate `{/* Detection modals */}`):

```tsx
{
  /* PO-8b: explicit reload-or-branch conflict resolution (replaces the silent auto-fork) */
}
<SaveConflictDialog
  isOpen={Boolean(pendingConflict)}
  documentName={pendingConflict?.name ?? ''}
  onReload={handleConflictReload}
  onBranch={handleConflictBranch}
  onDismiss={handleConflictDismiss}
/>;
```

**Placement constraint:** the `useState`/`useCallback` additions in step 5 MUST sit before the Editor's early returns (the `if (dataFlow.isPasteMode)` block) — put them with the other save callbacks (they immediately follow `handleSaveAs`, which satisfies this).

- [ ] **Step 3: Run the Editor + related suites**

Run: `pnpm --filter @variscout/azure-app test -- "Editor|useAutoSave"`
Expected: PASS (all pre-existing Editor tests green with the extended mock)

- [ ] **Step 4: Acceptance greps**

```bash
grep -n "window.confirm\|window.prompt" apps/azure/src/components/SaveConflictDialog.tsx
# Expected: ZERO hits (the dialog must be chrome-drivable)
grep -n "pendingConflict !== null\|pendingConflict === null" apps/azure/src/pages/Editor.tsx
# Expected: ZERO hits (falsy checks only — partial mocks return undefined)
grep -rn "(conflict copy)" apps/azure/src --include="*.ts" --include="*.tsx" | grep -v __tests__
# Expected: exactly ONE product hit — the Editor's Branch handler (the shipped naming, now user-chosen)
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/pages/Editor.tsx apps/azure/src/pages/__tests__/Editor.test.tsx
git commit -m "feat(po-8b): Editor conflict wiring — dialog mount, baseline honesty on 412, autosave suspension, persist gesture"
```

---

### Task 8: Doc propagation (on-branch)

**Model:** Sonnet.

**Files:**

- Modify: `docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md` (append §17)
- Modify: `docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md` (PO-8b row: sub-plan link + amendment note)
- Modify: `docs/07-decisions/adr-091-two-tier-persistence-model.md` (PO-8b amendment block)
- Modify: `docs/decision-log.md` (two entries)
- Modify: `docs/investigations.md` (two entries)
- Modify: `apps/azure/CLAUDE.md` (conflict/locks/durability invariant notes)

- [ ] **Step 1: Spec §17.** Append after §16 (mirror §16's structure):

```markdown
## §17 · PO-8b scope amendment + grounding corrections (2026-06-05, owner-ratified)

### Grounding corrections (same class as §15/§16)

- **TWO conflict-copy forks existed, not one** (§9.4 described a single auto-fork): the timestamp pre-flight (storage.ts `if (syncState?.baseStateJson)` block) AND the 412 catch (`ProjectDocumentConflictErrorClass`). PO-8b deleted the pre-flight outright (adversarially verified strictly dominated — the server PUT advances analysis.json's ETag and metadata.json's timestamp atomically, so If-Match/412 catches every state the timestamp compare caught) and replaced the 412 catch with the dialog. `getCloudModifiedDate` survives — its second caller is loadProject's load-time conflict detector.
- **The cited test `storage.test.ts:1231` covered only the 412 fork**; no test exercised the pre-flight (nothing to rewrite there). The 412 test was rewritten to the dialog contract with a type-honest `precondition-failed` mock.
- **ETag staleness on load**: loadProject refreshed `baseStateJson` but never `syncState.etag` — a Reload without an ETag refresh would 412 forever. The server GET already returns the etag in the body; PO-8b captures it on every cloud load.
- **Phantom-412**: `saveToCloud` stored `etag: result.etag || now` — a fabricated timestamp as If-Match guarantees a false 412 (previously silently auto-forked; the dialog would have surfaced it to users). Fixed: never fabricate; recover the real etag with a follow-up GET; `''` (no If-Match) is the documented double-failure residual.

### The heal is a MERGE, not a recompute (owner-ratified amendment to §9.2)

`buildProjectMetadata` is a pure function of the aggregate and NEVER produces `sustainment` — the Control direct-Dexie bypass owns it and the ProjectCard due-ness chip reads it. The §9.2 wording "recomputed from the loaded aggregate and healed on mismatch" therefore reads, durably: **recompute the aggregate-derived fields and merge over the existing meta, preserving the sustainment projection**. PO-8b also fixed the three pre-existing clobber sites this grounding exposed (the document-save meta build, the cloud-load cache write, the portfolio-list backfill — plus the adapter save that wiped meta entirely), with a seeded-sustainment negative control locking the contract.

### Worker-marshal serialization: CUT (research-grounded; replaces the §9.4 item)

The marshal-then-stringify worker is refuted by primary sources, not deferred for convenience: postMessage structured-clone serialization is SYNCHRONOUS on the sending thread (Surma, "Is postMessage slow?"), and for plain-object graphs structured clone is 2-3× slower than `JSON.parse(JSON.stringify())` — so marshalling the live snapshot costs the main thread as much as (or more than) the stringify it offloads. V8's stringify is >2× faster as of Chrome 138; tldraw and Excalidraw both serialize on the main thread; Salesforce's workers retrospective (hoped ~8×, got ~20% — serialization tax) is the canonical real-world confirmation. `StatsWorkerAPI` additionally must stay pure-compute (no-I/O core rule).

**What ships instead:** main-thread save-serialize telemetry (`Document.Save.Serialize`: bytes + ms, PII-free) with a **dual re-architect trigger** (`Document.Save.ReArchitectTrigger`): >50 MB document OR >50 ms serialize (the web.dev long-task threshold). **Revive path when a real customer document trips it:** columnar transferable Structure-of-Arrays for raw rows (zero-copy postMessage; one contiguous buffer, never per-row arrays) or OPFS worker-owned persistence — never marshal-then-stringify. Named candidates short of re-architecture: `CompressionStream('gzip')` on the upload body; replacing the per-facet `cloneJson` deep-clone in `buildDocumentSnapshot` (the actual measured hotspot — logged in investigations.md).

### Concurrency design decisions (encoding §9.4's gaps)

- **Two-phase lock⟷dialog**: `navigator.locks.request` holds the lock for the callback's lifetime, so the dialog NEVER opens under the lock — the locked attempt returns a conflict result, the dialog runs lock-free, resolutions re-acquire the lock. Lock name: `variscout-project-save:<name>` (per-document, exclusive). Feature-detected (absent API → unlocked single-tab behavior).
- **Shared read locks: not taken** (ratified deviation from §9.4's parenthetical "shared for reads") — the acceptance criterion is non-interleaved wholesale WRITES; Dexie's per-operation atomicity covers reads, and read-locking every load broadens the surface for no observed risk. Revisit only with evidence.
- **Autosave conflicts** (the spec was silent; saves fire on a 2s debounce): the dialog opens on ANY 412 including autosave-triggered; autosave suspends while the conflict is pending; "Not now" defers autosave retries until resolution; a manual save re-opens the dialog. **Branch** = a full save under the shipped `"(conflict copy)"` name + the Editor adopts the copy as its active document (fresh identity → clean ETag). **Reload** = cloud fetch + Dexie/ETag/merge-base refresh + re-hydrate through the PO-8a strict-assert seam (typed errors caught — a corrupt remote never strands the mid-conflict user).
```

- [ ] **Step 2: Master plan PO-8b row.** At the START of the `### PR-PO-8b` section body (before `- **Goal:**`), add:

```markdown
- **Sub-plan:** [`2026-06-05-po-8b-concurrency-durability.md`](2026-06-05-po-8b-concurrency-durability.md). _Scope amended 2026-06-05 (grounding workflow: 8 readers + 4 adversarial verifiers + completeness critic; 4 owner calls + a 5-agent research workflow): the worker-marshal item is **CUT** on research grounds (spec §17 — marshal-then-stringify pays a serialization tax to avoid one; main-thread telemetry with the dual >50MB/>50ms trigger ships instead); the heal is a field-scoped **merge** preserving the Control-owned `sustainment` projection (+ fixes the three pre-existing clobber sites); the phantom-ETag fabrication (`etag || now`) is fixed; the dialog opens on ANY 412 with autosave suspension; the lock⟷dialog interplay is the two-phase design (locked attempt → lock-free decision → locked resolution)._
```

- [ ] **Step 3: ADR-091 amendment.** Append to `docs/07-decisions/adr-091-two-tier-persistence-model.md` (after any existing amendment blocks, matching their heading style):

```markdown
## Amendment (2026-06-05, PO-8b): concurrency delivered; worker-marshal cut

PO-8b delivered §9.4's concurrency + durability hardening as: the explicit
reload-or-branch dialog on 412 (the silent auto-conflict-copy and the redundant
timestamp pre-flight are retired; If-Match/412 is the sole conflict surface) ·
a per-document exclusive Web Lock around the wholesale Dexie write + blob PUT
(two-phase: never await the dialog under the lock) · `navigator.storage.persist()`
on a save gesture + `estimate()` in the Admin status tab · ETag capture on every
cloud load (kills post-reload false 412s) · merge-preserving ProjectMetadata
writes (the load-time heal; the Control-owned `sustainment` projection survives
saves/loads/backfills). The worker-marshal serialization item is **CUT on
research grounds** (spec §17): postMessage structured-clone is synchronous on
the sending thread and slower than the stringify it would offload for
plain-object graphs. Replacement: save-serialize telemetry with a dual
re-architect trigger (>50 MB or >50 ms); revive path = columnar transferable
SoA or OPFS worker-owned persistence, never marshal-then-stringify.
```

- [ ] **Step 4: decision-log entries.** Append to `docs/decision-log.md` under its current-period section, following the file's entry format:

```markdown
- **2026-06-05 · PO-8b worker-marshal serialization CUT (research-grounded)** — DECIDED. The spec §9.4 marshal-then-stringify worker is refuted by primary sources (postMessage structured-clone is synchronous on the sender; 2-3× slower than JSON round-trip for plain-object graphs; Surma/web.dev + Salesforce retrospective + V8 stringify 2× + tldraw/Excalidraw precedent). Shipped instead: main-thread save-serialize telemetry with the dual re-architect trigger (>50 MB size OR >50 ms duration). Revive trigger = a real customer document trips it; revive path = columnar transferable SoA or OPFS worker-owned persistence — never marshal-then-stringify. Spec §17 + ADR-091 Amendment carry the full rationale.
- **2026-06-05 · ProjectMetadata writes are merges (heal contract)** — DECIDED. `buildProjectMetadata` never produces `sustainment` (Control direct-Dexie bypass owns it); every meta write merge-preserves it (`mergeProjectMetadata`, localDb). Fixed the pre-existing clobbers: document-save meta build, cloud-load cache write, portfolio-list backfill, adapter-save meta wipe. Locked by a seeded-sustainment negative control (spec §13 class).
```

- [ ] **Step 5: investigations.md entries.** Append, following the file's entry format:

```markdown
- **2026-06-05 · `cloneJson` per-facet deep-clone is the measured save-path hotspot (PO-8b research)** — `buildDocumentSnapshot` pays `JSON.parse(JSON.stringify())` per facet (stores `documentSnapshot.ts` cloneJson; same pattern in canvasStore) — this, not the final stringify, is the real main-thread cost on large documents, and no worker fixes it. Named candidates if the PO-8b telemetry trigger fires: structural-sharing clone where safe; `CompressionStream('gzip')` on the upload body (server must accept it). Owner: whoever picks up the re-architect trigger.
- **2026-06-05 · Editor records a saved baseline on cloud-failed (queued) saves** — pre-existing: `saveAndRecordBaseline` clears the dirty state for `offline`/`error` results too (the local Dexie save did succeed — R6d reads this as "saved"); only `conflict` now skips the baseline (PO-8b). If queued-cloud-save honesty ever matters (e.g. a sync-pending chip), the `SaveProjectResult` union already carries the signal.
```

- [ ] **Step 6: azure CLAUDE.md.** In the `## Invariants` section, extend the ETag bullet (locate "**ETag optimistic concurrency on hub/document blob writes**") by appending to that bullet:

```markdown
PO-8b: project-document 412s surface the **reload-or-branch `SaveConflictDialog`** (no silent auto-fork; the timestamp pre-flight is retired — If-Match/412 is the sole conflict surface). The wholesale Dexie write + blob PUT run under `withDocumentSaveLock` (`services/saveLock.ts`, per-document exclusive Web Lock, feature-detected; never await UI under the lock). Every cloud load refreshes `syncState.etag` (the server GET returns it in the body). `ProjectMetadata` writes are merges — `mergeProjectMetadata` preserves the Control-owned `sustainment` projection (the load-time heal; never recompute-and-overwrite). Save-serialize telemetry: `Document.Save.Serialize` + the `>50MB`/`>50ms` re-architect trigger (`lib/saveTelemetry.ts`); the worker-marshal was cut on research grounds (spec §17). `navigator.storage.persist()` fires once per session on Save As (`services/storageDurability.ts`).
```

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md docs/07-decisions/adr-091-two-tier-persistence-model.md docs/decision-log.md docs/investigations.md apps/azure/CLAUDE.md
git commit -m "docs(po-8b): spec §17 amendment + ADR-091 amendment + decision-log + invariant notes"
```

---

### Task 9: Controller gate (NOT an implementer task)

- [ ] All acceptance greps (Tasks 4 + 7) clean
- [ ] `bash scripts/pr-ready-check.sh` green (the turbo build is the only sweep covering every package's build tsconfig — apps' tsc covers their test files)
- [ ] `pnpm --filter @variscout/azure-app test` AND `pnpm --filter @variscout/pwa test` green (PWA must be untouched-green by construction)
- [ ] **`--chrome` live verify (the PO-8b chrome matrix = the conflict dialog):** open a saved project in the Azure app → via `javascript_tool`, corrupt the stored ETag (`db.syncState.update(name, { etag: '"stale-chrome-verify"' })`) → make a durable edit → the 2s autosave 412s → **the SaveConflictDialog appears** (no native dialog wedge) → verify **Branch**: a `"(conflict copy)"` document exists and the Editor adopted it (header name + clean dirty state) → re-corrupt and verify **Reload**: the cloud version loads, dirty clears, and the NEXT save succeeds silently (the ETag-refresh proof — this is the test that catches the infinite-412 loop) → verify **Not now**: dialog closes, no re-pop while typing (autosave suspended), manual Save re-opens it. Known walls: Save As/Rename `window.prompt` — avoid those paths during the verify.
- [ ] Final adversarial Opus branch review (non-negotiable). Attack surfaces: **the lock is actually released before the dialog renders** (no await-on-human-input inside any `withDocumentSaveLock` callback); **reload-then-save round-trips clean** (ETag refresh reaches `db.syncState` on every adoption path); **the evidence-exempt boundary held** (no lock/result-type change touched `saveEvidenceSnapshot*`/`PasteConflictToast`/`updateBlobEvidenceSnapshotsConditional`; `requestJson`/`requestMaybeJson` signatures unchanged); **sustainment negative controls fail for the right reason** (remove the merge → tests must go red); **no fabricated ETag survives anywhere** (`grep -rn "etag.*||.*now\||| now" apps/azure/src/services`); **partial-mock safety** (no `!== null` on new context members in Editor); **retry/offline queue results are honest** (`SaveProjectResult` mapping vs the old void behavior — no caller regression); **telemetry carries zero PII**.
- [ ] PR → `gh pr merge --merge --delete-branch` → DELIVERED flips on main (master-plan row + decision-log + memory)

---

## Verification summary (spec §13 + §9.4 acceptance as amended by §17)

| Acceptance criterion                                                           | Proven by                                                                          |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 412 surfaces the reload-or-branch dialog (no silent auto-fork)                 | Task 4 conflict test (single PUT, no copy toast); Task 5 component tests; chrome   |
| Negative control: matching ETag saves silently                                 | Task 4 negative-control test (If-Match arg + `{status:'saved'}` + no conflict)     |
| Pre-flight retired; If-Match/412 subsumes it                                   | Task 4 stale-ETag test (no metadata GET / eager load; conflict still caught)       |
| Two simulated tabs cannot interleave wholesale writes                          | Task 4 lock-interleave test (functional LockManager, strict event ordering)        |
| Reload adopts remote: cache + ETag + merge base refresh (no infinite re-412)   | Task 4 reload test (`syncState.update` with fresh etag); chrome reload-then-save   |
| Branch = user-chosen conflict copy + identity adoption                         | Task 7 handler (full save via `saveAndRecordBaseline`); chrome Branch verify       |
| Autosave never re-pops a deferred dialog; manual save re-opens                 | Task 7 autosave gate + deferral latch; chrome "Not now" verify                     |
| Projection heals on a seeded mismatch; sustainment survives (negative control) | Task 1 backfill + merge tests; Task 4 heal/save/preserve tests                     |
| `persist()` on a save gesture (once) + `estimate()` surfaced                   | Task 6 once-guard/short-circuit/absent-API tests + admin check test                |
| Size telemetry + dual re-architect trigger, PII-free                           | Task 3 trigger/negative-control/PII-keys tests                                     |
| Phantom-ETag fabrication gone                                                  | Task 2 recovered-etag test + the gate grep                                         |
| Evidence path exempt + untouched                                               | Untouched `blobClient.etag`/`cloudSync.etag`/`PasteConflictToast` tests stay green |
| Gate + both app suites green                                                   | Task 9                                                                             |
