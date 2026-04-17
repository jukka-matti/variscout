# @variscout/stores

4 Zustand domain stores: project, investigation, improvement, session.

## Hard rules

- Stores are the source of truth. Components read via selectors: `useProjectStore(s => s.field)`. Never `useProjectStore()` without a selector — it subscribes to the whole store and re-renders too often.
- `investigationStore` owns the `CausalLink` entity. `improvementStore` is for finalized improvement ideas/actions. UI-scoped state (filters, panels, highlights) belongs in app feature stores (apps/azure/src/features/), not here.
- Do not introduce a DataContext — Zustand-first architecture is deliberate (ADR-041).

## Invariants

- sessionStore auto-persists to IndexedDB via middleware. Other stores persist via `useProjectActions` (document-level persist).
- Testing pattern: `beforeEach(() => useStore.setState(useStore.getInitialState()))` to reset between tests. Selectors tested as pure functions.
- Cross-store reads: `otherStore.getState()` inside a selector is allowed but should be mocked in tests.
- Complete list of stores: `projectStore`, `investigationStore`, `improvementStore`, `sessionStore`.

## Test command

```bash
pnpm --filter @variscout/stores test
```

## Skills to consult

- `editing-investigation-workflow` — when touching investigationStore / CausalLinks
- `writing-tests` — Zustand store test pattern

## Related

- ADR-041 Zustand feature stores
- docs/superpowers/specs/2026-04-04-zustand-first-state-architecture-design.md
- docs/superpowers/specs/2026-04-04-zustand-direct-store-access-design.md
