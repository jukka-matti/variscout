---
title: VariScout Product Spec
audience: [analyst, engineer]
category: reference
status: stable
last-reviewed: 2026-05-16
related: [adr-082, product-overview, feature-parity, journey]
---

# VariScout — Product Spec

**Version:** 3.0 (V1)
**Date:** 2026-05-16
**Status:** Stable

Canonical V1 design lives in the [wedge architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../07-decisions/adr-082-wedge-architecture.md). This doc enumerates the V1 feature surface; tier-gating is collapsed to a single Azure SKU, and team-collaboration features are project-membership-role-gated inside that SKU. See [feature-parity.md](../08-products/feature-parity.md) for the PWA vs Azure matrix.

---

## What Is It?

Structured investigation for process improvement. Question-driven analysis that guides teams from concern to measured result — combining data analysis, gemba observations, and expert knowledge in one investigation flow, assisted by AI.

- **PWA (Free):** No AI, no API keys, no persistence — a pure training tool where the struggle is the point. Direct URL distribution.
- **Azure (€99/month):** Full product. CoScout AI included, persistence in customer's Azure tenant, project membership ACLs, Report sharing. Azure Marketplace Managed Application.

**Tagline:** _"Cut through your watermelons — without the cloud."_

---

## V1 ICP — Improvement Specialist

V1 serves one persona: the **Improvement Specialist** — quality engineer, Lean practitioner, Six Sigma belt (Green / Black / MBB), CI engineer, or process analyst. The Specialist takes one of three project-membership roles inside individual projects (Lead / Member / Sponsor).

| Specialist context       | Why VariScout works                                           |
| ------------------------ | ------------------------------------------------------------- |
| **Belt-trained analyst** | Knows the methodology, needs better tools than Excel          |
| **Experienced engineer** | Already knows what to look for; doesn't need AI hand-holding  |
| **Trainers / educators** | Free PWA = clean demo tool with no AI unpredictability        |
| **LSS programs**         | Green / Black Belt courses; Minitab replacement, zero install |
| **Offline environments** | Factory floor, limited connectivity; browser-local            |

The legacy multi-persona segmentation (Process Owner / Frontline / SME / Project Lead routing variants) migrates to **VariScout Process**, the future enterprise product. See [USER-JOURNEYS.md "What's out of V1 scope"](../USER-JOURNEYS.md#whats-out-of-v1-scope-defers-to-variscout-process).

---

## V1 Navigation

Seven tabs, in workflow order:

```
[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]
```

| Tab               | Function                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| **Home**          | Active-IP launchpad + project queue                                                               |
| **Project**       | Current project detail — Charter / Approach / Sustainment stages                                  |
| **Process**       | Canvas / process map (State + Edit modes per V1 spec §3.3)                                        |
| **Analyze**       | EDA / charts / Factor Intelligence                                                                |
| **Investigation** | Wall + Evidence Map → suspected causes                                                            |
| **Improve**       | Active-IP-scoped action tracker; PDCA workbench behind **"Advanced" toggle** (V1 spec §3.5 amend) |
| **Report**        | Narrative output for Sponsor signoff                                                              |

Improve is a top-level verb tab with active-IP cascade (2026-05-16 amendment — V1 spec §3.5). Project detail runs three stages: Charter → Approach → Sustainment. Handoff folds into Sustainment closure.

---

## Core Features

| Feature                     | Description                                                  | Detailed Docs                                                                                         |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Data Import                 | CSV, Excel, paste; smart auto-mapping, validation            | [data-input.md](data/data-input.md)                                                                   |
| Three-Chart Dashboard       | I-Chart, Boxplot, Pareto with linked filtering               | [i-chart.md](analysis/i-chart.md), [boxplot.md](analysis/boxplot.md), [pareto.md](analysis/pareto.md) |
| Interactive Analysis        | Drill-down, breadcrumbs, factor selection                    | [progressive-filtering.md](navigation/progressive-filtering.md)                                       |
| Statistics Panel            | Conformance/Capability modes, Cp/Cpk, η², histogram          | [stats-panel.md](analysis/stats-panel.md)                                                             |
| Data Table                  | Inline editing, keyboard navigation, spec status             | [data-input.md](data/data-input.md)                                                                   |
| Save & Load (.vrs)          | Azure: IndexedDB persistence + Blob sync. PWA: session-only. | [storage.md](data/storage.md)                                                                         |
| Chart Annotations           | Right-click highlights + text observations → Findings        | [packages/charts/CLAUDE.md](../../packages/charts/CLAUDE.md)                                          |
| Export                      | PNG (charts/dashboard), CSV, SVG                             | [packages/charts/CLAUDE.md](../../packages/charts/CLAUDE.md) §EXPORT_SIZES                            |
| Branding                    | Source bar with sample count; hidden for Azure               | —                                                                                                     |
| Staged Analysis             | Before/after comparison with stage columns                   | [staged-analysis.md](analysis/staged-analysis.md)                                                     |
| Nelson Rules                | Control chart pattern detection                              | [nelson-rules.md](analysis/nelson-rules.md)                                                           |
| Control Violation Education | Tooltip explanations, glossary terms                         | [help-tooltip.md](../06-design-system/components/help-tooltip.md)                                     |
| Embed Mode                  | URL parameters for website case studies                      | [embed-messaging.md](../05-technical/integrations/embed-messaging.md)                                 |
| Dashboard Design            | Scrollable layout, sticky nav, presentation mode             | [dashboard-design.md](../06-design-system/patterns/dashboard-design.md)                               |

---

## Two analyst modes — both first-class

V1 serves two distinct workflows, both as primary use cases (per [V1 spec §3.0](../superpowers/specs/2026-05-16-wedge-architecture-design.md#§30-two-analyst-modes--both-first-class)):

1. **Quick analysis (exploratory)** — Specialist pastes data, explores in Analyze + Investigation, saves Findings. _No Project required._ Free PWA supports this in session-only mode; Azure adds persistence and CoScout.
2. **Project-anchored investigation** — Specialist creates a Project (or promotes a quick analysis via "+ Promote to Project"). The Charter ceremony adds problem statement, member invites, optional refined goal. Project runs Charter → Approach → Sustainment (3 stages); the Improve tab provides the action tracker scoped to the active project, producing a Sponsor-signoff-ready Report.

Internally, paste data lands in a data container (called a Hub in code) that is tenant-wide. The UI does not surface "Hub" as a noun — users see only Project and Process.

---

## Project lifecycle (V1)

Inside Project detail, three stages run in sequence:

| Stage           | Function                                                                                                                                                                             | Default UI                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Charter**     | Wrap an existing analysis with project ceremony — problem statement, member invites, optional refined goal. Inherits the Hub's framing (outcome, factors, process map) on promotion. | Problem statement form + Invite modal + inherited Hub-context summary.                      |
| **Approach**    | Investigation strategy → produces suspected causes. Anchor surface is the **Investigation Wall** (Hypotheses + Findings + Measurement Plans).                                        | SuspectedCause-anchored hierarchy; links to Wall + Evidence Map.                            |
| **Sustainment** | "Did it work?" + close project. Action completion + Cpk delta + drift check.                                                                                                         | Cpk delta + action completion + drift since closure + Mark complete / Reopen for follow-up. |

Handoff stage is folded into Sustainment closure (single end-of-project decision moment). The Improve tab (top-level verb) hosts the action tracker + PDCA workbench scoped to the active project. Canvas response paths reduce from 5 to 3 (Investigate / Quick Action / Charter); Sustainment auto-fires per ADR-080.

---

## Investigation Wall + Measurement Plans

The Investigation Wall is the canonical Hypothesis-driven surface. V1 extends the Wall with one new sub-entity per Hypothesis: **Measurement Plan** (per [V1 spec §3.6](../superpowers/specs/2026-05-16-wedge-architecture-design.md#§36-investigation-wall--measurement-plans)).

Both investigation starting points converge on the Wall:

| Start                            | Path                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data-first (exploratory)**     | Paste → explore in Analyze → notice patterns → create Findings → group into Hypotheses on the Wall.                                                                          |
| **Hypothesis-first (deductive)** | Open Wall → create Hypothesis → add Measurement Plans (what evidence is needed) → collect out-of-product → re-paste → Findings link to Plans → Hypothesis status progresses. |

Measurement Plan fields (V1): factor, method, sample size, owner, status, hypothesis link, optional linked-findings, optional MSA-required flag (informational only). Formal MSA / Gage R&R workflow + statistical sample-size calculator defer to V2.

---

## Azure CoScout — AI assistant

CoScout is included in the €99 Azure SKU; PWA never has AI. CoScout coaches methodology, asks targeted questions, surfaces references, proposes actions. The deterministic stats engine is the authority on numbers — CoScout quotes it, doesn't override.

| Feature                   | PWA |  Azure (€99)  | Description                                                          |
| ------------------------- | :-: | :-----------: | -------------------------------------------------------------------- |
| NarrativeBar              |  —  |   Optional    | Plain-language analysis summary                                      |
| ChartInsightChip          |  —  |   Optional    | Per-chart contextual suggestions                                     |
| CoScoutPanel              |  —  |       ✓       | Conversational AI assistant (mode-aware, tool-calling)               |
| Voice input               |  —  |   Optional    | Tap/hold to transcribe into CoScout draft; replies remain text in V1 |
| Knowledge Catalyst        |  —  | Beta Phase 2+ | Azure AI Search unified knowledge index (ADR-060, Phase 2+)          |
| Process description field |  —  |   Optional    | Free-text process context for AI grounding                           |

AI is always optional, dismissable, and controlled by a user-visible Settings toggle. No AI endpoint configured = no AI UI shown. See [ADR-019](../07-decisions/adr-019-ai-integration.md).

---

## Pricing

Single Azure SKU. Team-collaboration features are **project-membership-role-gated** inside the €99 plan, not tier-gated.

| Product | Distribution                          | Pricing       | Status      |
| ------- | ------------------------------------- | ------------- | ----------- |
| Azure   | Azure Marketplace Managed Application | **€99/month** | **PRIMARY** |
| PWA     | Public URL                            | FREE          | Production  |

### Free (PWA)

- All core chart types (I-Chart, Boxplot, Pareto, Capability, ANOVA, Yamazumi, Defect)
- Copy-paste data input + sample datasets
- VariScout branding on charts
- Session-only storage (no save)
- No AI

### Azure (€99/month)

- All features, unlimited org users tenant-wide
- EasyAuth (Microsoft SSO), file upload, save/persistence (IndexedDB + Blob Storage)
- Performance Mode (multi-channel analysis)
- Watermark-free exports, custom theming
- CoScout AI (optional Foundry deployment)
- Project membership ACLs (Lead / Member / Sponsor)
- Photo evidence, team assignment, Knowledge Catalyst — Member+ role inside a Project
- Report sharing + Sponsor read-only access
- Azure Marketplace Managed Application deployment

The €79 Standard + €199 Team split is retired (see [ADR-082](../07-decisions/adr-082-wedge-architecture.md)). Everything previously in either tier is now part of the single €120 SKU.

---

## Project membership roles

Inside the €120 SKU, team-collaboration features are gated by project-membership role rather than priced into a separate tier. Project members must share the same Azure AD tenant as the buyer (cross-AD-tenant invites are out of V1 scope — a deliberate privacy boundary).

| Role        | Real-world counterpart                                  | Capabilities                                                                                                                           |
| ----------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Lead**    | Black Belt / project lead / analyst running the project | Full edit; manages membership; configures Knowledge Catalyst; sets lifecycle stage; invites Members and Sponsors                       |
| **Member**  | SME, analyst, frontline contributor, quality engineer   | Full edit within project surfaces (findings, hypotheses, actions, photo evidence, Knowledge Catalyst contribution); no membership mgmt |
| **Sponsor** | Executive sponsor / Champion                            | **Report-only at V1**; signoff handled out-of-band (email, e-sign, meeting). In-product signoff workflow defers post-V1.               |

Outside a Project, a logged-in Azure user can paste data and analyze tenant-wide — this baseline analysis capability is not gated by project membership. Only Project artifacts (Charter, Approach, Sustainment) and Improve tab actions and team-collaboration features are membership-scoped. See [feature-parity.md "Project-membership-role gating"](../08-products/feature-parity.md#project-membership-role-gating) for the role × feature matrix.

---

## Competitive Positioning

### vs Minitab

| Aspect         | Minitab              | VariScout V1                          |
| -------------- | -------------------- | ------------------------------------- |
| Price          | ~€135–155/user/month | €99/month, unlimited org users        |
| Installation   | Desktop software     | Browser (no install)                  |
| Learning curve | Steep                | Methodology-led, minimal              |
| Feature depth  | Deep (30 years)      | Focused (improvement-loop essentials) |
| Target         | Statisticians        | Improvement specialists               |

### vs Excel

| Aspect           | Excel              | VariScout V1 |
| ---------------- | ------------------ | ------------ |
| Setup            | Build from scratch | Ready to use |
| Control limits   | Manual calculation | Automatic    |
| Linked filtering | Complex            | One click    |
| Export quality   | Varies             | Consistent   |

### Positioning Statement

> "VariScout is for improvement specialists who need answers, not statisticians who need tools. Methodology-led for anyone. Rigorous enough for experts."

---

## Success Metrics

### Product Metrics

| Metric                        | Target        |
| ----------------------------- | ------------- |
| Time to first chart           | < 2 minutes   |
| Free (PWA) → Azure conversion | 5–10%         |
| Monthly active users (free)   | 1,000+        |
| Paid Azure tenants            | 100+ (Year 1) |

### Business Metrics

| Metric               | Year 1 Target                 |
| -------------------- | ----------------------------- |
| ARR                  | ~€60K (50 tenants × €99 × 12) |
| Support tickets/user | < 0.1                         |
| Churn rate           | < 20%                         |

ARR figures revised from the prior €79 baseline; see [market-analysis.md](../01-vision/market-analysis.md) for SAM → SOM narrowing.

---

## What's Out of V1 Scope

Migrates to **VariScout Process** (future enterprise product, not announced in V1 marketing):

- 4-persona model (Process Owner / Project Lead / SME / Frontline) — V1 has single Specialist + membership roles
- Process Hub as a user-visible primary container
- Automated data pipelines (sensor / SCADA / MES / ERP feeds)
- Multi-Hub portfolio scans + cross-Hub orchestration
- Process Owner-shaped cadence monitoring dashboard
- Tier-gating philosophy as a public-facing concept

Deferred to V2 inside V1 (not Process):

- In-app Sponsor signoff workflow (Sponsor is Report-only at V1; signoff out-of-band)
- Formal MSA / Gage R&R workflow
- Statistical sample-size calculator
- Cross-Azure-AD-tenant invitations (Azure AD guest accounts handle the edge case)
- What-If simulator (may re-emerge in Analyze later if customer demand surfaces)
- Idea board / action conversion

See [V1 spec §7 + §10](../superpowers/specs/2026-05-16-wedge-architecture-design.md) for the canonical out-of-V1 list.

---

## Summary

> **VariScout V1** is the project tool an improvement specialist invites their team to. Question-driven analysis with four linked views reveals hidden variation; the Investigation Wall + Measurement Plans hold the hypothesis-driven work; the Improve stage tracks actions; Sustainment closes the loop with measured Cpk delta. Free PWA for learning the methodology; **€99/month Azure tenant-wide** for the full product with CoScout AI, project membership ACLs, and Sponsor-signoff Reports.

---

## See Also

- [V1 architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) — V1 canonical anatomy
- [ADR-082](../07-decisions/adr-082-wedge-architecture.md) — V1 architecture decision
- [Product Overview](../01-vision/product-overview.md)
- [Market Analysis](../01-vision/market-analysis.md)
- [Feature Parity](../08-products/feature-parity.md) — PWA vs Azure (€99) matrix
- [USER-JOURNEYS](../USER-JOURNEYS.md) — V1 single-persona spine
- [ADR-019: AI Integration](../07-decisions/adr-019-ai-integration.md)
- [ADR-080: Sustainment auto-fire pattern](../07-decisions/adr-080-sustainment-auto-fire-pattern.md)
