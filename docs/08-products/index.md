# Products

VariScout is available across multiple platforms via Microsoft's distribution channels.

---

## Product Matrix

| Product                        | Platform         | Status         | Distribution      | Primary Use Case          |
| ------------------------------ | ---------------- | -------------- | ----------------- | ------------------------- |
| [Azure App](azure/index.md)    | Microsoft Azure  | **Production** | Azure Marketplace | Teams & enterprises       |
| [Excel Add-in](excel/index.md) | Microsoft Excel  | Production     | AppSource (FREE)  | Excel-native workflows    |
| [PWA](pwa/index.md)            | Web Browser      | Internal/Demo  | Direct URL        | Evaluation & demos        |
| [Power BI](powerbi/index.md)   | Power BI Service | Planned        | AppSource         | Dashboard integration     |
| [Website](website/index.md)    | Web              | Production     | Public            | Marketing & documentation |

> **Note**: The PWA is deprecated as a commercial product. It remains available for evaluation, demos, and as the reference implementation.

---

## Distribution Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  VariScout on Azure Marketplace (PRIMARY)                   │
│                                                             │
│  Individual Plan     €99/year    Single user               │
│  Team Plan           €499/year   Up to 10 users            │
│  Enterprise Plan     €1,790/year Unlimited tenant users    │
│                                                             │
│  Billing: Microsoft (3% fee)                               │
│  Data: Stays in customer's Azure tenant                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Excel Add-in on AppSource (FREE)                          │
│                                                             │
│  • Free tier: Basic features for all users                 │
│  • Full tier: Auto-unlocks when tenant has Azure App       │
│  • Detection: Graph API checks for Azure App registration  │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Comparison

| Feature          | Azure App | Excel       | PWA (Demo) | Power BI         |
| ---------------- | --------- | ----------- | ---------- | ---------------- |
| I-Chart          | ✓         | ✓           | ✓          | Planned          |
| Boxplot          | ✓         | ✓           | ✓          | Planned          |
| Pareto           | ✓         | ✓           | ✓          | Planned          |
| Capability       | ✓         | ✓           | ✓          | Planned          |
| Regression       | ✓         | ✓           | ✓          | -                |
| Gage R&R         | ✓         | ✓           | ✓          | -                |
| Performance Mode | ✓         | ✓           | ✓          | -                |
| Drill-Down       | ✓         | Via slicers | ✓          | Native           |
| Linked Filtering | ✓         | Via slicers | ✓          | Native           |
| Offline          | Cached    | ✓           | ✓          | -                |
| Cloud Sync       | OneDrive  | OneDrive    | -          | Power BI Service |
| SSO              | Microsoft | Microsoft   | -          | Microsoft        |

---

## Pricing Tiers (Azure App)

| Tier       | Price/Year | Users     | Features                              |
| ---------- | ---------- | --------- | ------------------------------------- |
| Individual | €99        | 1         | Full analysis, OneDrive sync          |
| Team       | €499       | Up to 10  | + Shared projects, collaboration      |
| Enterprise | €1,790     | Unlimited | + Priority support, custom deployment |

All tiers include:

- All chart types and analysis features
- Microsoft Entra ID (Azure AD) SSO
- OneDrive project sync
- Offline support (cached)
- Data stays in customer's Azure tenant

---

## Architecture

All products share the same core packages:

```
@variscout/core     → Statistics, parsing, types
@variscout/charts   → Visx chart components
@variscout/hooks    → Shared React hooks
@variscout/ui       → UI utilities
```

This ensures:

- Identical statistical calculations across platforms
- Consistent chart appearance
- Shared methodology (Four Pillars)

---

## Deployment Models

| Product      | Deployment                      | Data Location               | License Detection        |
| ------------ | ------------------------------- | --------------------------- | ------------------------ |
| Azure App    | ARM template to customer tenant | Customer's Azure + OneDrive | Deployment tier config   |
| Excel Add-in | AppSource or sideload           | Excel workbook              | Graph API (tenant check) |
| PWA          | Static hosting (internal)       | Browser (IndexedDB)         | N/A (demo only)          |
| Power BI     | AppSource                       | Power BI Service            | TBD                      |

---

## Support Model

| Tier       | Included In            | Support Channel               |
| ---------- | ---------------------- | ----------------------------- |
| Community  | Free Excel Add-in tier | GitHub Issues                 |
| Standard   | Individual Azure tier  | Email (48h response)          |
| Team       | Team Azure tier        | Email (24h response)          |
| Enterprise | Enterprise Azure tier  | Email + deployment assistance |

---

## See Also

- [ADR-007: Azure Marketplace Distribution](../07-decisions/adr-007-azure-marketplace-distribution.md)
- [Azure Marketplace Guide](azure/marketplace.md)
- [Excel AppSource Guide](excel/appsource.md)
