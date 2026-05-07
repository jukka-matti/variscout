---
title: Data-Flow Foundation F3.6-β — Azure rowProvenance parity (envelope facet + cloud-sync via Blob Storage + ETag concurrency)
audience: [engineer]
category: implementation-plan
status: active
last-reviewed: 2026-05-07
related:
  - docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md
  - docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion.md
  - docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2.md
  - docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md
  - docs/07-decisions/adr-058-deployment-lifecycle.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/decision-log.md
---

# Data-Flow Foundation F3.6-β Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **Sonnet for implementer + spec/quality reviewer roles (≥70% of dispatches); Opus only for the final-branch code review and any task explicitly tagged `[OPUS]`.**

**Goal:** Bring Azure provenance persistence to parity with PWA (F3.5 D2) AND extend it with **cloud-sync via Blob Storage** so multi-team-member fidelity holds — when Teammate A pastes new data with a multi-source merge, Teammate B sees the same `RowProvenanceTag[]` after their next sync, not just the merged rows. Closes the F3.5 D3 asymmetry for the team-collaboration use case the paid-tier was built for.

**Architecture:** Envelope facet — `RowProvenanceTag[]` becomes an optional field on `EvidenceSnapshot`, riding in the same Blob Storage object atomically (research-validated; Azure Blob Storage has no multi-object atomic transactions). **ETag optimistic concurrency** on the hub's snapshots-list blob handles concurrent-paste conflicts (Azure-canonical pattern; 412 Precondition Failed → user-facing "teammate updated; refresh" UX). Single PR off branch `data-flow-foundation-f3-6`.

**Tech Stack:** TypeScript, Vitest + React Testing Library + Playwright, Dexie 4, raw `fetch` against Blob Storage REST (consistent with `apps/azure/src/services/blobClient.ts` no-SDK approach — the `@azure/storage-blob` SDK is server-side only in `server.js`), pure-TS engine helpers from `@variscout/core`. No new runtime dependencies.

---

## Amendments — 2026-05-07 (post-P0 audit)

P0.1 audit (`docs/superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity-audit.md`, commit `baf96b09`) returned 8 plan-revising findings. The amendments below are **authoritative** — phases below them inherit these corrections.

| #   | Affects               | Correction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PD1 | D2                    | `syncQueue` is for project-overlay `.vrs` blobs ONLY; evidence snapshots write inline via `saveEvidenceSnapshotToCloud`. Atomicity is per-object (single PUT body = snapshot + provenance). Retry on transient failure re-uploads the same idempotent object (snapshot id is the path key). No queue-item changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| PD2 | P3.2                  | Replace "verify queue-item replay preserves envelope" with: verify `cloudSync.ts:saveEvidenceSnapshotToCloud` (line ~250–263) serializes the full snapshot (incl. `provenance`) in the single `putJsonBlob` call. Confirm `blobClient.ts:putJsonBlob` (line ~280) uses `JSON.stringify(value)` with no replacer/reviver that would strip the new field. RowProvenanceTag is JSON-clean (audit §2 verified).                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| PD3 | P4.1                  | Replace `BlockBlobClient.uploadData` + `BlobRequestConditions` (server SDK pattern) with raw `fetch` `If-Match` header pattern, consistent with `blobClient.ts`. Add `updateBlobEvidenceSnapshotsConditional` wrapper there: HEAD → read `ETag` response header → PUT with `If-Match: <etag>` → check `response.status === 412` for conflict → retry up to 3× with exponential backoff. No new client deps.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| PD4 | D5 + P4.1, P4.3, P4.4 | Retarget ETag concurrency from `saveProcessHubToCloud` / `_process_hubs.json` (hub metadata catalog — wrong race surface) to `saveEvidenceSnapshotToCloud` / `updateBlobEvidenceSnapshots` / `_snapshots.json` (per-source snapshot catalog — actual concurrent-paste race surface). Test file becomes `apps/azure/src/services/__tests__/blobClient.etag.test.ts`. `saveProcessHubToCloud` ETag is out of scope.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| PD5 | P2.3 + P2.4           | Add a third snapshot write call site to coverage: `apps/azure/src/components/ProcessHubEvidencePanel.tsx` (lines 169–203, 332–344) routes through `useStorage().saveEvidenceSnapshot` → `StorageProvider` facade → dispatches `EVIDENCE_ADD_SNAPSHOT` with `provenance: []`. Tests must exercise the facade path (provenance empty round-trips cleanly) alongside the dispatch path.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| PD6 | P5.5                  | Sweep adds: replace `snapshot-${Date.now()}` (`ProcessHubEvidencePanel.tsx:333`) with `generateDeterministicId()`. `feedback_fix_absorbed_violations_at_seam` mandates fixing on touch. Same PR.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| PD7 | P6.1, P6.2            | The MatchSummaryCard provenance pill **does not exist** today. F3.6-β scope is persistence/sync correctness; pill rendering is deferred to a separate UX slice (logged in `docs/investigations.md` at P7.3). P6.1 narrows to: assert `snapshot.provenance` is correctly populated, persisted to Dexie, and round-tripped through Blob Storage — verified via test + DevTools inspection (Network tab + IndexedDB), not a visible UI pill. P6.2 Chrome walk fidelity criteria become DevTools-based ("inspect IndexedDB → confirm provenance facet present after reload; inspect Blob Storage Network response → confirm envelope JSON contains `provenance` array; concurrent-paste 412 path observable via Network tab `If-Match` headers + 412 status + retry"). The non-blocking toast / blocking modal UX (P5.1) still ships and is exercised. |

P0 gate status (from audit):

- All Azure snapshot-write call sites mapped: ✅
- SAS scope verified: ✅ (container-scoped, covers all paths)
- Existing ETag handling: documented (`getEtagForProject` HEAD-only; no `If-Match` write paths)
- P4.1 SDK assumption: corrected (PD3)
- ETag target blob: corrected (PD4)
- MatchSummaryCard pill scope: deferred per (PD7)

Amendments locked 2026-05-07; P1 dispatch begins next.

---

## Context

[Data-Flow Foundation Spec](../specs/2026-05-06-data-flow-foundation-design.md) §5 + the F3.5 plan's D3 logged Azure provenance as deferred. This plan picks it up with a stronger frame than the original "F3.6-α local-Dexie only" sketch: **paid-tier team collaboration via Blob Storage (ADR-058) means provenance must travel through the same sync channel as the snapshots it tags, otherwise teammates see merged data without the merge metadata** — a correctness bug, not just UX polish.

**Pre-research framing (rejected):** "F3.6 = audit-trail compliance" — wrong. `RowProvenanceTag` is paste-time multi-source-merge metadata (per ADR-077 D6), not a who-edited-what audit log. GxP / 21 CFR Part 11 compliance regimes are a separate future concern, parked.

**Research validation (web search 2026-05-07):**

- **Azure Blob Storage has NO native atomic multi-object transactions** ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage)). Envelope is the only way to guarantee snapshot+provenance atomicity per paste without ETag-coordinated multi-blob writes.
- **OpenLineage facet pattern** is the industry-standard shape for "atomic metadata attached to a core entity, extensible via custom facets" ([OpenLineage docs](https://openlineage.io/docs/integrations/spark/spark_column_lineage/)). Treats `provenance` as a facet on `EvidenceSnapshot` — future provenance kinds (column-level, transformation lineage) can land as additional facets without breaking the envelope schema.
- **Last-write-wins is the right default** for paste-time cadence ([Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/637680/document-collaboration-using-azure-blob-storage), [Hello Interview](https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox)) — but conflict surfaces need ETag optimistic concurrency on the active-snapshots-list blob (the hub-level pointer collection that two teammates can race on).
- **METS / image-header / OpenLineage-facet** all support the envelope pattern at our scale; sibling/linked makes sense at >100k events/day or when provenance has its own scaling pattern (graph DB lineage walks). VariScout has neither.

**Pre-production invariant.** No backward-compatibility shims. Existing dev tenant snapshots without provenance facets stay as-is (pre-F3.6 tenants don't have multi-source-merged data; new pastes populate forward). No migration code needed.

All file paths and line numbers below are verified against `main` at commit `bbb0db2e`.

---

## PR boundary

Single squash-merged PR off branch `data-flow-foundation-f3-6`. Phases P0 → P7 below all land on this branch in the same PR. Per-task spec/quality reviewers; final Opus review at P7. Estimated ~1.5x F3.5 scope (Azure-side only; PWA already shipped F3.5).

---

## Locked decisions (this slice — F3.6 D1–D5)

### D1. Envelope shape — `provenance` facet on `EvidenceSnapshot`

`RowProvenanceTag[]` becomes an optional field directly on `EvidenceSnapshot`:

```ts
// packages/core/src/evidenceSources.ts
export interface EvidenceSnapshot extends EntityBase {
  // ... existing fields
  provenance?: RowProvenanceTag[]; // populated when multi-source merge happens
}
```

The snapshot blob carries provenance inline; one Blob Storage object per snapshot per hub. Atomic writes for free at the per-snapshot level — no ETag dance needed for snapshot-internal consistency.

**Why:** Azure Blob Storage has no multi-object atomic transactions ([research](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage)). Envelope guarantees that "snapshot reached cloud iff provenance reached cloud." Industry precedent: OpenLineage facets, METS, image-file headers. `RowProvenanceTag.snapshotId` typed-FK from F1+F2 P1.3 stays consistent (denormalized inside envelope; FK matches parent's `id`).

**Trade-off:** snapshot blob size grows by ~150 bytes × row count. 10k-row paste ≈ 1.5 MB envelope. Well within Blob Storage block-blob limits (max 4TB; Microsoft's "hot path" guidance is <100MB). Cold-path retrieval cost unchanged (block blobs are cheap to GET).

**How to apply:** P1 extends the type; P2+P3 wire the persistence; P4 wires read consumers.

### D2. Sync-queue integration — one item per paste (carries envelope)

`syncQueue` Dexie table (`apps/azure/src/db/schema.ts`) already mediates retry on cloud-sync failures. After F3.6, one queue item per paste — the item's payload is the snapshot envelope (snapshot + provenance). Atomic retry: if cloud upload fails mid-flight, re-attempt the same envelope; no risk of "snapshot uploaded but provenance retry pending."

**Why:** flows from D1. Two queue items (snapshot + provenance separately) would re-introduce the multi-object-atomicity problem.

**How to apply:** P3 extends `services/storage.ts:saveEvidenceSnapshotToCloud` to send envelope payload; sync-queue logic in `services/cloudSync.ts` re-runs the same method on retry — no changes needed beyond the payload shape.

### D3. Read hydration — lazy by default

`AzureHubRepository.evidenceSnapshots.list/getByHub` returns snapshots with provenance inline (since envelope shape) — but **no consumer eagerly reads it**. Most code paths (capability, regression, defect, pareto) ignore the optional field. Only the MatchSummaryCard pill renderer + future Wall lookups touch it.

**Why:** in-memory cost is acceptable since envelope is already the persisted shape; hydration question reduces to "do consumers traverse the field?" Most don't. Adding a separate `rowProvenance.listBySnapshot(id)` call would force redundant Dexie reads.

**How to apply:** P4 verifies that pill rendering + `useDenormalizedHubView`-style consumers correctly access `snapshot.provenance ?? []` without eager hydration.

### D4. Blob Storage SAS scope — verify in P0; likely unchanged

Existing `/api/storage-token` endpoint in `server.js` returns SAS-restricted URLs scoped to specific blob path patterns (e.g., `evidenceSnapshots/{hubId}/*`). Envelope shape change is body-side only — same path, bigger payload. SAS scope shouldn't need updating.

**Why:** SAS scope governs path access; envelope expansion changes object body, not path.

**How to apply:** P0 audit confirms by reading `server.js` SAS token issuance + checking the path patterns match the snapshot-write call sites.

### D5. ETag optimistic concurrency on the hub's snapshots-list blob

Each hub has a "snapshots-list" pointer collection (the canonical "which snapshots are live for this hub"). Two teammates pasting simultaneously can race on this list:

- **Per-snapshot blobs:** safe — each paste creates a unique snapshot id (`generateDeterministicId()` UUID v4). No two teammates produce the same id.
- **Snapshots-list blob:** at risk — both teammates read the same active list, append their new snapshot id locally, then upload. Whichever write lands second silently overwrites the first, dropping a teammate's paste from the list.

**Pattern (Azure-canonical):**

1. Read snapshots-list blob → store ETag from response header
2. Compose updated list locally (append new snapshot id, optionally mark replaced ones `deletedAt`)
3. Upload with `If-Match: <stored-ETag>` header
4. **Success (200/201)** → write committed; new ETag returned
5. **412 Precondition Failed** → another teammate wrote in between; client must:
   - Re-read snapshots-list (now with their write applied)
   - Re-compose the local update (re-merge: usually trivial — append to the new list)
   - Re-upload with the new ETag

**412 UX:** non-blocking toast — "Another teammate added new data. Refreshing..." → automatic re-read + re-merge + re-upload. User doesn't need to take action; the operation completes after one round-trip retry. If retry also returns 412 (rapid-fire concurrent pastes), retry up to 3 times with 100ms backoff before surfacing a blocking modal: "Multiple teammates are updating this hub. Pausing your paste — try again in a few seconds."

**Why:** standard Azure pattern ([Mark Heath](https://markheath.net/post/2026/2/9/azure-blob-storage-etag-concurrency), [Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage), [Azure Storage docs](https://azure.github.io/Storage/docs/application-and-user-data/code-samples/concurrent-uploads-with-versioning/)). LWW (last-write-wins) is the file-storage default (Dropbox, Google Drive, OneDrive — research) but for hub-level state, silent-LWW means dropped pastes. ETag check + retry surfaces the conflict and resolves it cleanly without per-paste user intervention.

**How to apply:** P4 wires ETag handling in `services/storage.ts:saveProcessHubToCloud` (since the hub blob carries the active-snapshots reference). Uses `@azure/storage-blob` SDK's `BlobUploadCommonResponse.etag` + `BlobRequestConditions.ifMatch`. P5 wires the toast UX. P6 covers the retry loop.

---

## File structure

### Created

| Path                                                                                           | Phase | Responsibility                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity-audit.md` | P0    | Output of P0 audit — Azure persistence call sites + cloud-sync touchpoints + SAS scope verification + existing ETag handling (if any) |
| `apps/azure/src/persistence/__tests__/applyAction.evidence.provenance.test.ts`                 | P2.4  | Coverage for Azure `EVIDENCE_ADD_SNAPSHOT` + `EVIDENCE_ARCHIVE_SNAPSHOT` with provenance facet (envelope shape, cascade)              |
| `apps/azure/src/services/__tests__/storage.etag.test.ts`                                       | P4.4  | Coverage for ETag optimistic concurrency on `saveProcessHubToCloud` (success path + 412 retry path + max-retry blocking modal)        |
| `apps/azure/src/components/__tests__/PasteConflictToast.test.tsx`                              | P5.3  | Coverage for the 412-recovery toast UI                                                                                                |

### Modified

| Path                                                                    | Phase      | Action                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `packages/core/src/evidenceSources.ts`                                  | P1.1       | Add `provenance?: RowProvenanceTag[]` field to `EvidenceSnapshot` interface (D1 envelope facet)                                                                                                                                                                                 |
| `packages/core/src/__tests__/evidenceSources.test.ts` (verify path)     | P1.1       | Update fixtures with provenance facet examples                                                                                                                                                                                                                                  |
| `apps/azure/src/db/schema.ts`                                           | P1.2       | Verify Dexie `evidenceSnapshots` table store definition handles the new optional field (Dexie auto-handles since fields are dynamic). Bump `version()` only if explicit index on `provenance` is needed (likely not — pill renderer reads inline)                               |
| `apps/azure/src/persistence/applyAction.ts`                             | P2.1, P2.2 | Extend `EVIDENCE_ADD_SNAPSHOT` to write envelope (snapshot with `provenance` field); cascade `EVIDENCE_ARCHIVE_SNAPSHOT` is unchanged (single-record soft-delete). Drop the "rowProvenance has no Azure Dexie table" comment per F3.5 P2.4 since provenance now rides envelope. |
| `apps/azure/src/persistence/__tests__/applyAction.test.ts`              | P2.3       | Update existing snapshot tests to assert envelope shape preserves provenance through round-trip                                                                                                                                                                                 |
| `apps/azure/src/services/storage.ts`                                    | P3.1       | Extend `saveEvidenceSnapshotToCloud` envelope payload to include provenance (already in the snapshot object via D1; verify serialization preserves it through the Blob Storage `uploadData` call). Drop any explicit `setRowProvenance` mediation.                              |
| `apps/azure/src/services/storage.ts` (`saveProcessHubToCloud`)          | P4.1       | Wrap upload in ETag optimistic concurrency: read existing blob's ETag, upload with `If-Match`, handle 412 with retry loop (max 3 attempts × 100ms backoff). Surface errors to caller via a typed result `{ ok: true }                                                           | { ok: false, reason: 'concurrency-exhausted' }`. |
| `apps/azure/src/services/cloudSync.ts` (verify path)                    | P4.2       | Sync-queue retry: if storage call returns `concurrency-exhausted`, requeue with exponential backoff and surface to UI via toast subscription                                                                                                                                    |
| `apps/azure/src/components/PasteConflictToast.tsx` (NEW)                | P5.1       | Toast component — non-blocking "Teammate updated; refreshing" → after 3 retry-failures, blocking modal "Multiple teammates updating; try again"                                                                                                                                 |
| `apps/azure/src/features/data-flow/useEditorDataFlow.ts`                | P5.2       | Drop the F3.5 D3 asymmetry — Azure paste flow now mirrors PWA pattern. Remove `setRowProvenance?` + `evidenceSnapshots?` props (handler reads from repo + dispatches atomic envelope). Subscribe to PasteConflictToast for 412 surfacing.                                       |
| `apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.test.ts` | P5.4       | Update tests — mock dispatch + verify provenance threading through envelope; assert no `setRowProvenance` callback (drops).                                                                                                                                                     |
| `apps/azure/src/components/MatchSummaryCard.tsx` (verify path)          | P6.1       | Ensure pill rendering reads `snapshot.provenance ?? []` (lazy hydration per D3); pill survives reload because the field persists in envelope                                                                                                                                    |
| `docs/decision-log.md`                                                  | P7.3       | Add 2026-05-XX entry: F3.6-β SHIPPED. Note D1-D5 + research synthesis + close the F3.5 P2.4 deferral                                                                                                                                                                            |
| `docs/investigations.md`                                                | P7.3       | Mark the F3.5 P2.4 "Azure rowProvenance — deferred" entry as `[RESOLVED 2026-05-XX — see decision-log F3.6-β SHIPPED entry]`                                                                                                                                                    |
| `~/.claude/projects/.../memory/project_data_flow_foundation_fseries.md` | P7.4       | Update F-series description + delivery state to reflect F3.6-β SHIPPED + drop the asymmetry watchlist item                                                                                                                                                                      |

---

## Sequencing

Per `superpowers:subagent-driven-development`. **Sonnet workhorse ≥ 70%.** One worktree at `.worktrees/data-flow-foundation-f3-6/`, single squash-merged PR.

### Phase P0 — Audit (read-only, single dispatch)

- [ ] **Task P0.1** _(Sonnet, general-purpose, Explore-style scope: thorough)_ — Audit current Azure persistence + cloud-sync surface. Output: `docs/superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity-audit.md` with:
  1. **Existing `EvidenceSnapshot` write call sites in Azure** — every code path that constructs/persists a snapshot. PWA-side coverage already exists; this is Azure-only.
  2. **Cloud-sync envelope flow** — `services/storage.ts` `saveEvidenceSnapshotToCloud` + `services/cloudSync.ts` retry mechanics + `syncQueue` Dexie table integration. Identify where the envelope serialization happens; verify whether `RowProvenanceTag[]` would round-trip through `JSON.stringify` cleanly (no Dates, no circular refs).
  3. **SAS scope verification** — read `server.js` `/api/storage-token` endpoint; document the path patterns it grants access to. Confirm `evidenceSnapshots/{hubId}/*` (or equivalent) is in scope. **Critical:** if SAS scope is narrower than the snapshot-write paths, F3.6 needs to extend it (could be a non-trivial security review).
  4. **Existing ETag handling in storage.ts** — does any current write path use `If-Match`? Document the pattern if yes; sketch the addition pattern if no.
  5. **`saveProcessHubToCloud` write surface** — exact line(s); how the hub blob carries the active-snapshots list (likely `processHub.evidenceSnapshots[].id` references); how F3.6 would tap in.
  6. **MatchSummaryCard pill rendering** — current implementation reads provenance from where? After F3.6 it should read from `snapshot.provenance` directly. Identify the call site to update.
  7. **Surprises section** — anything that changes the F3.6-β plan scope (e.g., a third snapshot-write call site missed, an existing cloud-sync envelope shape that conflicts with provenance addition, SAS scope gap requiring server-side change).

  **Acceptance:** audit doc committed; P1+ reference it.

  **Why:** F1+F2's P0 audit caught 15 plan-revising findings; F3.5's P0 caught 5+ more. Same pattern. Cheaper than mid-flight pivot.

### Phase P1 — Type extension

- [ ] **Task P1.1** _(Sonnet)_ — Add `provenance?: RowProvenanceTag[]` to `EvidenceSnapshot` in `packages/core/src/evidenceSources.ts`. Update test fixtures with provenance examples (deterministic literals, no `Date.now()` in test value positions). Verify `pnpm --filter @variscout/core build + test` green.

- [ ] **Task P1.2** _(Sonnet)_ — Verify Azure Dexie `evidenceSnapshots` table handles the new optional field (Dexie schemaless within rows; auto-handled). If P0 audit identified an indexed-field requirement, bump `version()` with an `.upgrade()` migration. Otherwise no schema change.

- [ ] **Task P1.3** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P2 — Azure applyAction handlers (envelope local writes)

- [ ] **Task P2.1** _(Sonnet)_ — Extend `EVIDENCE_ADD_SNAPSHOT` in `apps/azure/src/persistence/applyAction.ts`:

  ```ts
  case 'EVIDENCE_ADD_SNAPSHOT': {
    // existingRange query + classifier re-run as in PWA F3.5 D1
    if (action.replacedSnapshotId) {
      await db.evidenceSnapshots.update(action.replacedSnapshotId, { deletedAt: Date.now() });
    }
    // Envelope: provenance rides on the snapshot; no separate table write
    const envelope: EvidenceSnapshot = {
      ...action.snapshot,
      provenance: action.provenance, // populates the facet
    };
    await db.evidenceSnapshots.put(envelope);
    return;
  }
  ```

  Drop the F3.5 D3 "rowProvenance has no Azure Dexie table" comment.

- [ ] **Task P2.2** _(Sonnet)_ — Verify `EVIDENCE_ARCHIVE_SNAPSHOT` is correct (single-record soft-delete; envelope provenance archives implicitly with the snapshot row's `deletedAt`). No code change expected.

- [ ] **Task P2.3** _(Sonnet)_ — Update `apps/azure/src/persistence/__tests__/applyAction.test.ts` to assert envelope round-trip (snapshot in → snapshot out with `provenance` field intact).

- [ ] **Task P2.4** _(Sonnet)_ — New test file `apps/azure/src/persistence/__tests__/applyAction.evidence.provenance.test.ts`:
  - `EVIDENCE_ADD_SNAPSHOT writes provenance facet inline with snapshot`
  - `EVIDENCE_ADD_SNAPSHOT with replacedSnapshotId marks old snapshot deletedAt; provenance facet on new snapshot intact`
  - `EVIDENCE_ARCHIVE_SNAPSHOT cascades deletedAt to the snapshot (provenance archives implicitly via envelope)`
  - Empty provenance array vs missing provenance field both round-trip cleanly

- [ ] **Task P2.5** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P3 — Cloud-sync envelope expansion

- [ ] **Task P3.1** _(Sonnet)_ — Extend `services/storage.ts:saveEvidenceSnapshotToCloud` to ensure provenance rides in the uploaded payload. Since the snapshot already has `provenance` from D1, this is verifying serialization preserves it (no transform/strip happening anywhere). Update JSDoc to document the envelope shape.

- [ ] **Task P3.2** _(Sonnet)_ — Verify `services/cloudSync.ts` retry mechanics — when the queue item is replayed, the same envelope payload is sent. No changes expected; just confirm sync-queue serialization preserves the new field.

- [ ] **Task P3.3** _(Sonnet)_ — Tests: extend `services/__tests__/storage.test.ts` (or create) to assert the envelope shape lands in the upload call. Mock `@azure/storage-blob` `BlockBlobClient.uploadData` and verify the body contains `provenance`.

- [ ] **Task P3.4** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P4 — ETag optimistic concurrency on `saveProcessHubToCloud`

- [ ] **Task P4.1** _(Sonnet)_ — Wrap `saveProcessHubToCloud` in `services/storage.ts` with ETag optimistic concurrency:

  ```ts
  async function saveProcessHubToCloud(
    sasUrl: string,
    hub: ProcessHub
  ): Promise<
    { ok: true; etag: string } | { ok: false; reason: 'concurrency-exhausted' | 'network' | 'auth' }
  > {
    const blobClient = new BlockBlobClient(sasUrl);
    const MAX_RETRIES = 3;
    const BACKOFF_MS = 100;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // 1. Read current blob + ETag (if exists)
      let currentEtag: string | undefined;
      try {
        const props = await blobClient.getProperties();
        currentEtag = props.etag;
      } catch (err) {
        if ((err as RestError)?.statusCode !== 404) throw err;
        // 404 = blob doesn't exist yet (first-paste); proceed without If-Match
      }

      // 2. Compose body (caller provides hub via parameter; that's the merged state)
      const body = JSON.stringify(hub);

      // 3. Upload with conditional If-Match
      try {
        const resp = await blobClient.uploadData(Buffer.from(body), {
          conditions: currentEtag ? { ifMatch: currentEtag } : undefined,
          blobHTTPHeaders: { blobContentType: 'application/json' },
        });
        return { ok: true, etag: resp.etag ?? '' };
      } catch (err) {
        if ((err as RestError)?.statusCode === 412) {
          // 412 Precondition Failed — another teammate wrote in between. Retry.
          await sleep(BACKOFF_MS * Math.pow(2, attempt));
          continue;
        }
        throw err;
      }
    }
    return { ok: false, reason: 'concurrency-exhausted' };
  }
  ```

  Update `saveProcessHubToCloud` callers to handle the typed result.

- [ ] **Task P4.2** _(Sonnet)_ — Update `services/cloudSync.ts` retry mechanics to re-queue on `concurrency-exhausted` reason with exponential backoff (sync-queue level). Surface to UI subscribers via existing event channel.

- [ ] **Task P4.3** _(Sonnet)_ — Tests in `apps/azure/src/services/__tests__/storage.etag.test.ts`:
  - First-time write succeeds (no `If-Match`; 404 → unconditional upload)
  - Subsequent write with current ETag succeeds
  - Concurrent write with stale ETag returns 412 → retry loop kicks in
  - 3 consecutive 412s → `{ ok: false, reason: 'concurrency-exhausted' }`
  - Mock `@azure/storage-blob`; deterministic backoff (0ms in tests via mocked `sleep`)

- [ ] **Task P4.4** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P5 — Paste flow refactor + 412 toast UX

- [ ] **Task P5.1** _(Sonnet)_ — Create `apps/azure/src/components/PasteConflictToast.tsx`:
  - Receives 412-conflict events from sync-queue subscription
  - Renders non-blocking toast: "Another teammate added new data. Refreshing..." + auto-dismisses on success
  - After `concurrency-exhausted` (3 retries failed), renders blocking modal: "Multiple teammates are updating this hub. Pausing your paste — please retry in a moment."
  - Uses semantic Tailwind classes per `feedback_green_400_light_contrast` patterns; no hardcoded palette

- [ ] **Task P5.2** _(Sonnet)_ — Refactor `apps/azure/src/features/data-flow/useEditorDataFlow.ts` per F3.5 D4 pattern (now applicable to Azure since asymmetry is closed):
  - Drop `evidenceSnapshots?` + `setRowProvenance?` props from hook signature
  - Replace inline `archiveReplacedRows` + `setRowProvenance` calls with single `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', hubId, snapshot, provenance, replacedSnapshotId? })`
  - Subscribe to `PasteConflictToast` event channel for 412 surfacing
  - Remove `archiveReplacedRows` import (handler handles cascade)
  - Verify all classifier branches (overlap-replace, append, columns-merge, wide-format, defect-detection, yamazumi-detection) preserve behavior

- [ ] **Task P5.3** _(Sonnet)_ — Tests for `PasteConflictToast`:
  - Renders nothing when no 412 events
  - Shows non-blocking toast on first 412 (auto-dismisses on success)
  - Escalates to blocking modal after `concurrency-exhausted`
  - Modal "Try again" button re-dispatches the paste

- [ ] **Task P5.4** _(Sonnet)_ — Update `useEditorDataFlow.test.ts` per F3.5 P3.2 pattern: mock dispatch, assert action shape per classifier branch, drop `setRowProvenance` callback assertions.

- [ ] **Task P5.5** _(Sonnet)_ — Sweep callers of `useEditorDataFlow` (likely `apps/azure/src/pages/Editor.tsx` + feature stores). Drop `evidenceSnapshots` + `setRowProvenance` from prop pass-throughs.

- [ ] **Task P5.6** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P6 — Read consumers + visual fidelity

- [ ] **Task P6.1** _(Sonnet)_ — Verify MatchSummaryCard pill rendering reads from `snapshot.provenance ?? []` directly. After F3.6, the pill survives reload (reads from cloud-synced envelope) and survives cross-device (cloud sync round-trips full envelope).

- [ ] **Task P6.2** _(Sonnet)_ — Manual `claude --chrome` walk in Azure per `feedback_verify_before_push`:
  - **Single-user fidelity:** Sign in, open existing project + hub. Paste 2 CSVs, join via shared key column. Verify MatchSummaryCard pill appears with provenance metadata. Reload tab → pill still present (provenance survived round-trip via Dexie + cloud).
  - **Cross-device fidelity:** Sign in on device B (or incognito session), open same hub. Verify pill is present without any local state (proves cloud-synced envelope carries provenance).
  - **Concurrent paste (412 path):** open hub in two browser tabs simulating two teammates. Paste in tab A → wait for sync. Paste in tab B (without refreshing). Tab B should show non-blocking toast "Another teammate added new data. Refreshing..." → both pastes land cleanly. Inspect Network tab to verify ETag conditional headers + 412 retry.
  - **Worst-case rapid-fire:** trigger 4+ rapid pastes. After 3 retries, blocking modal should appear with "Try again" CTA.

- [ ] **Task P6.3** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P7 — Final review + PR + close-out

- [ ] **Task P7.1** _([OPUS], final reviewer)_ — Final-branch code review of the entire F3.6-β surface. Verify:
  - Envelope facet shape per D1; `provenance` typed-FK consistent with F1+F2 P1.3
  - Local Dexie + cloud upload preserve provenance through round-trip (no silent strip in serialization)
  - ETag concurrency wired correctly: success path, 412 retry path, max-retry blocking case
  - 412 toast UX matches D5 (non-blocking → blocking modal escalation)
  - Azure paste flow drops F3.5 D3 asymmetry props; mirrors PWA pattern from F3.5 P3.1
  - F3.5 P2.4 `docs/investigations.md` entry marked `[RESOLVED]`
  - No new `Math.random` or `--no-verify` use
  - Tests deterministic; all builds green
  - `--chrome` walk signed off (single-user + cross-device + concurrent + rapid-fire)
  - No PII in App Insights logging from the conflict toast

- [ ] **Task P7.2** _(Sonnet)_ — Open PR (`Data-Flow Foundation F3.6-β — Azure rowProvenance parity (envelope + cloud-sync + ETag)`). Body lists D1-D5 + per-phase summary + research-validated rationale + watchlist items still pending. Run `bash scripts/pr-ready-check.sh`. Subagent code review pass. Address comments. Squash-merge.

- [ ] **Task P7.3** _(Sonnet)_ — Update `docs/decision-log.md` with 2026-05-XX entry documenting F3.6-β close-out. Mark F3.5 P2.4 `docs/investigations.md` deferral entry as `[RESOLVED]`.

- [ ] **Task P7.4** _(Sonnet)_ — Update F-series memory file `~/.claude/projects/.../memory/project_data_flow_foundation_fseries.md`:
  - Description: "F1+F2+F3+F3.5+F3.6 SHIPPED across 6 PRs (all 2026-05-XX)"
  - Detail block for F3.6-β + drop the asymmetry from watchlist
  - F-series sequence forward: F4 → F5 → F6 (F3.6 retired into delivered state)
  - Update ruflo entry parallel content

---

## Verification

### Per-phase gates

**P0 (audit):**

- [ ] All Azure snapshot-write call sites mapped
- [ ] SAS scope verified (no server-side change required, OR scope-extension scoped as P3.5 follow-up)
- [ ] Existing ETag handling documented (or absence noted)

**P1 (type extension):**

- [ ] `EvidenceSnapshot.provenance?: RowProvenanceTag[]` added; optional
- [ ] `pnpm --filter @variscout/core test` green; fixtures updated

**P2 (Azure handlers):**

- [ ] Envelope round-trip clean (in → put → get → equal with provenance preserved)
- [ ] `EVIDENCE_ARCHIVE_SNAPSHOT` cascade implicit via envelope (no separate provenance table)
- [ ] F3.5 P2.4 "no Azure rowProvenance table" comment removed from `applyAction.ts`

**P3 (cloud-sync envelope):**

- [ ] `saveEvidenceSnapshotToCloud` payload includes provenance
- [ ] sync-queue retry preserves envelope through replay

**P4 (ETag concurrency):**

- [ ] First-time write (404) succeeds without `If-Match`
- [ ] Subsequent write with current ETag succeeds
- [ ] 412 → retry succeeds within 3 attempts
- [ ] 412 × 3 → `concurrency-exhausted` typed result returned
- [ ] No silent overwrites (test with two simulated concurrent writers)

**P5 (paste flow + toast):**

- [ ] Hook signature drops `evidenceSnapshots?` + `setRowProvenance?` props
- [ ] All consumers swept; no caller passes those props
- [ ] Single dispatch replaces inline `archiveReplacedRows` + `setRowProvenance` blocks
- [ ] PasteConflictToast renders correctly across all states
- [ ] No hardcoded palette colors per project rules

**P6 (visual fidelity):**

- [ ] MatchSummaryCard pill survives reload (single-user)
- [ ] MatchSummaryCard pill survives cross-device (cloud round-trip)
- [ ] Concurrent paste resolves cleanly via toast retry
- [ ] Rapid-fire shows blocking modal correctly

### Holistic checks (post-P7)

- [ ] All packages tsc clean (or pre-existing errors only)
- [ ] `pr-ready-check.sh` green
- [ ] `docs/investigations.md` F3.5 P2.4 entry marked `[RESOLVED]`
- [ ] Memory file + ruflo entry reflect F3.6-β SHIPPED state
- [ ] F-series watchlist no longer includes Azure provenance asymmetry

---

## Risk register

- **SAS scope mismatch.** P0 audit may reveal `/api/storage-token` returns paths that don't cover the full snapshot write surface. Mitigation: P0 explicit verify; if mismatch, scope-out as P3.5 server-side task and coordinate with security review (changes to SAS endpoints can have customer-tenant implications).
- **Envelope blob size growth.** 10k-row paste with provenance ≈ 1.5MB; 100k-row ≈ 15MB. Block blob handles it but cold-start GET latency could degrade. Mitigation: P0 verifies the size distribution of current real snapshots (audit may reveal 99th percentile is small enough). If not: split-blob fallback as a future micro-slice (provenance siblings keyed by snapshotId), but only if measurable degradation.
- **ETag retry storm.** Many concurrent teammates pasting against the same hub could exhaust retries quickly. Mitigation: D5 caps at 3 retries + exponential backoff; blocking modal with "Try again" CTA is the intentional graceful-degradation surface. Multi-team-member rapid-fire is uncommon (humans paste seconds apart at most).
- **Local Dexie vs cloud divergence.** If local write succeeds but cloud upload fails (network blip), local has provenance but cloud doesn't. Mitigation: existing `syncQueue` retry mechanics handle this; F3.6 doesn't change retry logic, just envelope payload.
- **Branch staleness.** Standard `feedback_branch_staleness_guardrails` applies.
- **Subagent --no-verify hazard.** Per `feedback_subagent_no_verify`, every dispatch prompt explicitly forbids `--no-verify`.
- **Cross-package test runner flakiness** (e.g., `packages/hooks` timeout under concurrent load per existing memory note). Mitigation: per-package test runs in CI; flaky test does not block F3.6 specifically.

---

## Out of scope (carried forward)

- **PWA cloud-sync of provenance** — PWA tier is opt-in single-Hub-of-one IndexedDB only (Q8-revised); no cloud-sync at all in PWA. F3.6 is Azure-only.
- **Audit trail (who-edited-what journal, GxP / 21 CFR Part 11)** — explicitly parked per user decision; separate concern from row-source provenance.
- **Conflict resolution beyond LWW + ETag** — OT/CRDT for real-time co-edit is overkill for paste-time cadence. If real-time co-paste becomes a felt need, separate design exploration.
- **Future evidence-source-pull background ingestion** — plugs into `EVIDENCE_ADD_SNAPSHOT` when it lands; F3.6-β doesn't build the consumer.
- **F4 three-layer state codification** (Document / Annotation / View) — separate slice.
- **F5 — `SUSTAINMENT_*`/`HANDOFF_*` action kinds** — separate slice.
- **F6 (named-future) — multi-investigation lifecycle.**
- **`generateDeterministicId` → `generateEntityId` rename** (carry into F4 or F5).
- **`'general-unassigned'` placeholder runtime guard** (F4 or F5).

---

## References

- **Spec:** [`docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`](../specs/2026-05-06-data-flow-foundation-design.md) §5 + §7
- **Companion plans:**
  - F3.5 plan ([`docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion.md`](2026-05-06-data-flow-foundation-f3-5-ingestion.md)) — D2/D3 PWA atomic-write pattern + cursor reconciliation precedent
  - F1+F2 plan ([`docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2.md`](2026-05-06-data-flow-foundation-f1-f2.md)) — Audit pattern + per-task subagent flow precedent
- **Architectural foundations:**
  - ADR-077 (snapshot provenance + match-summary wedge) — `RowProvenanceTag` shape; F3.6 closes the F3.5 D3 asymmetry
  - ADR-058 (deployment lifecycle) — Azure paid-tier team-collaboration via Blob Storage; the basis for F3.6-β cloud-sync requirement
  - ADR-078 (PWA + Azure architecture alignment) — D2 tier-agnostic state shapes
- **Research-validated patterns (web search 2026-05-07):**
  - [Manage concurrency in Blob Storage — Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage)
  - [Azure Blob Storage ETag concurrency — Mark Heath](https://markheath.net/post/2026/2/9/azure-blob-storage-etag-concurrency)
  - [Managing concurrent uploads with blob versioning — Azure Storage docs](https://azure.github.io/Storage/docs/application-and-user-data/code-samples/concurrent-uploads-with-versioning/)
  - [OpenLineage column-level lineage docs](https://openlineage.io/docs/integrations/spark/spark_column_lineage/) — facet pattern precedent
  - [OpenLineage GitHub](https://github.com/OpenLineage/OpenLineage) — open standard for lineage metadata
  - [Data Lineage Best Practices: A Maturity Framework — Atlan](https://atlan.com/know/data-lineage-best-practices/)
  - [Provenance Metadata — EDI Repository](https://edirepository.org/resources/provenance-metadata)
  - [Design a file storage service like Google Drive — Educative](https://www.educative.io/blog/google-drive-system-design)
  - [Design a File Storage Service Like Dropbox — Hello Interview](https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox)
- **Workflow rules:**
  - `feedback_subagent_driven_default` — Sonnet workhorse + per-task spec/quality reviewers + final Opus
  - `feedback_no_backcompat_clean_architecture` — required props by default; atomic refactor
  - `feedback_one_worktree_per_agent` — F3.6 worktree at `.worktrees/data-flow-foundation-f3-6/`
  - `feedback_subagent_no_verify` — explicit prohibition in every dispatch prompt
  - `feedback_branch_staleness_guardrails` — fetch + drift check before each push
  - `feedback_ui_build_before_merge` — `pnpm --filter @variscout/ui build` in pre-merge gate
  - `feedback_verify_before_push` — `--chrome` walk per app per PR
- **Existing surfaces touched:**
  - `packages/core/src/evidenceSources.ts` (type extension)
  - `apps/azure/src/persistence/applyAction.ts` (handler extension)
  - `apps/azure/src/services/storage.ts` (envelope expansion + ETag wiring)
  - `apps/azure/src/services/cloudSync.ts` (sync-queue retry on concurrency-exhausted)
  - `apps/azure/src/features/data-flow/useEditorDataFlow.ts` (paste flow refactor)
  - `apps/azure/src/components/MatchSummaryCard.tsx` (verify path; pill read site)
  - `server.js` (`/api/storage-token` SAS scope; verify only — likely no change)
