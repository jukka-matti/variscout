# @variscout/stores

4 Zustand domain stores (project, investigation, improvement, session) + 1 cross-app feature store (wallLayout).

## Hard rules

- Stores are the source of truth. Components read via selectors: `useProjectStore(s => s.field)`. Never `useProjectStore()` without a selector — it subscribes to the whole store and re-renders too often.
- `investigationStore` owns the `CausalLink` entity and `problemContributionTree` (Wall contribution tree over `SuspectedCause` hubs). `improvementStore` is for finalized improvement ideas/actions.
- UI-scoped state (filters, panels, highlights) generally belongs in app feature stores (`apps/azure/src/features/`). **Exception:** state shared across PWA and Azure lives here — see `wallLayoutStore` as the established pattern for cross-app UI state.
- Do not introduce a DataContext — Zustand-first architecture is deliberate (ADR-041).

## Invariants

- `sessionStore` auto-persists via idb-keyval middleware. Domain stores (project/investigation/improvement) persist at document-level via `useProjectActions`.
- `wallLayoutStore` persists to a dedicated Dexie DB (`variscout-wall-layout`, distinct from `VaRiScoutAzure`) keyed by `projectId`. Call `rehydrateWallLayout(projectId)` on project open, `persistWallLayout(projectId)` debounced on mutations. PWA is session-only (hook is no-op when projectId is null).
- Testing pattern: `beforeEach(() => useStore.setState(useStore.getInitialState()))` to reset between tests. Selectors tested as pure functions.
- Cross-store reads: `otherStore.getState()` inside a selector is allowed but should be mocked in tests.
- Complete list of stores: `projectStore`, `investigationStore`, `improvementStore`, `sessionStore`, `wallLayoutStore`.

## Test command

```bash
pnpm --filter @variscout/stores test
```

## Skills to consult

- `editing-investigation-workflow` — when touching investigationStore / CausalLinks / problemContributionTree
- `writing-tests` — Zustand store test pattern

## Related

- ADR-041 Zustand feature stores
- docs/superpowers/specs/2026-04-04-zustand-first-state-architecture-design.md
- docs/superpowers/specs/2026-04-04-zustand-direct-store-access-design.md
- docs/superpowers/specs/2026-04-19-investigation-wall-design.md — wallLayoutStore spec
