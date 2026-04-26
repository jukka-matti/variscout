---
title: 'Feature Parity Matrix'
audience: [business, product]
category: strategy
status: stable
---

# Feature Parity Matrix

Complete feature availability across VariScout platforms.

---

## Platform Overview

| Platform           | Primary Use                                                | Status      | Distribution      | Price      |
| ------------------ | ---------------------------------------------------------- | ----------- | ----------------- | ---------- |
| **Azure Standard** | Full analysis with CoScout AI, local file storage          | **PRIMARY** | Azure Marketplace | €79/month  |
| **Azure Team**     | + Collaboration, cloud storage, mobile, Knowledge Catalyst | **PRIMARY** | Azure Marketplace | €199/month |
| **PWA**            | Training & education                                       | Production  | Direct URL        | FREE       |

> Per [ADR-033](../07-decisions/adr-033-pricing-simplification.md), Azure App is the only paid product with a two-plan model: Standard (€79/month) and Team (€199/month). AI is included in all plans. Knowledge Catalyst is a Team feature. All are Azure Marketplace Managed Applications. PWA is free forever. See [ADR-059](../07-decisions/adr-059-web-first-deployment-architecture.md) for the web-first deployment architecture and [ADR-019](../07-decisions/adr-019-ai-integration.md) for AI integration design.

---

## Core Analysis Features

| Feature                      | Azure Standard | Azure Team | PWA (Free) |
| ---------------------------- | :------------: | :--------: | :--------: | ------------------------------------------------------------------------------------------ |
| **I-Chart**                  |       ✓        |     ✓      |     ✓      |
| **Boxplot**                  |       ✓        |     ✓      |     ✓      |
| **Pareto**                   |       ✓        |     ✓      |     ✓      |
| **Capability Histogram**     |       ✓        |     ✓      |     ✓      |
| **Probability Plot**         |       ✓        |     ✓      |     ✓      |
| **Violin Mode**              |       ✓        |     ✓      |     ✓      |
| **Boxplot category sorting** |       ✓        |     ✓      |     ✓      |
| **Performance Mode**         |       ✓        |     ✓      |     -      |
| **Yamazumi (time study)**    |       ✓        |     ✓      |     ✓      | Auto-detected from activity type data                                                      |
| **Defect Analysis Mode**     |       ✓        |     ✓      |     ✓      | Auto-detected from defect/error data; 3 data shapes (event log, pre-aggregated, pass/fail) |
| **Defect Evidence Map**      |       ✓        |     ✓      |     ✓      | Three-view model: All Defects, Per-Type, Cross-Type insight                                |

> PWA includes core analysis charts plus Green Belt tools for training. Performance Mode requires the Azure App.

---

## Statistical Calculations

All platforms share `@variscout/core` and produce **identical results** for the features they support.

| Calculation           | Azure Standard | Azure Team | PWA | Formula Reference                                    |
| --------------------- | :------------: | :--------: | :-: | ---------------------------------------------------- |
| Mean, Median, Std Dev |       ✓        |     ✓      |  ✓  | Standard                                             |
| UCL/LCL (3σ)          |       ✓        |     ✓      |  ✓  | x̄ ± 3σ                                               |
| Cp, Cpk               |       ✓        |     ✓      |  ✓  | (USL-LSL)/6σ                                         |
| η² (Eta-squared)      |       ✓        |     ✓      |  ✓  | SS_between/SS_total                                  |
| F-statistic, p-value  |       ✓        |     ✓      |  ✓  | ANOVA                                                |
| Nelson Rule 2         |       ✓        |     ✓      |  ✓  | 9-point run                                          |
| Best subsets R²adj    |       ✓        |     ✓      |  ✓  | 2^k factor ranking                                   |
| Interaction screening |       ✓        |     ✓      |  ✓  | Pass 2 partial F-test (cont×cont, cont×cat, cat×cat) |

---

## Navigation & Interaction

| Feature                              | Azure Standard | Azure Team | PWA (Free) | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | :------------: | :--------: | :--------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drill-down**                       |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Linked filtering**                 |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Breadcrumb navigation**            |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Multi-select filters**             |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Observations & Findings**          |       ✓        |     ✓      |     ✓      | PWA: 3-status findings (observe, investigate, analyze) + tags + 3-column board. Azure Standard: 5-status closed-loop investigation with hypothesis tree, corrective actions, outcome assessment, 5-column board. Azure Team: + team assignment + knowledge base contribution                                                                                                                                                                                                                                                                                                                                   |
| **Voice input in findings/comments** |       ✓        |     ✓      |     -      | Azure only. Transcript-first draft capture for finding text and finding comments. Audio is not persisted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Question-Driven Investigation**    |       ✓        |     ✓      |   Basic    | Question-driven EDA model (ADR-053). Factor Intelligence generates ranked questions from best subsets R²adj; questions auto-answer when R²adj < 5%. Coverage metric tracks % of variation explored. PWA: question checklist + dashboard factor switching (≥2 factors). Azure Standard: + hypothesis tree (depth 3, max 30), gemba/expert tasks, issue statement sharpening, problem statement emergence, CoScout investigation sidebar. Azure Team: + Teams auto-post on convergence, task assignment. Mode-aware questions via ADR-054 (Capability: Cpk impact, Yamazumi: waste %, Performance: channel Cpk). |
| **Evidence Map**                     |       ✓        |     ✓      |  L1 only   | 3-layer visualization: L1 (Statistical, factor nodes by R²adj, 5 relationship types, equation bar) available in PWA + Azure. L2 (Investigation, causal links, evidence badges D/G/E) Azure only. L3 (Synthesis, hub convergence zones, projections) Azure only. Azure: Evidence Map is the Investigation workspace center (`InvestigationMapView`), with NodeContextMenu, CausalLinkCreator, PI panel deep linking. `FactorPreviewOverlay` shows at FRAME→SCOUT. `ReportEvidenceMap` timeline playback in Report. PWA: Layer 1 pop-out only.                                                                   |
| **SuspectedCause Hubs**              |       ✓        |     ✓      |     -      | Azure Standard + Team. Each investigated question is a hub entity aggregating evidence strength (R²adj/η²), validation type (data/gemba/expert), linked improvement ideas, and Problem Statement fragments (Watson Q1–Q3). Replaces flat `causeRole` tags with a first-class graph node. See [Investigation Workspace Reframing](../superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md).                                                                                                                                                                                                 |
| **Improvement Ideas**                |       ✓        |     ✓      |     ✓      | Brainstorm and evaluate ideas on supported hypotheses. Impact badge from What-If Explorer projection, timeframe/cost/risk ratings. Azure: + CoScout ideation coaching. PWA: session-only.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Improvement Workspace**            |       ✓        |     ✓      |     ✓      | Full-page improvement hub (3-column layout: context panel + hub + CoScout). Sub-features below. PWA: session-only, teaches the full IMPROVE phase.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **↳ Context panel**                  |       ✓        |     ✓      |     -      | Azure only. Left panel shows problem statement (pre-filled from Investigation), target metric, and suspected causes with evidence strength (R²adj/η²). Panel transitions to What-If when a cause's What-If button is tapped.                                                                                                                                                                                                                                                                                                                                                                                   |
| **↳ Prioritization matrix**          |       ✓        |     ✓      |     ✓      | Plan view: 2×2 effort/impact matrix with 4 axis presets (Effort/Impact, Cost/Benefit, Urgency/Confidence, Risk/Reach). Cause-colored ghost dots map ideas to suspected causes. PWA: matrix without cause colors.                                                                                                                                                                                                                                                                                                                                                                                               |
| **↳ What-If with context presets**   |       ✓        |     ✓      |     ✓      | What-If Explorer accessible from context panel (cause-scoped presets) and from idea cards (Azure). PWA: via standalone What-If page. Azure: ModelInformedEstimator renderer when regression model available.                                                                                                                                                                                                                                                                                                                                                                                                   |
| **↳ Action tracking**                |       ✓        |     ✓      |     -      | Azure only. Track view: action items converted from ideas, each with assignee, due date, completion checkbox. Finding status advances to `improving` when actions are assigned.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **↳ Verification (KPI grid)**        |       ✓        |     ✓      |     -      | Azure only. Track view: VerificationSection shows KPI grid (mean, sigma, Cpk before/after). Smart detection prompts when new data appears post-action.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **↳ Outcome assessment**             |       ✓        |     ✓      |     -      | Azure only. Track view: OutcomeSection records whether the improvement worked. Advances finding to `resolved`. Loops back to Plan if outcome is partial.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **↳ Brainstorm modal (HMW)**         |       ✓        |     ✓      |     -      | Azure only. Per-cause ideation with 4 HMW prompts, creative idea generation, dot-vote selection, and direction pre-setting. Standard: solo brainstorm with CoScout sparks. Team: + real-time collaborative sessions with anonymous voting.                                                                                                                                                                                                                                                                                                                                                                     |
| **Convergence Synthesis**            |       ✓        |     ✓      |     -      | Editable suspected cause narrative (max 500 chars). CoScout can draft.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **What-If Explorer**                 |       ✓        |     ✓      |     ✓      | Unified What-If Explorer (`WhatIfExplorer` in `@variscout/ui`) replaces WhatIfSimulator, PredictionProfiler, LeanWhatIfSimulator. Mode-aware: BasicEstimator (no model), ModelInformedEstimator (regression), ActivityReducer (yamazumi), ChannelAdjuster (performance). Principle: "Model informs, analyst estimates" — regression provides gap context, analyst sets closure fraction. `WhatIfExplorerPage` wraps with page chrome.                                                                                                                                                                          |
| **Keyboard navigation**              |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Copy chart to clipboard**          |       ✓        |     ✓      |     ✓      | Includes filter context bar when active                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Filter context on charts**         |       ✓        |     ✓      |     ✓      | Shows active filters inside chart cards; toggle in Settings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Editable chart titles**            |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Selection panel**                  |       ✓        |     ✓      |     ✓      | Minitab-style point brushing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Create Factor**                    |       ✓        |     ✓      |     ✓      | From point selection                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Focus mode (fullscreen chart)**    |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Report Workspace**                 |       ✓        |     ✓      |     ✓      | Report as a workspace tab. PWA: session-only report view + copy/PDF. Azure: + Share, Save As.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Project Dashboard**                |       ✓        |     ✓      |     -      | Investigation overview after opening a saved investigation. Status overview (findings by status, hypothesis tree, action progress), AI summary card, quick actions. Deep links bypass to Editor. PWA has no project persistence, so no dashboard.                                                                                                                                                                                                                                                                                                                                                              |
| **Report View (3 Workspaces)**       |       ✓        |     ✓      |     -      | 3 workspace-aligned report types (Analysis Snapshot, Investigation Report, Improvement Story), audience toggle (Technical/Summary), workspace-colored sections, Cpk Learning Loop.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Save as PDF (Report)**             |       ✓        |     ✓      |     -      | Print stylesheet + `window.print()` — produces professional PDF from Report View                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Process Hub Home Screen**          |       ✓        |     ✓      |     -      | Hub-first Azure home: Process Hub cards before individual investigation cards, rollups by status/depth/actions, and legacy investigations grouped under General / Unassigned. Azure-only (PWA has no persistence).                                                                                                                                                                                                                                                                                                                                                                                             |
| **What's New on Reopen**             |       ✓        |     ✓      |     -      | `WhatsNewSection` on Project Dashboard summarizes changes since `lastViewedAt` (new findings, hypothesis status changes, completed/overdue actions). Dismissed by user. Azure-only.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Deep Link Targets**                |       ✓        |     ✓      |     -      | ID-based links (UUID) replacing fragile name-based links. Targets: finding, chart, hypothesis, improvement workspace, overview tab, analysis tab. Legacy name links still resolve. Azure-only.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Median in Stats Panel**            |       ✓        |     ✓      |     ✓      | Always shown alongside Mean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Spec editing (Stats)**             |       ✓        |     ✓      |     ✓      | `onEditSpecs` callback; pencil link opens SpecEditor popover                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Chart color highlights**           |       ✓        |     ✓      |     ✓      | Desktop: right-click context menu. Mobile: tap → action sheet. Red/amber/green category markers (Boxplot, Pareto). I-Chart: desktop only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

---

## Data Handling

| Feature                           | Azure Standard | Azure Team | PWA (Free) | Notes                                                                                           |
| --------------------------------- | :------------: | :--------: | :--------: | ----------------------------------------------------------------------------------------------- |
| **CSV upload**                    |       ✓        |     ✓      |     -      | Azure App only                                                                                  |
| **Excel upload**                  |       ✓        |     ✓      |     -      | Azure App only                                                                                  |
| **Paste data**                    |       ✓        |     ✓      |     ✓      |                                                                                                 |
| **Sample datasets**               |       ✓        |     ✓      |     ✓      | PWA pre-loaded with cases                                                                       |
| **Column mapping**                |       ✓        |     ✓      |     ✓      | Data-rich cards with type badges, sample values, data preview                                   |
| **Spec entry at column mapping**  |       ✓        |     ✓      |     ✓      | Collapsible SpecsSection in ColumnMapping                                                       |
| **Column data preview**           |       ✓        |     ✓      |     ✓      | Collapsible mini-table showing first 5 rows                                                     |
| **Column renaming at setup**      |       ✓        |     ✓      |     ✓      | Pencil icon on column cards → `columnAliases`                                                   |
| **Time factor extraction**        |       ✓        |     ✓      |     ✓      | Extract year/month/weekday/hour from date columns                                               |
| **Inline data editing**           |       ✓        |     ✓      |     ✓      | Edit cells, add/delete rows, batch apply                                                        |
| **Add data during analysis**      |       ✓        |     ✓      |     -      | Paste/upload/manual append with auto-detection                                                  |
| **Manual entry**                  |       ✓        |     ✓      |     ✓      |                                                                                                 |
| **Data validation**               |       ✓        |     ✓      |     ✓      |                                                                                                 |
| **Row limit**                     |    250,000     |  250,000   |   50,000   | Configurable via `DataIngestionConfig`. Mobile limits are lower: PWA 10K / Azure 50K (ADR-039). |
| **Max factors**                   |       6        |     6      |     3      | Configurable via `maxFactors` prop                                                              |
| **Factor management in analysis** |       ✓        |     ✓      |     ✓      | Both: ColumnMapping re-edit via "Factors" button in nav bar                                     |

---

## Persistence & Storage

| Feature                 |            Azure Standard            |            Azure Team            | PWA (Free) | Notes                                  |
| ----------------------- | :----------------------------------: | :------------------------------: | :--------: | -------------------------------------- |
| **Local storage**       |              IndexedDB               |            IndexedDB             |     -      | PWA is session-only                    |
| **File storage**        | Local files (File System Access API) | Local files + Azure Blob Storage |     -      | Team adds shared cloud storage         |
| **Shared team storage** |                  -                   |        Azure Blob Storage        |     -      | Team plan only (ADR-059)               |
| **Offline support**     |                Cached                |              Cached              |     ✓      | Azure caches for offline               |
| **Analysis save/load**  |                  ✓                   |                ✓                 |     -      | PWA is session-only                    |
| **Export CSV**          |                  ✓                   |                ✓                 |     ✓      |                                        |
| **Export JSON**         |                  ✓                   |                ✓                 |     -      | Azure App only                         |
| **Screenshot export**   |                  ✓                   |                ✓                 |     ✓      |                                        |
| **Sync notifications**  |                  -                   |                ✓                 |     -      | Toast feedback for sync status, errors |
| **Photo evidence**      |                  -                   |                ✓                 |     -      | Browser camera, stored in Blob Storage |

---

## AI Features

| Feature                         | Azure Standard |   Azure Team   | PWA (Free) | Notes                                                                                                        |
| ------------------------------- | :------------: | :------------: | :--------: | ------------------------------------------------------------------------------------------------------------ |
| **NarrativeBar**                |    Optional    |    Optional    |     -      | Plain-language analysis summary at dashboard bottom                                                          |
| **ChartInsightChip**            |    Optional    |    Optional    |     -      | Per-chart contextual suggestions                                                                             |
| **CoScoutPanel**                |    Optional    |    Enhanced    |     -      | Team: methodology-grounded, knowledge-base-aware                                                             |
| **Voice input to CoScout**      |    Optional    |    Optional    |     -      | Azure only. Tap/hold to transcribe into the normal CoScout draft. Replies remain text in v1.                 |
| **Knowledge Base**              |       -        | Beta (ADR-060) |     -      | Foundry IQ unified knowledge index (ADR-060). Per-project Blob Storage embeddings replace SharePoint search. |
| **Knowledge Catalyst**          |       -        |       ✓        |     -      | Organizational learning — resolved findings feed back into AI memory (Team only)                             |
| **Process description field**   |    Optional    |    Optional    |     -      | Free-text process context for AI grounding                                                                   |
| **AI visibility toggle**        |    Optional    |    Optional    |     -      | Per-user "Show AI assistance" setting; default ON when endpoint exists                                       |
| **Knowledge Base Search**       |       -        | Beta (ADR-060) |     -      | Foundry IQ semantic search over per-project knowledge index (ADR-060).                                       |
| **Findings Export (CSV/JSON)**  |       ✓        |       ✓        |     -      | Download findings as CSV (Excel-compatible) or structured JSON                                               |
| **Findings Export (AI Report)** |    Optional    |    Optional    |     -      | AI-generated quality engineering report from findings data                                                   |
| **Admin Hub**                   |       ✓        |       ✓        |     -      | Health checks, plan overview, Teams setup (Team), KB setup (Team), troubleshooting                           |

> AI features require customer-deployed Azure AI Foundry resources (optional ARM deployment checkbox). AI is included in all Azure plans per [ADR-033](../07-decisions/adr-033-pricing-simplification.md). See [ADR-019](../07-decisions/adr-019-ai-integration.md). PWA never has AI.

---

## Collaboration & Teams Presence

| Feature                         | Azure Standard | Azure Team | PWA (Free) | Notes                                                                   |
| ------------------------------- | :------------: | :--------: | :--------: | ----------------------------------------------------------------------- |
| **Shared Blob Storage**         |       -        |     ✓      |     -      | Projects stored in customer's Azure Blob Storage (ADR-059)              |
| **Project sharing**             |       -        |     ✓      |     -      | Browse team projects, concurrent access with conflict notification      |
| **Photo evidence in findings**  |       -        |     ✓      |     -      | Browser camera `<input capture>`, stored in Blob Storage                |
| **Team assignment**             |       -        |     ✓      |     -      | People picker for corrective action assignment                          |
| **Deep links**                  |       ✓        |     ✓      |     -      | Shareable URLs to findings, charts, workspaces                          |
| **Phone-responsive carousel**   |       ✓        |     ✓      |     -      | Responsive mobile layout within Editor (browser-based)                  |
| **Teams static tab (optional)** |       -        |  Optional  |     -      | Minimal manifest for Teams app bar presence (docs, not code dependency) |
| **Webhook notifications**       |       -        |  Planned   |     -      | Teams Incoming Webhook for channel alerts (future)                      |

> ADR-059 replaces the previous Teams SDK integration (ADR-016, superseded). VariScout is now a web-first application. Teams presence is optional via static tab — zero Graph API permissions required.

---

## Authentication & Security

| Feature                     | Azure Standard |        Azure Team         | PWA (Free) | Notes                                          |
| --------------------------- | :------------: | :-----------------------: | :--------: | ---------------------------------------------- |
| **Microsoft SSO**           |       ✓        |             ✓             |     -      | EasyAuth redirect (both tiers)                 |
| **Azure AD / Entra ID**     |       ✓        |             ✓             |     -      |                                                |
| **Data in customer tenant** |       ✓        |             ✓             |    N/A     | PWA is local only                              |
| **No data transmission**    |       ✓        |             ✓             |     ✓      | All client-side                                |
| **Permissions scope**       |   User.Read    |  User.Read + People.Read  |     -      | Zero admin-consent permissions (ADR-059)       |
| **Admin consent required**  |       -        |             -             |     -      | **No admin consent required for either tier**  |
| **Storage access**          |       -        | Azure RBAC (Blob Storage) |     -      | Standard Azure role assignments, not Graph API |

---

## Theming & Customization

| Feature                 | Azure Standard | Azure Team | PWA (Free) | Notes                                                             |
| ----------------------- | :------------: | :--------: | :--------: | ----------------------------------------------------------------- |
| **Dark/Light theme**    |       ✓        |     ✓      |     ✓      | All platforms support dark/light switching                        |
| **System theme follow** |       ✓        |     ✓      |     ✓      | All platforms follow OS preference (default)                      |
| **Chart font scale**    |       ✓        |     ✓      |     ✓      | Compact / Normal / Large presets in all apps                      |
| **Settings panel**      |       ✓        |     ✓      |     ✓      | PWA: theme + display toggles + chart text size; Azure: + AI prefs |
| **Branding removal**    |       ✓        |     ✓      |     -      | Azure App only                                                    |

---

## Learning & Help

| Feature                  | Azure Standard | Azure Team | PWA (Free) | Notes           |
| ------------------------ | :------------: | :--------: | :--------: | --------------- |
| **Help tooltips**        |       ✓        |     ✓      |     ✓      |                 |
| **Glossary integration** |       ✓        |     ✓      |     ✓      |                 |
| **"Learn more" links**   |       ✓        |     ✓      |     ✓      | Link to website |
| **Sample case studies**  |       ✓        |     ✓      |     ✓      | PWA pre-loaded  |

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

| Aspect            | Azure Standard                       | Azure Team                                                        | PWA (Free)                                                |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------- |
| **Distribution**  | Azure Marketplace                    | Azure Marketplace                                                 | Direct URL                                                |
| **Pricing**       | €79/month                            | €199/month                                                        | FREE (forever)                                            |
| **Billing**       | Monthly (Managed Application)        | Monthly (Managed Application)                                     | N/A                                                       |
| **Users**         | Unlimited (per-deployment)           | Unlimited (per-deployment)                                        | N/A                                                       |
| **Features**      | All analysis + CoScout AI            | All analysis + collaboration + cloud storage + Knowledge Catalyst | Core analysis + Green Belt (no Performance Mode, no save) |
| **Auth**          | EasyAuth / Entra (User.Read)         | EasyAuth / Entra (User.Read + People.Read)                        | None                                                      |
| **Storage**       | Local files (File System Access API) | + Azure Blob Storage (shared team projects)                       | Session-only                                              |
| **Admin consent** | None                                 | None                                                              | N/A                                                       |

---

## Platform-Specific Features

### Azure Standard Only (vs PWA)

- Performance Mode (multi-channel Cpk analysis)
- File upload (CSV/Excel)
- Save/persistence (local files via File System Access API, IndexedDB fallback)
- EasyAuth authentication flow
- Branding removal
- ARM template deployment (Managed Application)
- Add data during analysis (paste/upload append with row/column auto-detection)
- Report workspace (workspace tab for report view, export, and PDF — replaces presentation mode)
- Closed-loop investigations: 5-status model (observed → resolved), suspected cause, corrective actions with due dates, outcome assessment with Cpk before/after
- Process Hub home screen: hub cards before investigation cards, with status/depth/action rollups and legacy investigations under General / Unassigned
- Project Dashboard: default landing for saved projects with status overview, What's New section, AI summary card, OtherProjectsList, and quick navigation (PWA has no project persistence)
- ID-based deep links (UUID) to findings, charts, hypotheses, improvement workspace, and overview/analysis tabs; backward-compatible name fallback

### Azure Team Only (vs Standard)

- Shared Azure Blob Storage for team projects (customer's resource group)
- Project sharing with concurrent access and conflict notification
- Photo evidence capture in findings (browser camera + Blob Storage)
- Sync notifications (toast feedback for cloud operations)
- Team assignment on corrective actions (people picker for team members)
- Knowledge Catalyst (organizational learning from resolved findings)
- AI-enhanced CoScout with methodology-grounded assistant
- Optional Teams presence via static tab (zero permissions)
- Webhook notifications for channel alerts (planned)

### PWA Only

- Free forever (training & education)
- Pre-loaded case study datasets
- Service Worker offline caching

---

## Delivered Features (Recently Shipped)

| Feature                              | Target Platform       | Status                          |
| ------------------------------------ | --------------------- | ------------------------------- |
| AI Integration (Phases 1–3)          | Azure Standard + Team | Delivered (March 2026)          |
| Knowledge Base & Catalyst (Phase 3)  | Azure Team            | Delivered (March 2026, preview) |
| Admin Hub (4 phases)                 | Azure Standard + Team | Delivered (March 2026)          |
| Closed-loop investigations           | Azure Standard + Team | Delivered (ADR-015)             |
| Findings Export (CSV/JSON/AI Report) | Azure Standard+       | Delivered (March 2026)          |
| Portfolio Home + ProjectCard         | Azure Standard + Team | Delivered (ADR-043, March 2026) |
| What's New / Metadata Sidecar        | Azure Standard + Team | Delivered (ADR-043, March 2026) |
| ID-Based Deep Links (expanded)       | Azure Standard + Team | Delivered (ADR-043, March 2026) |

---

## See Also

- [Products Overview](index.md)
- [Tier Philosophy](tier-philosophy.md) — Why features are gated where they are
- [Azure App](azure/index.md)
- [PWA (Free Training Tool)](pwa/index.md)
- [ADR-007: Distribution Strategy](../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-015: Investigation Board](../07-decisions/adr-015-investigation-board.md)
- [ADR-059: Web-First Deployment Architecture](../07-decisions/adr-059-web-first-deployment-architecture.md)
- [ADR-019: AI Integration](../07-decisions/adr-019-ai-integration.md)
- [AI Components](../06-design-system/components/ai-components.md)
