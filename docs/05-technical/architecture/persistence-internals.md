---
tier: living
purpose: system
title: 'Persistence Internals — fingerprint + server boundary'
audience: both
status: active
date: 2026-06-02
last-verified: 2026-06-02
verified-against-commit: 851a9ba4
layer: L4
topic: [persistence, fingerprint, etag, server-boundary, access, wedge-v1]
related:
  - docs/03-features/data/save-and-load.md
  - docs/03-features/data/etag-concurrency.md
  - docs/03-features/data/cloud-sync.md
  - docs/03-features/data/acl.md
---

# Persistence Internals — fingerprint + server boundary

Dev-detail **below** the user contract in [save-and-load.md](../../03-features/data/save-and-load.md). For the _what_ (PWA export-only vs Azure durable, conflict copies, access model) read the contract; this note covers the _how_.

## Dirty-state fingerprint

`documentSnapshotFingerprint(snapshot)` (`packages/stores/src/documentSnapshot.ts`) returns `document-snapshot-v1:{hex}` — an **fnv1a64** hash over a **canonically-ordered** JSON projection of the `DocumentSnapshot`:

- object keys sorted alphabetically;
- `undefined` values excluded; `undefined` array items normalised to `null`.

Dirty state = this fingerprint over the current snapshot vs the saved baseline (not ad-hoc UI flags). Canonical ordering is what makes the hash stable across store-mutation order.

## Server storage boundary (R6e)

All Azure Blob list/read/write goes through **same-origin `/api/storage/*`** endpoints (`apps/azure/server.js`) — the browser never holds a container SAS:

- `requireStorageAuth` sets `req.user` from the EasyAuth `x-ms-client-principal` header → `401` if unauthenticated.
- `checkProjectAccess` / `checkHubAccess` call `hasAccessForPrincipal(metadata.access, principal)` **before** any blob op → `403` if not in `{ownerUserId} ∪ memberUserIds[]`.
- Endpoints: `GET/PUT /api/storage/projects/:projectId`, `GET /api/storage/projects` (filtered via `getAccessibleProjectEntries`), `…/api/storage/hubs/:hubId/*`.
- `getSasToken()` throws (R6e compatibility export only); the legacy `/api/storage-token` returns `410 Gone`. Production storage disables Shared Key; connection strings are local-dev/test only.

`DocumentAccess { ownerUserId, memberUserIds[], hubId, projectId }` is built by `extractDocumentAccess(project, userId)` from `improvementProject.metadata.members` (quick-analysis ⇒ `ownerUserId = memberUserIds = [creator]`).

## ETag conditional writes

Document writes send the prior `ETag` as `If-Match` (`apps/azure/src/services/blobClient.ts`); `412` → `{ ok: false, reason: 'precondition-failed' }` → caller saves a `(conflict copy)`. The evidence-snapshot catalog retries `If-Match` with exponential backoff **100/200/400 ms** (3 attempts), then emits a non-blocking paste-conflict event. Detail: [etag-concurrency.md](../../03-features/data/etag-concurrency.md).

## See also

- [save-and-load.md](../../03-features/data/save-and-load.md) — the user contract. · [cloud-sync.md](../../03-features/data/cloud-sync.md) — sync orchestration. · [acl.md](../../03-features/data/acl.md) — the role ACL.
