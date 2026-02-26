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

The folder structure is auto-created on first use. When the app first lists
projects and the folder doesn't exist, it creates `/VariScout/Projects/`
automatically via the Graph API.

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
       │◀── Sync on reconnect ──────│
       │   (on `online` event)      │
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

## Folder Auto-Creation

On first use (before any project has been saved), the `/VariScout/Projects/` folder
does not exist in the user's OneDrive. The `listFromCloud()` function detects
the 404 response and automatically creates the folder structure:

1. `POST /me/drive/root/children` — creates `/VariScout/` (no-op if exists)
2. `POST /me/drive/root:/VariScout:/children` — creates `/Projects/` subfolder

This is idempotent (`conflictBehavior: "replace"`) and only runs once per user.
Subsequent list calls succeed normally.

Source: `ensureFolderExists()` in `apps/azure/src/services/storage.ts`

---

## Error Classification

All sync errors are classified by `classifySyncError()`:

| Category    | Examples                          | Retryable | Action                           |
| ----------- | --------------------------------- | --------- | -------------------------------- |
| `auth`      | 401, 403, AuthError               | No        | Stop retry, prompt re-auth       |
| `not_found` | 404 (folder/file missing)         | No        | Auto-create folder, return empty |
| `network`   | TypeError (fetch failed), offline | Yes       | Queue for retry                  |
| `throttle`  | 429 Too Many Requests             | Yes       | Retry with backoff               |
| `server`    | 500, 502, 503                     | Yes       | Retry with backoff               |
| `unknown`   | Unexpected errors                 | Yes       | Log, notify user                 |

Source: `classifySyncError()` in `apps/azure/src/services/storage.ts`

---

## Retry with Exponential Backoff

Failed retryable operations are retried with increasing delays:

- Delays: 2s → 4s → 8s → 16s → 32s (max 5 attempts)
- Auth errors stop retry immediately
- Timers cleaned up on component unmount
- On final failure: notification shown, item remains in sync queue

---

## Sync Notifications

Users receive real-time feedback via toast notifications (`SyncToastContainer`):

| Event              | Type    | Auto-dismiss | Action button |
| ------------------ | ------- | ------------ | ------------- |
| Cloud save success | success | 3s           | -             |
| Queued for offline | info    | 3s           | -             |
| Back-online sync   | success | 3s           | -             |
| Network error      | warning | 5s           | -             |
| Auth expired       | error   | No           | "Sign in"     |
| Retry succeeded    | success | 3s           | -             |

Notifications are accessible: `role="status"` + `aria-live="polite"`.

Source: `apps/azure/src/components/SyncToast.tsx`

---

## Conflict Detection

On `loadProject`, the system checks for divergence:

1. Read local record from IndexedDB (`synced` flag + `modified` date)
2. Fetch cloud `lastModifiedDateTime` via Graph API metadata
3. If local has unsynced changes AND cloud is newer:
   - Set status to `conflict`
   - Show warning toast
   - Load cloud version (last-write-wins)

The Editor toolbar shows amber status for conflicts, with clickable re-auth for auth errors.

---

## Offline Behavior

| State     | Behavior              |
| --------- | --------------------- |
| Online    | Sync on save          |
| Offline   | Work with local cache |
| Reconnect | Flush queued changes  |

---

## See Also

- [Authentication (EasyAuth)](authentication.md)
- [Offline-First Architecture](../../05-technical/architecture/offline-first.md)
