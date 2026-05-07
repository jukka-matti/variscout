---
title: Canvas Migration PR8 — Vision Alignment Master Plan (sequencing 8a / 8b / 8d / 8e + 8f deferral)
audience: [engineer, product]
category: implementation-plan-master
status: active
last-reviewed: 2026-05-07
related:
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
  - docs/superpowers/plans/2026-05-06-canvas-pr4c-pr6-followup.md
  - docs/decision-log.md
  - docs/investigations.md
---

# Canvas Migration PR8 — Vision Alignment Master Plan

> **Master coordination plan, not an implementation plan.** Sequences the four PR8 sub-PRs (8a, 8b, 8d, 8e), identifies which need their own brainstorm vs. straight plan, captures F4 dependencies, and defers 8f to its own design spec. Each sub-PR gets a fresh-session brainstorm and/or plan when it's picked up.
>
> **For agentic workers:** This file does NOT dispatch implementation. Read it for sequencing context, then open the per-sub-PR brainstorm or plan for the specific phase you're working on.

## 1. Goal

Close the six unmet vision-spec commitments surfaced by the canvas PR4c–PR6 retrospective (2026-05-06) — five via PR8 sub-PRs (8a/8b/8d/8e), one via a separate canvas-viewport architecture design spec (8f). Each sub-PR ships independently off `main` per `feedback_slice_size_cap`; the master plan exists so the four pieces compose coherently rather than drift.

Honors `feedback_retrospective_review_pattern` — these are unmet commitments, not new features. Each sub-PR closes a specific `docs/investigations.md` entry pinned 2026-05-06.

## 2. Scope

**In scope** (this master plan coordinates):

- **8a** Mode-aware response-path CTAs (vision §5.3 + §2.4)
- **8b** Drift indicator + time-series mini-chart (vision §5.2)
- **8d** Hypothesis-arrow drawing affordance (vision §3.4)
- **8e** Wall mirror in canvas overlay (vision §5.6)

**Out of scope** (covered separately):

- **8f** Levels-as-pan/zoom (vision §5.4) — see D2 below; gets its own design spec, NOT a PR8 sub-PR.
- **PR9 cleanup** (legacy `LayeredProcessView` / `ProcessMapBase` / `FrameView` deletion) — separate phase per canvas migration spec §6.
- **F4 three-layer state codification** — separate slice currently in flight; this plan honors F4's outputs but doesn't reshape them.

## 3. Locked decisions

### D1. F4 lands first

PR8 sub-PRs 8d and 8e introduce new state fields (drag-gesture state, mode-2 toolbar toggle, embedded-Wall toggle). These need to land in the right Document/Annotation/View layer per F4's codification. **F4 ships before any PR8 sub-PR touches new state.**

Why: without F4's clarity, sub-PR implementers guess at layer assignments; misclassifications create silent drift the boundary test (F4 D4) was designed to prevent. Cheap to wait for F4 — F4 is small (mostly mechanical search-and-replace). PR8 sub-PRs benefit from F4's vocabulary (specifically the `STORE_LAYER` const + portability test).

**8a + 8b are layer-neutral** (8a is UI logic; 8b adds derived data to a hook output, not a store) — they CAN start before F4 lands without risk. But sequencing them after F4 keeps the order clean.

### D2. 8f gets its own design spec, NOT a sub-PR

Vision §5.4 levels-as-pan/zoom is **canvas viewport architecture**: a `react-flow`-style transform OR hand-rolled SVG/CSS — which to pick is an architectural decision that warrants its own ADR, not a sub-PR brainstorm. The retrospective followup plan flagged it: _"unknown; large; needs design brainstorm"_; the canvas migration spec said _"Likely deferred to V2 with explicit ADR."_

**Decision:** 8f is removed from PR8. PR8 covers 8a/8b/8d/8e (4 sub-PRs). 8f becomes a separate design-spec workstream:

- New file: `docs/superpowers/specs/2026-05-XX-canvas-viewport-architecture-design.md`
- New ADR (likely ADR-080) locking the viewport architecture choice
- Implementation plan + sub-PR comes after the spec lands

The PR8 master plan logs this as out-of-scope; the existing `docs/investigations.md` "Canvas levels-as-pan/zoom architecture deferred" entry stays open as the carry-forward home until the new spec promotes it.

### D3. 8a + 8b can land in parallel with each other; both must land before 8d + 8e

8a (mode-aware CTAs) and 8b (drift indicator + mini-chart) are scope-independent and operate on different surfaces:

- 8a touches `CanvasStepOverlay` + threading a `mode` signal through `CanvasWorkspace` → `Canvas`
- 8b touches `useCanvasStepCards.ts` (data model) + `CanvasStepMiniChart.tsx` (UI render)

Zero shared files. They can land in either order (or in parallel branches off `main`) without coordination. Both should land before 8d/8e because:

- 8a's `mode` signal threading establishes the mode-vs-tier separation that 8d's mode-2 toolbar entry depends on
- 8b's drift surface is read in step overlays; 8d's hypothesis-arrow drawing reads from those overlays — landing 8b first means 8d sees the canonical card model

### D4. 8d + 8e are sequential, not parallel

Both touch `useCanvasInvestigationOverlays` (the hook that projects investigation graph entities into canvas overlays) and the canvas overlay rendering surface. Parallelizing them risks file-level merge conflicts + overlapping decisions about the overlay state model.

**Sequence: 8d brainstorm → 8d plan → 8d implementation → 8e brainstorm → 8e plan → 8e implementation.** Each brainstorm extends Spec 4 (canvas overlays + Wall sync) — the brainstorms are amendments to a shared spec, but the implementations are separate.

### D5. Each sub-PR owns its own investigations.md entry close-out

PR8 sub-PRs each have a corresponding `docs/investigations.md` entry pinned 2026-05-06. The acceptance test for each sub-PR includes marking its entry `[RESOLVED YYYY-MM-DD]`:

| Sub-PR        | Closes investigations.md entry                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8a            | "Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4)"                                                                            |
| 8b            | "Canvas mini-chart: time-series for high-cardinality columns missing (vision §5.2)" + "Canvas drift indicator missing (vision §5.2)" — bundled                          |
| 8d            | "Canvas hypothesis-arrow drawing affordance absent (vision §3.4)"                                                                                                       |
| 8e            | "Canvas Wall overlay is badge projection, not 'same data, two views' mirror (vision §5.6)"                                                                              |
| (8f deferred) | "Canvas levels-as-pan/zoom architecture deferred without note (vision §5.4)" — stays open, gets a forward-pointer to the new viewport architecture spec when that lands |

### D6. Subagent-driven flow per sub-PR

Per `feedback_subagent_driven_default`. Each sub-PR's plan dispatches via `superpowers:subagent-driven-development` — Sonnet workhorse for implementer + per-task spec/quality reviewers; **Opus reserved for final-branch review** of each sub-PR before merge.

8a + 8b are small enough (5–6 tasks each) that they can squash-merge directly. 8d + 8e are larger (~8 + ~6 tasks); their plans include a final Opus review per F-series precedent.

## 4. Sub-PR scope summary

(Full scope details belong in the per-sub-PR plans, not here. This is a one-paragraph summary per sub-PR for orientation.)

### 8a — Mode-aware response-path CTAs (~5 tasks) — plan at [`2026-05-07-canvas-pr8-8a-mode-aware-ctas.md`](2026-05-07-canvas-pr8-8a-mode-aware-ctas.md)

**Status (2026-05-07):** plan written + amended. Read the AMENDMENT block at the top of the linked plan before implementation — it supersedes the original tier model + charter gating per the DMAIC charter correction (Charter is Define-phase first, no workflow gate) + tier reframe (all 5 paths free-tier-active).

Replace hardcoded `disabled` on Charter / Sustainment / Handoff CTAs in `CanvasStepOverlay` (lines 276–294) with mode-aware tier-gated affordances. Thread `mode: 'cadence' | 'first-time' | 'demo'` through `CanvasWorkspace` → `Canvas` → `CanvasStepOverlay`; compute hub-maturity from `assignmentsComplete && stepsAuthored && hasPriorSnapshot`. Tier-gate Charter/Sustainment/Handoff via `isPaidTier()` per ADR-078 D5; render with a tier-upgrade hint instead of `disabled` when free tier. Separate "mode" (drill-down content) from "tier" (paid feature gating) — they're conflated in current code.

**Type:** UI logic + tier-gating; no new persistent state; layer-neutral (no F4 dependency).

**Brainstorm:** none — straight to plan. Retroactive Spec 3 covers the design intent.

### 8b — Drift indicator + time-series mini-chart (~6 tasks)

Two bundled sub-items per the canvas migration spec table (8b absorbs 8c per the "_(reserved — bundled with 8b)_" entry):

1. **Drift indicator:** add `drift?: { direction: 'up' | 'down' | 'flat'; magnitude: number; threshold: number }` to `CanvasStepCardModel`. Read prior `EvidenceSnapshot` per-step capability (slice 3 shipped per-row provenance). UI: small ↑/↓/→ arrow + magnitude % near the capability badge; arrow shape avoids color-only signaling. Threshold: ±5% default; user-configurable later.
2. **Time-series mini-chart:** add a third branch to `CanvasStepMiniChart.tsx` (currently histogram + categorical-distribution only). Cardinality threshold: `column.type === 'numeric' && distinct > 30`. Use parser-detected `timeColumn` when present; fall back to row-index ordering. Algorithm: sparkline / mini-line; LTTB downsampling for >100 points (existing `@variscout/charts` convention). Bonus: replace current "first-12-raw-values" pseudo-histogram with proper Sturges/Scott binning.

**Type:** Data model extension on a hook output (`CanvasStepCardModel` is computed in `useCanvasStepCards.ts`, not stored in a Zustand store) + UI render. No new persistent state; layer-neutral (no F4 dependency).

**Brainstorm:** none — straight to plan. Retroactive Spec 3 covers the design intent.

### 8d — Hypothesis-arrow drawing affordance (~8 tasks)

Vision §3.4: _"users may optionally draw a hypothesis arrow from one column (or one step) to another."_ Mode-2 (structural authoring) toolbar gains a "Draw hypothesis" tool. Click source step/column → drag → release on target → opens an inline form ("I suspect [X] affects [Y]" + free-text `because...`). Promoted (evidence-crossed-threshold) → node markers ON the affected step. Draft → faint dashed arrows (current `useCanvasInvestigationOverlays` already projects `CausalLink`s as faint arrows; that read-side stays).

**Type:** UI gesture + state. New state surfaces:

- **Drag gesture state** — View layer (per F4 D2 portability test: doesn't survive reload, recipient doesn't need it)
- **Mode-2 toolbar "active tool" toggle** — likely Annotation per-user (per F4: "tool selection persists across sessions for the same user, but doesn't travel in `.vrs`")
- **Created `CausalLink` entities** — Document (already in `investigationStore`)

F4 dependency: real. The drag-gesture View state goes in `useViewStore` (F4 D2); the toolbar toggle goes in `usePreferencesStore`. Both stores are F4 outputs.

**Brainstorm:** YES — Spec 4 extension. Open questions:

- Drag gesture mechanics: native HTML5 drag-and-drop vs custom pointer event handlers vs `@dnd-kit`?
- Source/target granularity: column-OR-step (vision says "one column (or one step)") — single union, or two distinct gesture modes?
- Promoted-vs-draft visual: how do "node markers" differ from current investigation badges in step cards? (Codex shipped badges; spec says markers — design call needed.)
- Inline form placement: floating popover vs side panel vs Stage 5 modal reuse?
- Undo: does drawing an arrow then changing your mind go through the canvasStore undo stack, or commit-on-release?

### 8e — Wall mirror in canvas overlay (~2–6 tasks depending on choice)

Vision §5.6 + §5.4: Wall is dual-home — destination in Investigation tab AND a canvas overlay; "with overlays on, the canvas IS the Wall view." Codex shipped a lighter projection (per-step badge counts + linked item lists in step overlays) — defensible V1 but unmet spec commitment.

**Type:** Architectural choice. Three forks:

1. **Embed Wall viewport in canvas** (~6 tasks) — render `WallCanvas` inline as the canvas overlay layer; same data, lighter chrome. Honors §5.6 verbatim.
2. **Hybrid** (~4–5 tasks) — keep badge projection as cadence-scan; add an "expand to wall view" button that lifts the wall into a modal/right-rail. Mid-fidelity.
3. **Status quo + spec amendment** (~2 tasks, mostly docs) — accept badge projection as V1 dual-home; amend §5.6 to say "destination = full graph; overlay = projected badges." Lowest cost; most conservative.

F4 dependency: depends on choice. (1) and (2) introduce no new persistent state. (2) might add an "expand-to-wall" toggle — Annotation per-user. (3) is pure docs.

**Brainstorm:** YES — Spec 4 extension. The pick between (1)/(2)/(3) is the brainstorm's job. Need to walk: cadence-mode user (mature hub) vs first-time user (sparse hub) — does an embedded Wall help or overwhelm? Performance: does rendering Wall + canvas at the same zoom level have layout cost? If embedded, can the overlay scroll independently?

**Brainstorm decision triggers the scope.** Don't write the 8e plan until the brainstorm picks.

### 8f — DEFERRED to canvas viewport architecture spec (NOT in PR8)

Per D2. Closed here; opens its own workstream when ready. PR8 master plan acceptance does NOT require 8f.

## 5. Sequencing

```
F4 (in flight, by separate session/agent)
  │
  ├─ 8a Plan ─→ 8a Impl ─→ 8a Merge  ┐
  │                                  ├─→ 8d Brainstorm → 8d Plan → 8d Impl → 8d Merge
  └─ 8b Plan ─→ 8b Impl ─→ 8b Merge  ┘                                                ↓
                                                                          8e Brainstorm → 8e Plan → 8e Impl → 8e Merge
                                                                                                                   ↓
                                                                                              PR8 master close-out
                                                                                                                   ↓
                                                                                                       PR9 cleanup (separate phase)

(parallel, separate workstream)
8f Canvas Viewport Architecture spec → ADR-080 → plan → impl → merge
```

**Dependencies:**

- F4 must merge before 8a + 8b begin (per D1)
- 8a + 8b must merge before 8d brainstorm (per D3)
- 8d must merge before 8e brainstorm (per D4)
- 8f runs entirely in parallel; no ordering constraint with 8a–8e

**Estimated total span:** depends on cadence. F4 + 8a + 8b are likely 1 fresh session each; 8d brainstorm + plan + impl is likely 2–3 sessions; 8e similar. Master plan close-out is ~10 minutes. Realistic: 7–10 fresh sessions to land all of PR8.

## 6. Per-sub-PR session opener templates

Each fresh session opens with a focused prompt. Suggested shapes:

**8a (after F4 merges):**

> Start canvas migration sub-PR 8a — mode-aware response-path CTAs. Read PR8 master plan (`docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md`) §4 for scope; vision §5.3 + §2.4 for design intent; investigations.md "Canvas response-path CTAs hardcoded as disabled" entry for failure mode. Write plan straight (no brainstorm needed; covered by retroactive Spec 3); dispatch via `superpowers:subagent-driven-development` Sonnet workhorse.

**8b (parallel with 8a or after):**

> Start canvas migration sub-PR 8b — drift indicator + time-series mini-chart. Read PR8 master plan §4 for scope; vision §5.2; both investigations.md "Canvas mini-chart" + "Canvas drift indicator" entries. Bundle into one plan (per master D5 — 8b absorbs 8c). Straight plan; no brainstorm. Sonnet workhorse + per-task reviewers.

**8d brainstorm (after 8a + 8b merge):**

> Start canvas migration sub-PR 8d — hypothesis-arrow drawing. **Brainstorm first** (Spec 4 extension). Read PR8 master plan §4 for the 5 open design questions. Walk: drag gesture mechanics, source/target granularity, promoted-vs-draft visual, inline form placement, undo behavior. Output: Spec 4 amendment + per-decision-locked answers. Plan-writing follows in a subsequent session.

**8e brainstorm (after 8d merges):**

> Start canvas migration sub-PR 8e — Wall mirror. **Brainstorm first** (Spec 4 extension). Pick between (1) embedded Wall viewport, (2) hybrid expand-to-wall, (3) status quo + spec amendment. Walk: cadence vs first-time user experience, performance cost of full Wall in overlay, scope estimate per option. Output: choice locked + Spec 4 amendment. Plan-writing scope depends on choice.

**8f (parallel; whenever):**

> Start canvas viewport architecture design spec. **Brainstorm first.** Vision §5.4 commits to levels-as-pan/zoom (System / Process Flow / Local Mechanism orthogonal to mode lenses). Read PR8 master plan D2 for the deferral rationale. Pick: react-flow-style library vs hand-rolled SVG/CSS transform. Output: design spec + ADR-080 locking the choice.

## 7. Closure

PR8 master plan closes when:

- 8a + 8b + 8d + 8e all merged to `main`
- All four investigations.md entries marked `[RESOLVED YYYY-MM-DD]`
- Canvas migration spec §6 PR8 row updated to reflect actual sub-PR landing dates
- Decision-log entry: "PR8 Vision Alignment SHIPPED across N sub-PRs (#NNN, #NNN, ...). Six unmet vision-spec commitments closed (5 via PR8 sub-PRs; 8f tracked separately under canvas viewport architecture spec)."
- F-series sequence forward: PR9 cleanup unblocked (delete legacy `LayeredProcessView` / `ProcessMapBase` / `FrameView`).

## 8. Risks

| Risk                                                                                         | Mitigation                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F4 takes longer than expected → 8d/8e blocked                                                | 8a + 8b can start without F4; mitigation is to land them first while F4 finishes. Worst case: 8a + 8b ship; 8d brainstorm waits on F4.                                                     |
| 8e brainstorm picks "embedded Wall" → larger scope than estimated                            | 6-task estimate is upper bound; if scope grows past 10, split 8e into 8e.1 (data flow) + 8e.2 (rendering).                                                                                 |
| 8d gesture mechanics conflict with canvasStore's existing structural-arrow drawing primitive | Brainstorm explicitly walks the overlap; Spec 4 amendment must reconcile. If reconciliation requires canvasStore refactor, budget accordingly.                                             |
| Sub-PRs ship in wrong order, breaking master sequencing                                      | Each sub-PR plan checks the dependency graph (D3+D4) explicitly; merge order enforced by humans, not automation. Risk is human-process, mitigated by this master plan's explicit sequence. |
| Codex (or autonomous agent) bypasses brainstorm-first protocol on 8d/8e                      | `feedback_retrospective_review_pattern` already covers this case. If it happens, run a 3-reviewer retrospective and fold any vision drift into a follow-up sub-PR.                         |

## 9. References

- **Canvas migration spec** ([`docs/superpowers/specs/2026-05-04-canvas-migration-design.md`](../specs/2026-05-04-canvas-migration-design.md)) §6 PR8 row defines the original split
- **Retrospective followup plan** ([`docs/superpowers/plans/2026-05-06-canvas-pr4c-pr6-followup.md`](2026-05-06-canvas-pr4c-pr6-followup.md)) Tier 2 lists the six unmet commitments
- **Vision spec** ([`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`](../specs/2026-05-03-variscout-vision-design.md)) §3.4 / §5.2 / §5.3 / §5.4 / §5.6 / §2.4 are the source of the unmet commitments
- **F4 spec** ([`docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`](../specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md)) — D2 store-layering rule that 8d/8e depend on
- **Investigations** ([`docs/investigations.md`](../../investigations.md)) — six entries pinned 2026-05-06; close-out per D5
- **Workflow rules:**
  - `feedback_retrospective_review_pattern` — origin of PR8 (Tier 2 of canvas PR4c-PR6 retro)
  - `feedback_slice_size_cap` — ~6–8 tasks/PR; informs the multi-sub-PR split
  - `feedback_subagent_driven_default` — Sonnet workhorse + per-task reviewers + final Opus per sub-PR
  - `feedback_no_backcompat_clean_architecture` — pre-production refactor patterns apply
  - `feedback_one_worktree_per_agent` — each sub-PR gets its own `.worktrees/canvas-pr8-NN-<slug>/` checkout
  - `feedback_branch_staleness_guardrails` — fetch + drift check before each push
- **External design references** for 8d + 8e brainstorms:
  - [Excalidraw — drag-to-create](https://github.com/excalidraw/excalidraw) — gesture pattern reference
  - [tldraw — connector tool](https://github.com/tldraw/tldraw) — hypothesis-arrow pattern reference
  - [Yjs awareness](https://docs.yjs.dev/api/about-awareness) — same reference F4 cites; relevant for 8e if embedded-Wall is chosen (Wall already has multi-user envelope shape from prior work)

## 10. Out of scope (carried forward as named-future)

- **8f canvas viewport architecture** — separate design spec + ADR-080 (per D2)
- **PR9 legacy cleanup** — separate phase per canvas migration spec §6
- **F4 three-layer state codification** — separate slice; this plan honors but doesn't reshape
- **F5 SUSTAINMENT / HANDOFF action kinds** — separate slice; possibly bundles with 8a's mode-aware tier-gating if there's overlap (revisit when F5 plan is written)
- **F6 multi-investigation lifecycle** — named-future
- **Canvas migration retroactive Spec 3 + Spec 4 docs** — Tier 3 of retrospective followup; ideally lands before 8d/8e brainstorms so the brainstorms have authoritative spec text to amend
