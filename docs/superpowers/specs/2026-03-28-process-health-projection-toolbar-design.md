---
title: Process Health & Projection Toolbar
date: 2026-03-28
status: implementing
audience: [developer, designer]
category: design-spec
related: [dashboard, toolbar, stats, variation, what-if, findings, improvement, projection]
---

# Process Health & Projection Toolbar

Unify process health metrics, variation tracking, and improvement projections into a single adaptive toolbar that guides the analyst from discovery to verified improvement.

## Problem

Process health information is fragmented across 6 locations: I-Chart header (UCL/Mean/LCL), Stats panel (Cpk/Pass/Mean/σ), filter breadcrumb (VariationBar), insight chips (Cpk status), NarrativeBar (AI summary), and the What-If simulator (projections). The analyst must mentally assemble the picture from scattered pieces.

The VariationBar — which tracks how much variation has been explained through drill-down — only appears after filtering and is buried in the breadcrumb row. The Stats panel takes a grid slot or sidebar, competing with charts for space. The What-If simulator lives in a separate view, disconnected from the analytical flow.

Meanwhile, the dashboard grid needs Histogram and Probability Plot visible alongside the core charts, but adding a 3rd row makes charts fall below the viewport.

## Design

### 1. Unified Toolbar

Replace the current toolbar row (Grid/Scroll toggle + Factors) and filter breadcrumb with a single adaptive row that contains everything:

```
[Grid|Scroll] Factors(n) │ Stats │ Filter chips │ ████ variation │ target: [1.33] │ Export Present
```

The toolbar content adapts by context:

#### No specs, no drill

```
[Grid|Scroll] Factors(2) │ Mean 11.74  σ 1.05  n 30 │                    │ Set specs → │ Export Present
```

Basic stats only. "Set specs" link opens spec editor or capability suggestion modal.

#### Specs set, no drill

```
[Grid|Scroll] Factors(2) │ Pass 66.7%  Cpk 0.26/1.33  Mean 11.74  σ 1.05  n 30 │     │ target: [1.33] │ Export Present
```

Cpk and Pass Rate appear with color coding (green/amber/red vs target). No variation bar (nothing to track yet).

#### Specs set, drilling (projection active)

```
[Grid|Scroll] Fac(2) │ Cpk 0.26 → 1.85 if fixed │ [Bed C 65% ✕] │ ████ 65% │ target: [1.33] │ Export
```

- Current Cpk → projected Cpk if the filtered subset were fixed
- Projection computed via `simulateOverallImpact()` using complement data
- Filter chips inline with contribution percentages
- VariationBar always visible, showing cumulative variation in focus
- "if fixed" = complement-based projection (automatic, no user input needed)

#### No specs, drilling (target suggestion)

```
[Grid|Scroll] Fac(2) │ Mean 11.74  σ 1.05 │ [Bed C ✕] │ Achievable: 10.0–11.8 → Set specs │ Export
```

Complement data suggests natural tolerance as spec candidates. Clicking opens capability suggestion modal with pre-filled values.

#### Multiple findings scoped (cumulative projection)

```
[Grid|Scroll] Fac(3) │ Cpk 0.26 → 1.62 (3 findings) │ [Bed C ✕][Night ✕] │ ████ 78% │ target: [1.33] │ Export
```

Projection reflects the cumulative impact of fixing all scoped findings.

### 2. Cpk Target — Editable Inline

The Cpk target is an editable inline field in the toolbar: `target: [1.33 ▾]`

- Default: 1.33 (industry standard for capable process)
- User can change to customer requirement or stretch goal
- System can suggest based on benchmark data: "Best subset achieves 1.85 — suggested: 1.33 or 1.67"
- All projections, color coding, and delta calculations reference this target
- Persists in `AnalysisState.cpkTarget` (already exists)

### 3. Benchmark Finding

The analyst can pin a "benchmark" from the best-performing subset discovered during drill-down:

- During SCOUT: drill into subgroups, identify best performer (e.g., "Bed A, Morning Shift")
- Pin as benchmark: creates a Finding with `role: 'benchmark'` and attached stats snapshot
- Benchmark stats: mean, σ, Cpk, n from the selected subset
- From that point, projections reference the benchmark: "If all subsets performed like Bed A AM → Cpk 1.85"
- Benchmark overrides the default complement-based projection when set
- One benchmark per project (pinning a new one replaces the old)

Benchmark connects to existing Finding system:

- `Finding.benchmarkStats?: { mean, stdDev, cpk, count }` — snapshot of the benchmark subset
- `Finding.role?: 'observation' | 'benchmark'` — distinguishes benchmark from regular findings
- Displayed in toolbar: `Cpk 0.26 → 1.85 (benchmark: Bed A, AM)`

### 4. Findings as Project Scope

Selected findings define the improvement scope. Each finding with source metadata (chart type, category, factor) represents a subset that could be fixed. The projection engine computes the cumulative impact:

- **Single finding scoped**: "If Bed C fixed → Cpk 1.42"
- **Multiple findings scoped**: "If Bed C + Night shift fixed → Cpk 1.62"
- **All findings**: "If all 3 findings fixed → Cpk 2.10"

Computation: progressively simulate removing each problem subset using `simulateOverallImpact()`, chaining the results.

This connects to the existing improvement workspace:

- `projectedCpkMap`: already maps finding ID → projected Cpk
- `ImprovementSummaryBar`: already shows projected Cpk, delta vs target
- Per-idea projections from What-If simulator feed into per-finding projections
- The toolbar shows the aggregate; the improvement workspace shows the breakdown

### 5. Process Entitlement (Cp vs Cpk Gap)

When specs are set, the toolbar can highlight the Cp–Cpk gap: the improvement available from centering the process without reducing variation. This is a "free win" — no root cause investigation needed, just adjust the process aim.

- Cp = potential capability (spread only, assuming perfect centering)
- Cpk = actual capability (spread + centering)
- Gap = Cp - Cpk = centering opportunity
- Toolbar hint (when gap is significant): `Cpk 0.26 → Cp 1.01 by centering`
- Shown as an intermediate step before the full "if fixed" projection

This is computed from existing `stats.cp` and `stats.cpk` — no new calculation needed.

### 6. Projection Thread Across Phases

One consistent Cpk projection runs through the entire journey:

| Phase                      | Toolbar shows                       | Source                                    |
| -------------------------- | ----------------------------------- | ----------------------------------------- |
| SCOUT (no drill)           | Current Cpk vs target               | `stats.cpk`                               |
| SCOUT (drilling)           | Cpk → projected if fixed            | `simulateOverallImpact()` with complement |
| SCOUT (benchmark pinned)   | Cpk → benchmark Cpk                 | Benchmark finding stats                   |
| INVESTIGATE                | Cpk → projected (n findings scoped) | Cumulative finding projection             |
| IMPROVE                    | Cpk → projected (ideas selected)    | Per-idea What-If projections aggregated   |
| IMPROVE (actions complete) | Cpk current → actual improvement    | Re-measured stats vs original             |

The What-If simulator is integrated into this flow:

- SCOUT: automatic complement-based projection (no user interaction)
- IMPROVE: per-idea What-If sliders (mean shift, σ reduction) refine the projection
- The toolbar always shows the best available projection for the current phase

### 7. Chart Grid — Tabbed Verification Card

The grid simplifies to a clean 2-row layout (55fr/45fr):

```
┌──────────────────────────────────────────────────────┐
│  I-Chart (full width)                         55fr   │
├───────────┬────────────┬─────────────────────────────┤
│  Boxplot  │  Pareto    │  [Histogram | Prob Plot]    │
│  (flex-1) │  (flex-1)  │  (tabbed card, flex-1) 45fr │
└───────────┴────────────┴─────────────────────────────┘
```

- **Tabbed verification card**: toggles between Histogram and Probability Plot
- **No Pareto** (1 factor): Boxplot + tabbed card (2 panels)
- **Stats sidebar open**: Stats summary removed from grid (it's in sidebar with full detail). Histogram/ProbPlot stay as tabbed card.
- **Scroll mode**: All charts stacked full-width at comfortable heights: I-Chart, Boxplot, Pareto, Histogram, Probability Plot (each separate card). Stats as summary-only card.

The tabbed card has:

- Tab bar: `[Histogram] [Prob Plot]`
- Full DashboardChartCard chrome: export (copy/PNG/SVG), maximize
- Shows distribution shape even without specs (just no spec lines)

### 8. Stats Sidebar Role Change

The Stats sidebar shifts from "primary display" to "deep dive":

**Before (current)**:

- Primary home for Cpk, Pass Rate, Mean, Median, σ
- Histogram + Probability Plot in tabs
- Only way to see process health without sidebar open

**After**:

- Key stats always visible in toolbar (no sidebar needed for glance)
- Sidebar = detailed exploration: full metric grid (incl. Median, percentiles), data table, spec editor, What-If simulator (full sliders)
- Sidebar still resizable (280–500px, left side)
- Stats sidebar content unchanged — tabs: Summary, Data, Histogram, Probability Plot

## Adaptive Content Rules

### Stats shown by context

| Has specs? | Has drill? | Stats in toolbar                                       |
| ---------- | ---------- | ------------------------------------------------------ |
| No         | No         | Mean, σ, n + "Set specs" prompt                        |
| Yes        | No         | Pass, Cpk/target, Mean, σ, n                           |
| Yes        | Yes        | Cpk → projected + filter chips + variation bar         |
| No         | Yes        | Mean, σ + filter chips + "Achievable: X–Y → Set specs" |

### Cpk color coding

| Cpk vs target | Color           |
| ------------- | --------------- |
| ≥ target      | Green (#22c55e) |
| 1.0 – target  | Amber (#f59e0b) |
| < 1.0         | Red (#ef4444)   |

### Variation bar color (existing logic)

| Cumulative % | Color | Meaning                                     |
| ------------ | ----- | ------------------------------------------- |
| ≥ 50%        | Green | High — more than half of variation in focus |
| 30–50%       | Amber | Moderate                                    |
| < 30%        | Blue  | Low — still exploring                       |

## Existing Infrastructure to Reuse

| Component/Function          | Location                                  | Role in new design                        |
| --------------------------- | ----------------------------------------- | ----------------------------------------- |
| `simulateOverallImpact()`   | `@variscout/core/variation/simulation.ts` | Complement-based projection               |
| `calculateProjectedStats()` | `@variscout/core/variation/simulation.ts` | Category exclusion projection             |
| `useVariationTracking()`    | `@variscout/hooks`                        | Variation bar data                        |
| `VariationBar`              | `@variscout/ui`                           | Variation bar component (move to toolbar) |
| `FilterBreadcrumb`          | `@variscout/ui`                           | Filter chips (extract into toolbar)       |
| `WhatIfSimulator`           | `@variscout/ui`                           | Per-idea projections in IMPROVE           |
| `ImprovementSummaryBar`     | `@variscout/ui`                           | Projected Cpk + delta display pattern     |
| `projectedCpkMap`           | `improvementStore`                        | Per-finding projected Cpk                 |
| `cpkTarget`                 | `AnalysisState`                           | Persisted Cpk target                      |
| `Finding` type              | `@variscout/core`                         | Extend with `role` and `benchmarkStats`   |
| `StatsPanelBase`            | `@variscout/ui`                           | Stays for sidebar detailed view           |
| `StatsSummaryPanel`         | `@variscout/ui`                           | Summary-only card for scroll mode         |
| `useResizablePanel`         | `@variscout/hooks`                        | Left-side resize for stats sidebar        |
| `DashboardGrid`             | `@variscout/ui`                           | Grid layout (simplify to 2-row)           |

## Scope & Phasing

### Phase 1: Unified Toolbar + Grid (layout)

- Merge stats + filter chips + variation bar into single toolbar row
- Tabbed Histogram/ProbPlot card in grid row 2
- Remove 3rd grid row (revert to 2-row: 55fr/45fr)
- Stats sidebar stays as detailed view
- Cpk target editable inline in toolbar

### Phase 2: Projection Engine (intelligence)

- Auto-projection from complement data during drill ("if fixed → Cpk X")
- `simulateOverallImpact()` computes: "If this subset performed like the complement, overall Cpk → X"
- Process entitlement display: Cp vs Cpk gap = centering opportunity ("free win")
- Data-driven target suggestion: complement's natural tolerance (Mean ± 3σ) as suggested specs
- Cumulative projection from multiple scoped findings

### Phase 3: Benchmark + Findings as Project Scope

- **Benchmark finding**: Analyst pins best-of-best subset (e.g., "Bed A, Morning Shift") as `Finding` with `role: 'benchmark'` and `benchmarkStats: { mean, stdDev, cpk, count }`
- Benchmark overrides complement-based projection: "If all subsets performed like Bed A AM → Cpk 1.85"
- **Findings as scope**: Selected findings define the improvement project. Each finding with source metadata (chart, category, factor) represents a fixable subset
- Cumulative projection: "If findings 1+2+3 fixed → Cpk Y" (progressive `simulateOverallImpact()` chaining)
- Toolbar becomes project scoreboard: `Cpk 0.26 → 1.62 (3 findings scoped) │ 0 fixed`

### Phase 4: Journey Thread + What-If Integration

- Projection thread connecting SCOUT → INVESTIGATE → IMPROVE through one consistent Cpk metric
- Toolbar adapts by journey phase (current Cpk → complement projection → benchmark → idea projections → actual)
- Per-idea What-If projections (from `ImprovementWorkspaceBase`) aggregate into per-finding projections via `projectedCpkMap`
- Actual vs projected tracking as actions resolve: `Cpk 0.26 → 1.45 actual (1 of 3 resolved)`
- What-If simulator inline in toolbar: collapsed by default, expand to adjust mean shift / σ reduction sliders
- `ImprovementSummaryBar` already shows projected Cpk + delta — unify with toolbar projection

## Not In Scope

- Mobile layout (phone stays carousel, tablet stays stacked)
- Performance mode / Yamazumi mode toolbar adaptation (future, uses Strategy pattern)
- AI-powered projection suggestions via CoScout
- Presentation mode toolbar behavior
