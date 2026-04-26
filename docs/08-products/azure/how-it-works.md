---
title: 'How It Works'
audience: [admin, architect]
category: reference
status: stable
---

# How It Works

End-to-end guide to VariScout's Azure architecture — what gets deployed, how users log in, where data lives, and why it's secure.

---

## What Gets Deployed

The ARM template deploys **3 resources** to the customer's Azure subscription:

```
CUSTOMER'S AZURE SUBSCRIPTION
└── Managed Resource Group
    ├── 1. App Service Plan (Linux B1)
    │      Compute host for the web app
    │
    ├── 2. App Service
    │      Serves the VariScout build via WEBSITE_RUN_FROM_PACKAGE
    │      (static zip — no server-side code)
    │
    └── 3. EasyAuth Configuration (authsettingsV2)
           Platform-level Azure AD authentication
           Token store for Graph API access
```

There is **no database, no backend API, no storage account**. The App Service serves a static build — all computation happens in the user's browser.

---

## Deployment Flow

```
CUSTOMER                   AZURE PORTAL                 ARM ENGINE
   │                            │                            │
   │  1. Create App Registration (Azure AD)                  │
   │     - Client ID + Client Secret                         │
   │     - Permissions: User.Read                            │
   │                            │                            │
   │  2. Find VariScout ───────▶│                            │
   │     on Marketplace         │                            │
   │                            │                            │
   │  3. Click "Create" ──────▶│                            │
   │     Enter app name,        │                            │
   │     region, Client ID,     │                            │
   │     Client Secret          │                            │
   │                            │── 4. Deploy ARM ──────────▶│
   │                            │      template              │
   │                            │                            │── Creates Plan
   │                            │                            │── Creates Site
   │                            │                            │── Configures EasyAuth
   │                            │◀── 5. Done (~2 min) ──────│
   │                            │                            │
   │◀── 6. App URL ────────────│                            │
   │    https://variscout-xyz.azurewebsites.net              │
```

### Pre-requisite: App Registration

Before deploying, the customer creates an App Registration in Azure AD. This is needed because Managed Applications cannot create registrations in the customer's tenant. The customer provides two values during deployment:

| Parameter      | Type         | Purpose                           |
| -------------- | ------------ | --------------------------------- |
| `clientId`     | string       | Identifies the app to Azure AD    |
| `clientSecret` | secureString | Authenticates the app to Azure AD |

The ARM template stores the secret as an app setting (`MICROSOFT_PROVIDER_AUTHENTICATION_SECRET`) — it never appears in logs or outputs.

---

## First Login

EasyAuth runs as middleware in the App Service platform. The app never sees unauthenticated requests.

```
USER                    APP SERVICE (EasyAuth)         AZURE AD
  │                              │                         │
  │── Visit app URL ────────────▶│                         │
  │                              │── Not authenticated ───▶│
  │                              │   Redirect to login     │
  │                              │                         │
  │◀────────── Azure AD sign-in page ─────────────────────▶│
  │            User enters credentials                     │
  │            Consents to permissions (plan-dependent)     │
  │                              │                         │
  │                              │◀── Session cookie ──────│
  │                              │   + tokens in store     │
  │◀── Serve app ────────────────│                         │
```

After login:

- A session cookie is set (platform-managed, not application code)
- Access tokens are stored server-side in the EasyAuth token store
- The app reads user info and tokens from `/.auth/me`
- Token refresh is handled automatically by the platform

### EasyAuth Endpoints

| Endpoint           | Purpose                               |
| ------------------ | ------------------------------------- |
| `/.auth/login/aad` | Redirect to Azure AD sign-in          |
| `/.auth/logout`    | Sign out and clear session            |
| `/.auth/me`        | Get current user info + access tokens |
| `/.auth/refresh`   | Refresh the session token             |

---

## Using the App

All data processing happens in the browser. Nothing is sent to a server.

```
CSV/EXCEL FILE          BROWSER                          SCREEN
      │                    │                                │
      │── Upload/paste ───▶│                                │
      │                    │── Parse (parser.ts) ──────────▶│
      │                    │   Detect columns, types        │
      │                    │                                │
      │                    │── Calculate stats ────────────▶│
      │                    │   (stats.ts: mean, Cpk, etc.)  │
      │                    │                                │
      │                    │── Render charts ──────────────▶│
      │                    │   (Visx: I-Chart, Boxplot,     │
      │                    │    Pareto, Capability)          │
      │                    │                                │
      │                    │── User drills down ───────────▶│
      │                    │   Filter → recalculate →       │
      │                    │   re-render                     │
```

The app supports:

- **CSV and Excel upload** — parsed entirely in-browser
- **Copy-paste** — paste from spreadsheets, auto-detected via `detectColumns()`, reviewed in ColumnMapping (same flow as PWA, with up to 6 factors)
- **Manual entry** — type values directly
- **Add data during analysis** — "Add Data" dropdown offers paste, upload, or manual entry. Auto-detects whether to append rows (same columns) or add columns (new columns). Replace confirmation when loading entirely new data.
- **Performance Mode** — analyze hundreds of measurement channels simultaneously

---

## Data Persistence

Save is explicit — the user clicks **Save** in the editor header. Unsaved work is lost if the browser tab closes. The storage model depends on the plan:

### Standard Plan — Local Files

Data stays on the user's device. No cloud sync, no OneDrive.

```
BROWSER                          USER'S COMPUTER
(IndexedDB)                      (File System Access API)
    │                                │
    │── User clicks Save ───────────▶│
    │   IndexedDB + local file       │
    │                                │
    │◀── User opens project ─────────│
    │   Load from IndexedDB/file     │
```

- Projects saved to IndexedDB with optional local file export via File System Access API
- No internet required after initial deployment
- Only `User.Read` permission needed

### Team Plan — Local Cache + Blob Sync

Everything in Standard, plus customer-tenant Blob Storage for shared Process Hubs, investigations, and artifacts.

```
BROWSER                          CUSTOMER AZURE BLOB STORAGE
(IndexedDB cache)                (shared team store)
    │                                │
    │◀── Load on startup ────────────│
    │    (if online)                 │
    │                                │
    │── User saves changes ─────────▶│
    │   (debounced write)            │
    │                                │
    │── Offline? ────────────────────│
    │   Queue changes locally        │
    │                                │
    │── Back online ────────────────▶│
    │   Flush queued changes         │
```

**Blob container**:

```
container/
├── projects/
│   └── Feb-Fill-Line.vrs       ← shared analysis
├── process-hubs/
│   └── index.json              ← shared hub catalog
└── artifacts/
    └── ...
```

Storage remains in the customer's Azure tenant. IndexedDB is the browser cache/resilience layer.

### Offline Behavior

| State     | Standard                 | Team                          |
| --------- | ------------------------ | ----------------------------- |
| Online    | Save to IndexedDB + file | + sync to Blob Storage        |
| Offline   | Full local functionality | Full local functionality      |
| Reconnect | N/A                      | Flush queued changes to cloud |

---

## Process Hub Collaboration (Team Plan)

The Team plan adds a shared Process Hub layer. The same browser app can be opened directly or as an optional Teams static tab, but storage and collaboration do not depend on the Teams SDK.

```
User opens VariScout
├── Browser / optional Teams tab
│   → EasyAuth session
│   → IndexedDB browser cache
│   → Blob Storage shared projects, hubs, artifacts
```

### Shared Storage

Team investigations, Process Hub catalog entries, metadata sidecars, and artifacts are stored in the customer's Blob Storage container. `StorageLocation` still distinguishes personal/team intent in the app, but the shared source is Blob Storage rather than OneDrive or SharePoint.

### Photo Pipeline

Photo evidence flows through a client-side pipeline:

1. Camera/file capture through browser inputs
2. EXIF/GPS metadata stripped (`exifStrip.ts` — byte-level removal, 23 verification tests) — both capture paths feed into the same pipeline
3. Upload as a Blob artifact when Team sync is enabled
4. Thumbnail embedded in `.vrs` file for cross-user preview

### Deep Links and Sharing

- `deepLinks.ts` — builds and parses deep link URLs for specific charts or findings
- `shareContent.ts` — builds share payloads for findings and charts

### User Identity

`getCurrentUser.ts` extracts user identity from EasyAuth. Author names appear on findings and comments for audit trails.

See [ADR-059](../../07-decisions/adr-059-web-first-deployment-architecture.md) and [ADR-072](../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md) for the current technical direction.

---

## Data Ownership & Security

### Data Stays with the Customer

```
CUSTOMER TENANT                          PUBLISHER (VariScout)
┌────────────────────────┐               ┌────────────────────┐
│                        │               │                    │
│  App Service           │               │  Marketplace       │
│  (hosts the app)       │  ──── NO ───▶ │  listing           │
│                        │  connection   │                    │
│  Azure AD              │               │  No access to:     │
│  (authenticates users) │               │  - Customer data   │
│                        │               │  - App resources   │
│  Azure Blob Storage    │               │  - User identities │
│  (Team plan sync)      │               │  - Usage telemetry │
│                        │               │                    │
└────────────────────────┘               └────────────────────┘
```

- **Publisher management is disabled** — we have zero access to the customer's deployment
- **No telemetry** — the app makes no outbound calls to publisher systems
- **Data survives cancellation** — analyses remain in the customer's browser storage (Standard) or Blob Storage (Team) even if the subscription ends
- **Each deployment is tenant-isolated** — no cross-tenant data access

### Least-Privilege Permissions

| Permission  | Type      | Plan | Purpose                   |
| ----------- | --------- | ---- | ------------------------- |
| `User.Read` | Delegated | Both | Display user name & email |

**All plans**: only `User.Read` for user sign-in/profile. Team collaboration uses customer-tenant Blob Storage and Azure RBAC rather than Microsoft Graph file scopes.

### Secret Handling

- The client secret is passed as ARM `secureString` — never logged or exposed in outputs
- Stored as an App Service app setting (server-side, inaccessible to client code)
- EasyAuth tokens are stored in the platform token store (not in browser storage)
- HTTPS enforced, minimum TLS 1.2, FTP disabled

---

## See Also

- [Azure App Overview](index.md) — product positioning and pricing
- [ARM Template](arm-template.md) — resource definitions and deployment methods
- [Authentication (EasyAuth)](authentication.md) — auth endpoints and client-side helper
- [OneDrive Sync](blob-storage-sync.md) — sync flow, conflict resolution, offline behavior
- [Marketplace Guide](marketplace.md) — publishing, certification, listing content
