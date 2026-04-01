---
title: 'Pricing'
---

# Pricing

VariScout Azure App pricing structure — two plans differentiated by storage, collaboration, mobile, and knowledge capabilities. Per [ADR-033](../../07-decisions/adr-033-pricing-simplification.md), AI is included in all plans.

---

## Plan Overview

| Plan         | Price      | Storage                                      | Auth Scopes                                      | Mobile               | Users     | Billing |
| ------------ | ---------- | -------------------------------------------- | ------------------------------------------------ | -------------------- | --------- | ------- |
| **Standard** | €79/month  | Local files (File System Access API)         | `User.Read` only                                 | Desktop browser only | Unlimited | Monthly |
| **Team**     | €199/month | + OneDrive + SharePoint channels + AI Search | + `Files.ReadWrite.All`, `Channel.ReadBasic.All` | Teams mobile app     | Unlimited | Monthly |

**Model**: Per-deployment (one subscription per Azure tenant). All users in the tenant have access. Plans differentiate by capability, not user count.

---

## Feature Comparison

| Feature                         | Standard | Team  |
| ------------------------------- | :------: | :---: |
| **Core Analysis**               |          |       |
| I-Chart                         |    ✓     |   ✓   |
| Boxplot                         |    ✓     |   ✓   |
| Pareto                          |    ✓     |   ✓   |
| Capability (Cp/Cpk)             |    ✓     |   ✓   |
| Probability Plot                |    ✓     |   ✓   |
| ANOVA                           |    ✓     |   ✓   |
| **Performance Mode**            |          |       |
| Multi-channel analysis          |    ✓     |   ✓   |
| Channel limit                   |  1,500   | 1,500 |
| **Data Input**                  |          |       |
| CSV / Excel upload              |    ✓     |   ✓   |
| Copy-paste from spreadsheets    |    ✓     |   ✓   |
| Manual data entry               |    ✓     |   ✓   |
| **Storage**                     |          |       |
| Local file save/load (.vrs)     |    ✓     |   ✓   |
| IndexedDB fallback              |    ✓     |   ✓   |
| OneDrive personal sync          |    —     |   ✓   |
| SharePoint channel storage      |    —     |   ✓   |
| **Authentication**              |          |       |
| EasyAuth SSO (Microsoft Entra)  |    ✓     |   ✓   |
| Admin consent required          |    No    |  Yes  |
| **Investigation Workflow**      |          |       |
| Findings log                    |    ✓     |   ✓   |
| What-If simulation              |    ✓     |   ✓   |
| Photo evidence in findings      |    —     |   ✓   |
| **Collaboration**               |          |       |
| Teams channel tabs              |    —     |   ✓   |
| Teams SSO                       |    —     |   ✓   |
| Adaptive Cards                  |    —     |   ✓   |
| **AI**                          |          |       |
| NarrativeBar & ChartInsights    |    ✓     |   ✓   |
| CoScout assistant               |    ✓     |   ✓   |
| Knowledge Base (SP search)      |    —     |   ✓   |
| Knowledge Catalyst (org memory) |    —     |   ✓   |
| **Mobile**                      |          |       |
| Mobile gemba companion (Teams)  |    —     |   ✓   |
| **Admin**                       |          |       |
| Admin Hub                       |    ✓     |   ✓   |
| **Support**                     |          |       |
| Email support                   |    ✓     |   ✓   |
| Response time                   |   24h    |  24h  |

---

## Why Two Plans

### Standard — Full Analysis with AI, Zero Admin

Standard is the complete SPC analysis tool for individuals and small teams who work from a desktop browser. Local file storage via the File System Access API means projects live on the user's machine — no cloud permissions, no admin consent, no IT involvement. At €79/month for unlimited users, it undercuts per-seat competitors at any team size above one. AI features (NarrativeBar, ChartInsightChips, CoScout) are included when the customer deploys Azure AI Foundry resources.

### Team — Collaboration + Knowledge Base & Catalyst

Team adds everything needed for shared quality workflows: OneDrive and SharePoint channel storage so projects live where the team works, Teams integration for embedding analysis in channels, mobile access through the Teams app for gemba investigations with photo evidence, the Knowledge Base for searching team documents on SharePoint via Azure AI Search, and the Knowledge Catalyst for organizational learning from resolved findings. The `Files.ReadWrite.All` and `Channel.ReadBasic.All` permissions require one-time admin consent, justified by the collaborative storage and Teams features they unlock.

### Why Two Plans

Per [ADR-033](../../07-decisions/adr-033-pricing-simplification.md), the original three-plan model was simplified to two plans. AI is included in all plans (removing the Team AI upsell friction), and the knowledge features (Knowledge Base + Knowledge Catalyst) moved to Team where they pair naturally with team collaboration features.

- Standard at €79 removes the "do I really need OneDrive?" hesitation — now includes AI
- Team at €199 captures the collaboration + knowledge value that teams are willing to pay for
- Standard requires no admin consent — faster purchase cycle

---

## Revenue

### Standard Plan

```
Gross Price:     €79/month
Microsoft Fee:   -€2.37/month (3%)
Net Revenue:     €76.63/month
Annual Net:      €919.56/year
```

### Team Plan

```
Gross Price:     €199/month
Microsoft Fee:   -€5.97/month (3%)
Net Revenue:     €193.03/month
Annual Net:      €2,316.36/year
```

### Currency Table

| Region | Currency | Standard/Month | Team/Month |
| ------ | -------- | -------------- | ---------- |
| EU     | EUR      | €79            | €199       |
| US     | USD      | ~$87           | ~$219      |
| UK     | GBP      | ~£68           | ~£171      |

Microsoft handles currency conversion automatically. Prices are set excluding tax; Microsoft adds VAT/GST at checkout based on the customer's billing country.

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

| Product | Price | Features                                                   |
| ------- | ----- | ---------------------------------------------------------- |
| **PWA** | Free  | Core analysis: I-Chart, Boxplot, Pareto, Capability, ANOVA |

The PWA serves as a marketing funnel — users who need Performance Mode, file upload, data persistence, or team collaboration upgrade to the Azure App.

---

## Upgrade Path

### PWA to Standard

Users outgrow the PWA when they need file upload, project save/load, Performance Mode, or more than 3 factors. Standard provides all analysis features with local storage and no admin consent.

### Standard to Team

Teams outgrow Standard when they need shared project storage, mobile gemba access, Teams channel integration, or the Knowledge Base and Knowledge Catalyst for organizational learning. Upgrading from Standard to Team is a plan change in the Azure portal — same deployment, same data, new capabilities.

The ARM template uses a `VARISCOUT_PLAN` environment variable (`standard` or `team`) to control which features are available. All plans deploy as `enterprise` tier.

---

## Cancellation

- Cancel any time in Azure portal
- Service continues until end of billing period
- No prorated refunds for partial months
- Data remains in customer's tenant after cancellation

---

## Competitor Comparison

| Product            | Entry Price | Team of 10     | Collaboration       | Deployment      |
| ------------------ | ----------- | -------------- | ------------------- | --------------- |
| VariScout Standard | €79/month   | €79/month      | Local files + AI    | Customer Azure  |
| VariScout Team     | €199/month  | €199/month     | OneDrive/Teams + AI | Customer Azure  |
| Minitab            | ~€150/month | ~€1,500/month  | Minitab Cloud       | Minitab Cloud   |
| JMP                | ~€200/month | ~€2,000/month  | SAS Cloud           | Local/SAS Cloud |
| SigmaXL            | ~€21/month  | ~€83/month     | None                | Excel Add-in    |
| InfinityQS         | Custom      | ~$4,000+/month | SaaS                | SaaS            |

### VariScout Advantages

- **Flat pricing** regardless of team size
- **AI included** in all plans (no separate AI upsell)
- **Customer-controlled data** (no vendor lock-in)
- **No backend costs** for publisher
- **Microsoft billing integration** (familiar for enterprises)
- **Two entry points** — Standard for individuals, Team for departments

---

## See Also

- [Azure Marketplace Guide](marketplace.md)
- [Products Overview](../index.md)
- [ADR-007: Distribution Strategy](../../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-016: Teams Integration](../../07-decisions/adr-016-teams-integration.md)
