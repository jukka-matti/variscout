---
title: 'ADR-001: Monorepo with pnpm Workspaces'
---

# ADR-001: Monorepo with pnpm Workspaces

**Status**: Accepted

**Date**: 2024-01-15

---

## Context

VariScout consists of multiple applications (PWA, Azure App, Marketing Website) that share significant code including statistical calculations, chart components, and UI utilities. We needed a code organization strategy that enables sharing while maintaining clear boundaries.

---

## Decision

Use pnpm workspaces in a monorepo structure:

```
packages/
├── core/      # Pure logic (stats, parser, types)
├── charts/    # React + Visx chart components
├── data/      # Sample datasets
├── hooks/     # Shared React hooks
└── ui/        # Shared UI components

apps/
├── pwa/          # React + Vite PWA
├── azure/        # Azure Team App
└── website/      # Astro marketing site
```

---

## Consequences

### Benefits

- Single source of truth for shared code
- Atomic commits across packages and apps
- Simplified dependency management with `workspace:*`
- pnpm's efficient disk usage via hard links

### Trade-offs

- More complex build orchestration
- Must be careful about package boundaries
- Git history can be harder to navigate

---

## See Also

- [Monorepo Architecture](../05-technical/architecture/monorepo.md)
