---
tier: ephemeral
purpose: build
title: 'R2b Static Computed Fixtures Implementation Plan'
status: active
date: 2026-05-31
layer: spec
---

# R2b Static Computed Fixtures Implementation Plan

## Summary

Finish the R2 data-boundary cleanup by removing runtime chart/stat computation from `@variscout/data` while preserving website behavior and existing sample keys. Runtime data APIs remain stable; computation moves to a package tooling script that emits tracked static fixtures.

## Scope

- Branch/worktree: `codex/refactor-static-computed-fixtures` from current `origin/main`.
- Preserve root `@variscout/data` exports used by apps and website: `SAMPLES`, `getSample`, `getCachedComputedData`, and `ComputedChartData`.
- Preserve `@variscout/data/computed` lookup APIs: `getComputedData(urlKey)` and `getCachedComputedData(urlKey)`.
- Remove unreferenced runtime helper exports from `@variscout/data/computed`: `computeIChartData`, `computeBoxplotData`, `computeParetoData`, and `computeStats`.
- Add `pnpm --filter @variscout/data generate:computed`.

## Implementation

1. Add `packages/data/src/computed/generated.ts` as tracked generated source keyed by sample `urlKey`.
2. Add `packages/data/scripts/generate-computed-fixtures.ts` with script-only compute helpers that use `@variscout/core` stats functions.
3. Serialize as TypeScript literals so optional `undefined` keys remain shape-compatible with current runtime objects.
4. Replace runtime `packages/data/src/computed/index.ts` with lookup-only functions backed by generated fixtures.
5. Add package tests that prove fixture coverage, script/regenerated output parity, deterministic sample guards, and lookup-only runtime boundaries.
6. Update the roadmap/investigation note and `packages/data/CLAUDE.md`.

## Validation

- `pnpm --filter @variscout/data generate:computed`
- `git diff --check`
- `pnpm --filter @variscout/data test`
- `pnpm --filter @variscout/data lint`
- `pnpm --filter @variscout/data build`
- `pnpm --filter @variscout/website build`
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- `pnpm check:generated-artifacts`
- `pnpm docs:check`
- `bash scripts/check-dead-links.sh`
- `bash scripts/pr-ready-check.sh`

## Non-Goals

- Do not change sample URL keys, sample names, raw sample rows, chart rendering components, website routes, app behavior, or runtime package dependency direction.
- Do not add generated computed fixtures to generated-artifact hygiene blocklists; they are intentionally tracked source.
- Do not move unrelated computed chart logic outside this R2b boundary.
