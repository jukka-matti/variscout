---
tier: stable
purpose: orient
title: 'Azure App (Primary Product)'
audience: human
category: reference
status: active
layer: L5
---

# Azure App (Primary Product)

VariScout for Microsoft 365 enterprises - the paid product line, distributed via Azure Marketplace as a Managed Application.

---

## Overview

The Azure App is the **only paid VariScout product** — single SKU at €120/month per Azure tenant per [ADR-082](../../07-decisions/adr-082-wedge-architecture.md). The legacy Standard (€79) / Team (€199) two-plan model is retired.

All chart types, Performance Mode, CoScout AI, Blob Storage sync, project membership, Knowledge Catalyst, and organizational learning are included in the single SKU. Customer-controlled data stays in their Azure tenant.

VariScout processing runs in the browser and deploys entirely to the customer's Azure tenant.

---

## Distribution

VariScout Azure App is available on **Azure Marketplace** as a Managed Application:

| Aspect           | Value                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Offer type       | Managed Application                                                                            |
| Price            | €120/month per tenant (single SKU)                                                             |
| Plans            | Single plan — full analysis + AI + Blob Storage sync + project membership + Knowledge Catalyst |
| Billing          | Monthly (Microsoft, 3% fee)                                                                    |
| Publisher access | Disabled (zero access to customer resources)                                                   |
| Customer access  | Full control                                                                                   |

All included in single €120/month SKU:

- All chart types and analysis features
- Performance Mode (multi-channel Cpk analysis)
- Microsoft Entra ID SSO (EasyAuth)
- Local-cache capable browser experience
- Blob Storage analysis sync in the customer's tenant
- Shared Process Hub and investigation persistence (project membership: Lead / Member / Sponsor)
- Photo evidence with EXIF stripping
- Knowledge Catalyst over customer-owned documents and investigation artifacts
- Organizational learning from resolved findings
- AI-enhanced CoScout assistant with methodology grounding
- Data stays in customer's Azure tenant

**Billing**: Handled by Microsoft (3% fee). Supports enterprise procurement with purchase orders and invoicing.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOMER AZURE TENANT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              AZURE APP SERVICE                            │  │
│  │         (Deployed via Managed Application)                │  │
│  │         (WEBSITE_RUN_FROM_PACKAGE — static zip)           │  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────────┐ │  │
│  │   │              VARISCOUT AZURE APP                    │ │  │
│  │   │   React SPA + EasyAuth + Blob Storage              │ │  │
│  │   └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────────┐ │  │
│  │   │              EASYAUTH (authsettingsV2)              │ │  │
│  │   │   Platform-level Azure AD authentication            │ │  │
│  │   │   Platform-level session handling                  │ │  │
│  │   └─────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 MICROSOFT ENTRA ID                        │  │
│  │          (Customer-provided App Registration)             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  BLOB STORAGE (Azure App)                  │  │
│  │          (Shared projects, hubs, and artifacts)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

        ↑
        │ No data leaves customer tenant
        │ No external API calls
        │ No backend servers
        │ Publisher management DISABLED
        ↓

┌─────────────────────────────────────────────────────────────────┐
│               VARISCOUT (Publisher)                             │
│                                                                 │
│  • Azure Marketplace listing                                    │
│  • Managed Application package distribution                     │
│  • Documentation & support                                      │
│  • No access to customer data or resources                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Benefits

### No Backend Required

Unlike traditional SaaS, VariScout Azure App:

- Deploys entirely to customer's Azure tenant
- Processes all data in-browser
- Stores analyses in IndexedDB (local cache) + customer-tenant Blob Storage (sync)
- Makes zero calls to external servers

This architecture ensures:

- **Compliance**: Data never leaves the customer's environment
- **Simplicity**: No backend infrastructure for us to maintain
- **Security**: Customer controls all access and data

### Microsoft-Integrated Billing

| Feature           | Benefit                                   |
| ----------------- | ----------------------------------------- |
| Azure Marketplace | Enterprise buyers trust Microsoft         |
| Microsoft billing | Integrates with existing Azure agreements |
| Purchase orders   | Enterprise procurement support            |
| VAT handling      | Microsoft handles international tax       |

### Single SKU Configuration

All Managed Application deployments get the full feature set — no plan parameter needed:

```typescript
// Single SKU: all features available for all Managed App deployments
// Project-membership-role gating (Lead / Member / Sponsor) replaces tier-gating
// See: @variscout/core/projectMembership canAccess()
```

---

## Features

| Feature            | Description                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| SSO                | Microsoft Entra ID via EasyAuth                                                   |
| Blob Storage sync  | Analyses, hubs, and artifacts synced to customer-tenant Blob Storage              |
| Project membership | Shared Process Hubs and investigations via Blob Storage (Lead / Member / Sponsor) |
| Local cache        | IndexedDB persistence/cache; syncs to Blob Storage when online                    |
| All Chart Types    | I-Chart, Boxplot, Pareto, Capability, etc.                                        |
| Performance Mode   | Multi-channel Cpk analysis                                                        |
| Presentation       | Full-screen chart overview + focused single-chart navigation                      |
| Report View        | Dynamic story-driven report with copy-as-slide and Teams sharing                  |
| Drill-Down         | Interactive filter navigation                                                     |

---

## Process Hub Context

The Azure App uses Process Hub as the shared operating context for recurring process-owner cadence and team improvement. Hub context is deterministic and customer-owned: investigations, Survey readiness, findings, actions, verification, sustainment decisions, and Blob-backed artifacts form the durable process memory. CoScout can later read this context, but it does not own a separate hidden memory layer. See [ADR-072](../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md).

---

## Deployment

One-click deployment from Azure Marketplace:

1. **Find** VariScout on Azure Marketplace
2. **Click** "Create"
3. **Configure** app name and region
4. **Deploy** to your Azure subscription (managed resource group)
5. **Access** at your custom Azure URL

### Manual Deployment (ARM Template)

For development/testing, deploy directly with Azure CLI:

```bash
az deployment group create \
  --resource-group rg-variscout \
  --template-file infra/mainTemplate.json
```

See [ARM Template Documentation](arm-template.md) for details.

### Staging (CI/CD)

For development and validation, a staging environment is deployed automatically:

- **URL**: `https://variscout-staging.azurewebsites.net`
- **Trigger**: Push to `main` (path-filtered) or manual `workflow_dispatch`
- **Auth**: GitHub OIDC → Azure (no stored credentials)

See [Deployment Guide](../../05-technical/implementation/deployment.md) for pipeline details.

---

## Data Location

All data stays in the customer's tenant:

| Data Type      | Standard                     | Team                           |
| -------------- | ---------------------------- | ------------------------------ |
| App hosting    | Customer's Azure App Service | Customer's Azure App Service   |
| Analyses       | IndexedDB                    | Blob Storage + IndexedDB cache |
| Process Hubs   | IndexedDB                    | Blob Storage + IndexedDB cache |
| Photos         | N/A                          | Blob Storage artifacts         |
| Settings       | Browser localStorage         | Browser localStorage           |
| Authentication | Customer's Entra ID          | Customer's Entra ID            |

**No data sent to VariScout servers.**

---

## Development Tools

### DevTierSwitcher

The Azure app includes a development-only tier switching component at `apps/azure/src/components/DevTierSwitcher.tsx`:

- Fixed-position panel to quickly switch between tiers during development
- Only renders when `import.meta.env.DEV === true`
- Persists tier override in `localStorage`
- Triggers page reload to reinitialize all tier-dependent state

---

## See Also

- [How It Works](how-it-works.md) — end-to-end architecture guide
- [Azure Marketplace Guide](marketplace.md)
- [Pricing](../../archive/products/pricing-tiers.md) (archived — superseded by single €120 SKU per ADR-082)
- [ARM Template](arm-template.md)
- [Authentication (EasyAuth)](authentication.md)
- [Blob Storage Sync](blob-storage-sync.md)
- [Storage](storage.md) — IndexedDB schema, sync queue, persistence model
- [Submission Checklist](submission-checklist.md) — Marketplace submission preparation
- [Certification Guide](certification-guide.md) — Azure Marketplace certification preparation
- [AI Safety Report](ai-safety-report.md) — CoScout AI safety compliance template
- [ADR-007: Azure Marketplace Distribution](../../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-059: Web-First Deployment Architecture](../../07-decisions/adr-059-web-first-deployment-architecture.md)
- [ADR-072: Process Hub Storage and CoScout Context Boundary](../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md)
- [Marketplace Readiness Report](marketplace-readiness-report.md) — Marketplace submission readiness assessment
