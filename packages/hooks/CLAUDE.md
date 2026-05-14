# @variscout/hooks

78 shared React hooks: data pipeline, charts, AI, investigation, Evidence Map.

## Hard rules

- All exported hooks named with `use` prefix (React convention).
- Depends on `@variscout/core` only. No imports from `@variscout/ui`, `@variscout/charts`, or apps.
- Tests live in `packages/hooks/src/__tests__/` alongside source, one test file per hook.

## Invariants

- Tests that use translations must call `registerLocaleLoaders()` with `import.meta.glob` before calling `preloadLocale()`. Reference: `packages/core/src/i18n/__tests__/index.test.ts`.
- Hooks that compose shared state (e.g., `useHubComputations`, `useCoScoutProps`) read from `@variscout/stores` selectors, never call `getState()` in render paths.
- `useChartCopy` owns chart export (PNG/SVG/clipboard) dimensions and pixel ratio. Consumers pass a ref.
- `usePopoutChannel` is the canonical BroadcastChannel wrapper. Findings, Improvement, Evidence Map pop-outs all use it.
- `useTimelineWindow` owns the dashboard's active TimelineWindow; `useDataRouter` is a sanity-check wrapper around the strategy's `dataRouter` (no runtime hook switching).
- Flaky test watch: `packages/hooks/src/__tests__/index.test.ts` can timeout under concurrent Turbo load; passes when run alone.

## Test command

```bash
pnpm --filter @variscout/hooks test
```

## Scope boundary

- Hooks consume stores; never define new stores here. New domain stores belong in `packages/stores/` (3-layer model). New app-local UI state belongs in feature stores under `apps/*/src/features/`.

## Related

- ADR-041 Zustand feature stores
- ADR-045 Modular architecture
