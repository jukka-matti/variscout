# OneDrive Sync

Project synchronization with Microsoft OneDrive.

---

## Overview

The Azure app syncs projects to OneDrive:

- Automatic sync when online
- Offline-first with local cache
- Conflict resolution
- Sharing via OneDrive

---

## Storage Structure

```
OneDrive/
└── Apps/
    └── VariScout/
        ├── projects/
        │   ├── project-001.json
        │   ├── project-002.json
        │   └── ...
        └── settings.json
```

---

## Sync Flow

```
LOCAL (IndexedDB)               ONEDRIVE
       │                            │
       │◀── Load on startup ────────│
       │    (if online)             │
       │                            │
       │── User makes changes ─────▶│
       │   (debounced save)         │
       │                            │
       │◀── Periodic sync ──────────│
       │   (every 30s if online)    │
       │                            │
       │── Offline mode ────────────│
       │   (queue changes)          │
       │                            │
       │── Back online ────────────▶│
       │   (flush queue)            │
```

---

## Graph API Calls

### List Projects

```typescript
const response = await graphClient
  .api('/me/drive/special/approot:/VariScout/projects:/children')
  .get();
```

### Save Project

```typescript
await graphClient
  .api(`/me/drive/special/approot:/VariScout/projects/${filename}:/content`)
  .put(JSON.stringify(project));
```

### Read Project

```typescript
const content = await graphClient
  .api(`/me/drive/special/approot:/VariScout/projects/${filename}:/content`)
  .get();
```

---

## Conflict Resolution

When both local and cloud versions exist:

1. Compare `lastModified` timestamps
2. If cloud is newer, merge or prompt user
3. If local is newer, push to cloud
4. Keep backup of overwritten version

---

## Offline Behavior

| State     | Behavior              |
| --------- | --------------------- |
| Online    | Auto-sync every 30s   |
| Offline   | Work with local cache |
| Reconnect | Flush queued changes  |

---

## See Also

- [Authentication (EasyAuth)](authentication.md)
- [Offline-First Architecture](../../05-technical/architecture/offline-first.md)
