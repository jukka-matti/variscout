---
tier: ephemeral
purpose: build
title: Linked Views Phase 1 — Implementation Master Plan
status: active
date: 2026-05-28
layer: spec
---

# Linked Views Phase 1 — Implementation Master Plan

> **For agentic workers:** This is the PR-level master sequencer for the 2026-05-28 spec (State/Edit retire + linked-views architecture). It does NOT contain bite-sized 2-5-minute task steps; those come from per-PR `superpowers:writing-plans` invocations when each PR is ready to execute. Use `superpowers:subagent-driven-development` to execute individual PRs once their sub-plans are drafted.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md)

**Goal:** Ship Phase 1 of the linked-views architecture for VariScout wedge V1. Retire the State/Edit binary; introduce `analysisScopeStore` as the bridge between Process tab (live scope visualization) and Explore tab (single-row scope chrome with mixed-behavior click-to-edit chips). Yamazumi mode removed as prerequisite cleanup.

**Architecture:** Three-layer separation. (1) **Foundation cleanup** — yamazumi mode atomic deletion sweep + new `analysisScopeStore` Zustand store. (2) **Process tab refactor** — retire `authoringMode` state machine + `EditModeShell`; add Click-to-Explore affordances on chips; add live scope visualization (✓ markers, dim out-of-scope, categorical badges); add outcome summary pill. (3) **Explore tab refactor** — single-row scope chrome with mixed-behavior chips (new `SingleSelectPopover` for Y/X/step; reuse existing `FilterChipDropdown` for categorical multi-select); chart-click drill-in (Pareto bar + Boxplot category → `addCategoricalValue`); F1 `pendingExploreIntent` migrates to scope store. Phase 2 (T-NEW-4) closes the bidirectional loop later.

**Tech Stack:** TypeScript, React, Zustand stores (per ADR-078 nine-store model — `analysisScopeStore` becomes the tenth), Tailwind v4. Files split between `packages/core/` (pure domain logic), `packages/stores/` (Zustand stores), `packages/ui/` (shared components), `packages/charts/` (chart primitives + delete `YamazumiChart.tsx`), `apps/azure/` + `apps/pwa/` (app shells).

**Decomposition rule:** ≤ 6–8 tasks per PR per `feedback_slice_size_cap`. PR-LV1-0 (yamazumi removal) uses the atomic-sweep carve-out per `feedback_atomic_sweep_one_dispatch` — one Opus implementer with internal Architect → Migration → Validator phases.

**Memory references:**

- `feedback_master_plan_for_multi_subsystem_specs` — this master plan is the sequencer; per-PR sub-plans get written separately
- `feedback_atomic_sweep_one_dispatch` — PR-LV1-0 ships as one Opus dispatch
- `feedback_wedge_v1_no_migration_no_backcompat` — no migration helpers needed (no real users)
- `feedback_subagent_driven_default` + `feedback_one_worktree_per_agent` — execution protocol
- `feedback_preserve_commit_history` — `gh pr merge --merge --delete-branch` (not `--squash`)
- `feedback_ui_build_before_merge` — `pnpm --filter @variscout/ui build` catches cross-package type drift

---

## PR sequence overview

| #   | PR           | Scope                                                               | Model           | Blocked by | Estimated tasks |
| --- | ------------ | ------------------------------------------------------------------- | --------------- | ---------- | --------------- |
| 0   | **PR-LV1-0** | Yamazumi mode removal (atomic deletion sweep)                       | Opus            | —          | 1 dispatch      |
| 1   | **PR-LV1-A** | `analysisScopeStore` Zustand store + tests                          | Opus            | LV1-0      | 4–6             |
| 2   | **PR-LV1-B** | Migrate F1 `pendingExploreIntent` → scope store                     | Sonnet          | LV1-A      | 3–4             |
| 3   | **PR-LV1-C** | Retire `authoringMode` + `EditModeShell` + Done button              | Sonnet          | LV1-0      | 4–6             |
| 4   | **PR-LV1-D** | `navigateToExploreForChip()` + canvas chip hover affordances        | Sonnet          | LV1-A, C   | 5–7             |
| 5   | **PR-LV1-E** | Explore scope chrome (`SingleSelectPopover` + `FilterChipDropdown`) | Sonnet          | LV1-A      | 6–8             |
| 6   | **PR-LV1-F** | Pareto + Boxplot click → `addCategoricalValue()` accumulation       | Sonnet          | LV1-A, E   | 4–6             |
| 7   | **PR-LV1-G** | Process tab canvas live scope visualization                         | Sonnet          | LV1-A, C   | 5–7             |
| 8   | **PR-LV1-H** | Outcome summary pill in Process tab header                          | Sonnet (Haiku?) | LV1-A      | 3–4             |

PR-LV1-B/C are independent of each other; can run in parallel after LV1-A + LV1-0 land. PR-LV1-D/E/F/G/H mostly serial because they share scope-store consumer wiring; can interleave if implementers are clear on the contract.

---

## PR-LV1-0: Remove yamazumi mode (atomic deletion sweep)

**Spec sections:** §6.1 (Yamazumi mode removed in wedge V1) · §10 PR-LV1-0 row · supersedes list (ADR-034)

**Goal:** Delete all yamazumi-specific code, types, components, hooks, mode strategy entries, detection wiring, persistence, i18n keys, and tests. Mark ADR-034 superseded; amend ADR-047; archive companion docs. The codebase ends up with 5 modes (`standard`, `capability`, `performance`, `defect`, `process-flow`) instead of 6.

**Files (delete):**

- `packages/core/src/yamazumi/` — entire directory (types.ts, detection.ts, aggregation.ts, classification.ts, index.ts + tests)
- `packages/charts/src/YamazumiChart.tsx` + `packages/charts/src/__tests__/YamazumiChart.test.tsx`
- Yamazumi exports in `packages/charts/src/index.ts`
- Yamazumi dashboard components in `apps/azure/src/components/` and `apps/pwa/src/components/`:
  - `YamazumiDashboard.tsx`, `YamazumiWrapper.tsx`, `YamazumiSummaryBar.tsx`, `YamazumiPareto.tsx`
  - Hooks: `useYamazumiChartData.ts`, `useYamazumiIChartData.ts`, `useYamazumiParetoData.ts`
- Yamazumi-specific tests in `apps/*/src/`

**Files (modify):**

- `packages/core/src/types.ts` — drop `'yamazumi'` from `AnalysisMode` union (line 335)
- `packages/core/src/analysisStrategy.ts` — drop `'yamazumi'` from `ResolvedMode` union (line 6); remove yamazumi strategy entry; simplify `resolveMode()` if needed
- `apps/azure/src/components/Dashboard.tsx` (lines 81–93 area) — remove yamazumi from `modeTabs`; drop yamazumi imports
- `apps/azure/src/pages/Editor.tsx` (lines ~456–458, ~930) — remove `onYamazumiDetected` + `setYamazumiMapping` + `setAnalysisMode('yamazumi')` wiring
- `packages/stores/src/projectStore.ts` — remove `yamazumiMapping` field + related actions; tighten `analysisMode` type
- `packages/core/src/i18n/messages/en.ts` — remove yamazumi-specific keys (if any)
- `docs/07-decisions/adr-034-yamazumi-analysis-mode.md` — add `## Amendment — 2026-05-28` block + change status to `superseded`; banner at top
- `docs/07-decisions/adr-047-analysis-mode-strategy-pattern.md` — `## Amendment — 2026-05-28` block noting yamazumi removed from union
- `docs/01-vision/methodology.md` — drop yamazumi from mode list (Section "The six modes" → "The five modes")
- `docs/OVERVIEW.md` — same mode-list update
- `docs/02-journeys/use-cases/USER-JOURNEYS-YAMAZUMI.md` — move to `docs/archive/use-cases/2026-05-28-USER-JOURNEYS-YAMAZUMI.md` with archive banner
- `docs/superpowers/specs/index.md` — mark yamazumi-related spec rows as superseded; archive entries

**Dependencies:** None. Prerequisite for the rest of the master plan.

**Model:** Opus (judgment-heavy deletion-cascade). Per `feedback_atomic_sweep_one_dispatch`: one dispatch with internal Architect → Migration → Validator phases.

**Scope (in):**

- Delete the code listed above
- Update mode unions + strategy pattern
- Doc updates + ADR amendments + use-case archive
- All tests that mentioned yamazumi pass or get deleted
- `pnpm test` green at root; `pnpm --filter @variscout/ui build` clean; `pnpm --filter @variscout/azure-app build` clean

**Out of scope:**

- Any other mode changes (performance / defect / process-flow stay)
- `analysisScopeStore` work (that's LV1-A)
- Process tab UI changes (that's LV1-C/D/G)

**Acceptance signal:**

- `grep -ri "yamazumi" packages/ apps/` returns 0 hits in source code (other than the archive doc and ADR amendment text)
- `pnpm test` and `pnpm build` green
- IDB schema unchanged (no real users — no migration script needed per `feedback_wedge_v1_no_migration_no_backcompat`)

**Sub-plan invocation:** When ready to execute, run `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-0 (yamazumi mode atomic deletion sweep). Reference master plan ./2026-05-28-linked-views-phase-1-master-plan.md and spec ../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §6.1. Internal phases: Architect (map deletion graph + impact) → Migration (delete + amend + archive in dependency order) → Validator (build + test + grep verify)."`

---

## PR-LV1-A: `analysisScopeStore` Zustand store + multi-value categorical actions + tests

**Spec sections:** §3 D10 (analysisScopeStore design) · §6 mode interaction table

**Goal:** Create the new Zustand store that becomes the single source of truth for active analysis scope. Mode-agnostic. Session-scoped (not persisted). Multi-value semantics for categorical filters match existing `FilterChipDropdown` / `onUpdateFilterValues(factor, newValues[])` pattern from `ProcessHealthBar`.

**Files (create):**

- `packages/stores/src/analysisScope/analysisScopeStore.ts` — Zustand store, state + actions
- `packages/stores/src/analysisScope/types.ts` — `AnalysisScopeState`, `AnalysisScopeActions`, `CategoricalFilter` interfaces
- `packages/stores/src/analysisScope/index.ts` — barrel export
- `packages/stores/src/analysisScope/__tests__/analysisScopeStore.test.ts` — vitest unit tests

**Files (modify):**

- `packages/stores/src/index.ts` — re-export `useAnalysisScopeStore`, types
- `packages/stores/package.json` exports map — add `./analysisScope` sub-path if pattern matches
- `packages/stores/tsconfig.json` paths — same
- `packages/stores/CLAUDE.md` — document the new store (per `feedback_no_backcompat_clean_architecture`)

**Dependencies:** Blocked by PR-LV1-0 (so the AnalysisMode union is already simplified — but actually no, scope store is mode-agnostic; it doesn't read AnalysisMode. So this could ship in parallel with LV1-0 in theory. Practically: serial keeps the mental model clean.)

**Model:** Opus (store design — judgment-density on the API shape, especially the multi-value categorical actions).

**Scope (in):**

- `AnalysisScopeState` interface per spec §3 D10
- All six actions: `setY`, `setBoxplotFactor`, `setStepId`, `addCategoricalValue`, `removeCategoricalValue`, `setCategoricalValues`, `removeCategoricalFilter`, `clearScope`
- Test coverage: single-value setters work; categorical filter actions handle empty-array auto-cleanup; setCategoricalValues replaces array; clearScope resets all
- Zustand devtools wiring (consistent with ADR-078 pattern)
- No persistence — session-scoped per spec

**Out of scope:**

- Any UI subscribers (those come in LV1-B/D/E/G/H)
- F1 pendingExploreIntent migration (LV1-B)
- Categorical filter visualization (LV1-G)

**Acceptance signal:**

- Store + types ship; 8–12 unit tests covering each action + edge cases
- `pnpm --filter @variscout/stores test` green
- `pnpm --filter @variscout/stores build` green
- Available via `import { useAnalysisScopeStore } from '@variscout/stores'`

**Sub-plan invocation:** When ready, run `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-A. Reference master plan and spec §3 D10 (full TypeScript signatures). Write TDD: tests-first for each action; ZUstand store last. ~4–6 tasks. Sonnet implementer + spec reviewer + code-quality reviewer per task."`

---

## PR-LV1-B: Migrate F1 `pendingExploreIntent` → scope store

**Spec sections:** §5.6 (Migration of F1's pendingExploreIntent)

**Goal:** F1's existing canvas-to-Explore exit (PR-CCJ-F1, Task #34) writes `pendingExploreIntent` to `panelsStore`. Migrate the apply-side logic to ALSO write the scope fields (`boxplotFactor`) to `analysisScopeStore`. F1's exit button itself remains unchanged. No user-visible behavioral change — but downstream PRs can now read scope from the store instead of duplicating intent-application logic.

**Files (modify):**

- `apps/azure/src/components/Dashboard.tsx` (lines ~437–447) — extend the mount-effect that applies `pendingExploreIntent` to also dispatch to `useAnalysisScopeStore`
- `apps/pwa/src/...` equivalent (find via grep)
- New unit test in `apps/azure/src/components/__tests__/Dashboard.test.tsx`

**Dependencies:** Blocked by PR-LV1-A (needs the store to exist).

**Model:** Sonnet (mechanical wiring; well-specified).

**Scope (in):**

- F1's `pendingExploreIntent.boxplotFactor` → `scope.setBoxplotFactor()` on apply
- F1's `pendingExploreIntent.focusedChart` — KEEP existing behavior (this is the F1 soft-gate UX, not Click-to-Explore; per spec D8.1 it stays)
- 1–2 new tests asserting scope-store side effect on intent apply

**Out of scope:**

- Any UI changes to F1's exit button or routing
- Adding new fields to PendingExploreIntent (LV1-D does that for the Click-to-Explore path)

**Acceptance signal:**

- F1 → Explore flow still works (existing tests stay green)
- New test: when `pendingExploreIntent.boxplotFactor = 'temp'` is applied, `useAnalysisScopeStore.getState().boxplotFactor === 'temp'`
- `pnpm --filter @variscout/azure-app test` green; `pnpm --filter @variscout/azure-app build` clean

**Sub-plan invocation:** Standard `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-B. Migration-only PR (no behavioral change). Touch Dashboard.tsx apply-effect; add tests. ~3–4 tasks."`

---

## PR-LV1-C: Retire `authoringMode` + `EditModeShell` + Done button

**Spec sections:** §3 D1 (Kill State/Edit binary) · D3 (Done retires) · §4.x context

**Goal:** Remove the `CanvasAuthoringMode = 'author' | 'read'` state machine. Canvas becomes always-editable (subject to `canEditCanvas` permission, unchanged). `EditModeShell` deleted; its chrome inlines into the canvas itself. `Done` button retires (no mode to exit). Per `feedback_wedge_v1_no_migration_no_backcompat`: drop fields directly, no migration helpers.

**Files (modify):**

- `packages/ui/src/components/Canvas/CanvasLevelRouter.tsx` (line 33) — delete `CanvasAuthoringMode` type
- `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — delete `authoringMode` `useState`, `effectiveAuthoringMode`, `setAuthoringMode`, `handleShellDone` (around lines 531, 1026, 1202–1205); inline the chrome that was conditional on `effectiveAuthoringMode === 'author'`
- `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` — DELETE the file entirely; lift its contents into CanvasWorkspace
- All consumers of `EditModeShell` — refactor to use the inlined chrome
- Tests touching `authoringMode` / Done button — update or delete

**Files (delete):**

- `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` + its tests

**Dependencies:** Blocked by PR-LV1-0 (so the codebase is in 5-mode state). Independent of LV1-A.

**Model:** Sonnet (mechanical retirement; `canEditCanvas` permission gating already handles access — no new policy logic).

**Scope (in):**

- Code deletion above
- Test updates: any test asserting Done click flips mode → delete or rewrite
- Inline chrome: ChipRail palette + zone borders + drag affordances render when `canEditCanvas === true`, dimmed/hidden when `canEditCanvas === false`. Permission already gates this; no new conditional.
- `pnpm --filter @variscout/ui test` and `pnpm --filter @variscout/ui build` green

**Out of scope:**

- Click-to-Explore affordances (LV1-D)
- Scope visualization (LV1-G)
- Outcome pill (LV1-H)
- Any UI redesign beyond mode-binary removal

**Acceptance signal:**

- `grep -r "authoringMode\|EditModeShell\|handleShellDone" packages/ apps/` → 0 hits
- Canvas renders identically in author mode; Done button gone; permission gating unchanged

**Sub-plan invocation:** Standard `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-C. Mechanical retirement: delete authoringMode + EditModeShell + Done. Inline ChipRail chrome into CanvasWorkspace. ~4–6 tasks. Sonnet implementer."`

---

## PR-LV1-D: `navigateToExploreForChip()` + canvas chip hover affordances + scope mutations

**Spec sections:** §3 D4 (Click-to-Explore as canvas purpose) · D7 (naming) · §4.2 affordances · §4.3 click handler contract · §4.4 step boxes · §4.6 L3 step-bound chips

**Goal:** Wire Click-to-Explore from canvas. Outcome / Factor / Step chips show "→ Explore" hover affordance (small icon button). Clicking sets the relevant scope-store field and switches to Explore tab. Step boxes on L2 process map get a secondary affordance (separate from drill-to-L3 click).

**Files (create):**

- `packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts` — helper function per spec §4.3
- `packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts`
- `packages/ui/src/components/Canvas/EditMode/Chips/ExploreJumpButton.tsx` — small icon button primitive used across chip types
- Tests for the button

**Files (modify):**

- `packages/ui/src/components/Canvas/EditMode/Zones/OutcomeZone/OutcomeChip.tsx` — render `<ExploreJumpButton>` on hover; wire to `navigateToExploreForChip({ kind: 'outcome', columnName, stepId? })`
- Similar for `FactorChip.tsx` and step-bound L3 chips
- `packages/ui/src/components/Canvas/internal/ProcessMapBase.tsx` — add `<ExploreJumpButton>` to step boxes (secondary to drill-to-L3 click)
- Tests + a11y assertions (`aria-label="Open {columnName} in Explore"`)

**Dependencies:** Blocked by PR-LV1-A (needs scope store) and PR-LV1-C (canvas chrome refactored).

**Model:** Sonnet (well-specified UI work).

**Scope (in):**

- Helper + button primitive + chip wiring (outcomes, factors, step-bound, L2 step boxes)
- Outcome chip click → `setY` + optional `setStepId` if step-bound
- Factor chip click → `setBoxplotFactor` + optional `setStepId`
- Step (L2 box) click via affordance → `setStepId` only
- Step (L2 box) main-body click → existing drill-to-L3 behavior (unchanged)
- After scope mutation: `panelsStore.showExplore()` to switch tab
- 8–10 new tests

**Out of scope:**

- Scope visualization on canvas (LV1-G — show ✓ markers after scope is set)
- Explore-side rendering (LV1-E renders the scope chrome that subscribes to store)
- focusedChart (per D8.1 — explicitly NOT set)

**Acceptance signal:**

- Click outcome chip "yield" on canvas → lands in Explore tab; `useAnalysisScopeStore.getState().yColumn === 'yield'`
- Click factor chip "temperature" → boxplotFactor set
- Click step (via secondary affordance) → stepId set; primary click still drills to L3
- All a11y attributes present (data-testid + aria-label)
- 4-chart dashboard renders (no focusedChart)
- `pnpm --filter @variscout/ui test` and `build` green

**Sub-plan invocation:** Standard `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-D. Helper + ExploreJumpButton + chip wiring across Outcome/Factor/Step/L2-step. Per spec §4.2–§4.4. ~5–7 tasks. Sonnet implementer."`

---

## PR-LV1-E: Explore scope chrome (single row, mixed-behavior chips)

**Spec sections:** §5.1 (Scope chrome design) · §3 D9 (refined) · D7 (naming)

**Goal:** Ship the single-row scope chrome in Explore tab header. Mixed-behavior chips: single-select `SingleSelectPopover` for Y / X / step (new primitive); existing `FilterChipDropdown` for multi-select categorical chips; `+ filter` affordance to add a new categorical filter via column picker → dropdown; `clear all` link; empty-state hint when `yColumn` undefined.

**Files (create):**

- `packages/ui/src/components/SingleSelectPopover/SingleSelectPopover.tsx` — new primitive, ~80 LOC
- `packages/ui/src/components/SingleSelectPopover/index.ts` + barrel
- `packages/ui/src/components/SingleSelectPopover/__tests__/SingleSelectPopover.test.tsx`
- `packages/ui/src/components/Explore/ScopeChrome/ScopeChrome.tsx` — root component, subscribes to `useAnalysisScopeStore`
- `packages/ui/src/components/Explore/ScopeChrome/ScopeChip.tsx` — dispatches to SingleSelectPopover or FilterChipDropdown based on chip kind
- `packages/ui/src/components/Explore/ScopeChrome/AddFilterButton.tsx` — `+ filter` affordance
- `packages/ui/src/components/Explore/ScopeChrome/EmptyStateHint.tsx`
- `packages/ui/src/components/Explore/ScopeChrome/index.ts` + tests

**Files (modify):**

- `apps/azure/src/components/Dashboard.tsx` — render `<ScopeChrome>` above the dashboard charts
- `apps/pwa/src/...` equivalent
- `packages/ui/src/index.ts` — export new components

**Dependencies:** Blocked by PR-LV1-A (scope store). Independent of LV1-B/C/D — could ship in parallel.

**Model:** Sonnet (UI composition; FilterChipDropdown reuse is straightforward).

**Scope (in):**

- `SingleSelectPopover` primitive: radios; active marker; close on outside-click; ESC dismisses; keyboard arrow-key nav
- Reuse existing `FilterChipDropdown` for categorical chips — wire its `onUpdateFilterValues` callback to `scope.setCategoricalValues(column, newValues)`
- Y/X/step chips: SingleSelectPopover with IP's outcomes/factors/steps as options
- Categorical chips: FilterChipDropdown
- `+ filter` button: opens column picker → opens FilterChipDropdown for chosen factor
- `× ` on each chip → calls the right remove action
- `clear all` link → `scope.clearScope()`
- Empty-state hint when `scope.yColumn === undefined`: dimmed one-line "No outcome selected. Go to Process tab to pick a measure."
- ~12–15 tests covering each chip behavior + popover interactions

**Out of scope:**

- Chart-click drill-in (LV1-F)
- Canvas-side visualization (LV1-G)
- Outcome pill (LV1-H)
- Y-strip / step-strip as separate components — REJECTED in spec D9

**Acceptance signal:**

- ScopeChrome renders above dashboard
- Click Y chip → popover with IP outcomes; click alternative → scope updates; dashboard re-renders with new Y
- Click categorical chip → FilterChipDropdown opens; toggle values → setCategoricalValues called
- `+ filter` → column picker → dropdown; selecting values creates new filter
- × on chip removes that scope field
- `pnpm --filter @variscout/ui test` and `build` green

**Sub-plan invocation:** Standard `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-E. Build SingleSelectPopover + ScopeChrome + ScopeChip dispatch + AddFilterButton + EmptyStateHint. FilterChipDropdown reuse via onUpdateFilterValues. ~6–8 tasks. Sonnet implementer; spec § 5.1 has all UX detail."`

---

## PR-LV1-F: Pareto bar + Boxplot category click → `addCategoricalValue()` accumulation

**Spec sections:** §5.4 (Drill-in from charts)

**Goal:** Two chart interactions add categorical filter values to scope. Pareto bar click → `scope.addCategoricalValue(paretoFactor, clickedCategory)`. Boxplot category / whisker click → `scope.addCategoricalValue(boxplotFactor, clickedCategory)`. Repeated clicks accumulate values within the same factor (vessel = [A, B] after two clicks). The scope chrome's categorical chip updates to reflect.

**Files (modify):**

- `packages/charts/src/ParetoChart.tsx` — add `onBarClick` callback wiring; ensure existing prop accepts the new dispatch path
- `packages/charts/src/Boxplot.tsx` — add `onCategoryClick` callback wiring
- `apps/azure/src/components/Dashboard.tsx` — wire Pareto/Boxplot callbacks to `useAnalysisScopeStore.getState().addCategoricalValue()`
- Tests in chart packages + integration tests in apps

**Dependencies:** Blocked by PR-LV1-A (scope store) and PR-LV1-E (scope chrome will display the accumulated filters).

**Model:** Sonnet (event-handler wiring + integration tests).

**Scope (in):**

- Pareto bar click handler dispatches addCategoricalValue with `(paretoFactor, clickedCategory)`
- Boxplot category click handler same with `(boxplotFactor, clickedCategory)`
- Accumulation behavior: clicking "vessel=A" then "vessel=B" → categoricalFilters has `{ column: 'vessel', values: ['A', 'B'] }`
- Tests for both chart click paths
- The other chart-click mutations (I-Chart point, Histogram bucket, Capability annotation) are Phase 2 / T-NEW-4 — explicitly DON'T wire those here

**Out of scope:**

- Cross-chart highlight (T-NEW-4)
- Click already-filtered category to REMOVE it from filter — TBD UX; default for Phase 1 is "additive only; × on scope chip removes whole filter"

**Acceptance signal:**

- Click Pareto bar for "vessel=A" → scope categoricalFilters has vessel=[A]
- Click second time for "vessel=B" → values=[A, B]
- ScopeChrome categorical chip displays "vessel: A, B"
- `pnpm test` green

**Sub-plan invocation:** Standard `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-F. Two chart-click handlers (Pareto + Boxplot) → addCategoricalValue. Accumulation behavior. ~4–6 tasks."`

---

## PR-LV1-G: Process tab canvas live scope visualization

**Spec sections:** §4.5 (Live scope visualization on canvas)

**Goal:** Canvas subscribes to `analysisScopeStore` and renders in-scope markers. Active Y outcome chip: green border + ✓ marker. Active boxplot factor chip: blue border + ✓ marker. Active step: highlighted in process map + "📍 active" badge in steps band. Categorical filters: chip badges show "({column}={value} only)" — e.g., vessel chip shows "vessel = A only". Out-of-scope chips: dimmed (~50% opacity) when any scope is active. When scope is empty, all chips render normally.

**Files (modify):**

- `packages/ui/src/components/Canvas/EditMode/Zones/OutcomeZone/OutcomeChip.tsx` — subscribe to scope; render ✓ markers + dim states
- Similar for `FactorChip.tsx`, step-bound chips
- `packages/ui/src/components/Canvas/internal/ProcessMapBase.tsx` — highlight active step; dim others
- `packages/ui/src/components/Canvas/EditMode/Zones/StepsBand/StepsBand.tsx` (or equivalent) — "📍 active" badge
- New tests for each subscription + visual marker

**Dependencies:** Blocked by PR-LV1-A (scope store) and PR-LV1-C (canvas chrome refactored).

**Model:** Sonnet (UI subscription + Tailwind class wiring).

**Scope (in):**

- Outcome chip in OutcomeZone shows `border-green-400 ring-1 ring-green-400` + ✓ marker when `scope.yColumn === chip.columnName`
- Factor chip in FactorsZone same with blue
- Step in process map: amber border + "active" badge when `scope.stepId === step.id`
- Categorical filter badges on factor chips: small pill showing `({column} = {values.join(', ')} only)` when chip's column has a filter
- Dim-out-of-scope: chips not matching active scope get `opacity-50`; active and unbound chips stay full
- Empty scope state: all chips full opacity, no markers
- ~10 tests for visual states + a11y

**Out of scope:**

- Click-to-Explore affordances (LV1-D)
- Mutation back to scope (this is read-only on canvas; Phase 2 / T-NEW-4 closes the loop)

**Acceptance signal:**

- Set scope.yColumn → outcome chip border turns green + ✓
- Set scope.stepId → process map highlights that step
- Add categorical filter → factor chip shows "(vessel = A only)" badge
- Clear scope → all chips render normally
- `pnpm --filter @variscout/ui test` and `build` green

**Sub-plan invocation:** Standard `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-G. Canvas-side scope subscription + visual markers (✓, dim, categorical badges). Per spec §4.5. ~5–7 tasks."`

---

## PR-LV1-H: Outcome summary pill in Process tab header

**Spec sections:** §3 D2 (drop §3.3 panels; keep outcome pill) · §4.1 (Outcome summary pill)

**Goal:** Small pill in Process tab header showing the active outcome's name + latest Cpk + link to the outcome spec popover. When `scope.yColumn` is undefined, the pill is hidden.

**Files (create):**

- `packages/ui/src/components/Canvas/EditMode/Header/OutcomeSummaryPill.tsx` — the new chrome component
- Tests

**Files (modify):**

- `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` or its header subcomponent — render `<OutcomeSummaryPill>` in the Process tab header
- `apps/azure/src/components/...` and `apps/pwa/src/...` — wire if needed

**Dependencies:** Blocked by PR-LV1-A (scope store needs yColumn).

**Model:** Sonnet (or Haiku if the pill is purely presentational — depends on whether Cpk computation needs live filter-aware logic).

**Scope (in):**

- Pill subscribes to `scope.yColumn`
- Renders outcome's name + latest Cpk (computed from current `filteredData` after scope filters applied — could use existing Cpk computation)
- Click → opens existing outcome spec popover (link to existing component)
- Hidden when `scope.yColumn === undefined`
- ~4 tests

**Out of scope:**

- Building a new Cpk computation — reuse existing
- Detailed outcome management (handled in existing spec popover)

**Acceptance signal:**

- Set scope.yColumn → pill appears with name + Cpk
- Click ↗ → outcome spec popover opens
- Clear scope → pill hides
- `pnpm --filter @variscout/ui test` and `build` green

**Sub-plan invocation:** Standard `superpowers:writing-plans` with prompt: `"Sub-plan for PR-LV1-H. Small chrome pill subscribing to scope.yColumn. Reuse existing Cpk computation + outcome spec popover. ~3–4 tasks."`

---

## Cross-cutting verification (after all 9 PRs land)

1. **End-to-end browser walk skipped per wedge V1** (`feedback_wedge_v1_no_migration_no_backcompat`). Subagent-driven-development per-task review + final-branch Opus review is the quality gate.
2. **Per-package builds clean:** `pnpm --filter @variscout/stores build`, `pnpm --filter @variscout/ui build`, `pnpm --filter @variscout/charts build`, `pnpm --filter @variscout/azure-app build`, `pnpm --filter @variscout/pwa-app build`.
3. **Full test suite:** `pnpm test` (turbo, all packages).
4. **pr-ready-check:** `bash scripts/pr-ready-check.sh` green at the end of each PR.
5. **Architecture-grep:** `grep -ri "yamazumi" packages/ apps/` returns nothing in source after LV1-0.
6. **Architecture-grep:** `grep -ri "authoringMode\|EditModeShell" packages/ apps/` returns nothing after LV1-C.

---

## Self-review against spec

**1. Spec coverage:**

- §1 Context → addressed by master plan goal
- §2 Foundational rethink → addressed by LV1-C (kill binary)
- §3 D1 → LV1-C
- §3 D2 → LV1-H (outcome pill) + LV1-C (drop other §3.3 panels via EditModeShell deletion)
- §3 D3 → LV1-C
- §3 D4 → LV1-D
- §3 D5 → LV1-D (via stepId in chip click)
- §3 D6 → vocabulary inherited; T-NEW-1 doc PR captures the methodology spine update (out of scope for this implementation plan)
- §3 D7 → LV1-D (naming locked in helper + button)
- §3 D8 → LV1-A (scope is mode-agnostic by design); LV1-A explicitly does NOT touch `projectStore.analysisMode`
- §3 D8.1 → LV1-B + LV1-D (drop focusedChart from per-chip path; F1 exit keeps its focusedChart)
- §3 D9 → LV1-E (single-row scope chrome)
- §3 D10 → LV1-A (scope store)
- §4.1 outcome pill → LV1-H
- §4.2 chip affordances → LV1-D
- §4.3 click handler → LV1-D
- §4.4 step boxes → LV1-D
- §4.5 live scope visualization → LV1-G
- §4.6 step-bound chips → LV1-D
- §5.1 scope chrome → LV1-E
- §5.4 chart-click drill-in → LV1-F
- §5.5 dropped focusedChart → LV1-B (+ LV1-D doesn't introduce one)
- §5.6 F1 migration → LV1-B
- §6 mode interaction → LV1-A (scope mode-agnostic) + each mode's strategy naturally honors scope fields
- §6.1 yamazumi removal → LV1-0
- §7 vocabulary → inherited; T-NEW-1 follow-up
- §8 Phase 1 list → 1:1 mapped to PRs above
- §9 follow-ups → captured as separate tasks (#49 T-NEW-1, #50 T-NEW-3, #51 T-NEW-4); not in this plan
- §10 implementation order → this plan IS §10's elaboration

No gaps identified.

**2. Placeholder scan:** No "TBD", "TODO", or "fill in details" found. All file paths exact. All scopes explicit.

**3. Type consistency:** `analysisScopeStore` schema referenced consistently across LV1-A/B/D/E/F/G/H. `navigateToExploreForChip` referenced consistently. Multi-value vs single-value chip behavior named consistently (SingleSelectPopover vs FilterChipDropdown).

---

## Related

- Spec: `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`
- F1 sub-plan precedent: `docs/superpowers/plans/2026-05-28-canvas-connection-journey-f-1-explore-exit.md`
- H1 sub-plan precedent: `docs/superpowers/plans/2026-05-28-canvas-connection-journey-h-1-polish.md`
- CCJ master plan precedent: `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md`
- ADR-082 wedge: `docs/07-decisions/adr-082-wedge-architecture.md`
- ADR-078 nine-store model: `docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md`
- Memory: `feedback_master_plan_for_multi_subsystem_specs`, `feedback_atomic_sweep_one_dispatch`, `feedback_wedge_v1_no_migration_no_backcompat`, `feedback_subagent_driven_default`, `feedback_one_worktree_per_agent`, `feedback_preserve_commit_history`, `feedback_ui_build_before_merge`
