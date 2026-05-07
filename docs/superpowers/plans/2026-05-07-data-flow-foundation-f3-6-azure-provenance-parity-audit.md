---
title: Data-Flow Foundation F3.6-β Audit — Azure persistence + cloud-sync surface
audience: [engineer]
category: implementation-audit
status: active
last-reviewed: 2026-05-07
related:
  - docs/superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity.md
  - docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md
---

# Data-Flow Foundation F3.6-β Audit — Azure persistence + cloud-sync surface

Pre-implementation read-only audit for the F3.6-β plan. Confirms plan assumptions, maps
call sites, and identifies scope-revising findings before any implementation dispatch begins.
File paths are repo-relative. Line numbers verified against worktree `data-flow-foundation-f3-6`
(branched from `main` at `bbb0db2e`).

---

## 1. Existing `EvidenceSnapshot` write call sites in Azure

Three distinct call sites construct and persist `EvidenceSnapshot` objects in Azure. The plan's
P2 section targets the first two only; the third is a surprise (see §7, S1).

### 1a. `useEditorDataFlow.ts` — paste flow (match-summary branch)

File: `apps/azure/src/features/data-flow/useEditorDataFlow.ts`

Two dispatch sites inside `acceptMatchSummary`:

- **`multi-source-join` branch** — lines 612–648: constructs `EvidenceSnapshot` inline, then
  calls `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', hubId, snapshot, provenance: tags })`.
  `provenance` carries a real `RowProvenanceTag[]`, but the handler in `applyAction.ts` ignores
  it today (F3.5 D3 asymmetry). The `snapshotId` field inside each tag is set to `''` (line 629)
  — the well-known placeholder from ADR-077. F3.6 closes this: once provenance rides the envelope
  facet, the `snapshotId = ''` placeholder is retired because the snapshot and its tags are
  serialized together.

- **`overlap-replace` branch (with overlapRange)** — lines 686–715: constructs snapshot, calls
  `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ..., provenance: [], replacedSnapshotId })`.
  Provenance is empty (`[]`); this is correct for an overlap-replace since no multi-source join
  occurred.

- **`overlap-replace` branch (fallback, no overlapRange)** — lines 721–748: identical pattern to
  above but without `rowTimestampRange`. Also `provenance: []`.

### 1b. `applyAction.ts` — EVIDENCE_ADD_SNAPSHOT handler (local Dexie write)

File: `apps/azure/src/persistence/applyAction.ts`, lines 149–168.

The handler receives the dispatched action. Today it writes only `action.snapshot` to
`db.evidenceSnapshots` (ignores `action.provenance`). After F3.6 P2.1, this is where the
envelope write lands: `const envelope = { ...action.snapshot, provenance: action.provenance }`.

### 1c. `ProcessHubEvidencePanel.tsx` — Evidence Source wizard (THIRD CALL SITE, NOT IN PLAN)

File: `apps/azure/src/components/ProcessHubEvidencePanel.tsx`, lines 169–203 and 332–344.

This component bypasses `azureHubRepository.dispatch` entirely. It calls
`useStorage().saveEvidenceSnapshot(snapshot, text)` directly — the `StorageProvider` facade,
which then dispatches `EVIDENCE_ADD_SNAPSHOT` with `provenance: []` (line 669 in `storage.ts`).

Two sub-paths:

- **Agent Review Log path** (line 203): `saveEvidenceSnapshot(snapshot, text)` — passes empty
  provenance.
- **Generic wizard path** (line 344): `saveEvidenceSnapshot(snapshot, rawText)` — same.

**Critical observation:** the snapshot `id` in the generic wizard (line 333) is constructed as
`` `snapshot-${Date.now()}` `` — **not** `generateDeterministicId()`. This violates the
`feedback_fix_absorbed_violations_at_seam` rule. Not technically a JSON-safety issue (string is
safe), but it breaks the deterministic-ID contract the rest of the codebase follows and may
cause collisions under fast successive calls (same millisecond). P2 or a P5 sweep should fix it.

**Impact on plan:** The `StorageProvider.saveEvidenceSnapshot` facade always passes
`provenance: []`. After F3.6 P1.1 adds `provenance?: RowProvenanceTag[]` to `EvidenceSnapshot`,
the facade call is still correct — empty provenance is valid for Evidence Source wizard snapshots
(no multi-source join). No change needed in the facade for functionality. The plan should
acknowledge this as the canonical non-join path.

---

## 2. Cloud-sync envelope flow

### `saveEvidenceSnapshotToCloud` — path through cloudSync → blobClient

File: `apps/azure/src/services/cloudSync.ts`, lines 250–263.

The function:

1. Calls `listEvidenceSnapshotsFromCloud` (reads catalog blob for the source).
2. Updates the in-memory list (upsert by `snapshot.id`).
3. Calls `wrapBlobCall(() => saveBlobEvidenceSnapshot(snapshot, sourceCsv))` — writes individual
   snapshot blob at path `process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/snapshot.json`.
4. Calls `updateBlobEvidenceSnapshots` — rewrites the catalog blob `_snapshots.json`.

Serialization: `blobClient.ts:putJsonBlob` (line 280) uses `JSON.stringify(value)` with no
custom replacer/reviver. The `snapshot` object is passed as-is; after F3.6 P1.1 adds
`provenance?: RowProvenanceTag[]`, it will be included in the JSON body automatically.

### `RowProvenanceTag[]` JSON round-trip safety

`RowProvenanceTag extends EntityBase` (`packages/core/src/evidenceSources.ts`, line 119;
`packages/core/src/identity.ts`, lines 13–17). Fields:

| Field        | Type               | JSON-safe? |
| ------------ | ------------------ | ---------- |
| `id`         | `string`           | Yes        |
| `createdAt`  | `number` (Unix ms) | Yes        |
| `deletedAt`  | `number \| null`   | Yes        |
| `snapshotId` | `string`           | Yes        |
| `rowKey`     | `string`           | Yes        |
| `source`     | `string`           | Yes        |
| `joinKey`    | `string`           | Yes        |

**Verdict: clean.** No `Date` instances, no `Map`/`Set`, no functions, no `bigint`, no circular
references. The `provenance: RowProvenanceTag[]` facet will round-trip through
`JSON.stringify`/`JSON.parse` without loss. D2 (one queue item per paste, envelope carried) is
safe.

### Sync queue (`syncQueue` Dexie table) — snapshot writes NOT queued here

The `syncQueue` table (`schema.ts`, lines 24–30, 57) and `addToSyncQueue` (line 148) are used
only for the **project-overlay** save path (`saveProject` in `storage.ts`). Evidence snapshot
writes go directly to Blob Storage inline within `saveEvidenceSnapshot` — no queue item is added
for them. If the cloud upload fails, the error is logged but NOT re-queued; the local Dexie
write has already succeeded.

**Impact on plan:** The plan's D2 says "one queue item per paste — the item's payload is the
snapshot envelope." This description does not match the current architecture. Evidence snapshots
are NOT in `syncQueue`; the queue is for full-project `.vrs` blobs. **No `syncQueue` change is
needed for the envelope expansion.** The plan's P3.2 ("Verify `services/cloudSync.ts` retry
mechanics — when the queue item is replayed, the same envelope payload is sent") is based on a
false assumption. See §7 S2.

---

## 3. SAS scope verification (D4)

File: `apps/azure/server.js`, lines 136–207.

The SAS token is minted as a **container-scoped SAS** (not blob-scoped):

```js
const sasToken = generateBlobSASQueryParameters({
  containerName,
  permissions: ContainerSASPermissions.parse('rwl'),  // read, write, list
  startsOn,
  expiresOn,
  protocol: SASProtocol.Https,
}, ...
```

The resulting `sasUrl` covers the **entire container** (`variscout-projects` by default).
`blobClient.ts:blobUrl()` appends blob paths to this container-scoped URL.

Snapshot blob paths (from `processHubEvidenceBlobPath` in `evidenceSources.ts`, lines 373–388):

```
process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/snapshot.json
```

**Verdict: SAS scope is not narrower than snapshot write paths.** The entire container is in
scope. D4 ("likely unchanged") is confirmed — no server-side change needed. F3.6 envelope
expansion only changes body content of the snapshot blob, not the path.

Note: The SAS URL is the container URL; `blobClient.ts:blobUrl` constructs the full path by
inserting the blob path before the query string (line 117–125). The container-level SAS covers
all these paths.

---

## 4. Existing ETag handling

### In `blobClient.ts`

One ETag-related function exists: `getEtagForProject` (lines 428–439). It performs a `HEAD`
request on `{projectId}/metadata.json` and returns the `ETag` response header. This is used
nowhere in the current write paths — it appears to be preparatory infrastructure that was added
but not yet wired.

**There is no existing `If-Match` conditional write anywhere in the blob client or cloud-sync
surface.** No existing ETag concurrency pattern to extend from; P4.1 writes from scratch.

### In `cloudSync.ts`

The `saveToCloud` function (line 177) returns `{ id, etag }` but `etag` is set to
`now` (a timestamp string, line 205) — not an actual ETag from the Blob Storage response. This
is used only for the project-overlay path's `markAsSynced` call and the `SyncStateRecord.etag`
field — not for conditional writes.

### Pattern for P4.1 addition

Since `blobClient.ts` uses raw `fetch` (not the `@azure/storage-blob` SDK), the ETag pattern
uses fetch headers directly, not the SDK's `BlobRequestConditions`. The plan's P4.1 code
snippet uses `BlockBlobClient.uploadData` with `conditions: { ifMatch }` — **this requires the
`@azure/storage-blob` SDK**, which is currently only used server-side (in `server.js`, line 156,
`await import('@azure/storage-blob')`). The client-side `blobClient.ts` explicitly avoids the
SDK.

**Scope revision required for P4.1:** Either (a) introduce the Azure Blob Storage SDK as a
client-side dependency (adds ~300 KB to the client bundle) or (b) implement ETag concurrency
using raw fetch headers (`If-Match: {etag}` request header; check response status for 412).
Option (b) is consistent with the existing architecture. See §7 S3.

---

## 5. `saveProcessHubToCloud` write surface

File: `apps/azure/src/services/cloudSync.ts`, lines 213–219.

```ts
export async function saveProcessHubToCloud(_token: string, hub: ProcessHub): Promise<void> {
  const hubs = await listProcessHubsFromCloud(_token);
  const next = hubs.some(existing => existing.id === hub.id)
    ? hubs.map(existing => (existing.id === hub.id ? hub : existing))
    : [...hubs, hub];
  await wrapBlobCall(() => updateBlobProcessHubs(next));
}
```

The hub blob is a **catalog of all hubs** (`_process_hubs.json`). `updateBlobProcessHubs` (in
`blobClient.ts`, line 262) calls `putJsonBlob('_process_hubs.json', hubs)`.

**The hub blob is not a "snapshots-list" per D5's description.** It is a flat JSON array of all
`ProcessHub` objects. Hub objects carry `evidenceSnapshots` as part of the ProcessHub type
only if the type embeds them — but `ProcessHub` in `processHub.ts` stores metadata, not a list
of snapshot ids. Evidence snapshot references are in the separate per-source catalog blobs
(`_snapshots.json`).

**Impact on D5:** The plan describes ETag concurrency on "the hub's snapshots-list blob" as
protecting "the canonical which-snapshots-are-live reference". The actual architecture splits
this across two blobs:

- `_process_hubs.json` — hub metadata catalog (concurrent teammates editing hub metadata can
  race here).
- `process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/_snapshots.json` — per-source
  snapshot catalog (concurrent pastes to the same source can race here).

ETag on `_process_hubs.json` protects hub-level metadata writes. ETag on `_snapshots.json`
protects the scenario D5 actually describes (two teammates pasting new snapshots simultaneously
against the same hub/source). The plan's P4.1 targets `saveProcessHubToCloud` but the real
concurrency risk is in `saveEvidenceSnapshotToCloud` → `updateBlobEvidenceSnapshots`. See §7 S4.

Callers of `saveProcessHubToCloud`:

- `storage.ts:saveProcessHub` (line 574) — called by the `StorageProvider` context for hub
  metadata saves (`HUB_PERSIST_SNAPSHOT`, outcomes, goal edits). No evidence snapshot reference
  in this path.

---

## 6. MatchSummaryCard pill rendering

`MatchSummaryCard` is in `packages/ui/src/components/MatchSummaryCard/index.tsx`. The component
**does not read provenance at all**. It accepts `MatchSummaryClassification` and calls
`onChoose` — it is a pure classification-display + action-routing card, not a provenance reader.

Provenance rendering (the pill that shows "from Source A + Source B" or similar) is **NOT in
MatchSummaryCard**. After searching the Azure app:

- `apps/azure/src/pages/Editor.tsx:2069` renders `<MatchSummaryCard>` — no provenance prop.
- The `MatchSummaryCard` `JoinKeySuggestion` sub-component shows the join key candidate but no
  provenance pills.
- The plan's P6.1 says "MatchSummaryCard pill rendering reads from `snapshot.provenance ?? []`" —
  but the actual `MatchSummaryCard` component does not render provenance pills at all.

**The provenance pill UI surface does not yet exist.** P6.1 as written would either:
(a) find no MatchSummaryCard pill to update (the component does not render one), or
(b) require creating the pill rendering in P6.1 — which is new UI work, not a verification step.

The plan assumes the pill already exists and just needs to read from a different source. This
assumption is incorrect. See §7 S5.

**Note:** the `setRowProvenance` prop in `useEditorDataFlow.ts` (line 648) feeds session-only
in-memory provenance state, not a rendered pill in MatchSummaryCard.

---

## 7. Surprises

### S1 — Third snapshot write call site missed in P2 plan: `ProcessHubEvidencePanel`

`apps/azure/src/components/ProcessHubEvidencePanel.tsx` (lines 203, 344) writes snapshots via
`useStorage().saveEvidenceSnapshot(snapshot, text)`. This is **not mentioned in the plan's P2**.
It does not call `azureHubRepository.dispatch` directly — it routes through the `StorageProvider`
facade, which always passes `provenance: []` (correct for Evidence Source wizard, no join).

Impact: Low — provenance is correctly empty for this path. But P2.3/P2.4 tests should include
a smoke assertion that the facade path also round-trips provenance (even if empty), so the
`evidenceSnapshots` Dexie table version bump (if any) is exercised by this path too.

**Plan delta:** P2 tasks should note the third call site. P5.5 ("sweep callers") should
include `ProcessHubEvidencePanel`.

### S2 — `syncQueue` does NOT carry snapshot writes; plan's D2/P3.2 are wrong about queue

The `syncQueue` Dexie table queues **project-overlay blobs** (`.vrs` files), not evidence
snapshots. Snapshot writes go inline to Blob Storage; if they fail, they are silently dropped
(logged only). The plan's D2 says "one queue item per paste — the item's payload is the snapshot
envelope" and P3.2 says to verify "queue item is replayed, the same envelope payload is sent."

Neither is applicable. There is no queue for snapshot writes. The envelope expansion is purely
body-side: after F3.6 P1.1, `action.snapshot` already carries `provenance`; `saveEvidenceSnapshotToCloud`
serializes the full snapshot object via `JSON.stringify(value)` in `putJsonBlob` — provenance
rides automatically.

**Plan deltas:**

- D2 description is misleading; rewrite as: "Envelope atomicity is per-object (single PUT call).
  No queue item needed — the snapshot upload is a single atomic Blob Storage PUT carrying the
  full envelope body. Retry on network failure re-uploads the same object (idempotent via
  snapshot id as path key)."
- P3.2 should be: "Verify that `saveEvidenceSnapshotToCloud` serializes the full snapshot object
  (including `provenance` from D1) in the single `putJsonBlob` call at
  `cloudSync.ts:259`. No queue-level changes required."

### S3 — Plan's P4.1 uses Azure SDK but client-side code uses raw fetch; SDK not available client-side

The plan's P4.1 code snippet uses `BlockBlobClient.uploadData` and `BlobRequestConditions.ifMatch`.
The `@azure/storage-blob` SDK is imported only in `server.js` (server-side, line 156:
`await import('@azure/storage-blob')`). The client-side `blobClient.ts` uses raw `fetch`
explicitly ("No Azure SDK on the client — all operations use REST API with SAS tokens",
line 1 comment).

Introducing the SDK client-side would add ~300 KB to the client bundle (rough estimate; the SDK
is not tree-shakeable well for client use).

**Recommended plan delta (P4.1):** Implement ETag concurrency using raw fetch:

- HEAD request to `_process_hubs.json` → read `ETag` from response header.
- PUT request with `If-Match: {etag}` header → check `response.status === 412` for conflict.
- Retry loop (max 3) in `updateBlobProcessHubs` or a new `updateBlobProcessHubsConditional`
  wrapper in `blobClient.ts`.

This avoids a new dependency and is consistent with `getEtagForProject` already in `blobClient.ts`.

### S4 — ETag concurrency risk is on `_snapshots.json`, not `_process_hubs.json`

The plan's D5 describes the concurrency scenario as: "Two teammates pasting simultaneously can
race on this [snapshots-list] blob." The `_process_hubs.json` catalog is a hub-metadata blob;
concurrent pastes don't race on it. The race is on
`process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/_snapshots.json` — the snapshot
catalog that `updateBlobEvidenceSnapshots` (in `cloudSync.ts:saveEvidenceSnapshotToCloud`)
rewrites.

**Plan delta:** D5 and P4.1 should target `updateBlobEvidenceSnapshots` / `_snapshots.json`,
not `saveProcessHubToCloud` / `_process_hubs.json`. A conditional `updateBlobEvidenceSnapshotsConditional`
wrapper in `blobClient.ts` carrying `If-Match` on the catalog blob is the correct placement.
`saveProcessHubToCloud` ETag-guarding is optional (protects hub metadata LWW conflicts) but is
not the primary paste-concurrency surface.

This is a **phase scope correction**: P4.1 should be updated before dispatch begins.

### S5 — MatchSummaryCard provenance pill does not exist; P6.1 is new UI work

`MatchSummaryCard` (`packages/ui/src/components/MatchSummaryCard/index.tsx`) does not render
any provenance pill. It shows temporal classification labels and routing buttons. The
`setRowProvenance` callback in `useEditorDataFlow` feeds session-only in-memory state; there is
no component that currently renders it as a visible pill.

**Plan delta:** P6.1 as written says "Ensure pill rendering reads from `snapshot.provenance ?? []`"
— but the pill doesn't exist. P6.1 should either:
(a) Explicitly create a new provenance-pill component (new UI work — add to P6 as a task); or
(b) Be scoped to verifying that a future UI surface can access `snapshot.provenance` correctly
(and defer pill rendering to a separate slice).

If (a), P6.1 needs a spec alignment check: does the plan's P6 have enough scope to design and
build a new UI component? The current P6.1 description implies a 15-minute verification, not
new component work.

### S6 — `ProcessHubEvidencePanel` uses `snapshot-${Date.now()}` id; violates deterministic-id contract

File: `apps/azure/src/components/ProcessHubEvidencePanel.tsx`, line 333:

```ts
id: `snapshot-${Date.now()}`,
```

All other snapshot construction uses `generateDeterministicId()` (via `crypto.randomUUID()`).
Per `feedback_fix_absorbed_violations_at_seam`, P5.5's sweep should fix this in the same PR.

**Plan delta:** P5.5 ("Sweep callers") should include fixing the id construction in
`ProcessHubEvidencePanel.tsx:333` to use `generateDeterministicId()`.

### S7 — F3.5 P2.4 deferral verified: investigations.md entry confirmed present

`docs/investigations.md` lines 232–250 contain the "Azure `rowProvenance` Dexie table —
deferred" entry exactly as expected. Surfaced 2026-05-06; logged by F3.5 P2.4. Plan's claim
that this entry exists and should be marked `[RESOLVED]` in P7.3 is confirmed.

### S8 — `setRowProvenance` in `useEditorDataFlow` is currently optional (`?`) and passed as `undefined` from Editor.tsx

`useEditorDataFlow.ts` line 241: `setRowProvenance?: (startIndex: number, tags: RowProvenanceTag[]) => void;`
(optional). At `apps/azure/src/pages/Editor.tsx:579–595`, the `useEditorDataFlow` call does NOT
pass `setRowProvenance` at all. This means the session-only in-memory provenance path is
currently a no-op even in the pre-F3.6 codebase — the callback fires (line 648:
`setRowProvenance?.(startIndex, tags)`) but silently does nothing.

**Implication for P5.2:** When the plan says "Drop `setRowProvenance?` prop from hook signature",
it's correct — but it's also already effectively dead code. No consumer in `Editor.tsx` provides
this callback today. P5.2 is safe to execute without a secondary consumer audit.

---

## Plan deltas

The following concrete changes to the F3.6-β plan are recommended before dispatch:

| #   | Phase         | Change                                                                                                                                                                                                                               |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PD1 | §Context + D2 | Rewrite D2 description: snapshots are NOT queued in `syncQueue`; atomicity is per-object (single PUT body = snapshot + provenance). "One queue item per paste" is incorrect.                                                         |
| PD2 | P3.2          | Replace "verify queue-item replay preserves envelope" with "verify `cloudSync.ts:saveEvidenceSnapshotToCloud:259` serializes full snapshot (including `provenance`) in the single `putJsonBlob` call".                               |
| PD3 | P4.1          | Replace `BlockBlobClient.uploadData` + `BlobRequestConditions` with raw fetch `If-Match` header pattern (consistent with `blobClient.ts` no-SDK approach). Add `updateBlobEvidenceSnapshotsConditional` to `blobClient.ts`.          |
| PD4 | D5 + P4.1     | Retarget ETag concurrency from `saveProcessHubToCloud` / `_process_hubs.json` to `saveEvidenceSnapshotToCloud` / `updateBlobEvidenceSnapshots` / `_snapshots.json` — this is the actual concurrent-paste race surface.               |
| PD5 | P2 (all)      | Add `ProcessHubEvidencePanel.tsx` as a third snapshot write call site. Ensure P2.3/P2.4 tests exercise the facade path (`StorageProvider.saveEvidenceSnapshot` → `EVIDENCE_ADD_SNAPSHOT` with `provenance: []`).                     |
| PD6 | P5.5          | Add `ProcessHubEvidencePanel.tsx:333` id fix to sweep: replace `` `snapshot-${Date.now()}` `` with `generateDeterministicId()`.                                                                                                      |
| PD7 | P6.1          | Clarify scope: the provenance pill does not exist yet. Either (a) explicitly scope new component work into P6 tasks, or (b) defer pill rendering and scope P6.1 to a read-path verification only. Decision required before dispatch. |

---

## P0 gate status

| Gate                                                | Status                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| All Azure snapshot-write call sites mapped          | CONFIRMED (3 found: `useEditorDataFlow`, `applyAction`, `ProcessHubEvidencePanel` via facade)                      |
| SAS scope verified (no server-side change required) | CONFIRMED — container-scoped SAS covers all blob paths                                                             |
| Existing ETag handling documented                   | CONFIRMED — none on write paths; `getEtagForProject` (HEAD only) exists in `blobClient.ts`; no `If-Match` anywhere |
| P4.1 SDK assumption clarified                       | NEEDS PLAN UPDATE before dispatch (see PD3)                                                                        |
| ETag target blob corrected                          | NEEDS PLAN UPDATE before dispatch (see PD4)                                                                        |
| MatchSummaryCard pill scope clarified               | NEEDS DECISION before P6 dispatch (see PD7)                                                                        |
