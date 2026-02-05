# Azure App (Primary Product)

VariScout for Microsoft 365 enterprises - the primary distribution channel via Azure Marketplace.

---

## Overview

The Azure App is the **primary VariScout product**, offering:

- Full-featured variation analysis
- Microsoft Entra ID (Azure AD) authentication
- OneDrive sync for projects
- Team collaboration features
- Customer-controlled data (stays in their Azure tenant)

**No backend required** - deploys entirely to the customer's Azure tenant.

---

## Distribution

VariScout Azure App is available on **Azure Marketplace** with three pricing tiers:

| Tier       | Price/Year | Users     | Target Customer                 |
| ---------- | ---------- | --------- | ------------------------------- |
| Individual | €99        | 1         | Quality engineers, consultants  |
| Team       | €499       | Up to 10  | Small QA teams, departments     |
| Enterprise | €1,790     | Unlimited | Manufacturing companies, plants |

All tiers include:

- All chart types and analysis features
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
│  │            (Deployed via ARM Template)                    │  │
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
        ↓

┌─────────────────────────────────────────────────────────────────┐
│               VARISCOUT (Publisher)                             │
│                                                                 │
│  • Azure Marketplace listing                                    │
│  • ARM template distribution                                    │
│  • Documentation & support                                      │
│  • No access to customer data                                   │
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

### License Detection

License tier is set at deployment time via ARM template parameters:

```typescript
// Deployment configuration sets tier
const tier = import.meta.env.VITE_LICENSE_TIER; // 'individual' | 'team' | 'enterprise'

// Feature gating based on tier
if (tier === 'enterprise') {
  // Enable unlimited users
}
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
2. **Select** pricing tier (Individual/Team/Enterprise)
3. **Deploy** to your Azure subscription
4. **Configure** app registration (automated)
5. **Access** at your custom Azure URL

### Manual Deployment (ARM Template)

For advanced scenarios, deploy directly with Azure CLI:

```bash
az deployment group create \
  --resource-group rg-variscout \
  --template-uri https://raw.githubusercontent.com/variscout/azure-deploy/main/azuredeploy.json \
  --parameters tier=team
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

## Excel Add-in Integration

Customers with Azure App deployment automatically unlock full features in the [Excel Add-in](../excel/index.md):

- Excel Add-in is FREE on AppSource
- Detects Azure deployment via Graph API
- Auto-unlocks full tier when Azure App is present
- Provides seamless Excel workflow integration

See [License Detection](../excel/license-detection.md) for implementation details.

---

## See Also

- [Azure Marketplace Guide](marketplace.md)
- [Pricing Tiers](pricing-tiers.md)
- [ARM Template](arm-template.md)
- [MSAL Authentication](msal-auth.md)
- [OneDrive Sync](onedrive-sync.md)
- [ADR-007: Azure Marketplace Distribution](../../07-decisions/adr-007-azure-marketplace-distribution.md)
