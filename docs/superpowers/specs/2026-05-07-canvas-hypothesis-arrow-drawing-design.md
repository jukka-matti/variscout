---
tier: living
purpose: design
title: Canvas Hypothesis-Arrow Drawing — PR8 sub-PR 8d design (Spec 4 extension)
audience: human
category: design-spec
status: active
last-reviewed: 2026-05-07
related:
  - docs/archive/specs/2026-05-03-variscout-vision-design.md
  - docs/archive/specs/2026-05-04-canvas-migration-design.md
  - docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md
  - docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md
  - docs/decision-log.md
  - docs/investigations.md
---

# Canvas Hypothesis-Arrow Drawing

> **PR8 sub-PR 8d — focused extension of the not-yet-written Spec 4 (canvas overlays + Wall sync).** Closes the `docs/investigations.md` entry _"Canvas hypothesis-arrow drawing affordance absent (vision §3.4)"_ pinned 2026-05-06. Authoring side of the read-side overlay projections shipped in PR6.
>
> **Scope:** the user-facing gesture for creating hypothesis arrows + the inline form + the visual primitive split between draft and promoted hypotheses. Does NOT design the Wall mirror (8e), the canvas viewport architecture (8f), or retroactive Spec 4 documentation of PR6's read-side projections.

## 1. Context

### Why this spec exists

Vision §3.4 commits:

> _"In addition to the data-provenance arrows (§3.3 #4), users may **optionally draw a hypothesis arrow** from one column (or one step) to another, declaring 'I suspect this affects that.'"_

And on the visual split:

> _"Draft / unpromoted hypotheses render as faint arrows between steps when the overlay is on. Promoted [evidence-crossed-threshold] hypotheses render as a node marker on the affected step rather than as an arrow."_

PR6 shipped the read-side: `useCanvasInvestigationOverlays` projects pre-existing `CausalLink` entities as faint dashed SVG arrows when the Hypotheses overlay is on, and surfaces promoted `SuspectedCause` hubs as a count badge inside `CanvasStepCard`. The **drawing gesture does not exist anywhere on the canvas today** — the master plan ([`2026-05-07-canvas-pr8-vision-alignment-master.md`](../plans/2026-05-07-canvas-pr8-vision-alignment-master.md) §4) lists this as PR8 sub-PR 8d.

Codex's count-badge implementation of "promoted" is a deviation from vision §3.4 (which calls for a node marker, a separate primitive from a count chip). Per `feedback_fix_absorbed_violations_at_seam`, 8d is the right moment to fix the absorbed violation pre-production.

### What this spec decides

Six cross-cutting decisions covering the master plan's open questions for 8d (see master plan §4 8d), plus the F4 layer assignment for new state surfaces:

1. **Q1. Drag gesture mechanic** — custom pointer events + state machine
2. **Q2. Source/target granularity** — single union gesture; render always step-to-step
3. **Q3. Promoted-vs-draft visual** — node marker pip replaces inline count badge
4. **Q4. Inline form placement** — floating popover at release point
5. **Q5. Undo behavior** — two-step (no Cmd+Z); explicit delete via arrow detail
6. **Q6. Draw Hypothesis tool visibility** — top-level persistent tool, mode-agnostic, auto-enables overlay (deviates from master-plan note)
7. **Q7. F4 layer assignments** — drag-gesture + active-tool + form draft = View; `CausalLink` = Document

### What this spec does NOT decide

- Retroactive documentation of PR6 read-side overlay projections (separate Tier 3 retrospective followup)
- Canvas Wall mirror in canvas overlay (8e — separate brainstorm)
- Canvas viewport architecture / levels-as-pan-zoom (8f — separate design spec + ADR-080)
- Marker-clustering at zoom-out (coupled to 8f viewport architecture)
- Cross-store undo coordination (would require investigationStore undo stack — out of scope per Q5)
- Migration of `useSessionCanvasFilters` to `useViewStore` (separate F4 follow-up sweep)

## 2. Scope

**In scope:**

- A "Draw Hypothesis" tool entry point in the canvas chrome
- The drag gesture state machine + SVG rubber-band rendering during draw
- Source/target hit-test on step cards and column chips inside step cards
- A `HypothesisDraftPopover` inline form anchored to the gesture release point
- Commit path through `investigationStore.addCausalLink(...)`
- Replacement of inline suspected-causes count badge with a `StepNodeMarker` pip on card chrome
- An arrow-removal affordance via the existing arrow detail card (extends PR6 surface)
- Auto-enable Hypotheses overlay on tool activation
- Keyboard alternative for accessibility (per Spec 2 Decision H2 — keyboard authoring parity)

**Out of scope** (see §1.3):

- 8e Wall mirror, 8f canvas viewport, retroactive Spec 4 doc, useViewStore migration sweep, cross-store undo, marker clustering

## 3. Decision Q1 — Drag gesture mechanic: custom pointer events

### Rule

A new hook `useHypothesisDrawTool` (in `packages/hooks/src/`) owns the gesture state machine:

```ts
type DrawToolState =
  | { phase: 'idle' }
  | { phase: 'sourcePicked'; source: ArrowEndpoint; cursorAt: Point }
  | { phase: 'drawing'; source: ArrowEndpoint; cursorAt: Point; hover: ArrowEndpoint | null }
  | { phase: 'awaitingForm'; source: ArrowEndpoint; target: ArrowEndpoint; releaseAt: Point };
```

Gesture inputs are normalized via the Pointer Events API (`pointerdown` / `pointermove` / `pointerup` / `pointercancel`), which uniformly handles mouse + touch + pen. The hook returns event handlers that the canvas surface attaches to step cards and column chips.

The canvas card surface renders an SVG layer (already present for draft hypothesis arrows; same layer reused) that displays a rubber-band line during `phase: 'drawing' | 'sourcePicked'`.

### Why

Industry standard for canvas drawing tools is a state machine over pointer events (tldraw `StateNode` pattern; Excalidraw `linearElementEditor.ts`; Figma / Miro connector tools). `@dnd-kit/core` is collision-detection-oriented and the wrong shape for point-to-point drawing — it would require making every step + column both Draggable AND Droppable, with custom DragOverlay rendering, for a use case it wasn't designed for. Native HTML5 drag-and-drop is rejected by codebase precedent (poor touch + cursor + rubber-band support).

### Implementation notes

- Hit-testing on `pointerup` uses `document.elementFromPoint(x, y)` walked up the DOM to find the nearest `[data-arrow-endpoint]` ancestor — robust against z-index quirks vs. SVG-coord-based hit testing.
- Each step card and column chip carries `data-arrow-endpoint="step:<stepId>"` or `data-arrow-endpoint="column:<columnName>"` — the data attribute encodes the endpoint kind + id.
- Pointer state at frame-rate (60 fps) lives in `useState<DrawToolState>` inside the hook; updates re-render only the consuming canvas surface, not any global Zustand consumer.
- `pointercancel` and `Esc` keypress reset to `phase: 'idle'`.
- Touch-via-pointer-events: set `touch-action: none` on draggable handles to prevent the browser from claiming the gesture for scroll.
- Keyboard alternative: `Tab` to focus a source handle → `Enter` enters `sourcePicked` → `Tab` cycles through targets → `Enter` commits to `awaitingForm`. (Mirrors Spec 2 H2 chip-placement-via-keyboard.)

## 4. Decision Q2 — Source/target granularity: single union gesture

### Rule

The Draw Hypothesis tool uses one gesture. The user grabs any draggable handle (step header OR column chip inside a step), drags, and releases on any handle. Granularity is recorded honestly in the `CausalLink`: when the grabbed handle is a column chip, `link.fromFactor` / `link.toFactor` are the column names; when the grabbed handle is the step header, the spec uses a sentinel — either the step's `ctqColumn` if it exists, or all assigned columns to that step (plan-time decision; see §10 risks).

Visual rendering on the canvas remains step-to-step regardless: `useCanvasInvestigationOverlays` projects column-keyed `CausalLink`s to step endpoints today; one arrow per step pair.

### Why

The data model (`CausalLink.fromFactor: string` = column name) is already column-keyed. Step-to-step rendering is a projection that already exists. A single gesture matches the "draw a line between things" mental model from tldraw / Miro / Figma — users don't pre-classify "I'm doing column-to-column vs step-to-step." Granularity falls out of which handle is grabbed.

Two distinct tool modes (Connect Steps / Connect Columns) was rejected: extra UI surface for a distinction users don't pre-classify; same data shape underneath.

Step-only (rejecting column granularity) was rejected: would require a vision §3.4 amendment; loses expressiveness for a small UI win.

### Implementation notes

- Step header handle and column chip handle both produce a valid `ArrowEndpoint` value: `{ kind: 'step', id: stepId } | { kind: 'column', name: columnName, hostStepId: stepId }`.
- A column-grabbed source / target writes `CausalLink.fromFactor = columnName`. A step-grabbed source / target — see Risk 1 in §10 for the open implementation choice the plan must make.
- Self-loops (source step === target step) are rejected at the hit-test layer (return to `phase: 'drawing'` rather than committing).

## 5. Decision Q3 — Promoted vs draft visual: node marker pip

### Rule

- **Draft hypothesis** (a `CausalLink` whose owning hub has not crossed the SuspectedCause promotion threshold) → faint dashed SVG arrow between source and target step. **Existing rendering** in `useCanvasInvestigationOverlays.arrows`; preserved as-is.
- **Promoted hypothesis** (a `SuspectedCause` hub with status `'suspected'` or `'confirmed'`, per ADR-064) → a small `StepNodeMarker` pip anchored to the card chrome (corner pip, sibling to the card body). Glance-readable; click → opens the step overlay scrolled to the suspected-causes section. Hover → tooltip listing the hub names.

### Why

Vision §3.4 explicitly calls for "node markers" as a distinct primitive from arrows. Codex's inline count badge (`{N} cause`) inside the card body is a different primitive — readable only after the user looks INTO the card. Industry pattern (Figma comment pins, tldraw collaborator markers, Miro flowchart annotations) treats element-attached glyphs as glance-readable affordances on chrome, distinct from in-content badges.

Per `feedback_fix_absorbed_violations_at_seam`, 8d is the right moment to fix Codex's deviation pre-production. The count info doesn't disappear — it migrates to hover tooltip + step overlay drilldown. Symmetric primitive pair (dashed arrow vs. node marker) is what makes the overlay system scan as a unit.

### Implementation notes

- New component `packages/ui/src/components/Canvas/internal/StepNodeMarker.tsx` — small SVG / Lucide-icon pip; specific shape (Sparkles / Flag / colored dot / etc.) is locked at plan time, not here.
- `CanvasStepCard.tsx` swaps the inline `{N} cause` badge for `<StepNodeMarker count={...} hubs={...} />` rendered on chrome (top-right corner per Figma-pin convention; respects mobile layout via existing card responsive patterns).
- Marker clustering at zoom-out (Figma cluster pattern when multiple markers are visually close) is **deferred to 8f** since clustering is coupled to canvas viewport / zoom architecture.

## 6. Decision Q4 — Inline form placement: floating popover at release point

### Rule

On `pointerup` over a valid target, the state machine transitions to `awaitingForm`. A `HypothesisDraftPopover` component opens at the gesture release coordinate, auto-positioned by `floating-ui` to stay on-screen (flips to top/bottom/left/right as needed); a tail/arrow points to the target step card.

Form contents:

- **Subject** — auto-filled from gesture source; read-only (display only)
- **Object** — auto-filled from gesture target; read-only (display only)
- **`because…`** — free-text input (textarea); 280-char soft limit (matches existing investigation entity conventions)
- **Link to question** — optional dropdown of existing investigation questions (filtered by relevance to the source/target columns); none by default
- **Save** — commits a new `CausalLink` via `investigationStore.addCausalLink({ fromFactor, toFactor, whyStatement, questionIds })`
- **Cancel** — discards the draft; no state change anywhere
- **Esc / click-outside** — same as Cancel

After Save: state machine returns to `phase: 'idle'`; the active tool (`'draw-hypothesis'`) remains active to enable chained adds (or returns to `'select'` — plan-time decision; see §10 risk 2).

### Why

Continuity with vision §5.3 drilldown pattern (floating overlay anchored to clicked card); continuity with Spec 2 auto-step-creation prompt precedent (small floating tooltip on gesture commit); continuity with tldraw / Miro / FigJam connector-label entry. Floating popover keeps the user in spatial context with the just-completed gesture; modal would interrupt flow; right-rail collides with CoScout in Azure (locked C3 supersession via FRAME thin-spot batch — `feedback_check_shipped_patterns_first`).

### Implementation notes

- `floating-ui/react` (already used elsewhere — verify version at plan time) for auto-positioning.
- Popover renders inside the existing canvas surface root so it inherits canvas-blur backdrop styling per vision §5.3.
- ARIA: `<dialog>` semantics + focus-trap; `aria-labelledby` ties to the auto-filled subject; `Esc` dismisses (browser-native dialog behavior).
- Mobile: popover slides up from bottom (matches existing `MobileCategorySheet` pattern).

## 7. Decision Q5 — Undo behavior: two-step + explicit delete

### Rule

Hypothesis-arrow create is a two-step gesture: gesture-release opens the popover with NO state change anywhere; Save commits via `investigationStore`. Cancel/Esc/click-outside discards cleanly (no state to revert).

`Cmd+Z` does NOT undo a hypothesis create. This matches the existing investigation-entity lifecycle — questions, findings, and `SuspectedCause` hubs created today have no Cmd+Z undo either.

Removal: click on a draft hypothesis arrow → existing arrow detail card → "Remove hypothesis" button → `investigationStore.removeCausalLink(linkId)`. (PR6 shipped the click-to-detail surface; this spec adds the Remove affordance to it if absent.)

### Why

F4 layer separation: `canvasStore.undoStack` covers Document-layer canvas actions only (canonical map mutations per Spec 2 Decision C). Coupling investigation entity creates to canvas undo would violate the boundary the F4 spec D4 boundary test enforces. Adding an undo stack to `investigationStore` is a separate design question — out of 8d scope; potentially worth its own spec (every Document store getting undo is a meaningful precedent).

The popover's Cancel button gives the actually-useful "soft undo" — before commit, the user can back out at zero cost. After commit, explicit delete via arrow detail is the canonical ergonomic across investigation entities.

### Implementation notes

- Plan-time verify `investigationStore` exposes `addCausalLink` and `removeCausalLink`. (Strongly expected — `CausalLink` is an existing entity type.)
- Arrow detail card already exists per PR6; Remove button additive.
- No schema changes to `CausalLink` itself.

## 8. Decision Q6 — Tool visibility: top-level persistent tool

### Rule

The Draw Hypothesis tool is a **top-level canvas tool**, not a mode-2 toolbar affordance. It lives in the canvas chrome row alongside `LensPicker` and `OverlayPicker` (visual placement: between `OverlayPicker` and `ModeToggle`). Visible whenever the user has edit permission for the canvas; hidden in force-read-only / shared-snapshot views (consistent with all other authoring being hidden there). Visible in BOTH author and read modes — investigation graph editing is decoupled from canonical-map authoring mode.

When the user clicks the tool button:

1. Active canvas tool transitions from `'select'` to `'draw-hypothesis'`.
2. The Hypotheses overlay auto-enables (no-op if already on).
3. The button renders in pressed/active state; canvas surface shows a crosshair-style cursor.
4. `Esc` (or clicking the tool button again) returns to `'select'` and default cursor.

### Why — and the deviation from master plan

The master plan (`2026-05-07-canvas-pr8-vision-alignment-master.md` §4 8d) said:

> _"Mode-2 (structural authoring) toolbar gains a 'Draw hypothesis' tool."_

This conflates two orthogonal axes:

1. **Editing scope** — which document am I editing? Canonical map (structural) vs investigation graph (hypothesis). Different `Document`-layer stores; different mental models.
2. **Editing state** — am I in author or read mode?

Spec 2 designed Mode-2 for canonical-map structural authoring (steps, sub-steps, branch / join). Hypothesis arrows are investigation-graph authoring. Putting Draw Hypothesis in the Mode-2 toolbar puts it on the wrong axis.

The 2026 industry convention — Figma UI3, tldraw, Excalidraw, Miro, FigJam — is that drawing tools are top-level, persistent, mode-agnostic primary canvas tools. The TOOL itself is its own mode. Per Figma UI3 release notes: _"Draw now surfaces the tools designers reach for most without leaving the mode they're already working in."_

Practical consequence: a cadence-mode user (mature hub, default `read` mode) who spots something during scan can tap Draw Hypothesis, draw, and commit — without flipping the canvas mode toggle to author. That's the `feedback_journey_first_then_ui` mode-vs-cadence read in action.

Per `feedback_hidden_vs_disabled_cta`: the tool is hidden in force-read-only views (genuinely no edit permission), not greyed-out. In edit-permission contexts it's persistent. The `feedback_hidden_vs_disabled_cta` rule was originally about unwired CTAs — Draw Hypothesis is fully wired, so the relevant question is "where in the chrome" not "hide vs. disable."

### Implementation notes

- New component `packages/ui/src/components/Canvas/internal/HypothesisDrawToolButton.tsx` — icon button with `aria-pressed` reflecting active state.
- Canvas chrome (`Canvas/index.tsx` line ~330–354 region) places the new button between `<CanvasOverlayPicker>` and the right-side `<CanvasModeToggle>` cluster.
- Active-state visual: pressed button + canvas surface gets `cursor: crosshair` while tool is active.
- Force-read-only context (snapshot views, paid-feature access denial, etc.) is detected via existing canvas chrome props (Spec 2 Decision B's `mode='read' && toggleDisabled`); plan-time confirm the prop wiring.

## 9. Decision Q7 — F4 layer assignments

| State surface                                                          | F4 layer | Concrete home                                                                                                                                                                                         |
| ---------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag-gesture in-flight (source picked, pointer position, hover target) | View     | Component-local `useState` inside `useHypothesisDrawTool` hook. **Not** in `useViewStore` — frame-rate state in a global store causes unnecessary re-renders across consumers.                        |
| Active canvas tool (`'select' \| 'draw-hypothesis'`)                   | View     | New sibling field in `useSessionCanvasFilters`'s React-`useState` (today). Eventual home in `useViewStore` per F4 D2 — refactor out of 8d scope; rides along when `useSessionCanvasFilters` migrates. |
| Hypotheses overlay enabled                                             | View     | Existing `useSessionCanvasFilters.activeCanvasOverlays`. Auto-enabled on tool activation via existing `toggleCanvasOverlay('hypotheses')` (idempotent if already enabled).                            |
| Inline `HypothesisDraftPopover` open state + draft form contents       | View     | Component-local in `useHypothesisDrawTool` / popover component. Discarded on Cancel.                                                                                                                  |
| Committed `CausalLink` entities                                        | Document | `investigationStore` (existing).                                                                                                                                                                      |

The original brief's claim that the active-tool toggle should live in `usePreferencesStore` (Annotation per-user, persists across reloads) is rejected: no major canvas tool persists tool selection across sessions; opening Figma / tldraw / Excalidraw / Miro lands you in the default tool. Persisting active tool would surprise users on file reopen.

### F4 D4 boundary test impact

No new stores. No changes to `STORE_LAYER` constants. No changes to `layerBoundary.test.ts`.

## 10. Architecture summary

### State machine flow

```
[idle, default cursor]
  ↓ user clicks DrawHypothesisToolButton
[idle, crosshair cursor, hypotheses overlay enabled, button pressed]
  ↓ pointerdown on [data-arrow-endpoint]
[sourcePicked]
  ↓ pointermove
[drawing] — SVG rubber-band rendered from source to cursor
  ↓ pointermove enters [data-arrow-endpoint] (not the source)
[hovering target — drawing phase, hover target highlighted]
  ↓ pointerup on valid target
[awaitingForm] — HypothesisDraftPopover opens at release point
  ↓ user clicks Save
investigationStore.addCausalLink({ fromFactor, toFactor, whyStatement, questionIds })
  ↓
[idle, crosshair cursor, button still pressed] — chained add ready (or return to 'select' per plan-time choice)
  ↓ user clicks DrawHypothesisToolButton again, OR Esc
[idle, default cursor, button unpressed]
```

### Files

**New:**

- `packages/hooks/src/useHypothesisDrawTool.ts` — gesture state machine
- `packages/ui/src/components/Canvas/internal/HypothesisDraftPopover.tsx` — floating-ui form
- `packages/ui/src/components/Canvas/internal/HypothesisDrawToolButton.tsx` — top-level chrome button
- `packages/ui/src/components/Canvas/internal/StepNodeMarker.tsx` — promoted-hypothesis pip primitive

**Modified:**

- `packages/ui/src/components/Canvas/index.tsx` — chrome layout (add button); thread state machine; render rubber-band SVG layer (or extend existing arrow SVG layer)
- `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx` — swap inline suspected-causes badge for `<StepNodeMarker>` on chrome; add `data-arrow-endpoint="step:<id>"`
- `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx` — verify suspected-causes count info still surfaced via tooltip / overlay drilldown after badge removal
- `packages/hooks/src/useSessionCanvasFilters.ts` — add `activeCanvasTool: 'select' | 'draw-hypothesis'` + `setActiveCanvasTool` setter
- `packages/hooks/src/useCanvasInvestigationOverlays.ts` — verify arrow detail card includes Remove button (or extend if absent)
- `packages/stores/src/investigationStore.ts` — verify `addCausalLink` / `removeCausalLink` action shape (likely no-op; CausalLink CRUD assumed existing)
- Tests: per-component RTL tests, `useHypothesisDrawTool` deterministic state-machine tests, integration test in `CanvasWorkspace` covering full flow

### Test patterns

Per `writing-tests` skill:

- State-machine tests are deterministic input/output: feed pointerdown / pointermove / pointerup events; assert state transitions. No DOM required for the hook itself.
- RTL tests for popover use `data-testid` selectors per project convention.
- Integration test covers full flow: click tool button → simulate pointer events on step cards → release → fill form → Save → assert `investigationStore.causalLinks` updated.
- Manual `claude --chrome` walk: draw + commit + render a draft arrow + promote (via existing investigation flow) + verify the arrow disappears and the node marker appears + remove via arrow detail card.

## 11. Verification (acceptance criteria)

PR8d ships green when:

- [ ] Draw Hypothesis tool button is visible in the canvas chrome (between OverlayPicker and ModeToggle); hidden in force-read-only views
- [ ] Clicking the button enters draw mode: button pressed-state, crosshair cursor, Hypotheses overlay auto-enabled if off
- [ ] Drag from a step header → drag → release on another step → popover opens at release point
- [ ] Drag from a column chip → drag → release on another column chip → popover opens with column-level subject/object
- [ ] Drag → release on the same step (self-loop) is rejected; state returns to drawing
- [ ] Save commits a `CausalLink` via `investigationStore`; canvas re-renders with a new faint dashed arrow
- [ ] Cancel / Esc / click-outside discards; no state change anywhere
- [ ] `Esc` while drawing (no target picked yet) returns to idle drawing-mode state
- [ ] Click an existing draft arrow → arrow detail card shows Remove button → click Remove → arrow disappears
- [ ] Promoted `SuspectedCause` hub (status `'suspected'` or `'confirmed'`) renders as `<StepNodeMarker>` on card chrome (NOT inline count badge)
- [ ] Hover on a marker shows tooltip with hub names; click on a marker opens step overlay scrolled to suspected-causes section
- [ ] Keyboard alternative works: Tab to handle, Enter to start, Tab to target, Enter to commit form
- [ ] Touch input works (pointer events handle mouse + touch + pen uniformly)
- [ ] No regressions in PR6's read-side overlay rendering (faint dashed arrows still render for existing draft hypotheses; investigation badges/findings/etc still render)
- [ ] F4 boundary test (`packages/stores/src/__tests__/layerBoundary.test.ts`) passes — no new persist imports anywhere
- [ ] `bash scripts/pr-ready-check.sh` green; `pnpm --filter @variscout/ui build` green
- [ ] `claude --chrome` walk both apps green
- [ ] Final code-reviewer (Opus) approves
- [ ] `docs/investigations.md` "Canvas hypothesis-arrow drawing affordance absent (vision §3.4)" entry marked `[RESOLVED YYYY-MM-DD]`

## 12. Risks

| #   | Risk                                                                                                                                                                                                                                                                                | Mitigation                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Step-grabbed source/target → ambiguous column on `CausalLink`.** Step has multiple assigned columns; which one becomes `fromFactor`? Three choices: (a) use `node.ctqColumn` if set; (b) use first assigned column; (c) extend `CausalLink` schema to allow step-level endpoints. | Plan-time decision. (a) is cleanest if `ctqColumn` is reliably set; (b) is a defensible fallback; (c) is a schema change with non-trivial blast radius — only justify if (a)+(b) leave too many unrepresentable cases.                   |
| 2   | **Chained-add UX:** after Save, does the tool stay active for another draw, or return to `'select'`?                                                                                                                                                                                | Plan-time decision. Convention split: tldraw stays in tool; Figma returns to Move. Recommend: stay in tool; user dismisses with Esc / button-click.                                                                                      |
| 3   | **Cmd+Z conflicting with browser undo on input fields.** When the popover is open and the user has focused the textarea, `Cmd+Z` should undo text input, not anything canvas-related.                                                                                               | Standard browser behavior — popover textareas honor focus-scoped undo. Canvas-level `Cmd+Z` is no-op here per Q5 anyway, so no conflict.                                                                                                 |
| 4   | **Crosshair cursor doesn't feel right on touch.**                                                                                                                                                                                                                                   | On touch devices, suppress the crosshair cursor (it's not visible anyway); rely on the active-button visual + a brief instructional tooltip ("Tap a step or column to start drawing").                                                   |
| 5   | **`floating-ui` API mismatch / version drift.**                                                                                                                                                                                                                                     | Plan-time verify the exact import + version vs. existing usage in the codebase (e.g., `Tooltip` component). If `floating-ui` isn't already in use, evaluate `@radix-ui/react-popover` as an alternative — already used elsewhere likely. |
| 6   | **Promoted-hypothesis marker placement on responsive layouts.** Card chrome corner pip needs to handle small mobile cards without overlapping Cpk badge / mini-chart.                                                                                                               | Plan-time visual-design pass; specify pip position per breakpoint. Fallback: stack with capability badge in a marker row above the chart.                                                                                                |
| 7   | **Draft-vs-promoted state transitions during the user's session.** A draft `CausalLink` becomes promoted when its owning hub crosses the threshold mid-session — does the canvas re-render correctly (arrow disappears, marker appears)?                                            | `useCanvasInvestigationOverlays` already filters out promoted-hub-owned links from the `arrows` array; just needs a `<StepNodeMarker>` re-render on `suspectedCauses` change. Should be free; integration test covers it.                |
| 8   | **Auto-enable-overlay-on-tool-activation surprises user.** User toggled overlay off on purpose, then activates Draw Hypothesis, and the overlay flips back on.                                                                                                                      | Acceptable: drawing without seeing the result is a worse surprise. Document the auto-enable behavior in inline help / tooltip.                                                                                                           |

## 13. Spec relationships

- **Vision spec** ([`2026-05-03-variscout-vision-design.md`](../../archive/specs/2026-05-03-variscout-vision-design.md)) §3.4 + §5.4 — source of the commitment + the four-overlay registry
- **Canvas Migration spec** ([`2026-05-04-canvas-migration-design.md`](../../archive/specs/2026-05-04-canvas-migration-design.md)) §6.PR6 — describes the read-side overlay projections shipped in PR6 (which this spec extends with the authoring side)
- **Manual Canvas Authoring (Spec 2)** ([`2026-05-04-manual-canvas-authoring-design.md`](2026-05-04-manual-canvas-authoring-design.md)) Decision A / B / H — establishes Mode-1 / Mode-2 / a11y baseline; this spec's tool placement deviates from the master plan's Mode-2 framing per Q6 rationale
- **F4 Three-Layer State** ([`2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`](2026-05-07-data-flow-foundation-f4-three-layer-state-design.md)) D2 / D4 — establishes the View / Annotation / Document layer rules + boundary test that this spec's state assignments honor
- **PR8 Master Plan** ([`2026-05-07-canvas-pr8-vision-alignment-master.md`](../plans/2026-05-07-canvas-pr8-vision-alignment-master.md)) §4 8d — opened the six questions this spec answers; §10 deferred Spec 4 retro doc as a separate Tier 3 task
- **ADR-064 SuspectedCause hub** — defines the promotion threshold semantics that govern draft-vs-promoted visual split

### External design references

- [Tools • tldraw Docs](https://tldraw.dev/sdk-features/tools) — `StateNode` pointer-event state machine (Q1 reference)
- [Custom tool with child states • tldraw Docs](https://tldraw.dev/examples/shapes/tools/tool-with-child-states) — child-state composition pattern
- [Linear Element Editor | Excalidraw — DeepWiki](https://deepwiki.com/excalidraw/excalidraw/3.3-linear-element-editor) — pointer events for arrow editing
- [Pointer | @dnd-kit Documentation](https://docs.dndkit.com/api-documentation/sensors/pointer) — why dnd-kit is the wrong fit for arrow drawing
- [Add comments to files — Figma Learn](https://help.figma.com/hc/en-us/articles/360041068574-Add-comments-to-files) — element-anchored pin pattern (Q3 reference)
- [Status Indicator | Workday Canvas Design System](https://canvas.workday.com/v8/components/indicators/status-indicator/) — primitive distinction between status indicators and badges
- [Badges vs. Pills vs. Chips vs. Tags — Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/) — primitive vocabulary
- [Making the Move to UI3 — Figma Blog](https://www.figma.com/blog/making-the-move-to-ui3-a-guide-to-figmas-next-chapter/) — top-level mode-agnostic drawing tools (Q6 reference)

## 14. Workflow rules referenced

- `feedback_fix_absorbed_violations_at_seam` — Codex's badge implementation gets fixed at this seam (Q3)
- `feedback_check_shipped_patterns_first` — popover placement honors C3 supersession of right-rail (Q4)
- `feedback_hidden_vs_disabled_cta` — tool hidden in force-read-only, persistent otherwise (Q6)
- `feedback_journey_first_then_ui` — cadence-mode reader UX informs Q6 mode-agnostic placement
- `feedback_no_backcompat_clean_architecture` — `useSessionCanvasFilters` migration handled in a separate sweep, not bundled here (Q7)
- `feedback_world_class_critique` — Q6 reframing of the master-plan note channeled this rule
- `feedback_subagent_driven_default` — implementation will dispatch via `superpowers:subagent-driven-development` per master plan D6

## 15. Out of scope (carry-forwards)

- **8e Wall mirror in canvas overlay** — separate brainstorm + spec extension (master plan §4 8e)
- **8f Canvas viewport architecture (levels-as-pan/zoom)** — separate design spec + ADR-080 per master plan D2
- **Retroactive Spec 4 documentation of PR6 read-side projections** — Tier 3 retrospective followup; this 8d spec is a focused extension, not a comprehensive Spec 4 doc
- **`useSessionCanvasFilters` → `useViewStore` migration** — F4 follow-up sweep
- **`investigationStore` undo stack** — separate design discussion if/when other Document stores need undo
- **Marker clustering at zoom-out** — coupled to 8f viewport architecture
- **AI-assisted hypothesis suggestion ("CoScout suggests an arrow")** — explicitly cut from V1 per vision §5.7 (manual authoring is first-class)
- **Multi-user CRDT for hypothesis arrows** — V2+; Spec 2 Decision G's CRDT-readiness constraints already apply to `CausalLink` shape

---

**Implementation plan:** to be written in a subsequent fresh session per `superpowers:writing-plans` flow. Plan size estimate: ~8 tasks per master plan §4 8d; subagent-driven execution per `feedback_subagent_driven_default` (Sonnet workhorse, Opus final review) per master plan D6.

**Next step after this spec is approved:**

1. User reviews the written spec and approves OR requests revisions (per `superpowers:brainstorming` skill flow)
2. Implementation plan via `superpowers:writing-plans` in a fresh session
3. Implementation via `superpowers:subagent-driven-development` per master plan D6
4. PR merges; investigations.md entry marked `[RESOLVED YYYY-MM-DD]`; PR8 master plan §7 closure progresses
