# @variscout/stores

6 Zustand stores across 3 layers (ADR-078 + F4, 2026-05-07):

| Layer           | Store                    | Persistence                                                 |
| --------------- | ------------------------ | ----------------------------------------------------------- |
| Document (×3)   | `useProjectStore`        | consumer-side serialisation via `useProjectActions`         |
| Document        | `useInvestigationStore`  | session-only today; future `HubRepository.dispatch`         |
| Document        | `useCanvasStore`         | `dispatch(CanvasAction)` + hub repository                   |
| Annotation hub  | `useCanvasViewportStore` | Dexie DB `variscout-canvas-viewport` (R12 ESLint exception) |
| Annotation user | `usePreferencesStore`    | idb-keyval, key `'variscout-preferences'`                   |
| View            | `useViewStore`           | NONE — transient                                            |

**Boundary rule (portability test):** another analyst importing this hub needs it? Yes → Document. Survives reload but not portable → Annotation. Doesn't survive reload → View. `__tests__/layerBoundary.test.ts` enforces middleware presence/absence.

## Hard rules

- Selectors required: `useProjectStore(s => s.field)`. Never bare `useStore()`. No DataContext (ADR-041).
- `investigationStore` owns `CausalLink` + `problemContributionTree`; highlights live in `useViewStore`.
- Cross-app UI state lives here (`canvasViewportStore` pattern); app-local state → `apps/*/src/features/`.
- Cross-store imperative action calls allowed; reactive subscriptions forbidden.
- Document stores never import `dexie` directly (ESLint P7.2). `canvasViewportStore` is R12 exception — call `rehydrateCanvasViewport(hubId)` on hub open, debounced `persistCanvasViewport(hubId)` on mutation.
- `useViewStore` has no persist middleware; cleared by `projectStore.loadProject`/`newProject`. Tests: `beforeEach(() => useStore.setState(useStore.getInitialState()))`.

## Investigation domain

- `SuspectedCause` is a first-class entity (ADR-064), not a question tag. Multiple hubs coexist; each `selectedForImprovement: true` hub triggers one HMW brainstorm in IMPROVE. Legacy `causeRole: 'primary' | 'contributing'` is deprecated.
- `CausalLink` belongs to `investigationStore`, never `improvementStore`. Cycle prevention is mandatory: `wouldCreateCycle()` from `@variscout/core/stats` (`causalGraph.ts`); `addCausalLink` calls it internally — don't bypass the store.
- `FindingSource` (`@variscout/core/findings`) is a discriminated union (`chart` discriminant, 6 variants). Always narrow before accessing variant fields. Breadcrumb-pinned findings have no `source` — guard before access.
- Persistence: `suspectedCauses` + `causalLinks` serialize via `useProjectActions` into `.vrs` (Apr 2026 fix). New investigation entities also need `apps/azure/src/db/schema.ts` + `useEditorDataFlow.ts` updates.
- Sustainment (RPS V1, ADR-080) auto-fires once a `SuspectedCause` is `confirmed` AND the matching improvement is "implemented". `sustainmentRecords`, `sustainmentReviews`, `controlHandoffs` are NOT yet HubAction-dispatched — direct `apps/azure/src/services/localDb.ts` writes (R13 allow-listed). F5 may unify.

## Test command

```bash
pnpm --filter @variscout/stores test
```

## Related

- ADR-041, ADR-064, ADR-065, ADR-078, ADR-080
- `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`
