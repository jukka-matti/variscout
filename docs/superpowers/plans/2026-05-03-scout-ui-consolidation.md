# Scout UI / Navigation consolidation

## Context

The Scout/Analysis screen currently stacks **four** horizontal strips above the
chart grid:

1. Top app bar — logo + "Pasted Data (500 rows)" + (Stats / Findings / What-If) + share/settings
2. Phase tabs — Frame / Analysis / Investigation / Improvement / Report
3. ProcessHealthBar — view-toggle • Factors(4) • x̄ • σ • n • Set specs → • Export
4. Per-chart card header — title row + a separate controls row (and in some cards a sub-row of stats)

Each chart card spends two rows of vertical space on chrome before the chart
itself starts. The user goal is **maximize chart real estate**: collapse strips
where possible, fold per-card controls into the card title row, and lift
genuinely-global controls (the Fixed/Rolling/Open/Cumulative time-window cluster)
out of the chart card and into the page-level row.

The Fixed/Rolling/Open/Cumulative segmented control is really a **Cpk stability
window** — it walks the capability calculation across time. Today it lives
inside the I-Chart card alongside metric/grouping/Auto order/Measurements, which
makes the chart's controls row long and hides the fact that the time lens
applies to capability/probability calcs broadly, not just I-Chart rendering.

## Recommended approach

### Strip 1 — Top app bar (one row, full width)

Becomes the single global navigation strip. Contents, left → right:

- Logo
- Filename / data source label ("Pasted Data (500 rows)")
- Phase tabs (Frame / Analysis / Investigation / Improvement / Report) — moved up from Strip 2
- Spacer
- Stats / Findings / What-If — stay top-right (placement to be revisited later)
- Share / Settings

**Result:** Strip 2 (the dedicated phase-tabs row) is deleted entirely.

### Strip 2 — Page nav (was ProcessHealthBar)

Single row, ~36 px. Contents, left → right:

- View-toggle icons (grid/list)
- Factors(4) • x̄ 25.83 • σ 4.83 • n 500
- Set specs →
- **Time lens** (new) — single button "Time: Cumulative ▾" opening a popover
  with Fixed / Rolling / Open-ended / Cumulative + measurements / window size.
  Default Cumulative.
- Spacer
- Export

This row is the global control surface. The Time lens drives the Cpk stability
window for the I-Chart and any capability/probability calculation derived from it.

### Strip 3 — Chart cards

Each card collapses to **one header row** (title + inline controls), then chart.

| Card                                         | Header layout                                                                                                                                                                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I-Chart**                                  | `I-Chart: Total_Output_Down_kg` `[metric ▾] [grouping ▾] [order ▾] [Measurements] [Cpk stability]` — Fixed/Rolling/Open/Cumulative removed (now global). The "8 stages • Overall Mean: 25.83" sub-row collapses to small inline chips after the controls. |
| **Boxplot**                                  | `Boxplot` `[Factor: Material_Type ▾] [display ▾]` — the four factor text-tabs become one dropdown.                                                                                                                                                        |
| **Verify** (Probability/Distribution/Pareto) | `[ Probability │ Distribution │ Pareto ]` segmented control IS the title — no separate title text. Selected view fills the card.                                                                                                                          |
| **Pareto**                                   | (existing card; same pattern — title + inline controls.)                                                                                                                                                                                                  |

### Time-lens scope — global filter (Option B)

The Time lens **filters the underlying observation set** fed to every chart
and to the page-level stats. Picking "Rolling, last 100" reduces n in the
page nav, recomputes x̄/σ, redraws every card from that filtered set. Picking
"Cumulative" (default) is the full sample.

Implementation implications:

- The lens lives on a global Zustand store (likely the analysis/projection
  store) as `{ mode: 'cumulative' | 'fixed' | 'rolling' | 'openEnded',
windowSize?: number, anchor?: number }`.
- Chart data hooks (`useIChartData`, `useBoxplotData`,
  `useProbabilityPlotData`, `useParetoData`, plus the page-stats selector)
  all subscribe to the lens and apply it as a row-filter before stats /
  rendering.
- The Cpk stability calculation that today walks windows internally for the
  I-Chart becomes simpler: it runs on the already-filtered set. Reuse the
  windowing utilities from `packages/core/src/stats/` for the rolling /
  fixed / open-ended math.
- "Set specs" continues to apply to the unfiltered population — specs are a
  property of the process, not the lens.
- Investigation findings recorded against a filtered view need to capture the
  lens state in their `FindingSource` (so a finding "Material A is high
  Tue–Fri only" replays correctly). Add `timeLens` to the finding source
  payload.

## Critical files

- **Top bar + phase tabs**: `apps/pwa/src/App.tsx` (lines ~770–793 inline tab
  buttons; `usePanelsStore` holds activeView). Mirror in `apps/azure/src/App.tsx`.
- **Page nav (ProcessHealthBar)**:
  `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx` — add Time
  lens button + popover.
- **Chart card shell**:
  `packages/ui/src/components/DashboardBase/DashboardChartCard.tsx` — already
  exposes `title` / `controls` / `filterBar` / `footer` slots. No structural
  change needed; just collapse current two-row composition into one row by
  passing controls inline to title slot or tightening the existing header.
- **I-Chart controls assembly**:
  `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` (lines
  ~316–457). Remove the Fixed/Rolling/Open/Cumulative segmented control;
  read the value from a global Zustand selector instead. Inline the staged
  stats summary chips.
- **Boxplot controls** (same file, lines ~518–548): replace FactorSelector tab
  rendering with a single dropdown variant.
- **Verify / VerificationCard**: `apps/pwa/src/components/Dashboard.tsx`
  (lines ~432–486) — replace tab buttons with a segmented control acting as
  the card's only header element.
- **Time-window state**: lives today inside I-Chart props/local state. Move to
  a global selector — add a new field on the appropriate Zustand store
  (likely the analysis/projection store; confirm against the 4 domain stores
  per `project_zustand_first_architecture.md`). Reuse existing
  Cpk stability mode types from `packages/core/src/stats/`.

## Reuse, not rebuild

- `DashboardChartCard` slots are already there — don't rewrite the card shell.
- Cpk stability mode enum + window-size type live in
  `packages/core/src/stats/` — reuse for the global Time-lens popover.
- Segmented-control component already exists in `packages/ui` (used by
  Fixed/Rolling/Open/Cumulative today). Reuse for Verify card header.
- FactorSelector in `packages/ui` already supports a dropdown render mode —
  flip the boxplot from tabs variant to dropdown variant, no new component.

## Verification

1. **Visual** — `pnpm dev`, load Pasted Data sample with the 500-row Total_Output_Down_kg dataset shown in the screenshot, drive in the official Chrome extension (`claude --chrome`). Confirm:
   - Top bar shows phase tabs inline (no second strip).
   - Page nav shows Time lens between Set specs and Export.
   - I-Chart card header is one row, no Fixed/Rolling/Open/Cumulative cluster.
   - Boxplot card has one factor dropdown (no tab strip).
   - Verify card has segmented control as header (no separate title text).
   - Each chart card gains ~32–48 px of vertical space vs current.
2. **Behavior** — change Time lens; confirm **every** chart redraws and the
   page-nav stats (x̄/σ/n) recompute against the filtered set. "Set specs"
   stays anchored to the unfiltered population. Findings recorded under a
   non-Cumulative lens replay correctly.
3. **Tests** — `pnpm test` per package; in particular:
   - `packages/ui` snapshot/RTL coverage for ProcessHealthBar, DashboardLayoutBase, DashboardChartCard.
   - `apps/pwa` Dashboard tests for Verify card segmented control.
   - Add a test asserting Time lens lives on the global store and is read by I-Chart props.
4. **Mode parity** — confirm the same layout works across Yamazumi /
   Performance / Defect / Process-Flow / Capability modes (chart-slot mapping
   in the mode strategy is unchanged; we're only changing chrome composition).
5. **Mobile** — verify the page-nav row wraps gracefully on narrow widths;
   the Time lens popover opens above the chart on mobile.

## Implementation tasks (subagent-driven)

Each task is a fresh-subagent dispatch with a code-reviewer pass before merge.
Tasks are ordered for incremental delivery — every task ends in a green
`pnpm test` and a commit. Branch off `main` into a worktree.

**Task 0 — Worktree + branch.** Create `scout-ui-consolidation` worktree off `main`. Run baseline `pnpm test` to capture green starting state.

**Task 1 — Time-lens type + global store field.** Add `TimeLens` type (`{ mode: 'cumulative' | 'fixed' | 'rolling' | 'openEnded'; windowSize?: number; anchor?: number }`) in `packages/core/src/stats/timeLens.ts`. Add `timeLens` field + `setTimeLens` action to the analysis Zustand store (confirm correct store from the 4 domain stores). TDD: store unit tests for default state, set action, and serialization. Commit.

**Task 2 — Row-filter utility.** Add `applyTimeLens(rows, lens, timeColumn)` in `packages/core/src/stats/timeLens.ts`. Cumulative → identity; Rolling → last-N; Fixed → anchor-window; Open-ended → from-anchor-onwards. TDD: each mode + edge cases (empty, lens.windowSize > rows.length, missing timeColumn). Commit.

**Task 3 — Wire chart-data hooks to lens.** Modify `useIChartData`, `useBoxplotData`, `useProbabilityPlotData`, `useParetoData`, and the page-stats selector in `packages/hooks/` to read `timeLens` and call `applyTimeLens` before stats/rendering. TDD: hook tests asserting filtered output for each mode. Commit.

**Task 4 — Page-nav Time-lens button + popover.** Modify `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx` to add `[Time: <mode> ▾]` button between "Set specs →" and Export. Popover with mode segmented control + window-size input (where applicable). RTL tests for default render, popover open/close, mode switch dispatches store action. Commit.

**Task 5 — Strip Fixed/Rolling/Open/Cumulative from I-Chart card.** Edit `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` (lines ~316–457). Remove the Fixed/Rolling/Open/Cumulative segmented control from `ichartControls`. The I-Chart now consumes `timeLens` from store via Task 3. Collapse the staged stats sub-row ("8 stages • Overall Mean: 25.83") into inline chips on the same row as title + remaining controls. RTL tests asserting one-row header + no time-window cluster. Commit.

**Task 6 — Boxplot factor: tabs → dropdown.** Same file (lines ~518–548). Replace FactorSelector tabs render with its dropdown variant. Move dropdown inline with title. RTL tests. Commit.

**Task 7 — Verify card: segmented header replaces title.** Edit `apps/pwa/src/components/Dashboard.tsx` (lines ~432–486). Replace text tabs with the existing segmented-control component used previously by Fixed/Rolling/etc. Drop the static title text — segmented control IS the header. RTL tests. Commit.

**Task 8 — Top bar: phase tabs inline.** Edit `apps/pwa/src/App.tsx` (lines ~770–793). Move the phase tabs into the top app bar between filename and the right-aligned Stats/Findings/What-If/share/settings cluster. Delete the dedicated phase-tabs strip. RTL tests for top-bar layout + active-phase rendering. Commit.

**Task 9 — Findings replay.** Add `timeLens` to `FindingSource` payload (discriminated union in `packages/core/src/findings/`). When recording a finding, snapshot current lens. When replaying a finding, restore lens via `setTimeLens`. TDD: round-trip test for each FindingSource variant. Commit.

**Task 10 — Cross-package build + visual walk.** Run `pnpm build` (all packages — must include `@variscout/ui` per the per-package vitest gap rule). Run `pnpm dev`, walk the dashboard in `claude --chrome`, capture screenshots at default + Rolling-100 + Fixed-50 lens settings. Verify the 5 visual checks in the Verification section above. Commit screenshot evidence under `docs/05-technical/screenshots/scout-consolidation/`.

**Task 11 — Code-reviewer dispatch.** Final pass: dispatch the `feature-dev:code-reviewer` agent on the full diff. Address any high-confidence issues (especially around store-shape changes, FindingSource union narrowing, and three-boundary numeric safety in the lens math). Commit.

**Task 12 — PR.** Open PR against `main` with the design spec linked. Include a screenshot before/after of one chart card showing the height saving. Run `bash scripts/pr-ready-check.sh`.

**Out of scope for this branch (follow-ups, not tasks here):**

- Azure app mirror PR
- Final placement of Stats/Findings/What-If
- Pareto card-specific redesign

## Out of scope

- Final placement of Stats / Findings / What-If (kept top-right for now;
  user will revisit).
- Pareto card redesign beyond the inline-controls pattern.
- Mode-strategy refactor (chart slots stay as-is).
- Azure app — same redesign should apply, but covered in a follow-up PR after
  the PWA pattern is validated.
