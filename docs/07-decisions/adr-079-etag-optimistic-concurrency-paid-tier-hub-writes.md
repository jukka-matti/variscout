---
title: 'ADR-079: ETag optimistic concurrency for paid-tier hub-blob writes'
audience: [product, designer, engineer]
category: architecture
status: accepted
date: 2026-05-07
related:
  - adr-058-deployment-lifecycle
  - adr-077-snapshot-provenance-and-match-summary-wedge
  - adr-078-pwa-azure-architecture-alignment
  - decision-log
---

# ADR-079: ETag optimistic concurrency for paid-tier hub-blob writes

**Status**: Accepted

## Context

Paid-tier (Azure app, ADR-058) supports team collaboration on a shared hub via Blob Storage sync. Multiple teammates can paste new data into the same hub concurrently; their edits must compose, not silently overwrite each other.

The hub blob (`saveProcessHubToCloud`) carries hub-level state — among other fields, the active-snapshots list. Two scenarios:

- **Per-snapshot blobs:** safe by construction. Each paste creates a unique snapshot id (`generateDeterministicId()` UUID v4); two teammates produce different ids; their snapshot blobs land at different paths and don't collide.
- **Hub blob (active-snapshots list reference):** at risk. Both teammates read the same active list, append their new snapshot id locally, then upload. Whichever write lands second silently overwrites the first, dropping a teammate's paste from the canonical list.

PWA tier (free, opt-in single-Hub-of-one IndexedDB) is single-user; no concurrency surface. This ADR is **paid-tier-specific**.

The free-tier (PWA) and the paid-tier (Azure) thus differ in a way that ADR-078 D2 ("state shapes tier-agnostic; persistence implementation is the only tier gate") explicitly anticipates: same state shapes, different persistence-layer concerns at the implementation tier.

## Decision

**Use ETag optimistic concurrency on every paid-tier hub-blob write.** The pattern:

1. Read the current hub blob and capture its **ETag** from the response header.
2. Compose the local update (append snapshot id, mark replaced ones `deletedAt`, etc.).
3. Upload with `If-Match: <captured-ETag>` HTTP conditional header.
4. **200/201 success** → write committed; new ETag returned and stored locally for next round-trip.
5. **412 Precondition Failed** → another writer landed in between; retry the read-merge-write loop with the new ETag (up to 3 attempts × exponential backoff: 100ms, 200ms, 400ms).
6. **After 3 failed retries** → return typed `{ ok: false, reason: 'concurrency-exhausted' }`; UI surfaces a blocking modal.

### Typed result

```ts
type SaveResult =
  | { ok: true; etag: string }
  | { ok: false; reason: 'concurrency-exhausted' | 'network' | 'auth' };
```

Callers MUST handle the result; never `await` and assume success. The `concurrency-exhausted` branch wires into the `PasteConflictToast` event channel.

### UX surface

**Non-blocking toast** on first 412 (auto-retried successfully): "Another teammate added new data. Refreshing..." → auto-dismisses on success. The user sees the friction acknowledged but isn't asked to take action.

**Blocking modal** after 3 retries fail (`concurrency-exhausted`): "Multiple teammates are updating this hub. Pausing your paste — try again in a moment." With a "Try again" CTA that re-dispatches.

## Why optimistic concurrency, not pessimistic locking or last-write-wins

**Last-write-wins (silent):** rejected. Causes silent data loss when teammates race; user sees their paste vanish without explanation. File-storage services (Dropbox, Google Drive, OneDrive) tolerate LWW because their primary unit is a file with explicit-merge UX; our primary unit is the hub blob, where silent overwrites violate the implicit "team can collaborate on this hub" contract.

**Pessimistic locking** (Azure Blob Lease API): rejected. Adds round-trip latency to every paste even in the no-conflict case (which is the common case). Lease management adds operational complexity (lease renewal, lease loss recovery, deadlock from abandoned leases). ETag is the standard Azure idiom for this scale; pessimistic locking is overkill until contention is measurable.

**Operational Transform / CRDT:** rejected as overkill. Real-time co-editing semantics aren't needed for paste-time cadence (humans paste seconds apart at most). When ingestion shifts from per-paste to streaming (future), revisit.

## Implementation pattern

```ts
// apps/azure/src/services/storage.ts
import { BlockBlobClient, RestError } from '@azure/storage-blob';

const MAX_RETRIES = 3;
const BACKOFF_MS = 100;

export async function saveProcessHubToCloud(sasUrl: string, hub: ProcessHub): Promise<SaveResult> {
  const blobClient = new BlockBlobClient(sasUrl);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let currentEtag: string | undefined;
    try {
      const props = await blobClient.getProperties();
      currentEtag = props.etag;
    } catch (err) {
      if ((err as RestError)?.statusCode !== 404) {
        return { ok: false, reason: classifyError(err) };
      }
      // 404 = blob doesn't exist yet (first paste); proceed unconditional
    }

    const body = JSON.stringify(hub);
    try {
      const resp = await blobClient.uploadData(Buffer.from(body), {
        conditions: currentEtag ? { ifMatch: currentEtag } : undefined,
        blobHTTPHeaders: { blobContentType: 'application/json' },
      });
      return { ok: true, etag: resp.etag ?? '' };
    } catch (err) {
      if ((err as RestError)?.statusCode === 412) {
        await sleep(BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }
      return { ok: false, reason: classifyError(err) };
    }
  }
  return { ok: false, reason: 'concurrency-exhausted' };
}
```

## Scope of application

**Hub-blob writes** (`saveProcessHubToCloud`): MUST use ETag optimistic concurrency. The list of active snapshots, outcome specs, investigation pointers, and the canonical map shape all live on this blob; concurrent edits are real and must compose.

**Snapshot-blob writes** (`saveEvidenceSnapshotToCloud`): SHOULD NOT use ETag — each snapshot blob is at a unique path keyed by snapshot id; no concurrency surface. Adding ETag here is overhead without benefit.

**Project-overlay writes** (`db.projects` cloud-sync via `cloudSync.ts`): out of scope for this ADR (different surface; per-user project metadata, not collaborative hub state). Revisit if the project-overlay becomes a multi-team surface.

**Sync-queue retry** (`cloudSync.ts`): integrates with this ADR via the typed `SaveResult`. On `concurrency-exhausted`, the queue requeues with exponential backoff and surfaces to UI via the existing event channel.

## Constraints

- **No PII in retry-event telemetry** (App Insights logging) per `apps/azure/CLAUDE.md`. Conflict events log structural fact only ("412 retry attempt N for hub X"), never the hub contents.
- **No silent overwrites** in any code path that writes to the hub blob. Adding a new write call without ETag handling is a bug; the typed result enforces this at the type level (consumers must explicitly handle both ok/not-ok branches).
- **First-paste case** (404 → unconditional upload) is the documented exception; subsequent writes always carry `If-Match`.

## Why now (vs deferring)

F3.6-β introduces multi-team-member fidelity for paste flows (provenance envelope cloud-sync). The same write path that newly carries provenance is the path where teammates contend. Deferring concurrency would mean shipping F3.6-β with known silent-data-loss risk for the use case it was built to enable.

## Consequences

**Positive:**

- Concurrent paste edits compose cleanly without user-visible drops
- Standard Azure idiom; well-supported by the SDK
- Typed result forces callers to consider conflict at compile time
- UI degrades gracefully (toast → blocking modal) at retry exhaustion

**Negative / costs:**

- One extra round-trip (`getProperties`) per write to capture the ETag. Acceptable; paste cadence is human-driven (seconds), not high-frequency.
- Blocking modal on rapid-fire concurrent writes (3 retries × ~100-400ms backoff = ~700ms total before blocking). Edge case but user-visible.
- Adds typed handling burden to every caller of `saveProcessHubToCloud`. Mitigation: typed `SaveResult` makes ignoring the result a type error.

**Future considerations:**

- If contention becomes measurable (>1% of writes hit 412), consider blob versioning + automated merge for specific conflict shapes (e.g., two teammates added different snapshots → union the lists). Out of scope for this ADR.
- If real-time collaboration semantics become a felt need, revisit OT/CRDT. Anchored future-decision; not committed.

## Sources

- [Manage concurrency in Blob Storage — Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage)
- [Protecting Against Concurrent Updates in Azure Blob Storage with ETags — Mark Heath](https://markheath.net/post/2026/2/9/azure-blob-storage-etag-concurrency)
- [Managing concurrent uploads in Azure blob storage with blob versioning — Azure Storage](https://azure.github.io/Storage/docs/application-and-user-data/code-samples/concurrent-uploads-with-versioning/)

## Supersedes / superseded by

- Supersedes: implicit "last-write-wins for hub blob" behavior (never explicitly committed; always a known correctness gap once team-collaboration shipped).
- Superseded by: none (active).
- Related: ADR-058 (paid-tier deployment + Blob Storage sync surface), ADR-077 amendment 2026-05-07 (envelope facet provenance — the provenance fields carried by the hub-write surface), ADR-078 D2 (tier-agnostic state shapes, tier-specific persistence — this ADR sits at the persistence-implementation layer).
