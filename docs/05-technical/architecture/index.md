---
title: Architecture Documentation
audience: [developer]
category: architecture
status: stable
related: [monorepo, offline-first, data-flow, ai-architecture]
---

# Architecture Documentation

Detailed architecture documents for VariScout's technical design.

## Documents

| Document                                                        | Purpose                                            |
| --------------------------------------------------------------- | -------------------------------------------------- |
| [Offline-First](offline-first.md)                               | Service worker, caching strategy, PWA capabilities |
| [Monorepo](monorepo.md)                                         | pnpm workspaces structure, package boundaries      |
| [Shared Packages](shared-packages.md)                           | Cross-platform code sharing patterns               |
| [Data Flow](data-flow.md)                                       | Data pipeline from input through stats to charts   |
| [Component Patterns](component-patterns.md)                     | colorScheme pattern, Base component extraction     |
| [AI Architecture](ai-architecture.md)                           | AI Foundry integration, prompt templates, phases   |
| [AI Context Engineering](ai-context-engineering.md)             | Context assembly, pipeline reference, module map   |
| [AI Journey Integration](ai-journey-integration.md)             | AI × journey overview and entry point              |
| [AIX Design System](aix-design-system.md)                       | AI governance, tone, trust, interaction patterns   |
| [Knowledge Model](knowledge-model.md)                           | Unified glossary terms + methodology concepts      |
| [The Journey Model](mental-model-hierarchy.md)                  | Journey-as-spine with per-phase methods            |
| [Journey Phase Screen Mapping](journey-phase-screen-mapping.md) | Phase-to-screen-to-component traceability          |
| [System Map](system-map.md)                                     | Visual package/app topology (C4 L1)                |
| [Data Pipeline Map](data-pipeline-map.md)                       | End-to-end data flow with TypeScript interfaces    |
| [Store Interactions](store-interactions.md)                     | Zustand cross-store coupling analysis (ADR-041)    |
| [Sub-Path Exports](sub-path-exports.md)                         | 17 sub-path export API for @variscout/core         |
| [Component Map](component-map.md)                               | L3 component views per package                     |

## See Also

- [Architecture Overview](../architecture.md) — high-level stack, package diagram, directory structure
- [Implementation](../implementation/) — testing, deployment, security scanning
- [ADR-023: Verification Experience & Data Lifecycle](../../07-decisions/adr-023-data-lifecycle.md) — data entry paths, append, staged verification vision
- [ADR-024: Scouting Report](../../07-decisions/adr-024-scouting-report.md) — dynamic Report View, copy-as-slide, Teams deep links
- [ADR-041: Zustand Feature Stores](../../07-decisions/adr-041-zustand-feature-stores.md) — DataContext vs Zustand, store architecture
- [ADR-045: Modular Architecture](../../07-decisions/adr-045-modular-architecture.md) — DDD-lite + Feature-Sliced Design
- [ADR-047: Analysis Mode Strategy Pattern](../../07-decisions/adr-047-analysis-mode-strategy.md) — mode-specific rendering contracts
- [ADR-048: ESLint Boundary Enforcement](../../07-decisions/adr-048-eslint-boundaries.md) — package DAG enforcement at 0 violations
