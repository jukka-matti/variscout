---
title: Scout UI consolidation — design
audience: [designer, engineer, product]
category: design-spec
status: draft
date: 2026-05-03
last-reviewed: 2026-05-03
related:
  - multi-level-scout
  - process-learning-operating-model
  - investigation-scope-and-drill-semantics
---

# Scout UI consolidation — design

## §1 Context

The Scout/Analysis screen stacks four horizontal chrome strips above the chart grid:

1. **Top app bar** — logo, filename, right-side cluster (Stats / Findings / What-If, share, settings).
2. **Phase tabs** — Frame / Analysis / Investigation / Improvement / Report (own row).
3. **Process Health Bar** — view-toggle, `Factors(N) | x̄ | σ | n`, Set specs, Export.
4. **Per-chart card** — title row, then a _separate_ controls row (and in some cards a sub-row of stats/sub-tabs).

Each chart card spent two rows of chrome before the chart began. The I-Chart card additionally carried a four-button segmented control for `Fixed / Rolling / Open-ended / Cumulative` — actually a Cpk-stability _time window_ — buried alongside metric / grouping / order / Measurements controls. The control was opaque to non-experts, applied conceptually to capability/probability calcs more broadly than just the I-Chart, and consumed horizontal space the chart needed.

Goal: maximise chart real estate, surface the time-window concept as a global lens, and remove the redundant per-card chrome.

## §2 The new shape

### §2.1 Top app bar (one row, full width)

Becomes the single global navigation strip. Left → right:

- Logo
- Filename / data source label (e.g. "Pasted Data (500 rows)")
- **Phase tabs** — Frame / Analysis / Investigation / Improvement / Report (moved up from their dedicated strip)
- Spacer
- Stats / Findings / What-If (placement to be revisited; kept top-right for now)
- Share / Settings

The dedicated phase-tabs strip is deleted entirely.

### §2.2 Page nav (~36 px) — formerly Process Health Bar

Single global control surface. Left → right:

- View-toggle (grid/list)
- `Factors(N)  •  x̄  •  σ  •  n`
- `Set specs →`
- **Time lens (new)** — single button "Time: <mode> ▾" → popover with mode selector (Cumulative / Rolling / Fixed / Open-ended) + a window-size / anchor input where applicable. Default Cumulative.
- Spacer
- Export

### §2.3 Chart cards — one header row each

| Card                                             | Header layout                                                                                                                                                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I-Chart**                                      | `I-Chart: <metric>` `[metric ▾] [grouping ▾] [order ▾] [Measurements] [Cpk stability]` — the time-window cluster is gone (now global). Staged-stats sub-row (`8 stages • Overall Mean: 25.83`) collapses to inline chips after the controls. |
| **Boxplot**                                      | `Boxplot` `[Factor: <column> ▾] [display ▾]` — the four factor _tabs_ become one dropdown.                                                                                                                                                   |
| **Verify** (Probability / Distribution / Pareto) | `[ Probability │ Distribution │ Pareto ]` segmented control IS the title. No separate title text. Selected view fills the card.                                                                                                              |
| **Pareto**                                       | Existing card; same inline-controls pattern.                                                                                                                                                                                                 |

### §2.4 Time-lens scope — global filter (Option B)

The Time lens **filters the underlying observation set** fed to every chart and to the page-level stats. Picking "Rolling, last 100" reduces `n` in the page nav, recomputes `x̄/σ`, redraws every card from that filtered set. Picking "Cumulative" (default) is the full sample.

Implications:

- Lens lives on `useSessionStore` (analysis/projection-level state) as a discriminated union: `{ mode: 'cumulative' } | { mode: 'rolling'; windowSize: number } | { mode: 'fixed'; anchor: number; windowSize: number } | { mode: 'openEnded'; anchor: number }`. Persisted via `partialize` with `version`/`migrate` for safe rehydrate of pre-existing sessions.
- Chart-data hooks (`useIChartData`, `useBoxplotData`, `useProbabilityPlotData`, `useParetoChartData`) and the page-stats source (`useAnalysisStats`) all consume `timeLens` and call `applyTimeLens(rows, lens, timeColumn)` (in `@variscout/core/stats`) before computing.
- The I-Chart's internal Cpk-stability windowing now operates on the already-filtered set.
- `Set specs` continues to apply to the unfiltered population — specs are a property of the process, not the lens.
- **Investigation findings recorded under a non-Cumulative lens snapshot the lens state in `FindingSource`** so they replay correctly later.

## §3 Out of scope (this design)

- Final placement of Stats / Findings / What-If (kept top-right; revisit after the rest lands).
- Pareto card-specific redesign beyond the inline-controls pattern.
- Mode-strategy refactor — chart-slot mapping in `AnalysisModeStrategy` is unchanged; we change chrome composition only.
- Azure app mirror — same redesign should apply, but covered in a follow-up PR after the PWA pattern is validated.

## §4 Delivery

Implementation plan: `docs/superpowers/plans/2026-05-03-scout-ui-consolidation.md` (12 tasks, executed via `superpowers:subagent-driven-development` on the `scout-ui-consolidation` worktree). Status tracked in `docs/decision-log.md`.

## §5 Verification

1. **Visual** (`pnpm dev` + `claude --chrome`): top bar contains phase tabs (no dedicated strip below); page nav shows Time lens between Set specs and Export; each chart card header is one row; Verify card has segmented control as header (no separate title); each card gains ≈32–48 px chart area.
2. **Behavior**: changing the Time lens redraws every chart and recomputes page-nav stats from the filtered set; `Set specs` stays anchored to the unfiltered population; findings recorded under a non-Cumulative lens replay correctly.
3. **Tests**: per-package vitest suites; `@variscout/ui` build green to catch cross-package type-export gaps; visual evidence captured under `docs/05-technical/screenshots/scout-consolidation/`.
4. **Mode parity**: layout works across Yamazumi / Performance / Defect / Process-Flow / Capability modes (chart-slot mapping unchanged).
5. **Mobile**: page-nav row wraps gracefully; Time-lens popover opens above the chart.
