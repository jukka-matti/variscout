---
title: Evidence Map Edge Interactions — Statistical Edge → Investigation Bridge
audience: [developer]
category: architecture
status: delivered
related: [evidence-map, evidence-map-spine, investigation, coscout, causal-link]
---

# Evidence Map Edge Interactions

Make statistical relationship edges on the Evidence Map interactive — the bridge from "the data says these correlate" (Layer 1) to "I believe this drives that" (Layer 2). This is Spec A from the two-spec approach; Spec B (OLS interaction terms for continuous factors) is a separate future effort.

## Problem

The Evidence Map shows statistical relationship edges between factors (R²adj, ΔR², relationship types), but these edges are passive. Clicking does nothing on desktop; mobile shows a read-only info card. The analyst sees a thick purple "Interact" edge between Supplier and Fill Head but has no way to act on it — they must mentally bridge to the causal layer, questions tab, or CoScout.

Meanwhile, factor _nodes_ have a full interaction surface: click → highlight + PI Panel scroll, right-click → context menu with 5 actions, mobile → bottom sheet with Drill Down + Ask CoScout.

The edge is the most important moment in the investigation — it's where correlation becomes hypothesis. Making that transition frictionless is the feature.

## Design Principles

- **Contribution, not causation** — VariScout identifies factors driving variation, not root causes. Edge interactions show statistical contribution; causal links are the analyst's _hypotheses_, not confirmed causes.
- **Progressive disclosure in place** — hover → tooltip, click → anchored card, action → execute without leaving the map. No navigation away, no modal switches.
- **Same patterns, new surfaces** — edge interactions follow the exact same architecture as existing node interactions: individual callback props, local transient state, panelsStore for cross-panel coordination.

## 1. Relationship Type Simplification

The stats engine computes 5 relationship types from R²adj comparison. The UI maps these to 3 user-facing types with actionable guidance:

| Engine Type | UI Label        | Color                              | Guidance                                            |
| ----------- | --------------- | ---------------------------------- | --------------------------------------------------- |
| Interactive | **Interact**    | Purple (`chartColors.cpPotential`) | "Optimize together"                                 |
| Synergistic | **Interact**    | Purple                             | "Optimize together"                                 |
| Overlapping | **Overlap**     | Amber (`chartColors.warning`)      | "Shared variation — investigate what connects them" |
| Independent | **Independent** | Grey (chrome)                      | "Optimize separately"                               |
| Redundant   | **Independent** | Grey (chrome)                      | "Optimize separately"                               |

The mapping function lives in `@variscout/core` (pure logic, no React). The engine types remain unchanged — this is a display-layer mapping only.

## 2. Edge Detail Card (Desktop)

### Trigger

Click a statistical relationship edge → floating card appears anchored near the edge midpoint, smart-positioned to avoid viewport clipping.

### Content

**Header:** `{factorA} ↔ {factorB}` + relationship type badge (Interact/Overlap/Independent)

**Stats row:** R²adj value, ΔR² if applicable, strength label (Strong ≥0.7 / Moderate ≥0.3 / Weak <0.3)

**Mini chart (150px tall, adaptive):**

- Categorical × Categorical → grouped boxplot
- Categorical × Continuous → boxplot faceted by category
- Continuous × Continuous → scatter plot with regression line
- Simplified chrome: no axis labels, minimal ticks, read-only (not interactive)
- Factor type classification from `bestSubsets.factorTypes`

**Action buttons (3):**

1. **"Promote to causal link"** — opens CausalLinkCreator modal with pre-filled from/to factors and evidenceType defaulting to `'data'` (statistical origin). The CausalLinkCreator already has the direction picker (drives/modulates/confounds) and why-statement field — no new UI needed for the promotion flow itself.
2. **"Ask CoScout"** — opens CoScout panel with pre-filled context: edge metadata (factors, R²adj, relationship type, ΔR²) injected into the prompt
3. **"Ask question"** — creates investigation question linked to both factors, auto-generated text: "What explains the {relationship type} between {factorA} and {factorB}?"

**Dismiss:** click outside, Escape key, or clicking another edge/node.

### State

- `selectedRelationshipEdge: { factorA, factorB } | null` — local state in InvestigationMapView
- Mutually exclusive with `selectedEdgeId` (causal edge detail) and `contextMenu`

## 3. Edge Context Menu (Desktop)

### Trigger

Right-click a statistical relationship edge → context menu appears at cursor position.

### Menu Items

1. **"Ask about {factorA} × {factorB}"** (MessageCircleQuestion icon) — creates investigation question
2. **"Ask CoScout about this relationship"** (Bot icon) — opens CoScout with edge context
3. **"Promote to causal link"** (Link icon) — opens CausalLinkCreator with pre-filled factors

### Component

`EdgeContextMenu` in `packages/ui/src/components/EvidenceMapContextMenu/`. Same pattern as `NodeContextMenu`: fixed position, viewport-clamped, auto-focus first item, Escape to close, backdrop click to close.

### Props

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

## 4. Mobile Edge Sheet Enhancement

### Current State

`EvidenceMapEdgeSheet` exists and is wired into `MobileChartCarousel`, but it's read-only — shows relationship type + strength with no action buttons. `EvidenceMapNodeSheet` has Drill Down + Ask CoScout buttons.

### Change

Add action buttons to `EvidenceMapEdgeSheet`, matching the desktop detail card:

1. **"Promote to causal link"** — primary action button (blue), opens CausalLinkCreator
2. **"Ask CoScout"** — secondary action button (grey), opens CoScout panel with edge context

### New Props

```typescript
// Added to existing EvidenceMapEdgeSheetProps
onPromoteToCausal?: (factorA: string, factorB: string) => void;
onAskCoScout?: (factorA: string, factorB: string) => void;
```

## 5. EvidenceMapBase Callback Addition

Add one new callback prop:

```typescript
// New prop on EvidenceMapBase
onEdgeContextMenu?: (factorA: string, factorB: string, clientX: number, clientY: number) => void;
```

Wired through `StatisticalLayer` → `RelationshipEdge`. The `RelationshipEdge` component adds an `onContextMenu` handler on its `<g>` element that calls `preventDefault()` and dispatches the callback.

The existing `onEdgeClick` prop is already defined and passed through — it will now be wired in `InvestigationMapView` to open the edge detail card.

## 6. InvestigationMapView Wiring

### New State

```typescript
// Local state additions
const [selectedRelEdge, setSelectedRelEdge] = useState<{ factorA: string; factorB: string } | null>(
  null
);
const [edgeContextMenu, setEdgeContextMenu] = useState<{
  factorA: string;
  factorB: string;
  x: number;
  y: number;
} | null>(null);
```

### New Handlers

```typescript
// Edge click → detail card
const handleEdgeClick = (factorA: string, factorB: string) => {
  setSelectedRelEdge({ factorA, factorB });
  setSelectedEdgeId(null); // close causal edge card
  setContextMenu(null); // close context menu
};

// Edge right-click → context menu
const handleEdgeContextMenu = (factorA: string, factorB: string, x: number, y: number) => {
  setEdgeContextMenu({ factorA, factorB, x, y });
  setSelectedRelEdge(null); // close detail card
  setContextMenu(null); // close node context menu
};

// Promote edge to causal link
const handlePromoteToCausal = (factorA: string, factorB: string) => {
  setCausalLinkDraft({ from: factorA, to: factorB });
  setSelectedRelEdge(null);
  setEdgeContextMenu(null);
};
```

### Mutual Exclusion

Only one overlay at a time: node context menu, edge context menu, relationship edge detail card, causal edge detail card, SweetSpotCard. Opening any one closes the others.

## 7. EdgeMiniChart Component

### Purpose

Adaptive 150px-tall chart that renders the appropriate visualization based on factor types.

### Location

`packages/ui/src/components/EvidenceMap/EdgeMiniChart.tsx`

### Props

```typescript
interface EdgeMiniChartProps {
  factorA: string;
  factorB: string;
  factorAType: 'categorical' | 'continuous';
  factorBType: 'categorical' | 'continuous';
  data: Array<Record<string, unknown>>; // filtered dataset
  outcomeColumn: string;
  width?: number; // default 260
  height?: number; // default 150
  isDark: boolean;
}
```

### Chart Type Selection

```typescript
function getChartType(aType: string, bType: string): 'boxplot' | 'scatter' {
  if (aType === 'categorical' && bType === 'categorical') return 'boxplot';
  if (aType === 'continuous' && bType === 'continuous') return 'scatter';
  // Mixed: show boxplot (categorical as grouping, continuous as Y-axis)
  return 'boxplot';
}
```

### Rendering

Uses existing chart base components (`BoxplotBase`, visx scatter) with simplified chrome:

- No axis labels
- Minimal tick marks (3-4 ticks)
- No legend
- Theme-aware via `useChartTheme`
- Read-only: no click handlers, no tooltips

## 8. CoScout Edge Context Integration

When "Ask CoScout" is triggered from an edge interaction, the CoScout panel opens with pre-filled context. The context injection uses the existing `aiStore` pattern:

```typescript
// Edge context for CoScout prompt
const edgeContext = {
  factorA: string;
  factorB: string;
  rSquaredAdj: number;
  relationshipType: 'interact' | 'overlap' | 'independent';
  deltaRSquared?: number;
  factorAType?: 'categorical' | 'continuous';
  factorBType?: 'categorical' | 'continuous';
};
```

The prompt template: "The Evidence Map shows {factorA} and {factorB} have a {relationshipType} relationship (R²adj = {rSquaredAdj}). What might explain this statistical relationship? Consider the process context and factor types."

This is injected as a user-initiated CoScout message with edge metadata context, following the existing `onAskCoScout` pattern used for factor nodes.

## 9. Component Summary

### New Components

| Component             | Location                                             | Purpose                                             |
| --------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `EdgeDetailCard`      | `packages/ui/src/components/EvidenceMap/`            | Floating card: header, stats, mini chart, 3 actions |
| `EdgeContextMenu`     | `packages/ui/src/components/EvidenceMapContextMenu/` | Right-click menu: 3 actions                         |
| `EdgeMiniChart`       | `packages/ui/src/components/EvidenceMap/`            | Adaptive 150px chart (boxplot or scatter)           |
| `mapRelationshipType` | `packages/core/src/stats/`                           | 5-type → 3-type UI mapping function                 |

### Modified Components

| Component              | Change                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| `EvidenceMapBase`      | Add `onEdgeContextMenu` callback prop                             |
| `RelationshipEdge`     | Add `onContextMenu` handler on `<g>` element                      |
| `InvestigationMapView` | Wire edge detail card, edge context menu, edge → causal promotion |
| `EvidenceMapEdgeSheet` | Add `onPromoteToCausal` + `onAskCoScout` action buttons           |

## 10. Future Connection: Data Collection Planning

During investigation, the analyst often sees an interesting relationship but realizes their current data doesn't show enough of the picture. The natural next step is to measure something new — add nozzle wear rate as a column, observe what happens during changeover, ask an engineer what differs between setups.

This doesn't require new analytical methods. The analyst collects new data, loads it into VariScout, and **the same four lenses do the rest** — ANOVA shows whether the new factor explains variation, boxplots show the distribution, and the Evidence Map recalculates with the new factor as a node. No hypothesis tests, no DOE — just more data through the same lens, more of the picture revealed.

The edge card's "Ask question" action captures what the analyst wants to understand next. That question becomes the reason they go measure something new. When the new data is loaded, the Evidence Map shows the answer. The existing data append flow and three evidence types (data/gemba/expert) already support this cycle.

## 11. What's NOT in Scope (this spec)

- **Continuous × continuous interaction terms in OLS** — requires design matrix changes (Spec B, future)
- **Factor double-click → chart overlay** — separate feature, independent of edge interactions
- **Question badges on edges** — edges don't own questions directly; questions are linked to factors
- **Edge hover tooltip** — the detail card on click provides this; hover tooltip can be added later as a progressive enhancement
- **SweetSpotCard for edges** — sweet spots are factor-level, not edge-level

## 11. Testing Strategy

### Unit Tests

- `EdgeDetailCard`: renders correct content for each relationship type, shows correct chart type based on factor types, action buttons dispatch correctly
- `EdgeContextMenu`: renders 3 menu items, keyboard navigation (ArrowDown/Up, Enter, Escape), viewport clamping
- `EdgeMiniChart`: selects boxplot for cat×cat, scatter for cont×cont, boxplot for mixed
- `mapRelationshipType`: maps all 5 engine types to 3 UI types correctly

### Integration Tests

- Edge click → detail card appears with correct R²adj and relationship type
- Edge right-click → context menu appears at cursor position
- "Promote to causal link" → CausalLinkCreator opens with pre-filled factors
- "Ask CoScout" → CoScout panel opens with edge context message
- Mutual exclusion: opening edge card closes node context menu and vice versa

### E2E Verification (via `claude --chrome`)

1. Load Coffee Moisture sample data
2. Navigate to Investigation workspace → Map view
3. Click a statistical edge → verify detail card appears with mini chart
4. Click "Promote to causal link" → verify CausalLinkCreator opens with correct factors
5. Confirm causal link → verify directed edge appears on map (Layer 2)

## 12. Analyst Journey (E2E)

### "Interact" Edge (the primary use case)

```
See thick purple edge → Click → Card: "Interact, R²adj = 0.42"
  → Mini chart shows interaction shape
  → "Promote to causal link" → Direction: Supplier → Fill Head
  → CausalLinkCreator: why-statement + evidence type
  → Causal edge appears on map (Layer 2, green arrow)
  → Factors may converge into SuspectedCause hub (Layer 3)
  → Hub drives HMW brainstorm → Improvement action
  → PDCA cycle
```

### "Overlap" Edge

```
See amber dashed edge → Click → Card: "Overlap, shared 3%"
  → Mini chart shows shared variance
  → "Ask CoScout" → "What connects Shift and Temperature?"
  → CoScout suggests upstream mechanism
  → Analyst promotes to causal link with why-statement
  → Or creates investigation question for gemba validation
```

### "Independent" Edge

```
See faint grey edge → Click → Card: "Independent"
  → Confirmation: these factors don't interact
  → Analyst dismisses → continues investigating factors separately
  → May "Ask question" to verify independence with domain knowledge
```
