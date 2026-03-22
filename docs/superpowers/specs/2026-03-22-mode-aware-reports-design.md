---
title: Mode-Aware Reports
audience: [analyst, engineer]
category: workflow
status: draft
related: [report-view, analysis-mode, capability, performance, yamazumi, two-voices]
---

# Mode-Aware Reports

## Problem

The report system renders the same content regardless of which analysis mode the analyst used. This creates three issues:

1. **Misleading defaults** — ReportKPIGrid shows Cpk = "—" and In-Spec % = 100% when no specs are set, suggesting perfect compliance rather than "not assessed."
2. **Lost mode context** — An analyst who used capability mode (Cp/Cpk per subgroup) or performance mode (multi-channel analysis) gets a standard-mode report that doesn't reflect their investigation lens.
3. **Flat findings hierarchy** — Section 2 (Drivers) shows unlinked findings first, hiding the key drivers the analyst actually investigated.

## Design Principles

1. **Journey as spine** — The 6-section structure stays unchanged. No new sections, no restructuring.
2. **Mode adapts content** — Each section's KPI grid, chart, and lead metric adapt to the active analysis mode. No new chart types — use existing components.
3. **Two Voices honest** — When specs are not set, hide Cpk and In-Spec%. The VALUE lens says "not assessed" instead of lying.
4. **Audience = detail level** — Summary mode = A3 story (acted-upon findings only). Technical mode = QC Story (all findings, hypothesis tree, drill trail).

## Analysis Modes

Four reporting contexts derived from `AnalysisMode` + capability toggle:

| Context               | Trigger                                                                   | Core Question                             |
| --------------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| Standard (values)     | `analysisMode === 'standard'` and `standardIChartMetric !== 'capability'` | "Is the measurement meeting target?"      |
| Standard (capability) | `analysisMode === 'standard'` and `standardIChartMetric === 'capability'` | "Is Cpk meeting target across subgroups?" |
| Performance           | `analysisMode === 'performance'`                                          | "How many channels meet target Cpk?"      |
| Yamazumi              | `analysisMode === 'yamazumi'`                                             | "What proportion of time adds value?"     |

## Lead KPI Per Mode

The lead KPI is the "5-second answer" — the number that OpEx Olivia reads first.

### Standard Mode

Standard mode lead KPI depends on `ProcessContext.targetMetric`:

| targetMetric         | Lead KPI           | Supporting                       |
| -------------------- | ------------------ | -------------------------------- |
| `cpk`                | Cpk vs target      | Mean, σ, In-Spec%                |
| `mean`               | Mean vs target     | σ, Cpk (if specs), Samples       |
| `sigma`              | σ vs target        | Mean, Cpk (if specs)             |
| `passRate`           | In-Spec% vs target | Mean, σ, Cpk                     |
| `yield`              | Yield% vs target   | Mean, σ                          |
| Not set, specs exist | Cpk                | Mean, σ, In-Spec%, Samples       |
| Not set, no specs    | Mean               | σ, Samples (Cpk/In-Spec% hidden) |

### Capability Mode

| Lead KPI               | Supporting                                                              |
| ---------------------- | ----------------------------------------------------------------------- |
| Mean Cpk vs target Cpk | Cp, centering loss (gap between Cp and Cpk), % subgroups passing target |

### Performance Mode

| Lead KPI                                           | Supporting                                  |
| -------------------------------------------------- | ------------------------------------------- |
| # channels passing target Cpk (e.g., "12/16 pass") | Worst channel Cpk, mean Cpk across channels |

### Yamazumi Mode (already implemented)

| Lead KPI   | Supporting                                     |
| ---------- | ---------------------------------------------- |
| VA Ratio % | Process Efficiency, Takt Time, Steps over Takt |

## Section-by-Section Design

### Section 1: Current Condition

**KPI Grid** branches on analysis mode:

| Mode        | Component                        | Content                                                                         |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------- |
| Standard    | ReportKPIGrid (adapted)          | Target-metric-driven KPI + supporting metrics. Hide Cpk/In-Spec% when no specs. |
| Capability  | ReportCapabilityKPIGrid (new)    | Mean Cpk, Mean Cp, centering loss, % subgroups passing                          |
| Performance | ReportPerformanceKPIGrid (new)   | # channels passing, worst Cpk, mean Cpk                                         |
| Yamazumi    | ReportYamazumiKPIGrid (existing) | VA Ratio, Efficiency, Takt, Steps over Takt                                     |

**Chart Snapshot** branches on analysis mode:

| Mode        | Chart                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| Standard    | I-Chart (values) — existing                                             |
| Capability  | I-Chart (Cp/Cpk dual series) — snapshot of capability I-Chart           |
| Performance | Performance I-Chart (Cpk per channel) — snapshot of performance scatter |
| Yamazumi    | Yamazumi stacked bar — existing                                         |

**No specs gating:** When `specs === {}`:

- Standard: Hide Cpk card and In-Spec% card. Show Mean, σ, Samples only.
- Capability / Performance: These modes require specs (toggle disabled in SCOUT), so N/A in reports.
- Yamazumi: Not affected (VA Ratio is spec-independent).

### Section 2: Variation Drivers

**Audience-driven findings hierarchy** (inspired by A3 / QC Story / DMAIC patterns):

**Summary mode** — Show only findings with actions assigned (`f.actions?.length > 0`):

- The reader sees what was important enough to act on
- Each finding shows: text, impact metric, action summary
- Findings without actions are hidden — they are technical investigation context

**Technical mode** — Show all findings in progressive narrowing order:

1. Key-driver tagged findings (with chart snapshots)
2. Hypothesis-linked findings (with validation status)
3. Standalone observations (context)

Per-finding chart snapshots remain mode-agnostic (they show the filter-state stats at pin time). This is architecturally correct because findings don't store analysis mode — they capture the data context regardless of how the analyst was viewing it.

### Section 3: Evidence Trail

No mode-specific changes. Hypothesis tree and validation status are mode-independent.

### Section 4: Improvement Plan

No mode-specific changes. Ideas, projections, and risk assessment are mode-independent.

The projected metric in `ReportImprovementSummary` should use `targetMetric` when set (not always Cpk).

### Section 5: Actions Taken

No mode-specific changes.

### Section 6: Did It Work? (Verification / Learning Loop)

**ReportCpkLearningLoop** already supports custom `metricLabel` and `formatValue` (used for Yamazumi VA Ratio). Extend this pattern:

| Mode        | Metric Label                 | Before → Projected → Actual    |
| ----------- | ---------------------------- | ------------------------------ |
| Standard    | targetMetric name (or "Cpk") | Uses targetMetric values       |
| Capability  | "Mean Cpk"                   | Mean subgroup Cpk before/after |
| Performance | "Worst Channel Cpk"          | Worst-channel Cpk before/after |
| Yamazumi    | "VA Ratio" (existing)        | VA% before/after               |

**No specs fallback** (standard mode): Use σ reduction as the learning loop metric when no specs are set.

## Section Titles (useReportSections)

Extend the existing `analysisMode` branching to cover all 4 contexts:

| Section | Standard                           | Capability                            | Performance                   | Yamazumi                                    |
| ------- | ---------------------------------- | ------------------------------------- | ----------------------------- | ------------------------------------------- |
| 1       | "What does the process look like?" | "Is capability meeting target?"       | "How do channels perform?"    | "What does the time composition look like?" |
| 2       | "What is driving the variation?"   | "What drives capability differences?" | "Which channels are failing?" | "What is driving the activity composition?" |

Sections 3-6 titles are already mode-independent (including the existing `buildEvidenceTrailTitle` logic for Section 3 that adapts between investigation-report and improvement-story types).

## Data Flow: targetMetric into Reports

`ProcessContext.targetMetric` lives in `packages/core/src/ai/types.ts` and is populated by the Azure app's Brief/ProcessDescription flow. It is NOT part of core `DataContext`.

To make it available to reports:

- Thread `targetMetric` and `targetValue` through `useReportSections` as new optional parameters: `targetMetric?: TargetMetric`, `targetValue?: number`.
- The Azure `ReportView.tsx` wrapper reads `processContext.targetMetric` from the investigation store and passes it down.
- `ReportKPIGrid` receives `targetMetric` as an optional prop to determine which card to highlight.

## Specs-Gating Condition

The condition for "no specs" is NOT `specs === {}` (empty object equality). The correct check is:

```typescript
const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
```

This handles all SpecLimits shapes: `{}`, `{ usl: undefined }`, `{ lsl: 50 }`, etc. Use `hasSpecs` to gate Cpk and In-Spec% card visibility.

For one-sided specs (only USL or only LSL): Cpk is calculable but Cp is not. Show Cpk, hide Cp. This applies to both ReportKPIGrid and ReportCapabilityKPIGrid.

## useReportSections: Capability Context Parameter

Since `AnalysisMode` is a 3-value enum (`'standard' | 'performance' | 'yamazumi'`), the capability toggle must be passed separately:

```typescript
interface UseReportSectionsOptions {
  // ... existing fields
  analysisMode?: AnalysisMode;
  /** True when standard mode I-Chart is showing Cp/Cpk per subgroup */
  isCapabilityMode?: boolean;
}
```

Title selection logic:

- `analysisMode === 'yamazumi'` → yamazumi titles (existing)
- `analysisMode === 'performance'` → performance titles (new)
- `analysisMode === 'standard' && isCapabilityMode` → capability titles (new)
- `analysisMode === 'standard' && !isCapabilityMode` → standard titles (existing)

## Implementation Scope

### Adapt Existing Components

1. **ReportKPIGrid** — Add `hasSpecs` gating (`specs.usl !== undefined || specs.lsl !== undefined`): hide Cpk and In-Spec% cards when no specs. Add optional `targetMetric` prop to highlight the target-driven KPI card.
2. **ReportChartSnapshot** — Extend `chartType` union and `chartTypeLabel` record to include `'capability-ichart'` and `'performance-ichart'`. File: `packages/ui/src/components/ReportView/ReportChartSnapshot.tsx`.
3. **Drivers section (ReportView.tsx)** — Summary mode: filter to `f.actions?.length > 0` for improvement-story. For investigation-report summary: show key-driver tagged findings (`f.tag === 'key-driver'`), falling back to all findings if none are tagged.
4. **Section 1 branching (ReportView.tsx)** — Branch on `analysisMode` and `isCapabilityMode` for KPI grid and chart selection.
5. **Learning loop metric** — Pass mode-appropriate `metricLabel` and values to `ReportCpkLearningLoop`.
6. **useReportSections** — Add `isCapabilityMode` parameter. Extend title logic for capability and performance modes.

### New Components

1. **ReportCapabilityKPIGrid** — Mean Cpk, Mean Cp (if both specs set), centering loss, % subgroups passing target. Follows ReportYamazumiKPIGrid pattern. Compute `% passing` from subgroup results (`subgroupResults.filter(r => r.cpk >= cpkTarget).length / subgroupResults.length`).
2. **ReportPerformanceKPIGrid** — # channels passing target Cpk, worst channel Cpk, mean channel Cpk. Follows ReportYamazumiKPIGrid pattern.

### New Chart Snapshots

1. **Capability I-Chart snapshot** — Render `IChartBase` with capability data (dual Cp/Cpk series) in report export dimensions.
2. **Performance I-Chart snapshot** — Render `PerformanceIChartBase` in report export dimensions.

## Key Files

| File                                                                 | Changes                                                                                                                      |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `packages/hooks/src/useReportSections.ts`                            | Add `isCapabilityMode` param, mode-aware titles for capability and performance                                               |
| `packages/ui/src/components/ReportView/ReportKPIGrid.tsx`            | `hasSpecs` gating, `targetMetric` highlight                                                                                  |
| `packages/ui/src/components/ReportView/ReportChartSnapshot.tsx`      | Extend `chartType` union for capability/performance                                                                          |
| `packages/ui/src/components/ReportView/ReportCapabilityKPIGrid.tsx`  | New component                                                                                                                |
| `packages/ui/src/components/ReportView/ReportPerformanceKPIGrid.tsx` | New component                                                                                                                |
| `apps/azure/src/components/views/ReportView.tsx`                     | Section 1 mode branching, Section 2 audience-aware findings, Section 6 mode metric, thread `targetMetric`/`isCapabilityMode` |

## Verification

1. `pnpm test` — all tests pass
2. Standard mode, no specs — Cpk and In-Spec% cards hidden, Mean leads
3. Standard mode, specs set, no targetMetric — Cpk leads by default
4. Standard mode, specs set, `targetMetric: 'mean'` — Mean card highlighted
5. Standard mode, one-sided spec (USL only) — Cpk shown, Cp hidden
6. Capability mode — Mean Cpk KPI grid, dual I-Chart snapshot, % subgroups passing
7. Performance mode — Channel passing KPI grid, performance I-Chart snapshot
8. Yamazumi report — unchanged (regression check)
9. Summary vs Technical toggle — Summary shows acted-upon findings (improvement-story) or key-driver tagged findings (investigation-report)
10. Investigation-report summary with no tagged findings — falls back to all findings
