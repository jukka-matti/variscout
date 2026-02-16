# Azure App (Primary Product)

VariScout for Microsoft 365 enterprises - the only paid product, distributed via Azure Marketplace as a Managed Application.

---

## Overview

The Azure App is the **only paid VariScout product**, offering:

- Full-featured variation analysis (all chart types + Performance Mode)
- Microsoft Entra ID (Azure AD) authentication
- OneDrive sync for projects
- Team collaboration features
- Customer-controlled data (stays in their Azure tenant)

**No backend required** - deploys entirely to the customer's Azure tenant.

---

## Distribution

VariScout Azure App is available on **Azure Marketplace** as a Managed Application:

| Aspect           | Value                                        |
| ---------------- | -------------------------------------------- |
| Offer type       | Managed Application                          |
| Price            | €150/month (all features, unlimited users)   |
| Billing          | Monthly (Microsoft, 3% fee)                  |
| Net revenue      | €145.50/month (€1,746/year)                  |
| Publisher access | Disabled (zero access to customer resources) |
| Customer access  | Full control                                 |

All features included:

- All chart types and analysis features
- Performance Mode (multi-channel Cpk analysis)
- Microsoft Entra ID SSO
- OneDrive project sync
- Offline support (cached)
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
│  │              AZURE STATIC WEB APP                         │  │
│  │         (Deployed via Managed Application)                │  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────────┐ │  │
│  │   │              VARISCOUT AZURE APP                    │ │  │
│  │   │   React SPA + MSAL + OneDrive Integration          │ │  │
│  │   └─────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 MICROSOFT ENTRA ID                        │  │
│  │              (App Registration + MSAL)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      ONEDRIVE                             │  │
│  │              (Project sync & sharing)                     │  │
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
- Stores projects in customer's OneDrive
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

All Managed Application deployments get full features:

```typescript
// Deployment configuration always sets enterprise tier
const tier = import.meta.env.VITE_LICENSE_TIER; // Always 'enterprise' for Managed App
```

---

## Features

| Feature          | Description                                |
| ---------------- | ------------------------------------------ |
| SSO              | Microsoft Entra ID via MSAL                |
| Cloud Sync       | Projects saved to OneDrive                 |
| Sharing          | Share projects with team members           |
| Offline          | Cached locally, syncs when online          |
| All Chart Types  | I-Chart, Boxplot, Pareto, Capability, etc. |
| Performance Mode | Multi-channel Cpk analysis                 |
| Drill-Down       | Interactive filter navigation              |

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
  --template-file mainTemplate.json
```

See [ARM Template Documentation](arm-template.md) for details.

---

## Data Location

All data stays in the customer's tenant:

| Data Type      | Location                        |
| -------------- | ------------------------------- |
| App hosting    | Customer's Azure Static Web App |
| Projects       | User's OneDrive                 |
| Settings       | Browser localStorage            |
| Authentication | Customer's Entra ID             |

**No data sent to VariScout servers.**

---

## Excel Add-in Companion

The [Excel Add-in](../excel/index.md) is a **free companion product** available on AppSource:

- Provides core SPC charts (I-Chart, Boxplot, Pareto, Capability)
- Always free — no license detection needed
- Performance Mode and advanced analysis are Azure App exclusive
- Serves as a marketing funnel for users who need full features

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

- [Azure Marketplace Guide](marketplace.md)
- [Pricing](pricing-tiers.md)
- [ARM Template](arm-template.md)
- [Authentication (EasyAuth)](authentication.md)
- [OneDrive Sync](onedrive-sync.md)
- [ADR-007: Azure Marketplace Distribution](../../07-decisions/adr-007-azure-marketplace-distribution.md)
