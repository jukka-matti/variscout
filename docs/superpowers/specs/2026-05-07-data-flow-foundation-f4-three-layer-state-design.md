---
title: Data-Flow Foundation F4 — Document / Annotation / View state codification
audience: [product, engineer]
category: design-spec
status: delivered
last-reviewed: 2026-05-07
related:
  - docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/decision-log.md
  - docs/investigations.md
---

# Data-Flow Foundation F4 — three-layer state codification

> **Architectural-decision spec.** Operationalizes Data-Flow Foundation §3 D5 ("three-layer state — Document / Annotation / View") and Canvas Migration spec Decision 2 (the original three-layer formulation) by giving each layer a physical home, a compile-time identity, and a regression test. F4 is a foundation slice — no new user-visible features. Pre-merge for F5 (sustainment/handoff dispatch coverage).

## 1. Context

The data-flow foundation spec named Document / Annotation / View as a layering rule but did not enforce it. Two concrete drift points exist today:

1. **`useSessionStore` is mis-named.** Its `partialize` block persists 11 fields. The store is conceptually a mix of _transient View state_ (highlights, expanded ids, pending chart focus) and _durable per-user Annotation_ (workspace tab, panel toggles, AI preferences, time lens). Calling all of it "session" lies about behavior, and the lie is the precondition for new fields drifting into the persisted subset.
2. **View state lives in Document stores.** `useProjectStore.selectedPoints + selectionIndexMap` (Minitab brushing), `useInvestigationStore.focusedQuestionId`, `useImprovementStore.highlightedIdeaId + activeView` are all transient by behaviour but live in stores whose canonical job is Document content. The current code resets them correctly on load — but the type system doesn't know that, and reviewers can't tell at a glance which fields belong in `.vrs` export.

Industry pattern is clear: Excalidraw's `(elements, appState)` two-arg `onChange`, Figma's document/ephemeral split ("ephemeral changes are not persisted… cursor or viewport positions or any transient interaction state" — [Figma multiplayer blog](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)), Yjs `Doc` vs `awareness` ([Yjs awareness docs](https://docs.yjs.dev/api/about-awareness)), Automerge ephemeral channel ([Automerge ephemeral data](https://automerge.org/docs/reference/repositories/ephemeral/)), Apple NSDocument vs `NSUserDefaults` window-state. **Structural separation beats marker booleans.** F4 lifts our existing implicit split into the type system.

ADR-078 commits to "same shapes, persistence is the only tier gate." That commitment is meaningless if `partialize` quietly redefines what "persistence" means inside a single store.

## 2. Boundary rule (refined from F-series spec D5)

**The portability test.** Given a `ProcessHub` blob about to be exported as `.vrs` and emailed to another analyst:

| Question                                                                    | Answer | Layer          |
| --------------------------------------------------------------------------- | ------ | -------------- |
| Would the recipient _need_ this to reproduce the analysis?                  | Yes    | **Document**   |
| Does it survive my browser reload, but the recipient should NOT receive it? | Yes    | **Annotation** |
| Does it disappear on browser reload?                                        | Yes    | **View**       |

This refines D5's "did it survive reload?" rule. Reload-survival distinguishes View from {Document, Annotation}; portability distinguishes Document from Annotation. Both questions are observable behaviour, not vibes.

**Annotation persistence axes** (codified for the first time):

- Per-user (e.g., `aiEnabled`, `timeLens`, last open workspace tab).
- Per-project (e.g., `wallLayoutStore` node positions, zoom).
- Per-hub (e.g., a future "favorite investigation" flag).
- Per-investigation (e.g., `Investigation.metadata.scopeFilter` / `paretoGroupBy` / `timelineWindow` — type-shaped today, write-active when "save view" ships).

Each axis means a separate persistence key namespace. They do **not** mean separate Zustand stores per axis — `wallLayoutStore` already proves a per-project store works. But mixing axes inside one store (e.g., per-user prefs and per-investigation annotation in the same Zustand instance) is forbidden because it forces correlated invalidation that nothing wants.

## 3. Locked decisions

### D1. Three physical Zustand stores

F4 ends with three layer-segregated store kinds:

| Layer          | Existing instances (clean)                                                     | Existing instances (mixed → relocate)                                                                                | New                                  |
| -------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Document**   | `canvasStore` (already routed via repo dispatch); repository tables themselves | `projectStore` (relocate `selectedPoints`, `selectionIndexMap`); `investigationStore` (relocate `focusedQuestionId`) | none                                 |
| **Annotation** | `wallLayoutStore` (per-project, dedicated Dexie DB)                            | `improvementStore` (`riskAxisConfig`, `budgetConfig` move out — see D3); `useSessionStore` is split                  | **`usePreferencesStore`** (per-user) |
| **View**       | none today                                                                     | `useSessionStore` is split; `improvementStore.activeView` + `highlightedIdeaId` move out                             | **`useViewStore`**                   |

After F4, every Zustand store in `packages/stores/src/` belongs to exactly one layer. No store mixes layers.

**Why physical separation, not flags or markers:** the research is unambiguous. Yjs structurally separates the awareness CRDT from the doc CRDT; Excalidraw splits `elements` from `appState` at the `onChange` signature; Figma maintains separate transports. Marker booleans on a unified store can be evaluated only at runtime; a physical split makes layer identity a property of `import` lines and review can see it.

### D2. `useSessionStore` is split, then deleted

The current `useSessionStore` is replaced by two new stores; it is then deleted, not preserved as a re-export.

**`useViewStore`** — transient, **no `persist` middleware**:

- `highlightRowIndex`, `highlightedChartPoint`, `highlightedFindingId`
- `expandedQuestionId`, `pendingChartFocus`
- `piOverflowView`
- `isDataTableOpen` (modal — closed on reload by intent)

Plus relocated from other stores:

- `selectedPoints`, `selectionIndexMap` (from `projectStore` — Minitab brushing)
- `focusedQuestionId` (from `investigationStore`)
- `highlightedIdeaId` (from `improvementStore`)
- `improvementActiveView` (renamed from `improvementStore.activeView`; transient `'plan' | 'track'` toggle)

**`usePreferencesStore`** — durable per-user Annotation, `persist` middleware via `idb-keyval` (same adapter as today's session store):

- `activeView` (workspace tab — survives reload by user expectation)
- `piActiveTab`
- `isPISidebarOpen`, `isCoScoutOpen`, `isWhatIfOpen`, `isFindingsOpen` (panel toggles — survive reload via current `partialize`; behaviour preserved)
- `aiEnabled`, `aiPreferences`
- `knowledgeSearchFolder`
- `skipQuestionLinkPrompt`
- `timeLens`

Plus relocated:

- `riskAxisConfig`, `budgetConfig` (from `improvementStore` — analyst's prioritization preferences; per-user, not document content).

**Behaviour delta on `riskAxisConfig` + `budgetConfig`.** Today `improvementStore` has no `persist` middleware: these fields reset to defaults on every reload. F4 moves them into `usePreferencesStore`, which **does** persist. This is an **intentional UX fix**, not a pure refactor — the audit established they are per-user Annotation by content; the current non-persistence is a side-effect of the store not being plumbed for persistence, not a deliberate design choice. The spec calls this out so PR review evaluates it as a UX change, not as accidental drift.

**Storage key namespace.** `usePreferencesStore` writes under `'variscout-preferences'`. The legacy `'variscout-session'` IDB blob is **dropped** on first load post-deploy. Per `feedback_no_backcompat_clean_architecture` and ADR-078 (we are pre-production); a one-time defaults hydration is acceptable, a migrate-and-merge shim is not.

**Persistence axis (per-user, both tiers, local-IDB only).** F4 locks `usePreferencesStore` to local IndexedDB on **both PWA and Azure** — preferences are tier-agnostic in shape (per ADR-078 D2) and persistence does NOT route through Blob Storage in either tier. Per-device preference fidelity is acceptable (matches today's `useSessionStore` behavior). Cross-device preference sync (e.g., `aiEnabled` / `timeLens` survives across browsers for a paid Azure user) is **out of scope**; if friction surfaces post-F4, it becomes a future micro-slice — not bundled here, because adding a Blob Storage sync surface for non-document state expands scope materially. This decision is named explicitly so future readers don't re-derive it.

### D3. `improvementStore` is split too, then either deleted or kept Document-empty

Audit finding: `improvementStore` currently contains zero Document fields. All four fields are either Annotation (`riskAxisConfig`, `budgetConfig`) or View (`activeView`, `highlightedIdeaId`). After D2, both halves move out → store empties.

**F4 deletes `improvementStore`** and removes it from the public store list. If/when finalized improvement-domain Document state appears (improvement actions, sustainment outcomes), a fresh `improvementStore` can be added — that's F5+ work and out of scope here.

The "5 domain stores" headline shifts to "4 domain stores + 2 layer stores":

- Document domain stores: `projectStore`, `investigationStore`, `canvasStore` (3)
- Annotation domain store: `wallLayoutStore` (1, per-project axis)
- Annotation per-user store: `usePreferencesStore` (1, per-user axis)
- View store: `useViewStore` (1)

`packages/stores/CLAUDE.md` and `CLAUDE.md` (root) are updated to reflect the new count.

### D4. `STORE_LAYER` const + one boundary test

Each store file declares its layer at top-of-file:

```ts
export const STORE_LAYER = 'view' as const;
// or 'document' | 'annotation-per-user' | 'annotation-per-project' | 'annotation-per-investigation' | 'annotation-per-hub'
```

A single Vitest file `packages/stores/src/__tests__/layerBoundary.test.ts` asserts:

1. **Every `*Store.ts` file in `packages/stores/src/` exports a `STORE_LAYER` const** with a value from the allowed enum (`'document'`, `'annotation-per-user'`, `'annotation-per-project'`, `'annotation-per-hub'`, `'annotation-per-investigation'`, `'view'`).
2. **Files declaring `STORE_LAYER === 'view'` do not import `persist` from `'zustand/middleware'`.** Negative assertion — strong, simple to verify by source-text scan.
3. **Files declaring `STORE_LAYER === 'annotation-per-user'` do import `persist` from `'zustand/middleware'`** (positive assertion — preferences must actually persist).
4. **Files declaring `STORE_LAYER === 'document'` do not import `persist` from `'zustand/middleware'`.** Document stores persist via repository dispatch (`canvasStore` model) or via consumer-side serialization through `useProjectActions` (`projectStore` / `investigationStore` model) — neither uses Zustand's `persist` middleware. Negative assertion is the honest test for today's state. Custom rule for "must dispatch via `HubRepository`" is deferred — most Document stores still hold session-only data per F3 narrow coverage; the dispatch boundary is enforced by repository-boundary ESLint guard (P7.2 of F1+F2), not by this test.
5. **`wallLayoutStore` is the documented exception** for `annotation-per-project` — uses Dexie directly per the R12 allow-list. The test allows-listed-by-name skips `persist` import check for this single file but still requires a Dexie import.

This is a runtime regex / source-text scan over the source files, not a custom ESLint rule. Lighter to author and maintain. Custom ESLint rule deferred unless drift returns post-F4.

**Branded types deferred.** Research recommended `DocumentField<T>` / `AnnotationField<T>` / `ViewField<T>` branded types for compile-time enforcement. Strongest possible barrier, but every state field would need a wrapper or pass-through cast — high churn across all stores. F4 ships layer markers + the boundary test; if drift recurs after F4, branded types become a follow-up slice.

### D5. `.vrs` export remains type-only in F4

The data-flow foundation spec §7 sketches `.vrs` as a future export envelope. F4 does **not** ship `exportDocument()`. But it **does** add a TypeScript type alias `DocumentSnapshot` pre-positioned so the future export function takes `(snap: DocumentSnapshot) => Blob` and Annotation/View types can't accidentally pass through.

**Shape locked: intersection, not record.** `DocumentSnapshot = ProjectState & InvestigationState & CanvasStoreState` — a single flat object containing all Document-layer fields. Rationale: a `.vrs` export carries ONE document snapshot containing all slices, not "one of." Intersection makes that explicit; a record `{ project, investigation, canvas }` adds a layer of nesting that the export envelope doesn't need. If property names collide across Document stores in the future, the intersection forces explicit resolution at type-eval time — desirable, not a hazard. Locked in code per F4 plan Task 9.

This is type-level pre-positioning, no runtime behavior change. Cited in spec §10 (out of scope) of the parent foundation spec; F4 ratifies the type, F5+ wires the function.

### D6. Investigation.metadata.scopeFilter / paretoGroupBy / timelineWindow stay type-only

Canvas Migration spec D2 already locked: these are placeholders for a future "save this view" feature. F4 does not promote them to write-active. F4 does **ratify** their layer: Annotation, per-investigation axis, sidecar fields on parent `Investigation` entity (already shaped). The audit's open question ("should scopeFilter/paretoGroupBy be Document?") is answered: **Annotation**, because they don't travel in `.vrs` (the recipient's analysis is reproducible from the underlying data + canonical map; the analyst's chosen filter is "how I was looking at it").

### D7. Per-app feature stores out of scope; scoped to `packages/stores/src/`

The audit found semantic overlap between `useSessionStore` and `apps/azure/src/features/panelsStore.ts` (and the PWA equivalent). Both hold panel toggles + workspace tab. They are **not** unified in F4. Reasons:

- Per-app feature stores live behind the app boundary by design — they're allowed to hold app-specific behaviour. Unifying them is a separate decision.
- F4's mandate is to fix `packages/stores/`. Crossing into `apps/*/features/` triples the touch surface and tangles with feature-specific logic (panel persistence has Azure-specific paths via `usePanelsPersistence.ts`).
- Out-of-scope items go to `docs/investigations.md` per protocol.

**Action:** F4 logs an investigation entry: "post-F4 audit: `usePreferencesStore` and `apps/*/features/panelsStore` overlap on workspace tab + panel toggles. Decide whether feature stores re-export from `usePreferencesStore` or stay independent."

### D8. wallLayoutStore.selection Set serialization is investigation, not F4

Audit flagged `wallLayoutStore.selection: Set<NodeId>` may not round-trip through Dexie's JSON adapter. Out of scope for F4 (which is about state-layering, not Dexie serialization correctness). Logged to `docs/investigations.md` for separate investigation.

## 4. Compute pipeline impact

None for `@variscout/core`. None for repository or `HubAction` layer. F4 is purely a `packages/stores/` and consumer-call-site refactor.

The hooks layer has indirect changes — every `useSessionStore(s => s.x)` selector becomes either `useViewStore(s => s.x)` or `usePreferencesStore(s => s.x)`. Hooks importing relocated fields update similarly. No new hook APIs.

## 5. F4 sequencing (single PR off `main`)

Estimate: ~80 file touches (48 sessionStore consumers + ~25 misfiled-field consumers + ~5 store/test files + 1 CLAUDE.md + 1 boundary-test file). Single slice; well under the 6–8 task cap from `feedback_slice_size_cap` because most tasks are mechanical search-and-replace by selector name.

### P0 — Audit replay (read-only)

Single dispatch. Re-confirm consumer count + relocated-field call-sites with current `main`. Verify nothing landed since the F4 audit (2026-05-07) that adds new `useSessionStore` references or new `selectedPoints`/`focusedQuestionId`/`highlightedIdeaId` writers. Output: signed-off file list.

### P1 — Introduce `useViewStore` + `usePreferencesStore` (no consumer changes yet)

- Create `packages/stores/src/viewStore.ts` with `STORE_LAYER = 'view'`, no `persist`.
- Create `packages/stores/src/preferencesStore.ts` with `STORE_LAYER = 'annotation-per-user'`, `persist` middleware on `'variscout-preferences'` key, `partialize` allowlist (every persisted field listed explicitly).
- Re-export both from `packages/stores/src/index.ts`.
- Stub Vitest tests for both stores (resetting state in `beforeEach`).
- `useSessionStore` continues to exist; consumer migration is P2.

### P2 — Migrate `useSessionStore` consumers in batches

Sub-task per consuming feature area:

- P2.1 — Highlight + chart-focus consumers (View migration)
- P2.2 — Panel toggle consumers (Annotation migration to preferencesStore)
- P2.3 — Workspace tab consumers
- P2.4 — AI/CoScout settings consumers (`aiEnabled`, `aiPreferences`, `knowledgeSearchFolder`, `skipQuestionLinkPrompt`)
- P2.5 — Time lens consumers
- P2.6 — Test-mock consumers (mocks of `useSessionStore` updated to mock the two new stores)

Each sub-task is "rename selector + import" — should be one commit each, atomic.

### P3 — Relocate misfiled fields out of `projectStore`

- Move `selectedPoints` + `selectionIndexMap` from `projectStore` state shape into `useViewStore`.
- Update `setSelectedPoints` etc. actions to live on `useViewStore`.
- **Project-switch lifecycle:** `useViewStore` exposes a `clearTransientSelections()` action; `projectStore.loadProject()` and `projectStore.newProject()` call it (cross-store call via `useViewStore.getState().clearTransientSelections()`, mockable in tests per `packages/stores/CLAUDE.md` "Cross-store reads" pattern). This preserves today's reset-on-project-switch behaviour. The View store does NOT subscribe to `projectStore` — explicit action is simpler and matches the existing cross-store call pattern (`investigationStore` already calls `useProjectStore.getState()` similarly).
- Update `SerializedProject` type — these fields were never serialized; just confirm the relocated state stays out of serialization.

### P4 — Relocate misfiled fields out of `improvementStore`, then delete

- Move `riskAxisConfig`, `budgetConfig` to `usePreferencesStore`.
- Move `activeView`, `highlightedIdeaId` to `useViewStore` (rename to `improvementActiveView`, `highlightedImprovementIdeaId` for namespace clarity).
- Delete `packages/stores/src/improvementStore.ts`.
- Remove from `index.ts` re-exports.
- Remove from `packages/stores/CLAUDE.md` complete-list.

### P5 — Relocate `focusedQuestionId` out of `investigationStore`

- Move to `useViewStore`.
- Update consumers.

### P6 — Add `STORE_LAYER` constants + boundary test

- Add `STORE_LAYER` const at top of every `*Store.ts` file under `packages/stores/src/` (including the unchanged ones — `canvasStore`, `wallLayoutStore`, `projectStore`, `investigationStore`).
- Author `packages/stores/src/__tests__/layerBoundary.test.ts` with the four assertions from D4.
- Run; expect green.

### P7 — Add `DocumentSnapshot` type alias (D5 type-only)

- New file `packages/stores/src/documentSnapshot.ts`.
- `export type DocumentSnapshot = ProjectState & InvestigationState & CanvasStoreState;` (or per-store named slice as the consuming patterns prefer).
- Re-export from `index.ts`.
- No runtime change.

### P8 — Update `useSessionStore` final removal + CLAUDE.md

- Delete `packages/stores/src/sessionStore.ts`.
- Remove from `packages/stores/src/index.ts`.
- Replace store-list section in `packages/stores/CLAUDE.md` with the three-layer table (4 Document + 2 Annotation + 1 View) and the boundary rule short form.
- Update root `CLAUDE.md` Invariants line: "5 domain Zustand stores" → "4 Document stores + 2 Annotation stores + 1 View store" (or equivalent — wording reviewed in spec §6).

### P9 — Monorepo verify

- `pnpm --filter @variscout/stores test` — green.
- `pnpm --filter @variscout/hooks test` — green.
- `pnpm --filter @variscout/ui build` (catches cross-package type-export gaps per `feedback_ui_build_before_merge`).
- `pnpm --filter @variscout/azure-app test` — green.
- `pnpm --filter @variscout/pwa test` — green.
- `pnpm build` (full monorepo build) — green. **Required** per `feedback_ui_build_before_merge` and the F3.6-β lesson (vitest passes hide stale type fixtures; `tsc --noEmit` catches them).

### P10 — Final review

- Subagent-driven workflow per `feedback_subagent_driven_default`: per-phase Sonnet implementer + Sonnet quality reviewer; **Opus final-branch reviewer** on the merged worktree per user instruction. ≥70% Sonnet target per `feedback_subagent_driven_default`.
- Chrome walk: deferred to user pre-merge per F3.5/F3.6 precedent. Walk script at `docs/superpowers/plans/2026-05-07-data-flow-foundation-f4-chrome-walk.md` (authored alongside plan).

## 6. Documentation updates included in F4

- `packages/stores/CLAUDE.md` — store-list + three-layer rule.
- Root `CLAUDE.md` — invariant line updated.
- `docs/llms.txt` — agent map updated if the store list there changes.
- `docs/decision-log.md` — F4 entry on completion.
- `docs/investigations.md` — two entries: feature-store overlap (D7), wallLayoutStore Set serialization (D8).
- ADR amendment: data-flow foundation spec §3 D5 amended with "F4 codified the layer rule via physical store separation; see F4 spec for boundary test."

## 7. Out of scope (named for future)

- Branded TS types (`DocumentField<T>`/etc.) for stronger compile-time enforcement — deferred unless drift returns post-F4.
- `exportDocument()` runtime function — F5+ when `.vrs` envelope ships.
- Promoting `Investigation.metadata.scopeFilter`/`paretoGroupBy`/`timelineWindow` to write-active — separate "save view" spec.
- Investigation entity full persistence (currently session-only per F3) — F5 territory; expands `InvestigationStore` to dispatch through `HubRepository`.
- Sustainment / handoff dispatch coverage — F5.
- Per-app feature-store overlap with `usePreferencesStore` (Azure `panelsStore`, PWA `panelsStore`) — investigation only.
- `wallLayoutStore.selection` Set/JSON round-trip — investigation only.
- ActionLog table for undo/redo / `.vrs` envelope replay — F5/F6 named-future per parent spec D7.
- True branded ESLint rule (custom plugin). Deferred to F5+ if drift returns.

## 8. Risks

| Risk                                                                                          | Mitigation                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Renaming a `useSessionStore` selector misses a callsite → runtime undefined access            | TypeScript ambient-type errors fire on every miss because consumers reference `useSessionStore` by name. P9 monorepo build is the catch-all.                    |
| Persisted state lost on first deploy because legacy `'variscout-session'` IDB blob is dropped | Acceptable per `feedback_no_backcompat_clean_architecture` and ADR-078 (pre-production). Defaults hydrate cleanly. Document in PR body so reviewers don't flag. |
| `improvementStore` deletion breaks app imports somewhere unsearched                           | Grep `useImprovementStore` across whole monorepo in P0 and P4; complete migration before delete.                                                                |
| Boundary test (D4) becomes maintenance burden                                                 | One file, ~50 lines; updates only when a new store is added. Cheap.                                                                                             |
| `STORE_LAYER` const ignored by reviewers; new stores ship without it                          | Boundary test fails fast if absent. Pre-merge `pnpm test` blocks.                                                                                               |
| Subagent dispatch lands `--no-verify`                                                         | Forbid in agent prompts per `feedback_subagent_no_verify`.                                                                                                      |

## 9. References

### Internal

- Data-Flow Foundation spec §3 D5 — `docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md` (three-layer rule, parent decision)
- Canvas Migration spec Decision 2 — `docs/superpowers/specs/2026-05-04-canvas-migration-design.md` (original three-layer formulation)
- F4 implementation plan — `docs/superpowers/plans/2026-05-07-data-flow-foundation-f4-three-layer-state.md`
- ADR-078 — PWA + Azure architecture alignment
- ADR-077 — snapshot provenance + match-summary wedge
- `packages/stores/CLAUDE.md` — current store invariants
- `feedback_no_backcompat_clean_architecture` — pre-production migration policy
- `feedback_ui_build_before_merge` — `pnpm build` is part of pre-merge verification
- `feedback_subagent_driven_default` — workflow for plan execution
- `feedback_slice_size_cap` — ~6–8 task cap per slice
- `feedback_partial_integration_policy` — name partial-integration calls in plan
- `feedback_terminology_consistency` — layer names appear in store filenames + selectors

### External

- [Yjs awareness](https://docs.yjs.dev/api/about-awareness) — "awareness information isn't stored in the Yjs document"
- [Figma multiplayer](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) — ephemeral changes are not persisted
- [Automerge ephemeral data](https://automerge.org/docs/reference/repositories/ephemeral/) — separate transport for transient state
- [Excalidraw onChange](https://github.com/excalidraw/excalidraw/discussions/3778) — `(elements, appState)` two-arg split
- [Apple Document Architecture](https://developer.apple.com/library/archive/documentation/DataManagement/Conceptual/DocumentBasedAppPGiOS/DocumentArchitectureiniOS/DocumentArchitectureiniOS.html) — document objects vs window controllers vs `NSUserDefaults`
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/reference/middlewares/persist) — partialize allowlist patterns
- [Local-first software (Ink & Switch)](https://www.inkandswitch.com/essay/local-first/) — taxonomy of document vs ephemeral state

## 10. Verification (pre-implementation)

- [x] Layer table cross-checked against current store source (audit 2026-05-07).
- [x] Boundary rule passes the portability test on every existing field (no field reclassifies under the refined rule vs. D5's reload-only rule).
- [x] No store mixes layers after F4 (verified by D1 table).
- [x] `useSessionStore` consumer count cross-checked: **31 files** total from canonical grep (`grep -rn "useSessionStore" apps packages --include="*.ts" --include="*.tsx" -l`), of which 2 are internal to the store package (`sessionStore.ts` + `index.ts`). External consumers: 29 files (14 apps + 15 packages, matching the Task 4 file list with `apps/azure/src/App.tsx` confirmed absent). Prior audit figures of 48/56 included different scope; T1 audit 2026-05-07 produces the authoritative count.
- [x] Pre-production status confirmed: ADR-078 + `feedback_no_backcompat_clean_architecture` permit dropping legacy `'variscout-session'` IDB blob.
- [x] Out-of-scope items have homes: D6 (canvas migration "save view" spec), D7 + D8 (`docs/investigations.md`).
- [x] No new ADR required — F4 amends data-flow foundation spec §3 D5 in place per ADR amendment convention.
- [x] Behaviour deltas explicitly listed: `riskAxisConfig` + `budgetConfig` start persisting (intentional UX fix per D2). All other field migrations are pure renames with no behaviour change.
- [x] Project-switch lifecycle for `selectedPoints` / `selectionIndexMap` specified (P3): `clearTransientSelections()` cross-store call from `loadProject` / `newProject`.
- [x] Cross-store rule clarified: imperative cross-store **action calls** (e.g., `loadProject` → `clearTransientSelections`) are allowed; cross-store **state subscriptions** (reactive coupling) are not. Documented in `packages/stores/CLAUDE.md` Hard rules section per F4 plan Task 9.
- [x] `usePreferencesStore` persistence axis locked: local-IDB both tiers (PWA + Azure). Cross-device sync via Blob Storage is named-future, not F4 scope.
- [x] `DocumentSnapshot` shape locked: intersection (`ProjectState & InvestigationState & CanvasStoreState`), not record/union.
- [x] Layer boundary test scope locked to `packages/stores/src/`. Per-app feature stores under `apps/*/src/features/` are NOT covered (D7 — out of scope). Documented in test file JSDoc + CLAUDE.md.

## Amendment log

(none yet)
