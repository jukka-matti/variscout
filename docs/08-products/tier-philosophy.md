---
title: Tier Philosophy
audience: [analyst, engineer]
category: reference
status: stable
related: [pricing, tiers, feature-gating, value-ladder]
---

# Tier Philosophy

Why features are gated where they are — the reasoning behind VariScout's product tiers.

---

## Capability Maturity Model

VariScout has two paid plans, each targeting a different maturity level:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PWA (Free)          "Learn the methodology"                    │
│  ────────────────────────────────────────────                   │
│  Core analysis, sample datasets, copy-paste input               │
│  Session-only (no persistence). 3 factors, 50K rows.            │
│                                                                 │
│  Azure Standard      "Analyze your own data"                    │
│  (€79/month)                                                    │
│  ────────────────────────────────────────────                   │
│  + File upload, save/load, Performance Mode                     │
│  + 6 factors, 250K rows, closed-loop investigations             │
│  + Local files (File System Access API + IndexedDB)             │
│  + CoScout AI (optional, customer-deployed Azure AI Foundry)    │
│                                                                 │
│  Azure Team           "Collaborate and build knowledge"         │
│  (€199/month)                                                   │
│  ────────────────────────────────────────────                   │
│  + Shared Azure Blob Storage (team project collaboration)       │
│  + Photo evidence in findings (browser camera + Blob Storage)   │
│  + Team assignment, sync notifications                          │
│  + Knowledge Catalyst (organizational learning from findings)   │
│  + Zero admin consent — `User.Read` + `People.Read` only        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AI Included in All Plans

Per [ADR-033](../07-decisions/adr-033-pricing-simplification.md), AI features (NarrativeBar, ChartInsightChips, CoScout) are **included in all Azure plans** when the customer deploys Azure AI Foundry resources in their tenant. The Team plan adds the **Knowledge Catalyst** — the organizational memory that makes AI progressively smarter from resolved findings. Knowledge Base (team file search) is deferred pending a new backend approach (ADR-059).

This means:

- A Standard customer can have AI narration, CoScout, and chart insights
- A Team customer gets everything in Standard plus the managed knowledge index and cross-project retrieval

AI is an optional deployment add-on, not a sequential upgrade step.

---

## Tier Gate Principles

Seven rules that determine which features belong in which tier.

### Principle 1: Free Teaches, Paid Produces

The PWA is a learning tool. Everything needed to understand variation analysis methodology is free. Everything needed to do production work (file upload, save, >3 factors) is paid.

**Applied:** PWA has all 4 chart types, drill-down, linked filtering, capability metrics, and the complete FRAME → SCOUT → INVESTIGATE → IMPROVE → REPORT journey — but only copy-paste input, session-only storage, and 3 factors maximum. The full journey teaches methodology; production work (persistence, collaboration, file upload) requires Azure.

### Principle 2: Individual vs. Team Is the Primary Split

The Standard-to-Team upgrade is about **who** uses the tool, not **what** it does. Standard is for a single analyst working alone. Team is for a quality team working together.

**Applied:** Standard has all analysis features including closed-loop investigations. Team adds collaboration infrastructure: shared Blob Storage, team assignment, photo evidence, sync notifications.

### Principle 3: Knowledge Compounds at Scale

Organizational learning only delivers value when multiple people contribute findings over time. Gating knowledge features to the Team plan ensures they reach customers who have the team structure to generate enough resolved findings (target: 50+) for meaningful AI knowledge.

**Applied:** Knowledge Catalyst (organizational learning) and cross-project queries are Team only. Core AI (narration, chips, CoScout) is available on any Azure plan.

### Principle 4: Never Gate Core Analysis

No chart type, statistical calculation, or analytical capability is tier-gated (except Performance Mode, which requires file upload). A PWA user and an Azure Team user see the same I-Chart, the same Cpk calculation, the same η² value.

**Applied:** All 4 chart types, ANOVA, Nelson Rules, capability metrics, drill-down, and linked filtering are in every tier.

### Principle 5: Infrastructure Reflects Value

Features that require Azure infrastructure (SSO, AI Foundry, Blob Storage) naturally belong in Azure tiers. Features that require shared infrastructure (team storage, sync) naturally belong in Team tiers. Critically, no feature should require admin-consent Graph API permissions — enterprise trust is a prerequisite, not a tax.

**Applied:** EasyAuth → Standard+. Azure Blob Storage → Team. Zero admin-consent permissions for any tier (ADR-059).

### Principle 6: Upgrade Triggers Should Be Natural

Users shouldn't feel manipulated. They should hit a genuine ceiling that makes the upgrade obvious:

| Trigger                        | Feels like          | Upgrade to |
| ------------------------------ | ------------------- | ---------- |
| "I need to upload a CSV file"  | Natural limitation  | Standard   |
| "I need to save my analysis"   | Natural limitation  | Standard   |
| "I need my team to see this"   | Collaboration need  | Team       |
| "What did we learn last time?" | Knowledge need      | Team       |
| "Show me evidence photos"      | Field investigation | Team       |

### Principle 7: PWA and Azure Must Feel Like the Same Product

A user moving from PWA to Azure Standard should feel continuity — same charts, same methodology, same drill-down pattern. The upgrade adds capabilities without changing the mental model.

**Applied:** Shared packages (`@variscout/core`, `@variscout/charts`, `@variscout/hooks`, `@variscout/ui`) ensure identical behavior across platforms.

---

## Upgrade Triggers

The specific moments where each ceiling becomes visible.

### PWA → Standard

| Ceiling                      | User Experience                                              | Frequency                      |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------ |
| No file upload               | Must copy-paste from Excel every time                        | Every session                  |
| No save                      | Loses work when browser closes                               | First serious analysis         |
| 3-factor limit               | Can't add 4th factor for deeper drill-down                   | Complex datasets               |
| 50K row limit                | Large datasets rejected                                      | Manufacturing data             |
| No Performance Mode          | Can't analyze multi-channel data (fill heads, cavities)      | Multi-measure data             |
| No closed-loop investigation | Can't track from finding to resolution with Cpk verification | First real improvement project |

> Mobile limits are lower: PWA 10K rows / Azure 25K rows (see ADR-039).

### Standard → Team

| Ceiling            | User Experience                                 | Frequency            |
| ------------------ | ----------------------------------------------- | -------------------- |
| No shared storage  | Must email .vrs files to colleagues             | Team handoffs        |
| No photo evidence  | Can't attach photos to findings                 | Field investigations |
| No team assignment | Can't assign corrective actions to team members | Improvement tracking |

---

## Implementation

### Code-Level Gating

```typescript
// packages/core/src/tier.ts
type LicenseTier = 'free' | 'enterprise'; // PWA vs Azure
type MarketplacePlan = 'standard' | 'team'; // Azure plans

// Feature gating functions
getTier(); // → 'free' (PWA) or 'enterprise' (all Azure)
getPlan(); // → 'standard' or 'team'
isPaidTier(); // → true for any Azure plan
hasTeamFeatures(); // → true for 'team'
hasKnowledgeBase(); // → true for 'team' (KB is a Team feature)
```

The ARM template passes `VARISCOUT_PLAN` environment variable. All Azure deployments are `enterprise` tier; the plan controls which collaboration and knowledge features are enabled.

---

## Cross-Reference

For the complete feature-by-feature matrix, see [Feature Parity](feature-parity.md).

For the strategic reasoning behind the tier model, see [Business Bible](../01-vision/business-bible.md).

For the distribution and pricing decision, see [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md).

---

## See Also

- [Feature Parity Matrix](feature-parity.md) — Complete feature availability by platform
- [Business Bible](../01-vision/business-bible.md) — Strategic hypotheses and value levers
- [ADR-007: Distribution Strategy](../07-decisions/adr-007-azure-marketplace-distribution.md) — Pricing rationale
- [ADR-019: AI Integration](../07-decisions/adr-019-ai-integration.md) — AI as horizontal capability
