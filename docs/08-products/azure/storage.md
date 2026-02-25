# Azure App Storage

Offline-first persistence with OneDrive cloud sync.

---

## Overview

The Azure app uses a two-tier storage strategy:

1. **IndexedDB** (local, instant) — via Dexie.js
2. **OneDrive** (cloud, async) — via Microsoft Graph API

Every save writes to IndexedDB first, then syncs to OneDrive when online. Loads prefer the cloud version (fresher) and fall back to local when offline.

---

## IndexedDB Schema

Database name: `VaRiScoutAzure` (Dexie.js)

| Table       | Key    | Columns                                   | Purpose              |
| ----------- | ------ | ----------------------------------------- | -------------------- |
| `projects`  | `name` | `location`, `modified`, `synced`, `data`  | Local project cache  |
| `syncQueue` | `++id` | `name`, `location`, `project`, `queuedAt` | Offline change queue |
| `syncState` | `name` | `cloudId`, `lastSynced`, `etag`           | Cloud sync tracking  |

Source: `apps/azure/src/db/schema.ts`

---

## Save Flow

```
User clicks Save
       │
       ▼
saveToIndexedDB()          ← instant, always succeeds
       │
       ├── Online? ──Yes──▶ saveToCloud() via Graph API PUT
       │                           │
       │                    ├── Success → markAsSynced() → status: 'synced'
       │                    └── Failure → addToSyncQueue() → status: 'offline'
       │
       └── Offline ──────▶ addToSyncQueue() → status: 'offline'
```

---

## Load Flow

```
loadProject(name)
       │
       ├── Online? ──Yes──▶ loadFromCloud() via Graph API GET
       │                           │
       │                    ├── Found → cache to IndexedDB → return
       │                    └── Error → fall through to local
       │
       └── Fallback ──────▶ loadFromIndexedDB() → return
```

---

## Sync Triggers

Sync to OneDrive happens on:

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

| Status     | Meaning                                                           |
| ---------- | ----------------------------------------------------------------- |
| `saved`    | Written to IndexedDB (initial state)                              |
| `syncing`  | Cloud save or queue flush in progress                             |
| `synced`   | Cloud and local are in agreement                                  |
| `offline`  | Saved locally, pending cloud sync                                 |
| `conflict` | Local and cloud diverged — cloud version loaded (last-write-wins) |
| `error`    | Cloud operation failed (e.g. auth expired)                        |

---

## OneDrive File Structure

```
OneDrive/
└── VariScout/
    └── Projects/
        ├── analysis-001.vrs    (JSON, AnalysisState)
        ├── analysis-002.vrs
        └── ...
```

Files are `.vrs` extension, containing JSON-serialized `AnalysisState` (see `docs/03-features/data/storage.md`).

---

## What Is Preserved

| Data                 | Storage      | Synced to Cloud |
| -------------------- | ------------ | --------------- |
| Project data + state | IndexedDB    | Yes             |
| Filter stack         | In project   | Yes             |
| Regression state     | In project   | Yes             |
| View state           | In project   | Yes             |
| Chart titles         | In project   | Yes             |
| Display options      | localStorage | No              |
| Theme preference     | localStorage | No              |
| Company accent       | localStorage | No              |

---

## Queue Pruning

Stale sync queue items (older than 30 days) are pruned on app mount via `pruneSyncQueue()`. This prevents unbounded queue growth if the user is offline for extended periods.

---

## See Also

- [OneDrive Sync](onedrive-sync.md) — Graph API calls, conflict resolution
- [Authentication (EasyAuth)](authentication.md) — Token acquisition
- [Project Persistence](../../03-features/data/storage.md) — AnalysisState format
- [PWA Session Model](../pwa/storage.md) — PWA has no persistence (by design)
