---
title: 'ADR-033: Pricing Simplification'
---

# ADR-033: Pricing Simplification — 3 Tiers to 2 Tiers

**Status:** Accepted  
**Date:** 2026-03-19  
**Amends:** ADR-007 (pricing section)

## Context

VariScout has three Azure Marketplace plans: Standard (€99/mo), Team (€199/mo), and Team AI (€279/mo). The Team AI tier was introduced to gate the Knowledge Base feature at an €80 premium over Team.

Several factors make this three-tier model suboptimal:

1. **AI cost model** — Azure AI Foundry deploys in the customer's Azure tenant. The customer pays Microsoft directly for token consumption. VariScout does not absorb AI costs, so the AI premium is not cost-justified.

2. **Knowledge Base cost model** — The KB uses Remote SharePoint via the Copilot Retrieval API, requiring only 1 M365 Copilot license per tenant plus $0.10/call pay-as-you-go for non-licensed users. This is a per-tenant cost, not per-user.

3. **Sales complexity** — Three plans create unnecessary decision friction. The Team AI tier's value proposition ("AI + Knowledge Base") is difficult to distinguish from Team when AI features are already available as deployment add-ons.

4. **Purchasing threshold** — €99/mo = €1,188/year exceeds the common €1,000 SME purchasing threshold. €79/mo = €948/year stays under it.

## Decision

Collapse to two Azure plans:

|                | Standard — €79/mo                       | Team — €199/mo                             |
| -------------- | --------------------------------------- | ------------------------------------------ |
| Tagline        | "Analyze your data with CoScout AI"     | "Collaborate with CoScout Knowledge"       |
| Core analysis  | All charts, stats, drill-down           | Same                                       |
| AI             | CoScout AI, NarrativeBar, ChartInsights | Same                                       |
| Investigation  | 5-status closed-loop                    | Same + team assignment                     |
| Storage        | Local files (IndexedDB)                 | + OneDrive + SharePoint                    |
| Teams          | —                                       | SSO, channel tabs, mobile, photos          |
| Knowledge Base | —                                       | CoScout Knowledge Base (Remote SharePoint) |

Key changes:

- **AI is included in all plans** when the ARM template deploys AI resources (now default-ON, opt-out)
- **Knowledge Base moves into the Team plan** (was Team AI only)
- **`isTeamAIPlan()` removed** from code — replaced by `hasTeamFeatures()` for KB gating and endpoint check for AI availability
- **`isAIAvailable()` simplified** — checks for configured endpoint only, not plan level
- **CoScout becomes the unified AI brand** across both tiers

### Permission model

- Standard (€79): `User.Read` + `cognitiveservices/.default`
- Team (€199): above + `Files.ReadWrite`, `Files.ReadWrite.All`, `Channel.ReadBasic.All`, `People.Read`, `ChannelMessage.Send`, `Sites.Read.All`

### Knowledge Base licensing (verified 2026-03-19)

- Copilot Retrieval API requires `Files.Read.All` + `Sites.Read.All` (delegated) — `Sites.Selected` is NOT sufficient
- Pay-as-you-go (preview): 1 Copilot license in tenant + $0.10/API call for non-licensed users
- Remote SharePoint knowledge source: queries SharePoint live via user token passthrough (`x-ms-query-source-authorization`)

## Consequences

### Positive

- Simpler 2-tier sales story: individual analyst vs quality team
- €79 price point under €1K annual purchasing threshold
- AI included by default — no more "AI as optional add-on" confusion
- Fewer code paths: `MarketplacePlan` union shrinks from 3 to 2 values

### Negative

- Existing Team AI customers need migration path (plan rename in Azure Marketplace)
- Standard plan price decrease from €99 to €79 reduces per-customer revenue
- ARM template change needed: AI resources default-ON instead of opt-in

### Future opportunity

- Migrate `Files.ReadWrite.All` → `Sites.Selected` for improved IT acceptance (separate engineering task)
