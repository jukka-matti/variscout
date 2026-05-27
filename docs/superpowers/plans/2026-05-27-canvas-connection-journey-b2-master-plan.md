---
tier: ephemeral
purpose: build
title: PR-CCJ-B2 — Column chips + palette + parsing UX — Master Sequencer
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-B2 — Column chips + palette + parsing UX — Master Sequencer

> **For agentic workers:** This is the PR-level master sequencer for PR-CCJ-B2 (master-of-master per `feedback_master_plan_for_multi_subsystem_specs`). It does NOT contain bite-sized 2–5-minute task steps; those come from per-sub-PR `superpowers:writing-plans` invocations when each sub-PR is ready to execute. Use `superpowers:subagent-driven-development` to execute individual sub-PRs once their sub-plans are drafted.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md) §3.1, §3.1.1, §3.1.2, §4.1

**Parent master plan:** [`2026-05-26-canvas-connection-journey-master-plan.md`](./2026-05-26-canvas-connection-journey-master-plan.md) §"Phase B — Canvas shell + palette" → "PR-CCJ-B2 · Column chips + palette + parsing UX"

**Depends on:** PR-CCJ-A2 (canAccess collapse), PR-CCJ-A3 (multi-outcome types), PR-CCJ-B1 (EditModeShell with palette zone placeholder). All shipped.

---

## Why master-of-master

The master plan flagged B2 explicitly: _"Sub-plan needed: YES — and likely produces a master-of-master with 2–3 sub-PRs (chip primitive · parsing detection · override popover)."_ Three reasons:

- B2's three subsystems have clean dependency seams: parser surface produces a contract; chip consumes that contract; popover/banner consume both.
- Each subsystem fits within `feedback_slice_size_cap` (~6–8 tasks/PR for feature work) only when split.
- Per `feedback_master_plan_for_multi_subsystem_specs`: plan-as-you-execute beats plan-all-then-discover-drift. Writing B2.2 and B2.3 in detail before B2.1 lands risks pre-committing to API shapes that B2.1 may evolve.

---

## Sub-PR sequence

```
B2.1 Parser profile API (core)       ─→ B2.2 ColumnChip + Palette (UI)       ─→ B2.3 Override popover + Banner + Context menu (UI)
   pure data, unit-testable              consumes B2.1, renders palette          consumes B2.1 + B2.2, finishes the surface
```

Strict ordering: B2.2 needs B2.1's `ColumnParsingProfile[]` contract. B2.3 needs B2.2's `ColumnChip` event surface (`onOverrideOpen` / `onContextMenuOpen` callbacks) and B2.1's alternatives/sample-parsed-values to populate the popover.

### PR-CCJ-B2.1 · Parser profile API (core, pure)

**Scope:** Pure TypeScript profile API in `@variscout/core/parser`. Extends the parser surface to expose per-column parsing confidence, detected interpretation (EU/US decimal, ISO/locale dates, currency/percent strip, ID heuristic), alternatives with parse-success counts, sample transformed values, and status determination (`'ok' | 'warning' | 'error'`).

**Files:**

- Create `packages/core/src/parser/parsingProfile.ts` — `profileColumns()` + helpers
- Modify `packages/core/src/parser/types.ts` — add `ColumnParsingProfile`, `ParsingStatus`, `ParsingInterpretation`, `ParsingAlternative`
- Modify `packages/core/src/parser/index.ts` — barrel export
- Create `packages/core/src/parser/__tests__/parsingProfile.test.ts`

**Includes:**

- Numeric format detection (EU `,` decimal vs US `.` decimal + `,` thousands)
- Date format detection (ISO first; DD/MM vs MM/DD disambiguation by positional values > 12; ambiguous-default + ⚠ status)
- Numeric prefix/suffix stripping (`$`, `€`, `%`, parens-for-negative)
- ID column heuristic (leading zeros + fixed-width + sequential)
- Status determination (parse rate ≥ 90% → ok; mixed formats OR parse rate < 70% → warning; all-null → error)
- Alternatives ranked by parse-success count
- 3 sample transformed values per profile

**Size:** ~7 tasks. Pure TDD, no UI.

**Sub-plan:** [`2026-05-27-canvas-connection-journey-b2-1-parser-surface.md`](./2026-05-27-canvas-connection-journey-b2-1-parser-surface.md) — produced alongside this sequencer.

### PR-CCJ-B2.2 · ColumnChip + Palette primitive (UI)

**Scope:** ColumnChip component + ColumnGroup + Palette container. Wires into EditModeShell's palette zone (replacing the placeholder from B1). Consumes `ColumnParsingProfile[]` from B2.1 and renders grouped chips with parsing badges, interpretation lines, sparkline (for numerics), and drag handle. Chip visual states: default / dropped (faded) / ghost-suggested (dashed cyan border with hint pill). Drop targets and ghost-suggestion logic are stubbed (real zones come in Phase C); state is driven via props for now to keep the chip testable in isolation.

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx` — Palette container
- Create `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx` — single chip
- Create `packages/ui/src/components/Canvas/EditMode/Palette/ColumnGroup.tsx` — grouped section
- Modify `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` — wire Palette into the palette zone
- Create `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/ColumnChip.test.tsx`
- Create `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/Palette.test.tsx`

**Includes:**

- Grouped rendering (`Numeric · 5`, `Categorical · 4`, `Time / ID · 6`)
- Parsing badge rendering (`✓` / `⚠` / `✗`) using semantic tokens
- Interpretation text line (`numeric · EU decimal`, `DD/MM/YYYY`, `categorical · 4 levels`, `id · 432 unique`)
- Mini sparkline for numeric chips (existing `Sparkline` component if present, else inline SVG via visx primitives in `@variscout/charts`)
- Drag handle `⋮⋮` (uses HTML5 DnD API; `onDragStart` emits column name; no actual drop yet)
- `▾` button (calls `onOverrideOpen(columnName)` prop; stubbed in B2.2, wired in B2.3)
- `⋮` button (calls `onContextMenuOpen(columnName)` prop; stubbed in B2.2, wired in B2.3)
- Chip visual states driven by props: `dropped: boolean`, `ghostSuggested?: 'factor' | 'outcome' | 'process'`

**Size:** ~8 tasks.

**Sub-plan:** [`2026-05-27-canvas-connection-journey-b2-2-column-chip-palette.md`](./2026-05-27-canvas-connection-journey-b2-2-column-chip-palette.md) — written after B2.1 merged so the consumed contract is locked.

### PR-CCJ-B2.3 · Override popover + Banner + Context menu (UI)

**Scope:** Finishes the palette surface. Wires the `▾` and `⋮` triggers from B2.2 to actual UI: `ParsingOverridePopover` (alternatives + samples + "Apply to similar →"), `ParsingBanner` (aggregate ⚠ when ≥ 3 chips warn), `ColumnChipContextMenu` (per-type items; bin / time-decompose / calc actions are stubbed until D-phase).

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/Palette/ParsingOverridePopover.tsx`
- Create `packages/ui/src/components/Canvas/EditMode/Palette/ParsingBanner.tsx`
- Create `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChipContextMenu.tsx`
- Modify `Palette/ColumnChip.tsx` — wire `▾` + `⋮` to the new components
- Modify `Palette/index.tsx` — render banner when threshold met
- Create `__tests__/ParsingOverridePopover.test.tsx`
- Create `__tests__/ParsingBanner.test.tsx`
- Create `__tests__/ColumnChipContextMenu.test.tsx`

**Includes:**

- Popover shows 3 transformed samples (`182,5 → 182.5`) + confidence percentage + alternatives ranked by parse count
- "Apply to similar columns →" affordance — match by column-name shape (suffix/prefix similarity) using a deterministic helper
- Aggregate banner trigger ≥ 3 ⚠ chips; clicking opens a focused per-chip review (canvas of pop-overs stacked vertically — minimal V1)
- Context menu items per spec §3.1.2 (numeric / time / categorical / ID variants); actions for bin / time-as-factors / calc / view-in-Explore emit named events but route to no-op handlers until D + F phases
- Hub-memoization of user overrides is **out of scope for B2.3** — emitted as a typed callback `onOverrideAccept(profile, choice)` only. Persistence wired in C-phase.

**Size:** ~7 tasks.

**Sub-plan:** TBD — written after B2.2 merges.

---

## Plan + parallel-write discipline

Per `feedback_one_worktree_per_agent` + `feedback_subagent_driven_default`:

- Each sub-PR gets its own branch + worktree (`.worktrees/<branch>/`); main session stays at repo root.
- Per-PR sub-plan executes via `superpowers:subagent-driven-development` (fresh implementer per task + spec reviewer + code quality reviewer + final Opus branch reviewer).
- Right-size models per task: Haiku for mechanical (single-file, full spec, no decisions); Sonnet for standard well-specified TDD; Opus for multi-file integration + final branch review (`feedback_subagent_driven_default`).
- Use `gh pr merge --merge --delete-branch` per `feedback_preserve_commit_history` (NOT `--squash`).

---

## Out of scope for B2 (entire master-of-master)

- **Drop targets** — Outcome / Factors / Process zones are Phase C primitives. B2 emits drag-start events but no zone accepts them; the chip's `dropped` state is driven via prop only.
- **Ghost-suggested rendering with real heuristics** — B2 renders the visual state from a prop; the heuristic computation that decides which chips look ghost-suggested ships in Phase F (`→ Explore exit + smart routing`) or as part of a polish pass.
- **Derived chips** (`✨` marker, DERIVED FROM section) — Phase D produces derived chips when timings/calc/time-decomposition land.
- **Outcome chips with specs popover** (`⚙`) — Phase C, PR-CCJ-C1.
- **Step boxes + step-bound bindings** — Phase C, PR-CCJ-C3.
- **Persistence of user parsing overrides** (hub-memoized choices per spec §3.1.1 _"future pastes with this column name bias higher"_) — wired in C or later when the Hub blob shape gets the field.
- **Inflection binning** (Probability Plot lens) — Phase G, PR-CCJ-G1; the chip context menu's "Bin into categorical…" emits a stub event.

---

## Verification (overall B2 completion)

After B2.3 merges, the canvas Edit mode renders a populated palette with:

- Grouped column chips (counts visible per group)
- Each chip shows badge + interpretation + sparkline (numeric) + `⋮⋮` drag handle + `▾` + `⋮`
- `▾` opens override popover with 3 samples + confidence + alternatives
- `⋮` opens context menu (items stubbed for bin/calc/decompose)
- Aggregate banner appears when ≥ 3 ⚠ chips
- Dragging a chip fires `onDragStart` with the column name (no drop yet — Phase C)

No regressions on EditModeShell.test.tsx; no UI changes to State mode.

---

## Related

- [[wedge-v1]] (canonical product anatomy)
- [[canvas-connection-journey]] (Spec 2 memory)
- [[feedback_master_plan_for_multi_subsystem_specs]] (why this is master-of-master)
- [[feedback_slice_size_cap]] (≤ 6–8 tasks/PR)
- [[feedback_subagent_driven_default]] (execution shape)
- [[feedback_one_worktree_per_agent]] (parallel discipline)
- [[feedback_preserve_commit_history]] (merge strategy)
