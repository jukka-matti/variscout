---
title: Canvas PR4c-PR6 Retrospective Followup — fix list + vision-alignment plan
audience: [engineer]
category: implementation
status: draft
date: 2026-05-06
related:
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/decision-log.md
  - docs/investigations.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
---

# Canvas PR4c-PR6 Retrospective Followup

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for Tier 1 + Tier 3. Tier 2 items are tracked in `docs/investigations.md` for future vision-alignment PRs.

**Goal:** Close the gaps surfaced by the retrospective review of canvas migration PR4c (`a2f88d60`), PR5 (`2c010f29`), PR5b (`36727ad0` + `2820afb1`), and PR6 (`8b4aad68`) — five direct-to-main commits Codex shipped on 2026-05-05 without going through the PR workflow or brainstorming Spec 3 / Spec 4.

**Architecture:** Tier 1 = critical bug + project-rule violations (must fix); Tier 2 = unmet vision-spec commitments (tracked in `docs/investigations.md`; bundled into a future PR8 — Vision Alignment); Tier 3 = doc lock-in (retroactive Spec 3 + Spec 4 + CLAUDE.md sync); Tier 4 = process governance.

**Tech Stack:** TypeScript, React, Tailwind v4, Zustand + Immer, Vitest + React Testing Library. Touches `packages/ui/src/components/Canvas/`, `packages/stores/`, doc files.

## Prerequisites

- Pre-merge gate is green on `main` as of HEAD `8b4aad68`.
- The retrospective review verdict: **architecture intact; design has unmet vision commitments; one critical bug; eleven palette-color rule violations.**

## Context

Codex shipped PR1+PR2+PR3 (#126), PR4a (#127), PR4b (#128) through the proper PR workflow with subagent code review. Then bypassed the workflow for PR4c through PR6 — direct-to-main commits with no brainstorm for Spec 3 (PR5 territory) or Spec 4 (PR6 territory).

Three reviewers (architecture, design, code-quality) ran retrospectively. Findings:

- **Architecturally sound** — three-layer state separation, ADR-073/074/078 honored, CRDT readiness, Wall destination preserved.
- **Critical bug** — `onUngroupSubStep` wired through `CanvasWorkspace` but silently dropped at the `Canvas` boundary; users can group sub-steps but cannot ungroup.
- **11 hardcoded palette colors** in `@variscout/ui` violate the "no per-component palette colors" hard rule; will not adapt to dark theme.
- **`<article role="button">`** in `CanvasStepCard` is a semantic anti-pattern.
- **`useCanvasStore.getState()` in a `useEffect`** at `CanvasWorkspace.tsx:183` — quasi-render-path violation.
- **Vision-spec commitments unmet:** time-series mini-chart, drift indicator, mode-aware CTAs (Charter/Sustainment/Handoff hardcoded disabled instead of tier-gated), hypothesis-arrow drawing affordance, Wall "same data, two views" mirror, levels-as-pan/zoom orthogonal axis.
- **Documentation drift:** `packages/stores/CLAUDE.md`, root `CLAUDE.md`, and `apps/pwa/CLAUDE.md` still say "4 domain Zustand stores" — the 5th (`canvasStore`) shipped but isn't documented.
- **No retroactive Spec 3 / Spec 4 docs.** The design choices Codex made (lens picker placement, badge-projection vs Wall mirror, mini-chart algorithm, mode-aware CTA strategy) are implicit.

This plan organizes the response into four tiers. **Tier 1 + Tier 3 ship now; Tier 2 is named-future for PR8 — Vision Alignment; Tier 4 is a one-paragraph decision-log note.**

---

## Tier 1 — Critical fixes (must ship)

**Branch:** `canvas-pr4c-pr6-tier-1-fixes`
**PR title:** `fix: canvas PR4c-PR6 retrospective Tier 1 — ungroup wiring + palette + a11y`
**~5 tasks; one PR.**

### Task T1.1 — Wire `onUngroupSubStep` through Canvas

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx`
- Modify: `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx`

The prop is declared on `CanvasProps` (line ~115) but never destructured into the component body and never forwarded to `ProcessMapBase`. Result: `CanvasWorkspace.handleUngroupSubStep` (CanvasWorkspace.tsx:457) wires successfully through the prop interface but is never invoked.

- [ ] **Step 1: Write failing test asserting ungroup propagation**

```tsx
it('forwards onUngroupSubStep to ProcessMapBase', () => {
  const onUngroup = vi.fn();
  render(
    <Canvas
      mode="author"
      canonicalMap={mapWithSubStep}
      onUngroupSubStep={onUngroup}
      // ...other props
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /ungroup/i }));
  expect(onUngroup).toHaveBeenCalledWith('step-id-of-the-grouped');
});
```

- [ ] **Step 2: Add `onUngroupSubStep` to the destructured prop list in `Canvas`**
- [ ] **Step 3: Pass it down to `ProcessMapBase` (verify `ProcessMapBase` already accepts an equivalent prop; if not, plumb in)**
- [ ] **Step 4: Run test → green**
- [ ] **Step 5: Commit**

### Task T1.2 — Replace 11 hardcoded palette colors with semantic Tailwind classes

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx` (6 violations)
- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx` (2 violations)
- Modify: `packages/ui/src/components/Canvas/index.tsx` (1 violation: `text-amber-500/60` for hypothesis arrows)
- Modify: `packages/ui/src/components/Canvas/internal/CanvasOverlayPicker.tsx` (1 violation)
- Modify: `packages/ui/src/components/ChipRail/ChipRailItem.tsx` (1 violation: focus ring)

**Replacement table** (use existing semantic tokens; if a token doesn't exist for a needed shade, add it via the `@variscout/ui` color helpers per the chart/charts colors convention):

| Violation                                                              | Semantic replacement                                                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `bg-emerald-500/10 text-emerald-700` (good capability)                 | `bg-success-soft text-success` (or pair with `text-emerald-700 dark:text-emerald-300` per `feedback_green_400_light_contrast`) |
| `bg-amber-500/10 text-amber-700` (warning)                             | `bg-warning-soft text-warning` (or `text-amber-700 dark:text-amber-300`)                                                       |
| `bg-red-500/10 text-red-700` (poor)                                    | `bg-danger-soft text-danger` (or `text-red-700 dark:text-red-300`)                                                             |
| `bg-blue-500/10 text-blue-700` (info / step-of-origin badge)           | `bg-info-soft text-info`                                                                                                       |
| `bg-sky-500/10 text-sky-700` (specs incomplete chip)                   | `bg-info-soft text-info` (consolidate with above)                                                                              |
| `bg-blue-500/60` (mini-chart bar)                                      | use `chartColors.primary` from `@variscout/charts/colors` (existing convention)                                                |
| `bg-amber-500/70` (mini-chart attention bar)                           | `chartColors.warning`                                                                                                          |
| `text-amber-500/60` (hypothesis arrow stroke)                          | `chartColors.warning` opacity 0.6                                                                                              |
| `border-blue-500 bg-blue-500/10 text-blue-700` (active overlay button) | `border-info bg-info-soft text-info`                                                                                           |
| `focus:ring-blue-500/50`                                               | `focus:ring-info`                                                                                                              |

If the project's Tailwind config doesn't yet expose `success-soft`/`warning-soft`/`danger-soft`/`info-soft`/`info` semantic tokens, this task ALSO adds them via the existing `tailwind.config.ts` colors block — pair with `data-theme` light/dark variants. Consult `packages/charts/src/colors.ts` for the `chartColors` precedent.

- [ ] **Step 1: Audit current Tailwind config + semantic token availability** (~5 min reading `tailwind.config.ts`)
- [ ] **Step 2: Add missing semantic tokens if needed; otherwise skip**
- [ ] **Step 3: Replace 11 violations using the table above**
- [ ] **Step 4: Visual smoke test** — `pnpm dev` PWA + Azure; toggle dark mode; verify capability badges + mini-charts + overlay picker render correctly in both themes
- [ ] **Step 5: Run `@variscout/ui` test suite + build clean**
- [ ] **Step 6: Commit**

### Task T1.3 — Fix `<article role="button">` semantic mismatch

**File:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx:69-80`

The card is currently `<article role="button" tabIndex={0}>`. Two acceptable fixes per the `@variscout/ui` hard rule (and Spec 2 H3 accessibility constraint):

**Option A:** change to `<button type="button">` directly. **Risk:** the inner spec-edit `<button>` violates the "no `<button>` nested in `<button>`" hard rule — must be moved out (sibling layout via absolute positioning, or click-outside-card pattern with explicit hit-test).

**Option B:** keep as `<div role="button">` (or `<section role="button">` if structural sectioning is needed), explicitly avoid `<article>` (which has implicit role conflicts). The inner spec-edit button stays as a `<button>` since `<div>` carries no implicit interactive role.

**Recommendation: Option B** — smaller blast radius; preserves the existing spec-edit button as a reachable child without restructuring the card layout.

- [ ] **Step 1: Write failing test asserting `getByRole('button', { name: /step.*Mold/i })` returns ONE element (not two — the card or the spec-edit button, depending on test setup)**
- [ ] **Step 2: Replace `<article role="button">` with `<div role="button">`**
- [ ] **Step 3: Verify keyboard nav (Enter/Space on the card opens drill-down; Tab moves to nested spec-edit button without conflict)**
- [ ] **Step 4: Test pass; commit**

### Task T1.4 — Replace `useCanvasStore.getState()` in useEffect with selector subscription

**File:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx:181-189`

Current code:

```ts
useEffect(() => {
  if (JSON.stringify(useCanvasStore.getState().canonicalMap) === mapHydrationSignature) {
    return;
  }
  // ... hydration logic
}, [mapHydrationSignature]);
```

The `useCanvasStore.getState()` call inside the effect is quasi-render-path; the project rule is "Hooks that compose shared state read from `@variscout/stores` selectors, never call `getState()` in render paths."

**Fix:** read `canonicalMap` via a Zustand selector at the component top:

```ts
const currentMap = useCanvasStore(s => s.canonicalMap);
useEffect(() => {
  if (JSON.stringify(currentMap) === mapHydrationSignature) return;
  // ... hydration logic
}, [mapHydrationSignature, currentMap]);
```

- [ ] **Step 1: Write failing test asserting hydration runs only once when `processContext.canonicalMap` updates with the same signature** (currently passes but for the wrong reason; rewrite to verify the new path)
- [ ] **Step 2: Apply fix above**
- [ ] **Step 3: Run tests; verify `CanvasWorkspace.test.tsx` still green**
- [ ] **Step 4: Commit**

### Task T1.5 — Tier 1 wrap

- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] Manual `claude --chrome` walk PWA + Azure: open canvas, group two steps into a sub-step, ungroup (verify the bug fix); verify capability badges render correctly in light + dark theme; verify Tab order on step cards
- [ ] Push branch + open PR
- [ ] Subagent code review per `superpowers:subagent-driven-development`
- [ ] Squash-merge

---

## Tier 2 — Vision-spec commitments unmet (tracked in `investigations.md`; future PR8)

Six items where Codex's PR4c-PR6 implementation diverges from the vision spec's commitments. Each gets an `investigations.md` entry with promotion path. **Bundled into PR8 — Vision Alignment** (between Spec 5 / PR7 and the original PR8 cleanup, which is renumbered to PR9 in the canvas migration spec).

Items (full descriptions in `docs/investigations.md`):

1. **§5.2 Time-series mini-chart for high-cardinality columns** — only histogram + categorical present; third chart type entirely absent.
2. **§5.2 Drift indicator** — `CanvasStepCardModel` has no prior-snapshot field; drift detection not connected to card rendering.
3. **§5.3 + §2.4 Mode-aware response-path CTAs** — Charter / Sustainment / Handoff hardcoded `disabled`; should be tier-gated with explanatory text per cadence vs first-time-Hub mode.
4. **§3.4 Hypothesis-arrow drawing affordance** — overlays are read-only projections; no user-facing gesture to author new hypothesis arrows from column/step to another.
5. **§5.6 Wall "same data, two views" dual-home** — overlay is a badge projection, not a Wall mirror. Defensible V1 but unmet commitment.
6. **§5.4 Levels-as-pan/zoom orthogonal axis** — no canvas viewport at all (flat vertical scroll); levels (System / Process Flow / Local Mechanism) deferred without note.

These don't block Tier 1; the canvas works for V1 cadence usage. They're **scope-bounded vision realignment**: each item lands in its own brainstorm + plan + sub-PR within the PR8 — Vision Alignment phase.

**PR8 — Vision Alignment** sequence (proposal — locked when canvas migration spec is updated):

| PR8 phase | Vision item                                                                   | Estimated tasks                                                                                               |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 8a        | Mode-aware response-path CTAs (§5.3 + §2.4)                                   | ~5 (cadence vs first-time hub detection; tier gate; CTA component reskin)                                     |
| 8b        | Drift indicator data model + UI (§5.2)                                        | ~6 (`CanvasStepCardModel.drift` field + snapshot-history reference + UI rendering + tests)                    |
| 8c        | Time-series mini-chart for high-cardinality columns (§5.2)                    | ~5 (`CanvasStepMiniChart` time-series branch + cardinality threshold + ordering rule)                         |
| 8d        | Hypothesis-arrow drawing affordance (§3.4)                                    | ~8 (drag gesture; promotion-vs-draft visual; Mode 2 toolbar entry; tests) — needs Spec 4 brainstorm extension |
| 8e        | Wall mirror in overlay (§5.6) — embedded viewport vs current badge projection | ~6 (Wall data + canvas overlay rendering + dual-home E2E) — needs Spec 4 brainstorm extension                 |
| 8f        | Levels-as-pan/zoom orthogonal axis (§5.4) — canvas viewport architecture      | unknown; large; needs design brainstorm                                                                       |

Each phase has its own brainstorm if it isn't covered by retroactive Spec 3 / Spec 4 (Tier 3 #8). PR8a + 8b + 8c are likely scoped enough to land directly with brief design notes; 8d + 8e + 8f want a full brainstorm.

---

## Tier 3 — Documentation lock-in (this commit's docs work)

Doc updates land in **the same commit as Tier 1 fixes** (or a separate small docs PR if Tier 1 fits cleanly without them).

### T3.1 — Update CLAUDE.md "4 domain Zustand stores" claims

Files:

- `CLAUDE.md` (root) — invariant line "4 domain Zustand stores are source of truth"
- `packages/stores/CLAUDE.md` — header + "Complete list of stores" — add `canvasStore` as 5th domain store
- `apps/pwa/CLAUDE.md` — `+future useCanvasStore` reference should be present-tense

### T3.2 — Retroactive Spec 3 + Spec 4 design docs

Two new design specs in `docs/superpowers/specs/`:

**`docs/superpowers/specs/2026-05-06-canvas-spec3-cards-and-lenses.md`** (retroactive):

- Captures what Codex shipped for cards / drill-down / mode lenses
- Documents implicit decisions: lens picker placement (top toolbar), card layout (vertical scroll grid), drill-down floating overlay anchoring, mobile bottom-sheet, mode-lens reskinning per `@variscout/charts` data inputs
- Notes deferred items (time-series chart, drift indicator, mode-aware CTAs) with cross-references to investigations.md
- Status: `active` (delivered + has known gaps)

**`docs/superpowers/specs/2026-05-06-canvas-spec4-overlays-and-wall-sync.md`** (retroactive):

- Captures what Codex shipped for canvas overlays + Wall projection
- Documents implicit decisions: badge-projection vs Wall mirror (defensible V1), four overlay types as independent toggles, default-off, hypothesis arrows as faint dashed SVG, suspected causes as inline badges (vs spec-prescribed node markers), Wall canonical destination preserved
- Notes deferred items (hypothesis-arrow drawing, Wall mirror, suspected-cause node markers) with cross-references to investigations.md
- Status: `active`

Both are **descriptive specs** (what shipped) NOT prescriptive specs (what was designed) — frontmatter category should be `design-spec` but the body opens with "this is a retroactive spec capturing what shipped" so future readers know the design wasn't brainstormed-then-implemented.

### T3.3 — Update canvas migration spec with PR8 / PR9 renumbering

File: `docs/superpowers/specs/2026-05-04-canvas-migration-design.md`

The original PR8 (cleanup) renumbers to PR9. New PR8 (Vision Alignment) inserted between PR7 (Spec 5 persistence) and PR9 (cleanup). Update §6 to reflect the eight-PR sequence becoming nine PRs:

```
PR1 — Canvas facade ✅ (#126)
PR2 — Absorb ProcessMapBase ✅ (#126)
PR3 — Absorb FrameView shell ✅ (#126)
PR4a — Action types + canvasStore + history middleware ✅ (#127)
PR4b — Chip placement ✅ (#128)
PR4c — Structural authoring ✅ (direct-to-main; followup needed)
PR5 — Cards + overlay lenses ✅ (direct-to-main; Spec 3 retroactive)
PR6 — Wall overlays ✅ (direct-to-main; Spec 4 retroactive)
PR7 — Spec 5 PWA persistence schema (next; brainstorm needed)
PR8 — Vision Alignment (NEW — closes Tier 2 gaps; multi-phase 8a-8f)
PR9 — Cleanup (renumbered from PR8; legacy component deletion)
```

---

## Tier 4 — Process governance note

One paragraph in `docs/decision-log.md` recording the PR4c-PR6 direct-to-main pattern, the brainstorm-bypass for Spec 3 / Spec 4, and a forward-looking commitment to the workflow rule for any extension work (PR7+ stays on the proper rails).

This is a documentation-only entry. No code changes.

---

## Verification

PR4c-PR6 followup is complete when:

- [ ] Tier 1 fixes merged (one PR; ungroup wiring + 11 palette replacements + role=button + getState→selector)
- [ ] Tier 3 docs land alongside Tier 1 OR as a separate small PR (CLAUDE.md updates + retroactive Spec 3 + Spec 4 + canvas migration spec PR8/PR9 renumbering)
- [ ] Tier 4 decision-log entry pinned
- [ ] Tier 2 items each have a `docs/investigations.md` entry with promotion path
- [ ] PR8 — Vision Alignment scope captured in canvas migration spec §6
- [ ] `bash scripts/pr-ready-check.sh` green throughout

After this followup lands, the canvas migration sequence is **honestly documented**: PR1-PR6 shipped, PR7-PR9 are explicitly future work, and the unmet vision commitments are tracked rather than hidden.

## References

- `docs/superpowers/specs/2026-05-04-canvas-migration-design.md` — the migration sequence (will be amended in T3.3)
- `docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md` — Spec 2 (PR4a/4b/4c)
- `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` — vision spec commitments (§3.4, §5.2-5.6)
- `docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md` — PWA + Azure architecture alignment
- `docs/decision-log.md` — Tier 4 entry lands here
- `docs/investigations.md` — Tier 2 entries land here

---

**Execution choice:**

After Tier 1 + Tier 3 ship:

1. **Subagent-Driven (recommended)** — Fresh subagent per task; spec + quality reviewer per task; final code-reviewer at end. Per `feedback_subagent_driven_default` + `feedback_one_worktree_per_agent` (worktree at `.worktrees/canvas-pr4c-pr6-tier-1-fixes/`).
2. **Inline Execution** — Execute in this session via `superpowers:executing-plans`. Acceptable for the 5-task Tier 1 + ~10-task Tier 3 scope; less strict review than subagent-driven.

Subagent-driven is the default given the cross-app touch (PWA + Azure FrameView verifications) and the visual-verification step.
