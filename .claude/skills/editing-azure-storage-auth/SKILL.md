---
name: editing-azure-storage-auth
description: Use when editing apps/azure/ auth, storage, or cloud sync code. EasyAuth (no MSAL code), IndexedDB via Dexie schema, Blob Storage sync with SAS tokens, /api/storage-token endpoint, App Insights telemetry with strict no-PII rule, customer-owned data principle (ADR-059), Azure feature stores in features/*/.
---

# Editing Azure Storage and Auth

## When this skill applies

Use when editing any of the following in `apps/azure/`:

- Auth flow (`src/auth/easyAuth.ts`, `src/hooks/useAdminAccess.ts`)
- IndexedDB persistence (`src/db/schema.ts`, `src/services/localDb.ts`)
- Blob Storage sync (`src/services/cloudSync.ts`, `src/services/blobClient.ts`)
- Storage orchestrator (`src/services/storage.ts`)
- App Insights telemetry (`src/lib/appInsights.ts`)
- File picker (`src/components/FileBrowseButton.tsx`)
- Server endpoints (`server.js`: `/api/storage-token`, `/api/kb-upload`, `/api/kb-search`)

---

## EasyAuth flow

App Service Authentication (EasyAuth) handles all auth at the platform level. The client application contains **no MSAL code**.

Flow:

1. Unauthenticated request → App Service redirects to `/.auth/login/aad` → Entra ID login.
2. On success, App Service sets a session cookie and stores tokens in its token store.
3. Authenticated requests carry the cookie automatically; the platform injects `x-ms-client-principal` into every server request.
4. Client helpers in `src/auth/easyAuth.ts` fetch `/.auth/me` to get the current user identity and access token.

Key endpoints (built into every App Service — no application code required):

| Endpoint | Purpose |
|---|---|
| `/.auth/login/aad` | Redirect to Entra ID sign-in |
| `/.auth/logout` | Sign out, clear session |
| `/.auth/me` | Current user info + access tokens |
| `/.auth/refresh` | Refresh session token |

Client helper API (`src/auth/easyAuth.ts`):

- `getEasyAuthUser()` — returns `{ name, email, userId, roles }` from `/.auth/me`
- `getAccessToken()` — returns access token; calls `/.auth/refresh` proactively if token expires within 5 minutes
- `startPeriodicRefresh()` / `stopPeriodicRefresh()` — 45-minute background refresh to prevent session expiry during long sessions
- `login()` / `logout()` — redirect helpers
- On `localhost`: helper detects local dev and returns mock user; `getAccessToken()` throws `AuthError('local_dev')`

Server-side auth check (in `server.js`): presence of `x-ms-client-principal` header. The `LOCAL_DEV` bypass is blocked on deployed App Service via `WEBSITE_SITE_NAME` env var.

Required permissions — both tiers require **zero admin consent**:

- `User.Read` (delegated) — user profile
- `People.Read` (delegated, Team only) — people picker

Do not add Graph API scopes. All prior Graph API scopes (`Files.ReadWrite.All`, etc.) were removed in ADR-059.

---

## IndexedDB persistence (Azure Standard)

The Dexie database (`VaRiScoutAzure`) is defined in `apps/azure/src/db/schema.ts`.

Schema tables:

| Table | Key | Purpose |
|---|---|---|
| `projects` | `name` | Full project data + lightweight `meta` (ProjectMetadata) |
| `syncQueue` | `++id` | Offline queue for pending cloud sync |
| `syncState` | `name` | Cloud sync state: `cloudId`, `etag`, `lastSynced`, `baseStateJson` |
| `photoQueue` | `++id` | Offline queue for pending photo uploads |
| `channelDriveCache` | `channelId` | Cached channel drive info (Teams-era remnant, retained for schema compatibility) |

Current version: 3. Always add new tables as a new `version(N).stores({...})` block — never modify an existing version.

`ProjectRecord` shape:

```typescript
interface ProjectRecord {
  name: string;
  location: 'team' | 'personal';
  modified: Date;
  synced: boolean;
  data: unknown;        // opaque project JSON
  meta?: ProjectMetadata;
}
```

Service facade: `apps/azure/src/services/localDb.ts`

- `saveToIndexedDB(project, name, location, meta?)` — upsert via `db.projects.put()`
- `loadFromIndexedDB(name)` — fetch by name, return `data` field
- `listFromIndexedDB()` — return all records as `CloudProject[]`
- `markAsSynced(name, cloudId, etag, baseStateJson?)` — update `syncState` table
- `extractMetadataInputs(project, userId, existingLastViewedAt?)` — peek into opaque project to build `ProjectMetadata`

---

## Blob Storage sync (Azure Team)

Team plan only (`hasTeamFeatures()` guard in `storage.ts`). Data stays in the customer's own Azure tenant — VariScout's server never reads or stores the data.

SAS token flow:

```
Browser → POST /api/storage-token
  App Service validates EasyAuth session (x-ms-client-principal)
  App Service managed identity generates container-scoped SAS token
  Returns: { sasUrl, expiresOn }
Browser → Azure Blob Storage (direct PUT/GET using SAS URL)
```

SAS token properties:

- Scope: `variscout-projects` container only
- Permissions: read + write + list (no delete)
- Expiry: 1 hour
- Refresh: call `/api/storage-token` again when expired

Blob structure under `variscout-projects` container:

```
{projectId}/
  analysis.json        — full project data
  metadata.json        — name, owner, updated, phase
  knowledge-index.json — Foundry IQ knowledge index (Team + AI)
  photos/{findingId}/{photoId}.jpg
  documents/           — uploaded SOPs, specs, FMEAs
  investigation/       — findings/questions JSONL
_index.json            — project listing cache
```

`cloudSync.ts` wraps `blobClient.ts` operations:

- `saveToCloud(token, project, name, location)` — write `analysis.json` + `metadata.json`; fire-and-forget `_index.json` update
- `loadFromCloud(token, name, location)` — read via stored `cloudId` in `syncState`
- `listFromCloud(token, location)` — read from `_index.json`
- `getCloudModifiedDate(token, name, location)` — read `metadata.json` for conflict detection
- `CloudSyncUnavailableError` — thrown when `/api/storage-token` returns 503 (not configured); `storage.ts` degrades gracefully to local-only

Conflict resolution: ETag-based. `syncState.baseStateJson` stores the last-loaded cloud snapshot as three-way merge base. On save, if cloud has changed since last load, `merge.ts` performs structural merge; conflicting versions are saved with `(conflict copy)` suffix.

---

## Storage facade

`apps/azure/src/services/storage.ts` is a React Context (`StorageProvider`) that orchestrates `localDb.ts` and `cloudSync.ts`.

Save strategy (offline-first):

1. Always write to IndexedDB first (instant feedback).
2. Standard plan → done; no cloud sync.
3. Offline → add to `syncQueue`; sync on reconnect.
4. Online + Team → attempt `saveToCloud`; exponential backoff retry on failure (delays: 2s, 4s, 8s, 16s, 32s; max 5 retries).

Load strategy:

1. Standard plan → `loadFromIndexedDB` only.
2. Team + online → `loadFromCloud` (cache result in IndexedDB); fallback to local on error.

`useStorage()` hook exposes: `saveProject`, `loadProject`, `listProjects`, `syncStatus`, `notifications`, `dismissNotification`.

---

## App Insights telemetry

File: `apps/azure/src/lib/appInsights.ts`

Initialize once at startup after loading runtime config:

```typescript
await initAppInsights({ connectionString, plan });
```

Connection string comes from `/config` endpoint (env var `APPINSIGHTS_CONNECTION_STRING`). No-ops if empty (local dev, tests).

What is tracked:

- Page views (auto, via `enableAutoRouteTracking`)
- Core Web Vitals (CLS, LCP, FCP, TTFB) as custom metrics
- AI call traces: `AI.Call` events — feature name, model, duration ms, token counts, success flag
- AI summary: `AI.Summary` events — aggregate counts, success rate, p95 duration
- Exceptions via `trackException(error)`
- Deployment context tag: `deployment.plan` (standard/team)

What is **never** tracked:

- User identity fields (name, email, userId) — PII
- Raw data values or column names — customer-owned data
- Full error messages when they may contain user content (error type only)
- Query parameters or URL fragments that may contain data

Telemetry goes to the **customer's own** App Insights instance. Fixed-rate sampling at 80% to prevent quota exhaustion.

AI traces flush periodically (every 5 minutes) and on `beforeunload`. Use `teardownTelemetry()` in tests to prevent state leakage.

---

## File Picker

File: `apps/azure/src/components/FileBrowseButton.tsx`

SharePoint/OneDrive file picker was removed per ADR-059. `FileBrowseButton` now wraps a native `<input type="file">`.

Usage:

```tsx
<FileBrowseButton
  mode="files"
  filters={['.xlsx', '.csv']}
  onLocalFile={(file) => handleFile(file)}
  onPick={() => {}} // no-op; SharePoint picker removed
/>
```

The `FilePickerResult` interface and `onPick` prop are retained for API compatibility but the SharePoint flow is not implemented. Always use `onLocalFile` for actual file handling.

Do not re-introduce any SharePoint/OneDrive SDK calls. ADR-059 explicitly removed this dependency.

---

## Gotchas

**Rolling your own auth instead of EasyAuth.** Do not add MSAL, OAuth, or token exchange logic in client code. EasyAuth handles the full auth flow at the platform level. Adding client-side auth will conflict with the cookie-based session and break the auth flow.

**Logging identity fields to App Insights.** Never include `name`, `email`, `userId`, or similar fields in `trackEvent` / `trackException` calls. These are PII. Log structural metadata only: counts, types, durations, success/failure flags. The `trackAICall` function deliberately sends error *type* (`hasError`) rather than the full error message.

**Using a SAS token after expiry.** SAS tokens expire after 1 hour. Blob Storage operations will return 403. On expiry, call `POST /api/storage-token` to mint a fresh token. The `blobClient.ts` module handles token refresh internally — do not cache and reuse SAS URLs beyond a single session.

**Introducing server-side data processing.** `server.js` is a static file server plus thin token-minting proxy. It must not read, transform, or store project data. All analysis runs in the browser (ADR-059 browser-only principle). The KB upload endpoint streams files directly to Blob Storage without inspecting content.

**Writing MSAL client code.** There is no MSAL dependency in `apps/azure`. EasyAuth cookie flow is the only auth mechanism. If you need an access token for the Cognitive Services API, call `getAccessToken()` from `src/auth/easyAuth.ts` — it reads from `/.auth/me`, no MSAL required.

---

## Reference

- [ADR-059: Web-First Deployment Architecture](../../../docs/07-decisions/adr-059-web-first-deployment-architecture.md)
- [Authentication (EasyAuth)](../../../docs/08-products/azure/authentication.md)
- [Blob Storage Sync](../../../docs/08-products/azure/blob-storage-sync.md)
- Server endpoints: `apps/azure/server.js` (`/api/storage-token`, `/api/kb-upload`, `/api/kb-search`, `/api/kb-list`, `/api/kb-delete`, `/api/kb-download`)
- Dexie schema: `apps/azure/src/db/schema.ts`
- Services: `apps/azure/src/services/localDb.ts`, `cloudSync.ts`, `blobClient.ts`, `storage.ts`
- Auth helpers: `apps/azure/src/auth/easyAuth.ts`
- Telemetry: `apps/azure/src/lib/appInsights.ts`
