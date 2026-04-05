---
title: 'ADR-066: Evidence Map as Investigation Workspace Center'
---

# ADR-066: Evidence Map as Investigation Workspace Center

## Status

Accepted — 2026-04-05

## Context

The Evidence Map (ADR-065) was implemented as a pop-out window and mobile carousel tab — powerful but disconnected from the main workflow. The analyst visits it occasionally rather than living in it. Meanwhile, Factor Intelligence in the PI panel and the Evidence Map show the same data in different forms — one as tabular/list, the other as spatial graph — but they don't communicate.

The Investigation workspace center was FindingsLog (list/board/tree view), which is text-centric. Real investigation is spatial — analysts think in relationships, convergence, and causation. The Evidence Map captures this better than any list.

Expert voice memos (Apr 5 2026) surfaced the key insight: the Evidence Map should be a persistent visual narrative that grows through every phase of the journey, not a separate view to visit.

## Decision

### 1. Evidence Map Owns the Investigation Workspace Center

Replace FindingsLog as the default center view of the Investigation workspace:

```
┌──────────────┬──────────────────────────────┬────────────┐
│ PI Panel     │ Evidence Map (default center) │ CoScout    │
│ (left)       │ or FindingsLog (toggle)       │ (right)    │
└──────────────┴──────────────────────────────┴────────────┘
```

A toggle bar at the top switches between "Evidence Map" and "Findings" — `investigationViewMode: 'map' | 'findings'` in panelsStore. Evidence Map is the default. FindingsLog remains accessible as the secondary view.

### 2. PI Panel ↔ Evidence Map Bidirectional Linking

**Map → PI Panel:** Clicking a factor node sets `highlightedFactor` in panelsStore, which atomically switches the PI panel to the Questions tab, opens the sidebar, and triggers scroll-to + highlight animation on questions related to that factor.

**PI Panel → Map:** Answering a question updates `exploredFactors: Set<string>` in useEvidenceMapData. Explored factors render with full color; unexplored factors render grey. This creates a visual coverage indicator on the map.

### 3. Factor Preview at FRAME → SCOUT Transition

`FactorPreviewOverlay` — a centered modal showing the embryonic Evidence Map (Layer 1 only) immediately after Factor Intelligence completes. Shows factor nodes sized by R²adj, the equation bar, and a "Start with [top factor]" recommendation. Dismisses once per project via `factorPreviewDismissed` in panelsStore.

Purpose: orientation. The analyst sees which factors matter before diving into charts.

### 4. CoScout Graph-Aware Context

`evidenceMapTopology` added to AIContext, giving CoScout visibility into:

- Factor nodes with R²adj, explored status, question/finding counts
- Relationship types and strengths between factor pairs
- Convergence points (factors with 2+ incoming causal links)

This enables CoScout to reason about graph structure: identify unexplored factors, suggest based on topology, recognize convergence patterns, validate that proposed links won't create cycles.

### 5. Direct Map Interactions

- **Right-click node → NodeContextMenu:** Ask question, create finding, ask CoScout, drill down to Analysis
- **CausalLinkCreator modal:** Why-statement + direction (drives/modulates/confounds) + evidence type (data/gemba/expert/unvalidated)
- **Timeline replay in Report:** `ReportEvidenceMap` with play/pause/seek, animated chronological progression of the investigation

### 6. Analysis Workspace Stays Clean

The 4-chart Watson EDA dashboard (I-Chart, Boxplot, Pareto, Stats) is unchanged. The Evidence Map is available during SCOUT via pop-out window only. This preserves the focused chart-driven exploration flow.

## Consequences

**Positive:**

- The Evidence Map becomes the analyst's "investigation board" — spatial, always visible, growing with evidence
- PI Panel and Evidence Map reinforce each other: tabular detail + spatial overview
- CoScout makes smarter suggestions with graph topology awareness
- Factor Preview reduces time-to-first-insight for new projects
- Timeline replay in reports tells the investigation story visually

**Negative:**

- Investigation workspace layout change may surprise existing users (FindingsLog was the default)
- FindingsLog is now secondary — analysts who prefer list view need one extra click
- More complex state coordination (panelsStore ↔ investigationStore ↔ useEvidenceMapData)

**Mitigations:**

- FindingsLog toggle is prominent and persistent — not hidden
- `investigationViewMode` defaults to 'map' but persists user's last choice
- Evidence Map empty state ("Select at least 2 factors") guides analysts who haven't run Factor Intelligence yet

## Implementation

- `apps/azure/src/components/editor/InvestigationMapView.tsx` — Evidence Map center view with ResizeObserver
- `apps/azure/src/components/editor/InvestigationWorkspace.tsx` — restructured layout
- `apps/azure/src/components/editor/EditorDashboardView.tsx` — FactorPreviewOverlay wiring
- `apps/azure/src/features/panels/panelsStore.ts` — highlightedFactor, investigationViewMode, factorPreviewDismissed
- `packages/hooks/src/useEvidenceMapData.ts` — exploredFactors computation
- `packages/core/src/ai/buildAIContext.ts` — evidenceMapTopology passthrough
- `packages/ui/src/components/` — FactorPreviewOverlay, NodeContextMenu, CausalLinkCreator, ReportEvidenceMap
- Design spec: `docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md`
