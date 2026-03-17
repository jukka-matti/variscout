---
title: 'ADR-007: Azure Marketplace Distribution Strategy'
---

# ADR-007: Azure Marketplace Distribution Strategy

**Status**: Accepted (Revised 2026-02-27)

**Date**: 2026-02-05 (Original), 2026-02-13 (Revised), 2026-02-27 (Revised)

---

## Context

VariScout has evolved from a single PWA product to a multi-platform offering. The previous licensing model used:

- **Paddle** for payment processing (PWA license)
- **Custom license keys** for feature gating
- **Backend webhook** for key generation and validation

This approach had several limitations:

1. **Backend dependency** - Required server infrastructure for license validation
2. **Payment complexity** - Paddle's fees plus VAT handling complexity
3. **No enterprise support** - Single-user licensing only
4. **Limited distribution** - Manual installation via URL

### Revision Context (2026-02-27)

Teams integration creates a natural product tier split. Quality teams need mobile gemba access (photo evidence, chart sharing, commenting on findings) and shared channel file storage. This justifies a two-plan Marketplace model: Standard (personal, browser) and Team (collaborative, Teams-integrated). See [ADR-016](adr-016-teams-integration.md) for full technical design.

### Revision Context (2026-02-13)

A technical viability review against current Microsoft documentation revealed critical issues with the original plan:

1. **Solution Templates are not transactable** - Microsoft will not bill customers for Solution Template offers. They support free/BYOL only.
2. **Per-user pricing is unenforceable** - Managed Applications are per-deployment; there is no mechanism to enforce user-count tiers.
3. **Graph API license detection for Excel was over-engineered** - The complexity and admin consent requirements outweighed the benefits.

These findings led to a simplified model: one paid product (Azure App as Managed Application) and one free product (Excel Add-in with no license detection).

---

## Decision

**Adopt Azure Marketplace as the primary distribution channel using a Managed Application offer:**

```
┌─────────────────────────────────────────────────────────────┐
│  VariScout on Azure Marketplace                             │
│                                                             │
│  Offer: VariScout - Statistical Process Control             │
│         for Quality Teams                                   │
│                                                             │
│  Plan: "VariScout Standard"    €99/month                   │
│    Full analysis suite, local file storage (.vrs on your   │
│    computer). EasyAuth sign-in (User.Read only),           │
│    browser-based access                                     │
│                                                             │
│  Plan: "VariScout Team"        €299/month (TBD)            │
│    Everything in Standard, plus:                            │
│    - OneDrive + SharePoint channel file storage            │
│    - Teams integration (SSO, sidebar, Adaptive Cards)      │
│    - Mobile gemba companion (Field View + photo comments)  │
│    - Requires: admin consent for Files.ReadWrite.All        │
│                                                             │
│  Offer type: Managed Application                           │
│  Billing: Microsoft (3% fee, monthly)                      │
│  Customer access: Full control                             │
│  Publisher access: Disabled (zero access)                   │
└─────────────────────────────────────────────────────────────┘
```

### Product Hierarchy

| Product                  | Role                                 | Distribution      | Price                                                                     |
| ------------------------ | ------------------------------------ | ----------------- | ------------------------------------------------------------------------- |
| **Azure App (Standard)** | Full analysis, local files           | Azure Marketplace | €99/month (Managed Application)                                           |
| **Azure App (Team)**     | + Teams, cloud collaboration, mobile | Azure Marketplace | €299/month (TBD — price under evaluation)                                 |
| **PWA**                  | FREE (training & education)          | Public website    | Free forever (core analysis + Green Belt, copy-paste input, session-only) |

> **Note (Feb 2026):** Excel Add-in shelved — cost with no revenue, unproven funnel. The PWA serves the same funnel role (free, no friction, shows the methodology) at zero marginal cost. See original 3-product strategy below for historical context.

### Two-Plan Technical Differentiation

The ARM template passes a `VARISCOUT_PLAN` environment variable (`standard` or `team`). The existing `getTier()` infrastructure resolves plan-appropriate feature sets — both plans deploy as `enterprise` tier, but the Team plan unlocks Teams-specific capabilities.

Same ARM template is reused across both plans (Azure Marketplace supports up to 100 plans per offer). The plan variable controls:

- Storage mode: Standard = File System Access API (local `.vrs` files, fallback to IndexedDB); Team = + OneDrive personal + SharePoint channel storage
- Teams SDK initialization (Team plan only)
- Channel file storage UI (Team plan only)
- Mobile Field View route (Team plan only)
- Photo capture in findings (Team plan only)
- Admin consent guidance in settings (Team plan only)

See [ADR-016](adr-016-teams-integration.md) for full Teams integration technical design.

### Pricing Rationale

| Aspect         | Standard                             | Team                    |
| -------------- | ------------------------------------ | ----------------------- |
| Price          | €99/month                            | €299/month (TBD)        |
| Net (after 3%) | €96.03/month                         | €290.03/month           |
| Annual net     | €1,152/year                          | €3,480/year             |
| Storage        | Local files (File System Access API) | + OneDrive + SharePoint |
| Auth scopes    | `User.Read` only                     | + `Files.ReadWrite.All` |
| Admin consent  | None                                 | Required (one-time)     |

| Aspect  | Value                                              |
| ------- | -------------------------------------------------- |
| Billing | Monthly only (Managed Application limitation)      |
| Model   | Per-deployment (one subscription per Azure tenant) |

> Customer pays their own Azure infrastructure costs (App Service Plan, etc.) separately. Microsoft handles VAT/GST — prices are set excluding tax, Microsoft adds tax at checkout based on customer's billing country (e.g., 24% ALV in Finland).

**Why per-deployment pricing**: Managed Applications are per-deployment, not per-user. There is no mechanism to enforce user-count tiers within a tenant. Plans differentiate by capability (Standard vs Team), not by user count. Both plans include unlimited users in the tenant.

---

## Why Managed Application

### Offer Type Comparison

| Capability                         | Solution Template | Managed Application  |
| ---------------------------------- | :---------------: | :------------------: |
| Microsoft-billed (transactable)    |        No         |   **Yes** (3% fee)   |
| Deploys to customer's subscription |        Yes        | **Yes** (managed RG) |
| Data stays in customer's tenant    |        Yes        |       **Yes**        |
| Publisher access to customer       |        N/A        | Optional (disabled)  |
| No backend needed                  |        Yes        |       **Yes**        |
| Monthly pricing                    |  N/A (free only)  |       **Yes**        |

### Permission Model

| Setting              | Configuration | Notes                                       |
| -------------------- | ------------- | ------------------------------------------- |
| Publisher Management | **DISABLED**  | Zero publisher access to customer resources |
| Customer Access      | **ENABLED**   | Full customer control over their deployment |

These settings are **immutable after publishing** the offer in Partner Center.

**Why disable publisher access**: VariScout is a client-side SPA with no backend. There is nothing for the publisher to manage. Disabling access builds customer trust and simplifies compliance.

### Managed Application Package

The deployment package is a `.zip` file containing:

```
variscout-managed-app.zip
├── mainTemplate.json         # ARM template for resources
└── createUiDefinition.json   # Azure portal deployment wizard
```

---

## Consequences

### Benefits

1. **No backend required**
   - App deploys as Static Web App in customer's managed resource group
   - All processing in browser, data stays local
   - Zero infrastructure to maintain

2. **Microsoft handles billing**
   - 3% transaction fee (lower than Paddle's ~5% + VAT complexity)
   - Automatic VAT handling in all Microsoft markets
   - Enterprise procurement integration (purchase orders, invoicing)
   - Monthly billing with automatic renewal

3. **Simplified product model**
   - Two paid plans (Standard + Team), one free product (PWA)
   - No per-user tier confusion — plans differentiate by capability
   - No license detection complexity
   - GTM: "Try it free at variscout.com. When you're ready for your team, get it on Azure Marketplace."

4. **Distribution advantage**
   - Azure Marketplace visibility to enterprise buyers
   - AppSource visibility for Excel Add-in
   - Trust signal from Microsoft certification

5. **Data sovereignty**
   - App deploys to customer's Azure tenant
   - Data never leaves their environment
   - Meets enterprise compliance requirements

### Trade-offs

1. **Microsoft platform dependency**
   - Tied to Azure/Microsoft 365 ecosystem
   - Subject to Microsoft certification requirements
   - Marketplace listing approval process

2. **Monthly billing only**
   - Managed Applications do not support annual billing
   - Monthly billing may create higher churn risk
   - But also lower purchase friction (no large upfront commitment)

3. **PWA as free training tool**
   - PWA repositioned as free variation analysis training and education tool
   - Core analysis (I-Chart, Boxplot, Pareto, Capability, Regression) included
   - No file upload, no save, no Performance Mode (Azure App differentiators)
   - Copy-paste from Excel/Sheets + pre-loaded sample datasets

4. **Excel Add-in feature reduction**
   - Performance Mode removed from Excel (Azure App exclusive)
   - Intentional to create clear upgrade incentive
   - Core analysis remains fully functional

5. **No per-user pricing**
   - Cannot charge differently based on team size
   - Single plan must be attractive to both small teams and large organizations
   - €99/month Standard is competitive: cheaper than most alternatives for teams >2 users

---

## Azure App Tier Configuration

License tier is set by deployment — all Managed Application deployments get full features:

```typescript
// Deployment writes tier to app configuration
const tier = import.meta.env.VITE_LICENSE_TIER; // Always 'enterprise' for Managed App
```

The existing `tier.ts` infrastructure remains, with Managed Application deployments always configured as the highest tier.

---

## Excel Add-in: Shelved (Feb 2026)

The Excel Add-in was originally planned as a free marketing funnel product on AppSource. It was shelved because:

1. **Cost with no revenue** — AppSource certification, Office.js maintenance, Fluent UI theming
2. **Unproven funnel** — No evidence Excel users convert to Azure App purchasers
3. **PWA does the same job** — Free, no friction, shows the methodology, costs nothing extra to maintain
4. **Simpler GTM** — Two products (free PWA + paid Azure) is easier to explain than three

The codebase (`apps/excel-addin/`) was removed. Historical documentation preserved in this ADR for context.

---

## Migration Path

### For PWA Users

1. PWA is a genuine free product for training and education
2. Core analysis + Green Belt tools always available
3. Copy-paste from Excel/Sheets for own data analysis
4. Upgrade to Azure App for file upload, save, Performance Mode, and team features

### For New Customers

1. Start with free PWA at variscout.com (training & education)
2. Azure Marketplace for full-featured deployment (from €99/month)
3. Clear upgrade path from free PWA to Azure App

---

## Implementation Phases

### Phase 1: Documentation (This Revision)

- Updated all documentation to reflect Managed Application model
- Simplified Excel Add-in strategy (free forever, no license detection)
- Updated pricing to single plan at €150/month

### Phase 2: Core Tier Infrastructure (Complete)

- Created `packages/core/src/tier.ts` with tier configuration
- Implemented `getTier()`, `isPaidTier()`, `getMaxChannels()` functions
- Created `packages/hooks/src/useTier.ts` React hook
- Added `TierBadge` and `UpgradePrompt` UI components
- Integrated tier-aware channel limits (5 free / 1,500 paid)

### Phase 3: Azure Marketplace (Q2 2026)

- Partner Center account setup
- Managed Application offer creation
- Deployment package (mainTemplate.json + createUiDefinition.json)
- Standard plan at €99/month
- Certification and launch

### Phase 4: Excel Add-in Shelved (Feb 2026)

- Excel Add-in codebase removed
- AppSource submission cancelled
- PWA serves as the sole free funnel product

### Phase 5: Team Plan & Teams Integration (TBD)

- Add second Marketplace plan ("VariScout Team" at €299/month, price TBD)
- `VARISCOUT_PLAN` environment variable in ARM template
- Teams SDK integration (SSO, channel tabs, Adaptive Cards)
- Shared channel file storage (SharePoint) with optimistic merge
- Mobile Field View (`/field` route) for gemba investigations
- Photo comments on findings (camera capture + channel storage)
- Azure Function for On-Behalf-Of token exchange
- See [ADR-016](adr-016-teams-integration.md) for phased delivery breakdown

---

## Related Decisions

- [ADR-006: Edition System](adr-006-edition-system.md) - Superseded, kept for historical context
- [ADR-004: Offline-First](adr-004-offline-first.md) - Unchanged, still applies
- [ADR-016: Teams Integration](adr-016-teams-integration.md) - Technical design for Team plan capabilities

---

## See Also

- [Azure Marketplace Guide](../08-products/azure/marketplace.md)
- [Pricing Tiers](../08-products/azure/pricing-tiers.md)
- [ARM Template](../08-products/azure/arm-template.md)
