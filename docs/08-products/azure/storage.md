---
title: 'Azure App Storage'
---

# Azure App Storage

Offline-first persistence with optional OneDrive cloud sync (Team plan).

---

## Overview

Storage behavior depends on the plan:

- **Standard plan (€99/month)**: Local-only storage via **IndexedDB** (Dexie.js). All projects are saved and loaded from the browser. No cloud sync.
- **Team plan (€199/month) / Team AI (€279/month)**: Two-tier storage — **IndexedDB** (local, instant) + **OneDrive** (cloud, async) via Microsoft Graph API. Every save writes to IndexedDB first, then syncs to OneDrive when online. Loads prefer the cloud version (fresher) and fall back to local when offline.

Both plans use IndexedDB as the primary persistence layer. The Team plan adds OneDrive sync on top.

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

> The cloud sync steps below apply to the **Team plan only**. Standard plan saves to IndexedDB and stops.

```
User clicks Save
       │
       ▼
saveToIndexedDB()          ← instant, always succeeds (both plans)
       │
       ├── Online? ──Yes──▶ saveToCloud() via Graph API PUT  (Team plan only)
       │                           │
       │                    ├── Success → markAsSynced() → status: 'synced'
       │                    └── Failure → addToSyncQueue() → status: 'offline'
       │
       └── Offline ──────▶ addToSyncQueue() → status: 'offline'  (Team plan only)
```

---

## Load Flow

> The cloud load steps below apply to the **Team plan only**. Standard plan loads from IndexedDB directly.

```
loadProject(name)
       │
       ├── Online? ──Yes──▶ loadFromCloud() via Graph API GET  (Team plan only)
       │                           │
       │                    ├── Found → cache to IndexedDB → return
       │                    └── Error → fall through to local
       │
       └── Fallback ──────▶ loadFromIndexedDB() → return  (both plans)
```

---

## Sync Triggers (Team Plan Only)

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

## Sync Status States (Team Plan Only)

| Status     | Meaning                                                           |
| ---------- | ----------------------------------------------------------------- |
| `saved`    | Written to IndexedDB (initial state)                              |
| `syncing`  | Cloud save or queue flush in progress                             |
| `synced`   | Cloud and local are in agreement                                  |
| `offline`  | Saved locally, pending cloud sync                                 |
| `conflict` | Local and cloud diverged — cloud version loaded (last-write-wins) |
| `error`    | Cloud operation failed (e.g. auth expired)                        |

---

## OneDrive File Structure (Team Plan Only)

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

| Data                 | Storage      | Synced to Cloud (Team) |
| -------------------- | ------------ | ---------------------- |
| Project data + state | IndexedDB    | Yes                    |
| Filter stack         | In project   | Yes                    |
| Regression state     | In project   | Yes                    |
| View state           | In project   | Yes                    |
| Chart titles         | In project   | Yes                    |
| Display options      | localStorage | No                     |
| Theme preference     | localStorage | No                     |
| Company accent       | localStorage | No                     |

> Standard plan stores all project data in IndexedDB only. The "Synced to Cloud" column applies to the Team plan.

---

## Queue Pruning (Team Plan Only)

Stale sync queue items (older than 30 days) are pruned on app mount via `pruneSyncQueue()`. This prevents unbounded queue growth if the user is offline for extended periods.

---

## See Also

- [OneDrive Sync](onedrive-sync.md) — Graph API calls, conflict resolution
- [Authentication (EasyAuth)](authentication.md) — Token acquisition
- [Project Persistence](../../03-features/data/storage.md) — AnalysisState format
- [PWA Session Model](../pwa/index.md#session-model) — PWA has no persistence (by design)
