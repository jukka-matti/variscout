---
title: F3.6-β — Chrome walk script (Azure persistence + cloud sync + ETag concurrency)
audience: [engineer]
category: chrome-walk
status: active
last-reviewed: 2026-05-07
related:
  - docs/superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity.md
---

# F3.6-β Chrome Walk Script

Azure rowProvenance parity — persistence, cloud sync, and ETag concurrency.

This script covers four scenarios that together prove the F3.6-β correctness invariants:
provenance rides the snapshot envelope through Dexie and Blob Storage; ETag optimistic
concurrency detects concurrent-paste races and either retries silently or surfaces the
blocking modal after 3 failures.

The user executes this walk manually using `claude --chrome` before the squash-merge.
DevTools inspection is the verification method for all provenance assertions; no visible
pill exists yet (deferred per PD7).

---

## P6.1 Read-path verification summary

All five test suites that cover the full envelope round-trip were confirmed present and
passing on branch `data-flow-foundation-f3-6` before this document was written.

### Coverage confirmed

| Test file                                                                          | Phase     | What it asserts                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/azure/src/persistence/__tests__/applyAction.evidence.test.ts`                | P2.1+P2.2 | `EVIDENCE_ADD_SNAPSHOT` persists snapshot to Dexie; `EVIDENCE_ARCHIVE_SNAPSHOT` sets `deletedAt`; provenance envelope is not cleared on archive                                                                                  |
| `apps/azure/src/persistence/__tests__/applyAction.evidence.provenance.test.ts`     | P2.4      | Full envelope facet contract: populated provenance, replace+archive cascade, empty `[]` round-trip, `undefined` tolerance, facade-path `provenance: []` action shape                                                             |
| `apps/azure/src/services/__tests__/blobClient.test.ts`                             | P3.3      | `saveBlobEvidenceSnapshot` PUT body includes `provenance` array; empty array preserved; `undefined` provenance omitted from body (JSON.stringify semantics)                                                                      |
| `apps/azure/src/services/__tests__/blobClient.etag.test.ts`                        | P4.3      | `updateBlobEvidenceSnapshotsConditional`: first-time write (no `If-Match`), subsequent write with current ETag, 412 on first attempt then retry success, 3 consecutive 412s → `concurrency-exhausted`, network error, auth error |
| `apps/azure/src/services/__tests__/cloudSync.etag.test.ts`                         | P4.2      | `saveEvidenceSnapshotToCloud` calls the conditional uploader; emits `PasteConflictEvent` on `concurrency-exhausted`; does not throw on exhaustion; does not emit on success; unsubscribe stops future events                     |
| `apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.provenance.test.ts` | P5.4      | `multi-source-join` dispatches `EVIDENCE_ADD_SNAPSHOT` with `RowProvenanceTag[]` in the action envelope; single-source append does NOT dispatch; `sourceId` fallback logic; no `setRowProvenance` callback                       |

### Gap assessment

No gap found. `MatchSummaryCard` (`packages/ui/src/components/MatchSummaryCard/index.tsx`) does
not read `snapshot.provenance` — confirmed correct. The provenance pill has not been implemented
yet (deferred per PD7 and logged in `docs/investigations.md`). No consumer accesses
`snapshot.provenance` outside of the test suite, which means the optional field's presence is
transparent to existing rendering code. The D3 decision (lazy hydration — most reads ignore the
facet) is satisfied.

No optional integration test was added. The P2.4 tests already cover the full
`applyAction` dispatch → Dexie read-back cycle with all provenance permutations
(populated array, empty array, `undefined`). Adding a duplicate test at the
`azureHubRepository.dispatch` level would cover the same handler with no new
assertions.

---

## Setup

Before starting any scenario:

1. Start the Azure app locally:

   ```bash
   pnpm --filter @variscout/azure-app dev
   ```

   The app listens at `http://localhost:5173` (or whichever port the Vite output shows).
   If testing against a deployed dev tenant, skip this step and use that URL instead.

2. Open Chrome. Navigate to the app URL and sign in using a test account that has access
   to a test tenant with Blob Storage configured. The `/api/storage-token` endpoint must
   return a valid SAS URL — if it returns `503`, Blob Storage is not configured for that
   account and Scenario 2/3/4 will not be observable.

3. Open DevTools (F12). You need two tabs open simultaneously:
   - **Application tab** — used to inspect IndexedDB records
   - **Network tab** — used to inspect Blob Storage requests and ETag headers

   Keep Network tab recording throughout the walk. Filter requests by `blob.core.windows.net`
   to reduce noise.

4. Note: the Azure app uses `fake-indexeddb` in tests only. In Chrome the real IndexedDB
   is used. The database name is `variscout-azure-cache` (confirm in Application tab →
   IndexedDB → expand the database tree).

---

## Scenario 1 — Single-user fidelity (envelope persists locally and cloud)

This scenario proves that a paste with a multi-source join stores `provenance` in both
Dexie (local IndexedDB) and in the Blob Storage PUT body, and that the field survives a
page reload.

### Steps

1. Create a new Process Hub (or open an existing test hub).

2. Paste a first CSV dataset that includes a key column (e.g., `lot_id`, `batch_id`):

   ```
   lot_id,diameter_mm
   A1,25.00
   A2,25.10
   A3,24.95
   ```

   Accept the paste (no match summary for the first paste — this is a new source).

3. Paste a second CSV dataset that shares the same key column but brings new measurement
   columns:

   ```
   lot_id,surface_roughness_Ra
   A1,0.42
   A2,0.38
   A3,0.51
   ```

4. The match summary modal appears. The classification should be
   `different-source-joinable` and a join key suggestion panel shows `lot_id` as the
   candidate.

5. Click **"Confirm join"** (or equivalent join-confirm CTA) on the `JoinKeySuggestion`
   sub-card.

### Verify — DevTools Application tab (IndexedDB)

6. In DevTools → Application → IndexedDB → `variscout-azure-cache` → expand the database
   → find the `evidenceSnapshots` object store.

7. Locate the record whose `id` matches the new snapshot (the one created by the join
   paste). Click on it to expand the record.

8. Confirm the record contains a `provenance` field that is a non-empty array. Each
   element should have the shape:

   ```json
   {
     "id": "<deterministic-id>",
     "snapshotId": "<snapshot-id>",
     "rowKey": "<row-index-string>",
     "source": "lot-id",
     "joinKey": "lot_id",
     "createdAt": <timestamp>,
     "deletedAt": null
   }
   ```

   The number of tags should equal the number of rows in the second CSV (3 in the example
   above).

### Verify — DevTools Network tab (Blob Storage PUT)

9. In the Network tab, find the PUT request to:

   ```
   process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/snapshot.json
   ```

   Click the request → **Payload** (or **Request**) tab.

10. Confirm the request body JSON contains a `"provenance"` key with the same array
    structure observed in IndexedDB.

11. Find the PUT request to:

    ```
    process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/_snapshots.json
    ```

    Click the request → **Headers** tab.

    For the first paste into this hub there may be no `If-Match` header (404 on HEAD →
    unconditional first write). For any subsequent paste into the same source, the
    `If-Match` header must be present with a quoted ETag value.

### Verify — reload round-trip

12. Reload the page (F12 → Application tab is reset; Network tab is cleared).

13. Navigate back to the same hub.

14. In Application → IndexedDB → `evidenceSnapshots`, find the same snapshot record.

15. Confirm the `provenance` array is still present and intact. This proves the envelope
    survived the Dexie read-back after reload (and, if the page was reloaded after cloud
    sync, also proves the cloud-to-local round-trip).

---

## Scenario 2 — Cross-device fidelity (cloud round-trip preserves envelope)

This scenario proves that when a second browser instance loads the hub from cloud storage,
it receives `provenance` on the snapshot records — demonstrating that the Blob Storage PUT
body carried the envelope facet.

### Steps

1. Complete Scenario 1 so at least one snapshot with provenance exists in the hub.

2. Open a **second Chrome window** (or an incognito window — Ctrl+Shift+N). Sign in with
   the same account (incognito requires sign-in again).

3. Navigate to the same hub.

### Verify

4. In the second window's DevTools → Application → IndexedDB → `variscout-azure-cache`
   → `evidenceSnapshots`.

5. Locate the same snapshot record (same `id`).

6. Confirm the `provenance` array is present and matches what was stored in Scenario 1.

   If the field is absent or empty, it means the cloud upload stripped the field.
   Check the Network tab in **Window 1** for the PUT body from Scenario 1 to identify
   whether the field was present in the upload (isolates a PUT-body bug from a
   GET/hydration bug).

---

## Scenario 3 — Concurrent paste (412 retry path)

This scenario exercises the ETag optimistic concurrency path. Two tabs race to update the
same `_snapshots.json` blob; the second tab's write encounters a 412 and must retry.

### Steps

1. Open the hub in **Tab A** (same Chrome window or a different window — must share the
   same session cookies for the same tenant).

2. Open the same hub in **Tab B** (duplicate tab or new tab → navigate to hub URL).

3. In Tab A, paste a small dataset (3–5 rows). Wait for the network activity in Tab A's
   Network tab to settle (the `_snapshots.json` PUT returns 200/201).

4. In Tab B — **without refreshing the page** — immediately paste a different small
   dataset (Tab B's in-memory snapshot catalog is now stale; its copy of `_snapshots.json`
   has the pre-paste ETag).

### Verify (DevTools in Tab B)

5. In Tab B's Network tab, watch the requests fired by the paste:

   a. A HEAD to `_snapshots.json` — returns a 200 with an `ETag` response header.

   b. A PUT to `_snapshots.json` with `If-Match: <etag>` — this should return **412
   Precondition Failed** (Tab A's write already changed the ETag).

   c. Another HEAD to `_snapshots.json` — returns 200 with the **updated** ETag (the one
   Tab A's write produced).

   d. Another PUT with `If-Match: <new-etag>` — returns **200/201 Success**.

6. In Tab B's Application → IndexedDB → `evidenceSnapshots`, confirm both snapshots are
   present (Tab A's and Tab B's). Neither was silently overwritten.

7. **No conflict modal should appear** in Tab B's UI for this scenario. The retry
   succeeded before exhausting 3 attempts.

---

## Scenario 4 — Rapid-fire concurrent pastes (3-retry exhaustion → blocking modal)

This scenario exercises the `concurrency-exhausted` path and the `PasteConflictToast`
blocking modal.

### Steps

1. Open the hub in **3+ tabs** (Tab A, Tab B, Tab C — all stale, pointing at the same
   hub, none refreshed after each other's writes).

2. Paste a small dataset in Tab A. Before Tab A's Network activity settles, **immediately**
   paste in Tab B. Before Tab B's Network activity settles, **immediately** paste in Tab C.

   The goal is for all three writes to race against each other so that a single tab
   exhausts its 3 retry attempts. This is easiest on a slow or throttled network
   (DevTools → Network → throttle to "Slow 3G" for the test, then restore).

   Alternatively: open 4+ tabs and paste in all of them in rapid succession.

### Verify — blocking modal

3. At least one tab should show the `PasteConflictToast` blocking modal:

   > "Multiple teammates are updating this hub. Pausing your paste — please retry in a
   > moment."

   with a **"Try again"** button and a **"Dismiss"** button.

### Verify — Network tab in the failing tab

4. In the tab where the modal appeared, inspect the Network tab. You should see:
   - 3 complete HEAD → PUT cycles, each PUT returning **412**.
   - After the third 412, no further PUT attempts (the retry loop is exhausted and the
     modal fires instead).

### Verify — retry on "Try again"

5. Click **"Try again"** in the modal. The modal should dismiss and a new paste attempt
   should begin (observe new HEAD + PUT requests in the Network tab).

   If the concurrent contention has settled, this retry should succeed and the snapshot
   lands in IndexedDB.

6. Confirm the modal does not appear again after a successful retry.

---

## Pass criteria checklist

Run through this checklist after completing all four scenarios:

- [ ] **Scenario 1 — Single-user local fidelity:** `provenance` array present in
      IndexedDB record after paste with join.
- [ ] **Scenario 1 — Cloud upload:** PUT body to `snapshot.json` contains `"provenance"`
      array.
- [ ] **Scenario 1 — Reload round-trip:** `provenance` array intact in IndexedDB after
      full page reload.
- [ ] **Scenario 2 — Cross-device fidelity:** `provenance` array present in IndexedDB on
      second device/window after loading from cloud.
- [ ] **Scenario 3 — Concurrent paste 412 path:** 412 response observed in Network tab,
      followed by successful retry; both snapshots present in IndexedDB; no blocking modal.
- [ ] **Scenario 4 — Rapid-fire exhaustion modal:** blocking modal appears in at least one
      tab after 3 consecutive 412 responses visible in Network tab.
- [ ] **Scenario 4 — Modal retry:** "Try again" CTA triggers a new paste attempt; modal
      dismisses after success.
- [ ] **No PII in conflict events:** inspect the `PasteConflictEvent` emitted to
      `subscribePasteConflict` — it contains only structural identifiers (`hubId`,
      `sourceId`, `snapshotId`). No row data, column values, or user identifiers. Verify
      by adding a temporary `console.log` breakpoint or checking App Insights telemetry
      (if wired) — structural logs only, no payload content.

---

## Known limitations

- **No visible provenance pill in MatchSummaryCard.** The pill rendering is deferred to a
  separate UX slice (logged in `docs/investigations.md` at P7.3). Provenance is verified
  via DevTools only in this walk. When the pill slice ships, this script will need a
  Scenario 5 for pill rendering + reload + cross-device pill persistence.

- **Scenario 4 timing sensitivity.** The 412 exhaustion path requires genuinely concurrent
  writes. On a local dev server with no network latency, all three tabs may succeed on the
  first attempt (each write completes before the next begins). Use DevTools network
  throttling or open more tabs to reliably trigger the exhaustion path.

- **Incognito requires sign-in.** An incognito window does not inherit the EasyAuth session
  cookie. You must sign in again with the same account for cross-device Scenario 2 to work
  against the same tenant data.

- **First paste into a new hub has no `If-Match`.** The HEAD for `_snapshots.json` returns
  404 on the very first paste (the blob does not yet exist). The PUT fires without an
  `If-Match` header. This is correct behaviour — there is no prior ETag to match. The
  `If-Match` header appears on all subsequent pastes into the same evidence source.
