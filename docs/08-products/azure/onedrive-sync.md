# OneDrive Sync

Analysis synchronization with Microsoft OneDrive.

---

## Overview

The Azure app syncs analyses to OneDrive:

- Automatic sync when online
- Offline-first with local cache
- Conflict resolution
- Sharing via OneDrive

---

## Storage Structure

```
OneDrive/
└── VariScout/
    └── Projects/
        ├── analysis-001.vrs
        ├── analysis-002.vrs
        └── ...
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

The app uses raw `fetch()` with EasyAuth bearer tokens (no Graph SDK).

### List Analyses

```typescript
const token = await getAccessToken(); // from EasyAuth /.auth/me
const response = await fetch(
  `${GRAPH_BASE}/me/drive/root:/VariScout/Projects:/children?$filter=file ne null&$select=id,name,lastModifiedDateTime,lastModifiedBy,size`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Save Analysis

```typescript
const token = await getAccessToken();
await fetch(`${GRAPH_BASE}/me/drive/root:/VariScout/Projects/${name}.vrs:/content`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(project),
});
```

### Load Analysis

```typescript
const token = await getAccessToken();
const response = await fetch(
  `${GRAPH_BASE}/me/drive/root:/VariScout/Projects/${name}.vrs:/content`,
  { headers: { Authorization: `Bearer ${token}` } }
);
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
