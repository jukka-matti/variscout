---
title: 'EDAScout Competitive Benchmark'
---

# EDAScout Competitive Benchmark

> Competitive intelligence from analysis of EDAScout v4, v6, v7, and v9 codebases.

This document provides a technical assessment of EDAScout's architecture, features, and evolution based on direct codebase analysis. EDAScout is the closest conceptual competitor to VariScout --- both target variation analysis for quality professionals using browser-based EDA tools. The analysis covers four released versions spanning a full product arc.

---

## Product Profile

| Dimension          | EDAScout                                                           | VariScout                                  |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------ |
| **Tech stack**     | React 18, Plotly.js + Recharts, Express + SQLite/Drizzle, Electron | React 18, Visx, browser-only, Vite         |
| **Architecture**   | Client-server (Express backend, SQLite persistence)                | Offline-first (IndexedDB + localStorage)   |
| **Distribution**   | Electron desktop app (built on Replit)                             | PWA + Azure Managed App + Excel Add-in     |
| **Charting**       | Plotly.js (high-level declarative)                                 | Visx (low-level SVG primitives)            |
| **AI integration** | Gemini 2.0 Flash (added v6, removed v7, restored v9)               | None (methodology-driven documentation)    |
| **UI framework**   | Tailwind + shadcn/ui                                               | Tailwind (PWA/Azure), Fluent UI (Excel)    |
| **Analysis model** | One analysis type per page                                         | Four Lenses (4 charts simultaneously)      |
| **Navigation**     | Page-based routes between analysis types                           | Linked filtering across coordinated charts |

---

## Version Evolution

EDAScout's version history reveals a significant product strategy arc:

### v4 --- Basic SPC Tool

8-page application with simple page-based navigation: Exploratory, Capability, Pareto, Flow, Output, RTY, WIP. No AI features. No guided workflow. Each analysis type lives on its own route. Data loaded into a shared `DataContext` and consumed independently by each page.

### v6 --- Major AI Expansion

Introduced Gemini 2.0 Flash integration with a "Socratic Analyst" chatbot sidebar. Added a guided 5-step workflow: Stability, Distribution, Subgroups, Capability, Prime Suspect, RCA. New features included a Detective's Notebook, Smart Cards (AI-generated insight summaries), and a full `ai-core/` library (10 modules). The AI layer attempted to guide analysts through a structured investigation sequence.

### v7 --- Complete AI Rollback

**All AI features deleted.** The `ai-core/` directory was removed. Guided pages were removed. `AppContext` (which managed AI state) was removed. The application reverted to a v4-like architecture. This is the most strategically informative version --- a team that invested heavily in AI guidance concluded it wasn't working and stripped everything out.

### v9 --- AI Restoration with Refinements

AI features restored. Full guided workflow returned. Investigation page re-added. A notable addition: a heuristic audit CSV for self-evaluation of UX quality, suggesting the team was measuring whether the AI guidance actually improved user outcomes this time.

### What the arc tells us

The v6-to-v7 rollback is the central lesson. Adding AI-driven guidance to an analytical tool is not straightforwardly positive. The rollback suggests one or more of: (a) the AI suggestions were not reliably useful, (b) the latency of API calls disrupted the analytical flow, (c) users preferred direct interaction over mediated guidance, or (d) the maintenance burden of the AI layer exceeded its value. The v9 restoration with audit instrumentation suggests the team is approaching AI integration more carefully the second time, measuring impact rather than assuming it.

This arc validates VariScout's current approach of methodology-driven guidance (documentation, glossary, contribution percentages) over AI-driven guidance. It also suggests that if VariScout adds AI features in the future, they should be instrumented for impact measurement from day one.

---

## Data Upload & Column Classification

### EDAScout's parsing pipeline

`UnifiedDataInput` handles both paste and file upload with sanitization (CSV injection prevention via `=`, `+`, `-`, `@` prefix stripping). The parsing flow:

1. **European decimal detection**: Recognizes `1,88` as `1.88` --- the same problem VariScout's `parser.ts` handles.
2. **Automatic header suggestion**: When headers are missing, AI-powered naming suggests column headers based on data patterns.
3. **Column type detection algorithm**:
   - Timestamp columns detected first (date/time patterns)
   - Numeric: >80% of values parse as valid numbers
   - Categorical: keyword matching (`machine`, `equipment`, `line`, `station`) + low unique count
4. **Machine identifier reclassification**: Columns that are numerically valid but match machine keywords with low unique count are reclassified from numeric to categorical.
5. **`ColumnSpecification` model**: Stores performance direction (bigger-is-better / smaller-is-better / nominal-is-best) and spec limits per column. Set by the user before analysis begins.

### Comparison to VariScout

VariScout's `parser.ts` handles European decimal detection and column classification without AI dependency. The key differences:

| Capability                   | EDAScout                               | VariScout                                           |
| ---------------------------- | -------------------------------------- | --------------------------------------------------- |
| European decimals            | Yes                                    | Yes                                                 |
| CSV injection prevention     | Yes (prefix stripping)                 | Not explicitly (browser-only context is lower risk) |
| Auto-header suggestion       | AI-powered (Gemini API call)           | Not implemented                                     |
| Column type detection        | Threshold-based (80% numeric)          | Keyword + pattern matching                          |
| Machine identifier detection | Keyword + low unique count             | Column classification heuristics                    |
| Performance direction        | `ColumnSpecification` model (user-set) | Not implemented (spec limits only)                  |
| Spec limit entry             | Per-column before analysis             | Per-column, integrated into workflow                |

The `ColumnSpecification` model with performance direction (bigger-is-better / smaller-is-better / nominal-is-best) is a design worth noting. VariScout currently infers this from spec limits but doesn't make it an explicit user-facing concept.

---

## Filtering & Drill-Down Architecture

### SubgroupExplorerModal

The `SubgroupExplorerModal` is EDAScout's central filtering UI. It opens as a **modal overlay** on the data page:

- **Left panel**: `CategoryGrid` showing all categorical and time columns. Each category card displays values with variance-derived coloring from ANOVA results.
- **Right panel**: 4 tabs (Boxplot, I-Chart, Analysis Insights, Variance Analysis) for examining the selected grouping.
- **Filter scope**: Filters are modal-local --- `activeFilters: { category: string; value: string }[]` applied within the modal context.
- **Filter logic**: AND across different categories, OR within the same category. This matches VariScout's filter logic exactly.

### CategoryGrid variance coloring

Category values in the grid are colored by their ANOVA-derived `percentOfTotal`. However, this metric represents **within-group SS / total SS per group** --- how much variation exists _inside_ each group level. This is the statistical opposite of between-group contribution (eta-squared), which measures how much variation the grouping factor _explains_.

The practical effect: red cells indicate high internal variation (noisy groups), green cells indicate low internal variation (consistent groups). This is useful information but is **not** the same as "this factor explains a lot of variation." An analyst looking for the biggest source of variation would be misled by this coloring --- a factor with all-red cells might still have very low between-group variation.

### Filter persistence

Filters **do not persist** across page navigation. Cross-page column transfer uses localStorage keys (`paretoSelectedColumn`, `preselected_[type]_column`), which is fragile and limited to single-column preselection rather than full filter state.

### Comparison to VariScout

| Capability          | EDAScout                              | VariScout                                    |
| ------------------- | ------------------------------------- | -------------------------------------------- |
| Filter UI           | Modal (SubgroupExplorerModal)         | Inline chips with contribution %             |
| Filter persistence  | Modal-scoped, lost on page navigation | Persistent across all four lenses            |
| Filter logic        | AND across categories, OR within      | AND across categories, OR within (identical) |
| Variance indication | Within-group SS coloring (misleading) | Between-group eta-squared (correct)          |
| Cumulative tracking | None                                  | Variation funnel with cumulative eta-squared |
| Filter context      | Separate from charts (modal)          | Integrated into chart interaction            |

VariScout's filter architecture is fundamentally stronger: filters are integrated into the chart interaction (click-to-drill), persist across all four lenses, and display correct between-group contribution percentages. EDAScout's modal-based approach separates the "seeing variation" step from the "filtering" step, requiring a cognitive transfer that VariScout eliminates.

---

## Brush Selection (Unique Feature)

EDAScout implements a distinctive interaction pattern: **I-Chart brush selection**.

The user drags to select a range of points on the I-Chart. The selected points create a derived categorical column (`"Selected"` / `"Not Selected"`) that is persisted in `DataContext`. This derived column is then available as a grouping variable in all future analyses.

This is a creative pattern that VariScout does not implement. It allows the analyst to define ad-hoc subgroups based on observed patterns rather than predefined categorical columns. For example, an analyst noticing a cluster of out-of-control points could select them, then use the derived column to investigate what those points have in common across other factors.

### Evaluation for VariScout

The brush selection pattern is worth studying but has important caveats:

- **Confirmation bias risk**: Selecting points _because_ they look unusual and then finding factors that correlate is statistically circular. The analyst is effectively defining the outcome they want to explain.
- **VariScout alternative**: The linked Four Lenses already let the analyst see what happens to all charts when filtering by any factor. The I-Chart highlights out-of-control points automatically via Nelson rules. The investigation path is reversed: instead of "select unusual points, find factors," it's "select a factor level, see if the I-Chart improves."
- **Potential adaptation**: A lighter version --- highlighting time periods on the I-Chart and showing which factor levels were active during those periods --- could complement the existing drill-down without the circular reasoning risk.

---

## Cross-Analysis Navigation

### Page-per-analysis architecture

Each analysis type lives on its own route: `/pareto`, `/process-capability`, `/flow-analysis`, etc. Navigation between analyses uses:

- **Quick Start buttons**: Cards on the data page link to specific analysis pages.
- **`CrossAnalysisNavigator`**: Shows available/unavailable analyses based on column types present in the dataset.
- **`AnalysisBreadcrumb`**: Tracks recent analyses with timestamps, transferred variables, and AI-suggested next steps.

### Data transfer between pages

Data flows through a shared `DataContext` (headers, rows, column classifications). However, filters and selections are **not** part of this shared context. Column preselection uses localStorage keys, which is fragile and limited.

### Comparison to VariScout

| Capability                   | EDAScout                             | VariScout                                           |
| ---------------------------- | ------------------------------------ | --------------------------------------------------- |
| Chart coordination           | One chart per page                   | Four Lenses (4 charts simultaneously)               |
| Filter across analyses       | Not supported (filters are per-page) | Linked filtering across all charts                  |
| Analysis sequencing          | AI-suggested next steps (breadcrumb) | Methodology-driven (documentation + contribution %) |
| Available analysis detection | Column-type based                    | Column-type based (similar)                         |
| Navigation model             | Route-based (SPA pages)              | In-page (filter chips + chart updates)              |

VariScout's Four Lenses approach is architecturally superior for variation investigation because the analyst sees the impact of each filter across all analysis types simultaneously. EDAScout's page-per-analysis model requires the analyst to mentally carry findings between pages, losing the simultaneous context that makes pattern recognition effective.

---

## Statistical Quality Assessment

Two critical statistical issues were identified in the EDAScout codebase:

### P-value bucket approximation

The p-value calculation uses a hardcoded bucket approximation rather than a proper F-distribution:

```
if (fStat < 6) return 0.05
```

This means all F-statistics below 6 return a fixed p-value of 0.05, regardless of degrees of freedom. In a proper F-distribution, the p-value depends on both the F-statistic and the degrees of freedom of the numerator and denominator. This approximation can produce incorrect significance conclusions, particularly for datasets with few groups or many observations.

### `percentOfTotal` calculation error

The `percentOfTotal` metric shows **within-group SS / total SS per group**, not between-group contribution. This means the value represents how much variation _exists inside_ each group level, not how much variation the grouping factor _explains_.

The practical consequence: the metric answers "which group is internally noisy?" rather than "which factor explains the most variation?" These are different questions with different implications for improvement action. An analyst using `percentOfTotal` to prioritize investigation factors would be misled.

### Implications

These statistical issues are significant because:

1. **User trust**: Quality professionals depend on correct statistics for improvement decisions. Incorrect p-values or misleading contribution metrics lead to wrong conclusions about where to focus.
2. **Competitive differentiation**: VariScout's correct implementation of eta-squared contribution percentages and proper statistical calculations is a genuine technical advantage, not just a feature difference.
3. **Validation lesson**: The presence of these errors in a shipped product underscores the importance of VariScout's test suite (484 tests in `@variscout/core`) for statistical correctness.

---

## Feature Comparison Matrix

| Feature                         | EDAScout v9               | VariScout                           |
| ------------------------------- | ------------------------- | ----------------------------------- |
| **I-Chart**                     | Yes (Recharts)            | Yes (Visx)                          |
| **Boxplot**                     | Yes (Plotly.js)           | Yes (Visx)                          |
| **Pareto**                      | Yes                       | Yes                                 |
| **Capability analysis**         | Yes                       | Yes (Cp, Cpk, Pp, Ppk)              |
| **Regression**                  | No                        | Yes                                 |
| **Gage R&R**                    | No                        | No                                  |
| **ANOVA**                       | Yes (flawed p-value)      | Yes (proper F-distribution)         |
| **Nelson rules**                | Limited                   | Full 8-rule implementation          |
| **Multi-measure (Performance)** | No                        | Yes (Azure/Excel)                   |
| **Simultaneous chart views**    | 1 per page                | 4 (Four Lenses)                     |
| **Linked filtering**            | No (per-page filters)     | Yes (cross-chart)                   |
| **Contribution %**              | Within-group SS (flawed)  | Between-group eta-squared (correct) |
| **Cumulative tracking**         | No                        | Variation funnel                    |
| **Brush selection**             | Yes (I-Chart)             | No                                  |
| **AI guidance**                 | Gemini 2.0 Flash          | None (methodology-driven)           |
| **Offline operation**           | Requires server           | Full offline (PWA)                  |
| **Spec limits**                 | Yes                       | Yes                                 |
| **Performance direction**       | Yes (ColumnSpecification) | No (inferred from spec limits)      |
| **Dark theme**                  | No                        | Yes (charts + Excel content pane)   |
| **Mobile support**              | Responsive grid           | Responsive + mobile-first hooks     |
| **European decimal handling**   | Yes                       | Yes                                 |
| **Case studies / sample data**  | No                        | Yes (7 case studies)                |
| **Glossary / help tooltips**    | No                        | Yes (20+ terms)                     |
| **Export (CSV/clipboard)**      | Limited                   | Yes                                 |

---

## How EDAScout Addresses Our 6 Tensions

Mapping EDAScout's features against the tension/pattern evaluation framework from [Progressive Stratification](../../progressive-stratification.md):

### 1. Hierarchy Assumption

**EDAScout's approach**: No interaction detection. Single-factor variance analysis only. The `SubgroupExplorerModal` examines one factor at a time.

**Assessment**: Does not address this tension. An analyst investigating a Machine x Shift interaction would need to manually create the combination and analyze it separately. The ANOVA implementation only handles one-way analysis.

### 2. Discoverability

**EDAScout's approach**: Smart Cards (AI-generated) suggest next analysis steps. "Continue with Pareto Analysis" banners appear based on context. The `SubgroupExplorerModal` is the main investigation entry point but must be explicitly opened by the user.

**Assessment**: Partially addresses through AI suggestions. The Smart Cards provide explicit guidance but depend on AI API availability (Gemini 2.0 Flash). The modal-based approach requires the analyst to know to open the explorer, creating a discoverability gap for the explorer itself.

### 3. Factor Ordering

**EDAScout's approach**: AI suggests factors via Socratic dialogue in the chatbot sidebar. Heuristic-based Smart Card generation highlights factors worth investigating. The variance coloring in `CategoryGrid` visually differentiates groups, though the underlying metric (within-group SS) is misleading for factor prioritization.

**Assessment**: Addresses through AI mediation rather than statistical transparency. The analyst is told which factor to try, not shown the statistical basis for the recommendation. This is the opposite of VariScout's approach (show eta-squared contribution, let the analyst decide).

### 4. When to Stop

**EDAScout's approach**: Investigation guidance with "next steps" suggestions in the `AnalysisBreadcrumb`. A 7-step Detective's Notebook framework provides structure. AI suggests when an investigation is "complete."

**Assessment**: Addresses through prescriptive workflow (7 steps) rather than statistical convergence. The analyst follows a checklist rather than monitoring variation explained. No equivalent to VariScout's variation funnel showing cumulative progress.

### 5. Mobile Screen Budget

**EDAScout's approach**: Responsive grid columns (1--4 based on viewport width). However, the `SubgroupExplorerModal` with its two-panel layout (category grid + tabbed analysis) is desktop-centric and would be cramped on mobile.

**Assessment**: Basic responsive layout without mobile-specific UX adaptation. No equivalent to VariScout's `useIsMobile` and `useResponsiveChartMargins` hooks for mobile-optimized chart rendering.

### 6. Path Dependency

**EDAScout's approach**: No awareness. Single-factor analysis per page with no cumulative tracking. No concept of "variation already explained by previous filters." No contribution-to-total anchoring.

**Assessment**: Does not address. The page-per-analysis architecture and non-persistent filters mean the analyst cannot even observe path dependency effects, let alone manage them.

---

## Strategic Implications for VariScout

### What to learn

1. **Brush selection interaction pattern**: The I-Chart point selection creating a derived categorical column is a creative interaction pattern. A VariScout adaptation --- highlighting time periods and showing which factor levels were active --- could complement the existing drill-down without the confirmation bias risk.

2. **ColumnSpecification with performance direction**: The explicit bigger-is-better / smaller-is-better / nominal-is-best classification per column is a useful concept that VariScout could adopt. Currently VariScout infers directionality from spec limits, but an explicit setting would handle edge cases better.

3. **Heuristic audit instrumentation**: EDAScout v9's addition of a heuristic audit CSV for self-evaluation of UX quality is a mature practice. If VariScout adds guided features (factor suggestion), instrumenting their impact from the start would prevent the "add then rollback" cycle EDAScout experienced.

### What to avoid

1. **AI-driven guidance without measurement**: The v6-to-v7 rollback is the clearest cautionary tale. Adding AI features without impact measurement led to a complete reversal. VariScout should instrument any AI features before deploying them.

2. **Flawed statistics shipped to production**: EDAScout's p-value bucket approximation and misleading `percentOfTotal` metric would erode trust with quality professionals who understand these calculations. VariScout's investment in correct statistics (484 tests in `@variscout/core`) is a genuine competitive moat.

3. **Modal-based filtering**: Separating the filter UI from the chart interaction adds cognitive overhead. VariScout's inline filter chips integrated into the chart experience are architecturally superior.

4. **Non-persistent filter state**: EDAScout's filters being scoped to individual pages/modals means the analyst loses context when navigating. VariScout's persistent filter state across all four lenses is a fundamental advantage.

### What to differentiate on

1. **Linked filtering with contribution percentages**: No competitor, including EDAScout, provides inline eta-squared contribution percentages on filter chips. This is VariScout's most distinctive feature.

2. **Four Lenses simultaneous view**: EDAScout's one-chart-per-page model is the industry default. VariScout's four simultaneous charts with linked filtering is a genuine differentiator.

3. **Correct statistics**: Proper F-distribution p-values, correct between-group eta-squared, and comprehensive test coverage are competitive advantages that matter deeply to quality professionals.

4. **Offline-first architecture**: EDAScout requires a server (Express + SQLite). VariScout's browser-only operation means data never leaves the user's device --- a significant advantage for manufacturing environments with data sensitivity requirements.

5. **Methodology over AI**: EDAScout's AI rollback arc validates VariScout's approach of teaching methodology through documentation, glossary, and visual cues rather than depending on AI-mediated guidance. The methodology approach is more reliable, doesn't require API connectivity, and builds analyst capability rather than tool dependency.
