---
tier: living
purpose: build
title: 'Analyze Wall redesign — master plan (canvas-first investigation wall)'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, canvas-first, coscout, scope, miro, wedge-v1]
related:
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
  - docs/07-decisions/adr-086-unified-investigation-canvas.md
implements:
  - docs/03-features/workflows/analyze-wall.md
---

# Analyze Wall Redesign — Master Plan

> **For agentic workers:** this is a **master plan** (the PR roadmap), not a single bite-sized task plan. Each PR below gets its **own L-1 sub-plan authored at build time** via the VariScout loop: **grounding workflow → sub-plan → subagent build (TDD) → adversarial gate/review → `gh pr merge --merge --delete-branch`**. One worktree per PR. REQUIRED SUB-SKILL for each PR's sub-plan: `superpowers:writing-plans`; for execution: `superpowers:subagent-driven-development`. Steps in sub-plans use checkbox (`- [ ]`) syntax.

**Goal:** Turn the Analyze Wall into the founding **"Investigation on the River"** wall rendered **canvas-first** — the canvas owns the screen; problem above, causes converging up from tributary-roots; findings pinned; legible gates; current scope + switcher; a two-drawer model (left detail / right CoScout) — composing (not rebuilding) the shipped legibility surface.

**Architecture:** All UI lives in `@variscout/ui` (`AnalyzeWall/*`, shared by both apps); state in `@variscout/stores` (`canvasViewportStore`, `analyzeStore`, `projectStore`); engines in `@variscout/core` (`findings/*`, `survey/wall`, `measurementPlan`). Each PR lands **PWA + Azure parity** (or records an explicit PWA-mount deferral). The redesign **composes the shipped L-1…L-5 legibility surface** (suspected-cause card, 3-state status ladder, activity layer, Causes matrix, gate engine) — it arranges and reclaims space; it does not redo card internals.

**Tech Stack:** React + TypeScript, SVG canvas (`WallCanvas`), Zustand stores, Vitest + RTL (happy-dom), Tailwind v4, pnpm/turbo monorepo.

**Canonical spec:** [`2026-06-08-analyze-wall-redesign-design.md`](../specs/2026-06-08-analyze-wall-redesign-design.md) §7 (chosen direction). Read it before any sub-plan.

---

## Build conventions (apply to every PR)

- **One worktree per PR** — `.worktrees/<branch>/`; main session stays at repo root (parallel-writer discipline).
- **Per-PR loop:** grounding workflow (read code + the relevant spec §) → L-1 sub-plan (`docs/superpowers/plans/2026-06-08-aw-N-*.md`) → subagent TDD build → **load-bearing seam tests** (negative control, not presence-only) → adversarial code review → run the **app test suites** (not just builds — Azure `@variscout/azure-app`, PWA, `@variscout/ui`) → `bash scripts/pr-ready-check.sh` green → merge `--merge` (not `--squash`).
- **PWA + Azure parity per PR**, or an explicit, logged PWA-mount deferral (the lv1-pwa-mount pattern).
- **Compose, don't rebuild** the shipped legibility surface; route all status labels through `hypothesisStatusDisplay` (3-state); never introduce "Verified".
- **CS-15 coordination (parallel Codex chain on the Process tab):** do **not** touch process-tab / `Canvas/` framing code. `navigateToExploreForChip.ts` is a **shared handler** — edit it **additively only** and **rebase onto CS-15 after it merges** (spec §7.10). The ProcessMap→Wall focal-step/tributary contract stays a stable read dependency.
- **No-CoScout-first:** every PR's flow works manually; CoScout stays an optional Azure overlay that never sets status (CS-10).
- **Acceptance metric (new):** track **"% of viewport that is canvas"** on the Analyze tab (target ~85%+; baseline ~30–40%).

---

## Phases & PR map

| Phase                           | PR         | Title                                                                    | Demo-critical | Depends on       |
| ------------------------------- | ---------- | ------------------------------------------------------------------------ | ------------- | ---------------- |
| **1 · Canvas-first foundation** | **AW-1**   | Wall readable default scale (fix L-4)                                    | ✅            | —                |
|                                 | **AW-2**   | Canvas-first chrome (the "% viewport = canvas" PR)                       | ✅            | AW-1             |
|                                 | **AW-3**   | Legible gates (HOLDS, labeled)                                           | ✅            | — (fits AW-2)    |
| **2 · Lens simplification**     | **AW-4**   | Demote the Evidence Map → land on Wall; Wall + Causes lenses             | ✅            | AW-2             |
| **3 · Evidence layer + scope**  | **AW-5**   | Wire `Finding.scopeId` reader → findings-per-scope                       |               | —                |
|                                 | **AW-6**   | [Current scope + switcher](2026-06-08-aw-6-scope-switcher.md) (reframe ScopeRail; lineage trail dropped) |               | AW-5, AW-2       |
| **4 · Drawers**                 | **AW-7**   | Left object-detail drawer (Evidence/Comments/Activity, no-AI)            |               | AW-2             |
|                                 | **AW-8**   | CoScout right-drawer slot (shell + tabs + `[REF]` hook; content = CS-14) |               | AW-2, AW-7       |
| **5 · Explore handoff**         | **AW-9**   | Extend Analyze→Explore WHERE handoff (categorical, additive)             |               | **CS-15 merged** |
| **Apply**                       | **AW-DOC** | Doc propagation + ADR-066 supersession + decision-log                    |               | the above land   |

**Demo-minimum = Phase 1 + AW-4** (canvas-first, readable, legible gates, lands on the Wall). Phases 3–5 are depth and can follow the demo.

**Codex dispatch prompts** (paste-ready, one per PR): [`2026-06-08-aw-codex-dispatch-prompts.md`](2026-06-08-aw-codex-dispatch-prompts.md). Execution = Codex v2 full-loop, one PR in flight.

---

## PR detail

### AW-1 · Wall readable default scale (fix L-4) — demo-critical

**Goal:** the populated Wall fills the canvas on entry; the Fit control actually changes scale.
**Why:** verified real gap (spec §7.6) — populated Wall renders ~0.55×; Fit is a no-op (two decoupled scaling layers; sparse bbox spans full canvas height).
**In scope:** pick **one scaling authority** (recommended: make `fitWallToContent` recompute **and apply the SVG `viewBox`** — the layer that owns default scale — rather than only resetting the inner `zoom/pan`; alternative: make `zoom/pan` the sole scale and drop the auto-`viewBox`); **tighten `computeWallContentBBox`** for sparse Walls (exclude the always-present scope anchor / factor band / tributary footer when there are no factor glyphs, or clamp to occupied rows).
**Out:** snap-river re-layout (deferred).
**Files (rough):** `packages/ui/src/components/AnalyzeWall/wallLayout.ts` (`computeWallContentBBox` ~:311-367, `formatWallViewBox`), `WallCanvas.tsx` (`populatedViewBox` ~:773-777, the `<svg viewBox>`/`<g scale>` seam ~:1321-1329), apps' `fitWallToContent` (`AnalyzeWorkspace.tsx:592`, `AnalyzeView.tsx:242`). Tests: `WallCanvas.test.tsx` fit describe, `useWallKeyboard.test.tsx`.
**Load-bearing test:** assert default-entry effective scale is legible (content fills ≥ a threshold of the viewport, e.g. bbox-to-client ratio) **and** that pressing Fit on a zoomed Wall changes scale — the existing tests only assert `onFit` fires (non-load-bearing).
**Acceptance:** load `?sample=analyze-showcase` → Wall content fills the canvas on entry (measure `viewBox` vs client); Fit is not a no-op; both apps green.

### AW-2 · Canvas-first chrome — demo-critical

**Goal:** the canvas owns ~85%+ of the Analyze viewport (baseline ~30–40%).
**In scope:** **Overall Problem Header becomes the single thin top bar** (cherry-pick `OverallProblemHeader` from PR #336; mount in **both** apps — PR #336 was Azure-only); left "Investigation conclusions" rail → **collapsible/overlay**; view-mode toggle → **compact floating control** on the canvas corner; missing-evidence digest → **thin collapsible nudge**; best-subsets/`ModelBuilderBand` → **on-demand overlay** (toggle, not always-on).
**Out:** the drawers (Phase 4); CoScout; the lens cut (AW-4).
**Files (rough):** `apps/azure/.../AnalyzeWorkspace.tsx` (toolbar rows, the left conclusions rail, the toggle rows ~:1166-1259, `MissingEvidencePanel` mount), `apps/pwa/.../AnalyzeView.tsx` (mirror), `packages/ui` `OverallProblemHeader` (cherry-pick + mount), `ModelBuilderBand.tsx` (overlay affordance).
**Acceptance:** measured canvas share ≥ ~80% on both apps; every relocated chrome element still reachable (overlay/float/collapse); no loss of function. **Note:** largest, judgment-heavy PR — Opus implementer; split into AW-2a/2b if the sub-plan exceeds ~8 tasks.

### AW-3 · Legible gates — demo-critical

**Goal:** the gate (`HOLDS N/M`) reads as a labeled, legible badge, not a cryptic tiny diamond.
**In scope:** render the gate with a clear label (e.g. "HOLDS 38/42 · H1 ∧ H2"), legible glyph at default scale; compose the shipped `runAndCheck` output (`WallCanvas.tsx:871-893`); keep the `onComposeGate` drag.
**Out:** new gate semantics (the engine is shipped — `GateNode`, `runAndCheck`).
**Files (rough):** `WallCanvas.tsx` (gate render ~:871-893 + the diamond), optionally a small `GateBadge` component in `AnalyzeWall/`.
**Acceptance:** gate readable at default scale; HOLDS reflects the scope's `gateNode` eval; both apps.

### AW-4 · Demote the Evidence Map — demo-critical

**Goal:** Analyze lands on the **Wall**; primary lenses = **Wall + Causes**.
**In scope:** default `viewMode 'map' → 'wall'` (`canvasViewportStore.ts:141` + `normalizeCanvasViewMode`; keep `'causes'`); remove `'map'` from the **primary** toggle in both apps (the `analyzeViewMode 'map'|'findings'` + `wallViewMode 'map'|'wall'|'causes'` two-layer toggle — keep the **Findings** view; drop the **Evidence Map** lens); **park CausalLink authoring** (don't mount `CausalLinkCreator`/`AnalyzeMapView` in the primary flow); **keep `EvidenceMapBase`** for Report's read-only timeline + PWA mobile (do **not** delete).
**Out:** deleting `EvidenceMapBase`; touching `CausalLink` persistence/read (Report + AI still read it).
**Files (rough):** `packages/stores/src/canvasViewportStore.ts` (:25 union, :141 default, normalizer), `AnalyzeWorkspace.tsx` (:1191 toggle, :1262-1367 render branch, :1338-1364 causal CRUD wiring), `AnalyzeView.tsx` (:596 toggle, :616-659 the Findings/Evidence-Map sub-toggle gate). Doc: ADR-066 supersession (→ AW-DOC).
**Load-bearing test:** Analyze opens on Wall; primary toggle offers Wall|Causes (no Map); Report still renders the evidence map.
**Acceptance:** lands on Wall; Report unaffected; both apps. **Watch:** the two-layer toggle wiring — verify "Findings" survives and only the "Evidence Map" lens leaves.

### AW-5 · Wire `Finding.scopeId` reader → findings-per-scope

**Sub-plan:** [`2026-06-08-aw-5-scope-findings.md`](2026-06-08-aw-5-scope-findings.md)

**Goal:** findings show within their scope (close the write-only gap, spec §7.4).
**In scope:** read `Finding.scopeId`; filter/group the Wall's findings + the left finding list by the active scope; confirm capture stamps `scopeId` (already does via `addFinding`). Keep the hub `findingIds`/`counterFindingIds` clue-split intact (orthogonal).
**Out:** changing the clue-split mechanism; the lineage trail.
**Files (rough):** `WallCanvas.tsx` (findings filter by active scope), `FindingsLog`/finding-list selectors, `analyzeStore`/`useFindings` (scope-scoped selector), `AnalyzeWorkspace.tsx` activeScope derivation (~:266-285).
**Load-bearing test:** a finding captured in scope B does **not** appear under scope A (negative control); loose findings (no hub) still render.
**Acceptance:** switching scope shows that scope's findings; both apps.

### AW-6 · Current scope + switcher (reframe ScopeRail)

**Goal:** current scope prominent + switch across the few flat sibling scopes; **no lineage trail** (spec §7.5).
**In scope:** the scope anchor / problem-condition shows the **current scope**; a **compact scope switcher**; reframe `ScopeRail` from a broad→narrow lineage trail → a current-scope + switcher; keep **flat scopes, no recursion**.
**Out:** the lineage metadata as a build target (demoted to optional); child-scope recursion (canon non-goal).
**Files (rough):** `packages/ui/src/components/AnalyzeWall/ScopeRail.tsx` (reframe), `WallCanvas`/`AnalyzeWorkspace` (scope anchor + switcher), `OverallProblemHeader` (current scope text).
**Acceptance:** current scope visible; switching works; flat-no-recursion preserved; both apps.

### AW-7 · Left object-detail drawer

**Goal:** select a Wall object → a left drawer with **Evidence / Comments / Activity** (deterministic, no-AI home; spec §7.7).
**In scope:** the left drawer shell (slim handle closed → drawer open, collapse-by-default = canvas-first); tabs scoped to the selected object (finding / cause / scope / plan); **absorb the conclusions rail**; reuse shipped `FindingCard` / comments (`useHypotheses`/`useFindings` add/edit) / activity bands. Selection state (which object is selected).
**Out:** CoScout (AW-8).
**Files (rough):** new `ObjectDetailDrawer` in `packages/ui/src/components/AnalyzeWall/`, `AnalyzeWorkspace`/`AnalyzeView` mount + selection wiring.
**Acceptance:** select object → drawer shows its detail; comments add/edit; works with zero AI; canvas-first preserved. (PWA parity or a logged PWA-mount deferral — decide in the sub-plan.)

### AW-8 · CoScout right-drawer slot

**Goal:** reserve CoScout's home — slim handle + drawer shell + tab scaffold + `[REF]` hook; **content = CS-14** (spec §7.7).
**In scope:** right drawer shell (slim handle closed → drawer open); tab scaffold **Coach / Evidence / Actions**; object-scoped header; reserve the `[REF]` visual-grounding hook (`onRefActivate` exists); re-home the existing `CoScoutSection` into the drawer. **Azure only** (PWA has no CoScout).
**Out:** CoScout content/behaviour and the cross-tab highlight (both CS-14).
**Files (rough):** `apps/azure/.../CoScoutSection.tsx` (re-home into the drawer shell), `AnalyzeWorkspace` mount; `panelsStore.isCoScoutOpen` becomes the drawer open-state.
**Acceptance:** CoScout opens as the right drawer scoped to the selected object; slim handle when closed; canvas-first preserved; Azure; CS-10 fence intact (never sets status).

### AW-9 · Extend the Analyze→Explore WHERE handoff (categorical, additive)

**Goal:** the chip jump carries the full **categorical** WHERE (+ optional origin) and Explore applies it to the charts; PWA parity (spec §5, §7.10).
**In scope:** extend `ChipNavigationTarget` **additively** (optional `predicates?: ConditionLeaf[]` on **all** target kinds + optional `findingId?`/`hypothesisId?` origin); apply categorical predicates to `projectStore.filters` (reuse `conditionLeavesToCategoricalFilters` from PR #336); wire the PWA call-site + `ScopeChrome` mount; **rebase onto CS-15 after it merges**.
**Out:** **numeric-range predicates** (`between`/`gt`/`lt`) — deferred; they need a `projectStore.filters` model change beyond membership (a separate follow-up spec, sequenced after the Process-framing chain).
**Files (rough):** `packages/ui/.../navigateToExploreForChip.ts` (additive), `AnalyzeWorkspace`/`AnalyzeView` call-sites, `Dashboard` reverse-mirror (categoricalFilters → setFilters), `hypothesisCondition.ts` (reuse helper).
**Acceptance:** jump from a cause/factor carries the categorical WHERE into Explore charts (not just a chip); CS-15's Process-Canvas chip gestures unaffected (additive); both apps (PWA per mount status).

### AW-DOC · Doc propagation (Apply at delivery)

**In scope:** **supersede ADR-066** (Evidence Map owns center/default → stale); update `analyze-wall.md` + `investigation-surface.md` (Wall + Causes lenses, canvas-first, current-scope, two-drawer, Map demoted, CausalLink not-now); re-status the river-roots spec note if needed; decision-log entries (Map demotion, lineage-trail-demoted, two-drawer, "% viewport = canvas" metric, CS-15 coordination). Wireframes `suspected-cause-card` / `causes-matrix` stay current.
**Convention:** Apply-phase doc propagation happens **per-initiative at delivery**, not batch.

---

## PR #336 disposition

Cherry-pick — don't merge wholesale. **AW-2** takes the `OverallProblemHeader`; **AW-9** takes the categorical Explore handoff; **AW-6** reframes the `ScopeRail` (lineage trail → switcher). The lineage **metadata** (`parentScopeId`/`createdFrom`) stays an optional additive type (only `explore-drill` has a live writer) — not a build target. **Close PR #336** once the header + categorical handoff land on `main`.

---

## Self-review (spec coverage)

- §7.1 job → the whole plan serves it (capture→test→settle→handoff stays intact; compose-don't-rebuild). ✅
- §7.2 canvas-first → AW-2 (+ the % metric); AW-1 supplies the fill. ✅
- §7.3 vertical convergence + legible gates → AW-3 (gates); convergence layout is the existing Wall arrangement preserved through AW-2 (note: if AW-2 must re-lay-out, keep problem-above / causes-converging-up). ✅
- §7.4 evidence layer / 1-scope-N-findings / orphan next-moves → AW-5 (scopeId reader); orphan lane + tethers are shipped (compose in AW-2/AW-5). ✅
- §7.5 current scope, no lineage → AW-6. ✅
- §7.6 L-4 → AW-1. ✅
- §7.7 two drawers → AW-7 (left) + AW-8 (right CoScout slot). ✅
- §7.8 Wall+Causes, Map demoted, ADR-066 supersede → AW-4 + AW-DOC. ✅
- §7.9 3-state status → shipped; every PR routes labels through `hypothesisStatusDisplay` (convention). ✅
- §7.10 CS-15 coordination + numeric deferral → AW-9 + build conventions. ✅
- **Gap noted:** the §7.4 LOD (counts at low zoom → chips on zoom-in) is partly shipped (`HypothesisCard` LOD); confirm during AW-2/AW-5 grounding whether finding-chip LOD needs its own task — if so, add **AW-5b**.
