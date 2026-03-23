---
title: 'ADR-044: Architectural Review (March 2026)'
status: Accepted
date: 2026-03-23
---

# ADR-044: Architectural Review

## Status

Accepted

## Date

2026-03-23

## Context

An expert panel architectural review of the full codebase assessed architecture across 10 dimensions (package layering, component architecture, state management, domain model, AI architecture, security, infrastructure, offline/sync, testing, i18n). The review validated all technology choices and identified 15 improvement items.

Overall grade: **B+ (Solid)**. All technology choices (Turborepo, EasyAuth, Visx, Zustand, React Compiler, Web Workers) confirmed as current best practice (2025-2026 industry research).

## Decision

Implement 11 of 15 items. Defer 2 (pnpm release age requires version upgrade; useEditorDataFlow refactor has low ROI vs risk). 1 requires manual GitHub App install (Socket.dev). Dashboard extraction deferred — existing DashboardLayoutBase provides sufficient sharing.

### Implemented Items

**Security:**
1. Proxy `VITE_FUNCTION_KEY` through `server.js` — Function key removed from client bundle
2. Add lockfile-lint to CI for HTTPS-only registry enforcement

**Monitoring:**
3. Add App Insights JS SDK — customer-scoped telemetry via connection string from `/config`

**Architecture:**
4. Extract `DataPanelBase` to `@variscout/ui` — eliminated ~620 LOC duplication
5. Split `storage.ts` (1,161 LOC) into `localDb.ts`, `cloudSync.ts`, and orchestrator
6. Move `import.meta.glob` out of `@variscout/core` — `registerLocaleLoaders` API
7. Add 17 sub-path exports to `@variscout/core`
8. Enable React Compiler lint rules (`eslint-plugin-react-hooks` v7 `recommended-latest`)

**Infrastructure:**
9. Multi-stage deployment pipeline with staging slot swap + auto-rollback
10. Turborepo CI caching (`actions/cache` for `.turbo/`)

**Documentation:**
11. Zustand store interaction graph (confirmed: no direct store-to-store deps)
12. Disaster recovery documentation (RTO/RPO, key rotation, rollback)

## Consequences

### Positive
- Function key no longer in client bundle (defense in depth)
- Customer admins have App Insights visibility into their instance
- ~620 LOC duplication eliminated (DataPanel)
- Storage module now testable in isolation
- Core package is bundler-agnostic (no Vite dependency)
- Zero-downtime production deployments possible
- 94 React Compiler warnings reduced to ~24 (then to 0 in follow-up)

### Negative
- `server.js` now has proxy logic (was pure static server)
- Apps must call `registerLocaleLoaders()` at startup
- 108 compiler lint warnings discovered (progressive fix required)

### Deferred
- `pnpm minimum-release-age` — requires pnpm 10.16+ (currently 9.15.0)
- `useEditorDataFlow` discriminated union — reducer already well-structured
- Socket.dev GitHub App — manual install for behavioral supply chain scanning
