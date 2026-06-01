---
tier: stable
purpose: orient
title: 'Azure App Storage'
audience: human
category: reference
status: active
layer: L5
---

# Azure App Storage

Browser persistence with customer-tenant Blob Storage sync (Azure App, single €120 SKU).

---

## Overview

The Azure App uses two-tier storage (single €120 SKU, no plan split):

- **IndexedDB** (Dexie.js): Local browser cache + resilience. Saved documents are `DocumentSnapshot` payloads plus listing, access, and sync metadata.
- **Azure Blob Storage**: Customer-tenant shared sync path. Every save writes to IndexedDB first, then syncs the snapshot document to Blob Storage when online. Loads prefer the cloud version when access allows and fall back to local when offline.

Both tiers are available to all Azure App users. Blob Storage is the shared team source for documents, Process Hubs, and artifacts, but saved document visibility is access-aware: quick analyses are private to the creator and formal Projects derive access from their Lead/Member/Sponsor roster.

---

## IndexedDB Schema

Database name: `VaRiScoutAzure` (Dexie.js)

| Table       | Key    | Columns                                             | Purpose                       |
| ----------- | ------ | --------------------------------------------------- | ----------------------------- |
| `projects`  | `name` | `location`, `modified`, `synced`, `data`, `access`  | Local document snapshot cache |
| `syncQueue` | `++id` | `name`, `location`, `project`, `access`, `queuedAt` | Offline document change queue |
| `syncState` | `name` | `cloudId`, `lastSynced`, `etag`                     | Cloud sync and ETag tracking  |

Source: `apps/azure/src/db/schema.ts`

---

## Save Flow

> The cloud sync steps below apply to the **Azure App**. The PWA has no browser document save/list/reload identity; PWA durability is explicit `.vrs` export/import only.

```
User clicks Save
       │
       ▼
buildDocumentSnapshot()
       │
       ▼
saveToIndexedDB()          ← instant local cache + access metadata
       │
       ├── Online? ──Yes──▶ saveToCloud() via Blob Storage + If-Match
       │                           │
       │                    ├── Success → markAsSynced() → status: 'synced'
       │                    ├── Conflict → conflict copy/path → status: 'conflict'
       │                    └── Failure → addToSyncQueue() → status: 'offline'
       │
       └── Offline ──────▶ addToSyncQueue() → status: 'offline'
```

Quick-analysis saves derive access from the signed-in creator/current user. Formal Project saves derive allowed users from `documentSnapshot.improvementProject.metadata.members`.

---

## Load Flow

> The cloud load steps below apply to the **Azure App** (Blob Storage sync).

```
loadProject(name)
       │
       ├── Access allowed? ──No──▶ not listed / not loadable
       │
       ├── Online? ──Yes──▶ loadFromCloud() via Blob Storage  (Azure App)
       │                           │
       │                    ├── Found → cache to IndexedDB → return
       │                    └── Error → fall through to local
       │
       └── Fallback ──────▶ loadFromIndexedDB() → return  (all users)
```

---

## Sync Triggers

Sync to Blob Storage happens on:

| Trigger        | Behavior                                                |
| -------------- | ------------------------------------------------------- |
| User save      | Immediate cloud save (if online)                        |
| `online` event | Flush entire sync queue                                 |
| App mount      | Prune stale queue items (>30 days), then sync if online |

There is **no periodic polling** — sync is event-driven only.

---

## StorageProvider (Singleton Context)

All storage operations are centralized in a single `StorageProvider` React context mounted in `App.tsx`. This replaced the previous pattern where multiple `useStorage()` hook instances created independent sync loops.

```
App.tsx
  └── StorageProvider          ← single instance
        ├── syncStatus         ← shared sync state
        ├── notifications[]    ← toast queue
        ├── retryQueue         ← exponential backoff
        ├── saveProject()      ← IndexedDB + cloud
        ├── loadProject()      ← cloud-first + conflict detection
        └── listProjects()     ← merged local + cloud
```

All consumers access via `useStorage()` hook and receive the same sync state, notification queue, and retry management.

Source: `apps/azure/src/services/storage.ts`

---

## Sync Status States

| Status     | Meaning                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| `saved`    | Written to IndexedDB (initial state)                                        |
| `syncing`  | Cloud save or queue flush in progress                                       |
| `synced`   | Cloud and local are in agreement                                            |
| `offline`  | Saved locally, pending cloud sync                                           |
| `conflict` | Local and cloud diverged under ETag/`If-Match`; conflict copy/path required |
| `error`    | Cloud operation failed (e.g. auth expired)                                  |

---

## Blob Storage Structure

```
container/
├── projects/
│   └── analysis-001/
│   │   ├── analysis.json   (JSON, DocumentSnapshot)
│   │   └── metadata.json   (listing, access, timestamps, sync metadata)
├── process-hubs/
│   └── index.json
└── artifacts/
    └── ...
```

Cloud project documents store the R6 `DocumentSnapshot` payload. User-downloaded `.vrs` exports use the same snapshot model inside a portable document envelope.

---

## What Is Preserved

| Data                                       | Storage                 | Synced to Cloud |
| ------------------------------------------ | ----------------------- | --------------- |
| Project config/data                        | DocumentSnapshot        | Yes             |
| Analyze findings/hypotheses/links/scopes   | DocumentSnapshot        | Yes             |
| Canvas document state                      | DocumentSnapshot        | Yes             |
| Hub-scoped live `ImprovementProject`       | DocumentSnapshot        | Yes             |
| Document access metadata                   | IndexedDB/Blob metadata | Yes             |
| ETag sync state                            | IndexedDB sync state    | No              |
| Theme preference and device-local settings | localStorage            | No              |

> All Azure App users have Blob Storage capability, but saved documents are only visible/loadable to their allowed users.

---

## Queue Pruning

Stale sync queue items (older than 30 days) are pruned on app mount via `pruneSyncQueue()`. This prevents unbounded queue growth if the user is offline for extended periods.

---

## Process Hub Metadata

Process Hub cadence views use deterministic metadata built from saved investigations:

- process description, process map summary, and customer requirement/CTS context
- investigation depth/status, current understanding, problem condition, and next move
- Survey readiness summary and review signals
- finding, question, action, verification, and sustainment counts

Existing IndexedDB records are backfilled on project listing so older saved analyses can enter Process Hub readiness queues without manual migration.

---

## See Also

- [Blob Storage Sync](blob-storage-sync.md) — container structure, conflict handling, shared storage
- [Authentication (EasyAuth)](authentication.md) — Token acquisition
- [Project Persistence](../../03-features/data/storage.md) — Document persistence capability
- [PWA Session Model](../pwa/index.md#session-model) — PWA is session-only by default with explicit local save/export
