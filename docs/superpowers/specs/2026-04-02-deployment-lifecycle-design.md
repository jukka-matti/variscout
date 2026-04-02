---
title: Deployment Lifecycle & Self-Service Update System
audience: [developer, architect]
category: architecture
status: draft
related: [deployment, ci-cd, azure-marketplace, managed-application, update-mechanism]
---

# Deployment Lifecycle & Self-Service Update System

## Context

VariScout is deployed into each customer's own Azure subscription via Azure Marketplace as a Managed Application (not SaaS). The current CI/CD pipeline has two problems:

1. **Staging slot doesn't exist** — the Bicep template provisions B1 (Basic) tier, but the GitHub Actions workflow tries to deploy to a staging slot (requires S1 Standard)
2. **No release pipeline** — there's no mechanism to get a tested build from your staging environment to the blob storage URL that customer deployments reference

Additionally, the customer update story is undefined. Manufacturing customers range from SMEs without IT departments to enterprises with formal Change Advisory Boards. The update mechanism must serve both.

### Key Constraint: Customer-Initiated Updates

Manufacturing companies have formal change control processes. Software updates can trigger revalidation in regulated environments (ISO 9001, IATF 16949). Auto-updates are inappropriate — the customer must control when updates are applied.

### Key Constraint: No IT Required

Many SME manufacturing customers don't have IT departments. The quality manager who bought VariScout through Azure Marketplace needs a "click to update" experience inside the app itself.

## Decision

Design a three-part system:

1. **Release pipeline** — tag-triggered GitHub Action that publishes versioned ZIPs to Azure Blob Storage
2. **Customer infrastructure** — upgrade to S1 with staging slot + Update Handler Function for zero-downtime self-service updates
3. **In-app update experience** — version check on startup, banner notification, one-click update

**ADR:** [ADR-058](../../07-decisions/adr-058-deployment-lifecycle.md)

### What This Does NOT Cover

- PWA updates (always latest, served from your URL)
- ISO 27001 / SOC 2 certification (separate strategic initiative)
- Auto-update mode (future enhancement, `"prompt"` mode only for v1)
- Publisher-managed push updates (future Approach C when customer count justifies it)
- Release notes page content/design (use existing docs site)

---

## 1. Release Pipeline (Your Side)

### Workflow: `release.yml`

**Trigger:** Git tag matching `v*` (e.g., `git tag v1.3.0 && git push --tags`)

**Steps:**

1. Checkout + pnpm install (frozen lockfile)
2. Security audit (`pnpm audit --audit-level=high`)
3. Run all tests (`pnpm test`)
4. Build Azure app (`pnpm --filter @variscout/azure-app build`)
5. Generate SBOM (CycloneDX)
6. Assemble ZIP: `dist/` + `server.js` + minimal `package.json`
7. Compute SHA-256 checksum of ZIP
8. Generate release notes from commits since last tag
9. OIDC login to Azure (Storage Blob Data Contributor role on release storage account)
10. Upload ZIP to `releases/v{version}/variscout-azure.zip`
11. Generate read-only SAS token (2-year expiry) for the ZIP
12. Update `releases/manifest.json` with version, SAS URL, checksum, date, release notes URL, security flag
13. Create GitHub Release with ZIP asset + release notes

### Manifest Format: `releases/manifest.json`

```json
{
  "latest": "1.3.0",
  "released": "2026-04-15T10:00:00Z",
  "url": "https://variscoutrelease.blob.core.windows.net/releases/v1.3.0/variscout-azure.zip?sp=r&st=2026-04-15&se=2028-04-15&sv=2022-11-02&sig=...",
  "checksum": "sha256:a1b2c3d4e5f6...",
  "releaseNotesUrl": "https://variscout.fi/changelog/v1.3.0",
  "minVersion": "1.1.0",
  "security": false
}
```

- `manifest.json` is public read (anonymous blob access) — metadata only, no secrets
- ZIPs are private, accessed via SAS token embedded in the manifest
- SAS tokens are read-only, long-lived (2 years), regenerated with each release
- `minVersion` allows enforcing minimum version in the future (not enforced in v1)
- `security: true` triggers prominent amber banner in the app

### Blob Storage Layout

```
variscoutrelease.blob.core.windows.net/
└── releases/
    ├── manifest.json
    ├── v1.2.0/
    │   └── variscout-azure.zip
    ├── v1.3.0/
    │   └── variscout-azure.zip
    └── v1.3.1/
        └── variscout-azure.zip
```

**Retention:** Keep last 10 versions via lifecycle management policy. Cost: ~EUR 1/month.

### Staging Workflow: `deploy-staging.yml` (Simplified)

**Change from current:** Remove slot-swap, direct deploy to B1 App Service.

- Trigger: Push to `main` (same path filters as today)
- Steps: Install → Test → Build → ZIP → OIDC login → `azure/webapps-deploy` (no `slot-name`) → Health check
- Your staging stays on B1 (~EUR 12/month) — brief downtime on deploy is acceptable for dev/test

### Production Workflow: Delete

`deploy-azure-production.yml` is deleted. Your staging doesn't use slots. Customer environments handle their own updates. The `release.yml` workflow is the new production gate — tagging = releasing.

### Daily Workflow

```
develop on main → push → staging auto-deploys (your test environment)
  ↓ verified?
git tag v1.3.0 → push tag → release workflow publishes to blob storage
  ↓ customers see
"Update available" banner → click → zero-downtime update
```

---

## 2. Customer Infrastructure (Bicep Changes)

### App Service Plan: B1 → S1

The App Service Plan SKU changes from B1 (Basic) to S1 (Standard):

- Enables deployment slots (required for zero-downtime updates)
- Cost delta: ~EUR 50/month, justified at EUR 79-199/month price points
- Customers expect production-grade infrastructure at this pricing

**File:** `infra/modules/app-service.bicep`

```bicep
sku: {
  name: 'S1'
  tier: 'Standard'
}
```

### Staging Deployment Slot

New resource in `app-service.bicep`:

```bicep
resource stagingSlot 'Microsoft.Web/sites/slots@2023-12-01' = {
  parent: webApp
  name: 'staging'
  location: location
  properties: {
    siteConfig: webApp.properties.siteConfig
  }
}
```

Same configuration as production slot. Used exclusively by the Update Handler — customers never interact with it directly.

### Version Tracking

New app setting on the App Service:

```bicep
{ name: 'VARISCOUT_VERSION', value: '1.0.0' }
```

Set at initial deployment. Updated by the Update Handler after each successful update.

### Update Handler RBAC

The Function App's Managed Identity gets `Website Contributor` role scoped to the App Service resource (not the whole resource group):

```bicep
resource updateRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(functionApp.id, webApp.id, websiteContributorRoleId)
  scope: webApp
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      'de139f84-1756-47ae-9be6-808fbbe84772' // Website Contributor
    )
  }
}
```

### ARM Template Re-certification

Because the Bicep changes affect the ARM template (SKU change, new slot resource, new RBAC), this requires Azure Marketplace re-certification (~3-5 business days). Existing customer deployments are unaffected — they keep their current infrastructure until they redeploy.

---

## 3. Update Handler Function

Two new endpoints on the existing Function App.

### `GET /api/version`

Called by the app on startup. Merges local version info with remote manifest.

**Flow:**

1. Read `VARISCOUT_VERSION` from environment (current installed version)
2. Read `VARISCOUT_AUTO_UPDATE` from environment (default: `"prompt"`)
3. Fetch `manifest.json` from blob storage (cached 5 minutes)
4. Compare versions, return combined response

**Response:**

```json
{
  "current": "1.2.0",
  "latest": "1.3.0",
  "updateAvailable": true,
  "security": false,
  "releaseNotesUrl": "https://variscout.fi/changelog/v1.3.0",
  "autoUpdate": "prompt"
}
```

### `POST /api/update`

Called when the user clicks "Update now". Orchestrates the zero-downtime update.

**Request:**

```json
{
  "targetVersion": "1.3.0"
}
```

**Flow:**

1. Validate request: authenticated user (EasyAuth session required), valid target version
2. Fetch `manifest.json`, verify `targetVersion` matches or is valid
3. Fetch ZIP from manifest URL (SAS-authenticated)
4. Verify SHA-256 checksum matches manifest
5. Deploy ZIP to staging slot via zip deploy API (`POST /api/zipdeploy` on the staging slot's SCM endpoint)
6. Health check staging slot (`GET /health` → 200, timeout 60s, 3 retries)
7. Swap staging → production (`POST .../slots/staging/slotsswap`)
8. Health check production (`GET /health` → 200, timeout 60s)
9. Update `VARISCOUT_VERSION` app setting to new version
10. Return `{ "success": true, "version": "1.3.0" }`

**If any step fails:**

- If swap completed but health check fails: swap back (staging has old version after swap)
- Return `{ "success": false, "error": "Health check failed after update", "rolledBack": true }`
- App shows: "Update failed. Your previous version has been restored. Please try again or contact support."
- No data loss — IndexedDB/OneDrive data is unaffected by app code updates

**Authentication:**

- Requires valid EasyAuth session (same as the rest of the app)
- Function key protects the endpoint from direct access outside the app
- Only authenticated users can trigger updates

**File:** `infra/functions/update/index.js`
**File:** `infra/functions/version/index.js`

**Dependencies (added to `infra/functions/package.json`):**

- `@azure/identity` — DefaultAzureCredential for Managed Identity
- `@azure/arm-appservice` — App Service Management SDK (slot deploy, swap, settings)

---

## 4. In-App Update Experience

### Version Check

- **Hook:** `useUpdateCheck` in `@variscout/hooks`
- Calls `GET /api/version` on app startup (once per session)
- Exposes: `{ updateAvailable, latestVersion, currentVersion, security, releaseNotesUrl, isUpdating, updateError, triggerUpdate }`
- Returns `updateAvailable: false` if `autoUpdate === "disabled"` (IT-managed)

### Update Banner

- **Component:** `UpdateBanner` in `@variscout/ui`
- Renders at top of dashboard when `updateAvailable === true`
- Non-intrusive: dismissible, doesn't block workflow

**Standard update:**

```
ℹ  Update available: v1.3.0    [View release notes]  [Update now]  [Dismiss]
```

**Security update** (`security: true`): amber background, stronger language:

```
⚠  Security update available: v1.3.1 — recommended to install promptly
   [View release notes]  [Update now]  [Dismiss]
```

### Update Progress

When user clicks "Update now":

1. Confirmation dialog: "Update VariScout to v1.3.0? The app will be briefly unavailable during the update (~30 seconds)." [Cancel] [Update]
2. Progress states: "Preparing update..." → "Verifying..." → "Switching..." → "Done!"
3. On success: app reloads automatically on new version
4. On failure: error message with "Your previous version has been restored"

### IT Control

App setting `VARISCOUT_AUTO_UPDATE` (default: `"prompt"`):

| Value        | Behavior                                                   |
| ------------ | ---------------------------------------------------------- |
| `"prompt"`   | Show banner, user decides when to update (default for all) |
| `"disabled"` | Hide banner entirely, IT manages updates via Portal/CLI    |

Future (not in v1): `"auto"` — update automatically during configurable off-hours window.

### Codebase Location

| File                                                       | Package                | Purpose                                            |
| ---------------------------------------------------------- | ---------------------- | -------------------------------------------------- |
| `packages/hooks/src/useUpdateCheck.ts`                     | `@variscout/hooks`     | Version check + update trigger                     |
| `packages/ui/src/components/UpdateBanner/UpdateBanner.tsx` | `@variscout/ui`        | Banner UI (Base component)                         |
| `apps/azure/src/components/UpdateBanner.tsx`               | `@variscout/azure-app` | Azure wiring — calls `/api/update`, shows progress |
| `apps/azure/server.js`                                     | `@variscout/azure-app` | Add `VARISCOUT_VERSION` to `/config` response      |

PWA does not use this system — it's always the latest version served from your URL.

---

## 5. File Changes Summary

### Infrastructure (Bicep)

| File                              | Change                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `infra/modules/app-service.bicep` | SKU B1 → S1, add staging slot resource, add `VARISCOUT_VERSION` app setting     |
| `infra/modules/functions.bicep`   | Add Website Contributor RBAC on App Service, add update/version function config |
| `infra/main.bicep`                | Pass App Service resource ID to functions module for RBAC                       |
| `infra/mainTemplate.json`         | Recompile from Bicep (triggers Marketplace re-certification)                    |

### Azure Functions (new code)

| File                               | Purpose                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| `infra/functions/update/index.js`  | Update orchestrator: fetch ZIP → deploy to slot → health check → swap |
| `infra/functions/version/index.js` | Version endpoint: merge local version + remote manifest               |
| `infra/functions/package.json`     | Add `@azure/identity`, `@azure/arm-appservice` dependencies           |

### App Code (Azure app only)

| File                                                       | Purpose                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/hooks/src/useUpdateCheck.ts`                     | Fetch `/api/version`, expose update state + trigger               |
| `packages/ui/src/components/UpdateBanner/UpdateBanner.tsx` | Banner UI with release notes link + update/dismiss buttons        |
| `apps/azure/src/components/UpdateBanner.tsx`               | Azure wiring — calls `/api/update`, confirmation dialog, progress |
| `apps/azure/server.js`                                     | Add `VARISCOUT_VERSION` to `/config` response                     |

### GitHub Actions

| File                                            | Change                                                   |
| ----------------------------------------------- | -------------------------------------------------------- |
| `.github/workflows/deploy-azure-staging.yml`    | Remove slot-swap, direct deploy to B1                    |
| `.github/workflows/release.yml`                 | New: tag-triggered build + upload ZIP + manifest to blob |
| `.github/workflows/deploy-azure-production.yml` | Delete                                                   |

### New Infrastructure (your Perus-RDMAIC subscription, one-time manual setup)

- Azure Storage Account `variscoutrelease` with `releases` container
- Container access: `manifest.json` public read, ZIPs private (SAS via manifest)
- Lifecycle management policy: delete versions older than 10 releases
- OIDC federated credential for GitHub Actions to upload (Storage Blob Data Contributor role)

---

## 6. Verification

### Release Pipeline

1. Create a test tag `v0.0.1-test` and push it
2. Verify `release.yml` triggers: builds, tests, uploads ZIP to blob, updates manifest
3. Verify `manifest.json` is publicly readable and contains correct version + SAS URL
4. Verify ZIP is downloadable via the SAS URL in manifest

### Staging Deploy

1. Push a change to `main` touching `apps/azure/`
2. Verify `deploy-staging.yml` deploys directly (no slot-swap step)
3. Verify `https://variscout-staging.azurewebsites.net/health` returns 200

### Customer Infrastructure (test deployment)

1. Deploy updated Bicep to a test resource group
2. Verify S1 plan provisioned with staging slot
3. Verify Function App has Website Contributor role on App Service
4. Call `GET /api/version` — returns current version + manifest data
5. Call `POST /api/update` with a test version — verify slot deploy + swap + health check

### In-App Update Flow

1. Deploy v1.0.0 to test environment
2. Publish v1.1.0 via release pipeline
3. Open app — verify "Update available: v1.1.0" banner appears
4. Click "View release notes" — verify link opens
5. Click "Update now" — verify confirmation dialog → progress → reload on v1.1.0
6. Verify `VARISCOUT_VERSION` updated to `1.1.0`
7. Verify banner no longer appears after update

### Rollback

1. Publish a v1.2.0 with a broken `/health` endpoint
2. Trigger update from the app
3. Verify Update Handler detects health check failure
4. Verify automatic swap-back restores v1.1.0
5. Verify app shows error message: "Update failed. Previous version restored."

### IT Control

1. Set `VARISCOUT_AUTO_UPDATE=disabled` in app settings
2. Verify banner does not appear
3. Manually update `WEBSITE_RUN_FROM_PACKAGE` via Portal to verify IT-managed path still works
