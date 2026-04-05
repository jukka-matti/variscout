---
title: 'ADR-065: Evidence Map & Causal Graph Visualization'
---

# ADR-065: Evidence Map & Causal Graph Visualization

## Status

Accepted — 2026-04-05

## Context

Factor relationships are computed but invisible. Best subsets regression evaluates all 2^k-1 factor combinations and ranks them by R²adj. Layer 2 computes per-factor η². Layer 3 computes interaction ΔR² per pair. But this data is presented only as ranked bar lists in the PI panel. The analyst can see "Supplier explains 34%" and "Fill Head explains 22%" but cannot see that Supplier × Fill Head has a 4% interaction — or that Shift and Temperature share overlapping variance — without digging into Layer 3 tables.

Meanwhile, investigation uses question trees (parentId hierarchy) which enforce a strict tree structure. Real causal investigation follows 5 Whys chains that cross factor boundaries and converge on shared root causes — a DAG pattern that no tree or list can show.

Two prior explorations (Factor Map and Investigation Mindmap) were archived before the question-driven system existed.

## Decision

### 1. CausalLink as First-Class Entity

Introduce `CausalLink` in the investigation store — a directed edge between two factors:

```typescript
interface CausalLink {
  id: string;
  fromFactor: string;
  toFactor: string;
  direction: 'drives' | 'modulates' | 'confounds';
  evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
  whyStatement: string;
  questionIds: string[];
  findingIds: string[];
  hubId?: string;
}
```

The causal graph is a DAG — cycle prevention via `wouldCreateCycle()` (DFS from target looking for source).

### 2. Three-Layer SVG Architecture

The Evidence Map is a single visx SVG canvas with three composited `<g>` layers:

- **Layer 1 (Statistical):** Factor nodes positioned radially by R²adj (strongest closest to center), 5 relationship types between pairs (independent, overlapping, synergistic, interactive, redundant), equation bar. Available in PWA + Azure.
- **Layer 2 (Investigation):** CausalLink directed edges with evidence badges (D/G/E), gap markers for unvalidated links. Azure only.
- **Layer 3 (Synthesis):** SuspectedCause hub convergence zones (dashed circles around factors with 2+ incoming links), hub names, projections. Azure only.

### 3. R²adj-First Relationship Classification

Five relationship types derived from comparing R²adj values:

| Type        | Rule                                 | What Analyst Learns            |
| ----------- | ------------------------------------ | ------------------------------ |
| Independent | R²adj(A+B) ≈ R²adj(A) + R²adj(B) ±2% | Optimize separately            |
| Overlapping | R²adj(A+B) < sum - 2%                | Shared variance, pick stronger |
| Synergistic | R²adj(A+B) > sum + 2%                | Explain more together          |
| Interactive | ΔR² significant in Layer 3           | Combination matters            |
| Redundant   | One factor < 2% when combined        | Can ignore weaker              |

### 4. Deterministic Layout

Pure function computes positions from R²adj — same data → same layout every time. No force simulation, no randomness. Reproducible for export and report. Radial positioning: strongest factors closest to the central outcome node.

### 5. Props-Based, Store-Agnostic

`EvidenceMapBase` accepts all data via props — no store access, no context dependency. `useEvidenceMapData` hook transforms statistical results + investigation state into chart component data. This follows the existing chart architecture pattern.

## Consequences

**Positive:**

- Factor relationships become visible at a glance — the "so what" of Best Subsets
- Causal links create a graph structure that matches how real investigations work (DAG, not tree)
- Convergence points reveal where multiple evidence threads point to the same root cause
- Deterministic layout enables reliable export and report embedding
- Mode-aware via strategy pattern — adapts to standard/capability/yamazumi/performance

**Negative:**

- SVG rendering complexity (3 layers, zoom interaction, touch targets)
- CausalLink is a new entity that needs persistence and migration
- Relationship classification depends on R²adj comparison thresholds — may need tuning

## Implementation

- `packages/charts/src/EvidenceMap/` — 10 files, 959 lines (EvidenceMapBase, StatisticalLayer, InvestigationLayer, SynthesisLayer, FactorNode, RelationshipEdge, CausalEdge)
- `packages/core/src/stats/causalGraph.ts` — classifyRelationship, wouldCreateCycle, findConvergencePoints, topologicalSort, findPaths
- `packages/core/src/stats/evidenceMapLayout.ts` — deterministic radial layout algorithm
- `packages/hooks/src/useEvidenceMapData.ts` — 3-layer data transformation
- `packages/hooks/src/usePopoutChannel.ts` — BroadcastChannel cross-window sync
- `packages/hooks/src/useEvidenceMapTimeline.ts` — chronological frame building for report replay
- `packages/ui/src/components/EvidenceMapSheet/` — mobile bottom sheets (node + edge)
- `packages/stores/src/investigationStore.ts` — CausalLink CRUD with cycle detection
- Design spec: `docs/superpowers/specs/2026-04-05-evidence-map-design.md`
