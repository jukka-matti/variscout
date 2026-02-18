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
   │     - Permissions: User.Read, Files.ReadWrite           │
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
  │            Consents to User.Read + Files.ReadWrite      │
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
- **Copy-paste** — direct paste from spreadsheets
- **Manual entry** — type values directly
- **Performance Mode** — analyze hundreds of measurement channels simultaneously

---

## Data Persistence

Data is saved locally first, then synced to OneDrive when online.

```
BROWSER                          USER'S ONEDRIVE
(IndexedDB)                      (Graph API)
    │                                │
    │◀── Load on startup ────────────│
    │    (if online)                 │
    │                                │
    │── User saves changes ─────────▶│
    │   (debounced write)            │
    │                                │
    │◀── Periodic sync ──────────────│
    │   (every 30s if online)        │
    │                                │
    │── Offline? ────────────────────│
    │   Queue changes locally        │
    │                                │
    │── Back online ────────────────▶│
    │   Flush queued changes         │
```

### OneDrive Storage Structure

```
OneDrive/
└── VariScout/
    └── Projects/
        ├── analysis-001.vrs
        ├── analysis-002.vrs
        └── ...
```

### Offline Behavior

| State     | Behavior                                |
| --------- | --------------------------------------- |
| Online    | Auto-sync every 30s, immediate on save  |
| Offline   | Full functionality with local IndexedDB |
| Reconnect | Flush queued changes to OneDrive        |

The app uses the EasyAuth token store (`/.auth/me`) to get Graph API access tokens for OneDrive calls. Tokens are scoped to `Files.ReadWrite` — personal OneDrive only, no SharePoint access.

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
│  OneDrive              │               │  - User identities │
│  (stores analyses)     │               │  - Usage telemetry │
│                        │               │                    │
└────────────────────────┘               └────────────────────┘
```

- **Publisher management is disabled** — we have zero access to the customer's deployment
- **No telemetry** — the app makes no outbound calls to publisher systems
- **Data survives cancellation** — analyses remain in the user's OneDrive even if the subscription ends
- **Each deployment is tenant-isolated** — no cross-tenant data access

### Least-Privilege Permissions

| Permission        | Type      | Purpose                   |
| ----------------- | --------- | ------------------------- |
| `User.Read`       | Delegated | Display user name & email |
| `Files.ReadWrite` | Delegated | OneDrive analysis sync    |

No admin consent is required — users grant consent on first login. No `Sites.ReadWrite.All`, no SharePoint access, no mail access.

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
- [OneDrive Sync](onedrive-sync.md) — sync flow, conflict resolution, offline behavior
- [Marketplace Guide](marketplace.md) — publishing, certification, listing content
