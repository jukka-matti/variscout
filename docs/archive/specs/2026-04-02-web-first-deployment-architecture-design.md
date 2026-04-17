---
title: Web-First Deployment Architecture
audience: [developer, architect, business]
category: architecture
status: draft
related: [deployment, trust, enterprise, marketplace, collaboration, teams, storage, permissions]
---

# Web-First Deployment Architecture

## Context

VariScout is deployed into each customer's own Azure subscription via Azure Marketplace as a Managed Application. The current architecture assumes Microsoft Teams as the primary delivery mechanism for the Team tier, requiring 5 admin-consent Graph API permissions (`Files.ReadWrite.All`, `Channel.ReadBasic.All`, `ChannelMessage.Send`, `Sites.Read.All`, `People.Read`).

### The Trust Problem

Enterprise manufacturing customers — VariScout's target market — have strict IT governance. A CTO evaluating VariScout sees:

- **`Files.ReadWrite.All`** — sounds like "read all our SharePoint files" (even though delegated scope limits to user's own access)
- **Admin consent required** — needs IT director sign-off before any user can start
- **Third-party app in tenant** — triggers security review process (weeks to months)

With Microsoft tightening permission governance through 2025-2026 (Copilot content surfacing, EEEU retirement, stricter app vetting), the bar for third-party app consent is rising.

Meanwhile, the Teams integration provides:

- Channel file storage (replaceable with Azure Blob Storage)
- Photo capture (replaceable with browser `navigator.mediaDevices`)
- Adaptive Cards (replaceable with webhook notifications or email)
- Teams SSO (replaceable with standard Entra ID login — already works)
- App icon in Teams (achievable via lightweight static tab — zero Graph permissions)

**None of the Teams-specific features are irreplaceable.** All can be built more simply as standalone web app capabilities, often with better permission stories.

### The Business Constraint

Azure Marketplace billing must be preserved. Manufacturing customers pay through their Azure invoice — no new vendor approval, no new procurement process. This eliminates "customer-hosted on their own infrastructure" as an option.

## Decision

**Shift VariScout from a "Teams app" to a "web application deployed via Azure Marketplace."** Teams integration becomes an optional lightweight enhancement (static tab for icon presence), not a dependency.

### Core Architecture Changes

| Aspect             | Current (Teams-first)                    | New (Web-first)                                    |
| ------------------ | ---------------------------------------- | -------------------------------------------------- |
| **Identity**       | "Teams app with web fallback"            | "Web app with optional Teams tab"                  |
| **Auth**           | EasyAuth + Teams SSO + OBO Function      | EasyAuth only (`User.Read`)                        |
| **Team storage**   | OneDrive/SharePoint via Graph API        | Azure Blob Storage in customer's resource group    |
| **Photo capture**  | Teams SDK camera                         | Browser `navigator.mediaDevices.getUserMedia()`    |
| **Notifications**  | Adaptive Cards via `ChannelMessage.Send` | Teams Incoming Webhook / email (future)            |
| **Teams presence** | Full Teams app (manifest, SDK, OBO)      | Static tab (URL bookmark, zero permissions)        |
| **Admin consent**  | Required (5 scopes)                      | **Not required** (`User.Read` = user consent only) |
| **Mobile**         | Teams mobile app                         | Browser (no offline required)                      |

### What This Does NOT Cover

- PWA (unchanged — always latest, served from publisher URL, free forever)
- Release pipeline / update mechanism (covered by ADR-058)
- ISO 27001 / SOC 2 certification (separate strategic initiative)
- Non-Azure deployment (AWS/GCP — future, enabled by this architecture)
- Teams Incoming Webhook implementation (future, post-v1)
- Knowledge Base / SharePoint search (deferred until validated by customers)

---

## 1. Tier Redefinition

### Standard (€79/month) — "Analyze your own data"

Solo analyst. All analytical power, local storage only.

- Full analysis engine (all chart types, all statistics, Performance/Yamazumi modes)
- CoScout AI (customer's Azure AI Foundry)
- Local storage: IndexedDB (auto-save) + `.vrs` file export/import
- Authentication: Entra ID via EasyAuth (`User.Read` — zero admin consent)
- Limits: 6 factors, 250K rows

### Team (€199/month) — "Collaborate & build knowledge"

Team collaboration. Shared cloud storage + team features.

Everything in Standard, plus:

- **Shared Blob Storage**: Projects stored in Azure Blob Storage container in customer's resource group
- **Team access**: All Entra ID users with `Storage Blob Data Contributor` RBAC role can read/write projects
- **Project sharing**: Browse team projects, concurrent access (last-write-wins with conflict notification)
- **Photo evidence**: Browser camera capture, EXIF/GPS stripping (client-side, same as current), stored in Blob container
- **Team assignment**: People picker via `People.Read` (delegated, user-consent only)
- **Webhook notifications**: Optional Teams Incoming Webhook for channel alerts when findings reach key statuses
- **Knowledge Catalyst**: Resolved findings feed into CoScout AI context (same as current)

### Permission Comparison

| Scope                   | Current Team            | New Standard    | New Team           |
| ----------------------- | ----------------------- | --------------- | ------------------ |
| `User.Read`             | Yes (delegated)         | Yes (delegated) | Yes (delegated)    |
| `People.Read`           | Yes (delegated)         | No              | Yes (delegated)    |
| `Files.ReadWrite.All`   | Yes (**admin consent**) | No              | No                 |
| `Channel.ReadBasic.All` | Yes (**admin consent**) | No              | No                 |
| `ChannelMessage.Send`   | Yes (**admin consent**) | No              | No                 |
| `Sites.Read.All`        | Yes (**admin consent**) | No              | No                 |
| Azure Blob RBAC         | No                      | No              | Yes (Azure-native) |

**Result: Zero admin-consent Graph API permissions for either tier.**

Blob Storage access uses Azure RBAC (role-based access control), which is managed through the Azure Portal — the same mechanism IT admins already use for all Azure resources. No third-party app consent flow needed.

---

## 2. Storage Architecture

### Standard Tier: Local Only

```
Browser Memory (active session)
    ↓ auto-save (2s debounce)
IndexedDB (persistent across sessions)
    ↕ manual export/import
Local .vrs files (File System Access API)
```

No changes from current Standard tier behavior.

### Team Tier: Shared Blob Storage

```
Browser Memory (active session)
    ↓ auto-save (2s debounce)
IndexedDB (local cache, offline resilience)
    ↕ sync on save/load
Azure Blob Storage (shared team storage)
    └── container: variscout-projects
        ├── {projectId}/
        │   ├── analysis.json        (project data + stats)
        │   ├── metadata.json        (name, owner, updated, phase)
        │   └── photos/
        │       └── {findingId}/
        │           └── {photoId}.jpg
        └── _index.json              (project listing cache)
```

### Blob Storage Access Pattern

Authentication uses Azure Blob Storage SAS tokens generated server-side (App Service), scoped to the specific container. No direct Blob Storage credentials in the browser.

```
Browser → App Service (/api/storage-token)
    → App Service validates Entra ID token
    → Generates container-scoped SAS token (read/write, 1hr expiry)
    → Returns SAS token to browser
Browser → Azure Blob Storage (direct, using SAS token)
```

**Why SAS tokens over managed identity in browser?**

- Managed identity works server-side only; browser needs delegated access
- SAS tokens are time-limited, container-scoped, and revocable
- The App Service acts as the token broker (already exists for EasyAuth)

### Conflict Resolution

Last-write-wins with notification. When saving:

1. Read current `metadata.json` ETag
2. Write with `If-Match: <etag>` condition
3. If 412 (Precondition Failed) → show "Project was modified by [user]. Reload or overwrite?"

This is simpler than the current OneDrive optimistic merge strategy and more predictable for users.

---

## 3. Infrastructure Changes

### Current ARM Template Provisions

- App Service (B1/S1)
- App Service Plan
- App Registration (Entra ID)
- (Team) Azure Function for OBO token exchange

### New ARM Template Provisions

- App Service (S1 — for staging slot, per ADR-058)
- App Service Plan
- App Registration (Entra ID) — **simplified: `User.Read` + `People.Read` only**
- **(Team) Storage Account** — `variscout{uniquestring}` with `variscout-projects` container
- **(Team) RBAC assignment** — `Storage Blob Data Contributor` for the App Service managed identity
- **(Team) API endpoint** — `/api/storage-token` route in `server.js` (same Express server that handles `/api/token-exchange` today) for SAS token generation

### Removed

- Azure Function for OBO token exchange (no longer needed)
- Teams app manifest
- Teams SDK dependency
- `Channel.ReadBasic.All`, `ChannelMessage.Send`, `Files.ReadWrite.All`, `Sites.Read.All` permissions

---

## 4. Teams Presence (Optional)

For customers who want VariScout in the Teams app bar, offer a **static tab** — a minimal Teams manifest that points to the VariScout URL. This is a 20-line JSON manifest with:

```json
{
  "staticTabs": [
    {
      "entityId": "variscout",
      "name": "VariScout",
      "contentUrl": "https://{appServiceName}.azurewebsites.net",
      "scopes": ["personal"]
    }
  ],
  "permissions": [],
  "validDomains": ["{appServiceName}.azurewebsites.net"]
}
```

**Zero Graph API permissions requested.** The Teams admin just allows the app (or uses app setup policies to pin it). The app opens in an iframe — it's the same web app, just viewed inside Teams.

This can be offered as documentation ("How to add VariScout to Teams") rather than a code feature. No Teams SDK needed in the codebase.

---

## 5. Photo Capture Without Teams SDK

Replace Teams camera with standard Web APIs:

```typescript
// Current: Teams SDK
import { media } from '@microsoft/teams-js';
media.captureImage(/* ... */);

// New: Browser API (works on all mobile browsers)
const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
// Or simpler: use <input type="file" accept="image/*" capture="environment">
```

The `<input capture>` approach is simpler and more reliable:

- Opens native camera on mobile (iOS/Android)
- Falls back to file picker on desktop
- No SDK dependency, no permissions beyond browser standard
- EXIF stripping continues as-is (client-side, canvas re-encode + byte-level removal)

Photos are uploaded to Blob Storage at `{projectId}/photos/{findingId}/{photoId}.jpg`.

---

## 6. Notification Without Adaptive Cards

### Phase 1 (v1): No automated notifications

Users check the app directly. Shared Blob Storage means team members see the same project state.

### Phase 2 (future): Teams Incoming Webhook

Teams channels can receive messages via Incoming Webhook connectors — no app registration, no Graph API permissions. The customer configures a webhook URL in VariScout settings, and the app posts formatted messages when findings reach key statuses.

```
Finding reaches "analyzed" status
    → POST to customer's webhook URL
    → Message appears in Teams channel with link to VariScout
```

This is customer-initiated (they provide the webhook URL) and requires zero permissions on VariScout's side.

### Phase 3 (future): Email notifications

For non-Teams customers. Uses Azure Communication Services or SendGrid in customer's subscription.

---

## 7. Migration Path

### For the Codebase

| Component                              | Action                                          |
| -------------------------------------- | ----------------------------------------------- |
| `apps/azure/src/teams/`                | Remove Teams SDK integration                    |
| `apps/azure/src/auth/graphToken.ts`    | Simplify: remove OBO flow, keep EasyAuth only   |
| `infra/functions/token-exchange/`      | Remove Azure Function                           |
| `apps/azure/src/services/cloudSync.ts` | Replace Graph API calls with Blob Storage SDK   |
| `apps/azure/src/services/storage.ts`   | Add Blob Storage service (SAS token flow)       |
| `infra/main.bicep`                     | Add Storage Account + RBAC, remove Function App |
| Teams manifest                         | Remove (offer static tab documentation instead) |
| Photo capture                          | Replace Teams camera with `<input capture>`     |

### For Existing Users

No existing Team tier customers to migrate (pre-launch). This is a clean-sheet decision.

### Code Reuse

| Current Code                  | Reuse in New Architecture                 |
| ----------------------------- | ----------------------------------------- |
| EXIF/GPS stripping (23 tests) | 100% — same client-side processing        |
| IndexedDB layer               | 100% — stays as local cache               |
| `.vrs` file format            | 100% — same serialization                 |
| EasyAuth flow                 | 100% — simplified (remove Teams fallback) |
| Project metadata computation  | 100% — same `@variscout/core` functions   |
| All analysis/chart/UI code    | 100% — zero changes                       |

---

## 8. Trust Story

### The Pitch

> "VariScout runs entirely in your Azure subscription. We can't see your data. We can't access your files. The only permission we ask is `User.Read` — your name and email for the login screen. Your quality data stays in your Azure Blob Storage, encrypted at rest, accessible only to the users you authorize through standard Azure roles."

### Trust Stack

| Layer                   | How VariScout Delivers                                   |
| ----------------------- | -------------------------------------------------------- |
| **Platform trust**      | Azure Marketplace Managed Application, Microsoft-vetted  |
| **Permission trust**    | `User.Read` only — zero admin consent, zero file access  |
| **Data trust**          | All data in customer's Azure subscription (Blob Storage) |
| **Update trust**        | Customer-initiated updates with release notes (ADR-058)  |
| **Certification trust** | ISO 27001 (roadmap)                                      |
| **Billing trust**       | Microsoft handles payment, appears on Azure invoice      |

### Competitive Differentiation

| Competitor      | Data Location            | Permissions                  |
| --------------- | ------------------------ | ---------------------------- |
| Minitab Connect | Minitab's cloud          | Upload data to their servers |
| InfinityQS      | InfinityQS cloud         | SaaS data hosting            |
| **VariScout**   | **Customer's own Azure** | **`User.Read` only**         |

---

## 9. Verification Plan

### Technical Verification

1. **Auth flow**: Deploy to test subscription, verify Entra ID login with `User.Read` only
2. **Blob Storage**: Create project → save → load from another authenticated browser session
3. **Photo capture**: Test `<input capture>` on iOS Safari, Android Chrome, desktop browsers
4. **Conflict detection**: Two sessions editing same project → verify ETag conflict notification
5. **SAS token**: Verify token generation, expiry, container scoping
6. **Static Teams tab**: Create minimal manifest, install in test Teams, verify app loads in iframe
7. **ARM template**: Deploy full Managed Application, verify Storage Account + RBAC provisioned

### Business Verification

1. **Permission story**: Present the "zero admin consent" pitch to 2-3 manufacturing IT contacts
2. **Collaboration flow**: Have 2 quality engineers use shared Blob Storage for a real analysis
3. **Mobile photo**: Test shop floor photo capture without Teams on mobile browser
