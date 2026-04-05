---
title: Evidence Map as Analysis Spine
status: delivered
date: 2026-04-05
audience: [developer, analyst]
category: architecture
related:
  [evidence-map, factor-intelligence, investigation-spine, pi-panel, coscout, probability-plot]
---

# Evidence Map as Analysis Spine

## Problem

The Evidence Map is a powerful 3-layer visualization (statistical → investigation → synthesis) that currently lives in a pop-out window and mobile carousel. It shows factor relationships, causal links, and suspected cause hubs — but it's disconnected from the main workflow. The analyst visits it occasionally rather than living in it.

Meanwhile, Factor Intelligence in the PI panel and the Evidence Map show **the same data in different forms** — one as tabular/list, the other as spatial graph. They don't communicate. Answering a question in the PI panel doesn't visually update the map. Clicking a node on the map doesn't scroll to related questions.

The investigation workflow lacks a **persistent visual narrative** that grows through the journey: FRAME → SCOUT → INVESTIGATE → IMPROVE → REPORT. Each phase has its own workspace with separate views, but no single artifact tells the evolving story.

## Source Ideas

8 development ideas extracted from expert voice memos and interview transcripts (see `docs/10-development/transcripts/`):

| ID  | Idea                                                   | Source Transcript                 | Journey Phase | In Scope             |
| --- | ------------------------------------------------------ | --------------------------------- | ------------- | -------------------- |
| A   | Proactive factor recommendation on upload              | Best Subset Regression            | FRAME → SCOUT | Yes                  |
| B   | Factor count increase (7-10)                           | Probability Plot in Analysis Flow | FRAME         | No (separate ticket) |
| C   | Multi-series probability plot wired to factor grouping | Probability Plot in Analysis Flow | SCOUT         | Yes                  |
| D   | Probability plot as subgroup diagnostic algorithm      | Probability Plot in Analysis Flow | SCOUT         | Future               |
| E   | Per-subgroup regression equations                      | Probability Plot in Analysis Flow | INVESTIGATE   | Future               |
| F   | Equation as central investigation artifact             | Projects at HP                    | All phases    | Yes                  |
| G   | Evidence Map as the analysis spine                     | Synthesis of all transcripts      | All phases    | Yes (this spec)      |
| H   | Continuous factor support (sensor/IoT data)            | Projects at HP                    | Future        | No                   |

## Design Principles

1. **One map, growing through phases** — same component, progressively enriched. Not five separate views.
2. **Factor Intelligence and Evidence Map are two lenses on the same data** — tabular (PI panel) and spatial (map). Deeply linked, not independent.
3. **The map is the investigation workspace** — during INVESTIGATE phase, the Evidence Map IS the primary work surface. Charts are accessible via node click, not competing for screen space.
4. **Analysis workspace stays clean** — the 4-chart Watson EDA sequence (I-Chart, Boxplot, Pareto, Stats) is sacred. The map is available via pop-out during SCOUT, not as a 5th chart.
5. **The equation bar is always visible** — the regression equation `Y = grandMean + Σ(level effects)` grows from seed to full model as the analyst progresses.

## 1. Evidence Map Journey: Phase-by-Phase

### 1.1 Factor Preview (FRAME → SCOUT Transition)

**When:** After column mapping completes and Factor Intelligence computes best subsets (≥2 factors selected).

**What:** A brief onboarding overlay showing the embryonic Evidence Map:

- Factor nodes sized by R²adj, positioned radially around the outcome node
- The equation bar showing the best model formula
- A "Start with [highest R²adj factor]" recommendation button
- A "Skip" option to go straight to the 4-chart dashboard

**Purpose:** Orientation. The analyst sees which factors matter and where to focus before diving into charts. The Factor Preview IS the Evidence Map in its simplest form — Layer 1 only, no interactions needed.

**Component:** `FactorPreviewOverlay` — wraps `EvidenceMapBase` with Layer 1 data only, plus overlay chrome (title, recommendation button, dismiss). Renders as a centered modal/card over the dashboard.

**Trigger:** `useJourneyPhase` detects transition from FRAME → SCOUT with bestSubsets available. Shows once per project (persist dismiss in sessionStore).

### 1.2 SCOUT Phase (Analysis Workspace)

**No change to the 4-chart dashboard.** The Evidence Map is accessible via:

- **Pop-out window** (existing, works today)
- **Factor Intelligence bar chart** in PI panel — serves as a mini-map. Clicking a bar in the L1 ranking highlights the corresponding factor across all charts.

The PI panel's Factor Intelligence already shows the same data as Evidence Map Layer 1. No duplication needed.

### 1.3 INVESTIGATE Phase (Investigation Workspace) — Primary Change

**Current layout:**

```
┌──────────────────┬──────────────────────────────┬────────────┐
│ Question          │ FindingsLog (list/board)      │ CoScout    │
│ Checklist         │                               │            │
│ (left sidebar)    │                               │ (right)    │
└──────────────────┴──────────────────────────────┴────────────┘
```

**New layout:**

```
┌──────────────────┬──────────────────────────────┬────────────┐
│ PI Panel          │ Evidence Map (center)         │ CoScout    │
│ (left, resizable) │                               │ (right)    │
│                   │ Layer 1: Statistical           │ Graph-     │
│ Stats tab         │ Layer 2: Investigation         │ aware      │
│ Questions tab     │ Layer 3: Synthesis             │ reasoning  │
│ Journal tab       │                               │            │
│ Docs tab (Team)   │ Equation bar (bottom)         │            │
│                   │                               │            │
│ Click node →      │ ← Click node highlights       │            │
│ PI scrolls to     │    questions in PI panel       │            │
│ factor details    │                               │            │
└──────────────────┴──────────────────────────────┴────────────┘
```

**Key changes:**

- **Center:** Evidence Map replaces FindingsLog as the primary view
- **Left sidebar:** Full PI Panel (same component as Analysis workspace) replaces the Question Checklist
- **Right sidebar:** CoScout stays, but with enriched graph-aware context
- **FindingsLog:** Accessible via a toggle/tab within the PI panel or as a secondary view mode

**Why full PI Panel:** The PI Panel provides exactly the right depth when the analyst clicks a map node — Factor Intelligence shows statistical detail, Questions shows investigation progress, Journal shows history. Consistent across workspaces.

### 1.4 IMPROVE Phase

Evidence Map with Layer 3 prominent — convergence zones for suspected cause hubs. The map shows which hubs are suspected, confirmed, or not-confirmed. Projected improvement annotations per hub. Available as pop-out or embedded context panel (not the primary workspace center — Improvement workspace keeps its PDCA-focused layout).

### 1.5 REPORT Phase (Timeline Replay)

**Wire existing `useEvidenceMapTimeline` hook** to Report view. The Evidence Map replays the investigation chronologically:

- Frame 1: Empty canvas with outcome node
- Frame 2+: Factors appear as questions are generated
- Later frames: Causal links draw, evidence badges accumulate
- Final frames: Hubs converge, projections annotate

Playback controls: play/pause/seek. Progress bar shows investigation timeline. Each frame has a timestamp label.

## 2. PI Panel ↔ Evidence Map Deep Linking

### 2.1 Map → PI Panel (Node Click)

When the analyst clicks a factor node on the Evidence Map:

1. PI Panel activates the **Questions tab**
2. Questions list scrolls to and highlights questions related to that factor
3. Factor Intelligence section expands that factor's details (level effects, η²)
4. If the factor has findings, those are highlighted in the list

**Implementation:** `onFactorClick(factor)` callback → dispatch to `panelsStore`:

- `setPIActiveTab('questions')`
- `setHighlightedFactor(factor)` — new state in panelsStore
- PI Panel components read `highlightedFactor` and scroll/highlight accordingly

### 2.2 PI Panel → Map (Question Answer)

When the analyst answers a question in the PI panel:

1. The corresponding factor node on the Evidence Map updates color (grey → colored)
2. If the question reveals a significant finding, an evidence badge appears
3. Coverage progress (% of R²adj explored) is reflected in node saturation

**Implementation:** investigationStore question status changes → useEvidenceMapData recomputes → nodes re-render with updated `explored` state. Add `exploredFactors: Set<string>` to the useEvidenceMapData output, derived from answered questions.

### 2.3 Equation Synchronization

The EquationDisplay in the PI panel and the equation bar on the Evidence Map are the same data. Both use `buildEquationFormula()` from `evidenceMapLayout.ts`. Changes in one are immediately reflected in the other (both read from the same bestSubsets result).

## 3. Map Interaction: Direct Investigation Actions

### 3.1 Node Click → Dual Action (PI Panel + Optional Chart Overlay)

**Single click** on a factor node does two things:

1. **PI Panel scrolls** to that factor's questions and details (section 2.1)
2. **Optional chart overlay** — if the analyst double-clicks (or clicks a "View chart" button on the node), a focused boxplot for that factor appears inline over the map

**UX:** Single click = PI panel navigation. Double-click = chart overlay. Click outside or press Escape → overlay dismisses. The overlay is a lightweight `FocusedChartCard` positioned near the clicked node.

### 3.2 Edge Drawing → Causal Link Creation

**Desktop:** Drag from one factor node to another → causal link creation flow:

1. Drag starts from source node (visual feedback: dashed line follows cursor)
2. Drop on target node → modal appears: "Why does [Source] drive [Target]?"
3. Analyst enters why-statement, selects direction (drives/modulates/confounds), evidence type
4. Link created in investigationStore, Evidence Map Layer 2 updates

**Cycle prevention:** `wouldCreateCycle()` check before confirming. If cycle detected, show warning and prevent creation.

**Mobile:** Long-press node → bottom sheet with "Link to..." option → select target from list.

### 3.3 Right-Click Context Menu

Right-clicking a factor node shows:

- "Ask a question about [Factor]" → creates new question in investigationStore
- "Create finding for [Factor]" → opens FindingEditor
- "Ask CoScout about [Factor]" → pre-fills CoScout input
- "Drill down to [Factor]" → switches to Analysis workspace filtered to that factor

Right-clicking a relationship edge shows:

- "Why are these related?" → opens CoScout with context
- "Create causal link" → same as edge drawing flow
- "View details" → PI panel scrolls to interaction details

## 4. CoScout Graph-Aware Context

### 4.1 Enriched AIContext

Add to `buildAIContext()` output (in `context.investigation`):

```typescript
evidenceMapTopology?: {
  factorNodes: Array<{
    factor: string;
    rSquaredAdj: number;
    explored: boolean;        // has answered questions
    questionCount: number;
    findingCount: number;
  }>;
  relationships: Array<{
    factorA: string;
    factorB: string;
    type: RelationshipType;   // independent|overlapping|synergistic|interactive|redundant
    strength: number;         // ΔR² or shared %
  }>;
  convergencePoints: Array<{
    factor: string;
    incomingCount: number;
    hubName?: string;
    hubStatus?: string;
  }>;
  interactionEffects: Array<{
    factorA: string;
    factorB: string;
    deltaRSquared: number;
  }>;
};
```

**Source:** Computed by `useEvidenceMapData` hook, passed to `buildAIContext()`.

### 4.2 CoScout Capabilities

With graph-aware context, CoScout can:

- **Identify unexplored factors:** "Machine explains 34% but you haven't investigated it yet"
- **Suggest based on topology:** "Shift and Temperature are synergistic — investigating them together may reveal more"
- **Recognize convergence:** "Three factors all point to Fill Head — consider creating a suspected cause hub"
- **Validate hypotheses:** "Adding a link from A to B would create a cycle — the current evidence suggests a different direction"

## 5. Probability Plot Factor Grouping (Quick Win)

### Current State

`useProbabilityPlotData` hook supports `factorColumn` parameter for multi-series grouping. The dashboard calls it without a factor column — single "All" series only.

### Change

When the analyst has a focused factor selected (via PI panel or filter), pass it to `useProbabilityPlotData`:

```typescript
const { series } = useProbabilityPlotData({
  values: histogramData,
  factorColumn: focusedFactor, // new: pass current factor
  rows: filteredData,
});
```

Multi-series probability plot shows one line per factor level. Parallel lines = location shift only (same distribution shape). Diverging slopes = different distributions per level.

**Where:** VerificationCard in Capability mode — existing Histogram|ProbabilityPlot tab toggle. When a factor is focused, probability plot switches to multi-series.

## 6. Implementation Phases

### Phase 0: Quick Wins (leverage existing code)

- Wire probability plot factor grouping (C)
- Wire timeline animation to Report view
- Pass Evidence Map topology to CoScout context

### Phase 1: Factor Preview

- FactorPreviewOverlay component
- Trigger logic in useJourneyPhase
- Session persistence (show once per project)

### Phase 2: Investigation Workspace Redesign

- Evidence Map as center view
- Full PI Panel as left sidebar
- Deep linking: node click ↔ PI panel scroll
- Node color updates from question answers

### Phase 3: Direct Map Interactions

- Edge drawing → causal link creation
- Node click → chart overlay
- Right-click context menu
- Mobile: long-press + bottom sheet flows

### Phase 4: Polish + Report

- Timeline replay in Report view with playback controls
- Factor Preview refinement based on user testing
- Equation bar prominence and live updates

## 7. Files to Modify

### New Components

- `packages/ui/src/components/FactorPreviewOverlay/` — post-FRAME onboarding overlay
- `apps/azure/src/components/editor/InvestigationMapView.tsx` — Evidence Map center view for Investigation workspace

### Modified Components

- `apps/azure/src/components/editor/InvestigationWorkspace.tsx` — layout change: PI Panel left, Evidence Map center
- `apps/azure/src/features/panels/panelsStore.ts` — add `highlightedFactor`, `isEvidenceMapCenterView`
- `packages/core/src/ai/buildAIContext.ts` — add evidenceMapTopology to AIContext
- `packages/core/src/ai/types.ts` — extend AIContext interface
- `packages/hooks/src/useEvidenceMapData.ts` — add `exploredFactors` computation
- `apps/azure/src/components/Dashboard.tsx` — wire factor column to probability plot

### Existing (Leveraged, Not Rebuilt)

- `packages/charts/src/EvidenceMap/` — all 3 layers, 959 lines
- `packages/core/src/stats/evidenceMapLayout.ts` — 419 lines
- `packages/hooks/src/useEvidenceMapTimeline.ts` — 312 lines
- `packages/hooks/src/usePopoutChannel.ts` — 140 lines
- `packages/ui/src/components/EvidenceMapSheet/` — mobile bottom sheets

## 8. Future Ideas (Not In Scope)

These ideas from the transcripts inform the direction but are separate work:

- **Per-subgroup regression equations (E)** — re-run best subsets per factor level, show different Evidence Maps per subgroup context
- **Probability plot diagnostic annotations (D)** — annotate map edges with "same/different distribution" based on multi-series probability plot analysis
- **Continuous factor support (H)** — linear regression for sensor/IoT data with continuous X factors
- **Factor count increase to 7-10 (B)** — tier config change in `tier.ts` + performance testing
- **Evidence Map as full dashboard replacement** — the radical vision where the map IS the dashboard, with mini-charts expanding from nodes
