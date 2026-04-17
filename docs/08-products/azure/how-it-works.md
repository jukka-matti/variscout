---
title: 'How It Works'
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
   │     - Permissions: User.Read (Standard) or              │
   │       + Files.ReadWrite.All, Channel.ReadBasic.All (Team)│
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

### Team Plan — Local Files + Cloud Sync

Everything in Standard, plus OneDrive personal sync and SharePoint channel storage.

```
BROWSER                          USER'S ONEDRIVE / CHANNEL SHAREPOINT
(IndexedDB)                      (Graph API)
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

**Personal OneDrive** (personal tab or browser):

```
OneDrive/
└── VariScout/
    └── Projects/
        ├── analysis-001.vrs
        └── ...
```

**Channel SharePoint** (channel tab):

```
Channel Files/VariScout/
├── Projects/
│   └── Feb-Fill-Line.vrs       ← shared analysis
└── Photos/
    └── {analysisId}/{findingId}/
        └── photo-001.jpg       ← EXIF-stripped evidence
```

Storage location is automatic: channel tab → SharePoint, personal tab → OneDrive, browser → OneDrive.

### Offline Behavior

| State     | Standard                 | Team                          |
| --------- | ------------------------ | ----------------------------- |
| Online    | Save to IndexedDB + file | + sync to OneDrive/SharePoint |
| Offline   | Full local functionality | Full local functionality      |
| Reconnect | N/A                      | Flush queued changes to cloud |

---

## Teams Integration (Team Plan)

The Team plan adds Microsoft Teams as a collaboration layer. The same codebase detects its runtime context and adapts:

```
Teams SDK initialized?
├── Yes → Channel tab? → shared channel SharePoint storage
│       → Personal tab? → personal OneDrive
│       → SSO via On-Behalf-Of token exchange
└── No  → Browser mode → local files (File System Access API)
```

### Authentication: OBO Token Exchange

Teams SSO provides a client-side token that isn't directly usable for Graph API calls. An Azure Function (`token-exchange`) performs the On-Behalf-Of exchange:

```
Teams Client → SSO token → Azure Function (OBO) → Graph API token
                                    ↓
                           Fallback: EasyAuth redirect
```

The `graphToken.ts` module handles the chain: Teams SSO → OBO exchange → EasyAuth fallback. The Azure Function is deployed alongside the App Service via ARM template.

### Channel Storage

When running as a channel tab, analyses and photos are stored in the channel's SharePoint document library:

- `channelDrive.ts` resolves the drive via Graph API: `/teams/{teamId}/channels/{channelId}/filesFolder`
- Drive info is cached in IndexedDB to avoid repeated Graph calls
- `StorageLocation` type (`'personal' | 'team'`) routes to the correct storage

### Photo Pipeline

Photo evidence flows through a client-side pipeline:

1. Camera capture — Teams SDK `media.selectMedia()` inside Teams (native camera, `devicePermissions: ["media"]` for IT audit trail), HTML5 file input fallback outside Teams
2. EXIF/GPS metadata stripped (`exifStrip.ts` — byte-level removal, 23 verification tests) — both capture paths feed into the same pipeline
3. Upload to OneDrive or SharePoint (`photoUpload.ts`)
4. Thumbnail embedded in `.vrs` file for cross-user preview

### Deep Links and Sharing

- `deepLinks.ts` — builds and parses deep link URLs for specific charts or findings
- `useTeamsShare.ts` — wraps Teams SDK `sharing.shareWebContent` and `pages.shareDeepLink`
- `shareContent.ts` — builds share payloads for findings and charts

### User Identity

`getCurrentUser.ts` extracts user identity from the Teams JWT (UPN claim) with EasyAuth fallback. Author names appear on findings and comments for audit trails.

See [ADR-016](../../archive/adrs/adr-016-teams-integration.md) for the full technical design.

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
│  OneDrive/SharePoint   │               │  - User identities │
│  (Team plan sync)      │               │  - Usage telemetry │
│                        │               │                    │
└────────────────────────┘               └────────────────────┘
```

- **Publisher management is disabled** — we have zero access to the customer's deployment
- **No telemetry** — the app makes no outbound calls to publisher systems
- **Data survives cancellation** — analyses remain on the user's device (Standard) or in OneDrive/SharePoint (Team) even if the subscription ends
- **Each deployment is tenant-isolated** — no cross-tenant data access

### Least-Privilege Permissions

| Permission              | Type      | Plan      | Purpose                           |
| ----------------------- | --------- | --------- | --------------------------------- |
| `User.Read`             | Delegated | Both      | Display user name & email         |
| `Files.ReadWrite.All`   | Delegated | Team only | OneDrive + SharePoint file sync   |
| `Channel.ReadBasic.All` | Delegated | Team only | Resolve channel SharePoint drives |

**Standard plan**: Only `User.Read` — no admin consent required, users consent on first login.

**Team plan**: Requires one-time tenant admin consent for `Files.ReadWrite.All` and `Channel.ReadBasic.All`. No mail access, no `Sites.ReadWrite.All`.

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
