---
tier: living
purpose: decide
title: 'ADR-074: SCOUT level-spanning surface — boundary policy'
audience: human
category: architecture
status: active
date: 2026-04-29
related:
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - adr-049-coscout-context-and-memory
  - adr-064-suspected-cause-hub-model
  - adr-066-evidence-map-investigation-center
  - adr-070-frame-workspace
  - multi-level-scout-design
layer: L5
---

# ADR-074: SCOUT level-spanning surface — boundary policy

**Status**: Accepted

**Date**: 2026-04-29

**Supersedes**: None

**Amendment — 2026-05-16:** Partially superseded by [ADR-082](adr-082-wedge-architecture.md). Under the wedge, L2 is the **Process** artifact (project-scoped), not a Hub-level rollup. The boundary policy (Investigation tab owns L3 mechanism work; Process tab handles L1+L2; SCOUT spans the surface without reimplementing L1/L3 primitives) is unchanged. Multi-project / portfolio-spanning L2 (Hub portfolio) defers to **VariScout Process**, the future enterprise product.

**Related**:
[ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md) (locality rule, same enforcement mechanism),
[ADR-049](adr-049-coscout-context-and-memory.md) (Knowledge Catalyst — investigation as memory, depends on this policy),
[ADR-064](../archive/adrs/adr-064-suspected-cause-hub-model.md) (SuspectedCause hub model),
[ADR-066](adr-066-evidence-map-investigation-center.md) (Evidence Map as investigation center),
[ADR-070](adr-070-frame-workspace.md) (FRAME workspace as L2 authoring owner),
[Multi-level SCOUT design](../archive/specs/2026-04-29-multi-level-scout-design.md) (the spec this policy companions)

---

## Context

VariScout's methodology assigns three levels — system / outcome (L1), flow / process model (L2), and local mechanism / evidence (L3) — to phases. FRAME owns L2 authoring (river-styled SIPOC; column mapping). SCOUT owns L1 outcome reading. INVESTIGATE owns L3 mechanism case-building. IMPROVE owns response paths. The Multi-level SCOUT design (`docs/archive/specs/2026-04-29-multi-level-scout-design.md`) promotes levels from a phase-only assignment to a **level-spanning surface architecture**: each surface keeps its primary level (its job-to-be-done) and gains lensed access to the other two via links to the surface that owns each level.

Without a structural boundary policy, the level-spanning architecture drifts toward duplication. Concrete temptations the policy prevents:

- SCOUT redoing FRAME's column-mapping authoring (because lensed L2 needs flow context).
- INVESTIGATE recomputing SCOUT's outcome stats (because hypothesis cards display Findings).
- Hub Capability tab implementing its own SuspectedCause hub UI (because per-step badges count open hypotheses).
- Evidence Map maintaining its own boxplot rendering (because clicking a factor shows L1 distributions).

Each is a temptation that arises naturally during implementation. None is caught by linting alone. The policy makes them structurally impossible.

This ADR is analogous to ADR-073 (no statistical roll-up across heterogeneous units) — that ADR enforces locality through structural absence; ADR-074 enforces level-ownership through the same mechanism.

## Decision

**Each level has exactly one owner surface for analytical primitives. Other surfaces lens the owner via links and embedded mini-panels, never via reimplementation.**

### Level-to-owner assignment (analytical primitives)

- **L1 Outcome (analytical reading)** → SCOUT, four-lens dashboard at `packages/ui/src/components/DashboardBase/`.
- **L2 Flow (process model rendering)** → Hub Capability tab, `LayeredProcessView` + Operations band (just shipped via PRs #103/#105/#106/#107).
- **L3 Mechanism (factor network)** → Evidence Map at `packages/ui/src/components/EvidenceMap/` plus the factor layer.
- **L3 Mechanism (hypothesis canvas)** → Investigation Wall at `packages/ui/src/components/InvestigationWall/`.

### Level-to-phase assignment (methodology, unchanged)

- **L2 Flow (authoring)** → FRAME (river-styled SIPOC; column mapping).
- **L1 Outcome (reading)** → SCOUT.
- **L3 Mechanism (case-building)** → INVESTIGATE.
- **Response paths** → IMPROVE.

Authoring and reading are different jobs at the same level: FRAME owns L2 authoring; Hub Capability owns L2 reading. Both are L2 owners with non-overlapping jobs.

### Boundary contract

1. A surface lenses another surface's level via an embedded mini-panel plus a deep-link to the owner. The mini-panel is read-only and minimal.
2. A surface MUST NOT reimplement another surface's primary view. If a feature seems to require it, the design is wrong; refactor toward a shared component owned by the destination surface.
3. New level-spanning interactions go through the navigation contract in the design spec §3 (Multi-level SCOUT model — surfaces as level-spanning lenses).
4. CoScout coaching respects ownership — at FRAME it coaches scope-binding, at SCOUT it coaches outcome reading, at INVESTIGATE it coaches mechanism case-building. CoScout does not bypass the boundary by issuing tools that duplicate owner functionality.

## Rationale

Three reasons this enforcement matters:

1. **Methodology fidelity.** The three-level model (system / flow / mechanism) is methodologically load-bearing. If the surfaces conflate, the methodology becomes ceremonial — the analyst can't tell which level they're working at, and the level-appropriate questions (`what measure needs to change` vs `what flows where` vs `what physics explains`) collapse into a single undifferentiated "look at the dashboard" workflow.

2. **Code-base coherence.** The codebase already organizes metrics by level: `packages/core/src/stats/` for L1 outcome statistics; `packages/core/src/defect/`, `packages/core/src/yamazumi/`, `packages/core/src/performance.ts`, and `packages/core/src/stats/stepErrorAggregation.ts` for L2 flow metrics; `packages/core/src/findings/` and `packages/core/src/stats/evidenceMapLayout.ts` for L3 mechanism artifacts. Without the policy, new features add cross-cutting concerns that erode this organization, making future work harder.

3. **Knowledge memory.** Investigation-as-memory (ADR-049, Knowledge Catalyst) requires that Findings, SuspectedCauses, and CausalLinks remain singular — owned by one surface, queried by many. Duplication breaks the lineage required for `computeFindingWindowDrift` and `computeCrossInvestigationHypothesisFrequency` (both in the spec's metric layer). Singular ownership is what makes investigation history queryable as memory.

This is the same call ADR-069 made for numeric safety and ADR-073 made for cross-unit aggregation: structural enforcement beats discipline. Permission predicates and lint rules degrade as new contributors invent new wrappers; design absence is invariant.

## Consequences

- **Cross-surface views become responsibility of the navigation layer**, not of each surface. The navigation contract in the spec §3 is the single source of truth.
- **Refactoring obligation:** the just-shipped `ProductionLineGlanceDashboard` (PRs #103/#105/#106/#107) is a bespoke composition of charts. Per this ADR, it should be refactored onto the strategy + dataRouter pattern when the implementation plan for the design spec lands. This is delivery-shape, not an immediate change.
- **CoScout tool registry constraints.** Tools that operate at one level must not bypass the policy by writing to another level's primary view. CoScout authors should treat the level boundary as a structural-absence rule when designing new tools.
- **Future modes inherit the policy automatically.** A new analysis mode (e.g., the design-only Process Flow mode) gains its slot composition from the strategy pattern, gains its data routing from `dataRouter`, and gains its level-spanning lensed views from the navigation contract. No new boundary work per mode.
- **Investigation Wall, Evidence Map, Hub Capability, and SCOUT each gain mini-panel + deep-link affordances** rather than duplicated surfaces. The mini-panel API is part of the navigation contract.

## Verification

The policy is enforceable by structural absence (mirroring ADR-073's verification pattern). Concrete checks:

- `rg "outcomeStats|outcomeBoxplot|outcomeIChart" packages/ui/src/components/InvestigationWall/` returns zero hits — Investigation Wall does not reimplement L1 chart rendering.
- `rg "stratifyByFactor|factorEdge|factorRelationship" packages/ui/src/components/DashboardBase/` returns zero hits — SCOUT does not reimplement Evidence Map's factor-network rendering.
- `rg "hypothesisCanvas|suspectedCauseHub|gateNode" packages/ui/src/components/Frame*/` returns zero hits — FRAME does not embed hypothesis canvas surfaces.
- `rg "LayeredProcessView|OperationsBand" packages/ui/src/components/EvidenceMap/` returns zero hits — Evidence Map does not reimplement L2 flow rendering.
- A CI check (or pre-commit script) at `scripts/check-level-boundaries.sh` verifies the structural-absence claims continuously. The script ships with the multi-level SCOUT V1 first-slice implementation and runs in pre-commit.

These checks become meaningful once the relevant component directories are created — `InvestigationWall/`, `DashboardBase/`, `EvidenceMap/`, and `Frame*/` are referenced by the spec but do not all exist in the current codebase. Until they do, the absence of the directories is itself structural enforcement; the rg patterns are forward-looking guards that activate as the first-slice implementation lands.

The verification is intentionally stricter than runtime enforcement — duplication is forbidden by tooling, not by lint rules that can be silenced. New code review must reject any PR introducing a primary-view reimplementation across the boundary; the rule applies to component names, exported types, and CoScout tool definitions.

## Status

Accepted (2026-04-29). Captures a structural decision the Multi-level SCOUT design depends on.

## Supersedes / superseded by

- Supersedes: none (new policy).
- Superseded by: none (active).
- Related: ADR-073 (locality rule, same enforcement mechanism), ADR-049 (Knowledge Catalyst, depends on this), ADR-064 (SuspectedCause hub model, owned at L3), ADR-066 (Evidence Map as investigation center, L3 owner), ADR-070 (FRAME workspace as L2 authoring owner).

## Amendment — 2026-05-13 (Canvas as viewport surface, 8f)

Co-issued with [ADR-081](adr-081-canvas-viewport-architecture.md). The level-spanning policy is unchanged; this amendment recognizes one named exception:

**Canvas is the viewport surface** — the visual home for scan + navigation across all three levels (System / Process Flow / Local Mechanism). It mounts level-specific views by **embedding owner-surface components** (importing the React component + the same computed data), not by re-rendering or recomputing. Owner surfaces — SCOUT (L1), Evidence Map + Wall (L3) — remain analytical engines and deep-work destinations. Clicking inside a Canvas-at-Lx view opens the owner surface full-screen for the same scope.

The "no re-rendering / no recomputing" rule still binds. Concretely:

- Canvas-L1 imports `<DashboardBase/>` (or a leaner slim outcome panel export) and reads the SCOUT-computed outcome stats unchanged.
- Canvas-L3 imports `<EvidenceMapBase/>` and `<WallCanvas/>` (with a `filterByStepId` prop) and renders them inside a canvas-shaped frame. The factor-network computation lives in `@variscout/charts/EvidenceMap` and is not re-derived.
- Canvas-L2 is already the L2 owner post-Canvas-migration; no change.

The verification scripts in §Verification above gain a Canvas-aware exception: Canvas may import owner-surface components, but it may not implement parallel ones. The same `rg` patterns continue to enforce no parallel `factorNetwork` / `outcomeBoxplot` / etc. inside `Canvas/`; the difference is that Canvas's directory becomes an allowed import target for those components, not a forbidden one.

Design spec: [`docs/archive/specs/2026-05-13-canvas-viewport-architecture-design.md`](../archive/specs/2026-05-13-canvas-viewport-architecture-design.md). Companion ADR: [ADR-081](adr-081-canvas-viewport-architecture.md). Amendment status: accepted.
