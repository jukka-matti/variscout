---
title: 'ETag Concurrency'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: infrastructure
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# ETag Concurrency

## Problem

When two teammates edit the same project hub (or paste evidence into the same snapshot catalog) within the same minute, a naive last-write-wins Blob PUT silently overwrites the earlier write and the slower writer never learns their work was lost — a hard violation of the team-tier collaboration contract on a single €120 Azure tenant SKU.

## Capability claim

Per ADR-079 (F3.6-β), hub-domain blob writes use HTTP `If-Match` ETag optimistic concurrency control: the writer HEADs the blob, captures the current ETag, and PUTs with `If-Match: <etag>`; on `412 Precondition Failed` the call retries up to 3 times with exponential backoff (100ms/200ms/400ms). `saveProcessHubToCloud` and `updateBlobEvidenceSnapshotsConditional` return a typed `{ ok: true; etag } | { ok: false; reason: 'concurrency-exhausted' | 'network' | 'auth' }` result — the discriminated union is the compile-time guard against silent overwrites. Concurrency exhaustion surfaces to the user via `subscribePasteConflict` → `PasteConflictToast`; snapshot blobs at unique snapshot-id paths intentionally skip ETag because they have no concurrency surface.

## Intent diagram

No user-facing surface — infrastructure layer. See `docs/07-decisions/adr-079-etag-optimistic-concurrency-paid-tier-hub-writes.md` for the HEAD → PUT → 412-retry sequence and outcome state diagram.

## Acceptance signals

TBD — see related tests at `apps/azure/src/services/__tests__/blobClient.etag.test.ts` and `apps/azure/src/services/__tests__/cloudSync.etag.test.ts` for current verification of retry counts, backoff timing, and result-discriminator coverage.

## Out of scope / non-goals

TBD. Snapshot blobs (unique-path-per-snapshot) intentionally skip ETag; only catalog/index/hub blobs participate in conditional writes.

## Links

- **Code**: `apps/azure/src/services/blobClient.ts` (`updateBlobEvidenceSnapshotsConditional`, `saveProcessHubToCloud`), `apps/azure/src/services/cloudSync.ts`, `apps/azure/src/components/PasteConflictToast.tsx`
- **Tests**: `apps/azure/src/services/__tests__/blobClient.etag.test.ts`, `apps/azure/src/services/__tests__/cloudSync.etag.test.ts`
- **Related**: `docs/07-decisions/adr-079-etag-optimistic-concurrency-paid-tier-hub-writes.md`, `apps/azure/CLAUDE.md`
