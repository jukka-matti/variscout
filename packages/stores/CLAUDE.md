# @variscout/stores

6 Zustand stores across 3 layers (ADR-078 + F4, 2026-05-07):

| Layer              | Store                   | Persistence                                             |
| ------------------ | ----------------------- | ------------------------------------------------------- |
| Document (×3)      | `useProjectStore`       | consumer-side serialisation via `useProjectActions`     |
| Document           | `useInvestigationStore` | session-only today; future `HubRepository.dispatch`     |
| Document           | `useCanvasStore`        | `dispatch(CanvasAction)` + hub repository               |
| Annotation project | `useWallLayoutStore`    | Dexie DB `variscout-wall-layout` (R12 ESLint exception) |
| Annotation user    | `usePreferencesStore`   | idb-keyval, key `'variscout-preferences'`               |
| View               | `useViewStore`          | NONE — transient                                        |

**Boundary rule (portability test):** another analyst importing this hub needs it? Yes → Document. Survives reload but not portable → Annotation. Doesn't survive reload → View. `__tests__/layerBoundary.test.ts` enforces middleware presence/absence.

## Hard rules

- Selectors required: `useProjectStore(s => s.field)`. Never bare `useStore()`.
- `investigationStore` owns `CausalLink` + `problemContributionTree`. Highlights → `useViewStore`.
- Cross-app UI state lives here (`wallLayoutStore` pattern). App-local state → `apps/*/src/features/`.
- No DataContext (ADR-041).
- Cross-store **imperative action calls** allowed; **reactive subscriptions** forbidden.
- Layer boundary enforcement covers `packages/stores/src/` only (per F4 spec D7).

## Invariants

- Document stores never import `dexie` directly — ESLint P7.2 enforces.
- `canvasStore` exposes `dispatch(action: CanvasAction)`.
- `wallLayoutStore`: R12 ESLint exception; call `rehydrateWallLayout(projectId)` on open, `persistWallLayout(projectId)` debounced on mutation.
- `usePreferencesStore` persists to `'variscout-preferences'`; legacy `'variscout-session'` key dropped on F4 deploy.
- `useViewStore`: no persist middleware; cleared by `projectStore.loadProject`/`newProject`.
- Tests: `beforeEach(() => useStore.setState(useStore.getInitialState()))`.

## Test command

```bash
pnpm --filter @variscout/stores test
```

## Skills / Related

- `editing-investigation-workflow` — investigationStore / CausalLinks
- `writing-tests` — Zustand store test pattern
- ADR-041, ADR-078, docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
