# Products

VariScout is a 2-product model: **free PWA** for learning and training, **paid Azure App** for teams.

> **GTM:** "Try it free at variscout.com. When you're ready for your team, get it on Azure Marketplace."

---

## Distribution Hierarchy

Per [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md):

```mermaid
flowchart LR
    subgraph Paid["Paid Product"]
        A[Azure App<br/>€150/month]
    end

    subgraph Free["Free Product"]
        C[PWA<br/>Free Training Tool]
    end

    C -->|"Need file upload, save, teams"| A
```

## Product Matrix

| Product                         | Status      | Distribution      | Use Case              | Pricing        |
| ------------------------------- | ----------- | ----------------- | --------------------- | -------------- |
| **[Azure App](azure/index.md)** | **PRIMARY** | Azure Marketplace | Teams & enterprises   | €150/month     |
| [PWA](pwa/index.md)             | Production  | Direct URL        | Training & education  | FREE (forever) |
| [Power BI](powerbi/index.md)    | Planned     | AppSource         | Dashboard integration | TBD            |
| [Website](website/index.md)     | Production  | Public            | Marketing & docs      | N/A            |

!!! tip "Getting Started"
**Free**: Start with the [PWA](pwa/index.md) — free training tool with copy-paste input and 16 sample datasets. Upgrade to the [Azure App](azure/index.md) for file upload, save/persistence, Performance Mode, and team features.

---

## Distribution Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  VariScout on Azure Marketplace (PRIMARY)                   │
│                                                             │
│  Single Plan       €150/month   All features               │
│                                  Unlimited users in tenant  │
│                                                             │
│  Offer type: Managed Application                           │
│  Billing: Microsoft (3% fee, monthly)                      │
│  Data: Stays in customer's Azure tenant                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Comparison

| Feature          | Azure App | PWA (Free) | Power BI         |
| ---------------- | --------- | ---------- | ---------------- |
| I-Chart          | ✓         | ✓          | Planned          |
| Boxplot          | ✓         | ✓          | Planned          |
| Pareto           | ✓         | ✓          | Planned          |
| Capability       | ✓         | ✓          | Planned          |
| Regression       | ✓         | ✓          | -                |
| Gage R&R         | ✓         | ✓          | -                |
| Performance Mode | ✓         | -          | -                |
| File Upload      | ✓         | -          | -                |
| Save/Persistence | ✓         | -          | Power BI Service |
| Drill-Down       | ✓         | ✓          | Native           |
| Linked Filtering | ✓         | ✓          | Native           |
| Offline          | Cached    | ✓          | -                |
| Cloud Sync       | OneDrive  | -          | Power BI Service |
| SSO              | Microsoft | -          | Microsoft        |

---

## Pricing (Azure App)

| Aspect      | Value                                              |
| ----------- | -------------------------------------------------- |
| Price       | €150/month (all features, unlimited users)         |
| Billing     | Monthly (Microsoft handles billing, 3% fee)        |
| Net revenue | €145.50/month (€1,746/year)                        |
| Model       | Per-deployment (one subscription per Azure tenant) |

All features included:

- All chart types and analysis features
- Performance Mode (multi-channel Cpk)
- Microsoft Entra ID (Azure AD) SSO
- OneDrive project sync
- Offline support (cached)
- Data stays in customer's Azure tenant

---

## Architecture

Both products share the same core packages:

```
@variscout/core     → Statistics, parsing, types
@variscout/charts   → Visx chart components
@variscout/hooks    → Shared React hooks
@variscout/ui       → UI utilities
```

This ensures:

- Identical statistical calculations across platforms
- Consistent chart appearance
- Shared methodology (Four Lenses)

---

## Deployment Models

| Product   | Deployment                             | Data Location               | License                          |
| --------- | -------------------------------------- | --------------------------- | -------------------------------- |
| Azure App | Managed Application to customer tenant | Customer's Azure + OneDrive | Deployment config (all features) |
| PWA       | Static hosting (public)                | Browser (session only)      | Free forever (training)          |
| Power BI  | AppSource                              | Power BI Service            | TBD                              |

---

## Support Model

| Level     | Included In | Support Channel      |
| --------- | ----------- | -------------------- |
| Community | PWA         | GitHub Issues        |
| Standard  | Azure App   | Email (24h response) |

---

## See Also

- [ADR-007: Azure Marketplace Distribution](../07-decisions/adr-007-azure-marketplace-distribution.md)
- [Azure Marketplace Guide](azure/marketplace.md)
