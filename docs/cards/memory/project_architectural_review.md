---
title: 'Architectural Review Results'
description: 'Expert panel review (B+ overall) with 11/14 items implemented (Mar 2026). Technology choices validated. Key remaining items noted.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 1fce56fe41e035fb
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_architectural_review.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Architectural Review (2026-03-23)

Expert panel review rated codebase B+ overall. All technology choices (Turborepo, EasyAuth, Visx, Zustand, React Compiler, Web Workers) validated as current best practice — no migrations needed.

## Implemented (11 items)

1. **App Insights JS SDK** — `apps/azure/src/lib/appInsights.ts`, customer-scoped monitoring (connection string from /config endpoint)
2. **VITE_FUNCTION_KEY proxied** — Server-side proxy at `/api/token-exchange` in server.js, secret removed from client bundle. Future: Managed Identity.
3. **React Compiler lint rules** — `eslint-plugin-react-hooks` v7 `recommended-latest` preset active (108 warnings, progressive fix)
4. **DataPanelBase extracted** — `packages/ui/src/components/DataPanel/DataPanelBase.tsx`, app wrappers 37+34 LOC
5. **storage.ts split** — `localDb.ts` (88 LOC), `cloudSync.ts` (571 LOC), `storage.ts` orchestrator (577 LOC)
6. **Multi-stage deployment** — `deploy-azure-production.yml` with slot swap + auto-rollback
7. **Store interaction docs** — `docs/05-technical/architecture/store-interactions.md` — finding: no direct store-to-store deps, clean architecture
8. **i18n layering fix** — `registerLocaleLoaders()` API in core, `import.meta.glob` moved to app entry points
9. **Sub-path exports** — 17 sub-paths in `@variscout/core` package.json exports (stats, ai, parser, findings, variation, yamazumi, etc.)
10. **Supply chain** — lockfile-lint in CI, Dependabot already configured
11. **DR documentation** — `docs/05-technical/implementation/disaster-recovery.md`
12. **Turbo caching** — `actions/cache@v4` for `.turbo/`, explicit task inputs in turbo.json

## Deferred

- **pnpm minimum-release-age** — Requires pnpm 10.16+ (currently 9.15.0). Add `minimum-release-age=10080` to .npmrc after upgrade.
- **useEditorDataFlow discriminated union** — Reducer already well-structured with explicit transitions. Revisit when adding new editor phases.
- **Socket.dev GitHub App** — Manual install, catches malicious packages via behavioral analysis

## Key Findings

- `eslint-plugin-react-compiler` is DEPRECATED — rules merged into `eslint-plugin-react-hooks` v7+
- `@azure/monitor-opentelemetry` is Node.js-only — use `@microsoft/applicationinsights-web` for browser
- Zustand stores are fully isolated (no store-to-store reads), all coordination via orchestration hooks
- EasyAuth creates hard App Service dependency — document as migration risk if ever moving to containers

**How to apply:** Reference when planning future architecture work. The 108 React Compiler lint warnings are a backlog to fix progressively.
