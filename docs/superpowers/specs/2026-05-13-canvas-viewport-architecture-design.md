---
title: Canvas Viewport Architecture — Design (8f)
audience: [product, engineer, designer]
category: design
status: delivered
last-reviewed: 2026-05-13
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/01-vision/methodology.md
  - docs/07-decisions/adr-068-coscout-cognitive-redesign.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
  - docs/07-decisions/adr-076-frame-b0-lightweight-render.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
---

# Canvas Viewport Architecture — Design (8f)

> **Status:** Delivered 2026-05-13 via PR #165. Closes vision §5.4 ("levels-as-pan/zoom") — the last unmet vision-spec commitment after PR8 sub-PRs 8a–8e (decision-log 2026-05-08).

## 1. Summary

The Canvas surface becomes a **navigable three-level viewport**. Zoom level _infers_ the methodology level (System / Process Flow / Local Mechanism) — no separate level picker. Mode lenses (capability / defect / yamazumi / performance) stay orthogonal and persist across level transitions.

Architecturally: one **`useCanvasViewportStore`** (generalized from today's `wallLayoutStore`), **d3-zoom** for input math (~3 KB gz, only new dependency), a **`LODSwitcher`** React primitive that mounts the right renderer per level, and **pluggable renderers** that embed owner-surface components (SCOUT for L1, Canvas-DOM-grid for L2, Evidence Map + Wall mirror for L3) — never re-render them.

The pattern is the same one Figma, Google Maps, VS Code, Notion, Linear and Visx use: **one camera state, pluggable views**. Industry-validated; the work is in the level-data semantics + ADR-073-compliant L1, not the viewport primitive.

## 2. Why this exists

Vision spec §5.4 (`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`):

> "Levels (System / Process Flow / Local Mechanism) are which slice of the process you're scanning — expressed as a **canvas pan/zoom, not a separate picker**. Modes are which analytical lens you apply. The two cross-cut."

ADR-068 amendment reinforces: "level inferred from the canvas zoom state."

Today the Canvas (`packages/ui/src/components/Canvas/index.tsx`) is a DOM grid with `overflow: auto` scroll. The only pan/zoom in the product is inside the Investigation Wall (`WallCanvas` → CSS transform on an SVG `<g>`, state in `packages/stores/src/wallLayoutStore.ts`). Three levels exist in our methodology but live on three different surfaces (SCOUT for L1, Hub Capability + Canvas for L2, Evidence Map + Wall for L3) — there is no unified pan/zoom navigation between them.

8f delivers that unified navigation. **Within one Hub** — multi-Hub portfolio aggregation is explicitly out of scope (Azure-tier named-future per vision §7).

## 3. The three-level hierarchy (methodology mapping)

Vision §2.1 + `docs/01-vision/methodology.md` §2.1 define three levels of reading **for one Hub**. They are not three separate artifacts — they are three slices of the same Hub's data, indexed by scope:

| Level                     | What it IS (data)                                                                          | Canvas vocabulary                                                             | Owner surface today                                                      | ADR-073 constraint                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **L1 — System / Outcome** | The Y measure at the right end of the canvas. One outcome per Hub (per vision §3.1).       | Outcome panel: distribution + drift + capability + spec summary               | SCOUT four-lens dashboard                                                | Outcome's own spec; no roll-up across steps                                                       |
| **L2 — Process Flow**     | The DAG of steps with specs, sub-steps, branches, joins.                                   | The today-canvas spine. Step cards.                                           | Canvas (post-strangler-migration) + Hub Capability tab + FRAME workspace | Each step against its own spec; siblings with different specs render side-by-side, never combined |
| **L3 — Local Mechanism**  | The columns feeding each step + the investigation graph (Hypothesis, Finding, CausalLink). | Inside a step — column-level mini-charts + factor network + hypothesis mirror | Evidence Map (factor network) + Investigation Wall (hypothesis canvas)   | Column-level distributions per-step; no cross-step aggregation                                    |

**Critical clarifications:**

- **A Process Hub IS the L2 artifact.** "The map IS the Hub" (vision §3.1). L1 and L3 are projections of the same Hub's data, not separate Hubs.
- **8f's pan/zoom is within one Hub.** Multi-Hub portfolio aggregation is a different feature (Azure-tier named-future, vision §7). ADR-073 still applies _within_ a Hub (heterogeneous sibling steps), but cross-Hub is simply not a concern of 8f.
- **The Hub-level outcome is a Y column, not a computed average.** L1's "capability" reads the outcome series itself against its spec; no rollup of step capabilities.

## 4. Architecture

### 4.1. The three primitives

```
┌─────────────────────────────────────────────────────────┐
│  useCanvasViewportStore   (annotation-per-project)       │
│    zoom: number                                          │
│    pan: { x: number; y: number }                         │
│    currentLevel: 'l1' | 'l2' | 'l3'                      │
│    focalStepId?: StepId     (which step is L3 focused)   │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ reads
                         ▼
              ┌─────────────────────┐
              │  d3-zoom input      │
              │  layer              │
              │  (wheel / drag /    │
              │   pinch / keyboard) │
              └──────────┬──────────┘
                         │ updates store
                         ▼
              ┌─────────────────────┐
              │  LODSwitcher        │
              │  reads currentLevel │
              │  + lensId,          │
              │  mounts renderer    │
              └──────────┬──────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
        L1View       L2View       L3View
       (slim         (today's     (Evidence
        SCOUT-       Canvas       Map +
        lensed       DOM grid)    Wall
        outcome      + cont.      mirror +
        panel)       detail       column
                     gradient)    factor view)
```

### 4.2. Why "shared state, pluggable renderers"

A viewport is a **state concept**, not a rendering mechanism. Wall renders SVG (cards graph-positioned). Canvas-L2 renders DOM grid (cards flow-positioned). Forcing one mechanism breaks one of them:

- SVG everywhere → DOM-native dnd-kit chip placement + Safari `<foreignObject>` hit-test bugs.
- DOM everywhere → loses Wall's graph layout; have to reimplement positioning math.

**Decision:** share the state model + input layer; let each level/surface render in its native style. This matches Figma's scene-graph + canvas-renderer split, Google Maps' camera + tile-renderer split, VS Code's ViewModel + DOM/Canvas split, Notion's view-state + table/board/calendar/timeline renderers split. Industry-default architecture for viewport-driven products.

### 4.3. Why d3-zoom (and not react-flow)

- **d3-zoom** (3 KB gz, framework-agnostic): handles wheel + pinch + pointer-drag input math, scale-extent clamps, programmatic `zoomTo` transitions. Used internally by Figma, Miro, every serious React data-viz library (Visx is "d3-scale + React"). Doesn't know about React or our renderer — we wire it once and own everything above.
- **react-flow** (~50–80 KB gz): mature DAG-editor library; free pan/zoom + minimap + fitView + edge routing. Excellent if your canvas IS a node-and-edge graph editor. **Cost for us:** opinionated node/edge model — forces a rewrite of `CanvasStepCard` (currently custom-rendered with dnd-kit chips, drift overlays, mini-charts), conflicts with Wall overlay input layering already locked in PR8 sub-PR 8e, and adds ~50–80 KB gz to the PWA bundle for affordances we don't need at "three discrete LODs."
- **Hand-rolled (no library)**: re-invents wheel-zoom + pinch + scale-extent clamps + programmatic transitions. Possible but wasteful when d3-zoom solves it cleanly.

**Decision:** d3-zoom for input math; hand-roll everything above (LOD switcher, level data shapes, semantic-zoom thresholds). Only new dependency.

### 4.4. Store shape

```ts
// packages/stores/src/canvasViewportStore.ts
// (generalized from wallLayoutStore — see migration § below)

import type { ProcessHubId, StepId } from '@variscout/core';

export const STORE_LAYER = 'annotation-per-project' as const;

export type CanvasLevel = 'l1' | 'l2' | 'l3';

export interface CanvasViewport {
  zoom: number; // continuous; LOD inferred via thresholds
  pan: { x: number; y: number }; // viewport-world coords
  currentLevel: CanvasLevel; // discrete; redundant w/ zoom but explicit
  focalStepId?: StepId; // required when currentLevel === 'l3'
}

export interface CanvasViewportSnapshot extends CanvasViewport {
  // The persisted shape (selection state OMITTED — see PR8 8e precedent;
  // selection stays transient inside the store but doesn't round-trip Dexie).
  // Wall's nodePositions + groupByTributary also live in this store now.
  nodePositions: Record<NodeId, { x: number; y: number }>;
  groupByTributary: boolean;
}

export interface CanvasViewportStore {
  viewports: Record<ProcessHubId, CanvasViewport>;
  getViewport(hubId: ProcessHubId): CanvasViewport;
  setZoom(hubId: ProcessHubId, zoom: number): void;
  setPan(hubId: ProcessHubId, pan: { x: number; y: number }): void;
  setLevel(hubId: ProcessHubId, level: CanvasLevel, focalStepId?: StepId): void;
  fitToContent(hubId: ProcessHubId, level?: CanvasLevel): void;
  // Wall-layout fields preserved from the rename
  setNodePosition(hubId: ProcessHubId, nodeId: NodeId, pos: { x: number; y: number }): void;
  setGroupByTributary(hubId: ProcessHubId, value: boolean): void;
}
```

`lensId` is **NOT** in this store. Lens (mode) lives in `usePreferencesStore` (annotation-per-user) because it's a personal viewing choice that persists across Hubs.

### 4.5. LOD thresholds (initial values, tunable in chrome walks)

```ts
// packages/ui/src/components/Canvas/internal/lodThresholds.ts
export const LOD_THRESHOLDS = {
  l1ToL2: 0.3, // zoom < 0.3 → L1
  l2ToL3: 2.0, // zoom ≥ 2.0 → L3
} as const;

export function inferLevel(zoom: number): CanvasLevel {
  if (zoom < LOD_THRESHOLDS.l1ToL2) return 'l1';
  if (zoom >= LOD_THRESHOLDS.l2ToL3) return 'l3';
  return 'l2';
}
```

These are **spec-level values**, not ADR-locked. Chrome walks in implementation may tune them; the _existence_ of three discrete LOD bands is ADR-locked.

### 4.6. LOD transitions

- **L1 ↔ L2 ↔ L3 transitions are discrete-with-cross-fade.** The renderer swap is instantaneous in React (mount/unmount), but the swap is wrapped in a 150ms opacity cross-fade so it doesn't snap jarringly.
- **Within L2 (continuous-detail gradient),** there is no swap — `CanvasStepCard` reads the current zoom from the store and re-renders fields conditionally:
  - `zoom < 1.0`: step name + Cpk badge + drift arrow only (overview tile)
  - `zoom ≥ 1.0`: full card (mini-chart, dnd-kit chips, drift overlay, drill-down CTAs)
- **Snap-to-LOD** on wheel-stop: if user releases the wheel with `0.3 ≤ zoom < 0.5`, the viewport eases back to `0.5` (the L2-overview low end) to avoid stranding the user between LODs. Same for `1.8 ≤ zoom < 2.0` → ease to `1.8` (L2-detail high end). Tunable in chrome walks.

### 4.7. Coordinate-space translation

The Wall renders SVG `<g transform="translate(pan.x, pan.y) scale(zoom)">`. Canvas-L2 renders CSS `transform: scale(zoom) translate(pan.x, pan.y)` on a `<div>` grid wrapper. Both read the same `zoom` and `pan` values from the store, but the _coordinate spaces inside_ the renderers differ:

- SVG `<g>`: pan/scale apply to the SVG viewport (user-space units, `CANVAS_W=2000, CANVAS_H=1400` precedent from `WallCanvas.tsx`).
- DOM `<div>`: pan/scale apply to the layout box (CSS pixels).

A small utility lives in `packages/ui/src/components/Canvas/internal/coordSpace.ts` to translate between them when cross-renderer features need it (e.g., a hypothesis arrow drawn in PR8 8d that starts on a Canvas-L2 step card and ends on a Wall mirror card). The utility is:

```ts
// client (CSS px) ↔ viewport-world (zoom-independent) ↔ renderer-local
export function clientToWorld(
  p: { x: number; y: number },
  viewport: CanvasViewport
): { x: number; y: number };
export function worldToCanvasDom(
  p: { x: number; y: number },
  viewport: CanvasViewport
): { x: number; y: number };
export function worldToWallSvg(
  p: { x: number; y: number },
  viewport: CanvasViewport
): { x: number; y: number };
```

Figma's Canvas↔DOM overlay interop solves the same problem; it's tractable but the spec calls it out because it's the one non-trivial bit of math.

## 5. Per-level renderer spec

### 5.1. L1 — System / Outcome view

**Trigger:** `currentLevel === 'l1'` (zoom < `LOD_THRESHOLDS.l1ToL2`).

**Renders** (slim canvas-native, ADR-073-compliant):

- Hub name + outcome name (`processHub.outcomes[0]` per Framing Layer spec)
- **Outcome distribution chart** — boxplot or histogram of the outcome Y series across the active time window
- **Drift indicator + time-series mini-chart** of the outcome (reuses PR8 8b primitives)
- **Capability summary** — outcome's own Cp/Cpk/Pp/Ppk against the outcome's own spec (single-row stats, no rollup)
- **Conformance summary** — % of outcome readings within spec, against outcome spec
- **Inbox digest** — drift alerts + Survey hints scoped to the Hub
- **Active investigations summary** — count of open Questions / Hypotheses / Findings (links to Investigation tab)

**Click → SCOUT full four-lens dashboard** for deep-dive (existing surface at `packages/ui/src/components/DashboardBase/`).

**Per Decision #7:** L1 surfaces **no per-card response-path CTAs.** Inbox digest is the only action surface. Quick Action / Focused Investigation / IP / Sustainment / Handoff CTAs all live at L2/L3 (step-targeted or column-targeted).

**ADR-073 compliance:** The outcome is a single Y column with a single spec. No statistical roll-up across steps occurs. Sibling steps with different specs are not aggregated; their per-step capability remains at L2.

### 5.2. L2 — Process Flow view

**Trigger:** `LOD_THRESHOLDS.l1ToL2 ≤ zoom < LOD_THRESHOLDS.l2ToL3`.

**Renders:** today's Canvas DOM grid (`packages/ui/src/components/Canvas/index.tsx`), wrapped in a CSS-transform-driven viewport `<div>`. The `WallCanvasOverlay` overlay (PR8 8e) continues to render on top as an SVG layer.

**Continuous-detail gradient** within L2 (per Decision #8):

```tsx
// packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx
const detailLevel = zoom < 1.0 ? 'overview' : 'detail';
return (
  <div className="step-card">
    <StepNameHeader />
    <CpkBadge />
    <DriftArrow />
    {detailLevel === 'detail' && (
      <>
        <MiniChart />
        <DnDKitChipZone />
        <DriftOverlay />
        <ResponsePathCTAs />
      </>
    )}
  </div>
);
```

**Mode-lens behavior at L2** is today's: `capability` shows Cpk badge, `defect` shows defect count, `yamazumi` shows balance bars, etc. The existing `@variscout/core/strategy` pattern continues; no change required.

### 5.3. L3 — Local Mechanism view

**Trigger:** `zoom ≥ LOD_THRESHOLDS.l2ToL3`. **Requires `viewport.focalStepId`** (the step at the viewport centroid is auto-set when crossing into L3, by computing which step's card center is nearest to the viewport center).

**Archetype-aware via existing b0/b1 routing** (per Decision #5, see `docs/07-decisions/adr-076-frame-b0-lightweight-render.md`):

#### 5.3.a. Investigator-mode L3 (b0)

**Renders** the focal step's:

- **Column-level mini-charts** — one boxplot/I-chart per column linked to this step (reuses `useMiniChartData` + `MiniIChart` / `MiniBoxplot` from PR-RPS-3)
- **Embedded Evidence Map factor-network** scoped to this step's columns (`packages/charts/src/EvidenceMap/` mounted via the canvas-shape frame; same component, same computed data — ADR-074-compliant component reuse)
- **Wall mirror filtered to this step's hypotheses** — only Hypothesis cards whose `condition` predicate references this step's columns appear (reuses `WallCanvas` with a new `filterByStepId` prop)
- **Response-path CTAs** scoped to column-mechanisms (e.g., "Quick Action on operator-shift mismatch" instead of "Quick Action on Filling step")

**Per Decision #6: factor-contribution rankings (η², ANOVA, etc.) require active investigation context** (an open Question or Hypothesis in `useInvestigationStore`). Without one, L3 shows column mini-charts only — no analytical attribution claims. This honors ADR-053 (question-driven EDA) and `feedback_contribution_not_causation`.

**Click → opens the owner surface full-screen:**

- Click on Evidence Map node → opens Evidence Map full-screen at that factor
- Click on Wall mirror card → opens Investigation Wall at that hypothesis (existing 8e behavior)
- Click on column mini-chart → opens column-detail panel (existing AnalysisPanel)

#### 5.3.b. Author-mode L3 (b1)

**Renders** the focal step's FRAME column-assignment UI (existing `packages/ui/src/components/Frame/` column-chip placement). The step expands to show:

- Available unassigned columns from the snapshot
- Currently assigned input/output columns for this step
- dnd-kit chip drag-to-assign

**No factor-network / no Wall mirror in author-mode** — author-mode is about wiring the map, not investigating it.

**The b0 / b1 archetype is read from `CanvasWorkspace`'s existing app session state.** No new routing primitive is introduced.

## 6. Gestures + input layering

### 6.1. Gesture vocabulary (Map convention, Decision #9)

| Gesture                     | Action                                                                      |
| --------------------------- | --------------------------------------------------------------------------- |
| Drag on empty area          | Pan                                                                         |
| Two-finger trackpad pan     | Pan                                                                         |
| Mouse wheel (no modifier)   | Zoom (centered at cursor)                                                   |
| Pinch (touch)               | Zoom (centered at pinch point)                                              |
| `Cmd+1` / `Cmd+2` / `Cmd+3` | Jump to L1 / L2 / L3 (power-user shortcut)                                  |
| `Cmd+0`                     | Fit-to-content for current level                                            |
| Click on step card          | Open drill-down panel (existing behavior)                                   |
| Drag on step card           | Move card (existing behavior — pointer-down on card captures, not viewport) |
| `Escape`                    | Reset focal step / exit L3 / cancel active tool                             |

**`touch-action: none`** is set on the canvas viewport wrapper to prevent browser default pinch-zoom from competing with d3-zoom's handler. The page's other content (nav, sidebars) keeps default `touch-action`.

### 6.2. Input layer precedence

With 8f, the Canvas has **four input layers**, stacked top-down:

| Layer                                                        | Captures                                                             | Precedence                                                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Active tool** (PR8 8d hypothesis-arrow draw, future tools) | Pointer-drag gestures when tool is active                            | Highest — tool's gesture handler wraps the viewport                                                                    |
| **Step card content**                                        | Click-on-card, dnd-kit drag-on-card, scroll within tall card content | Pointer-down on a card _stops propagation_ to viewport pan                                                             |
| **Wall mirror overlay** (PR8 8e)                             | Click-to-drill into Wall destination                                 | Receives clicks not consumed by Active tool; `pointer-events: none` while draw-hypothesis tool is active (8e existing) |
| **Canvas viewport** (NEW)                                    | Wheel, pinch, drag on empty area (NOT on cards or Wall mirror cards) | Lowest — receives only events that fall through to the background                                                      |

**Concrete rules:**

- **No tool active:** wheel + pinch + drag-on-empty → viewport. Click/drag-on-card → card. Click-on-Wall-mirror-card → Wall destination.
- **Hypothesis-arrow draw tool active (PR8 8d):** pointer-drag → tool gesture handler. Wheel + pinch still go to viewport (zooming while drawing an arrow is OK). Wall mirror gets `pointer-events: none` (existing 8e rule).
- **At L3:** click inside the focal step's factor network → opens Evidence Map at that factor. Wheel zoom-out → viewport-driven; smoothly transitions back through L2 to L1 if user keeps scrolling out.

### 6.3. Click vs drag deadband

Click-vs-drag threshold: **6 CSS pixels** of pointer movement. Below = click; above = drag. Standard across Figma, Miro, design tools.

## 7. Mobile fallback (<768px) — per Decision #10

Pan/zoom is a desktop/tablet affordance. On phone-width screens, the Canvas viewport is **replaced** with a sequential level-picker UI:

```
┌────────────────────────────────┐
│  [System | Process | Step]     │  ← segmented control (top of screen)
│                                │
│  Selected level renders here   │
│  (full-screen, no pan/zoom).   │
└────────────────────────────────┘
```

- **System tab:** L1 outcome panel (single screen, scroll if content overflows vertically)
- **Process tab:** L2 DOM grid (vertical scroll through step cards — today's mobile behavior is preserved)
- **Step tab:** L3 view. If `viewport.focalStepId` is set, renders directly. Else shows a step list ("Pick a step to view"); tapping a step renders L3 for that step.

The segmented control reads/writes `currentLevel` in the same `useCanvasViewportStore`. Switching tabs is identical to a Cmd+1/2/3 on desktop — same state mutation, different UI affordance.

**Why ≥768px vs <768px is the right break:** matches the 8e Q6 precedent for the Wall overlay mobile fallback. Industry consensus across Miro, FigJam, Mural, Power Apps. Tablets in landscape (≥768px) get full pan/zoom with touch gestures; phones drop to sequential views.

**Touch-gesture inheritance on tablet:** at 768–1024px the viewport uses d3-zoom's touch handlers (pinch zoom, two-finger pan). No tablet-specific code; same gesture vocabulary as desktop.

## 8. State, persistence, deep-link

### 8.1. State layer (Decision #11)

- **`useCanvasViewportStore`** — annotation-per-project layer, with viewport records keyed by `ProcessHubId` (`viewports: Record<ProcessHubId, CanvasViewport>`). Generalizes today's `useWallLayoutStore` into Hub-scoped viewport records. Per-Hub team-shared. Persists via the same Dexie + Blob Storage path that PR8 8e established for wallLayoutStore (PWA = IndexedDB only; Azure = IndexedDB + Blob sync with ETag per ADR-079).
- Pre-8f was a project-keyed singleton; 8f promotes the key to Hub. This is a shape change, not a rename: pre-8f snapshots are not forward-migratable because one project row cannot be reshaped into N Hub rows without inventing the missing 1:N mapping.
- **`lensId`** stays in `usePreferencesStore` (annotation-per-user). Switching lens does not affect the viewport state; switching level does not affect the lens.
- **Selection state** (which card is "focused" for tab/keyboard) stays transient inside the viewport store but **is intentionally OMITTED from the persisted snapshot** — same precedent as wallLayoutStore's selection field per the 2026-05-08 decision-log entry.

### 8.2. Migration: wallLayoutStore → hub-keyed canvasViewportStore (Decision #11)

Per `feedback_no_backcompat_clean_architecture`: clean shape change in one PR. No legacy alias. All call sites refactored same-PR.

- Move `packages/stores/src/wallLayoutStore.ts` → `packages/stores/src/canvasViewportStore.ts`
- Rename store name `useWallLayoutStore` → `useCanvasViewportStore`
- Promote persisted state from a project-keyed singleton to `viewports[hubId]`
- Add new fields: `currentLevel`, `focalStepId`
- Keep existing fields: `zoom`, `pan`, `nodePositions`, `groupByTributary` (all still serve the Wall renderer)
- Update all consumers: `WallCanvas.tsx`, `CanvasWallOverlay.tsx`, any tests
- Dexie migration: clean-break drop of the pre-8f `variscout-wall-layout` table on first read post-deploy, then recreate snapshots keyed by `hubId` instead of `projectId`; do not attempt to reshape pre-8f project-singleton snapshots. Data loss is limited to Wall node positions, persisted zoom/pan, and `groupByTributary` for existing Walls only; no domain data is lost because domain state lives in `investigationStore` / `processHubs`. This follows the Azure Dexie v9→v10 clean-break precedent from PR-RPS-5.

### 8.3. Deep-link (Decision #12)

URL contributes one query parameter: `?level=l1|l2|l3`. Zoom and pan are NOT in the URL.

- Opening `https://app/.../hub/123?level=l1` sets `currentLevel = 'l1'`, viewport zoom + pan resolve to fit-to-content for L1 (the outcome panel renders centered)
- Same for `level=l2` (fits all steps) and `level=l3` (requires also `?focalStep=<id>`; without it, redirects to L2)
- Missing `?level` → falls back to last-saved-state or L2 default (per Decision #13)

Rationale: pixel-exact zoom + pan permalinks rot fast (Hub data changes, layout shifts); shareable level-permalinks are the actual user need.

### 8.4. Initial viewport on mount (Decision #13)

```ts
function getInitialViewport(hubId: ProcessHubId): CanvasViewport {
  const persisted = useCanvasViewportStore.getState().viewports[hubId];
  if (persisted) return persisted;
  return { zoom: 1.0, pan: { x: 0, y: 0 }, currentLevel: 'l2' };
  // L2 fit-to-content runs after first render via ResizeObserver
}
```

URL `?level=` overrides the persisted state if present. After mount, `fitToContent()` runs for the resolved level.

## 9. ADR-074 amendment (Decision #4)

ADR-074 (`docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md`) currently states: "Each surface owns exactly one level... and lenses the other two by linking to the surface that owns each level — never by re-rendering or recomputing."

8f amends this to recognize **Canvas as the viewport surface** spanning all three levels:

> **Canvas is the viewport surface** — the visual home for scan + navigation across all three levels. It mounts level-specific views by **embedding owner-surface components** (importing the React component + the same computed data), not by re-rendering or recomputing. Owner surfaces — SCOUT (L1), Evidence Map + Wall (L3) — remain analytical engines and deep-work destinations. Clicking inside a Canvas-at-Lx view opens the owner surface full-screen for the same scope.
>
> The "no re-rendering / no recomputing" rule still binds: Canvas-L1 imports `<DashboardBase/>` (or a leaner export) and the SCOUT-computed outcome stats; Canvas-L3 imports `<EvidenceMapBase/>` and `<WallCanvas/>` filtered by step. Canvas does NOT implement its own outcome analytics or its own factor-network rendering.

ADR-081 (separate file) codifies this amendment alongside the 8f architecture. ADR-074's text gets an `## Amendment — 2026-05-XX` block per the same-week-revision convention (`feedback_starlight_frontmatter` + `project_adr_amendment_convention`).

## 10. Mode-lens × level matrix

5 modes × 3 levels = 15 cells. ~13 are sensible; 2 are intentionally disabled.

| Mode \ Level     | L1 — System / Outcome                                              | L2 — Process Flow                            | L3 — Local Mechanism                                                                  |
| ---------------- | ------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| **default**      | Outcome distribution + drift + capability + spec                   | Today's canvas (mini-chart per step)         | Column-level mini-charts (boxplot / I-chart per input column)                         |
| **capability**   | Outcome Cp/Cpk/Pp/Ppk against outcome spec                         | Step Cpk badge (today's behavior)            | Factor contribution (η², ranked) — **requires investigation context** per Decision #6 |
| **defect**       | Total defect rate over time + drift                                | Per-step defect Pareto (today's PR8 8b)      | Column-category defect Pareto                                                         |
| **performance**  | Outcome-level throughput / cycle time aggregate                    | Per-step cycle time                          | Cycle-time breakdown by column-category (e.g., by operator, by shift)                 |
| **yamazumi**     | (disabled — yamazumi is cross-step balance, not an outcome metric) | Today's yamazumi balance bars                | Per-step balance by column-category                                                   |
| **process-flow** | (disabled — flow is a structural read, not an outcome at L1)       | Plain flow rendering (no per-card analytics) | (disabled — flow doesn't decompose into column-network)                               |

Disabled cells render an inline empty-state with copy: `"<lens> isn't available at <level> — try <suggested level>."` Existing `@variscout/core/strategy` pattern extends with a `level` parameter to its `isLensValidAt(lens, level)` predicate.

## 11. Out of scope for V1

- **Multi-Hub portfolio view** — Azure-tier named-future per vision §7. Cross-Hub aggregation forbidden by ADR-073 anyway.
- **Cross-Hub statistical roll-up** of any kind.
- **WebGL / Canvas-element rendering.** DOM + SVG only — the only places we'd reach for WebGL are minimap or 10,000-node graphs, neither in scope.
- **Smart edge routing in Canvas** (defer to V2 if step-arrows become illegible at L2 overview).
- **Minimap.** Could land in V2 if user feedback requests; not in V1.
- **Best-subsets-inline at L3.** Already deferred V2 per RPS V1 D12.
- **Real-time multi-user cursor presence on the Canvas viewport.** A separate feature on Azure tier; pan/zoom collaboration today is "last-write-wins" per wallLayoutStore precedent.
- **Pinch-zoom on canvas backgrounds inside step cards.** Cards continue to absorb pointer events; their internal content doesn't get pinched.
- **L1 + L3 in mobile fullness.** Mobile sequential picker (§7) is the V1 mobile shape; richer mobile L1/L3 deferred if friction surfaces.

## 12. Locked decisions log

Brainstorm session 2026-05-13. Each decision links to a § above where applicable.

1. **L1 on Canvas:** slim canvas-native outcome panel (within-Hub only — no multi-Hub portfolio). Click → SCOUT full dashboard. (§5.1)
2. **L3 on Canvas:** mounts owner-surface components (Evidence Map factor-network + Wall mirror) scoped to one step's columns. Click → full Evidence Map or Wall. (§5.3)
3. **Zoom semantics:** continuous scaling within L2 (overview ↔ detail gradient); discrete LOD swaps at L1 (~0.3) and L3 (~2.0) thresholds. Google-Maps-style. (§4.5–4.6)
4. **ADR-074 amendment for 8f:** Canvas is the viewport surface; it embeds owner-surface components, doesn't re-render. Owner surfaces remain analytical engines + deep-work destinations. (§9)
5. **L3 archetype-aware:** investigator-L3 (b0) = Evidence Map + Wall mirror; author-L3 (b1) = FRAME column-assignment. Routed by existing `CanvasWorkspace` b0/b1 state. (§5.3)
6. **L3 factor-contribution view requires active investigation context.** Without one, L3 shows column mini-charts only — no η² rankings, no factor-attribution claims. Honors ADR-053 + `feedback_contribution_not_causation`. (§5.3.a)
7. **L1 surfaces no per-card response-path CTAs.** Inbox digest + drift alerts only. CTAs at L2/L3 only. (§5.1)
8. **L2 continuous-detail gradient (overview ↔ detail) is in scope.** Justified by 30+ step Hubs + Google Maps precedent. (§4.6, §5.2)
9. **Gesture model: Map convention.** Drag-empty=pan; wheel/pinch=zoom; Cmd+1/2/3=level; Cmd+0=fit; click-on-card=drill-down. (§6.1)
10. **Mobile (<768px): sequential level views with segmented `[System | Process | Step]` picker.** Per 8e Q6 precedent. (§7)
11. **State layer: annotation-per-project, keyed by Hub** (clean shape change from flat per-project singleton to per-Hub keyed map; pre-8f Dexie rows dropped; no legacy alias). Lens stays in `usePreferencesStore`. (§8.1–8.2)
12. **Deep-link: `?level=l1|l2|l3` only.** Zoom + pan resolve to fit-to-content. (§8.3)
13. **Initial mount: last-saved state if exists, else L2 fit-to-content.** URL `?level=` overrides. (§8.4)

Prelude decisions locked before the brainstorm (in `~/.claude/plans/we-have-implemented-now-wise-kitten.md`):

- **Architecture:** unified `useCanvasViewportStore` + d3-zoom input driver + LOD switcher + pluggable renderers (Wall keeps SVG, Canvas keeps DOM, new L1/L3 renderers DOM-native). World-class pattern; industry precedents Figma, Google Maps, VS Code, Notion, Visx, Microsoft Surface Semantic Zoom.
- **Tech stack:** d3-zoom (3 KB gz) as the only new dependency. No react-flow. No new render libraries.
- **Phase 0 skipped:** vision §5.4 is the last unmet commitment; friction validation unnecessary.

## 13. What ADR-081 codifies vs what this spec codifies

**ADR-081 (irreversible architecture):**

- d3-zoom as the only viewport dependency
- Unified-state-pluggable-renderers shape
- Canvas as the viewport surface (ADR-074 amendment)
- ADR-073-compliant L1 (no cross-step rollup; outcome reads its own series against its own spec)
- Within-Hub scope (multi-Hub portfolio explicitly out)

**This spec (reversible UX details):**

- Exact LOD threshold values (`0.3` / `2.0` starting points; chrome-walk-tunable)
- LOD transition animation timing (150ms cross-fade)
- L2 overview ↔ detail field cutoff (`zoom < 1.0` shrink, `≥ 1.0` full)
- L1 panel exact field list (outcome distribution + drift + capability + Inbox digest + active-investigations summary)
- Mode-lens × level matrix (which cells render what)
- Mobile breakpoint (`<768px`)
- Gesture vocabulary (Map convention specifics, deadband 6px, `Cmd+0/1/2/3` shortcuts)
- Click-vs-drag deadband (6px)
- Coord-space utility shape
- URL query-param naming (`?level=`)

## 14. Implementation slicing (preview — full plan in Phase 4)

The implementation plan (`docs/superpowers/plans/2026-05-XX-canvas-viewport-architecture.md`, written next session via `superpowers:writing-plans`) will slice this into ~6 PRs on branch `canvas-viewport-8f`. Rough order, locked by spec dependencies:

| #   | PR                                                                                                                                                                                                                                                  | Tasks | Size |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- |
| 1   | **Foundation:** shape-change `wallLayoutStore` → Hub-keyed `useCanvasViewportStore`, add `currentLevel + focalStepId` fields, clean-break Dexie persistence. Wall continues to work with Hub-scoped viewport state.                                 | 6–8   | M    |
| 2   | **Input layer:** wire d3-zoom into a `CanvasViewport` primitive in `packages/ui/src/components/Canvas/internal/`. Wall gets wheel-zoom for free (currently missing). Canvas-L2 gets pan/zoom on its DOM grid wrapper. Coord-space utility lands.    | 6–8   | M    |
| 3   | **LOD switcher + L2 continuous-detail gradient:** `LODSwitcher` primitive; L1 + L3 are placeholder "Coming next" panels; L2 continuous-detail rendering inside `CanvasStepCard`; Cmd+1/2/3 + Cmd+0 keyboard shortcuts; mobile sequential-picker UI. | 6–8   | M    |
| 4   | **L3 investigator-mode:** embed Evidence Map per-step factor network + Wall mirror filtered by step; column mini-charts; ADR-053-anchored factor-contribution gating; response-path CTAs at column-mechanism granularity.                           | 6–8   | M-L  |
| 5   | **L3 author-mode:** FRAME column-assignment UI for the focal step inside Canvas; b0/b1 routing extends to L3.                                                                                                                                       | 4–6   | S-M  |
| 6   | **L1 + integration polish:** slim L1 outcome panel; mode-lens × level matrix complete + disabled-cell empty states; ADR-074 amendment + ADR-081 land; deep-link wiring; --chrome walks per level; mobile sequential picker QA.                      | 6–8   | M    |

Total ~38–46 tasks across 6 PRs. Subagent-driven per `feedback_subagent_driven_default`. Sonnet workhorse + Opus final review.

## 15. Verification (end-of-workstream gate)

- Can a user pan/zoom from L1 → L2 → L3 without a level-picker control? ✓
- Mode lens stays selected across level transitions? ✓ (separate store)
- ADR-073 not violated at L1? ✓ (single-outcome series; no rollup)
- ADR-053 not violated at L3? ✓ (factor view requires active investigation)
- Mobile sequential picker works at <768px? ✓
- Wall mirror (PR8 8e) continues to work at L2? ✓ (shares the store; SVG renderer untouched)
- Hypothesis-arrow draw tool (PR8 8d) continues to work at L2? ✓ (input-layer precedence preserves it)
- `bash scripts/pr-ready-check.sh` green on every PR? ✓
- `pnpm --filter @variscout/ui build` green on every PR? ✓
- Final Opus code-review pass on PR6 before squash-merge? ✓

End-of-workstream: `docs/roadmap.md` §1 gets an "8f canvas viewport SHIPPED" entry; `docs/decision-log.md` gets the pinned-decision; ADR-081 + ADR-074 amendment land.
