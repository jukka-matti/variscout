---
title: Canvas Migration Strategy — strangler-pattern phased delivery + three-layer state separation
audience: [product, engineer, designer]
category: design-spec
status: active
last-reviewed: 2026-05-05
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/archive/specs/2026-05-03-framing-layer-design.md
  - docs/decision-log.md
  - docs/07-decisions/adr-076-frame-b0-lightweight-render.md
  - docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md
  - docs/investigations.md
---

# Canvas Migration Strategy

> **Architectural-decision spec.** Decides HOW we transition from today's three-layer FrameView/LayeredProcessView/ProcessMapBase scaffold to the unified Canvas the vision spec commits to. Scoped to the migration shape + cross-cutting state architecture; the canvas's authoring features land in Spec 2 (manual canvas authoring) which builds ON this foundation.

## 1. Context

### Why this spec exists

The VariScout vision spec (`docs/superpowers/specs/2026-05-03-variscout-vision-design.md` §3, §6) commits to a unified Canvas as the central UI artifact: _"Process Hub = Canvas = Logic Map — there is no separate Hub model and FRAME map model."_ §6 lists `LayeredProcessView`, `ProcessMapBase`, and `FrameView` as **"deleted in the same PR that ships the Canvas."**

Slice 4 retro (PR #125) surfaced two related learnings that recommend revising that "same PR" intent:

1. **`feedback_slice_size_cap`** — implementation slices >10 tasks compress late-phase budget. A "ship Canvas + delete three legacy surfaces in one PR" would be 30+ tasks and violate this rule.
2. **`feedback_plan_call_site_reachability`** — slice 4 P3.6 hit a wall: FrameView lacks an active `ProcessHubInvestigation` in scope, and the spec §10 "filter state per-investigation" prescription couldn't be satisfied because investigations don't yet exist as loaded entities anywhere in production. The fix was a synthetic-investigation workaround. This isn't a bug; it's a deeper architectural mismatch between current state and the prescribed canvas-filter persistence model.

Together these say: the canvas migration needs (a) a strangler-pattern phased delivery, not big-bang, and (b) a state-architecture decision that doesn't depend on investigation-loading semantics that don't exist yet.

### Industry alignment

Web research (May 2026) into Strangler-Fig pattern + canvas-tool architecture (Figma, Miro, Celonis) surfaces two converging best practices:

- **Strangler-Fig defining properties:** _Facade-first_ (single routing layer), _Incremental by design_ (each step is self-contained with its own rollback), _Value-continuous_ (system stays in production throughout). Validated for frontend modernization at scale, including single-binary frontends per Martin Fowler's mobile-app variant.
- **Canvas-tool state separation:** Figma and Miro architecturally separate **document state** (canvas content — persisted, collaborative) from **view state** (per-user current selection, scroll, zoom, filter, lens — session-scoped, transient). Filter / lens / selection are NEVER persisted in the document. VariScout's framing-layer spec §10 prescribed "per-investigation filter persistence," which is more like document-state-with-extra-steps; industry pattern says it should be view state.

### What this spec decides

Four cross-cutting architectural decisions:

1. **Migration shape** — strangler-pattern phased delivery, NOT big-bang.
2. **State architecture** — three-layer separation (Document / Annotation / View) with canvas filters living in the View layer.
3. **b0 reframing** — b0 collapses into Canvas; ADR-076 superseded.
4. **Operations band absorption** — deferred to Spec 3 (mode lenses); canvas migration treats `ProductionLineGlanceDashboard` as opaque.

Plus a concrete migration PR sequence (PR1–PR8) and a list of carry-forward considerations for downstream specs.

### What this spec does NOT decide

- **Manual canvas authoring details** (drag-to-connect, sub-step grouping, branch/join discoverability) — that's Spec 2's brainstorm
- **Mode lens absorption mechanics** (per-card re-skinning, lens registry) — Spec 3
- **Canvas overlays + Wall sync** — Spec 4
- **PWA IndexedDB persistence schema** — Spec 5
- **Investigation-loading semantics** (when investigations become first-class loaded entities, what triggers their creation, how the user opens/switches between them) — separate future brainstorm; orthogonal to canvas migration per Decision 2

## 2. Decision 1 — Strangler-pattern phased migration

### Rule

Canvas migration ships as **eight sequenced PRs** off a single conceptual branch family (`canvas-migration-phase-N`), each ~5–8 tasks, each independently mergeable, with the final user-facing surface unified continuously across the sequence.

### Why

Vision §6 says _"deleted in the same PR that ships the Canvas."_ Re-reading §3.3 #1 (_"No b0 → b1/b2 transition shock"_), the intent is **user-facing continuity** — users shouldn't see a Frame→Canvas hand-off — not **deployment atomicity** ("merge everything in one commit"). Strangler-pattern preserves the UX intent without the engineering risk:

| Strangler-Fig property    | Mapped to canvas migration                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Facade-first**          | PR1 introduces `<Canvas>` component as a thin facade; legacy implementation behind it         |
| **Incremental by design** | Each PR is self-contained; rollback is `git revert` of one phase                              |
| **Value-continuous**      | Users see one continuous "Canvas" surface from PR1 onwards; legacy components retire silently |

Risks of big-bang in this codebase specifically:

- Triple touch: `LayeredProcessView` + `LayeredProcessViewWithCapability` + `ProcessMapBase` + `FrameView` (PWA + Azure) + every consumer of all four = ~30+ files in one PR.
- No incremental rollback path. A regression caught post-merge requires reverting the whole thing.
- Pre-merge gate slowness (large diff = long CI time).
- Review fatigue. Slice 4's 23-commit PR was at the edge of reviewable scope; this would exceed it.

### How to apply

See §6 Migration PR sequence for the concrete eight-PR plan.

## 3. Decision 2 — Three-layer state separation

### Rule

Canvas state separates into three layers with distinct ownership and persistence rules:

| Layer          | Holds                                                                                | Persistence                      | Scope                                                          | Examples                                                                                      |
| -------------- | ------------------------------------------------------------------------------------ | -------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Document**   | Canvas content: process map, outcomes, specs, primary scope dimensions               | Persisted (Dexie / Blob Storage) | Per-hub                                                        | `ProcessHub.canonicalMap`, `ProcessHub.outcomes`, step nodes, arrows                          |
| **Annotation** | Investigation findings, questions, suspected causes, hypotheses, sustainment records | Persisted, hub-bound             | Per-investigation (when investigations become loaded entities) | `Finding`, `Question`, `SuspectedCause`, `CausalLink`                                         |
| **View**       | Current filters, lens, zoom, selection, picker state                                 | **Session-scoped, transient**    | Per-user-session                                               | `scopeFilter`, `paretoGroupBy`, `timelineWindow`, current zoom level, currently-selected node |

Canvas filters (Time window / Scope filter / Pareto group-by per framing-layer spec §10) live in the **View layer** by default — session-scoped state, reset on reload, like Figma's selection / pan / zoom. Slice 4's metadata schema additions (`ProcessHubInvestigationMetadata.scopeFilter`, `paretoGroupBy`) **stay in the type system** as the persistence target for a future "save this view" affordance, but V1 doesn't write to them.

### Why

Three converging arguments:

1. **Investigations don't yet exist as loaded entities.** Production exploration (slice-4 retro) confirms: PWA has no `ProcessHubInvestigation` concept at all (session-only data per ADR-012); Azure stores investigations historically in `ProcessHubRollup.investigations[]` but has no UI affordance to open/switch one. `useTimelineWindow` has zero production callers; `useCanvasFilters` only has the synthetic FrameView callers from slice 4 P3.6. Spec §10's prescription assumed first-class investigations that don't exist yet.

2. **Industry best practice (Figma / Miro / canvas tools).** These tools architecturally separate document from view. Filter / lens / selection are session-scoped; persistence happens via explicit "save view" not via document-mutation. VariScout is an analytical tool (slightly different cognitive shape than design tools), but the underlying separation principle holds: a user's filter selection isn't a property of the underlying analysis run — it's a property of "what they're looking at right now."

3. **`ProcessHubCapabilityTab` is already the pattern.** The Azure capability tab uses raw `useState<TimelineWindow>` at hub level with the explicit comment: _"Hub doesn't carry its own TimelineWindow envelope in V1 — `useTimelineWindow` is keyed on a single `ProcessHubInvestigation`, and the hub view aggregates many."_ Generalizing this view-state-in-session pattern across Canvas matches a working production surface.

### Implications

- **`useCanvasFilters` (slice 4) needs rework** to read/write session state, not investigation metadata. Or a parallel `useSessionCanvasFilters` ships alongside; the legacy investigation-bound version stays for future "save view" use. Decision deferred to PR2/PR3 implementation; either approach is consistent with the layer separation.
- **FrameView's slice-4 synthetic-investigation workaround dissolves.** Filters become session state; FrameView (or its Canvas successor) has the hub but doesn't need an investigation.
- **Future "save this view" feature** is a separate spec — promote a session-scoped view to an investigation annotation when the user explicitly chooses. Not in scope for canvas migration.
- **Investigation-loading semantics** are decoupled from canvas migration entirely. When investigations later become first-class (separate brainstorm, separate spec), the annotation layer wires up; the canvas itself doesn't change.

### Methodology guards preserved

- **ADR-073 honored.** The View layer is per-user session; it doesn't aggregate across heterogeneous units. Filters compose; they don't pool.
- **Document-vs-Annotation boundary respects ADR-074.** Hub-level (document) data and investigation-level (annotation) data live in different layers with different persistence; no cross-layer leakage.

## 4. Decision 3 — b0 collapses into Canvas

### Rule

b0 (sparse pre-canonical-map render path, per ADR-076) ceases to exist as a separate concept after PR2. Canvas handles the empty-to-full spectrum natively; "is this hub b0 or not?" branching internalizes into Canvas's own "is the map empty?" check.

ADR-076 is **superseded** by this spec (status update + supersession entry per ADR amendment convention).

### Why

Vision §6: _"b0 lightweight render becomes the sparse-Canvas first paint when no map is authored yet."_ This is a semantic reframe, not a UI change — b0 is no longer a separate state, just "Canvas with zero nodes." The b0 → b1/b2 lifecycle becomes a continuum on a single surface.

### Migration timing

- **PR1 (facade):** legacy b0 path stays untouched. `<Canvas>` delegates to existing `LayeredProcessViewWithCapability`, which already chooses b0 vs b1/b2 internally.
- **PR2 (absorb ProcessMapBase):** b0 path collapses into the unified Canvas. ADR-076's render-path branching becomes a Canvas internal state check.
- **No transition shock visible to users.** They see one Canvas continuously — empty when no map, sparse during authoring, full once data arrives.

## 5. Decision 4 — Operations band absorption deferred to Spec 3

### Rule

Canvas migration treats `ProductionLineGlanceDashboard` (the 2×2 capability dashboard mounted in `LayeredProcessViewWithCapability`'s Operations band) as **opaque** during PR1–PR3. The dashboard remains externally implemented and externally mounted. Mode-lens absorption (where the dashboard becomes "Capability lens" applied to per-step cards per vision §5.4) is **Spec 3's** problem — _Cards / drill-down / mode lenses_.

### Why

Operations band absorption is fundamentally a **re-skinning architecture** concern: how does each canvas card render different visual content based on the active lens? That's Spec 3 territory. Bundling it into canvas migration:

- Adds risk without buying anything (dashboard works fine externally; users see no difference)
- Violates `feedback_slice_size_cap` (canvas migration scope expands materially)
- Pre-empts Spec 3's design freedom (lens registry, per-card rendering protocol, lens authoring API)

The strangler facade already solves the migration concern: Canvas wraps the existing dashboard; Spec 3 later swaps the wrapper for a proper lens system. No engineering risk from waiting.

### Implications for Spec 3 brainstorm

When Spec 3 brainstorm starts, it inherits:

- `ProductionLineGlanceDashboard` as the working "Capability lens" implementation (existing 2×2 capability view)
- `paretoYOptions` per mode (slice 4 P1.2 — already mode-aware)
- `getStrategy(mode).chartSlots` (existing strategy registry)

Spec 3 designs how lenses register, how cards re-skin per lens, and how the user picks a lens. None of this needs to land during canvas migration.

## 6. Migration PR sequence

Eight phases. Each PR is ~5–8 tasks per `feedback_slice_size_cap`, on its own branch, sequenced. After each PR merges, the next phase rebases onto fresh main.

### PR1 — `<Canvas>` facade (foundation)

**Branch:** `canvas-migration-phase-1-facade`
**~6 tasks**

- Create `packages/ui/src/components/Canvas/index.tsx` as a thin facade
- Internally delegates to existing `LayeredProcessViewWithCapability` with prop forwarding
- Both apps' FrameView swap their `<LayeredProcessViewWithCapability>` mount to `<Canvas>`
- No behavior change; users see identical UI
- Tests: `<Canvas>` component renders + delegates correctly; PWA + Azure FrameView smoke tests still green
- Documentation: update `packages/ui/CLAUDE.md` to declare `<Canvas>` as the canonical canvas surface; legacy components flagged "absorbed in subsequent PRs"

**Acceptance:** zero user-facing regression; both apps build clean; existing E2E paths green.

### PR2 — Absorb `ProcessMapBase` rendering

**Branch:** `canvas-migration-phase-2-process-map`
**~7 tasks**

- Move `ProcessMapBase` rendering inside Canvas as an internal implementation detail
- ADR-076 b0 branching collapses into Canvas's "is map empty?" check (Decision 3)
- `ProcessMapBase` exports become deprecated re-exports pointing at Canvas internals
- Update consumers that import `ProcessMapBase` directly to import from Canvas instead (likely small set)
- Tests: existing `ProcessMapBase` tests migrate to Canvas internal-rendering tests
- Document: ADR-076 amended in place to reflect supersession; `superseded-by` field set to this spec

**Acceptance:** `ProcessMapBase` is no longer a top-level public component; canvas renders the river-SIPOC layout natively.

### PR3 — Absorb `FrameView` route container

**Branch:** `canvas-migration-phase-3-frameview-shell`
**~6 tasks**

- `FrameView` (PWA + Azure) becomes a thin route shell that just renders `<Canvas>` with route-derived props
- Anything FrameView did beyond hosting the canvas (state lifting, filter wiring, etc.) either moves into Canvas itself OR up to a parent route component
- Slice 4's session-local `useState<ProcessHubInvestigationMetadata>` synthetic-investigation workaround replaced by **session-scoped view state** per Decision 2 (a `useSessionCanvasFilters` hook or equivalent)
- Tests: FrameView smoke tests retarget to Canvas; route-level tests confirm props flow correctly

**Acceptance:** FrameView no longer holds canvas-rendering logic; it's a routing concern only.

### PR4 — Spec 2 (manual canvas authoring) — drag-to-connect, sub-step grouping, branch/join

**Brainstorm + plan needed first.** This is where the manual canvas authoring features land. Independent brainstorm referencing this spec for state architecture.

**Estimated:** ~8–10 tasks. May split further per Spec 2's brainstorm.

### PR5 — Spec 3 (cards / drill-down / mode lenses)

**Implemented slices:** `canvas-migration-phase-5-cards-overlay-lenses` (PR5a) plus `canvas-migration-phase-5b-overlay-continuity` (PR5b).
**Sub-PR shape:** PR5a landed the cards-first foundation, lens registry, overlay MVP, app-shell response paths, and docs. PR5b tightens original-scope continuity for anchored overlay behavior, mobile sheet interaction, and card fallback fidelity.

PR5 makes Canvas capable of replacing the Analysis reading surface without deleting or hiding the existing Analysis routes yet. It is the first cards-first Canvas slice:

- Adds a shared lens model: `CanvasLensId = 'default' | 'capability' | 'defect' | 'performance' | 'yamazumi'`.
- Enables `default`, `capability`, and `defect` in PR5; keeps `performance` and `yamazumi` as deterministic fallback registry entries until they have complete card renderers.
- Stores the active lens as session-scoped **View** state, initialized from `analysisMode` where available and deliberately not persisted as Document state.
- Derives `CanvasStepCardModel[]` in the hook/model layer from `ProcessMap`, raw rows, measure specs, assigned columns, and production-line-glance projections.
- Uses metric precedence `node.ctqColumn` -> first numeric assigned column -> first assigned column -> empty card state.
- Renders numeric cards with compact histogram/sparkline primitives, categorical cards with compact distributions, and empty cards with assigned-column context only.
- Uses deterministic capability helpers (`gradeCpk`, `sampleConfidenceFor`, and per-column specs). Cpk is suppressed for `n < 10`; `10 <= n < 30` shows trust-pending; `n >= 30` grades normally. Cards without specs show `mean +/- sigma + n` and an Add specs affordance.
- Replaces the dedicated Canvas Operations band with card/lens rendering. `ProductionLineGlanceDashboard` is not deleted and remains valid outside Canvas; Canvas reuses its data contracts/projections instead of treating it as a separate band.
- Adds a step overlay: desktop floats near the clicked card with close / click-out / `Esc`; mobile follows the existing bottom-sheet pattern.
- Wires two real response paths through app-shell callbacks: Quick action opens Improvement, and Focused investigation opens Investigation. Charter, Sustainment, and Handoff remain visible but disabled / context-limited in PR5.

**Acceptance:** Canvas shows per-step cards, lens switching changes card emphasis without mutating `ProcessMap`, spec-edit affordances do not open the overlay, card click opens the overlay, PWA and Azure pass navigation callbacks, and existing Analysis routes remain intact until a later cleanup phase.

### PR6 — Spec 4 (canvas overlays + Wall sync)

**Implemented slice:** `canvas-migration-phase-6-overlays-wall-projection`.

PR6 implements the first read-side Wall projection slice for Canvas. The
Investigation Wall remains the canonical workspace; Canvas adds session-scoped
overlay toggles and projects existing investigation graph entities onto step
cards for glance/read context:

- Adds an enabled overlay registry for investigations, hypotheses,
  suspected-causes, and findings. Active overlays are session-scoped View state
  and default to off.
- Derives per-step overlay projections from `ProcessMap`, questions, findings,
  suspected causes, and causal links without introducing new persistence or
  Canvas-side authoring.
- Resolves graph entities to steps through assignments, tributaries, question
  factors, finding filters, suspected-cause hub bindings, and deterministic
  causal-link endpoint resolution.
- Renders investigation activity badges, finding pins, suspected-cause markers,
  and faint draft hypothesis arrows only when their overlay is active.
- Extends the step overlay linked-investigation section with related questions,
  findings, suspected causes, and causal links. Focus callbacks open the
  Investigation surface and expand the linked question when available.

**Out of scope for PR6:** Canvas-side hypothesis creation/editing,
investigation-loading semantics, multi-investigation switching, new persistence
schema, Wall layout rewrites, and Analysis route cleanup.

### PR7 — Spec 5 (PWA IndexedDB persistence schema)

**Brainstorm + plan needed.** Q8-revised hybrid persistence for hub-of-one.

### PR8 — Vision Alignment (closes PR4c–PR6 retrospective gaps)

**NEW phase inserted 2026-05-06** per the canvas PR4c–PR6 retrospective findings (`docs/superpowers/plans/2026-05-06-canvas-pr4c-pr6-followup.md` + `docs/decision-log.md` 2026-05-06 entry). PR4c–PR6 shipped functioning canvas authoring + cards + overlays but left six unmet vision-spec commitments and one critical bug. **PR8 closes the vision gaps**; the legacy-component cleanup originally scheduled for PR8 is renumbered to PR9.

PR8 splits into multiple sub-PRs, each scoped to one vision-spec commitment:

| Sub-PR | Vision item                                                                                                                                                      | Source      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **8a** | Mode-aware response-path CTAs (Charter / Sustainment / Handoff tier-gated with copy, not hardcoded `disabled`)                                                   | §5.3 + §2.4 |
| **8b** | Drift indicator (data model + UI; reads `EvidenceSnapshot` history) AND time-series mini-chart for high-cardinality columns                                      | §5.2        |
| **8c** | _(reserved — bundled with 8b)_                                                                                                                                   |             |
| **8d** | Hypothesis-arrow drawing affordance (Mode 2 toolbar tool; promoted-vs-draft visual; column/step source/target). **Brainstorm needed (Spec 4 extension).**        | §3.4        |
| **8e** | Wall mirror in canvas overlay vs status-quo badge-projection. **Brainstorm needed (Spec 4 extension)** to pick between embedded-Wall and badge-projection-as-V1. | §5.6        |
| **8f** | Levels-as-pan/zoom orthogonal axis (canvas viewport architecture). **Large; may warrant its own design spec.** Likely deferred to V2 with explicit ADR.          | §5.4        |

Each sub-PR has its own brainstorm or brief design note + plan + branch + PR per `feedback_slice_size_cap`. Tracked as entries in `docs/investigations.md` until promoted to plans.

### PR9 — Cleanup: delete legacy components (renumbered from PR8)

**Branch:** `canvas-migration-phase-9-cleanup`
**~4 tasks**

- Delete `packages/ui/src/components/LayeredProcessView/` (LayeredProcessView + LayeredProcessViewWithCapability)
- Delete `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` and related
- Delete `apps/azure/src/components/editor/FrameView.tsx`, `apps/pwa/src/components/views/FrameView.tsx` (replaced by Canvas-centric route shells in PR3)
- Update spec index + decision log
- Final sweep for any straggler imports

**Acceptance:** legacy components fully removed; vision §6 promise honored; canvas is the only canvas-shaped surface in the codebase.

### Branching note

Each phase opens its own PR off `main`. After merge, the next phase rebases onto fresh main. Branch names use `canvas-migration-phase-N-<slug>` for greppability. PR4–PR7 will likely have additional sub-branches per their respective spec brainstorms.

## 7. Spec amendments + decision-log entries

This spec triggers amendments to two existing specs and supersedes one ADR:

### Framing-layer spec §10 amendment (per Decision 2)

`docs/archive/specs/2026-05-03-framing-layer-design.md` §10 currently reads:

> "Three composable canvas filter states: Time window (TimelineWindow filter, **per-investigation**), Scope filter (Pareto bar selection or chip add, **per-investigation**), Pareto group-by (per chart card, **investigation-scoped**)."

**Amendment** (recorded in `docs/decision-log.md` 2026-05-04 entry, NOT inline in the archived spec):

> _"Spec §10's per-investigation filter persistence is amended to per-session for V1 per `docs/superpowers/specs/2026-05-04-canvas-migration-design.md` Decision 2 (three-layer state separation; canvas filters are View layer, session-scoped). Investigation overlay (the 'save this view' affordance) deferred to a future spec when investigations become first-class loaded entities. Slice 4's `ProcessHubInvestigationMetadata.scopeFilter` and `paretoGroupBy` fields stay in the type system as the future persistence target."_

### ADR-076 supersession (per Decision 3)

`docs/07-decisions/adr-076-frame-b0-lightweight-render.md` superseded by this spec. Frontmatter update:

```yaml
status: superseded
superseded-by: docs/superpowers/specs/2026-05-04-canvas-migration-design.md
superseded-on: 2026-05-04
```

Body retains historical record; new note at top: _"This ADR is superseded by the Canvas Migration spec. b0 ceases to exist as a separate render path after PR2 of the canvas migration; Canvas handles the empty-to-full spectrum natively. ADR-076 retained as historical record only."_

The actual frontmatter + note edit lands in PR2 (where the b0 collapse implementation ships), not in the migration ADR itself.

### `docs/investigations.md` updates

Three slice-4 follow-up entries (P2.5 step-card mounting, canvas-filter app-level integration, P5 closeup) get cross-references to this spec — they're now subsumed by the canvas migration roadmap. The "Canvas-filter app-level integration" entry's "promotion path" updates to point at PR3 of this spec.

The `specs` vs `measureSpecs` asymmetry investigations.md entry is **unchanged** by this spec — that's a separate concern.

## 8. Carry-forwards to downstream spec brainstorms

Slice 4 retro and Strangler-Fig research surfaced seven deeper architectural concerns that don't need answers in THIS spec, but each downstream spec brainstorm should explicitly address the relevant subset:

| Concern                                | Owning spec                                                    | What it needs to decide                                                                                                                                                           |
| -------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authoring vs viewing modes             | Spec 2                                                         | Explicit mode toggle (lock map / unlock map)? Pen-vs-cursor toolbar? Or implicit via interaction shape?                                                                           |
| Canvas undo/redo stack                 | Spec 2                                                         | Custom undo abstraction (Figma-style) for canvas authoring; not redux-history-via-rehydration                                                                                     |
| Map versioning when canvas evolves     | Spec 2 (write rules) + Spec 4 (read rules)                     | When map advances, what happens to existing investigations pinned to `canonicalMapVersion`? Pin / migrate / warn / branch?                                                        |
| Virtualized rendering performance      | Spec 2 + Spec 3                                                | At what node count does Canvas need scene-graph virtualization? Up-front design or wait for the smell?                                                                            |
| CRDT readiness for future multi-user   | Migration ADR (this spec, brief) + Spec 5 (persistence schema) | Don't lock in shared mutable references now; prefer immutable updates in Canvas state                                                                                             |
| Keyboard / screen-reader accessibility | Spec 2                                                         | Tab nav between nodes; Enter to drill in; arrow keys to pan; ARIA labels per node                                                                                                 |
| Document-model authoritativeness       | Spec 2                                                         | When user authors on canvas, does the edit write to `ProcessHub.canonicalMap`? Is canonicalMap the single source of truth, with canvas being a render of it? Confirm and enforce. |

The CRDT-readiness item is specifically called out here because it informs all five downstream specs. Ground rules:

- Canvas state shapes use immutable updates (no in-place mutation of arrays / objects)
- Cross-component shared state goes through stores (Zustand), not React refs to mutable objects
- Where a state shape might later need CRDT representation (e.g., per-node properties that multiple users could edit), prefer plain JSON-serializable shapes

This isn't "ship CRDTs now" — it's "don't lock in shapes that would need rewrites later."

## 9. Consequences

### Positive

- **Canvas migration scope dramatically reduced** vs vision spec's "same PR" reading. Eight 5–8-task PRs are individually reviewable and revertable; the 30+-task big-bang is not.
- **Vision §6 user-facing promise honored.** Users see one continuous Canvas surface from PR1; legacy components retire silently behind the facade.
- **Slice 4 P3.6 wall dissolves cleanly.** Three-layer state separation makes session-scoped filters the natural V1 pattern; synthetic-investigation workaround replaces with proper view-state hook.
- **Investigation-loading decoupled from canvas migration.** When investigations become first-class entities (separate future brainstorm), the annotation layer wires up; the canvas itself doesn't change.
- **`feedback_slice_size_cap` honored** by construction. Each PR ships within the ~6–8 task budget.
- **`feedback_partial_integration_policy` partial-integration risks pre-decided.** Each phase has its own deferral rules (e.g., ProcessHubCapabilityTab keeps its hub-level `useState` until view-state migration is uniform).
- **Three-layer separation matches industry best practice.** Document/Annotation/View aligns with Figma, Miro, Celonis, and the broader canvas-tool ecosystem.

### Harder

- **Slice 4's `useCanvasFilters` hook needs rework.** Either the hook flips its persistence target to session storage (breaking change for synthetic-investigation FrameView callers), or a parallel `useSessionCanvasFilters` ships and the legacy hook is removed. PR3 decides; both are tractable.
- **Spec amendment overhead.** Framing-layer spec §10 needs a decision-log entry; ADR-076 needs supersession metadata; investigations.md entries need cross-references. ~30 minutes of bookkeeping per amendment.
- **Eight-PR sequence vs one-PR sequence has overhead** — eight separate review cycles, eight rebases. Worth it because each cycle is fast (small PR) and revertible.
- **Spec 2–5 brainstorms must each address their carry-forward concerns** (§8 table). If a brainstorm skips one (e.g., Spec 2 doesn't think about canvas undo), it surfaces during implementation as another P3.6-style wall.
- **CRDT-readiness as an ongoing constraint.** Any state-shape decision in PR1–PR8 needs a "would this work if multiplayer ships in 2 years?" check. Light cost per decision; cumulatively meaningful.

### Neutral

- **Strangler-Fig adds eight branches** to git history. Branch hygiene per `feedback_subagent_worktree_discipline` — each branch lives in its own worktree if subagent-driven; deleted after merge.
- **The migration ADR itself doesn't ship code.** It's a strategy document. PR1 is the first code-shipping PR.

## 10. Alternatives considered

### Big-bang (vision §6 as written)

Rejected. Slice 4's 23-commit / 22-task PR was at the edge of reviewable scope; canvas migration as big-bang would substantially exceed it. Strangler-pattern preserves the user-facing-continuity intent without the engineering risk.

### Investigation-bound canvas filters (slice 4 spec §10 as prescribed)

Rejected as the V1 architecture. Investigations don't yet exist as loaded entities; spec §10 was prescriptive about a layer that wasn't built. Adopting it as canvas migration's V1 architecture would require shipping investigation-loading semantics in the same migration — exactly the scope creep `feedback_slice_size_cap` warns against. Future "save this view" affordance lands when investigations become first-class.

### Hub-bound canvas filters (`ProcessHub.metadata` as new field)

Rejected (despite my mid-brainstorm preference for it). Hub-level persistence makes filter state a property of the document, which is what canvas-tool industry pattern explicitly avoids. ProcessHubCapabilityTab uses raw `useState<TimelineWindow>` — not `ProcessHub.metadata` — for a reason: the hub document shouldn't carry per-user view state. Approach 4 (View layer = session) preserves this separation correctly.

### Storage-adapter hybrid (Approach 3 from brainstorm)

Considered. `useCanvasFilters({ target: 'hub' | 'investigation' | 'session' })` polymorphic. Rejected because (a) it pays complexity cost up-front for an option we may never use the way we planned, (b) two storage paths to keep in sync, (c) doesn't simplify the V1 implementation — view-state-in-session (Approach 4) is what V1 needs and what the hook should expose.

### Operations band absorbed during canvas migration (E2 / E3 from brainstorm)

Rejected. Mode-lens architecture is a Spec 3 design concern. Bundling it expands canvas migration scope without buying anything; the strangler facade already solves the wrapping.

## 11. References

### Internal

- VariScout vision spec: `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` (§3, §5.1, §5.4, §6)
- Framing-layer spec (archived, delivered): `docs/archive/specs/2026-05-03-framing-layer-design.md` (§9, §10 — amended by this spec)
- ADR-076 (frame-b0-lightweight-render): `docs/07-decisions/adr-076-frame-b0-lightweight-render.md` (superseded by this spec at PR2)
- ADR-077 (snapshot provenance + match-summary wedge): `docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md` (informs persistence story for PR4–7)
- Slice 4 retro learnings (memory): `feedback_slice_size_cap`, `feedback_plan_call_site_reachability`, `feedback_partial_integration_policy`, `feedback_subagent_driven_default`
- Slice 4 PR: `https://github.com/jukka-matti/variscout/pull/125`
- Investigations.md follow-ups (canvas-filter app-level integration, P2.5 deferral, specs vs measureSpecs)

### External

- [The Strangler Fig Pattern and Microfrontends — Leander Hoedt](https://www.leanderhoedt.dev/blog/strangler-fig)
- [Strangler Pattern for FrontEnd — Felipe Guizar Diaz, Medium](https://medium.com/@felipegaiacharly/strangler-pattern-for-frontend-865e9a5f700f)
- [Using the Strangler Fig with Mobile Apps — Martin Fowler](https://martinfowler.com/articles/strangler-fig-mobile-apps.html)
- [How Figma's multiplayer technology works — Figma Blog](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Canvas, Meet Code: Building Figma's Code Layers — Figma Blog](https://www.figma.com/blog/building-figmas-code-layers/)
- [Miro System Design Explained — Educative](https://www.educative.io/blog/miro-system-design)
- [Celonis Process Repository — CEUR-WS](https://ceur-ws.org/Vol-2673/paperDR01.pdf)

---

**Next steps after this spec:**

1. Implementation plan for **PR1 (Canvas facade)** via `superpowers:writing-plans`. ~6 tasks; sequenced via `superpowers:subagent-driven-development`.
2. Decision-log entry recording the framing-layer spec §10 amendment (per Decision 2).
3. Investigations.md cross-references update.
4. After PR1 ships, brainstorm + plan PR2 (absorb ProcessMapBase + supersede ADR-076).
5. Independent brainstorm for **investigation-loading semantics** (when investigations become first-class loaded entities) — orthogonal to canvas migration; sequenced separately.
