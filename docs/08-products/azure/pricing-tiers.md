# Pricing

VariScout Azure App pricing structure.

---

## Plan Overview

| Plan          | Price      | Users     | Features     | Billing |
| ------------- | ---------- | --------- | ------------ | ------- |
| **Full Plan** | €150/month | Unlimited | All features | Monthly |

**Model**: Per-deployment (one subscription per Azure tenant). All users in the tenant have access.

---

## Feature Highlights

All features are included in the single plan:

| Feature                  | Included |
| ------------------------ | :------: |
| **Core Analysis**        |          |
| I-Chart                  |    ✓     |
| Boxplot                  |    ✓     |
| Pareto                   |    ✓     |
| Capability (Cp/Cpk)      |    ✓     |
| Probability Plot         |    ✓     |
| Regression               |    ✓     |
| **Performance Mode**     |          |
| Multi-channel analysis   |    ✓     |
| Channel limit            |  1,500   |
| **Collaboration**        |          |
| OneDrive sync            |    ✓     |
| Shared projects          |    ✓     |
| **Integration**          |          |
| SSO (Microsoft Entra ID) |    ✓     |
| **Support**              |          |
| Email support            |    ✓     |
| Response time            |   24h    |

---

## Pricing Rationale

### Why Single Plan

Managed Applications on Azure Marketplace are **per-deployment**, not per-user. There is no mechanism to enforce different user-count tiers within a tenant. A single all-inclusive plan:

- Is simpler to market and purchase
- Eliminates "which tier do I need?" confusion
- Requires no user-count enforcement logic
- Aligns with the per-deployment billing model

### Why €150/month

€150/month (€1,800/year equivalent) is competitive with established SPC tools while reflecting the value of unlimited tenant-wide access:

- Cheaper than Minitab for any team size (Minitab charges per-seat)
- Comparable to SigmaXL for 2+ users
- Significantly cheaper than InfinityQS for any team
- No hidden infrastructure costs (runs on customer's Azure)

For a team of 10 users: €15/user/month — well below any competitor.

---

## Revenue

### Price Breakdown

```
Gross Price:     €150/month
Microsoft Fee:   -€4.50/month (3%)
Net Revenue:     €145.50/month
Annual Net:      €1,746/year
```

### Currency Table

| Region | Currency | Price/Month |
| ------ | -------- | ----------- |
| EU     | EUR      | €150        |
| US     | USD      | ~$165       |
| UK     | GBP      | ~£128       |

Microsoft handles currency conversion automatically.

---

## Billing

### Payment Processing

- **Processor**: Microsoft Commerce
- **Fee**: 3% of transaction
- **Payout**: Monthly, net 30
- **Billing cycle**: Monthly with automatic renewal

### Tax Handling

- VAT calculated and collected by Microsoft
- B2B reverse charge applies where applicable
- VAT receipts available in Azure portal

### Enterprise Procurement

Enterprise customers can use:

- Purchase orders
- Microsoft Enterprise Agreements
- Volume licensing credits

---

## Free Tier (PWA)

The PWA provides free value as a training and education tool:

| Product | Price | Features                                              |
| ------- | ----- | ----------------------------------------------------- |
| **PWA** | Free  | Core SPC: I-Chart, Boxplot, Pareto, Capability, ANOVA |

The PWA serves as a marketing funnel — users who need Performance Mode, file upload, data persistence, or team collaboration upgrade to the Azure App.

---

## Cancellation

- Cancel any time in Azure portal
- Service continues until end of billing period
- No prorated refunds for partial months
- Data remains in customer's tenant after cancellation

---

## Discounts

### Volume Discounts

For customers needing multi-tenant deployments (e.g., multi-site manufacturing):

| Tenants | Discount |
| ------- | -------- |
| 2-5     | 10%      |
| 6-10    | 15%      |
| 11+     | Custom   |

Contact sales for multi-tenant pricing.

### Academic Discount

- 50% off for verified educational institutions
- Requires .edu email verification

---

## Competitor Comparison

| Product    | Entry Price | Team of 10     | Deployment      |
| ---------- | ----------- | -------------- | --------------- |
| VariScout  | €150/month  | €150/month     | Customer Azure  |
| Minitab    | ~€150/month | ~€1,500/month  | Minitab Cloud   |
| JMP        | ~€200/month | ~€2,000/month  | Local/SAS Cloud |
| SigmaXL    | ~€21/month  | ~€83/month     | Excel Add-in    |
| InfinityQS | Custom      | ~$4,000+/month | SaaS            |

### VariScout Advantages

- **Flat pricing** regardless of team size
- **Customer-controlled data** (no vendor lock-in)
- **No backend costs** for publisher
- **Microsoft billing integration** (familiar for enterprises)

---

## See Also

- [Azure Marketplace Guide](marketplace.md)
- [Products Overview](../index.md)
- [ADR-007: Distribution Strategy](../../07-decisions/adr-007-azure-marketplace-distribution.md)
