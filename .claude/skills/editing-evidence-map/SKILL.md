---
name: editing-evidence-map
description: Use when editing packages/charts/src/EvidenceMap/ or apps/azure/src/components/editor/InvestigationMapView.tsx. 3-layer SVG architecture (statistical / investigation / synthesis), props-based (no context), interactions (click, right-click, context menus), edge detail + promote-to-causal, popout sync via usePopoutChannel, mobile patterns (enableZoom, EdgeSheet).
---

# Editing Evidence Map

## When this skill applies

Use this skill when editing `packages/charts/src/EvidenceMap/`, `apps/azure/src/components/editor/InvestigationMapView.tsx`, or any code that wires the Evidence Map into a workspace (pop-out routing, mobile carousel, report timeline). Also applies when changing the layout engine (`packages/core/src/stats/evidenceMapLayout.ts`) or the data hook (`packages/hooks/src/useEvidenceMapData.ts`).

## Core patterns

### 3-layer SVG architecture

The Evidence Map is a single visx SVG canvas in `EvidenceMapBase` with three composited `<g>` layers rendered in order:

**Layer 1 — Statistical** (`StatisticalLayer.tsx`): factor nodes positioned by R²adj, outcome node at center, five relationship edge types (Independent/Overlapping/Synergistic/Interactive/Redundant), equation bar. Rendered in both PWA and Azure. Gated on `bestSubsets.subsets[0].rSquaredAdj > 0.05`.

**Layer 2 — Investigation** (`InvestigationLayer.tsx`): CausalLink directed edges between factors, evidence badges (D=data / G=gemba / E=expert), gap markers on unvalidated links, question/finding count indicators. **Azure only.** Renders when `causalEdges.length > 0`.

**Layer 3 — Synthesis** (`SynthesisLayer.tsx`): SuspectedCause hub convergence zones with highlighted regions, hub name labels with status (suspected/confirmed), projection annotations. **Azure only.** Renders when `convergencePoints.length > 0`.

### Props-based, no context

`EvidenceMapBase` takes all data via props — no store access, no React context. Pattern identical to `IChartBase`, `BoxplotBase`. Theme handled via `useChartTheme` hook (call it in the host component, pass `isDark` to `EvidenceMapBase`). Data colors use `chartColors`/`chromeColors` constants from `packages/charts/src/colors.ts` — never hardcode hex.

### Layout engine

`computeEvidenceMapLayout()` lives in `packages/core/src/stats/evidenceMapLayout.ts`. Pure function: same inputs → same layout every time. Outcome at center, factors in radial layout with distance inverse to R²adj. Responsive margins from `getResponsiveMargins()` and `getResponsiveFonts()` from `@variscout/core/responsive`. Labels truncate and minor edges hide at widths < 400px. User-dragged node positions override the deterministic layout (persisted per project).

### Data hook

`useEvidenceMapData` in `packages/hooks/src/useEvidenceMapData.ts` reads from `investigationStore` (causal links, questions, findings, suspected causes) and `useAsyncStats` output (best subsets, main effects, interactions), then returns clean props for `EvidenceMapBase`. Call this in the host component — not inside `EvidenceMapBase`.

### File structure

```
packages/charts/src/EvidenceMap/
├── EvidenceMap.tsx          # Responsive wrapper (withParentSize)
├── EvidenceMapBase.tsx      # SVG canvas + layer composition
├── StatisticalLayer.tsx     # Layer 1
├── InvestigationLayer.tsx   # Layer 2
├── SynthesisLayer.tsx       # Layer 3
├── FactorNode.tsx
├── RelationshipEdge.tsx
├── CausalEdge.tsx
└── types.ts
```

## Interactions

### Click vs right-click on edges (do not swap)

**Statistical relationship edge:**
- Click (`onEdgeClick`) → opens `EdgeDetailCard` anchored near edge midpoint. Shows header (`factorA ↔ factorB`), R²adj stats, 150px `EdgeMiniChart`, and three action buttons: "Promote to causal link", "Ask CoScout", "Ask question".
- Right-click (`onEdgeContextMenu`) → opens `EdgeContextMenu` at cursor position with the same three actions as menu items.

**Causal link edge (Layer 2):**
- Click (`onCausalEdgeClick`) → opens causal edge detail card (separate state: `selectedEdgeId`). Do not reuse `selectedRelEdge`.

### Promote-to-causal flow

"Promote to causal link" in the edge detail card or edge context menu calls `handlePromoteToCausal(factorA, factorB)` in `InvestigationMapView`. This sets `causalLinkDraft` state to pre-fill `CausalLinkCreator` modal with source/target factors and `evidenceType: 'data'`. The `CausalLinkCreator` already has the direction picker and why-statement field — no new modal needed for promotion.

### SweetSpotCard

`SweetSpotCard` shows the best-performing factor level (highest or lowest mean relative to target). Appears on factor node hover/click in the statistical layer. Rendered in `InvestigationMapView` as a floating overlay positioned near the node. Part of the mutual exclusion set (opening it closes other overlays).

### Mutual exclusion

Only one overlay at a time: node context menu, edge context menu, relationship edge detail card, causal edge detail card, SweetSpotCard. Opening any one must close the others. In `InvestigationMapView`, each handler resets the other three state variables to `null`.

### EdgeContextMenu component

Lives in `packages/ui/src/components/EvidenceMapContextMenu/`. Props:

```typescript
interface EdgeContextMenuProps {
  factorA: string;
  factorB: string;
  x: number;
  y: number;
  onAskQuestion: (factorA: string, factorB: string) => void;
  onAskCoScout: (factorA: string, factorB: string) => void;
  onPromoteToCausal: (factorA: string, factorB: string) => void;
  onClose: () => void;
}
```

Same pattern as `NodeContextMenu`: fixed position, viewport-clamped, auto-focus first item, Escape to close, backdrop click to close.

### EdgeMiniChart

`packages/ui/src/components/EvidenceMap/EdgeMiniChart.tsx`. Renders at 150px height. Selects chart type from factor types:
- categorical × categorical → grouped boxplot
- continuous × continuous → scatter with regression line
- mixed → boxplot (categorical as grouping)

Simplified chrome: no axis labels, minimal ticks (3-4), no legend, read-only (no click handlers).

### Node context menu

Right-click a factor node: "Ask a question about [Factor]", "Create finding", "Ask CoScout", "Drill down to [Factor]". Handled by `NodeContextMenu` in `packages/ui/src/components/EvidenceMapContextMenu/`.

## Pop-out sync

Use `usePopoutChannel` from `@variscout/hooks` — do not implement BroadcastChannel directly.

```typescript
const { sendMessage, onMessage } = usePopoutChannel({
  windowId: 'evidence-map', // or 'main'
  channelName: 'variscout-sync',
  onInitialHydration: (data) => { /* apply localStorage snapshot */ },
});
```

**How it works:**
- On pop-out open: main window writes a localStorage snapshot (initial state hydration).
- The pop-out reads that snapshot on mount before the channel is ready.
- Ongoing sync uses BroadcastChannel (bidirectional, all windows connected).
- Messages carry `source` and optional `target` for routing. Store mutations use `target: 'all'`; CoScout action proposals for map tools use `target: 'evidence-map'`.
- Each window sends a periodic heartbeat; the main window tracks active pop-outs and restores the mini-map if the pop-out window closes.

**Message types** (defined in `popoutMessages.ts`):
- `store-mutation` — entity CRUD propagation
- `factor-selected` — highlight a factor across windows
- `filter-changed` — apply active filters in all windows
- `visual-grounding` — REF marker activation
- `action-proposal` — CoScout tool proposal routing
- `heartbeat` / `window-closing` — lifecycle

Pop-out route: `?view=evidence-map` query param (same pattern as `?view=findings`).

## Mobile patterns

Mobile Evidence Map is read-only. Causal link creation, pop-out, and chart panel slide-in are desktop-only.

### enableZoom

Pass `enableZoom={true}` on mobile (<640px). This wraps `EvidenceMapBase` in `@visx/zoom`'s `<Zoom>` component (already in the visx suite, no new dep). Supports pinch-to-zoom + pan, scale range 0.5x–3x.

### compact mode

Pass `compact={true}` on mobile. Hides labels on factor nodes until zoom > 1.5x. Enlarges touch targets to 44px. Nodes render at 20px visual radius with a larger transparent hit area.

### Progressive label disclosure by factor count

| Factors | Labels             |
|---------|--------------------|
| 3–4     | Always visible     |
| 5–7     | Truncated (8 chars + …) |
| 8–10    | Hidden until zoom > 1.5x |

### EvidenceMapEdgeSheet

`packages/ui/src/components/EvidenceMapSheet/EvidenceMapEdgeSheet.tsx` — bottom sheet for edge interactions on mobile. Use `onEdgeTap` prop on `EvidenceMapBase` to trigger it. The sheet has two action buttons: "Promote to causal link" (primary, blue) and "Ask CoScout" (secondary). Props to add when wiring:

```typescript
onPromoteToCausal?: (factorA: string, factorB: string) => void;
onAskCoScout?: (factorA: string, factorB: string) => void;
```

Node taps use `onNodeTap` → `EvidenceMapNodeSheet` bottom sheet (existing). Drill Down and Ask CoScout buttons are already wired.

### What is NOT available on mobile

- Causal link creation (Layer 2 editing)
- Pop-out window (`window.open()` unreliable on iOS/Android)
- Mini-map
- Investigation workspace centerpiece layout
- Timeline scrubber (report replay)
- Chart panel slide-in

Layers 2 and 3 render on mobile if the data exists but cannot be edited.

## Gotchas

1. **Layers 2 and 3 are Azure-only.** In PWA builds, `causalEdges` and `convergencePoints` are always empty — `InvestigationLayer` and `SynthesisLayer` never render. Do not reference `CausalLink` entities or hub convergence zones in PWA component code. The PWA host passes Layer 1 data only.

2. **Click vs right-click on edges have different UX contracts — do not swap them.** Click = `onEdgeClick` = edge detail card (floating anchored card with mini chart). Right-click = `onEdgeContextMenu` = context menu at cursor position (list of actions). Swapping these breaks the interaction model documented in the spec and will confuse trained users.

3. **EvidenceMapBase is props-based — it has no store subscription.** It cannot self-hydrate. Pass data explicitly via `useEvidenceMapData` in the host (e.g., `InvestigationMapView`). If you add a new data requirement, add it to `useEvidenceMapData`'s return type and thread it through the host props — do not add `useStore()` calls inside `EvidenceMapBase` or its sub-layers.

4. **Pop-out sync requires `usePopoutChannel` — do not implement BroadcastChannel directly.** The hook handles: Safari fallback, message filtering by `target`, localStorage hydration on mount, heartbeat, and `window-closing` lifecycle. Bypassing it will break initial hydration and multi-window routing.

5. **Relationship type simplification at the display layer.** The stats engine returns 5 types (Independent, Overlapping, Synergistic, Interactive, Redundant). The UI maps these to 3 user-facing labels (Independent, Overlap, Interact) via `mapRelationshipType()` in `@variscout/core/stats`. Do not expose the 5 engine types directly in UI strings or edge labels — use the mapping function.

6. **`wouldCreateCycle()` lives in `@variscout/core/stats` (`causalGraph.ts`), not in findings.** Call it before every `addCausalLink` mutation. The store action `addCausalLink` already does this check and returns `null` on cycle; do not bypass the store and write to `causalLinks` directly.

## Reference

- `docs/superpowers/specs/2026-04-05-evidence-map-design.md` — 3-layer architecture, CausalLink data model, persistence fix, tier matrix, implementation phases
- `docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md` — Evidence Map as analysis spine: phase-by-phase journey integration, PI Panel ↔ map deep linking, Investigation workspace layout
- `docs/superpowers/specs/2026-04-07-evidence-map-edge-interactions-design.md` — Edge interactions: click/right-click contracts, EdgeDetailCard, EdgeContextMenu, EdgeMiniChart, promote-to-causal flow, mobile EdgeSheet enhancements
- `packages/charts/src/EvidenceMap/` — component suite (all 3 layers, ~959 lines)
- `packages/core/src/stats/evidenceMapLayout.ts` — deterministic layout algorithm (~419 lines)
- `packages/core/src/stats/causalGraph.ts` — `wouldCreateCycle`, `classifyRelationship`, graph utilities
- `packages/hooks/src/useEvidenceMapData.ts` — data hook (reads stores, computes layout, returns props)
- `packages/hooks/src/usePopoutChannel.ts` — BroadcastChannel + localStorage hydration (~140 lines)
- `packages/hooks/src/useEvidenceMapTimeline.ts` — report replay animation hook (~312 lines)
- `apps/azure/src/components/editor/InvestigationMapView.tsx` — host integration, all local state, handlers
