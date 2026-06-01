---
title: 'Cloud Sync'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: infrastructure
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-06-01
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Cloud Sync

## Problem

A team running improvement projects across multiple devices needs project state (project metadata, process hubs, evidence sources, snapshots, sustainment records, control handoffs) durably backed up and visible to authorized teammates within the same Azure AD tenant — without standing up a separate VariScout-hosted backend that would break the customer-owned-data principle of ADR-059.

## Capability claim

The Azure app's cloud sync is part of the single €120 SKU (ADR-059 Phase 2) and writes per-tenant Azure Blob Storage through same-origin server APIs in `server.js`. `services/cloudSync.ts` wraps the storage client operations and exposes a stable surface to `services/storage.ts` (the orchestrator React context): `saveToCloud`, `loadFromCloud`, `listFromCloud`, plus per-domain hub / snapshot / sustainment / control-handoff writers. R6e hardens the storage boundary by enforcing the R6c document access model on the server before Blob list/read/write; the browser must not receive a broad container-scoped SAS for project data. Writes are queued via `addToSyncQueue` and retried on transient errors; sync status (`'saved' | 'offline' | 'syncing' | 'synced' | 'conflict' | 'error'`) is surfaced to the UI. Auth / forbidden / throttle / server / network failures are classified by `classifySyncError` with explicit `retryable` flags. ETag concurrency (see `etag-concurrency.md`) protects hub catalog writes and R6 document snapshot writes; data never leaves the customer tenant.

## Intent diagram

No user-facing surface — infrastructure layer. See `docs/08-products/azure/blob-storage-sync.md` for the orchestration sequence (local Dexie write → queue → same-origin storage API → managed-identity Blob write → status update) and `apps/azure/CLAUDE.md` for the R13 allow-listed persistence contract.

## Acceptance signals

TBD — see related tests at `apps/azure/src/services/__tests__/storage.test.ts` and `apps/azure/src/services/__tests__/blobClient.viewport.test.ts` for current verification of save/load round-trips and queue behavior.

## Out of scope / non-goals

TBD. PWA persistence (session-only React state) is out of scope; SharePoint / Graph file pickers were removed per ADR-059 and are not coming back.

## Links

- **Code**: `apps/azure/src/services/cloudSync.ts`, `apps/azure/src/services/blobClient.ts`, `apps/azure/src/services/storage.ts`, `apps/azure/src/db/schema.ts` (sync queue)
- **Tests**: `apps/azure/src/services/__tests__/storage.test.ts`, `apps/azure/src/services/__tests__/blobClient.viewport.test.ts`
- **Related**: `docs/07-decisions/adr-059-web-first-deployment-architecture.md`, `docs/08-products/azure/blob-storage-sync.md`, `apps/azure/CLAUDE.md`
