---
title: 'Feature Parity Matrix'
---

# Feature Parity Matrix

Complete feature availability across VariScout platforms.

---

## Platform Overview

| Platform           | Primary Use                                       | Status      | Distribution      | Price      |
| ------------------ | ------------------------------------------------- | ----------- | ----------------- | ---------- |
| **Azure Standard** | Full analysis with CoScout AI, local file storage | **PRIMARY** | Azure Marketplace | €79/month  |
| **Azure Team**     | + Teams, cloud storage, mobile, AI Knowledge Base | **PRIMARY** | Azure Marketplace | €199/month |
| **PWA**            | Training & education                              | Production  | Direct URL        | FREE       |

> Per [ADR-033](../07-decisions/adr-033-pricing-simplification.md), Azure App is the only paid product with a two-plan model: Standard (€79/month) and Team (€199/month). AI is included in all plans. Knowledge Base is a Team feature. All are Azure Marketplace Managed Applications. PWA is free forever. See [ADR-016](../07-decisions/adr-016-teams-integration.md) for Teams integration design and [ADR-019](../07-decisions/adr-019-ai-integration.md) for AI integration design.

---

## Core Analysis Features

| Feature                      | Azure Standard | Azure Team | PWA (Free) |
| ---------------------------- | :------------: | :--------: | :--------: | ------------------------------------- |
| **I-Chart**                  |       ✓        |     ✓      |     ✓      |
| **Boxplot**                  |       ✓        |     ✓      |     ✓      |
| **Pareto**                   |       ✓        |     ✓      |     ✓      |
| **Capability Histogram**     |       ✓        |     ✓      |     ✓      |
| **Probability Plot**         |       ✓        |     ✓      |     ✓      |
| **Violin Mode**              |       ✓        |     ✓      |     ✓      |
| **Boxplot category sorting** |       ✓        |     ✓      |     ✓      |
| **Performance Mode**         |       ✓        |     ✓      |     -      |
| **Yamazumi (time study)**    |       ✓        |     ✓      |     ✓      | Auto-detected from activity type data |

> PWA includes core analysis charts plus Green Belt tools for training. Performance Mode requires the Azure App.

---

## Statistical Calculations

All platforms share `@variscout/core` and produce **identical results** for the features they support.

| Calculation           | Azure Standard | Azure Team | PWA | Formula Reference   |
| --------------------- | :------------: | :--------: | :-: | ------------------- |
| Mean, Median, Std Dev |       ✓        |     ✓      |  ✓  | Standard            |
| UCL/LCL (3σ)          |       ✓        |     ✓      |  ✓  | x̄ ± 3σ              |
| Cp, Cpk               |       ✓        |     ✓      |  ✓  | (USL-LSL)/6σ        |
| η² (Eta-squared)      |       ✓        |     ✓      |  ✓  | SS_between/SS_total |
| F-statistic, p-value  |       ✓        |     ✓      |  ✓  | ANOVA               |
| Nelson Rule 2         |       ✓        |     ✓      |  ✓  | 9-point run         |

---

## Navigation & Interaction

| Feature                           | Azure Standard | Azure Team | PWA (Free) | Notes                                                                                                                                                                                                                                                                        |
| --------------------------------- | :------------: | :--------: | :--------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drill-down**                    |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                              |
| **Linked filtering**              |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                              |
| **Breadcrumb navigation**         |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                              |
| **Multi-select filters**          |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                              |
| **Observations & Findings**       |       ✓        |     ✓      |     ✓      | PWA: 3-status findings (observe, investigate, analyze) + tags + 3-column board. Azure Standard: 5-status closed-loop investigation with hypothesis tree, corrective actions, outcome assessment, 5-column board. Azure Team: + team assignment + knowledge base contribution |
| **Hypothesis Investigation**      |       ✓        |     ✓      |   Basic    | PWA: single hypothesis per finding, auto-validation, max 5. Azure Standard: + hypothesis tree (depth 3, max 30), gemba/expert tasks, progress tracking, tree view, CoScout investigation sidebar. Azure Team: + Teams auto-post on convergence, task assignment              |
| **Improvement Ideas**             |       ✓        |     ✓      |     -      | Brainstorm and evaluate ideas on supported hypotheses. Impact badge from What-If projection, timeframe/cost/risk ratings, CoScout ideation coaching. Requires hypothesis tree (no PWA)                                                                                       |
| **Improvement Workspace**         |       ✓        |     ✓      |     -      | Full-page improvement planning: synthesis card, idea groups by hypothesis, timeframe/cost/risk dropdowns, prioritization matrix, convert to actions. PWA stops at Analyzed status.                                                                                           |
| **Convergence Synthesis**         |       ✓        |     ✓      |     -      | Editable suspected cause narrative (max 500 chars). CoScout can draft.                                                                                                                                                                                                       |
| **What-If Simulator**             |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                              |
| **Keyboard navigation**           |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                              |
| **Copy chart to clipboard**       |       ✓        |     ✓      |     ✓      | Includes filter context bar when active                                                                                                                                                                                                                                      |
| **Filter context on charts**      |       ✓        |     ✓      |     ✓      | Shows active filters inside chart cards; toggle in Settings                                                                                                                                                                                                                  |
| **Editable chart titles**         |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                              |
| **Selection panel**               |       ✓        |     ✓      |     ✓      | Minitab-style point brushing                                                                                                                                                                                                                                                 |
| **Create Factor**                 |       ✓        |     ✓      |     ✓      | From point selection                                                                                                                                                                                                                                                         |
| **Focus mode (fullscreen chart)** |       ✓        |     ✓      |     ✓      |                                                                                                                                                                                                                                                                              |
| **Presentation Mode**             |       ✓        |     ✓      |     -      | Full-screen grid overview + focused chart view                                                                                                                                                                                                                               |
| **Report View (3 Workspaces)**    |       ✓        |     ✓      |     -      | 3 workspace-aligned report types (Analysis Snapshot, Investigation Report, Improvement Story), audience toggle (Technical/Summary), workspace-colored sections, Cpk Learning Loop.                                                                                           |
| **Save as PDF (Report)**          |       ✓        |     ✓      |     -      | Print stylesheet + `window.print()` — produces professional PDF from Report View                                                                                                                                                                                             |
| **Median in Stats Panel**         |       ✓        |     ✓      |     ✓      | Always shown alongside Mean                                                                                                                                                                                                                                                  |
| **Spec editing (Stats)**          |       ✓        |     ✓      |     ✓      | `onEditSpecs` callback; pencil link opens SpecEditor popover                                                                                                                                                                                                                 |
| **Chart color highlights**        |       ✓        |     ✓      |     ✓      | Desktop: right-click context menu. Mobile: tap → action sheet. Red/amber/green category markers (Boxplot, Pareto). I-Chart: desktop only.                                                                                                                                    |

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

| Feature                    |            Azure Standard            |             Azure Team              | PWA (Free) | Notes                                         |
| -------------------------- | :----------------------------------: | :---------------------------------: | :--------: | --------------------------------------------- |
| **Local storage**          |              IndexedDB               |              IndexedDB              |     -      | PWA is session-only                           |
| **File storage**           | Local files (File System Access API) | Local files + OneDrive + SharePoint |     -      | Team adds cloud sync                          |
| **Channel storage**        |                  -                   |      SharePoint (per channel)       |     -      | Team plan only                                |
| **Offline support**        |                Cached                |               Cached                |     ✓      | Azure caches for offline                      |
| **Analysis save/load**     |                  ✓                   |                  ✓                  |     -      | PWA is session-only                           |
| **Export CSV**             |                  ✓                   |                  ✓                  |     ✓      |                                               |
| **Export JSON**            |                  ✓                   |                  ✓                  |     -      | Azure App only                                |
| **Screenshot export**      |                  ✓                   |                  ✓                  |     ✓      |                                               |
| **Sync notifications**     |                  -                   |                  ✓                  |     -      | Toast feedback for sync status, errors, auth  |
| **SharePoint file picker** |                  -                   |                  ✓                  |     -      | Browse SP for import, open, save-as (ADR-030) |
| **Report publish URL**     |                  -                   |                  ✓                  |     -      | Clickable "Open in SharePoint" after publish  |

---

## AI Features

| Feature                         | Azure Standard | Azure Team | PWA (Free) | Notes                                                                              |
| ------------------------------- | :------------: | :--------: | :--------: | ---------------------------------------------------------------------------------- |
| **NarrativeBar**                |    Optional    |  Optional  |     -      | Plain-language analysis summary at dashboard bottom                                |
| **ChartInsightChip**            |    Optional    |  Optional  |     -      | Per-chart contextual suggestions                                                   |
| **CoScoutPanel**                |    Optional    |  Enhanced  |     -      | Team: methodology-grounded, knowledge-base-aware                                   |
| **AI Knowledge Base**           |       -        |     ✓      |     -      | Remote SharePoint knowledge search via Azure AI Search (Team only)                 |
| **Organizational learning**     |       -        |     ✓      |     -      | Published scouting reports feed back into knowledge base (Team only)               |
| **Process description field**   |    Optional    |  Optional  |     -      | Free-text process context for AI grounding                                         |
| **AI visibility toggle**        |    Optional    |  Optional  |     -      | Per-user "Show AI assistance" setting; default ON when endpoint exists             |
| **Knowledge Base Search**       |       -        |  Preview   |     -      | On-demand search via Remote SharePoint knowledge source (Team only)                |
| **KB Freshness Indicator**      |       -        |     ✓      |     -      | Scope label + relative timestamp below KB results                                  |
| **KB Permission Warning**       |       -        |     ✓      |     -      | Amber warning when admin consent missing for SharePoint                            |
| **Findings Export (CSV/JSON)**  |       ✓        |     ✓      |     -      | Download findings as CSV (Excel-compatible) or structured JSON                     |
| **Findings Export (AI Report)** |    Optional    |  Optional  |     -      | AI-generated quality engineering report from findings data                         |
| **Admin Hub**                   |       ✓        |     ✓      |     -      | Health checks, plan overview, Teams setup (Team), KB setup (Team), troubleshooting |

> AI features require customer-deployed Azure AI Foundry resources (optional ARM deployment checkbox). AI is included in all Azure plans per [ADR-033](../07-decisions/adr-033-pricing-simplification.md). See [ADR-019](../07-decisions/adr-019-ai-integration.md). PWA never has AI.

---

## Teams Integration

| Feature                               | Azure Standard | Azure Team | PWA (Free) | Notes                                                               |
| ------------------------------------- | :------------: | :--------: | :--------: | ------------------------------------------------------------------- |
| **Teams channel tab**                 |       -        |     ✓      |     -      | Shared analysis in team channels                                    |
| **Teams personal tab**                |       -        |     ✓      |     -      | Personal analysis within Teams                                      |
| **Teams SSO**                         |       -        |     ✓      |     -      | On-Behalf-Of token exchange                                         |
| **Channel file storage (SharePoint)** |       -        |     ✓      |     -      | .vrs files in channel document library                              |
| **Photo evidence in findings**        |       -        |     ✓      |     -      | Teams SDK `media.selectMedia()` + HTML5 fallback; channel storage   |
| **Deep links to charts**              |       -        |     ✓      |     -      | Share chart URLs via Teams chat                                     |
| **Adaptive Cards sharing**            |       -        |     ✓      |     -      | Auto-post on analyzed/resolved status with @mentions and deep links |
| **Teams mobile access**               |       -        |     ✓      |     -      | Full analysis via Teams mobile app                                  |
| **Phone-responsive carousel**         |       -        |     ✓      |     -      | Responsive mobile layout within Editor                              |

> See [ADR-016](../07-decisions/adr-016-teams-integration.md) for full Teams integration technical design.

---

## Authentication & Security

| Feature                     | Azure Standard |                  Azure Team                  | PWA (Free) | Notes                                          |
| --------------------------- | :------------: | :------------------------------------------: | :--------: | ---------------------------------------------- |
| **Microsoft SSO**           |       ✓        |                      ✓                       |     -      | EasyAuth redirect (Standard), Teams SSO (Team) |
| **Azure AD / Entra ID**     |       ✓        |                      ✓                       |     -      |                                                |
| **Data in customer tenant** |       ✓        |                      ✓                       |    N/A     | PWA is local only                              |
| **No data transmission**    |       ✓        |                      ✓                       |     ✓      | All client-side                                |
| **Permissions scope**       |   User.Read    | + Files.ReadWrite.All, Channel.ReadBasic.All |     -      | Team requires admin consent                    |
| **Admin consent required**  |       -        |                      ✓                       |     -      | One-time tenant admin approval                 |

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
| **Features**      | All analysis + CoScout AI            | All analysis + Teams + cloud storage + mobile + AI Knowledge Base | Core analysis + Green Belt (no Performance Mode, no save) |
| **Auth**          | EasyAuth / Entra (User.Read)         | EasyAuth + Teams SSO (+ Files, Channels)                          | None                                                      |
| **Storage**       | Local files (File System Access API) | + OneDrive + SharePoint channels + AI Search                      | Session-only                                              |
| **Admin consent** | None                                 | Required (one-time)                                               | N/A                                                       |

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
- Presentation mode (full-screen chart overview with focused navigation)
- Closed-loop investigations: 5-status model (observed → resolved), suspected cause, corrective actions with due dates, outcome assessment with Cpk before/after

### Azure Team Only (vs Standard)

- OneDrive personal file sync
- SharePoint channel file storage
- Teams channel tab and personal tab
- Teams SSO (On-Behalf-Of token exchange)
- Phone-responsive carousel for gemba investigations (responsive layout within Editor)
- Photo evidence capture in findings (camera + channel storage)
- Adaptive Cards for status updates (analyzed/resolved findings)
- Teams mobile access
- Sync notifications (toast feedback for cloud operations)
- Team assignment on corrective actions (people picker for team members)
- Teams auto-posting on finding analyzed + resolved status changes
- AI Knowledge Base via Azure AI Search (Remote SharePoint knowledge source)
- AI-enhanced CoScout with methodology-grounded assistant
- Report publishing to SharePoint (searchable by future investigations)

### PWA Only

- Free forever (training & education)
- Pre-loaded case study datasets
- Service Worker offline caching

---

## Delivered Features (Recently Shipped)

| Feature                              | Target Platform       | Status                          |
| ------------------------------------ | --------------------- | ------------------------------- |
| AI Integration (Phases 1–3)          | Azure Standard + Team | Delivered (March 2026)          |
| AI Knowledge Base (Phase 3)          | Azure Team            | Delivered (March 2026, preview) |
| Admin Hub (4 phases)                 | Azure Standard + Team | Delivered (March 2026)          |
| Closed-loop investigations           | Azure Standard + Team | Delivered (ADR-015)             |
| Findings Export (CSV/JSON/AI Report) | Azure Standard+       | Delivered (March 2026)          |

---

## See Also

- [Products Overview](index.md)
- [Tier Philosophy](tier-philosophy.md) — Why features are gated where they are
- [Azure App](azure/index.md)
- [PWA (Free Training Tool)](pwa/index.md)
- [ADR-007: Distribution Strategy](../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-015: Investigation Board](../07-decisions/adr-015-investigation-board.md)
- [ADR-016: Teams Integration](../07-decisions/adr-016-teams-integration.md)
- [ADR-019: AI Integration](../07-decisions/adr-019-ai-integration.md)
- [AI Components](../06-design-system/components/ai-components.md)
