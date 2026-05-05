---
title: Manual Canvas Authoring — Spec 2 of 5 canvas-detail specs
audience: [product, engineer, designer]
category: design-spec
status: active
last-reviewed: 2026-05-04
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/archive/specs/2026-05-03-framing-layer-design.md
  - docs/decision-log.md
  - docs/investigations.md
---

# Manual Canvas Authoring

> **Spec 2 of 5 canvas-detail specs.** Designs how the user authors the canvas after Stage 1–3 (Hub creation) ships them onto a partially-filled canvas with auto-classified factor / metadata chips waiting on a side rail. Inherits the strangler-pattern migration shape + three-layer state architecture locked in the Canvas Migration spec. Lands as PR4 of the canvas migration sequence.

## 1. Context

### Why this spec exists

Vision spec §5.4 of the framing-layer (delivered, archived) explicitly hands off to Spec 2:

> _"Stage 4 — Canvas first paint (Spec 2 territory). The framing-layer spec ends here. Stage 4 transitions to the canvas with: Goal banner at the top of the canvas (auto-extracted from goal narrative); Outcome pin at the right edge with confirmed outcome columns + their specs (or fallback); **Auto-classified factor / metadata chips waiting to be placed on steps** (Spec 2 details the placement UX)."_

And vision spec §5.7 commits:

> _"The V1 spec commits to **manual canvas authoring as a first-class design concern** (drag-to-connect, multi-select sub-step grouping, branch / join discoverability) — clumsy manual UI would force AI back in."_

Together: Spec 2 designs (a) how the auto-classified chips get placed onto step nodes (the methodology-load-bearing primary act), and (b) how step structure gets authored when the user wants more than the minimal Y + X column layout (vision §3.3 #10).

This spec does NOT design Hub creation (Layer A — already shipped via slices 1–3 of the framing-layer spec) or the canvas's drill-down + lens UX (Layer C — Spec 3 territory). It designs Layer B between them.

### Where this lands in the canvas migration sequence

Per the Canvas Migration spec's eight-PR plan, this is **PR4**:

```
PR1 — Canvas facade        (canvas migration)
PR2 — Absorb ProcessMapBase (canvas migration)
PR3 — Absorb FrameView shell (canvas migration)
PR4 — Spec 2 (this spec)   ← we are here
PR5 — Spec 3 (cards / drill-down / mode lenses)
PR6 — Spec 4 (canvas overlays + Wall sync)
PR7 — Spec 5 (PWA persistence)
PR8 — Cleanup
```

This spec inherits from PR1–PR3 a Canvas component facade with the goal banner + outcome pin + auto-classified chips visible on a side rail, plus a three-layer state architecture (Document / Annotation / View) and session-scoped View state for filters.

### What this spec decides

Six cross-cutting decisions covering scope items A, B, C, D, G, H from the Canvas Migration spec's carry-forward table:

1. **A. Editing model** — γ″ two-mode authoring (chip placement + structural authoring) with auto-step-creation as the fluid boundary
2. **B. Authoring vs viewing modes** — B4 visibility-based mode toggle + implicit gestures
3. **C. Canvas undo/redo** — C1 state-history snapshots in Zustand
4. **D. Document-model authoritativeness** — Zustand + Immer + reducer-action shape; fifth domain `canvasStore`
5. **G. CRDT readiness constraints** — folded into D; Yjs/SyncedStore migration path locked for V2+
6. **H. Accessibility** — keyboard / screen-reader constraints baked into every authoring affordance

### What this spec does NOT decide

- **Card content** (mini-charts, capability badges, drift indicators) — Spec 3
- **Drill-down on click** — Spec 3
- **Mode lenses + per-card re-skinning** — Spec 3
- **Canvas overlays** (investigations / hypotheses / suspected causes / findings) — Spec 4
- **Wall projection sync** — Spec 4
- **PWA IndexedDB persistence schema** — Spec 5
- **Map versioning resolution policy** when canvas evolves (Spec 4 read rules; this spec only writes `canonicalMapVersion`)
- **Virtualized rendering performance** — deferred until 50+ node smell surfaces

## 2. Decision A — Editing model: γ″ two-mode authoring

### Rule

The canvas presents two distinct cognitive modes that share one surface and one state model:

**Mode 1 — Chip placement (column → step assignment).** The user lands on the canvas with auto-classified factor / metadata chips on a side rail. The primary act is placing chips onto step nodes via drag-from-rail. Each placement is a `column → step` assignment. For a hub with no step structure (vision §3.3 #10's minimal canvas: Y + X columns), Mode 1 alone is sufficient and the user never touches Mode 2.

**Mode 2 — Structural authoring.** When the user needs step structure (multiple steps for clearly-staged processes; sub-step grouping for parallel chambers; branch/join for non-linear flows), they author directly: drag-to-connect arrows, multi-select sub-step grouping, branch/join via the graph model. This is `feedback_pwa_philosophy`'s "guided pedagogy" + Figma-fluent direct manipulation.

**Auto-step-creation is the fluid boundary.** Dragging a chip onto empty canvas space (no target step) doesn't fail — it suggests creating a new step there ("Create step for `pressure_psi`?"). One gesture serves both modes when the column doesn't have a target.

### Why

Three converging arguments:

- **Vision §3.3 #10:** _"Process steps are optional. A minimal canvas is just Y + X columns (no steps). Steps are added when X's belong to specific stages — useful when relevant, never required. The canvas grows from declaration to fully structured map."_ The minimal-canvas case is real and common; Mode 1 alone must be sufficient for it.
- **Vision §5.7:** _"manual canvas authoring as a first-class design concern (drag-to-connect, multi-select sub-step grouping, branch / join discoverability) — clumsy manual UI would force AI back in."_ Mode 2 isn't a 10% escape hatch; it's the second half of a two-stage workflow that some users do extensively.
- **Vision §4 user journey step 3:** _"confirm column-to-step assignments. Auto-suggestions from column names. Add or refine structure if helpful (process steps, sub-steps, branches)."_ The journey is sequential: confirm assignments first, add structure if helpful.

### Industry alignment

Web research (May 2026) into Figma, Miro, Notion, and Linear converges on **hybrid editing models** — direct manipulation for core operations + hover-revealed affordances for less-frequent ops + slash-menu/contextual toolbar for occasional structural operations. γ″ is this pattern, scoped to VariScout's two-phase workflow.

### Concrete affordance map

| User intent                     | Mode | Gesture                                                                           | Visual cue (author mode)                                       |
| ------------------------------- | ---- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Place a column on a known step  | 1    | Drag chip from rail → drop on step card                                           | Step card highlights as drop target on hover                   |
| Place a column on a new step    | 1+2  | Drag chip from rail → drop on empty canvas space                                  | "Create step here?" prompt; commit creates step + assigns chip |
| Reorder columns within a step   | 1    | Drag column chip within step card to reorder                                      | Drop indicator between sibling columns                         |
| Remove a column from a step     | 1    | Drag column chip back to rail OR right-click → "Unassign"                         | Rail highlights as drop target during drag                     |
| Add a step                      | 2    | Click "+ Add step" in canvas chrome OR drag a chip onto empty space (auto-create) | Toolbar `+` icon; empty-space drop prompt                      |
| Connect two steps with an arrow | 2    | Hover over step → handle anchors appear → drag from anchor to target step         | Anchor handles on hover; drop-target highlight                 |
| Group steps into sub-steps      | 2    | Multi-select steps (Cmd+click) → "Group into sub-step" affordance appears         | Selection halos; contextual menu on selection                  |
| Branch (one step → many)        | 2    | Drag arrow from one step to multiple targets in sequence                          | Visual feedback during drag chain                              |
| Join (many steps → one)         | 2    | Drag arrows from multiple steps to a single target                                | Same                                                           |
| Edit step name                  | 2    | Double-click step header inline                                                   | Text field replaces header label                               |
| Edit specs per column           | 1    | Click `[✎]` icon on column chip in step card                                      | Opens existing `SpecEditor` (slice 1+2 component)              |
| Edit specs per step             | 2    | Click `[✎]` icon on step header                                                   | Same `SpecEditor` scoped to step level                         |

The `[✎]` affordances reuse the shipped `SpecEditor` component — no new spec-edit UX in this spec.

### Implementation notes

- **Chip rail** is a left side panel (or top rail on mobile per existing `MobileCategorySheet` pattern) showing all unassigned columns from `detectColumns()` output. Each chip displays column name + inferred role (factor / metadata) + sparkline (mini histogram).
- **Drop target highlighting** uses the same hover style as slice 1's `OutcomeCandidateRow` chip selection — visual continuity with the column-mapping UX users have already experienced.
- **Auto-step-creation prompt** is a small floating tooltip during drag, not a modal. Confirmation is one click; cancellation is dragging back to the rail or pressing Esc.
- **Canvas chrome** for Mode 2 affordances (Add step, Group selection, Branch) lives in a top toolbar visible in author mode only (per Decision B).

## 3. Decision B — Authoring vs viewing modes: B4 visibility-based + implicit gestures

### Rule

The canvas exposes a single **mode toggle** that controls VISIBILITY of authoring affordances; it does NOT determine what gestures do. Gestures are always determined by interaction shape (click = read; drag = author).

| Mode            | Visible affordances                                                                         | Gestures honored                                              |
| --------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Author mode** | Chip rail open · hover-revealed `+` zones · structural-edit toolbar · spec-edit `[✎]` icons | All gestures live                                             |
| **Read mode**   | Chip rail collapsed · hover affordances suppressed · toolbar hidden · spec icons hidden     | Click → drill-down only (drags do nothing or open drill-down) |

### Default state by context

- **Fresh canvas (post-Stage 1–3 of framing-layer):** **author mode** — chips waiting; user is in "compose" cognitive moment
- **Mature hub re-opened for cadence read:** **read mode** — focus is "what's happening this week"; authoring affordances are visual noise during scanning
- **Snapshot-only views (read-only, e.g., shared report):** **read mode forced**, toggle disabled
- **User can toggle via** a persistent "Edit canvas / Lock canvas" button in canvas chrome

The mode toggle's default is computed from hub state at canvas mount: `assignmentsComplete && stepsAuthored ? 'read' : 'author'`.

### Why

Three converging arguments:

- **Watson-MBB methodology mindset.** Six Sigma practitioners explicitly track DMAIC phases. An explicit cognitive-state toggle resonates with this mental model. Per `feedback_pwa_philosophy` (guided pedagogy).
- **Industry pattern (Figma, Notion, Linear).** All three converge on visibility-based mode toggles. Figma's "view" mode hides toolbar + panels. Notion's "lock" hides edit affordances. Linear's "preview" mode.
- **γ″'s two-mode editing benefits from a visibility-mode container.** Author mode shows the chip rail (Mode 1) AND the structural toolbar (Mode 2). Read mode hides both. Single toggle scopes both editing modes' visibility cleanly.

### Trade-offs vs alternatives

- **B1 (always editable):** rejected. Visual noise during read-mode scanning; chip rail and `[✎]` icons during cadence reads are distracting.
- **B2 (modal lock toggle that disables gestures):** rejected. Modal-feeling; gesture-discipline burden if user wants to read while gestures are locked. B4's "visibility off, gestures still implicit" is more fluent.
- **B3 (pure implicit-via-gesture, no toggle):** rejected. Gesture discipline alone is too dependent on user remembering "click vs drag" — and drop-target cues need to disappear in read mode anyway.

### Implementation notes

- **Toggle UI:** padlock-style icon in canvas chrome (top-right). Open padlock = author mode; closed padlock = read mode. ARIA label per Decision H.
- **Animations:** mode transition uses a 200ms cross-fade for affordances entering/leaving; respects `prefers-reduced-motion`.
- **Persistence of mode:** session-scoped per Canvas Migration spec Decision 2 (View layer = transient). Reload returns to default-by-context state.
- **Keyboard shortcut:** `E` toggles edit mode; `Esc` exits edit mode. Standard canvas-tool conventions.

## 4. Decision C — Canvas undo/redo: C1 state-history snapshots

### Rule

Canvas maintains a **state-history array** capped at 50 actions. Every committed action pushes a snapshot of the prior state onto the history. Undo pops-and-restores. Redo pushes-onto-future. Cleared on canvas mount (history is per-session).

```ts
interface CanvasHistory {
  past: CanvasState[]; // bounded to 50 entries
  present: CanvasState;
  future: CanvasState[]; // populated by undo, drained by new actions
}
```

### Bindings

- **Cmd+Z / Ctrl+Z** — undo
- **Cmd+Shift+Z / Ctrl+Y** — redo
- **No UI button required** for V1 (industry convention is keyboard-first); a small "↶" / "↷" toolbar pair can land in PR-spec3 if the surface needs it

### Why

Direct consequence of Decision D (Zustand + Immer + action-shaped state):

- State shapes are plain JSON; deep-cloning for snapshots is cheap and reliable
- Action commits are explicit boundaries (one action = one history entry)
- Memory cost is bounded: ~50 snapshots × small canonicalMap (typically <10 KB) = <500 KB worst case
- A 30-line custom Zustand middleware is cleaner than depending on `zustand-middleware-undo`'s API surface

For CRDT-readiness: when V2 multiplayer ships, C1 (state snapshots) becomes inadequate (need to undo _my_ actions without reverting _their_ actions). Migrate to **C2 — inverse-action replay** at that point. Migration cost is low because actions are already discriminated-union-shaped (per D); inverse computation is mechanical.

### Implementation notes

- **History middleware** is a small custom Zustand middleware at `packages/stores/src/canvasHistoryMiddleware.ts`. ~50 LOC. Tested deterministically.
- **Excluded from history:** mode toggle (B), view-state changes (filters, zoom, selection). Only document-state actions (D actions targeting canonicalMap, outcomes, primaryScopeDimensions) are recorded.
- **Throttle within rapid-fire interactions:** dragging a chip mid-flight produces one history entry on commit (drop), not one per pointermove. Implementation: history middleware batches updates within a single action dispatch.
- **Cmd+Z when history is empty:** no-op + briefly flash the canvas border to give feedback ("nothing to undo").

## 5. Decision D — Document model: Zustand + Immer + reducer-action shape

### Rule

Canvas authoring writes are mediated by a **fifth domain Zustand store** — `canvasStore` — that owns the document-layer state for the active hub:

```ts
interface CanvasStoreState {
  canonicalMap: ProcessMap;
  outcomes: OutcomeSpec[];
  primaryScopeDimensions: string[];
  canonicalMapVersion: string;

  // Action functions (typed reducers)
  placeChipOnStep: (chipId: string, stepId: string) => void;
  unassignChip: (chipId: string) => void;
  addStep: (stepName: string, position?: { x: number; y: number }) => void;
  removeStep: (stepId: string) => void;
  connectSteps: (fromStepId: string, toStepId: string) => void;
  disconnectSteps: (fromStepId: string, toStepId: string) => void;
  groupIntoSubStep: (stepIds: string[], parentStepId: string) => void;
  ungroupSubStep: (stepId: string) => void;
  renameStep: (stepId: string, newName: string) => void;
  // ... approximately 12-15 action functions total
}
```

Created via:

```ts
const useCanvasStore = create<CanvasStoreState>()(
  devtools(
    immer(set => ({
      canonicalMap: defaultProcessMap(),
      outcomes: [],
      primaryScopeDimensions: [],
      canonicalMapVersion: nanoid(),

      placeChipOnStep: (chipId, stepId) =>
        set(
          state => {
            state.canonicalMap.assignments[chipId] = stepId;
            state.canonicalMapVersion = nanoid();
          },
          false,
          'PLACE_CHIP_ON_STEP'
        ),
      // ... other actions
    })),
    { name: 'canvas-store' }
  )
);
```

The third arg to `set` (`'PLACE_CHIP_ON_STEP'`) is the action name surfaced in Zustand devtools for time-travel debugging.

### Why

- **Industry standard for complex UI state in 2026.** Reducer-action shape is the canonical pattern for state where next-state-depends-on-previous-state and there are many sub-values to update atomically.
- **Reuses existing four-Zustand-store architecture.** No paradigm split; Redux Toolkit alongside Zustand would be cognitive cost without benefit.
- **Immer middleware** gives ergonomic immutable updates (`state.canonicalMap.assignments[chipId] = stepId` looks mutable but produces a new state object). Required for time-travel + CRDT-readiness.
- **Devtools middleware** provides time-travel debugging. Critical for canvas authoring where action sequences can be hard to reason about.
- **Action-shaped semantics carry forward** to Decision G (CRDT) and Decision C (undo) without redesign.

### State shape constraints (CRDT-ready)

Three rules baked in to honor Decision G:

1. **Plain JSON-serializable.** No class instances, no shared refs across slices, no functions in state. Pure data.
2. **Immutable updates only.** Immer enforces this. No `state.canonicalMap.steps.push(newStep)` without `produce` wrapping (Immer middleware handles this transparently inside `set`).
3. **Discriminated-union action types** declared in `@variscout/core`:

```ts
// packages/core/src/canvas/types.ts
export type CanvasAction =
  | { kind: 'PLACE_CHIP_ON_STEP'; chipId: string; stepId: string }
  | { kind: 'UNASSIGN_CHIP'; chipId: string }
  | { kind: 'ADD_STEP'; stepName: string; position?: { x: number; y: number } }
  | { kind: 'REMOVE_STEP'; stepId: string }
  | { kind: 'CONNECT_STEPS'; fromStepId: string; toStepId: string }
  | { kind: 'DISCONNECT_STEPS'; fromStepId: string; toStepId: string }
  | { kind: 'GROUP_INTO_SUB_STEP'; stepIds: string[]; parentStepId: string }
  | { kind: 'UNGROUP_SUB_STEP'; stepId: string }
  | { kind: 'RENAME_STEP'; stepId: string; newName: string };
```

Action types are the unit of merge for future CRDT (V2+ multiplayer).

### CRDT migration path (V2+)

When multi-user collaboration ships:

1. Action vocabulary stays unchanged
2. State shapes stay unchanged
3. Zustand mutation layer swaps for **Yjs-backed via SyncedStore** (or hand-rolled — tradeoff at that time)
4. Conflict resolution: LWW for chip placement; multi-value with explicit conflict UX for structural edits
5. Investigation pinning to `canonicalMapVersion` becomes per-replica clock comparison

### Implementation notes

- **Store location:** `packages/stores/src/canvasStore.ts`. Fifth alongside the existing four (`projectStore`, `investigationStore`, `improvementStore`, `sessionStore`).
- **Persistence integration:** `canvasStore` reads from `ProcessHub.canonicalMap` on mount + writes back via the existing persist flow (Azure: `saveProcessHub`; PWA: `hubRepository`).
- **`canonicalMapVersion`:** generated via `nanoid()` (or `crypto.randomUUID()` per VariScout convention for app-side IDs). Updated inside every action that mutates document state.

## 6. Decision G — CRDT readiness constraints

### Rule

CRDT readiness is folded into Decision D as three structural constraints (no separate features):

1. **Plain JSON-serializable state shapes** (no class instances, no shared refs, no functions)
2. **Immutable updates only** (Immer middleware enforces structurally)
3. **Discriminated-union action types** as the unit of future merge

These constraints cost nothing to adopt now and avoid a future rewrite when multiplayer V2+ ships.

## 7. Decision H — Accessibility constraints

### Rule

Six constraints baked into every authoring affordance from day 1:

| #      | Constraint                                                                                                                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **H1** | **Tab order:** chip rail items → canvas step cards → outcome pin → mode toggle. Tab reaches every interactive element                                                                                                   |
| **H2** | **Keyboard authoring:** chip placement via keyboard — focus a chip (Tab), press Enter or Space to "pick up," arrow keys to navigate to a step card, Enter to drop. Mirrors mouse-drag for users without pointer devices |
| **H3** | **Step card semantics:** each step card is a `<button>` (or `<div role="button">` with full ARIA) with `aria-label` describing the step + state. Drill-down is the click target                                         |
| **H4** | **Mode toggle is announced:** "Edit canvas" button has `aria-pressed` reflecting current mode; switching modes is announced via `aria-live="polite"` so screen readers know affordances changed                         |
| **H5** | **Drag-and-drop accessibility:** dynamic `aria-label` updates during drag + explicit keyboard alternative (covered by H2). Drop targets get `aria-dropeffect="move"` only as a hint                                     |
| **H6** | **Color is never the only signal:** capability badges show color + Cpk number + text label. Drift indicators use up/down arrows + color. Project-wide convention per `feedback_green_400_light_contrast`                |

## 8. Component breakdown

### New components (all in `@variscout/ui`)

- `Canvas` (extended) — Top-level canvas surface adds chip rail + step authoring (~300 LOC)
- `ChipRail` — Left side panel rendering unassigned columns as draggable chips (~150 LOC)
- `ChipRailItem` — Individual chip with sparkline + role badge (~80 LOC)
- `StepCard` (extended) — Drop-target highlight, anchor handles, multi-select halo (~200 LOC)
- `StepArrow` — SVG arrow renderer with hover/click affordances (~80 LOC)
- `StructuralToolbar` — Top canvas chrome: Add step / Group selection / Branch / Mode toggle (~120 LOC)
- `CanvasModeToggle` — Padlock-style author/read toggle button (~50 LOC)
- `AutoStepCreatePrompt` — Floating tooltip during chip drag onto empty space (~60 LOC)
- `SubStepGrouper` — Multi-select halo + contextual action menu (~100 LOC)

### New core types

- `packages/core/src/canvas/types.ts` — `CanvasAction` discriminated union; `ProcessMap` extension types
- `packages/core/src/canvas/actions.ts` — Action factory functions; type-narrowing helpers

### New stores

- `packages/stores/src/canvasStore.ts` — Fifth domain Zustand store with action functions
- `packages/stores/src/canvasHistoryMiddleware.ts` — Custom undo/redo middleware

### New hooks

- `packages/hooks/src/useCanvasKeyboard.ts` — Cmd+Z / Cmd+Shift+Z bindings; Tab nav helpers
- `packages/hooks/src/useChipDragAndDrop.ts` — Drag-and-drop coordination via `@dnd-kit/core`

### Drag-and-drop library choice

Recommend **`@dnd-kit/core`** for chip placement: modern, TypeScript-first, built-in keyboard support (covers H2), accessibility-first API (covers H5).

## 9. Verification (acceptance criteria)

PR4 ships green when:

- [ ] Mode 1: chip drag-from-rail to step card / empty canvas / reorder / unassign all work
- [ ] Mode 2: add step / connect arrows / multi-select-group / branch / join / inline rename / spec edit all work
- [ ] Mode toggle: default by context; toggle via button or `E` key; affordances cross-fade; ARIA announcements
- [ ] Undo/redo: Cmd+Z + Cmd+Shift+Z; bounded 50; view-state excluded
- [ ] State (D): all action functions; Zustand devtools shows action names; `canonicalMapVersion` increments; persists via existing `saveProcessHub` / `hubRepository.saveHub`
- [ ] Accessibility: Tab traversal; keyboard chip placement; ARIA labels; color-blindness check
- [ ] CRDT-readiness: plain JSON state; discriminated-union actions; no shared mutable refs
- [ ] No σ-based suggestions for LSL/USL anywhere
- [ ] ADR-073 structural absence preserved
- [ ] `bash scripts/pr-ready-check.sh` green; `pnpm --filter @variscout/ui build` green
- [ ] Manual `claude --chrome` walk both apps green
- [ ] Final code-reviewer (Opus) approves

## 10. Risk register

| Risk                                                                      | Mitigation                                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Chip drag-and-drop feels clumsy on touch / mobile                         | Mobile pattern uses long-press + drag (dnd-kit handles); test in `--chrome` walk |
| `@dnd-kit/core` adds bundle weight                                        | Tree-shake; verify gzip impact <5 KB                                             |
| Mode toggle hidden during read mode = users can't find "edit"             | Padlock icon stays visible (only its open/closed state changes)                  |
| Undo doesn't cover spec edits                                             | Out of scope — `SpecEditor` has its own commit semantics                         |
| 50-action history cap surprises power users                               | Add session-end save prompt for unsaved canvas history (V2 polish)               |
| Auto-step-create prompt feels intrusive                                   | Subtle inline tooltip, not modal; Esc to dismiss                                 |
| Drag-from-rail performance on hubs with 50+ chips                         | Virtualize chip rail rendering at >30 chips                                      |
| Action vocabulary explosion (12-15 actions)                               | Action factory functions provide typed builders; tests cover invariants          |
| Investigation pinning to `canonicalMapVersion` breaks when canvas changes | Spec 4's responsibility; this spec only writes the version                       |

## 11. Out of scope (carry-forwards)

- Card content (mini-charts, capability badges, drift indicators) — Spec 3
- Drill-down on click — Spec 3 (this spec only stubs the click handler)
- Mode lenses — Spec 3
- Canvas overlays — Spec 4
- Wall projection sync — Spec 4
- PWA IndexedDB schema for canvas authoring — Spec 5
- AI map drafting — explicitly cut from V1 per vision §5.7
- Multi-user CRDT — V2+; constraints baked in but no implementation
- Canvas virtualization — deferred until 50+ node smell surfaces
- Map version conflict resolution — Spec 4

## 12. Spec amendments

This spec doesn't supersede or amend any other spec. It builds on:

- Framing-layer spec §5.4 (the explicit hand-off to Spec 2)
- Canvas Migration spec Decisions 1–4 (strangler shape, three-layer state, b0 collapse, ops band deferred)
- Vision spec §3 + §4 + §5.7 (canvas semantics, user journey, manual authoring as first-class)

Implementation of this spec lands as **canvas migration PR4**. PR1–PR3 must merge first.

## 13. References

### Internal

- VariScout vision spec: `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` (§3, §4, §5.7)
- Canvas Migration spec: `docs/superpowers/specs/2026-05-04-canvas-migration-design.md`
- Framing-layer spec (delivered, archived): `docs/archive/specs/2026-05-03-framing-layer-design.md` (§5.4 hand-off)
- Slice 1+2 shipped patterns: `ColumnMapping`, `OutcomeCandidateRow`, `PrimaryScopeDimensionsSelector`, `SpecEditor`
- Slice 4 retro learnings: `feedback_slice_size_cap`, `feedback_plan_call_site_reachability`, `feedback_partial_integration_policy`

### External

- [The Ultimate Guide to React State Management (2026) — DEV Community](https://dev.to/bean_bean/the-ultimate-guide-to-react-state-management-2026-28bh)
- [Mastering Immutable Updates: Essential Redux Patterns — Somethings Blog](https://www.somethingsblog.com/2024/10/20/mastering-immutable-updates-essential-redux-patterns/)
- [Yjs — Shared data types for collaborative software](https://github.com/yjs/yjs)
- [SyncedStore — Yjs + React adapter](https://syncedstore.org/)
- [Canvas, Meet Code: Building Figma's Code Layers — Figma Blog](https://www.figma.com/blog/building-figmas-code-layers/)
- [@dnd-kit/core — Modern drag-and-drop for React](https://dndkit.com/)
- [The Strangler Fig Pattern — Martin Fowler's variant](https://martinfowler.com/articles/strangler-fig-mobile-apps.html)

---

**Implementation plan:** [`docs/superpowers/plans/2026-05-04-canvas-manual-authoring-pr4.md`](../plans/2026-05-04-canvas-manual-authoring-pr4.md) — three sequenced sub-PRs (4a state + actions; 4b chip placement UI; 4c structural authoring + undo + a11y).

**Next step after this spec is approved:**

1. Implementation plan for **PR4 (this spec)** via `superpowers:writing-plans`. Multi-PR sequencing per `feedback_slice_size_cap` — likely 2–3 sub-PRs of ~6–8 tasks each.
2. Sequenced via `superpowers:subagent-driven-development` with per-task spec + quality reviewers.
3. Final code-reviewer (Opus) before merge to main.

PR4 lands as the most substantive canvas migration phase — Specs 3–5 build on the surface PR4 establishes.
