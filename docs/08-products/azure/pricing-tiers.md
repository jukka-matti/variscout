# Pricing Tiers

VariScout Azure App pricing structure and tier definitions.

---

## Tier Overview

| Tier       | Price/Year | Users     | Target Customer                 |
| ---------- | ---------- | --------- | ------------------------------- |
| Individual | €99        | 1         | Quality engineers, consultants  |
| Team       | €499       | Up to 10  | Small QA teams, departments     |
| Enterprise | €1,790     | Unlimited | Manufacturing companies, plants |

---

## Feature Matrix

| Feature                  | Individual | Team | Enterprise |
| ------------------------ | ---------- | ---- | ---------- |
| **Core Analysis**        |            |      |            |
| I-Chart                  | ✓          | ✓    | ✓          |
| Boxplot                  | ✓          | ✓    | ✓          |
| Pareto                   | ✓          | ✓    | ✓          |
| Capability (Cp/Cpk)      | ✓          | ✓    | ✓          |
| Regression               | ✓          | ✓    | ✓          |
| Gage R&R                 | ✓          | ✓    | ✓          |
| **Performance Mode**     |            |      |            |
| Multi-channel analysis   | ✓          | ✓    | ✓          |
| Channel limit            | 200        | 500  | Unlimited  |
| **Collaboration**        |            |      |            |
| OneDrive sync            | ✓          | ✓    | ✓          |
| Shared projects          | -          | ✓    | ✓          |
| Team dashboard           | -          | ✓    | ✓          |
| **Integration**          |            |      |            |
| Excel Add-in unlock      | ✓          | ✓    | ✓          |
| SSO (Microsoft Entra ID) | ✓          | ✓    | ✓          |
| **Support**              |            |      |            |
| Email support            | ✓          | ✓    | ✓          |
| Response time            | 48h        | 24h  | 8h         |
| Deployment assistance    | -          | -    | ✓          |
| Custom training          | -          | -    | ✓          |

---

## Individual Plan (€99/year)

### Target User

- Quality engineers working independently
- Consultants doing capability assessments
- Small business quality managers

### Key Features

- Full analysis capabilities (all chart types)
- Performance Mode (up to 200 channels)
- Personal OneDrive sync
- Excel Add-in integration
- Standard email support (48h response)

### Limitations

- Single user only
- No project sharing
- No team features

### Pricing Rationale

€99/year (~€8/month) is competitive with:

- Minitab: €150+/month
- JMP: €200+/month
- SigmaXL: €249/year

Lower price point because:

- No server costs (customer's Azure)
- Targeted feature set (SPC focus)
- Self-service deployment

---

## Team Plan (€499/year)

### Target User

- QA departments (5-10 people)
- Manufacturing teams
- Quality consulting firms

### Key Features

Everything in Individual, plus:

- Up to 10 users
- Shared project folders (OneDrive)
- Team dashboard with project overview
- Priority email support (24h response)
- Higher channel limit (500)

### Pricing Rationale

€499/year ≈ €50/user/year for 10 users

Breakeven vs Individual: 5 users

- 5 × €99 = €495
- Team plan: €499

Attractive for any team >5 users.

---

## Enterprise Plan (€1,790/year)

### Target User

- Manufacturing plants
- Large organizations
- Multi-site deployments

### Key Features

Everything in Team, plus:

- Unlimited users in tenant
- Unlimited channels in Performance Mode
- Priority support (8h response)
- Deployment assistance
- Custom training sessions
- Named account manager (optional)

### Pricing Rationale

€1,790/year ≈ 18 Individual licenses

Breakeven scenarios:

- vs Individual: 18 users
- vs Team: 4 team licenses (40 users)

Attractive for any organization with 20+ users.

---

## Billing

### Payment Processing

- **Processor**: Microsoft Commerce
- **Fee**: 3% of transaction
- **Payout**: Monthly, net 30

### Currency Support

| Region | Currency | Individual | Team | Enterprise |
| ------ | -------- | ---------- | ---- | ---------- |
| EU     | EUR      | €99        | €499 | €1,790     |
| US     | USD      | $109       | $549 | $1,969     |
| UK     | GBP      | £85        | £425 | £1,529     |

Microsoft handles currency conversion automatically.

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

## Upgrades & Downgrades

### Upgrade Path

```
Individual → Team → Enterprise
     ↓           ↓
  Prorated billing at any time
```

Customers can upgrade at any time:

- Prorated credit for unused subscription
- Immediate access to new tier features

### Downgrade Path

Downgrades take effect at renewal:

- Current tier features until subscription ends
- New tier activates at renewal
- No prorated refunds for early downgrades

---

## Trial & Evaluation

### No Free Trial

VariScout does not offer a free trial of the Azure App because:

1. **PWA available for evaluation**: Free, full-featured demo
2. **Low-friction purchase**: €99 annual is low-risk
3. **Refund policy**: 30-day money-back guarantee

### Money-Back Guarantee

30-day refund policy for all tiers:

- Full refund if requested within 30 days
- No questions asked
- Processed via Microsoft billing

---

## Discounts

### Annual Commitment

All plans are annual:

- No monthly option (reduces admin overhead)
- Annual pricing is already discounted vs. monthly equivalent

### Volume Discounts

For Enterprise customers needing multi-tenant deployments:

| Tenants | Discount |
| ------- | -------- |
| 2-5     | 10%      |
| 6-10    | 15%      |
| 11+     | Custom   |

Contact sales for multi-tenant pricing.

### Academic Discount

- 50% off for verified educational institutions
- Requires .edu email verification
- Available for Team and Enterprise tiers

---

## Competitor Comparison

| Product    | Entry Price | Enterprise  | Deployment      |
| ---------- | ----------- | ----------- | --------------- |
| VariScout  | €99/year    | €1,790/year | Customer Azure  |
| Minitab    | €150/month  | Custom      | Minitab Cloud   |
| JMP        | €200/month  | Custom      | Local/SAS Cloud |
| SigmaXL    | €249/year   | €999/year   | Excel Add-in    |
| InfinityQS | Custom      | $50k+/year  | SaaS            |

### VariScout Advantages

- **Lowest entry price** for full SPC capabilities
- **Customer-controlled data** (no vendor lock-in)
- **No backend costs** for publisher
- **Microsoft billing integration**

---

## See Also

- [Azure Marketplace Guide](marketplace.md)
- [Products Overview](../index.md)
- [ADR-007: Distribution Strategy](../../07-decisions/adr-007-azure-marketplace-distribution.md)
