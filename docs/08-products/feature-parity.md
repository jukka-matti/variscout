---
title: 'Feature Parity Matrix'
audience: [business, product]
category: strategy
status: stable
last-reviewed: 2026-05-16
related: [tiers, wedge, pricing, modes]
---

# Feature Parity Matrix

Feature availability across the two V1 platforms: **PWA** (free, training/evaluation, session-only) and **Azure** (€120/month, Azure Marketplace Managed Application, persistent, AI-enabled).

Canonical V1 design lives in the [wedge architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../07-decisions/adr-082-wedge-architecture.md). The legacy Azure Standard (€79) / Azure Team (€199) two-plan model is retired; everything that was previously Standard or Team is now part of the single €120 SKU. Features that need team collaboration (photo evidence, project sharing, Knowledge Catalyst, team assignment) are **project-membership-role-gated inside Azure** rather than tier-gated — see [Project-membership-role gating](#project-membership-role-gating) at the bottom.

---

## Platform Overview

| Platform  | Primary Use                             | Status      | Distribution                          | Price          |
| --------- | --------------------------------------- | ----------- | ------------------------------------- | -------------- |
| **Azure** | Production use, persistence, CoScout AI | **PRIMARY** | Azure Marketplace Managed Application | **€120/month** |
| **PWA**   | Training, education, evaluation         | Production  | Direct URL                            | FREE           |

> Per [ADR-082](../07-decisions/adr-082-wedge-architecture.md), Azure is the single paid SKU at €120/month. AI is included. Knowledge Catalyst, photo evidence, project sharing, and team assignment are membership-role-gated inside Azure rather than priced into a separate tier. PWA is free forever. See [ADR-059](../07-decisions/adr-059-web-first-deployment-architecture.md) for the web-first deployment architecture and [ADR-019](../07-decisions/adr-019-ai-integration.md) for AI integration design.

---

## Core Analysis Features

| Feature                      | PWA | Azure (€120) | Notes                                                                                       |
| ---------------------------- | :-: | :----------: | ------------------------------------------------------------------------------------------- |
| **I-Chart**                  |  ✓  |      ✓       |                                                                                             |
| **Boxplot**                  |  ✓  |      ✓       |                                                                                             |
| **Pareto**                   |  ✓  |      ✓       |                                                                                             |
| **Capability Histogram**     |  ✓  |      ✓       |                                                                                             |
| **Probability Plot**         |  ✓  |      ✓       |                                                                                             |
| **Violin Mode**              |  ✓  |      ✓       |                                                                                             |
| **Boxplot category sorting** |  ✓  |      ✓       |                                                                                             |
| **Performance Mode**         |  -  |      ✓       | Multi-channel Cpk; Azure only.                                                              |
| **Yamazumi (time study)**    |  ✓  |      ✓       | Auto-detected from activity type data.                                                      |
| **Defect Analysis Mode**     |  ✓  |      ✓       | Auto-detected from defect/error data; 3 data shapes (event log, pre-aggregated, pass/fail). |
| **Defect Evidence Map**      |  ✓  |      ✓       | Three-view model: All Defects, Per-Type, Cross-Type insight.                                |

> PWA includes core analysis charts plus Green Belt tools for training. Performance Mode requires Azure.

---

## Statistical Calculations

All platforms share `@variscout/core` and produce **identical results** for the features they support.

| Calculation           | PWA | Azure | Formula Reference                                    |
| --------------------- | :-: | :---: | ---------------------------------------------------- |
| Mean, Median, Std Dev |  ✓  |   ✓   | Standard                                             |
| UCL/LCL (3σ)          |  ✓  |   ✓   | x̄ ± 3σ                                               |
| Cp, Cpk               |  ✓  |   ✓   | (USL-LSL)/6σ                                         |
| η² (Eta-squared)      |  ✓  |   ✓   | SS_between/SS_total                                  |
| F-statistic, p-value  |  ✓  |   ✓   | ANOVA                                                |
| Nelson Rule 2         |  ✓  |   ✓   | 9-point run                                          |
| Best subsets R²adj    |  ✓  |   ✓   | 2^k factor ranking                                   |
| Interaction screening |  ✓  |   ✓   | Pass 2 partial F-test (cont×cont, cont×cat, cat×cat) |

---

## Navigation & Interaction

| Feature                              |   PWA   | Azure (€120) | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | :-----: | :----------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drill-down**                       |    ✓    |      ✓       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Linked filtering**                 |    ✓    |      ✓       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Breadcrumb navigation**            |    ✓    |      ✓       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Multi-select filters**             |    ✓    |      ✓       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Observations & Findings**          |    ✓    |      ✓       | PWA: 3-status findings (observe, investigate, analyze) + tags + 3-column board. Azure: 5-status closed-loop investigation with hypothesis tree, corrective actions, outcome assessment, 5-column board. Team assignment + Knowledge Catalyst contribution are membership-role-gated inside Azure.                                                                                                                                                                                                                                      |
| **Voice input in findings/comments** |    -    |      ✓       | Azure only. Transcript-first draft capture for finding text and finding comments. Audio is not persisted.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Question-Driven Investigation**    |  Basic  |      ✓       | Question-driven EDA model (ADR-053). Factor Intelligence generates ranked questions from best subsets R²adj; questions auto-answer when R²adj < 5%. Coverage metric tracks % of variation explored. PWA: question checklist + dashboard factor switching (≥2 factors). Azure: + hypothesis tree (depth 3, max 30), gemba/expert tasks, issue statement sharpening, problem statement emergence, CoScout investigation sidebar. Mode-aware questions via ADR-054 (Capability: Cpk impact, Yamazumi: waste %, Performance: channel Cpk). |
| **Evidence Map**                     | L1 only |      ✓       | 3-layer visualization: L1 (Statistical, factor nodes by R²adj, 5 relationship types, equation bar) in PWA + Azure. L2 (Investigation, causal links, evidence badges D/G/E) Azure only. L3 (Synthesis, hub convergence zones, projections) Azure only. Azure: Evidence Map is the Investigation workspace center (`InvestigationMapView`), with NodeContextMenu, CausalLinkCreator, PI panel deep linking. `FactorPreviewOverlay` shows at FRAME→SCOUT. `ReportEvidenceMap` timeline playback in Report. PWA: Layer 1 pop-out only.     |
| **Investigation Wall**               |    -    |      ✓       | Hypothesis-centric Wall projection of investigation graph — problem condition at top, hypotheses with mini-chart evidence, AND/OR/NOT composition into convergence branches, tributary chips live from ProcessMap, missing-evidence critique strip. Complements Evidence Map (factor-centric). See [Investigation Wall design](../superpowers/specs/2026-04-19-investigation-wall-design.md).                                                                                                                                          |
| **ProductionLineGlanceDashboard**    |    ✓    |      ✓       | Per-step capability dashboard primitive — Cpk vs target trend, Cp-Cpk gap trend, per-step Cpk boxplot, per-step error Pareto. Mounts in the Hub Capability tab and the Canvas capability lens. See [production-line-glance design](../superpowers/specs/2026-04-28-production-line-glance-design.md).                                                                                                                                                                                                                                  |
| **Process Hub Capability tab**       |    -    |      ✓       | Hub-level cadence-review surface combining the production-line-glance dashboard with the B0 migration banner. Azure-only (PWA Hub IA pending). See [Process Hub Capability tab](../03-features/analysis/process-hub-capability.md).                                                                                                                                                                                                                                                                                                    |
| **ProcessHubCurrentStatePanel**      |    -    |      ✓       | Per-state-item display with actions, evidence chip, team notes, generic evidence support. Azure-only (PWA Hub IA pending). See [Actionable Current Process State Panel design](../archive/specs/2026-04-27-actionable-current-process-state-panel-design.md).                                                                                                                                                                                                                                                                          |
| **SuspectedCause Hubs**              |    -    |      ✓       | Each investigated question is a hub entity aggregating evidence strength (R²adj/η²), validation type (data/gemba/expert), linked improvement ideas, and Problem Statement fragments (Watson Q1–Q3). Replaces flat `causeRole` tags with a first-class graph node. See [Investigation Workspace Reframing](../superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md).                                                                                                                                                |
| **Improvement Ideas**                |    ✓    |      ✓       | Brainstorm and evaluate ideas on supported hypotheses. Impact badge from What-If Explorer projection, timeframe/cost/risk ratings. Azure: + CoScout ideation coaching. PWA: session-only.                                                                                                                                                                                                                                                                                                                                              |
| **Improvement Workspace**            |    ✓    |      ✓       | Full-page improvement hub (3-column layout: context panel + hub + CoScout). Sub-features below. PWA: session-only, teaches the full IMPROVE phase.                                                                                                                                                                                                                                                                                                                                                                                     |
| **↳ Context panel**                  |    -    |      ✓       | Azure only. Left panel shows problem statement (pre-filled from Investigation), target metric, and suspected causes with evidence strength (R²adj/η²). Panel transitions to What-If when a cause's What-If button is tapped.                                                                                                                                                                                                                                                                                                           |
| **↳ Prioritization matrix**          |    ✓    |      ✓       | Plan view: 2×2 effort/impact matrix with 4 axis presets (Effort/Impact, Cost/Benefit, Urgency/Confidence, Risk/Reach). Cause-colored ghost dots map ideas to suspected causes. PWA: matrix without cause colors.                                                                                                                                                                                                                                                                                                                       |
| **↳ What-If with context presets**   |    ✓    |      ✓       | What-If Explorer accessible from context panel (cause-scoped presets) and from idea cards (Azure). PWA: via standalone What-If page. Azure: ModelInformedEstimator renderer when regression model available.                                                                                                                                                                                                                                                                                                                           |
| **↳ Action tracking**                |    -    |      ✓       | Azure only. Track view: action items converted from ideas, each with assignee, due date, completion checkbox. Finding status advances to `improving` when actions are assigned. Assignee selection is membership-role-gated.                                                                                                                                                                                                                                                                                                           |
| **↳ Verification (KPI grid)**        |    -    |      ✓       | Azure only. Track view: VerificationSection shows KPI grid (mean, sigma, Cpk before/after). Smart detection prompts when new data appears post-action.                                                                                                                                                                                                                                                                                                                                                                                 |
| **↳ Outcome assessment**             |    -    |      ✓       | Azure only. Track view: OutcomeSection records whether the improvement worked. Advances finding to `resolved`. Loops back to Plan if outcome is partial.                                                                                                                                                                                                                                                                                                                                                                               |
| **↳ Brainstorm modal (HMW)**         |    -    |      ✓       | Azure only. Per-cause ideation with 4 HMW prompts, creative idea generation, dot-vote selection, and direction pre-setting. Solo CoScout-assisted by default; real-time collaborative sessions with anonymous voting available when project membership is configured.                                                                                                                                                                                                                                                                  |
| **Convergence Synthesis**            |    -    |      ✓       | Editable suspected cause narrative (max 500 chars). CoScout can draft.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **What-If Explorer**                 |    ✓    |      ✓       | Unified What-If Explorer (`WhatIfExplorer` in `@variscout/ui`) replaces WhatIfSimulator, PredictionProfiler, LeanWhatIfSimulator. Mode-aware: BasicEstimator (no model), ModelInformedEstimator (regression), ActivityReducer (yamazumi), ChannelAdjuster (performance). Principle: "Model informs, analyst estimates" — regression provides gap context, analyst sets closure fraction. `WhatIfExplorerPage` wraps with page chrome.                                                                                                  |
| **Keyboard navigation**              |    ✓    |      ✓       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Copy chart to clipboard**          |    ✓    |      ✓       | Includes filter context bar when active.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Filter context on charts**         |    ✓    |      ✓       | Shows active filters inside chart cards; toggle in Settings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Editable chart titles**            |    ✓    |      ✓       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Selection panel**                  |    ✓    |      ✓       | Minitab-style point brushing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Create Factor**                    |    ✓    |      ✓       | From point selection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Focus mode (fullscreen chart)**    |    ✓    |      ✓       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Report Workspace**                 |    ✓    |      ✓       | Report as a workspace tab. PWA: session-only report view + copy/PDF. Azure: + Share, Save As. Sponsor role on a Project gets Report-only access.                                                                                                                                                                                                                                                                                                                                                                                       |
| **Project Dashboard**                |    -    |      ✓       | Investigation overview after opening a saved investigation. Status overview (findings by status, hypothesis tree, action progress), AI summary card, quick actions. Deep links bypass to Editor. PWA has no project persistence, so no dashboard.                                                                                                                                                                                                                                                                                      |
| **Report View (3 Workspaces)**       |    -    |      ✓       | 3 workspace-aligned report types (Analysis Snapshot, Investigation Report, Improvement Story), audience toggle (Technical/Summary), workspace-colored sections, Cpk Learning Loop.                                                                                                                                                                                                                                                                                                                                                     |
| **Save as PDF (Report)**             |    -    |      ✓       | Print stylesheet + `window.print()` — produces professional PDF from Report View.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Process Hub Home Screen**          |    -    |      ✓       | Hub-first Azure home: Process Hub cards before individual investigation cards, rollups by status/depth/actions, and legacy investigations grouped under General / Unassigned. Azure-only (PWA has no persistence).                                                                                                                                                                                                                                                                                                                     |
| **What's New on Reopen**             |    -    |      ✓       | `WhatsNewSection` on Project Dashboard summarizes changes since `lastViewedAt` (new findings, hypothesis status changes, completed/overdue actions). Dismissed by user. Azure-only.                                                                                                                                                                                                                                                                                                                                                    |
| **Deep Link Targets**                |    -    |      ✓       | ID-based links (UUID) replacing fragile name-based links. Targets: finding, chart, hypothesis, improvement workspace, overview tab, analysis tab. Legacy name links still resolve. Azure-only.                                                                                                                                                                                                                                                                                                                                         |
| **Median in Stats Panel**            |    ✓    |      ✓       | Always shown alongside Mean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Spec editing (Stats)**             |    ✓    |      ✓       | `onEditSpecs` callback; pencil link opens SpecEditor popover.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Chart color highlights**           |    ✓    |      ✓       | Desktop: right-click context menu. Mobile: tap → action sheet. Red/amber/green category markers (Boxplot, Pareto). I-Chart: desktop only.                                                                                                                                                                                                                                                                                                                                                                                              |

---

## Data Handling

| Feature                           |  PWA   | Azure (€120) | Notes                                                                                           |
| --------------------------------- | :----: | :----------: | ----------------------------------------------------------------------------------------------- |
| **CSV upload**                    |   -    |      ✓       | Azure only.                                                                                     |
| **Excel upload**                  |   -    |      ✓       | Azure only.                                                                                     |
| **Paste data**                    |   ✓    |      ✓       |                                                                                                 |
| **Sample datasets**               |   ✓    |      ✓       | PWA pre-loaded with cases.                                                                      |
| **Column mapping**                |   ✓    |      ✓       | Data-rich cards with type badges, sample values, data preview.                                  |
| **Spec entry at column mapping**  |   ✓    |      ✓       | Collapsible SpecsSection in ColumnMapping.                                                      |
| **Column data preview**           |   ✓    |      ✓       | Collapsible mini-table showing first 5 rows.                                                    |
| **Column renaming at setup**      |   ✓    |      ✓       | Pencil icon on column cards → `columnAliases`.                                                  |
| **Time factor extraction**        |   ✓    |      ✓       | Extract year/month/weekday/hour from date columns.                                              |
| **Inline data editing**           |   ✓    |      ✓       | Edit cells, add/delete rows, batch apply.                                                       |
| **Add data during analysis**      |   -    |      ✓       | Paste/upload/manual append with auto-detection.                                                 |
| **Manual entry**                  |   ✓    |      ✓       |                                                                                                 |
| **Data validation**               |   ✓    |      ✓       |                                                                                                 |
| **Row limit**                     | 50,000 |   250,000    | Configurable via `DataIngestionConfig`. Mobile limits are lower: PWA 10K / Azure 50K (ADR-039). |
| **Max factors**                   |   3    |      6       | Configurable via `maxFactors` prop.                                                             |
| **Factor management in analysis** |   ✓    |      ✓       | Both: ColumnMapping re-edit via "Factors" button in nav bar.                                    |

---

## Persistence & Storage

| Feature                 | PWA | Azure (€120)                                              | Notes                                                                                                                 |
| ----------------------- | :-: | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Local storage**       |  -  | IndexedDB                                                 | PWA is session-only.                                                                                                  |
| **File storage**        |  -  | Local files (File System Access API) + Azure Blob Storage | Azure customers get both local-file persistence and shared cloud storage in their own tenant.                         |
| **Shared team storage** |  -  | Azure Blob Storage                                        | Project-scoped Blob containers; project members in the same Azure AD tenant share access (ADR-059).                   |
| **Offline support**     |  ✓  | Cached                                                    | Azure caches for offline.                                                                                             |
| **Analysis save/load**  |  -  | ✓                                                         | PWA is session-only.                                                                                                  |
| **Export CSV**          |  ✓  | ✓                                                         |                                                                                                                       |
| **Export JSON**         |  -  | ✓                                                         | Azure only.                                                                                                           |
| **Screenshot export**   |  ✓  | ✓                                                         |                                                                                                                       |
| **Sync notifications**  |  -  | ✓                                                         | Toast feedback for sync status, errors.                                                                               |
| **Photo evidence**      |  -  | ✓ (membership-role-gated)                                 | Browser camera, stored in Blob Storage. Member+ within a Project. See [role gating](#project-membership-role-gating). |

---

## AI Features

| Feature                         | PWA | Azure (€120)              | Notes                                                                                                                                       |
| ------------------------------- | :-: | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **NarrativeBar**                |  -  | Optional                  | Plain-language analysis summary at dashboard bottom.                                                                                        |
| **ChartInsightChip**            |  -  | Optional                  | Per-chart contextual suggestions.                                                                                                           |
| **CoScoutPanel**                |  -  | ✓                         | Methodology-grounded coaching; tier1/2/3 prompt layering; mode-aware; 27-tool registry.                                                     |
| **Voice input to CoScout**      |  -  | Optional                  | Azure only. Tap/hold to transcribe into the normal CoScout draft. Replies remain text in v1.                                                |
| **Knowledge Base**              |  -  | Beta (ADR-060, Phase 2+)  | Azure AI Search unified knowledge index (Phase 2+). Per-project Blob Storage embeddings. SharePoint/Foundry IQ deferred per ADR-059.        |
| **Knowledge Catalyst**          |  -  | ✓ (membership-role-gated) | Organizational learning — resolved findings feed back into AI memory. Available within a Project; Lead role configures, Members contribute. |
| **Process description field**   |  -  | Optional                  | Free-text process context for AI grounding.                                                                                                 |
| **AI visibility toggle**        |  -  | Optional                  | Per-user "Show AI assistance" setting; default ON when endpoint exists.                                                                     |
| **Knowledge Catalyst Search**   |  -  | Beta (ADR-060, Phase 2+)  | Azure AI Search semantic search over per-project knowledge index. Phase 2+.                                                                 |
| **Findings Export (CSV/JSON)**  |  -  | ✓                         | Download findings as CSV (Excel-compatible) or structured JSON.                                                                             |
| **Findings Export (AI Report)** |  -  | Optional                  | AI-generated quality engineering report from findings data.                                                                                 |
| **Admin Hub**                   |  -  | ✓                         | Health checks, plan overview, Teams setup, KB setup, troubleshooting.                                                                       |

> AI features require customer-deployed Azure AI Foundry resources (optional ARM deployment checkbox). AI is included in the €120 SKU per [ADR-082](../07-decisions/adr-082-wedge-architecture.md). See [ADR-019](../07-decisions/adr-019-ai-integration.md). PWA never has AI.

---

## Collaboration & Project Membership

| Feature                         | PWA | Azure (€120)              | Notes                                                                                     |
| ------------------------------- | :-: | ------------------------- | ----------------------------------------------------------------------------------------- |
| **Shared Blob Storage**         |  -  | ✓                         | Projects stored in customer's Azure Blob Storage (ADR-059).                               |
| **Project sharing**             |  -  | ✓ (membership-role-gated) | Browse team projects, concurrent access with conflict notification. Lead invites members. |
| **Photo evidence in findings**  |  -  | ✓ (membership-role-gated) | Browser camera `<input capture>`, stored in Blob Storage. Member+ within a Project.       |
| **Team assignment**             |  -  | ✓ (membership-role-gated) | People picker for corrective action assignment. Lead/Member only.                         |
| **Deep links**                  |  -  | ✓                         | Shareable URLs to findings, charts, workspaces.                                           |
| **Phone-responsive carousel**   |  -  | ✓                         | Responsive mobile layout within Editor (browser-based).                                   |
| **Teams static tab (optional)** |  -  | Optional                  | Minimal manifest for Teams app bar presence (docs, not code dependency).                  |
| **Webhook notifications**       |  -  | Planned                   | Teams Incoming Webhook for channel alerts (future).                                       |

> ADR-059 replaces the previous Teams SDK integration (ADR-016, superseded). VariScout is web-first. Teams presence is optional via static tab — zero Graph API permissions required. Project membership scopes apply inside Azure; see [Project-membership-role gating](#project-membership-role-gating).

---

## Authentication & Security

| Feature                     | PWA | Azure (€120)              | Notes                                                                                 |
| --------------------------- | :-: | ------------------------- | ------------------------------------------------------------------------------------- |
| **Microsoft SSO**           |  -  | ✓                         | EasyAuth redirect.                                                                    |
| **Azure AD / Entra ID**     |  -  | ✓                         |                                                                                       |
| **Data in customer tenant** | N/A | ✓                         | PWA is local only.                                                                    |
| **No data transmission**    |  ✓  | ✓                         | All client-side.                                                                      |
| **Permissions scope**       |  -  | User.Read + People.Read   | Zero admin-consent permissions (ADR-059). People.Read used for project-member picker. |
| **Admin consent required**  |  -  | None                      | **No admin consent required.**                                                        |
| **Storage access**          |  -  | Azure RBAC (Blob Storage) | Standard Azure role assignments, not Graph API.                                       |

---

## Theming & Customization

| Feature                 | PWA | Azure (€120) | Notes                                                              |
| ----------------------- | :-: | :----------: | ------------------------------------------------------------------ |
| **Dark/Light theme**    |  ✓  |      ✓       | Both platforms support dark/light switching.                       |
| **System theme follow** |  ✓  |      ✓       | Both follow OS preference (default).                               |
| **Chart font scale**    |  ✓  |      ✓       | Compact / Normal / Large presets.                                  |
| **Settings panel**      |  ✓  |      ✓       | PWA: theme + display toggles + chart text size; Azure: + AI prefs. |
| **Branding removal**    |  -  |      ✓       | Azure only.                                                        |

---

## Learning & Help

| Feature                  | PWA | Azure (€120) | Notes            |
| ------------------------ | :-: | :----------: | ---------------- |
| **Help tooltips**        |  ✓  |      ✓       |                  |
| **Glossary integration** |  ✓  |      ✓       |                  |
| **"Learn more" links**   |  ✓  |      ✓       | Link to website. |
| **Sample case studies**  |  ✓  |      ✓       | PWA pre-loaded.  |

---

## Mobile-Specific Behavior

Features that behave differently on phone (<640px) versus desktop.

| Feature                          | PWA Desktop  |     PWA Mobile      |  Azure Desktop   |      Azure Mobile      |
| -------------------------------- | :----------: | :-----------------: | :--------------: | :--------------------: |
| HelpTooltip                      |    Hover     |   Tap toggle (P0)   |      Hover       |    Tap toggle (P0)     |
| NarrativeBar                     |  Full text   | Tap-to-expand (P0)  |    Full text     |   Tap-to-expand (P0)   |
| MobileCategorySheet              |     N/A      |          ✓          |       N/A        |           ✓            |
| Findings from charts             | Context menu | MobileCategorySheet |   Context menu   |  MobileCategorySheet   |
| CoScout focus context            |     N/A      |         N/A         |        ✓         |           ✓            |
| Offline sync indicator           |     N/A      |         N/A         |     Toolbar      |      Planned (P2)      |
| ColumnMapping phone optimization |      -       |    Planned (P2)     |        -         |      Planned (P2)      |
| Report View navigation           | Sidebar TOC  |         N/A         |   Sidebar TOC    |      Dropdown TOC      |
| Report chart snapshots           |    720px     |         N/A         |      720px       |       Responsive       |
| Staged comparison card           |    Inline    |         N/A         |      Inline      |   `overflow-x-auto`    |
| Assigned to me filter            |     N/A      |         N/A         | Toggle in header |    Toggle in header    |
| Board view (columns)             |    Popout    |         N/A         |      Popout      |  Accordion (in-panel)  |
| Finding action buttons           | Hover reveal |         N/A         |   Hover reveal   | Always visible (touch) |
| Improvement ideas buttons        | Hover reveal |         N/A         |   Hover reveal   | Always visible (touch) |

> P0 = Critical, P1 = High Impact, P2 = Polish. See ai-components.md and findings.md for detailed specs.

---

## Licensing & Pricing

| Aspect            | PWA                                                       | Azure (€120)                                                                            |
| ----------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Distribution**  | Direct URL                                                | Azure Marketplace Managed Application                                                   |
| **Pricing**       | FREE (forever)                                            | **€120/month**                                                                          |
| **Billing**       | N/A                                                       | Monthly (Managed Application)                                                           |
| **Users**         | N/A                                                       | Unlimited within the customer's Azure tenant                                            |
| **Features**      | Core analysis + Green Belt (no Performance Mode, no save) | Full product: analysis + persistence + CoScout AI + Project membership + Report sharing |
| **Auth**          | None                                                      | EasyAuth / Entra (User.Read + People.Read)                                              |
| **Storage**       | Session-only                                              | Local files (File System Access API) + Azure Blob Storage                               |
| **Admin consent** | N/A                                                       | None                                                                                    |

---

## Platform-Specific Features

### Azure Only (vs PWA)

- Performance Mode (multi-channel Cpk analysis)
- File upload (CSV/Excel)
- Save/persistence (local files via File System Access API, IndexedDB fallback, Azure Blob Storage for shared projects)
- EasyAuth authentication flow
- Branding removal
- ARM template deployment (Managed Application)
- Add data during analysis (paste/upload append with row/column auto-detection)
- Report workspace (workspace tab for report view, export, and PDF — replaces presentation mode)
- Closed-loop investigations: 5-status model (observed → resolved), suspected cause, corrective actions with due dates, outcome assessment with Cpk before/after
- Process Hub home screen: hub cards before investigation cards, with status/depth/action rollups and legacy investigations under General / Unassigned
- Project Dashboard: default landing for saved projects with status overview, What's New section, AI summary card, OtherProjectsList, and quick navigation
- ID-based deep links (UUID) to findings, charts, hypotheses, improvement workspace, and overview/analysis tabs; backward-compatible name fallback
- CoScout AI (methodology-grounded, mode-aware, tool-calling), voice input
- Project membership (Lead / Member / Sponsor) with project sharing, photo evidence, team assignment, Knowledge Catalyst — see [Project-membership-role gating](#project-membership-role-gating)
- Optional Teams presence via static tab (zero permissions)
- Webhook notifications for channel alerts (planned)

### PWA Only

- Free forever (training & education)
- Pre-loaded case study datasets
- Service Worker offline caching

---

## Project-membership-role gating

Within the €120 Azure SKU, features that involve team collaboration are gated by **project-membership role** rather than priced into a separate tier. A Project has exactly one Lead, zero or more Members, and zero or more Sponsors. Project members must share the same Azure AD tenant as the buyer; cross-org collaboration is out of V1 scope (a deliberate privacy boundary).

| Role        | Typical real-world counterpart                          | Capabilities                                                                                                                             |
| ----------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Lead**    | Black Belt / project lead / analyst running the project | Full edit; manages membership; configures Knowledge Catalyst; sets lifecycle stage; invites Members and Sponsors                         |
| **Member**  | SME, analyst, frontline contributor, quality engineer   | Full edit within project surfaces (findings, hypotheses, actions, photo evidence, contributes to Knowledge Catalyst); no membership mgmt |
| **Sponsor** | Executive sponsor / Champion                            | **Report-only at V1**; signoff handled out-of-band (email, e-sign, meeting). In-product signoff workflow defers post-V1.                 |

Role-gated features:

| Feature                          | Lead | Member | Sponsor | Notes                                                                                 |
| -------------------------------- | :--: | :----: | :-----: | ------------------------------------------------------------------------------------- |
| Project sharing / invite members |  ✓   |   -    |    -    | Only Lead manages the membership list.                                                |
| Photo evidence in findings       |  ✓   |   ✓    |    -    | Captures via browser camera; stored in project's Blob container.                      |
| Team assignment on actions       |  ✓   |   ✓    |    -    | People picker restricted to project members.                                          |
| Knowledge Catalyst contribution  |  ✓   |   ✓    |    -    | Resolved findings feed organizational AI memory. Lead configures; Members contribute. |
| Findings/Hypothesis edits        |  ✓   |   ✓    |    -    | Sponsor sees them in the Report; cannot edit.                                         |
| Action edits                     |  ✓   |   ✓    |    -    |                                                                                       |
| Lifecycle stage transitions      |  ✓   |   -    |    -    | Charter → Approach → Improve → Sustainment moves are Lead-only.                       |
| Report view                      |  ✓   |   ✓    |    ✓    | Sponsor's only access. Audience toggle (Technical / Summary) available to all roles.  |
| Report Save As / Share           |  ✓   |   ✓    |    -    | Sponsor can view in product; sharing artefacts is a Lead/Member function.             |

Outside a Project, a logged-in Azure user can paste data and analyze tenant-wide — this baseline analysis capability is not gated by project membership. Only the formal Project artifacts (Charter, Approach, Improve, Sustainment, Report) and the team-collaboration features above are membership-scoped.

---

## VariScout Process — future enterprise product (not in V1)

The legacy multi-persona / Hub-portfolio framing migrates to **VariScout Process**, a future enterprise product. It is not announced in V1 marketing and is mentioned only when customers ask about enterprise / process-ownership use cases. Deferred scope includes:

- 4-persona model (Process Owner / Project Lead / SME / Frontline) — V1 collapses to a single Improvement Specialist + project-membership roles (wedge spec §3.5; canonical design: [four-personas.md](../01-vision/variscout-process/four-personas.md))
- Process Hub as a user-visible primary container — V1 keeps Hub internal-only
- Process-owner cadence + Current Process State surfaces
- Multi-Hub portfolio scans + cross-Hub orchestration
- Process Measurement System as a separate surface
- Automated data pipelines (scheduled ingestion from MES/SCADA/historian)
- Five-response-path canvas drill (V1 reduces to 3: Investigate, Quick Action, Charter; Sustainment auto-fires; Handoff folds into Sustainment closure)
- Trainer / Student / Curious / Evaluator / Admin / Field persona variants — V1 single-persona, addressed via PWA vs Azure tier choice + project-membership role

These aren't lost — they're moved to a separate roadmap. See [USER-JOURNEYS.md](../USER-JOURNEYS.md) "What's out of V1 scope" and the [wedge architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) for canonical V1 boundaries.

---

## Delivered Features (Recently Shipped)

| Feature                              | Target Platform | Status                          |
| ------------------------------------ | --------------- | ------------------------------- |
| AI Integration (Phases 1–3)          | Azure           | Delivered (March 2026)          |
| Knowledge Base & Catalyst (Phase 3)  | Azure           | Delivered (March 2026, preview) |
| Admin Hub (4 phases)                 | Azure           | Delivered (March 2026)          |
| Closed-loop investigations           | Azure           | Delivered (ADR-015)             |
| Findings Export (CSV/JSON/AI Report) | Azure           | Delivered (March 2026)          |
| Portfolio Home + ProjectCard         | Azure           | Delivered (ADR-043, March 2026) |
| What's New / Metadata Sidecar        | Azure           | Delivered (ADR-043, March 2026) |
| ID-Based Deep Links (expanded)       | Azure           | Delivered (ADR-043, March 2026) |

---

## See Also

- [Products Overview](index.md)
- [Membership Philosophy](membership-philosophy.md) — How V1 access control works (one product, role-based access inside)
- [Azure App](azure/index.md)
- [PWA (Free Training Tool)](pwa/index.md)
- [Wedge architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) — V1 canonical anatomy
- [ADR-082: Wedge architecture](../07-decisions/adr-082-wedge-architecture.md)
- [ADR-007: Distribution Strategy](../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-015: Investigation Board](../07-decisions/adr-015-investigation-board.md)
- [ADR-059: Web-First Deployment Architecture](../07-decisions/adr-059-web-first-deployment-architecture.md)
- [ADR-019: AI Integration](../07-decisions/adr-019-ai-integration.md)
- [AI Components](../06-design-system/components/ai-components.md)
