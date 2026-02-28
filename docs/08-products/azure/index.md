# Azure App (Primary Product)

VariScout for Microsoft 365 enterprises - the only paid product, distributed via Azure Marketplace as a Managed Application.

---

## Overview

The Azure App is the **only paid VariScout product**, available in two plans:

- **Standard (€99/month)**: Full analysis features, local file storage, EasyAuth SSO
- **Team (€299/month)**: Everything in Standard + OneDrive/SharePoint sync, Teams integration, channel storage, photo capture

Both plans include all chart types, Performance Mode, and customer-controlled data (stays in their Azure tenant).

**No backend required** - deploys entirely to the customer's Azure tenant.

---

## Distribution

VariScout Azure App is available on **Azure Marketplace** as a Managed Application:

| Aspect           | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Offer type       | Managed Application                                                   |
| Price            | €99/month (Standard) or €299/month (Team)                             |
| Plans            | Standard (local files) or Team (+ OneDrive/SharePoint, Teams, photos) |
| Billing          | Monthly (Microsoft, 3% fee)                                           |
| Publisher access | Disabled (zero access to customer resources)                          |
| Customer access  | Full control                                                          |

Both plans include:

- All chart types and analysis features
- Performance Mode (multi-channel Cpk analysis)
- Microsoft Entra ID SSO (EasyAuth)
- Offline support (cached)
- Data stays in customer's Azure tenant

Team plan adds:

- Teams SDK integration (channel tabs, SSO)
- OneDrive/SharePoint analysis sync
- Channel storage for shared projects
- Photo capture with EXIF stripping

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
│  │   │   React SPA + EasyAuth + OneDrive (Team plan)      │ │  │
│  │   └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────────┐ │  │
│  │   │              EASYAUTH (authsettingsV2)              │ │  │
│  │   │   Platform-level Azure AD authentication            │ │  │
│  │   │   Token store for Graph API access                  │ │  │
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
│  │                  ONEDRIVE (Team plan only)                 │  │
│  │              (Analysis sync via Graph API)                │  │
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
- Stores analyses locally (Standard) or in customer's OneDrive (Team)
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

### Tier Configuration

All Managed Application deployments get full analysis features. The plan determines collaboration capabilities:

```typescript
// Tier: always enterprise for Managed App deployments
const tier = import.meta.env.VITE_LICENSE_TIER; // Always 'enterprise'

// Plan: determines storage and collaboration features
const plan = import.meta.env.VARISCOUT_PLAN; // 'standard' or 'team'
```

---

## Features

| Feature          | Plan | Description                                                  |
| ---------------- | ---- | ------------------------------------------------------------ |
| SSO              | Both | Microsoft Entra ID via EasyAuth                              |
| Cloud Sync       | Team | Analyses saved to OneDrive                                   |
| Sharing          | Team | Share analyses with team members via OneDrive/SharePoint     |
| Offline          | Both | Cached locally; Team plan syncs when online                  |
| All Chart Types  | Both | I-Chart, Boxplot, Pareto, Capability, etc.                   |
| Performance Mode | Both | Multi-channel Cpk analysis                                   |
| Presentation     | Both | Full-screen chart overview + focused single-chart navigation |
| Drill-Down       | Both | Interactive filter navigation                                |

---

## Teams Integration

The Team plan includes Microsoft Teams SDK integration, enabling VariScout to run as a Teams channel tab with silent SSO via the On-Behalf-Of (OBO) flow. Channel tabs store projects in the channel's SharePoint document library, and users can capture photos directly from the shop floor with automatic EXIF/GPS stripping. See [ADR-016: Teams Integration](../../07-decisions/adr-016-teams-integration.md) for the full technical design.

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

| Data Type      | Standard                     | Team                                      |
| -------------- | ---------------------------- | ----------------------------------------- |
| App hosting    | Customer's Azure App Service | Customer's Azure App Service              |
| Analyses       | Local files (browser)        | OneDrive (personal) or channel SharePoint |
| Photos         | N/A                          | Channel SharePoint (`Photos/` folder)     |
| Settings       | Browser localStorage         | Browser localStorage                      |
| Authentication | Customer's Entra ID          | Customer's Entra ID (+ Teams SSO)         |

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
- [Pricing](pricing-tiers.md)
- [ARM Template](arm-template.md)
- [Authentication (EasyAuth)](authentication.md)
- [OneDrive Sync](onedrive-sync.md)
- [Storage](storage.md) — IndexedDB schema, sync queue, persistence model
- [Submission Checklist](submission-checklist.md) — Marketplace submission preparation
- [ADR-007: Azure Marketplace Distribution](../../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-016: Teams Integration](../../07-decisions/adr-016-teams-integration.md)
- [ADR-016: Security Evaluation](../../07-decisions/adr-016-security-evaluation.md)
