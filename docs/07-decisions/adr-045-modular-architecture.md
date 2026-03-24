---
title: 'ADR-045: Modular Architecture — DDD-Lite with Feature-Sliced Design'
---

# ADR-045: Modular Architecture — DDD-Lite with Feature-Sliced Design

**Status:** Accepted
**Date:** 2026-03-23

## Context

VariScout's architecture evolved through 12-phase component extraction (Feb 2026), ADR-041 Zustand migration (Mar 2026), and continuous package boundary refinement. The result is a clean, unidirectional monorepo structure that follows Domain-Driven Design principles without the full DDD ceremony. This ADR documents the architecture as intentional design.

### Architecture assessment (Mar 2026)

An evaluation of all package boundaries, dependency directions, code distribution, and Feature-Sliced Design patterns rated the overall architecture **A-**:

- Zero layer violations (packages never import apps, core has no React)
- Unidirectional dependency DAG with no circular dependencies
- 65% component sharing between PWA and Azure
- Clean size balance: core 46%, ui 31%, hooks 11%, charts 9%, data 2%

### Why document now

The architecture is well-structured but implicit. New features risk violating boundaries because the rules exist only in convention, not in documentation or tooling. This ADR makes the design explicit.

## Decision

### Package architecture: Presentation-Domain-Data layering

```
┌─────────────────────────────────────────────────────────────┐
│ Apps Layer                                                  │
│   apps/azure (Context + Zustand + Feature-Sliced Design)   │
│   apps/pwa   (Context, flat structure)                     │
│   apps/website, apps/docs                                  │
├─────────────────────────────────────────────────────────────┤
│ Presentation Layer                                         │
│   @variscout/ui     (66 shared *Base components, themes)   │
│   @variscout/charts (Visx chart components, props-based)   │
├─────────────────────────────────────────────────────────────┤
│ Orchestration Layer                                        │
│   @variscout/hooks  (57 React hooks, data pipeline)        │
├─────────────────────────────────────────────────────────────┤
│ Domain Layer                                               │
│   @variscout/core   (stats, parser, AI, types, glossary)   │
│   @variscout/data   (sample datasets)                      │
└─────────────────────────────────────────────────────────────┘
```

Dependencies flow **strictly downward**. No upward or lateral imports.

### DDD concepts already implemented

| DDD Concept         | VariScout Implementation                                                             |
| ------------------- | ------------------------------------------------------------------------------------ |
| Domain model        | `@variscout/core` — pure TypeScript, no React, 41K LOC                               |
| Value objects       | `StatsResult`, `SpecLimits`, `Finding`, `Hypothesis` — immutable domain types        |
| Bounded contexts    | Sub-path exports: `/stats`, `/ai`, `/parser`, `/findings`, `/variation`, `/yamazumi` |
| Aggregate roots     | `useFindings` and `useHypotheses` enforce lifecycle rules                            |
| Ubiquitous language | Glossary + knowledge model in `@variscout/core/glossary`                             |
| Feature slices      | Azure `features/` with 6 co-located stores (ADR-041)                                 |

### Why not full DDD

Full DDD adds infrastructure (domain events bus, application services, repository interfaces, aggregate factories) suited to multi-team backend systems. VariScout is:

- **Browser-only** — no backend, no database migrations, no distributed transactions
- **Single developer** — team coordination overhead isn't the bottleneck
- **Already well-bounded** — monorepo packages enforce context isolation at build time

The DDD-lite approach provides 80% of the architectural benefit at 20% of the ceremony cost.

### Package boundary rules

| Rule                                                     | Enforced by                                 |
| -------------------------------------------------------- | ------------------------------------------- |
| Packages never import apps                               | Convention (future: ESLint boundary plugin) |
| `@variscout/core` has no React dependency                | Build (would fail)                          |
| `@variscout/hooks` depends only on core + data           | package.json                                |
| `@variscout/ui` depends on hooks + core + charts         | package.json                                |
| Apps may import any package                              | Monorepo resolution                         |
| Apps never import each other                             | Convention                                  |
| `*Base` components accept data via props, no app context | Convention                                  |

### Feature-Sliced Design (Azure only)

Azure uses Feature-Sliced Design for its 6 domain features:

```
features/
├── ai/             — aiStore + useAIOrchestration + useToolHandlers (composer)
│                     + readToolHandlers, actionToolHandlers, teamToolHandlers
├── findings/       — findingsStore + useFindingsOrchestration
├── investigation/  — investigationStore + useInvestigationOrchestration
├── improvement/    — improvementStore + useImprovementOrchestration
├── panels/         — panelsStore + usePanelsSideEffects
└── data-flow/      — useEditorDataFlow (useReducer, not Zustand)
```

Each feature exports a **store** (Zustand, read-side UI state) and an **orchestration hook** (syncs from shared `@variscout/hooks` CRUD engines to the store). DataContext stays as React Context for the core data pipeline.

PWA does not need Feature-Sliced Design — its 50-file flat structure is appropriate for a lightweight training app.

### Cross-store coupling evaluation

Orchestration hooks currently make direct cross-store calls:

| Caller                     | Target      | Calls | Example                                          |
| -------------------------- | ----------- | ----- | ------------------------------------------------ |
| findingsOrchestration      | panelsStore | 4     | `setFindingsOpen(true)` after creating a finding |
| investigationOrchestration | panelsStore | 2     | `setWhatIfOpen(true)` for projection             |
| useToolHandlers            | panelsStore | 6     | AI `navigate_to` tool opens panels               |

**Total: 12 cross-store calls across 3 files.**

**Domain events evaluation:** An event bus (`emit('finding-created')` → listeners in panelsStore react) would decouple these calls. However:

- 12 calls is manageable without indirection
- Event buses add debugging complexity (implicit flow vs explicit function calls)
- Single developer doesn't benefit from decoupling team dependencies

**Verdict:** Domain events are a future option if cross-store calls exceed ~30 or feature count exceeds ~10. Document and revisit in Q3 2026.

### Component extraction pattern

Shared components in `@variscout/ui` follow the `*Base` pattern:

```
@variscout/ui:  DashboardLayoutBase (props: data, callbacks, render slots)
apps/azure:     Dashboard.tsx (wires DataContext + stores → DashboardLayoutBase)
apps/pwa:       Dashboard.tsx (wires DataContext → DashboardLayoutBase)
```

**When to extract to `@variscout/ui`:**

- Component is used by both PWA and Azure (or could be)
- Component has no app-specific dependencies (no DataContext, no Zustand stores)
- Component accepts all data via props

**When to keep in the app:**

- Component uses `useData()` context or Zustand stores
- Component is Azure-only (Teams, OneDrive, Knowledge Base features)
- Component has complex app-specific wiring

### Recommendations for future features

1. **New Azure features** should follow Feature-Sliced Design: create `features/[name]/` with store + orchestration hook
2. **New shared components** should be `*Base` in `@variscout/ui` with app wiring in each app
3. **Large components** (>500 lines) should extract data preparation into custom hooks
4. **Cross-store calls** should be explicit (`store.getState().action()`) until event infrastructure is justified
5. **Consider ESLint boundary enforcement** to prevent layer violations as the codebase grows

## Consequences

### Positive

- Architecture is documented and can be validated by new contributors
- Clear guidance for where new code belongs (domain → core, UI → ui, wiring → hooks, app-specific → features/)
- DDD-lite provides structure without over-engineering
- Domain events path is documented for future scaling

### Negative

- No runtime enforcement of package boundaries (ESLint plugin not yet added)
- PWA doesn't follow Feature-Sliced Design (acceptable for current size)
- Cross-store coupling is explicit but creates implicit ordering dependencies

## Architectural Review Results (Mar 2026)

A CTO-level architecture analysis graded the overall architecture **B+** — production-ready, maintainable, with strong foundations but incomplete integration between subsystems. Key findings:

- **Strongest aspect:** Unidirectional data flow (DataContext → Hooks → Orchestration → Stores → Components) — clean, testable, no circular dependencies
- **Strategy pattern (ADR-047):** Correct abstraction, 26% adopted (2 of ~13 sites). `chartSlots`, `aiChartInsightKeys`, `aiToolSet` fields defined but not consumed
- **AI mode awareness gap:** `analysisMode` not wired from Editor.tsx to useAIOrchestration — AI uses SPC terminology in all modes
- **Validated decisions:** DataContext as React Context (correct for low-frequency data pipeline), state-driven navigation without router (correct for Teams-embedded workspace), Editor.tsx size (acceptable at 1,289 lines as composition root)

See ADR-047 Implementation Status for the strategy adoption roadmap.

## Related

- [ADR-041: Zustand Feature Stores](adr-041-zustand-feature-stores.md) — store architecture and DataContext validation
- [ADR-044: Architectural Review](adr-044-architectural-review.md)
- [ADR-046: Event-Driven Architecture](adr-046-event-driven-architecture.md) — evaluated and superseded; `getState()` retained
- [ADR-047: Analysis Mode Strategy Pattern](adr-047-analysis-mode-strategy.md) — mode-specific rendering contracts
- [ADR-048: ESLint Boundary Enforcement](adr-048-eslint-boundaries.md) — tooling validation of package DAG
- [Store Interactions](../05-technical/architecture/store-interactions.md)
