# Pricing

VariScout Azure App pricing structure — three plans differentiated by storage, collaboration, mobile, and AI capabilities.

---

## Plan Overview

| Plan         | Price      | Storage                              | Auth Scopes                                      | Mobile               | Users     | Billing |
| ------------ | ---------- | ------------------------------------ | ------------------------------------------------ | -------------------- | --------- | ------- |
| **Standard** | €99/month  | Local files (File System Access API) | `User.Read` only                                 | Desktop browser only | Unlimited | Monthly |
| **Team**     | €199/month | + OneDrive + SharePoint channels     | + `Files.ReadWrite.All`, `Channel.ReadBasic.All` | Teams mobile app     | Unlimited | Monthly |
| **Team AI**  | €279/month | + OneDrive + SharePoint + AI Search  | + `Files.ReadWrite.All`, `Channel.ReadBasic.All` | Teams mobile app     | Unlimited | Monthly |

**Model**: Per-deployment (one subscription per Azure tenant). All users in the tenant have access. Plans differentiate by capability, not user count.

---

## Feature Comparison

| Feature                        | Standard | Team  | Team AI |
| ------------------------------ | :------: | :---: | :-----: |
| **Core Analysis**              |          |       |         |
| I-Chart                        |    ✓     |   ✓   |    ✓    |
| Boxplot                        |    ✓     |   ✓   |    ✓    |
| Pareto                         |    ✓     |   ✓   |    ✓    |
| Capability (Cp/Cpk)            |    ✓     |   ✓   |    ✓    |
| Probability Plot               |    ✓     |   ✓   |    ✓    |
| ANOVA                          |    ✓     |   ✓   |    ✓    |
| **Performance Mode**           |          |       |         |
| Multi-channel analysis         |    ✓     |   ✓   |    ✓    |
| Channel limit                  |  1,500   | 1,500 |  1,500  |
| **Data Input**                 |          |       |         |
| CSV / Excel upload             |    ✓     |   ✓   |    ✓    |
| Copy-paste from spreadsheets   |    ✓     |   ✓   |    ✓    |
| Manual data entry              |    ✓     |   ✓   |    ✓    |
| **Storage**                    |          |       |         |
| Local file save/load (.vrs)    |    ✓     |   ✓   |    ✓    |
| IndexedDB fallback             |    ✓     |   ✓   |    ✓    |
| OneDrive personal sync         |    —     |   ✓   |    ✓    |
| SharePoint channel storage     |    —     |   ✓   |    ✓    |
| **Authentication**             |          |       |         |
| EasyAuth SSO (Microsoft Entra) |    ✓     |   ✓   |    ✓    |
| Admin consent required         |    No    |  Yes  |   Yes   |
| **Investigation Workflow**     |          |       |         |
| Findings log                   |    ✓     |   ✓   |    ✓    |
| What-If simulation             |    ✓     |   ✓   |    ✓    |
| Photo evidence in findings     |    —     |   ✓   |    ✓    |
| **Collaboration**              |          |       |         |
| Teams channel tabs             |    —     |   ✓   |    ✓    |
| Teams SSO                      |    —     |   ✓   |    ✓    |
| Adaptive Cards                 |    —     |   ✓   |    ✓    |
| **AI**                         |          |       |         |
| AI Knowledge Base              |    —     |   —   |    ✓    |
| AI-enhanced CoScout            |    —     |   —   |    ✓    |
| Organizational learning        |    —     |   —   |    ✓    |
| **Mobile**                     |          |       |         |
| Mobile gemba companion (Teams) |    —     |   ✓   |    ✓    |
| **Support**                    |          |       |         |
| Email support                  |    ✓     |   ✓   |    ✓    |
| Response time                  |   24h    |  24h  |   24h   |

---

## Why Three Plans

### Standard — Full Analysis, Zero Admin

Standard is the complete SPC analysis tool for individuals and small teams who work from a desktop browser. Local file storage via the File System Access API means projects live on the user's machine — no cloud permissions, no admin consent, no IT involvement. At €99/month for unlimited users, it undercuts per-seat competitors at any team size above one.

### Team — Collaboration via Teams

Team adds everything needed for shared quality workflows: OneDrive and SharePoint channel storage so projects live where the team works, Teams integration for embedding analysis in channels, and mobile access through the Teams app for gemba investigations with photo evidence. The `Files.ReadWrite.All` and `Channel.ReadBasic.All` permissions require one-time admin consent, justified by the collaborative storage and Teams features they unlock.

### Team AI — AI-Enhanced Collaboration

Team AI adds persistent AI capabilities on top of the Team plan: an AI Knowledge Base powered by Azure AI Search that indexes resolved findings, an enhanced CoScout assistant grounded in VariScout methodology and organizational knowledge, and organizational learning that feeds insights from resolved investigations back into the knowledge base for future use.

### Why Three Plans

The original single plan at €150/month forced a compromise: too expensive for individuals who only need local analysis, not enough revenue from teams who need collaboration features. Three plans let each segment pay for what they use:

- Standard at €99 removes the "do I really need OneDrive?" hesitation
- Team at €199 captures the collaboration value that teams are willing to pay for
- Team AI at €279 captures organizations investing in AI-enhanced quality workflows
- Standard requires no admin consent — faster purchase cycle

---

## Revenue

### Standard Plan

```
Gross Price:     €99/month
Microsoft Fee:   -€2.97/month (3%)
Net Revenue:     €96.03/month
Annual Net:      €1,152.36/year
```

### Team Plan

```
Gross Price:     €199/month
Microsoft Fee:   -€5.97/month (3%)
Net Revenue:     €193.03/month
Annual Net:      €2,316.36/year
```

### Team AI Plan

```
Gross Price:     €279/month
Microsoft Fee:   -€8.37/month (3%)
Net Revenue:     €270.63/month
Annual Net:      €3,247.56/year
```

### Currency Table

| Region | Currency | Standard/Month | Team/Month | Team AI/Month |
| ------ | -------- | -------------- | ---------- | ------------- |
| EU     | EUR      | €99            | €199       | €279          |
| US     | USD      | ~$109          | ~$219      | ~$309         |
| UK     | GBP      | ~£85           | ~£171      | ~£239         |

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

Teams outgrow Standard when they need shared project storage, mobile gemba access, or Teams channel integration. Upgrading from Standard to Team is a plan change in the Azure portal — same deployment, same data, new capabilities.

### Team to Team AI

Organizations outgrow Team when they want AI-enhanced quality workflows: a knowledge base that learns from resolved findings, an enhanced CoScout assistant grounded in methodology and organizational context, and organizational learning that compounds over time.

The ARM template uses a `VARISCOUT_PLAN` environment variable (`standard`, `team`, or `team-ai`) to control which features are available. All plans deploy as `enterprise` tier.

---

## Cancellation

- Cancel any time in Azure portal
- Service continues until end of billing period
- No prorated refunds for partial months
- Data remains in customer's tenant after cancellation

---

## Competitor Comparison

| Product            | Entry Price | Team of 10     | Collaboration  | Deployment      |
| ------------------ | ----------- | -------------- | -------------- | --------------- |
| VariScout Standard | €99/month   | €99/month      | Local files    | Customer Azure  |
| VariScout Team     | €199/month  | €199/month     | OneDrive/Teams | Customer Azure  |
| VariScout Team AI  | €279/month  | €279/month     | + AI Knowledge | Customer Azure  |
| Minitab            | ~€150/month | ~€1,500/month  | Minitab Cloud  | Minitab Cloud   |
| JMP                | ~€200/month | ~€2,000/month  | SAS Cloud      | Local/SAS Cloud |
| SigmaXL            | ~€21/month  | ~€83/month     | None           | Excel Add-in    |
| InfinityQS         | Custom      | ~$4,000+/month | SaaS           | SaaS            |

### VariScout Advantages

- **Flat pricing** regardless of team size
- **Customer-controlled data** (no vendor lock-in)
- **No backend costs** for publisher
- **Microsoft billing integration** (familiar for enterprises)
- **Three entry points** — Standard for individuals, Team for departments, Team AI for AI-forward organizations

---

## See Also

- [Azure Marketplace Guide](marketplace.md)
- [Products Overview](../index.md)
- [ADR-007: Distribution Strategy](../../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-016: Teams Integration](../../07-decisions/adr-016-teams-integration.md)
