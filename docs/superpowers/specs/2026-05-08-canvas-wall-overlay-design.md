---
tier: living
purpose: design
title: Canvas Wall Overlay — PR8 sub-PR 8e design (Spec 4 extension)
audience: human
category: design-spec
status: active
last-reviewed: 2026-05-08
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/archive/specs/2026-05-07-canvas-hypothesis-arrow-drawing-design.md
  - docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md
  - docs/decision-log.md
  - docs/investigations.md
layer: spec
implements:
  - docs/03-features/ui/canvas-frame.md
  - docs/03-features/workflows/investigation-wall.md
  - docs/03-features/workflows/process-maps.md
---

# Canvas Wall Overlay

> **PR8 sub-PR 8e — focused extension of the not-yet-written Spec 4 (canvas overlays + Wall sync).** Closes the unmet vision-spec commitment surfaced by the canvas PR4c–PR6 retrospective (2026-05-06): _"Canvas Wall overlay is badge projection, not 'same data, two views' mirror (vision §5.6)."_
>
> **Scope:** the V1 read-only Wall overlay layer that mounts inside the canvas — its visibility rules, its viewport sharing model, its layering against the 8d hypothesis-tool, its empty-state and mobile fallback. Does NOT redesign the Wall destination view (`WallCanvas` shipped via Phase 13/14), does NOT introduce write affordances in the overlay (DnD, ⌘K palette, hub-comment SSE) — those are deferred to a future sub-PR.

## 1. Context

### Why this spec exists

Vision §5.6 commits:

> _"The Wall is **dual-home**: it remains the canonical destination in the Investigation tab AND becomes one of the canvas overlays (§5.4). Same data, two views."_

And §5.4 reinforces:

> _"With overlays off, the canvas is a clean live map. With overlays on, the canvas IS the Wall view (see §5.6 — dual-home)."_

PR6 shipped a lighter projection of investigation context onto the canvas: per-step badge counts and linked-item lists rendered inside `CanvasStepCard`, driven by `useCanvasInvestigationOverlays` for the four overlay types (`'investigations' | 'hypotheses' | 'suspected-causes' | 'findings'`). Defensible V1 — but not the dual-home Wall mirror §5.6 commits to. The retrospective surfaced this gap; the master plan ([`2026-05-07-canvas-pr8-vision-alignment-master.md`](../plans/2026-05-07-canvas-pr8-vision-alignment-master.md) §4) lists the Wall mirror as PR8 sub-PR 8e and called for a brainstorm to pick the architectural fork.

The 2026-05-08 brainstorm picked **Fork 1 — embed `WallCanvas` viewport in canvas as the overlay layer**, honoring §5.6 verbatim per `feedback_honor_vision_commitments`. The hybrid expand-to-modal and status-quo+amend-spec forks were rejected as hedges that demote the vision.

### What this spec decides

1. The overlay is a **read-only Wall mirror** in V1; click-to-drill navigates to the Investigation tab destination view; mutating affordances (DnD, ⌘K, hub-comment SSE, hypothesis card reorder) stay in the destination view only.
2. The Wall overlay toggle is **hidden** from `CanvasOverlayPicker` until the investigation graph contains ≥1 hub / question / finding.
3. The overlay shares the **same `useWallLayoutStore` viewport** (zoom / pan / groupByTributary) as the destination view — pan/zoom in either surface mirrors live.
4. Input layering when both overlay and 8d's draw-hypothesis tool are active: **canvas (back) → Wall layer (mid, `pointer-events: none`) → hypothesis-tool gesture handler (top)**. Overlay regains pointer events for click-to-drill once the tool deactivates.
5. The overlay-active toggle (`'wall'` ∈ `activeCanvasOverlays`) is **View** layer per F4 — symmetric with the four existing overlays.
6. **Mobile fallback** (<768px): the toggle slot in the canvas toolbar re-skins to a "Open Wall ↗" navigation button that deep-links to the Investigation tab → Wall sub-tab. The View-store value is tolerated either way; render gates on `useWallIsMobile()`.

### What this spec does NOT decide

- Write affordances inside the overlay (drag-drop hub→gate, hypothesis card reorder, ⌘K palette, hub-comment SSE) — deferred to a future sub-PR.
- The canvas viewport architecture (multi-canvas / zoom semantics across multiple overlays) — that is 8f's separate spec.
- Retroactive documentation of the existing PR6 read-side overlay projections (the four pre-existing `CanvasOverlayId` values) — Tier 3 retrospective followup.
- Animation polish for overlay mount/unmount transitions — defer to followup if visual review surfaces a need.
- Methodology integration for the Wall (when does an investigator pick Wall vs Evidence Map vs Question framework?) — separate doc tracked in `docs/decision-log.md`.

## 2. Scope

The 8e implementation includes:

- A new `'wall'` value on the `CanvasOverlayId` union plus updates to `CANVAS_OVERLAY_REGISTRY`, `coerceCanvasOverlays`, `useSessionCanvasFilters` consumers.
- A new `<CanvasWallOverlay/>` internal component in `packages/ui/src/components/Canvas/internal/` that renders the overlay layer.
- A new `mode?: 'destination' | 'overlay'` prop on `WallCanvas` (default `'destination'`) that gates the read-only behavior set inside the existing component.
- A predicate (selector or hook) `useHasInvestigationContent()` returning `true` iff hubs ∪ questions ∪ findings ≠ ∅; `CanvasOverlayPicker` filters out `'wall'` when `false`.
- A mobile re-skin of the `'wall'` toolbar slot to a `WallShortcutButton` that calls the same `onOpenWall` prop the overlay's click-to-drill uses (Azure: `panelsStore.setInvestigationViewMode('map')` + `wallLayoutStore.setViewMode('wall')`; PWA: route to Investigation view + `wallLayoutStore.setViewMode('wall')`).
- Tests for overlay rendering, click-to-drill, layer-boundary, 8d compatibility, and resize behavior.

The 8e implementation does NOT include:

- Any change to `WallCanvas`'s destination-view behavior (the existing `'destination'` mode is the default and unchanged).
- Any persistent state additions (`STORE_LAYER` and `layerBoundary.test.ts` unchanged).
- Any change to PR6's existing per-step badge overlays (the four pre-existing `CanvasOverlayId` values render unchanged when `'wall'` is also active).

## 3. Decision Q1 — V1 scope: read-only Wall mirror with click-to-drill

### Rule

V1 overlay renders `WallCanvas` with `mode='overlay'`, which:

- Skips `DndContext` mount (no hub→gate drag, no hypothesis card reorder).
- Skips `useWallHubCommentLifecycle()` SSE subscription.
- Skips ⌘K command palette subscription (the overlay is not a navigation root).
- Renders `HypothesisCard` in place of `DraggableHypothesisCard`.
- Suppresses the `MissingEvidenceDigest` HTML panel (overlay shows SVG only — keeps the layered footprint clean).
- Keeps click handlers live, but the app wires them via a single `onOpenWall` callback prop on `<Canvas/>` that the overlay forwards every entity click into. The app's `onOpenWall` implementation:
  1. Navigates the user to the Investigation surface (Azure: `panelsStore.setInvestigationViewMode('map')`; PWA: `setView('investigation')` or equivalent route change).
  2. Sets `wallLayoutStore.setViewMode('wall')`.
  3. **No explicit pan-to-node call needed in V1** — Q3's shared viewport already mirrors the overlay's `wallLayoutStore` zoom/pan into destination, so the clicked entity is already in view when the destination mounts. (Pan-to-node and entity selection are V2 surface area; the existing `handleWallPanToNode` helpers stay internal to destination-view command-palette flows.)

### Why

§5.6's "two views, same data" frames the destination as the deep-work surface; the overlay is the cadence-loop scan. Mutating from the scan surface dilutes that split — the user goes deep when they need to mutate, glances when they're scanning. Read-only with drill clicks honors the split and keeps V1 scope tight (~6 tasks per master-plan estimate).

Pure spectator (no clicks at all) was rejected: the cadence-loop UX requires a drill-in path, and click-to-navigate is the lightest addition that supports it.

V1 write-capable was rejected: would balloon scope past the master-plan upper bound and conflate the read-only/write split that V2 should make deliberate.

### Implementation notes

- `WallCanvas` already accepts all click handlers as props with no internal mutation — the read-only `mode='overlay'` is a pure subtraction of subscriptions and DnD wrapping, not a behavior fork inside the SVG render.
- `mode='overlay'` defaults stay safe: when omitted, the existing destination-view behavior is unchanged. No callsite migration in the destination view.
- The drill helpers can live in app-layer (PWA `InvestigationView` and Azure `InvestigationWorkspace`) or a shared selector hook in `@variscout/hooks` if the assembly is identical. Decided at plan time; not a spec-level commitment.

## 4. Decision Q2 — Empty-state handling: hidden until ≥1 entity exists

### Rule

`CanvasOverlayPicker` filters `'wall'` out of its rendered toggle list when `useHasInvestigationContent()` returns `false`. Other overlays (`'investigations' | 'hypotheses' | 'suspected-causes' | 'findings'`) are unaffected — they continue to render in the picker regardless of content emptiness, projecting no-ops on canvas step cards as today.

### Why

Per `feedback_hidden_vs_disabled_cta`: hide unwired CTAs entirely; reserve disabled for unmet prerequisites with concrete copy. The Wall overlay genuinely has no surface to show on an empty graph — the existing `EmptyState` component lives in `WallCanvas` and is designed for the destination-view full-frame context, not a glance overlay over a populated canvas.

The pre-existing four overlays don't follow this rule because they project per-step badges that intrinsically render as zeros — no false affordance, no jarring empty surface. The Wall is structurally different: rendering an EmptyState component as an overlay over a populated canvas would be visually noisy and pedagogically misleading.

### Implementation notes

- `useHasInvestigationContent()` derives from existing stores: `useInvestigationStore.suspectedCauses`, `.questions`, `useFindingsStore.findings` — purely a selector, no new state.
- `CanvasOverlayPicker` accepts a new `availableOverlays?: CanvasOverlayId[]` prop (defaulting to all five for back-compat with non-mounting consumers); the canvas index passes `availableOverlays = hasContent ? allFive : fourWithoutWall`.
- The toggle reappears immediately when content is added (subscriber-level reactivity, no debounce).

## 5. Decision Q3 — Viewport sharing: shared `useWallLayoutStore`

### Rule

The overlay reads and writes the same `useWallLayoutStore.zoom`, `.pan`, `.groupByTributary` as the destination view. Pan/zoom gestures inside the overlay surface mutate the store; pan/zoom in the destination view propagates to the overlay. The overlay's outer `<div>` clips its rendered SVG to the canvas viewport bounds and provides independent scroll _only when the SVG exceeds the overlay viewport at current zoom_ (i.e., overflow is local, but the underlying viewport-state is shared).

### Why

§5.6's "same data, two views" extends naturally to view-state. A user scanning the overlay finds an interesting region, opens the destination view (Investigation tab), and lands at the same zoom/pan they were studying — no orientation lost. Conversely, a user finishing deep work in the destination view and returning to the canvas finds the overlay positioned at the last-studied region.

Independent ephemeral viewport was rejected: it forces a re-orientation cost on every cross-surface jump and breaks the symmetry §5.6 commits to. Fixed fit-to-canvas was rejected: dense Walls (>10 hubs, with sub-step grouping) need the cadence-scan affordance of pan/zoom — fitting the entire Wall into the canvas viewport at all times collapses to a thumbnail with no scan affordance.

### Implementation notes

- `WallCanvas` already reads zoom/pan/groupByTributary as props from `useWallLayoutStore` selectors at the destination-view callsite; the overlay does the same. No change to `WallCanvas`'s prop API for viewport.
- `useWallLayoutStore` is annotation per-project (existing) — survives reload across sessions for the same hub. Per F4 boundary, that's correct: the user's last studied viewport is project-scoped state, not a session-only view.
- Performance: `WallCanvas` SVG renders at fixed 2000×1400 viewBox; viewport zoom is a CSS transform on a wrapping `<g>`. Layered render cost is linear in hubs/questions/findings count. The 768px viewport guard (Q6) prevents the overlay from rendering at all on mobile, where DOM cost would matter most.

## 6. Decision Q4 — Input layering: canvas → Wall → hypothesis-tool

### Rule

Z-stack on the canvas surface (bottom → top):

1. Canvas step cards + lens-rendered annotations (existing).
2. Per-step badge overlays (existing four `CanvasOverlayId` types).
3. **Wall overlay layer** (`<CanvasWallOverlay/>`) — when `'wall'` ∈ `activeCanvasOverlays` AND `!isMobile` AND content exists. Z-index above per-step badges, below tool gesture handler.
4. Active-tool gesture handler — when `activeCanvasTool === 'draw-hypothesis'`, an invisible top-layer captures pointer events for the 8d arrow-drawing gesture.

When the hypothesis tool is active, the Wall overlay layer's outer wrapper sets `pointer-events: none`. This passes pointer events through to canvas step cards underneath, so the 8d gesture commits between cards rather than being intercepted by hub cards. After tool deactivates (mode-1, the default), the wrapper removes the `pointer-events: none`, and the Wall layer regains normal pointer events for click-to-drill.

### Why

`feedback_check_shipped_patterns_first`: 8d Spec 4 §6 already establishes "tool active → overlay auto-enables, gesture handler is top layer" as the input-layering precedent. Extending that precedent — Wall overlay sits above per-step badges but below the gesture handler — keeps the canvas tool-mode model coherent. The Wall is _content_ in the overlay sense; the hypothesis tool is _input modality_ in a higher sense.

The alternative (Wall always wins pointer events when visible) would break 8d's combined flow: a user with the Wall overlay on, who then activates the draw-hypothesis tool, expects to draw arrows between canvas step cards, not hub cards. Forcing them to dismiss the Wall first kills the cadence-scan-to-author micro-loop §5.4 implicitly enables.

The mutual-exclusion option (one-or-the-other) was rejected because the cadence-scan + draw-hypothesis flow is a real and valuable combined pattern: the user spots a missing hypothesis while scanning the Wall, activates the draw tool, draws the arrow without dismissing context.

### Implementation notes

- `<CanvasWallOverlay/>`'s outer wrapper computes `pointerEventsClass = activeCanvasTool === 'draw-hypothesis' ? 'pointer-events-none' : ''`. Single Tailwind class swap; no JS event-routing logic.
- 8d's `useHypothesisDrawTool` already establishes the top-layer pattern — the Wall overlay just respects the same `activeCanvasTool` selector.
- Click-to-drill handlers on hub cards inside the overlay receive pointer events normally when the tool is in `'select'` mode, since the wrapper is interactive.

### 6.1 Rendering z-stack with hypothesis-arrows overlay

Per-step badge overlays (the persistent `'hypotheses'` connector arrows in
`packages/ui/src/components/Canvas/index.tsx`) render at `z-10`. The Wall
overlay layer (`CanvasWallOverlay`'s outer wrapper) renders at `z-[15]`. The
draw-hypothesis rubber-band layer renders at `z-20` (only mounted when
`activeCanvasTool === 'draw-hypothesis'`).

When both `'hypotheses'` and `'wall'` overlays are active simultaneously, the
persistent `<HypothesisArrowsLayer>` SVG draws **below** the Wall SVG and is
visually hidden. This is by design:

- The Wall is a richer projection of the same causal data — every connector
  the per-step layer encodes is also drawn (and authored, and counted) on the
  Wall. Letting the Wall supersede those arrows when both are visible avoids
  doubling the same edges in two visual languages.
- The picker still shows both toggles. Either overlay can be turned off
  independently. The picker does NOT auto-mutual-exclude in
  `CanvasOverlayPicker` because that would imply the dual-active state is
  illegal — it isn't, it's just superseded.
- When the user activates the draw-hypothesis tool with the Wall overlay on,
  the rubber-band layer (`z-20`) draws on top of the Wall SVG so the gesture
  remains visible. This stays consistent with §6's input-layering decision —
  pointer events pass through the Wall layer to the canvas step cards
  underneath.

The rendering ordering is the natural extension of the input-layering
ordering documented above.

## 7. Decision Q5 — F4 layer assignments

| State surface                            | F4 layer   | Concrete home                                                                                               |
| ---------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `'wall'` ∈ `activeCanvasOverlays`        | View       | Existing `useSessionCanvasFilters`. Symmetric with the four existing overlays.                              |
| `useWallLayoutStore.zoom/pan/groupBy…`   | Annotation | Existing `useWallLayoutStore` (annotation per-project). Reused by both destination and overlay surfaces.    |
| Active canvas tool (8d, ride-along only) | View       | Already specified in 8d Spec 4 §9; unchanged here.                                                          |
| Drill destination (transient)            | n/a        | Action call into `usePanelsStore.setInvestigationViewMode` + `useWallLayoutStore.setViewMode` + pan helper. |

### F4 D4 boundary test impact

No new stores. No changes to `STORE_LAYER` constants in `@variscout/stores`. `packages/stores/src/__tests__/layerBoundary.test.ts` requires no changes — that test scans store files for `STORE_LAYER` markers, but `useSessionCanvasFilters` lives in `@variscout/hooks` as component-local React state (bare `useState`), not a Zustand store. The View-layer commitment for `'wall'` is enforced by the absence of `persist`/`devtools`/`immer` middleware in `useSessionCanvasFilters` (the canonical pattern for component-local View state, identical to the four existing overlays).

### Why View, not Annotation per-user

Per the brainstorm: `usePreferencesStore` would persist Wall-overlay-on across reloads, which makes the lone outlier of the five overlays asymmetric. Promoting all five to per-user persistence is scope creep into other overlays. Cadence-loop UX matches the View pattern: every reload starts with a clean canvas; user opts into overlays per session. If user research surfaces a power-user demand for persistent overlay state, that's a deliberate cross-cutting refactor of all five overlay toggles, not a 8e decision.

## 8. Decision Q6 — Mobile fallback: viewport-adaptive toggle semantics

### Rule

The `'wall'` slot in the canvas toolbar adapts by viewport:

- **Desktop (≥768px)**: rendered as a normal `CanvasOverlayPicker` toggle. Click toggles `'wall'` ∈ `activeCanvasOverlays`. Overlay mounts when toggle on AND content exists.
- **Mobile (<768px)**: rendered as a `WallShortcutButton` with external-link glyph and label "Open Wall". Click invokes a new `onOpenWall` prop the app provides; PWA + Azure wire it to navigate to Investigation tab → Wall sub-tab. The View-store `activeCanvasOverlays` is not mutated by this gesture on mobile.
- **Cross-breakpoint resize**: the View store can hold `'wall'` in either viewport; render gates on `useWallIsMobile()`. On a desktop-→mobile resize while overlay active, the overlay un-mounts; the toggle slot re-skins to `WallShortcutButton`. On mobile→desktop resize, if the View store still has `'wall'`, the overlay re-mounts; otherwise the toggle is in its off state.
- **Empty-content interplay**: on mobile, the slot is hidden when content is empty (same predicate as desktop), since the destination view's mobile path also has nothing to show.

### Why

Layered overlays are a desktop-canvas affordance. On mobile, layers stop being layers and become navigable views — same data, sequential access. This is the canonical pattern across Miro / FigJam / Mural / Figma mobile / Power Apps responsive design. Forcing layers onto small screens (the "always-embedded with MobileCardList in overlay" alternative) creates the textbook anti-pattern: full-bleed list overlay buries the canvas; both compete for the same pixels.

§5.6's two-views-same-data framing is _especially_ clean here: the Wall destination view IS the mobile manifestation of the Wall data (`MobileCardList` already swaps in below 768px in destination mode). So the toggle on mobile = navigate-to-destination is not a workaround — it's the dual-home architecture revealing itself device-appropriately. Single mental model ("show me the Wall data"), device-appropriate manifestation.

The "hide toggle on mobile" alternative was rejected: it silently denies mobile users the affordance, and they never learn the Wall is reachable from canvas. The viewport-adaptive re-skin teaches the affordance and points to the right mobile path.

### Implementation notes

- `useWallIsMobile()` already exists in `packages/charts/src/InvestigationWall/hooks/useWallBreakpoint.ts` and exports `WALL_MOBILE_BREAKPOINT = 768` — the canvas toolbar re-skin uses the same hook (or the equivalent `useIsMobile` from `@variscout/ui`, which shares the `BREAKPOINTS.mobile = 768` constant).
- `WallShortcutButton` is a new `packages/ui/src/components/Canvas/internal/` component, ~30 LOC. External-link icon (existing icon set), label, click handler. Follows existing toolbar button styling.
- The `onOpenWall` prop is a new top-level `<Canvas/>` prop (per `packages/ui/src/components/Canvas/index.tsx`); PWA `MapView` and Azure `WorkspaceView` wire it as a sibling to the existing `onLensChange` / `onOverlayToggle` props.
- The drill destination on mobile is the same as the desktop drill: Investigation tab → Wall sub-tab. On `WallShortcutButton`, no entity is in scope yet, so the navigation lands on the Wall view at its current viewport (which on mobile is the `MobileCardList` flat stack, not the SVG canvas — `wallLayoutStore.zoom`/`pan` are no-ops below 768px).

## 9. Architecture summary

### Render flow

```
<Canvas/>  (packages/ui/src/components/Canvas/index.tsx)
  ├─ Toolbar
  │   ├─ StructuralToolbar (existing)
  │   ├─ CanvasLensPicker (existing)
  │   ├─ CanvasOverlayPicker (existing — passes availableOverlays prop)
  │   │   ├─ Toggle: 'investigations' | 'hypotheses' | 'suspected-causes' | 'findings'
  │   │   └─ Toggle: 'wall' (NEW — desktop only, hidden when content empty)
  │   ├─ WallShortcutButton (NEW — mobile only, hidden when content empty)
  │   └─ HypothesisDrawToolButton (existing — 8d)
  │
  └─ <section> Canvas surface
      ├─ Step cards + lens annotations (existing, z-index 0)
      ├─ Per-step badge overlays (existing four overlay types, z-index 10)
      ├─ <CanvasWallOverlay/> (NEW, z-index 20)
      │   ├─ Wrapper div (pointer-events: none when draw-hypothesis active)
      │   └─ <WallCanvas mode='overlay' {...sharedProps}/>
      └─ Hypothesis-tool gesture handler (existing 8d, z-index 30, mounted only when active)
```

### Files

**New files**:

- `packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx` — overlay wrapper component.
- `packages/ui/src/components/Canvas/internal/WallShortcutButton.tsx` — mobile re-skin button.
- `packages/ui/src/components/Canvas/__tests__/CanvasWallOverlay.test.tsx` — overlay behavior tests.

**Modified files**:

- `packages/hooks/src/useCanvasInvestigationOverlays.ts` — add `'wall'` to `CanvasOverlayId`, `CANVAS_OVERLAY_REGISTRY`, `coerceCanvasOverlays`.
- `packages/hooks/src/useSessionCanvasFilters.ts` — accommodate the new value (mostly type-level).
- `packages/hooks/src/__tests__/useCanvasInvestigationOverlays.test.ts` — assert `'wall'` round-trips through coercion + registry.
- `packages/charts/src/InvestigationWall/WallCanvas.tsx` — add `mode?: 'destination' | 'overlay'` prop; gate `DndContext`, `useWallHubCommentLifecycle`, ⌘K, `DraggableHypothesisCard`, `MissingEvidenceDigest`.
- `packages/charts/src/InvestigationWall/__tests__/WallCanvas.test.tsx` — add overlay-mode test cases.
- `packages/ui/src/components/Canvas/index.tsx` — add `onOpenWall` prop, wire `availableOverlays` derivation, mount `<CanvasWallOverlay/>` and `WallShortcutButton`.
- `packages/ui/src/components/Canvas/internal/CanvasOverlayPicker.tsx` — accept and respect `availableOverlays`.
- `apps/pwa/src/components/views/FrameView.tsx` and `apps/azure/src/components/editor/FrameView.tsx` — wire `onOpenWall` on the `<Canvas/>` mount, hoist `wallProps` so the same memoized assembly feeds the overlay layer here and the destination view in `InvestigationView` / `InvestigationWorkspace`.

**New tests**:

- `packages/ui/src/components/Canvas/__tests__/CanvasWallOverlay.test.tsx` — covers Q1 (read-only), Q2 (empty state), Q4 (input layering), Q6 (mobile re-skin + cross-breakpoint resize).

### Test patterns

- `CanvasWallOverlay` component test: mount with mock `wallProps`, assert WallCanvas rendered with `mode='overlay'`; mount with empty content, assert null; mount with `useWallIsMobile()` mocked `true`, assert null; mount with `activeCanvasTool='draw-hypothesis'`, assert wrapper has `pointer-events: none`.
- `WallCanvas.test.tsx` (existing file): new `describe('mode=overlay')` block — assert no `DndContext`, no SSE subscription started, `HypothesisCard` rendered (not `DraggableHypothesisCard`), `MissingEvidenceDigest` not in DOM.
- 8d-compat integration: with `'wall'` overlay on AND `activeCanvasTool='draw-hypothesis'`, simulate a pointer-down on a canvas step card; assert the 8d arrow-draw handler receives the event.
- Resize: mock `matchMedia` to switch breakpoints; assert overlay mounts/un-mounts and toolbar slot re-skins between toggle and shortcut button.
- Layer boundary: assert `STORE_LAYER` for `useSessionCanvasFilters` keys including the new `'wall'` overlay value remains View; no Annotation/Document leak.

## 10. Verification (acceptance criteria)

- [ ] `CanvasOverlayId` includes `'wall'`; `coerceCanvasOverlays(['wall'])` round-trips.
- [ ] On a hub with no hubs / questions / findings, the canvas toolbar contains no Wall toggle and no `WallShortcutButton`.
- [ ] On a hub with ≥1 hub, the desktop canvas toolbar contains a Wall toggle in `CanvasOverlayPicker`.
- [ ] Toggling the Wall overlay on at ≥768px mounts `<CanvasWallOverlay/>` rendering `WallCanvas` with `mode='overlay'`.
- [ ] Pan/zoom inside the overlay updates `useWallLayoutStore`; opening the Investigation tab → Wall sub-tab shows the same viewport.
- [ ] Click on a hub card inside the overlay navigates to Investigation tab → Wall sub-tab with the hub selected.
- [ ] No DnD context inside the overlay (drag attempts on hub cards do nothing); no comment SSE subscription started; no `MissingEvidenceDigest` HTML panel rendered.
- [ ] With overlay on AND `activeCanvasTool='draw-hypothesis'`, an arrow-draw gesture between two canvas step cards commits a `CausalLink` (Wall layer is pointer-transparent).
- [ ] After deactivating the draw tool, click on a hub card inside the overlay drills as before.
- [ ] On a hub with content but viewport <768px, the canvas toolbar contains a `WallShortcutButton` with external-link glyph; click navigates to Investigation tab → Wall sub-tab.
- [ ] Resize from desktop with overlay active to <768px un-mounts the overlay and re-skins the toolbar slot; resize back to ≥768px re-mounts the overlay.
- [ ] `packages/stores/src/__tests__/layerBoundary.test.ts` continues to pass unchanged (no new STORE_LAYER additions; toggle state stays component-local in `@variscout/hooks`).
- [ ] No regressions in PR6's per-step badge overlays (the four pre-existing overlays render unchanged when `'wall'` is also active).
- [ ] No regressions in 8d's hypothesis-arrow drawing tool with overlay off, on, or active alongside.

## 11. Risks

| Risk                                                                                                                                                                                                    | Mitigation                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wall SVG render cost (2000×1400 viewBox + per-hub layout) doubles on overlay mount.                                                                                                                     | The 768px viewport guard prevents render on mobile. On desktop, hubs/questions/findings are bounded (typical ≤ ~20 hubs). Memoize WallCanvas children by entity ID; re-use the destination view's existing memoization. Profile if needed. |
| `mode='overlay'` prop becomes a sprawl of behavior forks inside `WallCanvas`.                                                                                                                           | `mode='overlay'` is purely _subtractive_ — skip subscriptions, skip wrapping. Render path is shared. If the prop accumulates more than ~5 conditional gates, refactor at that point. Bounded today.                                        |
| Click-to-drill navigation introduces a router/store coupling between canvas and Investigation tab.                                                                                                      | The drill helpers are app-layer (PWA / Azure each wire their own); `<CanvasWallOverlay/>` only exposes click props. No new cross-store coupling in `@variscout/ui`.                                                                        |
| Cross-breakpoint resize edge case: overlay active, resize <768px, overlay un-mounts, but `useWallLayoutStore` still has overlay-set zoom/pan that the destination view's mobile MobileCardList ignores. | MobileCardList is the canonical mobile Wall view; it doesn't read zoom/pan because it's a vertical card stack. No-op concern; the viewport state survives but is irrelevant on mobile.                                                     |
| 8d compatibility: pointer-events-none on the Wall layer might miss an edge case where the gesture handler is conditionally mounted.                                                                     | The 8d gesture handler is only mounted when `activeCanvasTool === 'draw-hypothesis'`; the Wall layer's pointer-events depends on the same selector. Single source of truth. Test explicitly covers the combined-active case.               |

## 12. Spec relationships

This spec extends Spec 4 (canvas overlays + Wall sync) — the umbrella spec named in the master plan. Spec 4 has not yet been written as a single document; its content is currently distributed across:

- 8d's spec (`2026-05-07-canvas-hypothesis-arrow-drawing-design.md`) covers the hypothesis-arrow authoring side.
- This spec (8e) covers the Wall mirror overlay.
- Pre-PR8 read-side overlay projections (`useCanvasInvestigationOverlays` + `CanvasStepCard` badges) are documented in PR6's commits but not yet retro-specced.

A retroactive Spec 4 consolidation document is a Tier 3 retrospective followup; it does not block 8e implementation. When that consolidation lands, this spec's status moves from `active` to `delivered` with a pointer to the consolidated home.

### External design references

- Vision §5.4 (mode lenses + canvas overlays) and §5.6 (Wall dual-home) — the spec commitments this implements.
- 8d Spec 4 §6 (input layering precedent) — extended here with z-stack + pointer-events ordering.
- F4 spec (`2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`) — three-layer state model that the layer-assignment table observes.
- Master plan ([`2026-05-07-canvas-pr8-vision-alignment-master.md`](../plans/2026-05-07-canvas-pr8-vision-alignment-master.md) §4 8e entry, §6 sequencing) — the workstream context.

## 13. Workflow rules referenced

- `feedback_honor_vision_commitments` — Fork 1 chosen verbatim, not hedged.
- `feedback_hidden_vs_disabled_cta` — empty-state hidden, not disabled.
- `feedback_check_shipped_patterns_first` — input-layer order extends 8d's precedent.
- `feedback_world_class_critique` — mobile fallback grounded in industry pattern, not neutral options.
- `feedback_one_worktree_per_agent` — implementation will run in `.worktrees/canvas-pr8-8e/` per the master plan's parallel-writer discipline.
- `feedback_subagent_driven_default` — implementation will run as subagent-driven with per-task spec + quality reviewers.

## 14. Out of scope (carry-forwards)

- Write affordances inside the overlay (DnD hub→gate, hypothesis card reorder, ⌘K palette, hub-comment SSE).
- Multi-hub Wall tile / multi-context overlays.
- Overlay mount/unmount animation polish.
- Retroactive Spec 4 consolidation document (Tier 3 retrospective followup).
- Methodology integration for Wall vs Evidence Map vs Question framework (separate doc tracked in `docs/decision-log.md`).
