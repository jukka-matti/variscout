---
title: Evidence Map — Data Relationship Visualization
status: draft
date: 2026-04-05
audience: [developer, analyst]
category: architecture
related: [best-subsets, factor-intelligence, investigation-spine, causal-graph, pop-out-window]
---

# Evidence Map — Data Relationship Visualization

## Problem

Factor relationships are computed but invisible. Best subsets regression evaluates all 2^k-1 factor combinations and ranks them by R²adj. Layer 2 computes per-factor η². Layer 3 computes interaction ΔR² per pair. But this data is presented only as ranked bar lists and tabular detail views. The analyst can see "Supplier explains 34%" and "Fill Head explains 22%" but cannot see that Supplier × Fill Head has a 4% interaction — or that Shift and Temperature share overlapping variance — without digging into Layer 3 tables.

Meanwhile, the investigation workflow uses question trees (parentId hierarchy) which enforce a strict tree structure. Real causal investigation follows 5 Whys chains that cross factor boundaries and converge on shared root causes — a DAG pattern that no tree or list can show.

Two prior explorations were archived before the question-driven system existed:

- Factor Map (docs/archive/factor-map.md) — deferred for d3-force complexity
- Investigation Mindmap (docs/archive/investigation-mindmap.md) — replaced by findings system

Since then: question trees (ADR-053), Factor Intelligence 3 layers, SuspectedCause hubs, the PI panel, and the investigation spine have all been built. The new ingredient: 5 Whys chains cross factor boundaries and converge on shared root causes — a graph visualization makes this convergence visible at a glance.

## Design Principles

1. **R²adj is the first principle** — best subsets regression comparison reveals factor relationships (independent, redundant, synergistic, interactive, overlapping). The equation `ŷ = grandMean + Σ(level effects)` is the backbone.
2. **One living map, not two views** — the Evidence Map grows through the journey: statistical scaffolding (SCOUT) → causal links (INVESTIGATE) → convergence hubs (IMPROVE) → animated replay (REPORT).
3. **Factors are nodes, CausalLinks are the new entity** — no separate CausalNode type. Factors from the data are natural nodes. CausalLink is the only new first-class entity.
4. **The map is a navigation tool AND a synthesis workspace** — hybrid interaction: auto-builds from investigation state, but analyst can also create links, attach evidence, and name convergence points directly on the map.
5. **Deterministic layout, no physics** — pure function computes positions from R²adj. Same data → same layout every time. Reproducible for export/report.
6. **Mode-aware via strategy pattern** — adapts metrics (R²adj/Cpk impact/waste%) per analysis mode using existing `resolveMode()` + `getStrategy()`.

## 1. Component Architecture

### Layered SVG Composition

The Evidence Map is a single visx SVG canvas with three composited `<g>` layers:

```
EvidenceMapBase (visx SVG, props-based, no store access)
├── <g> Layer 1: Statistical (always rendered)
│   ├── Outcome node (center)
│   ├── Factor nodes (positioned by R²adj, sized by contribution)
│   ├── Factor→Outcome edges (thickness = R²adj)
│   ├── Factor↔Factor relationship edges (type from R²adj comparison)
│   └── Equation bar (best model + formula)
│
├── <g> Layer 2: Investigation (when CausalLinks exist) [Azure only]
│   ├── CausalLink directed edges between factors
│   ├── Evidence badges (D/G/E) on links
│   ├── Gap markers (unvalidated links)
│   └── Question/finding count indicators
│
└── <g> Layer 3: Synthesis (when SuspectedCause hubs exist) [Azure only]
    ├── Hub convergence zones (highlighted regions)
    ├── Hub name labels + status (suspected/confirmed)
    └── Projection annotations (predicted improvement)
```

### File Structure

```
packages/charts/src/EvidenceMap/
├── EvidenceMap.tsx              # Responsive wrapper (withParentSize)
├── EvidenceMapBase.tsx          # SVG canvas + layer composition
├── StatisticalLayer.tsx         # Layer 1: factor nodes, edges, equation
├── InvestigationLayer.tsx       # Layer 2: causal links, evidence badges
├── SynthesisLayer.tsx           # Layer 3: hubs, convergence zones
├── FactorNode.tsx               # Shared factor node component
├── RelationshipEdge.tsx         # Statistical relationship edge
├── CausalEdge.tsx               # Investigation causal link edge
├── layout.ts                    # Deterministic positioning algorithm
├── types.ts                     # EvidenceMapProps, layer data types
└── index.ts                     # Exports
```

Follows existing chart patterns: `EvidenceMap` (responsive wrapper) + `EvidenceMapBase` (raw component). Props-based, no context dependency. Theme-aware via `useChartTheme`. Exportable via `useChartCopy`.

### Zustand-First Wiring

```
packages/charts/     → EvidenceMapBase (pure props, zero store access)
packages/hooks/      → useEvidenceMapData (reads stores via selectors, computes layout)
packages/stores/     → investigationStore (causalLinks[], CRUD actions)
packages/core/       → causalGraph.ts (pure functions: cycle detection, paths, classification)
apps/azure/          → Wrapper: useEvidenceMapData() → EvidenceMapBase, all 3 layers
apps/pwa/            → Wrapper: useEvidenceMapData() → EvidenceMapBase, Layer 1 only
```

## 2. R²adj-First Statistical Foundation

### Relationship Type Classification

The five relationship types are derived from comparing R²adj values across best subsets:

| Relationship | Detection Rule                        | Edge Style               | What Analyst Learns                |
| ------------ | ------------------------------------- | ------------------------ | ---------------------------------- |
| Independent  | R²adj(A+B) ≈ R²adj(A) + R²adj(B) ±2%  | Thin grey dotted         | Optimize separately                |
| Overlapping  | R²adj(A+B) < R²adj(A) + R²adj(B) - 2% | Dashed red               | Shared variance, pick stronger     |
| Synergistic  | R²adj(A+B) > R²adj(A) + R²adj(B) + 2% | Solid green, double-line | Combination is key                 |
| Interactive  | ΔR² from Layer 3 > 2%                 | Solid purple             | Can't optimize independently       |
| Redundant    | R²adj(A+B) ≤ R²adj(A) + 2%            | Thin grey, "×" marker    | B adds nothing, stop investigating |

### Classification Function

Pure function in `packages/core/src/stats/causalGraph.ts`:

```typescript
function classifyRelationship(
  rAdjA: number,
  rAdjB: number,
  rAdjAB: number,
  deltaR2?: number,
  threshold: number = 0.02
): RelationshipType;
```

### The Equation as Map Backbone

The headline shows the best model: `ŷ = grandMean + Σ(level effects)`. Each factor node is a term in this equation. Level effects (±g values) are the multipliers shown on each node.

### Mode-Aware Metrics

| Mode        | Node Label                         | Equation Metric   | Edge Meaning             |
| ----------- | ---------------------------------- | ----------------- | ------------------------ |
| Standard    | "Supplier: R²adj=0.34, +12.3g"     | Mean shift        | "explains variation"     |
| Capability  | "Supplier: R²adj=0.34, Cpk +0.4"   | Cpk impact        | "affects capability"     |
| Performance | "Supplier: R²adj=0.34, 3 channels" | Channel count     | "varies across channels" |
| Yamazumi    | "Setup: 28% waste, +45s"           | Time contribution | "contributes waste"      |

## 3. Layout Algorithm

### Deterministic Radial Positioning

Pure function in `packages/core/src/stats/evidenceMapLayout.ts`:

```typescript
function computeEvidenceMapLayout(
  bestSubsets: BestSubsetsResult,
  mainEffects: MainEffectsResult | null,
  interactions: InteractionEffectsResult | null,
  containerSize: { width: number; height: number },
  mode: ResolvedMode
): EvidenceMapLayout;
```

**Positioning rules:**

1. Outcome node at center
2. Factor nodes in radial layout: distance = inverse R²adj (stronger closer), angle = sorted clockwise by R²adj from 12 o'clock, radius = proportional to R²adj
3. Minimum spacing enforced (collision detection with offset)
4. Responsive via `getResponsiveMargins()` and `getResponsiveFonts()` from `@variscout/core/responsive`
5. At small sizes (<400px): labels truncate, minor edges hide

**User-adjustable positions:** Analyst can drag nodes. The override persists per project. If no override, deterministic layout applies.

## 4. CausalLink Data Model

### New Type

```typescript
// packages/core/src/findings/types.ts

interface CausalLink {
  id: string;
  fromFactor: string; // Factor column name
  toFactor: string; // Factor column name
  fromLevel?: string; // Specific condition (e.g., "Night")
  toLevel?: string; // Specific condition (e.g., "Heads 5-8")
  whyStatement: string; // Causal narrative
  direction: 'drives' | 'modulates' | 'confounds';
  evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
  questionIds: string[]; // Questions supporting this link
  findingIds: string[]; // Findings supporting this link
  hubId?: string; // SuspectedCause hub this belongs to
  strength?: number; // ΔR² or R²adj-derived
  relationshipType?: RelationshipType; // Auto-computed from R²adj comparison
  source: 'analyst' | 'coscout' | 'auto';
  createdAt: string;
  updatedAt: string;
}
```

### Factory Function

```typescript
// packages/core/src/findings/factories.ts
function createCausalLink(fromFactor, toFactor, whyStatement, options?): CausalLink;
```

### Graph Utilities

Pure functions in `packages/core/src/stats/causalGraph.ts`:

- `wouldCreateCycle(links, fromFactor, toFactor): boolean` — DFS reachability check
- `findPaths(links, from, to): CausalLink[][]` — all paths between factors
- `findConvergencePoints(links): ConvergencePoint[]` — factors with 2+ incoming links
- `topologicalSort(factors, links): string[]` — rendering order
- `classifyRelationship(rAdjA, rAdjB, rAdjAB, deltaR2?): RelationshipType`

At max 10 factors × 45 edges, all operations are microseconds. No external library needed.

### Investigation Store Additions

```typescript
// packages/stores/src/investigationStore.ts

// New state field:
causalLinks: CausalLink[];

// New actions:
addCausalLink(from, to, whyStatement, options?) → CausalLink | null  // null if cycle
removeCausalLink(id) → void
updateCausalLink(id, updates) → void
linkQuestionToCausalLink(linkId, questionId) → void
linkFindingToCausalLink(linkId, findingId) → void
unlinkQuestionFromCausalLink(linkId, questionId) → void
unlinkFindingFromCausalLink(linkId, findingId) → void
generateStatisticalLinks(bestSubsets, interactions) → CausalLink[]  // Auto scaffolding
```

### Cascade Behavior

- Delete question → removes ID from all `causalLink.questionIds[]`
- Delete finding → removes ID from all `causalLink.findingIds[]`
- Delete hub → clears `hubId` on linked causal links (links survive)
- Delete causal link → no cascade (leaf entity)

### Migration

Idempotent, applied at load time: `causalLinks: state.causalLinks ?? []`. Existing projects get empty array.

## 5. Persistence Fix (Prerequisite)

### Existing Gaps

The Zustand-first migration moved investigation CRUD to `investigationStore`, but `getCurrentStateFromStores()` still reads from `projectStore`. Four gaps:

| Field           | Edited in          | Saved from           | Status        |
| --------------- | ------------------ | -------------------- | ------------- |
| findings        | investigationStore | projectStore (stale) | **STALE**     |
| questions       | investigationStore | projectStore (stale) | **STALE**     |
| categories      | investigationStore | projectStore (stale) | **STALE**     |
| suspectedCauses | investigationStore | NOWHERE              | **100% LOSS** |

### Systemic Fix

**File:** `packages/hooks/src/useProjectActions.ts` — `getCurrentStateFromStores()`

Read investigation data from `investigationStore` (authoritative source), not `projectStore`:

```typescript
function getCurrentStateFromStores() {
  const ps = useProjectStore.getState();
  const is = useInvestigationStore.getState(); // ADD

  const state = {
    /* ...existing projectStore fields... */
  };

  // Investigation data: from investigationStore (authoritative)
  if (is.findings.length > 0) state.findings = is.findings;
  if (is.questions.length > 0) state.questions = is.questions;
  if (is.categories.length > 0) state.categories = is.categories;
  if (is.suspectedCauses.length > 0) state.suspectedCauses = is.suspectedCauses;
  if (is.causalLinks?.length > 0) state.causalLinks = is.causalLinks;

  return state;
}
```

**Additional changes:**

- Add `suspectedCauses?: SuspectedCause[]` and `causalLinks?: CausalLink[]` to `AnalysisState` type
- Extend `loadProject()` to hydrate `suspectedCauses` and `causalLinks` into investigationStore

## 6. Data Flow Hook

### useEvidenceMapData

```typescript
// packages/hooks/src/useEvidenceMapData.ts

interface UseEvidenceMapDataOptions {
  bestSubsets: BestSubsetsResult | null;
  mainEffects: MainEffectsResult | null;
  interactions: InteractionEffectsResult | null;
  containerSize: { width: number; height: number };
  mode: ResolvedMode;
  causalLinks?: CausalLink[];
  questions?: Question[];
  findings?: Finding[];
  suspectedCauses?: SuspectedCause[];
}

interface UseEvidenceMapDataReturn {
  // Layer 1
  layout: EvidenceMapLayout;
  equation: { bestModel: BestSubsetResult; formula: string; rSquaredAdj: number } | null;
  relationships: RelationshipEdge[];
  // Layer 2
  causalEdges: Array<CausalLink & { fromPos: Position; toPos: Position }>;
  evidenceBadges: Map<string, EvidenceSummary>;
  // Layer 3
  convergencePoints: ConvergencePoint[];
  // Metadata
  activeLayer: 1 | 2 | 3;
  isEmpty: boolean;
}
```

**Data flow:**

- `useAsyncStats` → bestSubsets, mainEffects, interactions (computed from data)
- `investigationStore` → causalLinks, questions, findings, suspectedCauses (Zustand selectors)
- `sessionStore` / `projectStore` → analysisMode (for strategy pattern)
- Hook computes layout, classifies relationships, positions edges, detects convergence
- Returns clean props for `EvidenceMapBase`

**Performance:** Memoized via React Compiler. Layout recalculates only when inputs change. O(k² + e) where k ≤ 10, e ≤ 45.

## 7. Pop-Out Window & Cross-Window Sync

### Architecture

Follows established FindingsWindow/ImprovementWindow pattern with upgraded sync:

- **Route:** `?view=evidence-map` query param (same pattern as `?view=findings`)
- **Hydration:** One-time localStorage write on pop-out open (initial state snapshot)
- **Ongoing sync:** BroadcastChannel API (replaces localStorage StorageEvent for real-time updates)
- **Theme:** Auto-inherits via `<ThemeProvider>` + localStorage (existing pattern)

### BroadcastChannel (Hybrid Pattern)

localStorage for initial hydration + BroadcastChannel for ongoing bidirectional sync:

```typescript
// packages/hooks/src/usePopoutChannel.ts (~50 lines, reusable)

const channel = new BroadcastChannel('variscout-sync');

// Message types:
{ type: 'store-mutation', entity: string, action: string, payload: unknown }
{ type: 'factor-selected', factor: string }
{ type: 'filter-changed', filters: ActiveFilters }
{ type: 'visual-grounding', refType: string, refId: string, action: string }
{ type: 'action-proposal', tool: string, params: unknown, target: string }
{ type: 'heartbeat', source: string }
{ type: 'window-closing', source: string }
```

### Multi-Window Support (3+ windows)

All windows connect to the same BroadcastChannel. Messages include `source` and optional `target` fields for routing:

- Store mutations → `target: 'all'` (every window updates)
- CoScout action proposals → `target: 'evidence-map'` (routes to map window)
- Visual grounding → routes by `RefTargetType` (evidence-node → map window, boxplot → main window)
- Heartbeat → each window sends periodic heartbeat, main window tracks active pop-outs
- Window close → broadcasts `window-closing`, other windows adapt (restore mini-map, etc.)

### Conflict Resolution

- Unique IDs via `crypto.randomUUID()` — no collision on concurrent creates
- Cycle detection runs per-window before mutation — both windows validate independently
- Last-write-wins with timestamp for concurrent updates to same entity
- Delete propagates immediately

### Browser Support

BroadcastChannel: Safari 15.4+ (March 2022), Chrome 54+, Firefox 38+. 100% safe for VariScout's target browsers.

## 8. Journey Integration

### How the Map Appears in Each Workspace

| Workspace     | Map Role                          | Size               | Layers            | Interactive                         | Pop-out |
| ------------- | --------------------------------- | ------------------ | ----------------- | ----------------------------------- | ------- |
| Overview      | Hidden                            | —                  | —                 | —                                   | —       |
| Analysis      | Mini-map (bottom-right corner)    | ~200x160px         | L1 only           | Click to filter, click to pop out   | Yes     |
| Investigation | **Centerpiece** (primary canvas)  | Full area          | L1+L2+L3          | Full editing + chart panel slide-in | Yes     |
| Improvement   | Summary strip (top)               | Full width, ~200px | L1+L3 (confirmed) | Click hub → scroll to plan          | No      |
| Report        | Static snapshot + animated replay | Full width, ~400px | All (final state) | Timeline scrubber                   | No      |

### Investigation Workspace Layout

Toggle between Charts view (current) and Map view:

```
[Charts view] [Map view]    ← toggle in workspace header

Map view:
┌─────────────────────────────────┬──────────────┐
│                                 │  PI Panel    │
│     Evidence Map                │  Stats       │
│     (full canvas, L1-L3)        │  Questions   │
│                                 │  Journal     │
│  ┌───────────────────────────┐  │              │
│  │ Chart panel (slides in)   │  │              │
│  │ on factor click           │  │              │
│  └───────────────────────────┘  │              │
└─────────────────────────────────┴──────────────┘
```

- Default: Charts view (for users without causal links)
- Auto-switches to Map view when first CausalLink is created
- Analyst can always toggle back

### Gating

Mini-map appears when `bestSubsets.subsets[0].rSquaredAdj > 0.05` (meaningful model exists).

### Report Timeline Animation

Since every entity has `createdAt`, the report can replay the investigation chronologically:

```typescript
// packages/hooks/src/useEvidenceMapTimeline.ts
function useEvidenceMapTimeline(
  layout,
  causalLinks,
  hubs,
  questions,
  findings
): {
  frames: TimelineFrame[];
  currentFrame: number;
  play: () => void;
  pause: () => void;
  seek: (frame: number) => void;
  isPlaying: boolean;
  visibleEntities: FilteredEntities;
};
```

The hook collects all `createdAt` timestamps, sorts chronologically, groups into frames. `EvidenceMapBase` receives `visibleEntities` as a filter — entities not yet "reached" fade in via CSS transitions.

## 9. CoScout Integration

### New Action Tools

```typescript
// packages/core/src/ai/actionTools.ts

// suggest_causal_link — phase: INVESTIGATE+
{
  name: 'suggest_causal_link',
  parameters: { fromFactor, toFactor, fromLevel?, toLevel?, mechanism, direction }
}

// highlight_map_pattern — phase: INVESTIGATE+
{
  name: 'highlight_map_pattern',
  parameters: { factors: string[], patternType, explanation }
}
```

Both follow the existing ADR-029 proposal pattern: tool handler validates → returns preview → CoScout embeds `[ACTION:...]` marker → UI renders ActionProposalCard → user clicks Apply → store mutation.

### AI Context Additions

In `buildInvestigationContext()` (Tier 2):

- Interaction terms with ΔR² > 2% (enables link suggestions)
- Existing causal links (prevents duplicate proposals)
- Convergence points without hubs (enables hub suggestions)

### Methodology Coaching

System prompt addition: "When you see interaction terms with ΔR² > 2%, consider suggesting a causal link. When you see a convergence point without a hub, suggest creating one. When you see an unvalidated link, suggest what evidence would validate it."

### Visual Grounding Extensions

Extend `RefTargetType` with: `'evidence-node'`, `'evidence-edge'`, `'evidence-map'`.

CoScout can reference map elements: `[REF:evidence-edge:shift-fillhead]interaction between Shift and Fill Head[/REF]`. Grounding events route to the pop-out window via BroadcastChannel if the map is popped out.

### Pop-Out Routing

CoScout action proposals for map tools (`suggest_causal_link`) broadcast via BroadcastChannel with `target: 'evidence-map'`. The ActionProposalCard renders on whichever window has the map visible.

## 10. Tier Matrix

| Feature                           | PWA (free) | Azure Standard | Azure Team     |
| --------------------------------- | ---------- | -------------- | -------------- |
| Evidence Constellation (Layer 1)  | Full       | Full           | Full           |
| R²adj relationship classification | Full       | Full           | Full           |
| Click-to-filter navigation        | Full       | Full           | Full           |
| Pop-out window                    | Yes        | Yes            | Yes            |
| Chart export (PNG/SVG)            | Yes        | Yes            | Yes            |
| CausalLinks (Layer 2)             | No         | Full           | Full           |
| Cause Map editing                 | No         | Full           | Full           |
| CoScout map suggestions           | No         | Full           | Full           |
| SuspectedCause hubs (Layer 3)     | No         | Full           | Full           |
| Report timeline animation         | No         | Full           | Full           |
| Collaborative map editing         | No         | No             | Real-time sync |

PWA gets the full statistical visualization as a teaching tool. The gap between "I can SEE relationships" (PWA) and "I can INVESTIGATE causes" (Azure) is the upgrade hook.

## 11. Implementation Phases

### Phase 0: Persistence Fix (PREREQUISITE)

Fix existing bug: `getCurrentStateFromStores()` reads investigation data from `investigationStore` instead of `projectStore`. Add `suspectedCauses` and `causalLinks` to `AnalysisState` type and serialization.

**Files:**

- `packages/hooks/src/useProjectActions.ts` — getCurrentStateFromStores(), loadProject()
- `packages/core/src/findings/types.ts` — AnalysisState type
- `packages/stores/src/projectStore.ts` — SerializedProject type

**Test:** Save project with hubs → refresh → hubs survive. Currently they don't.

### Phase 1: Statistical Layer (Evidence Constellation)

Layer 1 component with layout algorithm, R²adj classification, mode-aware labels.

**Files:**

- `packages/core/src/stats/evidenceMapLayout.ts` — layout algorithm
- `packages/core/src/stats/causalGraph.ts` — classifyRelationship + graph utilities
- `packages/charts/src/EvidenceMap/` — component suite (Layer 1 only)
- `packages/hooks/src/useEvidenceMapData.ts` — data flow hook
- Both apps — mini-map in Analysis workspace

**Test:** Coffee/bottleneck sample → constellation renders with correct R²adj values and relationship types.

### Phase 2: Pop-Out Window Infrastructure

BroadcastChannel sync, `?view=evidence-map` route, mini-map ↔ pop-out lifecycle.

**Files:**

- `packages/hooks/src/usePopoutChannel.ts` — BroadcastChannel + hydration hook
- `apps/azure/src/pages/EvidenceMapWindow.tsx` — pop-out route
- Both apps `App.tsx` — query param routing

**Test:** Open pop-out → filter on main → map highlights. Close pop-out → mini-map restores.

### Phase 3: CausalLink Data Model

CausalLink type, factory, store actions, cycle prevention, persistence.

**Files:**

- `packages/core/src/findings/types.ts` — CausalLink type
- `packages/core/src/findings/factories.ts` — createCausalLink
- `packages/core/src/findings/migration.ts` — migration function
- `packages/stores/src/investigationStore.ts` — CRUD actions

**Test:** Create links → save → refresh → links survive. Create cycle → rejected.

### Phase 4: Investigation Layer (Cause Map)

Layer 2 component with causal edges, evidence badges, gap markers, Investigation Workspace centerpiece.

**Files:**

- `packages/charts/src/EvidenceMap/InvestigationLayer.tsx`
- `packages/charts/src/EvidenceMap/CausalEdge.tsx`
- Azure app — Investigation Workspace layout changes, Charts/Map toggle

**Test:** Build causal chain → convergence detected → chart panel slides in on factor click.

### Phase 5: Synthesis Layer + Report

Layer 3 with convergence zones, hub annotations, projections. Report snapshot + timeline animation.

**Files:**

- `packages/charts/src/EvidenceMap/SynthesisLayer.tsx`
- `packages/hooks/src/useEvidenceMapTimeline.ts`
- Azure app — Improvement summary strip, Report snapshot

**Test:** Full journey SCOUT → INVESTIGATE → IMPROVE → REPORT with animated replay.

### Phase 6: CoScout Integration

Action tools, visual grounding, AI context, methodology coaching, pop-out routing.

**Files:**

- `packages/core/src/ai/actionTools.ts` — 2 new tools
- `packages/core/src/ai/prompts/coScout.ts` — context + coaching
- `packages/core/src/ai/visualGrounding.ts` — new RefTargetTypes
- Azure app — action proposal routing via BroadcastChannel

**Test:** CoScout suggests causal link → proposal renders on map → user applies → map updates.

## 12. Prior Art & Competitive Position

No SPC tool offers spatial factor relationship visualization. Minitab, JMP, and Quality Companion show ranked lists and individual plots. The Evidence Map makes VariScout the first tool where:

- Factor relationships are visible as a topology, not just rankings
- Investigation convergence is visible at a glance
- The journey from data → discovery → understanding → improvement is a visual narrative
- A pop-out map on a second monitor provides persistent spatial context

Referenced archived explorations:

- `docs/archive/factor-map.md` — d3-force approach, deferred
- `docs/archive/investigation-mindmap.md` — lighter concept, archived Feb 2026

## 13. Risks & Mitigations

| Risk                                                | Mitigation                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| User education — analysts unfamiliar with graph viz | Progressive growth: map builds itself as investigation proceeds. No blank canvas.                               |
| Layout readability at 3 vs 10 factors               | Adaptive: 3 factors = clean triangle; 10 = radial with labels. Responsive sizing.                               |
| Decoration vs navigation tool                       | Every node is clickable (filter). Every edge carries evidence. The map must DO something, not just look pretty. |
| Persistence fragility                               | Phase 0 fixes the systemic gap before building on it.                                                           |
| Pop-out window lifecycle complexity                 | Heartbeat protocol + graceful degradation. Mini-map restores if pop-out closes.                                 |
| CoScout over-suggesting links                       | Phase-gated to INVESTIGATE+. Only suggests when ΔR² > 2%. Analyst always confirms.                              |

## 14. Verification

### Phase 0 Verification

1. Load coffee sample with pre-populated investigation state
2. Create a SuspectedCause hub
3. Save project → refresh page
4. Verify: hub survives with all connected questions/findings

### Phase 1 Verification

1. Load bottleneck sample (3+ factors)
2. Evidence Constellation renders in Analysis workspace mini-map
3. Factor nodes sized correctly by R²adj
4. Relationship edges show correct types (check against manual R²adj comparison)
5. Click factor → dashboard filters
6. Mode switch → labels update (standard → capability)

### Phase 2 Verification

1. Click mini-map → pop-out window opens
2. Filter on main → pop-out highlights factor
3. Click factor on pop-out → main dashboard filters
4. Close pop-out → mini-map restores
5. Theme toggle → pop-out updates

### Phase 3 Verification

1. Create causal link (Shift → Fill Head)
2. Attempt cycle (Fill Head → Shift) → rejected
3. Save → refresh → links survive
4. Evidence badges appear when questions/findings linked

### Phase 4 Verification

1. Investigation Workspace shows map as centerpiece
2. Click factor node → chart panel slides in
3. Charts/Map toggle works
4. Gap markers appear on unvalidated links
5. Convergence detected when 2+ chains arrive at same factor

### Phase 5 Verification

1. Hub zones render around convergence points
2. Improvement summary strip shows confirmed hubs
3. Report timeline replays investigation chronologically
4. Export produces correct PNG/SVG

### Phase 6 Verification

1. CoScout sees interaction terms in AI context
2. CoScout proposes causal link via ActionProposalCard
3. User applies → map updates (in pop-out if applicable)
4. Visual grounding highlights correct map elements
