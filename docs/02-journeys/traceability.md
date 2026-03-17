---
title: Journey Traceability Index
audience: [analyst, engineer]
category: reference
status: stable
related: [flows, hooks, components, packages]
---

# Journey Traceability Index

Bidirectional mapping between user journey steps and implementation components.

---

## Forward Mapping: Journey → Code

### Flow 1: SEO Learner

Google search → tool page → product discovery.

| Step                    | Action                             | Package                                | Key Components                   |
| ----------------------- | ---------------------------------- | -------------------------------------- | -------------------------------- |
| 1. Land on tool page    | View interactive chart explanation | `apps/website`                         | Astro pages, React islands       |
| 2. Try interactive demo | Explore sample data in chart       | `@variscout/charts`, `@variscout/data` | IChart, Boxplot, sample datasets |
| 3. Hit PWA limits       | Attempt file upload or save        | `@variscout/ui`                        | `UpgradePrompt`                  |
| 4. Visit pricing        | Evaluate plans                     | `apps/website`                         | Pricing page                     |

### Flow 2: Social Discovery

LinkedIn/social post → case study → aha moment.

| Step                       | Action                             | Package                           | Key Components                   |
| -------------------------- | ---------------------------------- | --------------------------------- | -------------------------------- |
| 1. Read case study         | View bottleneck analysis story     | `apps/website`, `@variscout/data` | Case pages, `bottleneck` dataset |
| 2. Interactive exploration | Click charts, see linked filtering | `@variscout/charts`               | IChart, Boxplot, Pareto          |
| 3. Aha moment              | See 46% isolated to one condition  | `@variscout/core`                 | `calculateStats()`, η²           |

### Flow 3: Content & YouTube

Video discovery → website → product.

| Step             | Action                         | Package            | Key Components          |
| ---------------- | ------------------------------ | ------------------ | ----------------------- |
| 1. Watch video   | Educational content with demos | External (YouTube) | —                       |
| 2. Visit website | Land on tool/blog page         | `apps/website`     | Astro pages             |
| 3. Try PWA       | Start free analysis            | `apps/pwa`         | HomeScreen, DataContext |

### Flow 4: Enterprise Evaluation

Referral → self-serve evaluation → deployment.

| Step                    | Action                         | Package               | Key Components                                 |
| ----------------------- | ------------------------------ | --------------------- | ---------------------------------------------- |
| 1. Review security docs | Evaluate SSO, data sovereignty | `apps/website`        | Enterprise pages                               |
| 2. Deploy ARM template  | 1-click Azure deployment       | `infra/`              | `mainTemplate.json`, `createUiDefinition.json` |
| 3. Team onboards        | SSO login, first analysis      | `apps/azure/src/auth` | `easyAuth.ts`                                  |

### Flow 5: Return Visitor

Bookmark/history → resume work.

| Step                 | Action                       | Package                            | Key Components                     |
| -------------------- | ---------------------------- | ---------------------------------- | ---------------------------------- |
| 1. Auto-authenticate | SSO session cookie           | `apps/azure/src/auth`              | `easyAuth.ts`, `getEasyAuthUser()` |
| 2. Restore analysis  | Load from IndexedDB/OneDrive | `@variscout/hooks`                 | `useProjectPersistence`            |
| 3. Hit PWA ceiling   | See upgrade prompt           | `@variscout/ui`, `@variscout/core` | `UpgradePrompt`, `tier.ts`         |

### Flow 6: Azure First Analysis

First login → first saved analysis (activation).

| Step                | Action                          | Package                              | Key Components                                                        |
| ------------------- | ------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| 1. Sign in          | EasyAuth redirect + consent     | `apps/azure/src/auth`                | `easyAuth.ts`                                                         |
| 2. Load data        | Upload CSV/paste/sample         | `@variscout/core`                    | `parseText()`, `parseFile()`, `detectColumns()`                       |
| 3. Map columns      | Select outcome + factors        | `@variscout/ui`                      | `ColumnMapping`, `MeasureColumnSelector`                              |
| 4. View dashboard   | All 4 charts render             | `@variscout/charts`, `@variscout/ui` | `IChart`, `Boxplot`, `Pareto`, `CapabilityHistogram`, `DashboardBase` |
| 5. First drill-down | Click Boxplot bar → filter      | `@variscout/hooks`                   | `useFilterNavigation`, `useDataState`                                 |
| 6. Pin finding      | Right-click → "Add observation" | `@variscout/hooks`, `@variscout/ui`  | `useFindings`, `AnnotationContextMenu`, `FindingsPanelBase`           |
| 7. Add hypothesis   | Link hypothesis to finding      | `@variscout/hooks`                   | `useHypotheses`                                                       |
| 8. Save             | Persist to IndexedDB/OneDrive   | `@variscout/hooks`                   | `useProjectPersistence`                                               |

### Flow 7: Azure Daily Use

Repeat analysis, Performance Mode, investigation, exports.

| Step                   | Action                             | Package                              | Key Components                                                 |
| ---------------------- | ---------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| 1. Open saved analysis | Load from list                     | `@variscout/hooks`                   | `useProjectPersistence`                                        |
| 2. Quick check         | Scan I-Chart + Stats               | `@variscout/charts`, `@variscout/ui` | `IChart`, `StatsPanelBase`                                     |
| 3. AI narration        | Read NarrativeBar summary          | `@variscout/hooks`, `@variscout/ui`  | `useNarration`, `NarrativeBar`                                 |
| 4. Drill with AI hints | Follow ChartInsightChip suggestion | `@variscout/hooks`, `@variscout/ui`  | `useChartInsights`, `ChartInsightChip`                         |
| 5. Ask CoScout         | Open panel, ask question           | `@variscout/hooks`, `@variscout/ui`  | `useAICoScout`, `CoScoutPanelBase`                             |
| 6. Performance Mode    | Multi-channel analysis             | `@variscout/charts`                  | `PerformanceIChart`, `PerformancePareto`, `PerformanceBoxplot` |
| 7. Investigate         | Finding → hypothesis → action      | `@variscout/hooks`, `@variscout/ui`  | `useFindings`, `useHypotheses`, `InvestigationSidebar`         |
| 8. What-If             | Simulate improvement               | `@variscout/ui`                      | `WhatIfSimulator`                                              |
| 9. Verify              | Staged analysis, Cpk comparison    | `@variscout/ui`, `@variscout/hooks`  | `StagedComparisonCard`, `useVerificationCharts`                |
| 10. Export             | Copy chart, download, report       | `@variscout/hooks`, `@variscout/ui`  | `useChartCopy`, `ChartDownloadMenu`, `ReportViewBase`          |

### Flow 8: Azure Team Collaboration

Admin deployment → team onboarding → shared workflows.

| Step               | Action                         | Package                   | Key Components         |
| ------------------ | ------------------------------ | ------------------------- | ---------------------- |
| 1. Deploy          | ARM template + EasyAuth config | `infra/`                  | `mainTemplate.json`    |
| 2. Configure Teams | Generate manifest, sideload    | `apps/azure`              | `AdminTeamsSetup`      |
| 3. Share analysis  | Channel tab + OneDrive sync    | `apps/azure/src/services` | Graph API, SharePoint  |
| 4. Team reviews    | Adaptive Cards in Teams        | `apps/azure`              | Status change handlers |
| 5. Settings        | Theme, accent, AI toggle       | `@variscout/ui`           | `SettingsPanelBase`    |

### Flow 9: Azure AI Setup

Admin enables AI → verification → cost monitoring.

| Step            | Action                              | Package                             | Key Components                             |
| --------------- | ----------------------------------- | ----------------------------------- | ------------------------------------------ |
| 1. Enable AI    | ARM deployment checkbox             | `infra/`                            | `mainTemplate.json` (`enableAI` parameter) |
| 2. Auth config  | EasyAuth + Cognitive Services scope | `apps/azure/src/auth`               | `easyAuth.ts`, `getAccessToken()`          |
| 3. Verify       | Load data → NarrativeBar appears    | `@variscout/hooks`, `@variscout/ui` | `useNarration`, `NarrativeBar`             |
| 4. CoScout test | Ask → panel opens                   | `@variscout/hooks`, `@variscout/ui` | `useAICoScout`, `CoScoutPanelBase`         |
| 5. User control | Per-user AI toggle in Settings      | `@variscout/ui`                     | `SettingsPanelBase`                        |

### Flow 10: Azure Teams Mobile

Field quality engineer on shop floor via Teams mobile.

| Step                 | Action                            | Package            | Key Components                                 |
| -------------------- | --------------------------------- | ------------------ | ---------------------------------------------- |
| 1. Open in Teams     | Tab loads in Teams mobile         | `apps/azure`       | Teams SDK                                      |
| 2. Carousel view     | Swipe through charts (<640px)     | `@variscout/ui`    | `DashboardBase` (carousel mode), `useIsMobile` |
| 3. AI on mobile      | NarrativeBar (tap-expand), chips  | `@variscout/ui`    | `NarrativeBar`, `ChartInsightChip`             |
| 4. Drill on phone    | Tap category → filter             | `@variscout/hooks` | `useFilterNavigation`                          |
| 5. Actions menu      | Overflow → Findings, Data, Export | `@variscout/ui`    | Overflow menu                                  |
| 6. Findings on phone | Full-screen overlay               | `@variscout/ui`    | `FindingsPanelBase`                            |
| 7. CoScout on phone  | Full-screen overlay               | `@variscout/ui`    | `CoScoutPanelBase`                             |
| 8. Category actions  | Tap → bottom sheet                | `@variscout/ui`    | `MobileCategorySheet`                          |

---

## Backward Mapping: Code → Journeys

### Core Package (`@variscout/core`)

| Module                       | Serves Flows                 | Purpose in Journey                                                           |
| ---------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `parseText()`, `parseFile()` | 6, 7, 10                     | Data ingestion at analysis start                                             |
| `detectColumns()`            | 6, 7                         | Auto-detect outcome/factor columns                                           |
| `calculateStats()`           | All analysis flows           | Compute mean, Cpk, η², etc.                                                  |
| `tier.ts`                    | 5 (upgrade), 8 (plan gating) | Feature gating and plan detection                                            |
| `ai/buildAIContext()`        | 7, 9                         | Assemble stats-only AI payload                                               |
| `ai/prompts/*`               | 7, 9                         | Modular prompt builders (narration, coScout, chartInsights, reports, shared) |
| `glossary/`                  | All analysis flows           | Term definitions for tooltips + AI grounding                                 |

### Charts Package (`@variscout/charts`)

| Component                 | Serves Flows   | Purpose in Journey                        |
| ------------------------- | -------------- | ----------------------------------------- |
| `IChart` / `IChartBase`   | 1, 2, 6, 7, 10 | Time-based stability (CHANGE lens)        |
| `Boxplot` / `BoxplotBase` | 1, 2, 6, 7, 10 | Factor comparison (FLOW lens)             |
| `Pareto` / `ParetoBase`   | 2, 6, 7, 10    | Problem concentration (FAILURE lens)      |
| `CapabilityHistogram`     | 6, 7           | Spec compliance (VALUE lens)              |
| `Performance*` charts     | 7              | Multi-channel analysis (Performance Mode) |

### Hooks Package (`@variscout/hooks`)

| Hook                    | Serves Flows | Purpose in Journey                    |
| ----------------------- | ------------ | ------------------------------------- |
| `useFilterNavigation`   | 6, 7, 10     | Drill-down with breadcrumb trail      |
| `useDataState`          | 6, 7, 10     | Shared DataContext state              |
| `useDataIngestion`      | 6, 7         | File upload and data parsing          |
| `useFindings`           | 6, 7, 10     | Finding CRUD, status transitions      |
| `useHypotheses`         | 6, 7         | Hypothesis tree, auto-validation      |
| `useProjectPersistence` | 5, 6, 7, 8   | IndexedDB + OneDrive save/load        |
| `useNarration`          | 7, 9, 10     | NarrativeBar state management         |
| `useChartInsights`      | 7, 9, 10     | Per-chart AI suggestion orchestration |
| `useAICoScout`          | 7, 9, 10     | CoScout conversation state            |
| `useAIContext`          | 7, 9         | AI context building                   |
| `useChartCopy`          | 7            | Chart export (clipboard, PNG, SVG)    |
| `useVerificationCharts` | 7            | Staged analysis chart toggle          |
| `useReportSections`     | 7, 10        | Report type detection + composition   |
| `useLocaleState`        | All          | Locale preference state               |
| `useTranslation`        | All          | Component-level translation           |
| `useTier`               | 5            | License tier React hook               |

### UI Package (`@variscout/ui`)

| Component                      | Serves Flows | Purpose in Journey               |
| ------------------------------ | ------------ | -------------------------------- |
| `ColumnMapping`                | 6, 7, 10     | Column selection screen          |
| `DashboardBase`                | 6, 7, 10     | Dashboard layout (grid/carousel) |
| `StatsPanelBase`               | 6, 7, 10     | Statistics display               |
| `FindingsPanelBase`            | 6, 7, 10     | Findings sidebar/overlay         |
| `FindingCard`, `FindingEditor` | 6, 7         | Finding display and editing      |
| `InvestigationSidebar`         | 7            | Hypothesis tree + phase badge    |
| `NarrativeBar`                 | 7, 9, 10     | AI summary bar                   |
| `ChartInsightChip`             | 7, 9, 10     | Per-chart AI badge               |
| `CoScoutPanelBase`             | 7, 9, 10     | Conversational AI panel          |
| `AnnotationContextMenu`        | 6, 7         | Right-click chart actions        |
| `MobileCategorySheet`          | 10           | Mobile bottom action sheet       |
| `WhatIfSimulator`              | 7            | Improvement simulation           |
| `StagedComparisonCard`         | 7            | Before/after Cpk comparison      |
| `ReportViewBase`               | 7, 10        | Story-driven report              |
| `UpgradePrompt`                | 1, 3, 5      | PWA ceiling → Azure CTA          |
| `SettingsPanelBase`            | 8, 9         | Theme, AI toggle, preferences    |
| `ChartDownloadMenu`            | 7            | PNG/SVG export dropdown          |
| `useIsMobile`                  | 10           | Responsive breakpoint hook       |

### Azure App (`apps/azure/`)

| Module                  | Serves Flows  | Purpose in Journey                   |
| ----------------------- | ------------- | ------------------------------------ |
| `auth/easyAuth.ts`      | 5, 6, 7, 8, 9 | SSO authentication                   |
| `services/aiService.ts` | 7, 9          | AI API calls, caching, model routing |
| `hooks/useEditorAI.ts`  | 7, 9          | AI integration in editor             |
| `AdminTeamsSetup`       | 8             | Teams manifest generation            |
| `services/` (Graph API) | 8             | OneDrive/SharePoint storage          |

### Infrastructure (`infra/`)

| File                      | Serves Flows | Purpose in Journey                |
| ------------------------- | ------------ | --------------------------------- |
| `mainTemplate.json`       | 4, 8, 9      | ARM template for Azure deployment |
| `createUiDefinition.json` | 4, 8, 9      | Azure portal deployment wizard    |

---

## See Also

- [User Flows](index.md) — Flow catalog and entry point matrix
- [Monorepo Rules](../../.claude/rules/monorepo.md) — Complete hook and component listing
- [Feature Parity Matrix](../08-products/feature-parity.md) — What's available where
- [Business Bible](../01-vision/business-bible.md) — Strategic context behind user journeys
