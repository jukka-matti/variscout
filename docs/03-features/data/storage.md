---
tier: living
purpose: design
title: Project Persistence
audience: human
category: data
status: active
related: [indexeddb, blob-storage, browser-cache, document-snapshot]
layer: L3
kind: infrastructure
serves:
  - docs/02-journeys/ia-nav-model.md
last-reviewed: 2026-06-01
---

# Project Persistence

How VariScout saves and restores one hub-scoped working document: explicitly to the browser in PWA, and to IndexedDB plus customer-tenant Blob Storage in Azure.

## Problem

An analyst's document includes raw/project data, selected mappings and specs, Analyze findings/hypotheses/links/scopes, Canvas document state, and possibly one formal `ImprovementProject` for the hub. Losing that on a refresh is unacceptable for paid work, and sharing it across a team requires a portable serialization that matches the runtime store model.

## Capability claim

R6 made `DocumentSnapshot` the persistence boundary. PWA Save-to-Browser, `.vrs` export/import, Azure local cache, Azure sync queue payloads, and Azure cloud `analysis.json` all use snapshot documents. The app has not launched, so pre-R6 file compatibility was intentionally dropped in favor of a clean snapshot-only format.

## Intent diagram

This is **infrastructure** — no analyst-facing surface. The persistence engine sits beneath every workspace.

```
no surface — see L4 design doc
```

Rationale: the persistence engine has no UI of its own. It serializes and rehydrates state on behalf of every workspace; users experience it indirectly through save indicators, project lists, browser save, and `.vrs` export/import.

## Capability surfaces by product

| Product / path    | Persistence model                                         | File format                 |
| ----------------- | --------------------------------------------------------- | --------------------------- |
| PWA session       | In-memory stores by default                               | N/A                         |
| PWA browser save  | Explicit IndexedDB save of the current `DocumentSnapshot` | Browser-local JSON          |
| PWA export/import | User-selected portable document                           | `.vrs` snapshot envelope    |
| Azure App         | IndexedDB + Blob sync for access-aware documents          | `DocumentSnapshot` / `.vrs` |

The PWA is session-only by default and has no cloud sync. The Azure App persists full document state to IndexedDB and syncs allowed documents to customer-tenant Blob Storage.

## Privacy and access invariants

- **All data stays local or in the customer's tenant** — never sent to VariScout-operated storage.
- **No telemetry payloads** — usage telemetry must not include raw data or PII.
- **Blob sync** — Azure document sync targets customer-tenant Blob Storage only.
- **Access-aware Azure documents** — quick analyses are private to the creator/current user; formal Projects derive allowed users from their Lead/Member/Sponsor roster.
- **Clear = Gone locally** — clearing browser data deletes local cache; cloud recovery depends on the Azure storage copy and access policy.

## Acceptance signals

- A PWA browser save round-trips: save → reload → raw data, Analyze state, Canvas state, and Project state restored.
- A `.vrs` export contains a snapshot-only `variscout.document` envelope and imports through `hydrateDocumentSnapshot()`.
- An Azure local/cloud save stores a `DocumentSnapshot`, not a parallel project payload.
- Azure project lists hide documents from users who are neither owner nor Project roster members.
- Azure document conflicts use ETag/`If-Match` conflict handling instead of silent overwrite.

## Export / import

| Format | Contains                        | Use case                          |
| ------ | ------------------------------- | --------------------------------- |
| `.vrs` | Snapshot-only document envelope | Full document backup/share/import |
| `.csv` | Raw data only                   | Data portability                  |
| `.png` | Chart screenshot                | Reports                           |
| `.svg` | Chart vector export             | Print/presentations               |

## Out of scope

- PWA cloud sync.
- Sending data to VariScout-operated servers.
- Annotation/View state in portable documents unless a later decision changes the save contract.
- Per-field migration helpers before launch.

## Engineering detail

See [`05-technical/persistence-engine.md`](../../05-technical/persistence-engine.md) for the `DocumentSnapshot` boundary, save/load sequence, access/concurrency rules, and testing strategy.

## See Also

- [Blob Storage Sync](../../08-products/azure/blob-storage-sync.md) — Azure-specific sync mechanism
- [ADR-072: Process Hub Storage and CoScout Context](../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md) — Current storage/context stance
- [PWA Session Model](../../08-products/pwa/index.md#session-model) — PWA session/default persistence model
