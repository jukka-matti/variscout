---
title: Admin Experience Design Spec
audience: [developer, analyst]
category: architecture
status: delivered
related: [admin, azure, diagnostics, health-check, troubleshooting]
---

# Admin Experience Design Spec

**Date**: 2026-03-19

**Persona**: [Admin Aino](../../02-journeys/personas/admin-aino.md)

**Flow**: [Flow 10: Azure Admin Operations](../../02-journeys/flows/azure-admin-operations.md)

## Summary

Design spec for consolidating VariScout's admin experience into a unified Admin Hub. Currently two standalone admin screens exist behind a shield icon — this design merges them into a tabbed interface and adds health diagnostics, plan overview, and troubleshooting.

**Key constraint:** VariScout has no backend. Everything runs in the browser. The admin hub is a diagnostic and setup tool, not a management dashboard.

**Design principle:** For Azure Marketplace managed apps, the correct pattern is:

- **Infrastructure admin → Azure Portal** (scaling, cost, uptime, RBAC)
- **Application admin → in-app** (feature config, integration setup, diagnostics)
- **User management → delegate to Entra ID** (no custom user management)

## Current State

Two standalone admin views behind a shield icon in the Azure app header:

| Route             | Component             | Purpose                                                 |
| ----------------- | --------------------- | ------------------------------------------------------- |
| `admin-teams`     | `AdminTeamsSetup`     | Teams manifest generation and download                  |
| `admin-knowledge` | `AdminKnowledgeSetup` | KB connectivity check, preview toggle, folder selection |

**What's missing:**

- No health dashboard — admin can't verify integrations are working
- No plan overview — admin can't see what's enabled or how to upgrade
- No troubleshooting — admin can't diagnose common issues
- No admin role gating — all authenticated users see the shield icon

## Proposed Design: Consolidated Admin Hub

### Tab Structure

| Tab                 | What It Shows                                             | Status             |
| ------------------- | --------------------------------------------------------- | ------------------ |
| **Status**          | Health checks for all integrations                        | **New**            |
| **Plan & Features** | Current plan, feature matrix, upgrade path                | **New**            |
| **Teams Setup**     | Existing `AdminTeamsSetup` content                        | Exists             |
| **Knowledge Base**  | Existing `AdminKnowledgeSetup` content                    | Exists (Team only) |
| **Troubleshooting** | Common issues, diagnostic checks, Azure Portal deep links | **New**            |

Tabs are conditionally shown based on plan:

- **Standard:** Status, Plan & Features, Troubleshooting
- **Team:** All five tabs (Status, Plan & Features, Teams Setup, Knowledge Base, Troubleshooting)

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ Admin Hub                                            ✕   │
├──────────────────────────────────────────────────────────┤
│ [Status] [Plan & Features] [Teams] [Knowledge] [Troubl.]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Tab content area                                        │
│                                                          │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Full-page view within the Azure app (replaces current standalone admin screens). Shield icon in header navigates to Admin Hub with last-used tab remembered.

---

## Tab: Status (Health Dashboard)

### Browser-Runnable Health Checks

| Check                | How                                    | What It Tests                             | Plan  |
| -------------------- | -------------------------------------- | ----------------------------------------- | ----- |
| Authentication       | `GET /.auth/me`                        | EasyAuth configured, user has valid token | All   |
| Graph API — Profile  | `GET /me` via `graphFetch`             | User.Read permission granted              | All   |
| Graph API — Files    | `GET /me/drive` via `graphFetch`       | Files.ReadWrite.All permission            | Team+ |
| Graph API — Channels | `GET /me/joinedTeams` via `graphFetch` | Channel.ReadBasic.All permission          | Team+ |
| AI Endpoint          | `GET {VITE_AI_ENDPOINT}`               | AI Services reachable                     | All   |
| AI Search            | Test query via AI Search API           | Knowledge Base connectivity               | Team  |

### Display

Vertical checklist with status indicators:

```
┌──────────────────────────────────────────┐
│ Integration Health                       │
│                                          │
│ ● Authentication           ✓ Connected  │
│   EasyAuth session valid                 │
│                                          │
│ ● Graph API — Profile      ✓ Connected  │
│   User.Read scope verified               │
│                                          │
│ ● Graph API — Files        ✗ Failed     │
│   Files.ReadWrite.All not granted        │
│   [Fix in Azure Portal →]               │
│                                          │
│ ● Graph API — Channels     ○ N/A        │
│   Requires Team plan                     │
│                                          │
│ ● AI Endpoint              ○ N/A        │
│   Requires Team plan                     │
│                                          │
│          [Run All Checks]                │
└──────────────────────────────────────────┘
```

Status indicators:

- **Green ✓** — Check passed
- **Red ✗** — Check failed (with error message + "Fix in Azure Portal →" link)
- **Grey ○** — Not applicable for current plan
- **Spinner** — Check running

### What Cannot Be Checked From Browser

| Item                 | Why                                                   | Deep Link                                            |
| -------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Client secret expiry | Server-side secret, no browser API                    | Entra ID → App Registration → Certificates & secrets |
| App Service health   | Circular — if app is down, check can't run            | App Service → Health check                           |
| Resource costs       | Requires Azure Management API (not in EasyAuth scope) | Cost Management                                      |
| Other users' access  | Delegated token = current user only                   | Entra ID → Enterprise Applications → Users           |
| Uptime monitoring    | Circular                                              | Azure Monitor → Availability tests                   |

Show these as a "Manage in Azure Portal" section with deep links. No fake health indicators.

### Implementation Notes

- Use existing `graphFetch` helper from `apps/azure/src/services/graphFetch.ts`
- EasyAuth check: `fetch('/.auth/me')` — returns `[]` on localhost (mock), user claims in production
- AI endpoint check: lightweight HEAD or GET to the endpoint URL from `VITE_AI_ENDPOINT`
- All checks run in parallel on tab load, with individual retry buttons
- Results are ephemeral (not persisted) — fresh check every time
- **Security: `/.auth/me` exposes raw tokens** — the admin UI must never display raw token values from this endpoint. Read claims only (user name, roles, scopes). The endpoint is XSS-sensitive; displaying tokens would amplify the impact of any XSS vulnerability.
- **AI Search checks use delegated permissions** — a successful KB connectivity test only proves the _current admin's_ access. Another user with different SharePoint permissions may get different results. The Status tab should note: "This check verifies your access. Other users' access depends on their SharePoint permissions."

---

## Tab: Plan & Features

### Feature Matrix

| Feature                        | Standard | Team |
| ------------------------------ | -------- | ---- |
| Analysis & charts              | ✓        | ✓    |
| Findings & investigation       | ✓        | ✓    |
| Local file storage (IndexedDB) | ✓        | ✓    |
| AI narration & insights        | ✓        | ✓    |
| CoScout assistant              | ✓        | ✓    |
| OneDrive sync                  | —        | ✓    |
| Teams integration              | —        | ✓    |
| SharePoint file picker         | —        | ✓    |
| Mobile photo capture           | —        | ✓    |
| Knowledge Base                 | —        | ✓    |
| Report publishing              | —        | ✓    |

### Display

```
┌──────────────────────────────────────────┐
│ Your Plan: Team                          │
│                                          │
│ ┌────────┐ ┌────────┐                    │
│ │Standard│ │ Team ← │                    │
│ │ €79/mo │ │€199/mo │                    │
│ └────────┘ └────────┘                    │
│                                          │
│ Feature matrix table...                  │
│                                          │
│ Current plan column highlighted          │
│ Locked features shown with lock icon     │
│                                          │
│ [Manage Subscription in Azure →]         │
└──────────────────────────────────────────┘
```

- Current plan determined from `VITE_VARISCOUT_PLAN` env var + `hasTeamFeatures()` / `hasKnowledgeBase()` from `@variscout/core/tier`
- Pricing from `docs/08-products/tier-philosophy.md` (Standard €79/month, Team €199/month)
- Upgrade link: Azure Marketplace subscription management

---

## Tab: Teams Setup (Existing)

Existing `AdminTeamsSetup` component, unchanged. Generates Teams manifest (manifest.json + `.zip`), shows installation instructions.

---

## Tab: Knowledge Base (Existing)

Existing `AdminKnowledgeSetup` component, unchanged. Shows KB connectivity, preview toggle, folder selection via `useFilePicker`. Only visible for Team plan.

---

## Tab: Troubleshooting

### Common Issues

| Issue                             | Diagnostic Check                                                                    | Fix Location                                      |
| --------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| Users can't sign in               | `GET /.auth/me` — does it return user claims?                                       | Azure Portal → App Service → Authentication       |
| OneDrive sync not working         | `GET /me/drive` — is Files.ReadWrite.All granted?                                   | Azure Portal → App Registration → API Permissions |
| CoScout not responding            | Test AI endpoint — is it reachable?                                                 | Azure Portal → AI Services → Keys and Endpoint    |
| Knowledge Base returns no results | Test AI Search query — are indexes populated?                                       | Azure Portal → AI Search → Indexes                |
| Teams tab not showing             | Check manifest app ID — does it match App Registration?                             | Teams Admin Center → Manage apps                  |
| New user can't access app         | Check EasyAuth assignment — is user assigned?                                       | Azure Portal → Entra ID → Enterprise Applications |
| AI responses are slow             | Check model deployment — throttling or cold start?                                  | Azure Portal → AI Services → Model deployments    |
| "Forbidden" errors in console     | Check RBAC — does user have required roles?                                         | Azure Portal → Resource → IAM                     |
| KB search fails for some users    | Conditional Access policies may block SharePoint access for certain users/locations | Azure Portal → Entra ID → Conditional Access      |

### Display

```
┌──────────────────────────────────────────┐
│ Troubleshooting                          │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ⚠ Users can't sign in               │ │
│ │                                      │ │
│ │ Check: EasyAuth returns user claims  │ │
│ │ [Run Check]  Result: ✓ Working       │ │
│ │                                      │ │
│ │ If failing:                          │ │
│ │ 1. Verify App Registration exists    │ │
│ │ 2. Check redirect URIs              │ │
│ │ 3. Ensure user is assigned           │ │
│ │                                      │ │
│ │ [Fix in Azure Portal →]             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ⚠ OneDrive sync not working         │ │
│ │ ...                                  │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

Each issue card:

1. Issue title (searchable)
2. One-click diagnostic check with inline result
3. Step-by-step fix instructions
4. "Fix in Azure Portal →" deep link

---

## Admin Role Gating — Implemented

Soft gating via Entra ID App Roles. Works without any customer configuration (backward compatible), but respects role separation when App Roles are configured.

### How It Works

1. **Read** `roles` claims from EasyAuth `/.auth/me` response
2. **If `VariScout.Admin` role present** → user is admin → show Shield icon
3. **If roles exist but no admin role** → not admin → hide Shield icon
4. **If NO roles claims at all** → App Roles not configured → show to everyone (fallback)

### Implementation

| File                                                 | Purpose                                               |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `apps/azure/src/auth/easyAuth.ts`                    | `EasyAuthUser.roles` field extracted from claims      |
| `apps/azure/src/hooks/useAdminAccess.ts`             | `useAdminAccess(user)` → `{ isAdmin, gatingMode }`    |
| `apps/azure/src/App.tsx`                             | Shield icon conditionally rendered based on `isAdmin` |
| `apps/azure/src/components/admin/AdminStatusTab.tsx` | Gating mode info row at bottom of Status tab          |

### Customer Setup (Optional)

To restrict admin access, customers configure an App Role in their Entra ID tenant:

1. **Define** `VariScout.Admin` App Role in App Registration
2. **Assign** admin users to the role in Enterprise Applications
3. The role appears as a `roles` claim in `/.auth/me` — the app reads it automatically

See [Authentication docs](../../08-products/azure/authentication.md#admin-role-gating-app-roles) for detailed setup instructions.

---

## Azure Portal Views (Future — Complementary Channel)

Azure Managed Apps support custom portal views via `viewDefinition.json` (Overview, Metrics, Commands). This is a complementary admin channel — Aino could see health metrics and run commands directly in the Azure Portal alongside our in-app Admin Hub.

Potential `viewDefinition.json` views:

- **Overview** — deployment status, plan tier, key resource links
- **Metrics** — AI token usage, Graph API call volume (from App Service logs)
- **Commands** — trigger reindexing, clear cache, rotate config

This is independent of the in-app Admin Hub and can be added incrementally. Worth pursuing when customers manage multiple VariScout deployments and want a single Azure Portal view.

---

## What NOT to Build In-App

| Capability             | Why Not                                               | Where Instead                      |
| ---------------------- | ----------------------------------------------------- | ---------------------------------- |
| User management        | No backend, delegated token = current user only       | Entra ID → Enterprise Applications |
| Cost monitoring        | Requires Azure Management API (not in EasyAuth scope) | Azure Cost Management              |
| Audit logs             | No server to log to                                   | App Service → Diagnostic logs      |
| Billing management     | Azure Marketplace owns billing                        | Azure Marketplace → Subscriptions  |
| Resource scaling       | Infrastructure concern                                | App Service → Scale up/out         |
| Uptime monitoring      | Circular — if app is down, check can't run            | Azure Monitor → Availability tests |
| Client secret rotation | Server-side secret, not accessible from browser       | Entra ID → Certificates & secrets  |

---

## Component Architecture (Implementation Preview)

```
apps/azure/src/
├── components/admin/
│   ├── AdminHub.tsx              # Tab container (new)
│   ├── AdminStatusTab.tsx        # Health checks (new)
│   ├── AdminPlanTab.tsx          # Plan & Features (new)
│   ├── AdminTeamsSetup.tsx       # Existing (moved into tab)
│   ├── AdminKnowledgeSetup.tsx   # Existing (moved into tab)
│   └── AdminTroubleshootTab.tsx  # Troubleshooting (new)
├── hooks/
│   └── useAdminHealthChecks.ts   # Health check logic (new)
```

### Key Decisions

- **No shared package extraction** — admin is Azure-only, lives in `apps/azure/`
- **Reuse `graphFetch`** — all Graph API checks use the existing authenticated fetch wrapper
- **No new dependencies** — standard fetch for health checks, existing tier utilities for plan detection
- **Tab state in URL** — `?admin=status` so deep links work (e.g., from Troubleshooting tab links)

---

## Implementation Sequence

All four phases have been delivered:

1. **Phase 1:** Admin Hub shell with tabs, existing screens migrated into tabs — **Delivered**
2. **Phase 2:** Status tab (health checks) + Plan & Features tab — **Delivered**
3. **Phase 3:** Troubleshooting tab with diagnostic checks — **Delivered**
4. **Phase 4:** Admin role gating via Entra ID App Roles — **Delivered**

---

## See Also

- [Admin Aino](../../02-journeys/personas/admin-aino.md) — IT Admin persona
- [Flow 10: Admin Operations](../../02-journeys/flows/azure-admin-operations.md) — admin journey flow
- [Authentication](../../08-products/azure/authentication.md) — EasyAuth configuration
- [ARM Template](../../08-products/azure/arm-template.md) — deployment resources
- [Tier Philosophy](../../08-products/tier-philosophy.md) — plan pricing and feature matrix
- [Feature Parity](../../08-products/feature-parity.md) — cross-platform feature comparison
