---
title: 'ADR-024: Scouting Report — Dynamic Analysis Report View'
audience: [analyst, engineer]
category: architecture
status: superseded
superseded-by: adr-037
date: 2026-03-16
related: [report-view, presentation, qc-story, copy-workflow, teams-sharing]
---

# ADR-024: Scouting Report — Dynamic Analysis Report View

**Status**: Superseded by [ADR-037](../../07-decisions/adr-037-reporting-workspaces.md)

**Date**: 2026-03-16

## Context

VariScout has strong individual-component export — charts as PNG/SVG (`useChartCopy`), findings as CSV/text (`FindingsExportMenu`), CoScout responses via copy buttons — but no unified presentation experience. An analyst assembling a weekly review or improvement report must:

1. Download 3–4 chart PNGs individually (3 clicks each)
2. Copy findings as plain text
3. Manually select NarrativeBar text (no copy button)
4. Open PowerPoint, arrange images, add stats by hand
5. For improvement reports: manually reconstruct the investigation story, screenshot hypothesis trees at different filter states, compare before/after Cpk from memory

**Total: 5–10 minutes for a simple review, 15–20 minutes for an improvement report.** This pain recurs every time.

Meanwhile, VariScout already computes everything needed: process context, stats, charts, findings with drill-state metadata, hypotheses with validation status, action items, outcomes, What-If projections, and staged comparison data. The data exists — it just isn't composed into a presentable story.

### Methodology Grounding

The report structure maps to **QC Story** (Japanese quality circles) and **Toyota A3 reports**: a problem-solving narrative that flows from current condition → analysis → hypothesis → countermeasures → verification. VariScout's existing investigation workflow (ADR-015, ADR-020) already follows this pattern implicitly. The Report View makes it explicit — but uses **question-based section titles** ("What does the process look like?") rather than methodology labels ("Plan: Current Condition") to keep it accessible to managers and non-quality audiences.

---

## Decision

### 1. Add a Report View alongside existing PresentationView

The Report View is a new, separate view — not a replacement for PresentationView. PresentationView remains the fullscreen "projector mode" for live meetings. Report View is a scrollable, story-driven document optimized for **copy-paste into PowerPoint/Word** and **Teams sharing via deep link**.

Entry points:

- Toolbar button in the Azure app nav bar (next to Presentation button)
- Deep link: `?project=X&mode=report`

### 2. Dynamic story composition from analysis state

The report auto-detects three analysis types based on data state:

| Condition                    | Type                   | Steps                               |
| ---------------------------- | ---------------------- | ----------------------------------- |
| No findings                  | Quick Check            | 1 (Current Condition) + 2 (Verdict) |
| Findings, no actions         | Deep Dive              | 1–3 active + 4–5 dimmed/future      |
| Findings + actions + outcome | Full Improvement Cycle | 1–5 complete                        |

Detection logic lives in a new `useReportSections` hook that reads from `DataContext` (findings, hypotheses, actions, outcomes, staged data). The hook returns an ordered array of section descriptors with `status: 'done' | 'active' | 'future'`.

### 3. Per-finding chart snapshots at drill state

Each finding carries `filterStack` context from when it was created. The Report View renders chart components (I-Chart, Boxplot, Pareto) **at the finding's specific filter state** — not the current dashboard state. This means:

- Finding 1 (Fill Head: Head 3) shows charts filtered to Head 3
- Finding 2 (Shift: Morning) shows charts filtered to Morning
- Different charts, different filter states, same report

Implementation: `ReportChartSnapshot` accepts `filterStack: FilterAction[]` and computes stats/chart data for that specific slice using existing `calculateStats()` and filter utilities. Charts render as static (no interaction) with a copy button overlay.

### 4. Three-level copy workflow

| Level      | Scope                      | Method                   | Output                            |
| ---------- | -------------------------- | ------------------------ | --------------------------------- |
| Element    | Single chart or text block | Hover → copy button      | PNG (chart) or rich HTML (text)   |
| Section    | One story step             | "Copy as slide" button   | 1920×1080 capture (16:9)          |
| All charts | Every chart in report      | "Copy All Charts" in TOC | Individual PNGs at `EXPORT_SIZES` |

**Section-as-slide** extends the existing `useChartCopy` pattern: temporarily resize the section container to 1920×1080, wait for visx re-render, capture via `html2canvas`, restore. Elements marked `data-export-hide` are hidden during capture.

**Rich HTML copy** for text blocks uses the `ClipboardItem` API with `text/html` + `text/plain` MIME types, preserving formatting when pasted into Word/PowerPoint.

### 5. Teams deep link extension

Add `mode` parameter to the existing deep link infrastructure (`parseDeepLink()`, `buildFindingLink()`, `buildChartLink()` in `apps/azure/src/services/deepLinks.ts`). When `mode=report`, the app opens directly into Report View instead of the dashboard.

The "Share Report" button posts an Adaptive Card to the Teams channel using the existing `useShareFinding` infrastructure, extended with:

- Report-level metadata (process name, analyst, key metric)
- Deep link with `mode=report`

### 6. Scroll-spy TOC navigation

A new `useScrollSpy` hook uses `IntersectionObserver` to track which section is in the viewport and highlights the corresponding TOC entry. The TOC sidebar (desktop) or dropdown (mobile) shows:

- Section titles with step numbers and status dots
- Finding sub-items with investigation status colors
- Copy All Charts and Share Report actions in the footer

### 7. AI enhancement is additive only

All AI content (NarrativeBar prose, ChartInsightChip text, CoScout suggestions) renders as **optional blocks within sections**. When AI is not configured or not available:

- No empty spaces or placeholders
- Sections show data and charts only
- The report is complete without AI

When AI is available (all Azure plans):

- Step 1 adds a prose paragraph from NarrativeBar
- Step 2 adds insight text per chart from ChartInsightChip
- Step 3 adds a collapsible CoScout suggestion
- Step 5 adds a quantified improvement narrative

---

## New Components

| Component             | Package                       | Purpose                                                           |
| --------------------- | ----------------------------- | ----------------------------------------------------------------- |
| `ReportViewBase`      | `@variscout/ui`               | Scrollable story layout with TOC, sections, copy workflow         |
| `ReportSection`       | `@variscout/ui`               | Collapsible section: header, step marker, badges, "copy as slide" |
| `ReportStepMarker`    | `@variscout/ui`               | Numbered step indicator (done/active/future states)               |
| `ReportKPIGrid`       | `@variscout/ui`               | Key metrics card row (samples, mean, variation, Cpk, in-spec %)   |
| `ReportChartSnapshot` | `@variscout/ui`               | Chart at a specific filter state with copy button overlay         |
| `useScrollSpy`        | `@variscout/hooks`            | IntersectionObserver-based section tracking for TOC               |
| `useReportSections`   | `@variscout/hooks`            | Dynamic section composition from analysis state                   |
| `copySectionAsHTML`   | `@variscout/hooks` or utility | Rich clipboard copy (text/html + text/plain)                      |

---

## Consequences

### What becomes easier

- **Weekly reviews**: One-click "Copy as slide" per section → paste into PowerPoint. 2 minutes instead of 10.
- **Improvement reports**: Full story auto-composed from investigation data. No manual reconstruction.
- **Team sharing**: Deep link opens the report directly. No need to export and email files.
- **Manager communication**: Question-based section titles and progressive disclosure make reports scannable.
- **Audit trail**: The report reflects the actual investigation path with chart snapshots at each drill state.

### What becomes harder

- **Chart rendering complexity**: Report View must render charts at arbitrary filter states (not just current dashboard state). This requires computing stats per filter-stack, which adds CPU cost for reports with many findings.
- **Export fidelity**: Section-as-slide capture depends on `html2canvas` rendering accuracy. Complex chart layouts may need tuning.
- **State management**: `useReportSections` must react to findings/hypotheses/actions/outcomes changes in real time as the user works. Need careful memoization.

### What stays the same

- PresentationView unchanged (fullscreen projector mode)
- Individual chart export unchanged (`useChartCopy` existing behavior)
- FindingsExportMenu unchanged (CSV/text export)
- Investigation workflow unchanged (findings → hypotheses → actions → outcomes)

---

## Implementation Notes

### Extends existing infrastructure

| Existing                                                      | Extension                                             |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| `useChartCopy`                                                | Add `slide` export size (1920×1080) to `EXPORT_SIZES` |
| `parseDeepLink()` / `buildFindingLink()` / `buildChartLink()` | Add `mode` param support                              |
| `useShareFinding`                                             | Add report-level sharing with Adaptive Card           |
| `DashboardChartCard`                                          | Reference pattern for `ReportChartSnapshot`           |
| `calculateStats()`                                            | Called per finding's filterStack for snapshot stats   |
| `FilterAction[]`                                              | Used to reconstruct each finding's drill state        |

### Azure-only feature

Report View is Azure Standard and Team only. PWA does not include it (no findings persistence, no investigation workflow beyond 3 statuses). This aligns with the tier strategy: PWA is educational, Azure is operational.

### Staged verification evidence (Step 5)

Step 5 (Verification — "Did the actions work?") renders actual before/after staged evidence when staged data is available, replacing the earlier placeholder callout.

**New components:**

| Component                  | Package            | Purpose                                                                  |
| -------------------------- | ------------------ | ------------------------------------------------------------------------ |
| `VerificationEvidenceBase` | `@variscout/ui`    | Chip bar + vertical chart stack (shared `*Base` + `colorScheme` pattern) |
| `useVerificationCharts`    | `@variscout/hooks` | Toggle state + availability detection for 5 chart types                  |

**Chart types** (canonical order): `stats`, `ichart`, `boxplot`, `histogram`, `pareto`. Each has availability conditions (e.g., `boxplot` requires factors + stageColumn). Smart defaults: all available charts ON. All chips independently toggleable; unavailable chips are struck-through and non-interactive.

**Reused ADR-023 Tier 4 components:** `StagedComparisonCard`, staged I-Chart (`IChartBase` with `stagedStats`), dual-stage Boxplot (`BoxplotBase` with `fillOverrides`/`groupSize`), `CapabilityHistogram` with `cpkBefore`/`cpkAfter` badge, `ParetoChartBase` with `comparisonData`/`showRankChange`.

---

## Related

- [ADR-015: Investigation Board](../../07-decisions/adr-015-investigation-board.md) — Findings model
- [ADR-020: Investigation Workflow](../../07-decisions/adr-020-investigation-workflow.md) — Hypothesis model
- [ADR-023: Verification Experience](../../07-decisions/adr-023-data-lifecycle.md) — Staged comparison, data lifecycle
- [ADR-031: Report Export](../../07-decisions/adr-031-report-export.md) — Print/PDF export for Standard+ plans
- [Investigation to Action Workflow](../../03-features/workflows/investigation-to-action.md) — Workflow spec
- [Azure Daily Use](../../02-journeys/flows/azure-daily-use.md) — Report View in daily workflow context
