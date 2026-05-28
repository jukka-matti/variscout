---
tier: ephemeral
purpose: build
title: Canvas Connection Journey — Implementation Master Plan
status: active
date: 2026-05-26
layer: spec
---

# Canvas Connection Journey — Implementation Master Plan

> **For agentic workers:** This is the PR-level master sequencer for Spec 2 (Canvas Connection Journey). It does NOT contain bite-sized 2-5-minute task steps; those come from per-PR `superpowers:writing-plans` invocations when each PR is ready to execute. Use `superpowers:subagent-driven-development` to execute individual PRs once their sub-plans are drafted.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md)

**Goal:** Implement the Process tab's Edit mode — the canvas-based onboarding from paste to ready-to-analyze. Universal canvas, shape-invisible, three zones mapped to user cognitive tasks, step-bound vs global outcomes + factors, parsing UX, derived chips, Promote-to-Project, exit to Explore, 2-tier ACL.

**Architecture:** Layered. Foundation primitives (chips, palette, parsing) → canvas zones (outcomes, factors, process) → step-bound binding → workflows (timings, calc, time-as-factors) → derived chips engine → Promote-to-Project → exit + smart routing. Each phase produces working, testable software.

**Tech Stack:** TypeScript, React, Zustand stores (per ADR-078 nine-store model), Tailwind v4. Files split between `packages/core/` (pure domain logic), `packages/ui/` (shared components), `apps/azure/` + `apps/pwa/` (app shells).

**Decomposition rule:** ≤ 6–8 tasks per PR per `feedback_slice_size_cap`. Carve-out for atomic deletion-cascade sweeps per `feedback_atomic_sweep_one_dispatch`.

---

## File structure (locked decisions)

### Files to CREATE

```
packages/ui/src/components/Canvas/EditMode/
├── index.ts                                  — barrel + public API
├── EditModeShell.tsx                         — top-level Edit-mode container
├── Palette/
│   ├── index.ts
│   ├── ColumnChip.tsx                        — single chip with parsing badge + drag
│   ├── ColumnChipContextMenu.tsx             — per-chip ⋮ menu
│   ├── ColumnGroup.tsx                       — grouped section (numeric / categorical / time)
│   ├── ParsingOverridePopover.tsx            — chip's ▾ override panel
│   ├── ParsingBanner.tsx                     — aggregate ⚠ banner
│   └── SystemHint.tsx                        — contextual hints (batch detected, time cols)
├── Zones/
│   ├── index.ts
│   ├── OutcomeZone.tsx                       — Y zone with cards
│   ├── OutcomeCard.tsx                       — single Y chip with ⚙ specs
│   ├── SpecsPopover.tsx                      — target / LSL / USL / cpkTarget
│   ├── FactorsZone.tsx                       — X zone (global factors)
│   ├── FactorChip.tsx                        — single X chip
│   └── ProcessStructureZone.tsx              — process model zone
├── ProcessModel/
│   ├── index.ts
│   ├── StepBox.tsx                           — single step with bound Y + X sections
│   ├── EmergentProcessModel.tsx              — builds step model from dropped column
│   └── StepEditAffordances.tsx               — rename, add sub-steps (V2 stubs)
├── Workflows/
│   ├── index.ts
│   ├── StepTimingsModal.tsx                  — paired start/end OR duration assignment
│   ├── CalculatedColumnModal.tsx             — formula builder + batch templates
│   ├── TimeAsFactorsModal.tsx                — pick column + dimensions
│   └── workflowState.ts                      — shared state for workflow modals
├── PromoteToProject/
│   ├── index.ts
│   ├── CharterModal.tsx                      — Issue Statement + invite + refined goal
│   ├── InheritedContextBlock.tsx             — pre-fill display per entry point
│   └── entryPointAdapters.ts                 — Home/Explore/Investigation/L3/Project
└── __tests__/
    ├── EditModeShell.test.tsx
    ├── Palette.test.tsx
    ├── Zones.test.tsx
    ├── ProcessModel.test.tsx
    ├── Workflows.test.tsx
    └── PromoteToProject.test.tsx

packages/ui/src/components/Explore/Probability/InflectionBinning/
├── index.ts
├── InflectionGuides.tsx                      — cyan/purple guide lines on prob plot
├── BinningSidePanel.tsx                      — proposed cuts + preview + CTA
├── cutDetection.ts                           — KDE valley + change-point algorithms
└── __tests__/
    └── inflectionBinning.test.tsx

packages/core/src/derived/
├── index.ts
├── leadTime.ts                               — compute Lead/Total_work/Wait from timings
├── timeDecomposition.ts                      — week/day-of-week/hour derivations
├── ratioCalculation.ts                       — batch-ratio engine
└── __tests__/
    ├── leadTime.test.ts
    ├── timeDecomposition.test.ts
    └── ratioCalculation.test.ts
```

### Files to MODIFY

```
packages/core/src/projectMembership/
├── canAccess.ts                              — collapse 6 actions → 2 tiers
├── types.ts                                  — drop approve-* actions
└── __tests__/canAccess.test.ts               — update test expectations

packages/core/src/improvementProject/
├── types.ts                                  — extend ImprovementProjectGoal.outcomeGoal
│                                               to list of {column, target, specs, stepId?}
└── reducers.ts (or equivalent)               — handle list-of-outcomes mutations

packages/stores/src/
├── activeIPStore.ts                          — minor: support step-context in active IP
└── (other stores)                            — minor: support derived chip persistence

apps/azure/src/components/editor/
├── FrameView.tsx                             — wire up new EditModeShell
└── (related Editor wiring)

apps/pwa/src/components/views/
├── FrameView.tsx                             — PWA equivalent
└── (related view wiring)

docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
docs/02-journeys/personas/sponsor.md
docs/02-journeys/ia-nav-model.md
```

---

## PR sequence (12 PRs across 8 phases)

### Phase A — Foundation (3 PRs, small)

Foundation cleanup that clears the way for code work. Each PR is small (1–3 days), low risk, no UI changes.

#### PR-CCJ-A1 · Wedge spec amendments + persona doc updates

**Scope:** The 6 wedge-spec amendments enumerated in Spec 2 §8.1 plus Sponsor persona doc + ia-nav-model matrix changes.

**Files:**

- Modify `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` — §3.0 / §3.2 / §3.3.4 / §4.1 amendments
- Modify `docs/02-journeys/personas/sponsor.md` — remove "skips Analyze + Investigation entirely" prose; update sequence diagram
- Modify `docs/02-journeys/ia-nav-model.md` — Sponsor matrix cells: `(no touch) → Read` on Analyze + Investigation
- Modify `docs/02-journeys/personas/lead.md` — minor amendment if affected (Charter framing)

**Size:** ~6–10 small text edits. 1 day. Solo-doable inline. No new tests required.

**Dependencies:** none. Lands first.

**Why first:** wedge spec needs to match the implemented design before any code change; persona docs are quick wins.

#### PR-CCJ-A2 · canAccess.ts ACL collapse to 2 tiers

**Scope:** Collapse `ROLE_PERMISSIONS` from 6-action × 3-role to 2-tier model per Spec 2 §7.4.

**Files:**

- Modify `packages/core/src/projectMembership/types.ts` — drop `'edit-charter'` / `'edit-approach'` / `'edit-improve'` / `'edit-sustainment'` / `'approve-charter'` / `'approve-sustainment'` action types; add single `'edit'` + `'edit-contributions'`
- Modify `packages/core/src/projectMembership/canAccess.ts` — collapse permission table
- Modify `packages/core/src/projectMembership/__tests__/canAccess.test.ts` — update test expectations
- Audit `packages/ui/`, `apps/azure/`, `apps/pwa/` for call sites of the dropped actions — replace with `'edit'` or `'edit-contributions'`

**Size:** 1–2 days. Single dispatch atomic sweep per `feedback_atomic_sweep_one_dispatch` (TypeScript compiler will surface all call sites).

**Dependencies:** none — orthogonal to A1.

**Sub-plan needed:** YES — invoke `writing-plans` when ready to execute.

#### PR-CCJ-A3 · ImprovementProject step-bound outcomes types

**Scope:** Extend `ImprovementProjectGoal.outcomeGoal` from single outcome to list with optional `stepId`. Enables step-bound outcomes.

**Files:**

- Modify `packages/core/src/improvementProject/types.ts` — `ImprovementProjectGoal.outcomeGoal: ImprovementProjectOutcomeGoal[]` (was singular); add `stepId?` field to entries
- Modify any reducer/action handlers for `ImprovementProject` — handle list mutations
- Update tests + fixtures

**Per `feedback_wedge_v1_no_migration_no_backcompat`:** no users yet; direct schema change, no migration helper.

**Size:** ~2 days. Compile cascade across consumers.

**Dependencies:** can land in parallel with A1 + A2.

**Sub-plan needed:** YES.

### Phase B — Edit-mode shell + palette (2 PRs, medium)

Build the canvas authoring shell + the palette that anchors everything else.

#### PR-CCJ-B1 · EditModeShell + State/Edit toggle wiring

**Scope:** Top-level Edit-mode container that lives inside the Process tab. Wires the `Edit map` toggle from State mode → Edit mode and `Done` back. Initial empty shell with placeholder zones; primitives come in B2.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` + `index.ts`
- Modify `apps/azure/src/components/editor/FrameView.tsx` — wire the shell
- Modify `apps/pwa/src/components/views/FrameView.tsx` — wire the PWA equivalent
- Modify `packages/ui/src/components/Canvas/...` — add the Edit/State toggle (if not already in State mode chrome)
- Create `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx`

**Size:** 2–3 days.

**Dependencies:** A2 (canAccess) recommended so Edit-mode entry is Lead-only-gated; otherwise can proceed.

**Sub-plan needed:** YES. Delivered: [`2026-05-26-canvas-connection-journey-b1-edit-mode-shell.md`](./2026-05-26-canvas-connection-journey-b1-edit-mode-shell.md).

#### PR-CCJ-B2 · Column chips + palette + parsing UX

**Master-of-master sub-plan:** [`2026-05-27-canvas-connection-journey-b2-master-plan.md`](./2026-05-27-canvas-connection-journey-b2-master-plan.md) — decomposes B2 into B2.1 (parser profile API), B2.2 (ColumnChip + Palette), B2.3 (Override popover + Banner + Context menu).

**Scope:** The palette with grouped column chips, parsing detection + status badges, override popover per chip. Largest UI primitive PR.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Palette/` (whole subdirectory per file-structure block above)
- Modify `packages/core/src/parser/` — surface per-column parsing confidence + alternatives for the override popover
- Tests for ColumnChip + Palette + ParsingOverridePopover

**Includes:**

- Auto-detect for decimal format (US `.` vs EU `,`)
- Auto-detect for date formats (ISO + locale + ambiguity disambiguation)
- Numeric-prefix/suffix stripping (`$`, `%`, `(45)`)
- ID column heuristics
- Override popover with sample-parsed values + confidence + alternatives + "Apply to other similar columns →"
- Aggregate parsing ⚠ banner

**Size:** 5–7 days. Probably need to split per `feedback_slice_size_cap` (≤ 6–8 tasks/PR).

**Dependencies:** B1.

**Sub-plan needed:** YES — and likely produces a master-of-master with 2–3 sub-PRs (chip primitive · parsing detection · override popover).

### Phase C — Three canvas zones (3 PRs, medium)

> **Master-of-master sequencer:** [`2026-05-27-canvas-connection-journey-c-master-plan.md`](./2026-05-27-canvas-connection-journey-c-master-plan.md) — Phase C decomposition + sub-PR dependencies.

#### PR-CCJ-C1 · Outcome zone + specs popover

**Scope:** Outcome zone with multi-outcome cards. Per-card specs popover (target / LSL / USL / cpkTarget). Drag-to-drop column → outcome chip with derived specs from characteristic type.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Zones/OutcomeZone.tsx`, `OutcomeCard.tsx`, `SpecsPopover.tsx`
- Tests

**Size:** 3–4 days.

**Dependencies:** A3 (multi-outcome types), B2 (column chips to drop FROM).

**Sub-plan needed:** YES.

**Sub-plan:** [`2026-05-27-canvas-connection-journey-c-1-outcome-zone.md`](./2026-05-27-canvas-connection-journey-c-1-outcome-zone.md)

#### PR-CCJ-C2 · Factors zone + global/step-bound model

**Scope:** Factors zone (global X drops) plus the binding model that lets factors also drop onto step boxes (step-bound). Visual styling for global vs step-bound chips.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Zones/FactorsZone.tsx`, `FactorChip.tsx`
- Wire to A3's step-bound model
- Tests

**Size:** 3–4 days.

**Dependencies:** C1 recommended (consistent zone patterns), B2.

**Sub-plan needed:** YES.

#### PR-CCJ-C3 · Process structure zone + emergent step model

**Scope:** The "How does it fit the process" zone. Drop a categorical column → emergent step model materializes. Step boxes render with internal Y + X sections.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Zones/ProcessStructureZone.tsx`
- Create `packages/ui/src/components/Canvas/EditMode/ProcessModel/StepBox.tsx`, `EmergentProcessModel.tsx`
- Tests

**Size:** 5–7 days. Step-bound interaction is non-trivial.

**Dependencies:** C2 (factor chip styling); A3 (step-bound types).

**Sub-plan needed:** YES.

### Phase D — Workflow modals + derived chips (3 PRs, medium)

#### PR-CCJ-D1 · Step timings workflow + derived flow metrics

**Scope:** `+ Capture step timings` toolbar workflow modal. Two layout modes (by-step / by-column). Pre-fill from paired-column detection. Plus the derivation engine for Lead_time / Total_work_time / Wait_time chips.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Workflows/StepTimingsModal.tsx`
- Create `packages/core/src/derived/leadTime.ts`
- Tests for both

**Size:** 4–5 days.

**Dependencies:** C3 (step model to bind timings to).

**Sub-plan needed:** YES — drafted 2026-05-27 at [`2026-05-27-canvas-connection-journey-d-1-step-timings.md`](./2026-05-27-canvas-connection-journey-d-1-step-timings.md). Structured as single-PR with 3 internal phases (engine in `core/derived/` · `StepTimingsModal` under `Canvas/EditMode/Workflows/` · toolbar + derived chips + step-box wiring + CanvasWorkspace integration). 10 tasks, mid-execution carve point at Phase 1 → Phase 2 boundary if size strain emerges.

#### PR-CCJ-D2 · Calculated column workflow + ratio engine

**Scope:** Calc modal with templates (batch ratios, DPMO, throughput) and visual formula builder + live preview. Plus the calc engine in `@variscout/core/derived/ratioCalculation.ts`.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Workflows/CalculatedColumnModal.tsx`
- Create `packages/core/src/derived/ratioCalculation.ts`
- Detection heuristics for batch shape (`_kg` suffixes, mass balance)
- Tests

**Size:** 5–6 days. Probably split into "calc engine + tests" and "modal UI" sub-PRs.

**Dependencies:** B2 (column chips to source from).

**Sub-plan needed:** YES — drafted 2026-05-27 at [`2026-05-27-canvas-connection-journey-d-2-calc-workflow.md`](./2026-05-27-canvas-connection-journey-d-2-calc-workflow.md). Structured as single-PR with 3 internal phases (engine in `core/derived/formula/` · `CalculatedColumnModal` under `Canvas/EditMode/Workflows/` · kebab handler + `SystemHintBanner` + CanvasWorkspace integration). 11 tasks. **Slot UX: click-to-add** (no drag-and-drop in V1) per modern formula-builder industry pattern (Sigma/Airtable/Notion/Hex/Mode). 5 template families (Batch ratios ×4 + DPMO + Throughput + Differences + Custom); conditional logic deferred to V2. Mid-execution carve point at Phase 1 → Phase 2 boundary if size strain emerges.

#### PR-CCJ-D3 · Time-as-factors workflow + time decomposition engine

**Scope:** Time-as-factors modal (pick column + pick dimensions). Plus the time decomposition derivation engine.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Workflows/TimeAsFactorsModal.tsx`
- Create `packages/core/src/derived/timeDecomposition.ts`
- Tests

**Size:** 3–4 days.

**Dependencies:** B2.

**Sub-plan needed:** YES — drafted 2026-05-27 at [`2026-05-27-canvas-connection-journey-d-3-time-as-factors.md`](./2026-05-27-canvas-connection-journey-d-3-time-as-factors.md). Structured as single-PR with 3 internal phases (engine in `core/derived/` + `time.ts` Quarter extension · `TimeAsFactorsModal` under `Canvas/EditMode/Workflows/` · kebab dispatch + CanvasWorkspace integration). 8 tasks. **Six dimensions** (Year · Quarter · Month · Week · Day-of-week · Hour) with Hour having a granularity sub-picker (60/30/15/5 min). **Re-open UX = pre-fill** (Notion/Figma/Linear standard). **Derived chips = categorical strings** (`Date.day-of-week` style dot+kebab naming per spec); introduces parallel `categoricalValuesByColumn` channel alongside D1/D2's `numericValuesByColumn`. D1+D2 already scaffolded every piece of plumbing (derivationSource union, palette bucket, group label, SystemHintBanner cyan variant, menu item ID).

### Phase E — Promote-to-Project (1 PR, medium)

#### PR-CCJ-E1 · Lightweight Create Project flow + IP-blob persistence (AMENDED 2026-05-28)

**Amendment 2026-05-28:** The original 5-entry-point Charter ceremony has been collapsed to a single Home-entry lightweight flow per two design discoveries during E1 brainstorming: (1) "the IP IS the project" (wedge V1 is one-IP-at-a-time, so the 4 Canvas-state arrays become flat fields on `ImprovementProject`, not nested under `canvasState`), (2) "Findings/Hypotheses auto-scope to the active IP, they aren't inherited at Charter time" (the primitives exist robustly in code per [[findings-hypotheses-implementation-reality]], so the §4.4.1 inheritance ceremony evaporates — the deferred design question becomes consistency-of-presentation across verb tabs, logged as **Task #44** for a separate design session). Sub-plan landed at [`2026-05-28-canvas-connection-journey-e-1-create-project.md`](./2026-05-28-canvas-connection-journey-e-1-create-project.md).

**Scope (amended):** `CreateProjectModal` (Title required + Issue Statement optional one-liner) at Home only. IP type extension with 5 flat root fields (`issueStatement` + `processSteps` + `stepTimings` + `formulaBindings` + `timeDecompositionBindings`). `CanvasWorkspace` refactor to drop the 4 local `useState` arrays in favor of `activeIP`-backed reads + `upsertProject` writes via the existing store action. `NoActiveProjectGuidance` empty state on Process tab. IDB schema bump Azure v13→v14 / PWA v6→v7 with no migration per wedge V1 invariant. No `InheritedContextBlock`, no `entryPointAdapters.ts`, no 5-entry wiring — those are deferred with Task #44.

**Files (amended):**

- Create `packages/ui/src/components/Home/CreateProjectModal.tsx` (+ tests)
- Create `packages/ui/src/components/Canvas/NoActiveProjectGuidance.tsx` (+ tests)
- Create `packages/core/src/improvementProject/factories.ts` `createNewIP({...})` (if absent)
- Modify `packages/core/src/improvementProject/types.ts` — add 5 flat fields
- Modify `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — drop 4 useState; activeIP-backed reads
- Modify `apps/azure/src/components/home/HomeView.tsx` (+ PWA equivalent) — wire "New project" CTA
- Modify `apps/azure/src/db/schema.ts` (v13→v14) + `apps/pwa/src/db/schema.ts` (v6→v7)
- Tests across `__tests__/` + e2e Home→Create→Process→edit→persist

**Size (amended):** 3–4 days. 8 tasks, 3 internal phases. Single PR with carve clause at Phase 2→3 boundary if Task 5 (CanvasWorkspace refactor) surfaces unexpected coupling.

**Dependencies:** A3 (multi-outcome IP types), D1+D2+D3 (the four binding shapes being persisted).

**Sub-plan:** [`2026-05-28-canvas-connection-journey-e-1-create-project.md`](./2026-05-28-canvas-connection-journey-e-1-create-project.md) (landed 2026-05-28 pre-flight).

### Phase F — Exit + smart routing (1 PR, small)

#### PR-CCJ-F1 · → Explore with Y soft-gate + smart destination

**Scope:** The `→ Explore` button enables once Y is dropped. Destination's content smart-routes (Y only → I-Chart; Y + factor → I-Chart + Boxplot; Y + process structure → step-aware view).

**Files:**

- Modify EditModeShell.tsx (button + state)
- Modify Explore tab landing logic to honor incoming context from Edit mode
- Update routing/store glue
- Tests

**Size:** 2–3 days.

**Dependencies:** all earlier phases (uses configured Hub state).

**Sub-plan needed:** YES.

**Amended 2026-05-28 — F1 ships 4 of 6 §4.5 routing rows; multi-outcome Y-tabs + per-step view switcher deferred to H1. Task 5b (D3-derived categorical Boxplot factor wiring) carved as Task #46. See sub-plan `docs/superpowers/plans/2026-05-28-canvas-connection-journey-f-1-explore-exit.md`.**

### Phase G — Inflection-point binning in Probability Plot (1 PR, medium)

#### PR-CCJ-G1 · Probability plot inflection binning

**Scope:** Inflection-point detection on numeric column in probability plot. Cyan guide lines for auto-detected cuts + purple for manual. Side panel with proposed bins + Create binned factor →. User can add/remove/drag cuts.

**Files:**

- Create `packages/ui/src/components/Explore/Probability/InflectionBinning/` (whole subdirectory)
- Modify probability plot rendering to accept inflection overlay
- Tests

**Includes:**

- Cut detection algorithm (KDE valley OR change-point on sorted data — recommend KDE)
- Manual add/remove/drag interaction
- Bin preview + name auto-suggest
- Persist new bin column as a derived chip

**Size:** 5–7 days. Includes the statistical algorithm work + UI overlay + integration into the bin-as-derived-chip flow.

**Dependencies:** B2 (derived chip framework).

**Sub-plan needed:** YES.

**Amended 2026-05-28 — algorithm = gap-ratio detection + Anderson-Darling-on-whole pre-check + piecewise linear regression confidence reporting (NOT the original spec-time PWL+AD-segments which empirically false-positived on skewed unimodal lognormal data); Findings flow skipped (bin column IS the persistent artifact); direct-manipulation State B with no commit step; absorbed Task #46 (Boxplot+Probability factor pickers categoricalValuesByColumn consumer + filter-alignment helper); manual cut V2 deferred. See sub-plan `docs/superpowers/plans/2026-05-28-canvas-connection-journey-g-1-inflection-binning.md`.**

### Phase H — Polish + empty states (2 PRs, small + medium)

#### PR-CCJ-H1 · Empty states + system hints + final polish

**Scope:** Empty palette ("paste data" affordance), parsing-failed banner, no-outcome hint near `→ Explore`, system hints (batch detected, time columns detected), aggregate parsing ⚠ banner, ghost-suggested chip styling for high-confidence column-role suggestions.

**Files:**

- Modify various components from B2 / C1 / C2 / C3 to add empty-state branches
- Create `packages/ui/src/components/Canvas/EditMode/Palette/SystemHint.tsx`
- Modify `packages/ui/src/components/Canvas/EditMode/Palette/ParsingBanner.tsx`
- Tests for empty / error / partial states

**Size:** 3–4 days.

**Dependencies:** all earlier phases.

**Sub-plan needed:** YES.

**Amended 2026-05-28** — F1's §4.5 rows 5–6 deferral (multi-outcome Y-tabs + per-step view switcher) carved to new H2 PR — those are substantial Explore-tab feature work needing their own brainstorm; row 6 blocks on Task #45 (State/Edit mode rethink). H1 stays as pure polish + G1 carry-overs (system-hint DETECTION wiring, ghost-suggested DETECTION wiring, palette empty-state CTA, ExploreExitButton cyan info-pill, InflectionSidePanel N<30 guard, InflectionOverlay commit fade transition, InflectionSidePanel aria-describedby, plus a new `<ConfirmDialog>` primitive in `@variscout/ui` that retires two `window.confirm` callers — InflectionSidePanel + CoScoutPanelBase). 8 tasks across 3 internal phases in single PR. All-Sonnet implementer; Opus final branch reviewer. See sub-plan `docs/superpowers/plans/2026-05-28-canvas-connection-journey-h-1-polish.md`. **Delivered 2026-05-28 — see sub-plan link above.**

#### PR-CCJ-H2 · Multi-outcome Y-tabs in Explore + per-step view switcher (Spec §4.5 rows 5–6)

**Scope:** The two routing rows from §4.5 that F1 deferred and H1 carved out. Row 5: multi-outcome Y-selector strip in the Explore tab so analysts can switch between Y's of a multi-outcome IP. Row 6: per-step view switcher in the Explore tab that surfaces step-aware views (Boxplot-by-step vs I-Chart-by-step) when the active IP has a configured process structure.

**Files (anticipated, subject to brainstorm):**

- Create new outcome-selector strip component in Explore tab chrome
- Create new step-aware view switcher component
- Extend `panelsStore.pendingExploreIntent` shape to carry multi-outcome + step context
- Modify `EditorDashboardView.tsx` (Azure) + PWA equivalent for the new mount-time intent handling
- Tests + e2e for both rows

**Size:** ~5–7 days (estimate; depends on brainstorm outcomes).

**Dependencies:**

- **HARD:** Task #45 (State/Edit mode rethink) — per-step view semantics live in that design session
- **SOFT:** brainstorm session needed before plan-writing: tabs vs dropdown for Y-selector? URL/state coupling? Coupling with Edit-mode side panel for cross-tab consistency?

**Sub-plan needed:** YES — invoke `superpowers:brainstorming` after Task #45 is decided, then `writing-plans`.

**Tracking:** Task #47.

---

## Sequencing + dependencies (Gantt-shaped)

```
Phase A — Foundation (parallel-safe)
├── A1 Wedge amendments       (1d, doc-only, lands first)
├── A2 canAccess collapse     (1-2d, independent)
└── A3 IP step-bound types    (2d, independent)

Phase B — Shell + Palette
├── B1 EditModeShell           [depends: A2 recommended]
└── B2 Column chips + parsing  [depends: B1]

Phase C — Zones (sequential)
├── C1 Outcome zone            [depends: A3, B2]
├── C2 Factors zone            [depends: C1, B2]
└── C3 Process zone            [depends: C2, A3]

Phase D — Workflows (some parallel)
├── D1 Step timings + Lead_time  [depends: C3]
├── D2 Calc + ratio engine       [depends: B2; can run parallel to D1, D3]
└── D3 Time-as-factors           [depends: B2; can run parallel to D1, D2]

Phase E — Promote-to-Project
└── E1 Charter modal + entries [depends: A3, C3]

Phase F — Exit
└── F1 → Explore smart route   [depends: all of A-E]

Phase G — Inflection binning
└── G1 Prob plot inflection    [depends: B2; can run parallel to any phase ≥ B]

Phase H — Polish + carved Explore features
├── H1 Empty states + hints + G1 polish + ConfirmDialog [depends: all earlier]
└── H2 §4.5 rows 5–6 (multi-outcome Y-tabs + per-step view) [depends: H1, Task #45]
```

**Critical path:** A2 → B1 → B2 → C1 → C2 → C3 → E1 → F1 → H1. About 30–40 working days end-to-end if executed sequentially. With parallelism (Phase D + G + A1/A3 in parallel), probably 22–28 working days. H2 is post-completion expansion gated on Task #45.

---

## Implementation approach

### Model-selection per task (per CLAUDE.md)

- **Haiku** — mechanical work: A1 (doc edits), B2 sub-tasks like "wire parsing override popover with pre-existing detection results"
- **Sonnet** — most well-specified TDD work: most of Phases B / C / D / E sub-tasks
- **Opus** — multi-file integration: A2 + A3 (compile cascade), C3 (step-bound interaction model), E1 (5 entry-point adapters), final-branch review on every PR

### Subagent-driven execution

Per `feedback_subagent_driven_default` (this repo's default workflow):

- Fresh implementer subagent per task (model selected per the matrix above)
- Per-task spec reviewer + quality reviewer
- Final code reviewer (Opus) at end of each PR branch
- One worktree per parallel agent per `feedback_one_worktree_per_agent`

### Cross-cutting concerns (resolve before relevant phases)

Per Spec 2 §8 amendment list + master plan cross-cutting:

1. **Vocabulary positioning** (Explore / Analyze / Control rename) — should resolve before Phase F (Exit → "Explore" or "Analyze"?) and before any L2 journey-doc work. Run as a separate session.
2. **Lead JTBD restructure** — affects persona docs; could be a small PR landed parallel to A1.
3. **Project = IP terminology** — affects code (`projectsByHub` rename) + docs. May want a dedicated cleanup PR landing between A3 and B1.

### Customer validation gate (per wedge spec §8.3)

Still owed before this engineering effort scales up. Recommendation: surface this design with ≥ 1 customer before Phase B starts. Phase A can ship without; Phase B's investment is large enough to justify pausing for the validation.

---

## Acceptance criteria for "Spec 2 implemented"

When all 12 PRs land:

- [ ] User can paste data into a Hub and see chips populated in a grouped palette
- [ ] Parsing auto-detects type for >95% of typical factory data; ⚠ amber rare
- [ ] User can drag column chips into outcome zone (multi-outcome supported with specs)
- [ ] User can drag column chips onto step boxes (step-bound outcomes / factors)
- [ ] User can configure step timings via toolbar workflow; Lead_time appears as derived chip
- [ ] User can calculate column from formula (batch ratios, DPMO templates)
- [ ] User can decompose time columns into factor dimensions
- [ ] User can bin numeric column via probability plot inflection detection
- [ ] User can Promote-to-Project from 5 entry points; Charter modal pre-fills correctly per entry
- [ ] User can click → Explore once Y is set; destination smart-routes
- [ ] Mode A reopen defaults to State mode; Edit mode one click away
- [ ] Sponsor sees Read across all tabs; no in-product approval gates
- [ ] All 6 wedge-spec amendments land
- [ ] `canAccess.ts` collapsed to 2 tiers; all consumers updated
- [ ] `ImprovementProjectGoal.outcomeGoal` is a list supporting step-bound outcomes
- [ ] E2E tests cover the canvas-onboarding journey in both Azure and PWA apps
- [ ] No regressions on existing Framing Layer slice 1–3 surfaces (Mode B Stage 1–3 still functional for legacy paths)

---

## Self-review

- **Spec coverage:** every Spec 2 section (§3 Primitives, §4 Flows, §5 Mode A + empty states, §6 L1/L2/L3 integration, §7 ACL, §8 amendments) maps to ≥ 1 PR.
- **No placeholders:** all PRs have explicit scope, file paths, size estimates, and dependencies. Bite-sized 2-5-minute task steps will come from per-PR `writing-plans` invocations.
- **Type consistency:** field names match Spec 2 (`outcomeGoal`, `stepId`, `Lead_time`, `issueStatement`); ACL action names (`edit`, `edit-contributions`) match Spec 2 §7.4.
- **Spec amendments cross-referenced:** A1 explicitly enumerates the 6 amendments.
- **Decomposition rule honored:** larger PRs (B2, C3, D2, E1, G1) flagged as "sub-plan needed" so per-PR `writing-plans` can further decompose if they exceed 6–8 tasks.

---

## Open items for execution-time decisions

- **Phase A1 timing** — can land immediately (doc-only, direct-to-main per CLAUDE.md). Other phases require branch + PR + review.
- **Phase G placement** — independent of canvas Edit-mode work; could run as a side-track in parallel with Phase B–F. Recommendation: run G as a separate concurrent branch.
- **Mid-execution discoveries** — per `feedback_subagent_grounding_catches_drift`, expect ~2–4 amendments to this master plan during execution (typical for plans of this scale). Track them in `docs/decision-log.md` as they happen.
