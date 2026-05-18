---
title: 'F3.6-β architecture lock-in: provenance envelope facet + ETag optimistic concurrency'
purpose: decide
tier: card
status: active
date: 2026-05-07
topic: ['decisions', 'azure', 'adr', 'spec']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# F3.6-β architecture lock-in: provenance envelope facet + ETag optimistic concurrency

Locks two architectural decisions BEFORE F3.6-β implementation per Option A "architecture commit before plan" sequencing (web-search-validated 2026-05-07). (1) **ADR-077 Amendment 2026-05-07** — `RowProvenanceTag[]` is now an envelope facet on `EvidenceSnapshot` (`provenance?: RowProvenanceTag[]`), NOT a sibling table. Runtime sidecar `Map<rowKey, RowProvenanceTag>` from slice 3 retired. Tier-asymmetric persistence (PWA local-only Dexie; Azure local + cloud-sync via Blob Storage); tier-symmetric envelope shape per ADR-078 D2. Why envelope: Azure Blob Storage has no native multi-object atomic transactions ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage)); envelope is the only way to guarantee snapshot+provenance reach cloud atomically per paste. Industry precedent: OpenLineage facet pattern, METS metadata bundling, image-file headers. (2) **NEW ADR-079** ([`docs/07-decisions/adr-079-etag-optimistic-concurrency-paid-tier-hub-writes.md`](07-decisions/adr-079-etag-optimistic-concurrency-paid-tier-hub-writes.md)) — ETag optimistic concurrency for paid-tier hub-blob writes. `saveProcessHubToCloud` returns `{ ok: true; etag } \| { ok: false; reason: 'concurrency-exhausted' \| 'network' \| 'auth' }` typed union; `If-Match` header on every hub-blob write; 3-retry exponential backoff (100/200/400ms); `concurrency-exhausted` surfaces via `PasteConflictToast` as non-blocking toast → blocking modal. Snapshot-blob writes intentionally don't use ETag (unique path per snapshot id; no concurrency surface). LWW rejected (silent data loss); pessimistic locking rejected (round-trip latency + lease management complexity); CRDT/OT rejected (overkill for paste-time cadence). Spec amendment 2026-05-07 covers F3.6-β changes to §5 ingestion + §3 D7 (concurrency layer complementary to action log) + §7 `.vrs` (carries provenance automatically; no v1.1 bump) + §6 sequencing (F4 → F5 → F6 after F3.6-β). `apps/azure/CLAUDE.md` + `packages/core/CLAUDE.md` updated with the new invariants. **F3.6-β plan** at [`docs/superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity.md`](superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity.md) — single PR off `data-flow-foundation-f3-6` branch, 5 locked decisions D1-D5 (envelope shape, sync-queue integration, lazy read hydration, SAS scope, ETag concurrency), 8 phases P0-P7. Implementation deferred to a fresh session per user's "architecture-then-plan" sequencing. Source: research-validated web search 2026-05-07 (Microsoft Learn, OpenLineage, Atlan data lineage, file-storage LWW conventions). _Pinned 2026-05-07._
