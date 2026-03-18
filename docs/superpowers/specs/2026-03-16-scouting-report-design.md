---
title: 'Scouting Report: Dynamic Analysis Report View'
audience: [analyst, engineer]
category: feature
status: draft
date: 2026-03-16
related: [report-view, presentation, qc-story, a3, copy-workflow, teams-sharing]
---

# Scouting Report: Dynamic Analysis Report View

## Problem Statement

An analyst (Green Belt Gary, Azure Standard/Team) completes an analysis — from daily stability check to full improvement cycle — and needs to share the story. Today, VariScout has excellent individual-component export (charts as PNG/SVG, findings as CSV/text, CoScout copy) but no unified presentation experience. The analyst must manually assemble charts, stats, and findings into PowerPoint through 5–10 minutes of copy-paste across multiple downloads.

The opportunity: VariScout already has ALL the data for a complete report (process context, stats, charts, findings, hypotheses, actions, outcomes, What-If projections, staged comparison). A dynamic **Report View** composes this data into a scrollable, shareable, story-driven document — grounded in QC Story / A3 problem-solving methodology — that adapts its structure to the analysis type.

---

## UX Audit: Current Presentation Workflow

### What the analyst CAN do today

| Capability                       | How                                                  | Gap                                   |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| Copy individual chart as PNG     | Chart card menu → Copy/Download (`useChartCopy`)     | Must do 3–4× for all charts           |
| Copy dashboard screenshot        | Dashboard mode in `useChartCopy` (1600×auto)         | No narrative, no findings             |
| Export findings as text/CSV/JSON | `FindingsExportMenu`                                 | Plain text, no formatting             |
| Copy CoScout response            | Copy Last / Copy All buttons                         | No timestamp or context               |
| Copy NarrativeBar text           | Manual text selection                                | No copy button                        |
| Copy stats                       | Not available                                        | No copy button on StatsPanel          |
| Presentation mode                | Azure: `PresentationView` (fullscreen 4-chart grid)  | Static grid, no narrative, no sharing |
| Share via Teams                  | `useShareFinding` → channel @mention + Adaptive Card | Findings only, not full analysis      |
| Deep links                       | `?project=X&finding=Y`                               | No `?mode=report` param               |

### What Gary actually does for a weekly review PowerPoint

1. Open analysis → edit chart titles → download 3 chart PNGs (3 clicks each)
2. Open Findings panel → Copy as text → paste into notes
3. Select NarrativeBar text manually → paste
4. Open PowerPoint → insert 3 images → arrange → add stats manually → format
5. **Total: 5–10 minutes, every time**

### What Gary does for an improvement report

Same as above, plus:

6. Manually reconstruct the investigation story (findings → hypotheses → actions → outcome)
7. Screenshot the hypothesis tree and stats at different filter states
8. Manually compare before/after Cpk from memory
9. **Total: 15–20 minutes with significant manual reconstruction**

### Pain Points Summary

| Pain                                | Severity | Frequency            |
| ----------------------------------- | -------- | -------------------- |
| No unified "report" view            | High     | Every share          |
| Manual chart-by-chart export        | Medium   | Every share          |
| Stats not copyable                  | Medium   | Every share          |
| No story structure (just raw data)  | High     | Improvement reports  |
| No before/after comparison view     | High     | Verification reports |
| No deep link for "open this report" | Medium   | Team sharing         |

---

## Design: Dynamic Story-Driven Report View

### Core Concept

A **scrollable, story-driven report view** that dynamically adapts its structure based on analysis type. Inspired by QC Story (Japanese quality circles) and Toyota A3 reports: the report tells a problem-solving story, not a data dump.

### Three Analysis Types, One View

| Type                       | Steps shown                                                                    | Charts                                             | When                          |
| -------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- | ----------------------------- |
| **Quick Check**            | 2 steps: Current Condition → Verdict                                           | I-Chart + stats only                               | Daily monitoring, no findings |
| **Deep Dive**              | 3 active + 2 future: Current → Drivers → Hypotheses → _(actions)_ → _(verify)_ | I-Chart, Boxplot, Pareto at relevant filter states | Investigation in progress     |
| **Full Improvement Cycle** | 5 steps complete: Current → Drivers → Hypotheses → Actions → Verification      | All relevant charts + staged comparison            | Complete PDCA cycle           |

The report auto-detects the type based on analysis state:

- No findings → **Quick Check**
- Findings but no actions → **Deep Dive**
- Findings + actions + outcome → **Full Improvement Cycle**

---

### Story Steps (Universal 5-Step Structure)

> **Journey mapping:** These 5 steps map to the 4-phase analysis journey (FRAME → SCOUT → INVESTIGATE → IMPROVE). Steps 1–2 = SCOUT, Step 3 = INVESTIGATE, Steps 4–5 = IMPROVE. FRAME is omitted (setup, not story). See [Mental Model Hierarchy](../../05-technical/architecture/mental-model-hierarchy.md) for the full cross-reference.

Each step appears only when relevant. Future steps are dimmed.

#### Step 1: Current Condition — "What does the process look like?"

- Key metrics: samples, mean, variation, Cpk, in-spec %
- I-Chart (one chart, at current/initial filter state)
- With AI: NarrativeBar summary as prose paragraph

#### Step 2: Where Does Variation Come From? — "Which factors explain the most?"

- Boxplot + Pareto (side by side) at the initial filter state
- Variation bar: visual breakdown of factor contributions (%)
- Each finding rendered as a card with its contribution %
- Note: contributions shown individually per finding, NOT summed (interaction effects)

#### Step 3: Why Is This Happening? — adapts to first hypothesis text

Example title: "What causes Fill Head 3 to drift?"

- Hypothesis tree with validation status (supported/contradicted/partial)
- Charts at the SPECIFIC drill state of each finding (different filter contexts!)
- Contradicted hypotheses dimmed (e.g., "Material batch: 3% — ruled out")
- Multiple findings converge on one hypothesis = synthesis story
- With AI: CoScout suggestion as collapsible block

#### Step 4: What Did We Do About It?

- Action items with assignees and completion dates
- What-If projections as **collapsible details** (click to expand: projected vs baseline Cpk)
- Improvement ideas linked to hypotheses

#### Step 5: Did It Work?

- Staged comparison table (Before/After with deltas — from ADR-023)
- I-Chart with staged control limits
- Outcome banner: "Effective / Partial / Not Effective"
- Projection vs actual comparison (collapsible): "We predicted Cpk 1.35, achieved 1.32"

##### Verification Evidence

When staged data is available, Step 5 renders a `VerificationEvidenceBase` component with:

1. **Toggle chip bar** — one chip per chart type, 3 visual states:
   - **Active (ON)**: Blue filled chip (`bg-blue-500 text-white`)
   - **Available (OFF)**: Outline chip, clickable to enable
   - **Unavailable**: Struck-through, `opacity: 0.5`, `pointer-events: none`

2. **Chart stack** — active charts render vertically in canonical order:

| Chart ID    | Label     | Available when...          | Component used                       |
| ----------- | --------- | -------------------------- | ------------------------------------ |
| `stats`     | Stats     | `stagedComparison` exists  | `StagedComparisonCard`               |
| `ichart`    | I-Chart   | `stagedStats` exists       | `IChartBase` with per-stage limits   |
| `boxplot`   | Boxplot   | factors + stageColumn set  | `BoxplotBase` with `fillOverrides`   |
| `histogram` | Histogram | specs (USL or LSL) defined | `CapabilityHistogram` with Cpk badge |
| `pareto`    | Pareto    | `comparisonData` exists    | `ParetoChartBase` with rank change   |

Smart defaults: all available charts ON on mount. All chips independently toggleable. Toggle state is ephemeral (resets each time report opens).

Data flow: `stagedComparison` computed locally via `calculateStagedComparison(stagedStats)`, not stored in DataContext. Boxplot uses `useBoxplotData` + `useBoxplotWrapperData` for staged fill overrides. Histogram filters to last-stage rows. Pareto comparison groups before-stage rows by first factor.

---

### Design Principles

**Charts appear at their drill state.** Each finding shows charts as they looked during that specific drill-down. Finding 1 (Fill Head: Head 3) shows the Boxplot filtered to Head 3. Finding 2 (Shift: Morning) shows the Boxplot filtered to Morning. Different charts, different filter states, same report.

**Only relevant charts per step.** Quick Check shows only I-Chart. Deep Dive shows Boxplot + Pareto. Verification shows staged I-Chart. No chart appears unless it adds to the story.

**"Contribution, Not Causation."** We say "hypothesis" not "root cause." Contributions shown as individual % per finding, never summed. A hypothesis becomes "confirmed" only when the outcome is effective — and even then, the report says "Supported hypothesis" + "Effective outcome."

**Progressive disclosure.** What-If projections, detailed stats, and AI summaries are collapsible. The default view is scannable by managers. Analysts click to expand details.

**Problem statement is prominent.** Amber callout at the top, before any data. The target metric (e.g., "Cpk ≥ 1.33") is visible immediately.

---

### Terminology

Manager-friendly language throughout:

| Internal         | Report View                          |
| ---------------- | ------------------------------------ |
| σ (sigma)        | Variation                            |
| Pass rate        | In Spec %                            |
| Root cause       | Hypothesis                           |
| η² (eta-squared) | Contribution %                       |
| PDCA             | _(no labels — structure implies it)_ |
| Four Lenses      | _(no labels — sections map to them)_ |

Section titles are **questions**, not methodology labels:

- "What does the process look like?" not "Plan: Current Condition"
- "Which factors explain the most?" not "Lens 2: Failure Mode"

---

### Layout

**Desktop**: Optional TOC sidebar (left, ~240px) + scrollable content (center, max ~900px). TOC has section links with status dots + sub-items per finding. Grouped by: Overview → Analysis → Investigation → Result.

**Mobile**: TOC becomes a dropdown or hidden. Single-column stacked sections.

**Navigation:**

- **Scroll-spy**: `IntersectionObserver` tracks which section is in viewport, highlights TOC
- **Collapsible sections**: Click section header to expand/collapse. All sections open by default for Full Improvement Cycle; collapsed sections for Quick Check
- **Finding sub-navigation**: TOC shows individual findings with status dots (green=resolved, purple=analyzed, amber=observed)

---

### Copy Workflow — Three Levels of Granularity

#### Level 1: Individual elements

- Copy chart: existing `useChartCopy` PNG at presentation dimensions (`EXPORT_SIZES`)
- Copy text block: stats table / findings summary as rich HTML (`ClipboardItem` API with `text/html` + `text/plain`)
- Copy buttons appear on hover (subtle, non-intrusive)

#### Level 2: Section as a slide

- "Copy as slide" button on each section header
- Captures the entire section at **16:9 slide dimensions** (1920×1080) via `useChartCopy` pattern (temporary resize → capture → restore)
- Paste into PowerPoint = one slide done
- Elements marked `data-export-hide` (copy buttons, collapse chevrons) are hidden during capture

#### Level 3: All charts

- "Copy All Charts" in TOC footer — bundles every chart as individual PNGs (existing dimensions)
- For PowerPoint users who want custom layout

---

### Teams Sharing

- **"Share Report" button** in TOC footer → posts Adaptive Card to Teams channel with deep link
- Deep link: `?project=coffee&mode=report` opens directly in Report View
- Extends existing `useShareFinding` + `buildDeepLink()` infrastructure (add `mode` param)
- Colleague clicks link → app opens → Report View renders with their auth
- Adaptive Card shows: process name, analyst, key metric (Cpk), status badge

---

### AI Enhancement Layer (When Available)

All AI is additive — the report works fully without it.

| Component       | Without AI                    | With AI                            |
| --------------- | ----------------------------- | ---------------------------------- |
| Step 1 summary  | Key metrics only              | + NarrativeBar prose paragraph     |
| Step 2 insights | Variation bar + contributions | + ChartInsightChip text per chart  |
| Step 3 guidance | Hypothesis tree               | + CoScout suggestion (collapsible) |
| Step 5 summary  | Staged table + outcome        | + Quantified improvement narrative |

---

## New Components

| Component             | Package                       | Purpose                                               |
| --------------------- | ----------------------------- | ----------------------------------------------------- |
| `ReportViewBase`      | `@variscout/ui`               | Scrollable story layout with TOC, sections, copy      |
| `ReportSection`       | `@variscout/ui`               | Collapsible section with header, badges, copy buttons |
| `ReportStepMarker`    | `@variscout/ui`               | Numbered step indicator (done/active/future)          |
| `ReportKPIGrid`       | `@variscout/ui`               | Key metrics card row                                  |
| `ReportChartSnapshot` | `@variscout/ui`               | Chart at a specific filter state with copy button     |
| `useScrollSpy`        | `@variscout/hooks`            | IntersectionObserver section tracking                 |
| `useReportSections`   | `@variscout/hooks`            | Dynamic section composition from analysis state       |
| `copySectionAsHTML`   | `@variscout/hooks` or utility | Rich clipboard copy for sections                      |

---

## Code References (Existing Infrastructure to Reuse)

| Reference                                  | File                                                                                                       | Reuse                                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Chart export at fixed dimensions           | `packages/hooks/src/useChartCopy.ts`                                                                       | Extend with `slide` size (1920×1080)                                            |
| PresentationView (existing projector mode) | `packages/ui/src/components/PresentationViewBase/`, `apps/azure/src/components/views/PresentationView.tsx` | Reference for fullscreen layout; Report View is separate                        |
| Deep link infrastructure                   | `apps/azure/src/services/deepLinks.ts`                                                                     | Add `mode` param to `parseDeepLink()`, `buildFindingLink()`, `buildChartLink()` |
| Teams sharing                              | `apps/azure/src/hooks/useShareFinding.ts`                                                                  | Extend for report sharing                                                       |
| Findings data model                        | `packages/core/src/findings.ts`                                                                            | Finding, Hypothesis, FindingProjection, ActionItem, FindingOutcome              |
| Process context                            | `packages/core/src/ai/types.ts` (`ProcessContext`)                                                         | Problem statement, target                                                       |
| Knowledge model                            | `packages/core/src/glossary/concepts.ts`                                                                   | Four Lenses, Two Voices, investigation phases                                   |
| Staged stats                               | `packages/core/src/stats/staged.ts`                                                                        | `calculateStatsByStage()` for Before/After table                                |
| Dashboard chart cards                      | `packages/ui/src/components/DashboardBase/`                                                                | `DashboardChartCard` pattern for chart sections                                 |

---

## Tier Availability

| Capability           | PWA (Free) | Azure Standard          | Azure Team            |
| -------------------- | ---------- | ----------------------- | --------------------- |
| Report View access   | No         | Yes                     | Yes                   |
| Quick Check report   | —          | Yes                     | Yes                   |
| Deep Dive report     | —          | Yes                     | Yes                   |
| Full Cycle report    | —          | Yes (actions, outcomes) | Yes (+ Teams sharing) |
| Copy chart/section   | —          | Yes                     | Yes                   |
| Copy as slide        | —          | Yes                     | Yes                   |
| Share Report (Teams) | —          | —                       | Yes                   |
| AI prose summaries   | —          | —                       | Yes (Team AI)         |

---

## Verification Criteria

1. **Quick Check**: Open analysis with no findings → Report View shows 2 steps only
2. **Deep Dive**: Create findings + hypotheses → Report View shows 3 active + 2 future steps
3. **Full Cycle**: Complete actions + outcome → Report View shows 5 complete steps
4. **Chart snapshots**: Verify each finding's charts render at the correct filter state
5. **Copy chart**: Paste into PowerPoint, verify dimensions and quality
6. **Copy section as slide**: Paste into PowerPoint, verify 16:9 layout
7. **Teams share**: Click "Share Report" → verify Adaptive Card in channel → click link → opens Report View
8. **AI off**: Verify all sections render without AI (no empty spaces)
9. **AI on**: Verify prose paragraphs appear in summary/insight blocks

---

## Related Documentation

- [ADR-024: Scouting Report](../../07-decisions/adr-024-scouting-report.md) — Architectural decisions
- [Investigation to Action Workflow](../../03-features/workflows/investigation-to-action.md) — Underlying investigation model
- [ADR-023: Verification Experience](../../07-decisions/adr-023-data-lifecycle.md) — Data lifecycle, staged comparison
- [Azure Daily Use](../../02-journeys/flows/azure-daily-use.md) — Report View in the daily workflow
- [Findings Components](../../06-design-system/components/findings.md) — Design system specs
- [AI Components](../../06-design-system/components/ai-components.md) — NarrativeBar, ChartInsightChip, CoScoutPanel specs
