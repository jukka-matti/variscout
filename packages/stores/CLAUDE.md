# @variscout/stores

10 Zustand stores across 3 layers (ADR-078 + F4, 2026-05-07; wedge V1 additions 2026-05-16):

| Layer           | Store                        | Persistence                                                                                                  |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Document (×4)   | `useProjectStore`            | consumer-side serialisation via `useProjectActions`                                                          |
| Document        | `useAnalyzeStore`            | session-only today; future `HubRepository.dispatch`                                                          |
| Document        | `useCanvasStore`             | `dispatch(CanvasAction)` + hub repository                                                                    |
| Document        | `useImprovementProjectStore` | V1 user-facing Project entity (multiple per user, each wraps one Hub 1:1; `STORE_LAYER='document'`)          |
| Annotation hub  | `useCanvasViewportStore`     | Dexie DB `variscout-canvas-viewport` (R12 ESLint exception, STORE_LAYER='annotation-per-hub')                |
| Annotation user | `usePreferencesStore`        | idb-keyval, key `'variscout-preferences'`                                                                    |
| Annotation user | `useActiveIPStore`           | localStorage, key `variscout:activeIP:{hubId}:{userId}` with encoded scope parts                             |
| Annotation user | `useProjectMembershipStore`  | localStorage per-user; wedge V1 per-project ACLs + pending invites                                           |
| View            | `useViewStore`               | NONE — transient                                                                                             |
| View            | `useAnalysisScopeStore`      | NONE — transient (linked-views bridge: Process tab ↔ Explore tab; session-scoped per spec 2026-05-28 §3 D10) |

**Boundary rule (portability test):** another analyst importing this hub needs it? Yes → Document. Survives reload but not portable → Annotation. Doesn't survive reload → View. `__tests__/layerBoundary.test.ts` enforces middleware presence/absence.

**Document snapshot rule:** `DocumentSnapshot` is hub-scoped. Quick-analysis hubs may carry no `ImprovementProject`; formalized hubs carry at most one live Project. `useImprovementProjectStore.projectsById` is a multi-hub in-memory mirror, not a portable export surface, so snapshot helpers carry one Project for the active hub and never serialize the whole mirror.

## Hard rules

- Selectors required: `useProjectStore(s => s.field)`. Never bare `useStore()`. No DataContext (ADR-041).
- `analyzeStore` owns `CausalLink` + `problemContributionTree`; highlights live in `useViewStore`.
- Cross-app UI state lives here (`canvasViewportStore` pattern); app-local state → `apps/*/src/features/`.
- `feature-factories/` exports construction helpers only; app-local singleton ownership stays in `apps/*/src/features/`.
- Cross-store imperative action calls allowed; reactive subscriptions forbidden.
- Document stores never import `dexie` directly (ESLint P7.2). `canvasViewportStore` is R12 exception — call `rehydrateCanvasViewport(hubId)` on hub open, debounced `persistCanvasViewport(hubId)` on mutation.
- `useViewStore` has no persist middleware; cleared by `projectStore.loadProject`/`newProject`. Tests: `beforeEach(() => useStore.setState(useStore.getInitialState()))`.

## Investigation domain

- The first-class cause entity is `Hypothesis` (not `SuspectedCause` — no such type exists; ADR-085 corrects the stale ADR-064 claim). Multiple hypotheses coexist within a `ProblemStatementScope`; each evidenced/confirmed hypothesis drives improvement ideas via `Hypothesis.ideas[]`.
- `CausalLink` belongs to `analyzeStore`, never `improvementStore`. Cycle prevention is mandatory: `wouldCreateCycle()` from `@variscout/core/stats` (`causalGraph.ts`); `addCausalLink` calls it internally — don't bypass the store.
- `FindingSource` (`@variscout/core/findings`) is a discriminated union (`chart` discriminant, 6 variants). Always narrow before accessing variant fields. Breadcrumb-pinned findings have no `source` — guard before access.
- Persistence: `suspectedCauses` + `causalLinks` serialize via `useProjectActions` into `.vrs` (Apr 2026 fix). New analyze entities also need `apps/azure/src/db/schema.ts` + `useEditorDataFlow.ts` updates.
- Control (RPS V1, ADR-080) auto-fires once a `Hypothesis` reaches `confirmed` AND the matching improvement is "implemented". `controlRecords`, `controlReviews`, `controlHandoffs` are NOT yet HubAction-dispatched — direct `apps/azure/src/services/localDb.ts` writes (R13 allow-listed). F5 may unify.

## Testing (`pnpm --filter @variscout/stores test`)

Per-package `src/__tests__/setup.ts` (NOT root `test/setup.ts`) — mocks `idb-keyval` with an in-memory Map for Zustand persist + clears it between tests. New Dexie-backed stores: mirror `canvasViewportStore.test.ts:1` and `import 'fake-indexeddb/auto'` at file top.

## Related

- ADR-041, ADR-065, ADR-078, ADR-080, ADR-085 (supersedes ADR-064 SuspectedCause claim)
- `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`
