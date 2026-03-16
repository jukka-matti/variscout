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

| Document                                            | Purpose                                            |
| --------------------------------------------------- | -------------------------------------------------- |
| [Offline-First](offline-first.md)                   | Service worker, caching strategy, PWA capabilities |
| [Monorepo](monorepo.md)                             | pnpm workspaces structure, package boundaries      |
| [Shared Packages](shared-packages.md)               | Cross-platform code sharing patterns               |
| [Data Flow](data-flow.md)                           | Data pipeline from input through stats to charts   |
| [Component Patterns](component-patterns.md)         | colorScheme pattern, Base component extraction     |
| [AI Architecture](ai-architecture.md)               | AI Foundry integration, prompt templates, phases   |
| [AI Readiness Review](ai-readiness-review.md)       | Phase 1-3 delivery assessment and readiness        |
| [Knowledge Model](knowledge-model.md)               | Unified glossary terms + methodology concepts      |
| [AI Context Engineering](ai-context-engineering.md) | Context assembly for AI prompts and CoScout        |

## See Also

- [Architecture Overview](../architecture.md) — high-level stack, package diagram, directory structure
- [Implementation](../implementation/) — testing, deployment, security scanning
