---
title: 'Products'
audience: [business, product]
category: strategy
status: stable
---

# Products

VariScout is a 2-product model: **free PWA** for learning and training, **paid Azure App** for teams.

> **GTM:** "Try it free at variscout.com. When you're ready for your team, get it on Azure Marketplace."

---

## Distribution Hierarchy

Per [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md):

```mermaid
flowchart LR
    subgraph Paid["Paid Product"]
        A1[Azure Standard<br/>€79/month]
        A2[Azure Team<br/>€199/month]
    end

    subgraph Free["Free Product"]
        C[PWA<br/>Free Training Tool]
    end

    C -->|"Need file upload, save, Performance Mode, AI"| A1
    A1 -->|"Need Teams, OneDrive, SharePoint, mobile, Knowledge Base & Catalyst"| A2
```

## Product Matrix

| Product                              | Status      | Distribution      | Use Case                                             | Pricing        |
| ------------------------------------ | ----------- | ----------------- | ---------------------------------------------------- | -------------- |
| **[Azure Standard](azure/index.md)** | **PRIMARY** | Azure Marketplace | Full analysis with CoScout AI, local files           | €79/month      |
| **[Azure Team](azure/index.md)**     | **PRIMARY** | Azure Marketplace | + Teams, OneDrive, mobile, Knowledge Base & Catalyst | €199/month     |
| [PWA](pwa/index.md)                  | Production  | Direct URL        | Training & education                                 | FREE (forever) |
| Power BI (archived)                  | Shelved     | —                 | Dashboard integration (not in development)           | —              |
| [Website](website/index.md)          | Production  | Public            | Marketing & docs                                     | N/A            |

:::tip[Getting Started]
**Free**: Start with the [PWA](pwa/index.md) — free training tool with copy-paste input and 16 sample datasets. Upgrade to the [Azure App](azure/index.md) for file upload, save/persistence, Performance Mode, and team features.
:::

---

## Distribution Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  VariScout on Azure Marketplace (PRIMARY)                   │
│                                                             │
│  Standard Plan     €79/month    Full analysis + CoScout AI  │
│  Team Plan         €199/month   + Teams, OneDrive, mobile,  │
│                                   Knowledge Base & Catalyst │
│                                  Unlimited users in tenant  │
│                                                             │
│  Offer type: Managed Application                           │
│  Billing: Microsoft (3% fee, monthly)                      │
│  Data: Stays in customer's Azure tenant                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Comparison

| Feature          | Azure App | PWA (Free) |
| ---------------- | --------- | ---------- |
| I-Chart          | ✓         | ✓          |
| Boxplot          | ✓         | ✓          |
| Pareto           | ✓         | ✓          |
| Capability       | ✓         | ✓          |
| Performance Mode | ✓         | -          |
| File Upload      | ✓         | -          |
| Save/Persistence | ✓         | -          |
| Drill-Down       | ✓         | ✓          |
| Linked Filtering | ✓         | ✓          |
| Offline          | Cached    | ✓          |
| Cloud Sync       | OneDrive  | -          |
| SSO              | Microsoft | -          |

---

## Pricing (Azure App)

| Plan     | Price      | Net Revenue         | Includes                                                                 |
| -------- | ---------- | ------------------- | ------------------------------------------------------------------------ |
| Standard | €79/month  | €76.63/month (−3%)  | Full analysis, CoScout AI, file upload, save, SSO, offline               |
| Team     | €199/month | €193.03/month (−3%) | + Teams, OneDrive, SharePoint, mobile, photos, Knowledge Base & Catalyst |

| Aspect  | Value                                              |
| ------- | -------------------------------------------------- |
| Billing | Monthly (Microsoft handles billing, 3% fee)        |
| Model   | Per-deployment (one subscription per Azure tenant) |

**Standard** — all chart types, Performance Mode, CoScout AI, Microsoft SSO, offline support, data stays in customer's Azure tenant.

**Team** — everything in Standard, plus Teams integration, OneDrive/SharePoint sync, mobile access, photo evidence, Knowledge Base (SharePoint team file search), and Knowledge Catalyst (organizational learning from resolved findings).

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

---

## Support Model

| Level     | Included In | Support Channel      |
| --------- | ----------- | -------------------- |
| Community | PWA         | GitHub Issues        |
| Standard  | Azure App   | Email (24h response) |

---

## Tier Philosophy

Why features are gated where they are — the reasoning behind VariScout's product tiers, upgrade triggers, and capability maturity model.

[:octicons-arrow-right-24: Tier Philosophy](tier-philosophy.md)

---

## See Also

- [ADR-007: Azure Marketplace Distribution](../07-decisions/adr-007-azure-marketplace-distribution.md)
- [Azure Marketplace Guide](azure/marketplace.md)
- [Tier Philosophy](tier-philosophy.md)
