---
title: Canvas Viewport 8f — Followup Workstream Implementation Plan
audience: [engineer]
category: implementation-plan
status: active
last-reviewed: 2026-05-13
related:
  - docs/superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md
  - docs/superpowers/plans/2026-05-13-canvas-viewport-architecture.md
  - docs/07-decisions/adr-081-canvas-viewport-architecture.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
  - docs/decision-log.md
  - docs/investigations.md
---

# Canvas Viewport 8f — Followup Workstream

> **For agentic workers:** Use `superpowers:subagent-driven-development` to execute task-by-task. Sonnet implementer + Sonnet spec/quality reviewer per task; Opus final reviewer per PR. PR0 lands direct to main (docs-only). PR1–PR6 each cut their own branch off main, share branch name `canvas-viewport-8f-followups` (re-cut per PR after merge per `feedback_branch_staleness_guardrails`).

## Context

The 8f Canvas Viewport workstream shipped 2026-05-13 across PRs #160/#161/#162/#163/#164/#165. A 3-agent retrospective review (architecture / design / code-quality) on `main` after merge surfaced 20 findings: 5 HIGH, 8 MEDIUM, 7 LOW. Per-PR Opus reviews had caught code quality within each slice; cross-PR drift was the gap they couldn't catch. The decision-log entry "8f canvas viewport SHIPPED" has been amended to reference these gaps; `docs/investigations.md` carries the full enumeration with file:line references.

**Intent:** close all 20 findings via a sequenced cleanup workstream, sized to the slice cap (`feedback_slice_size_cap`), Subagent-Driven Development (`feedback_subagent_driven_default`) by default. ADR-locked commitments (Azure Blob sync per ADR-081 §2; FRAME embedding per ADR-074 amendment) are HIGH priority; spec §10 lens matrix needs a brainstorm to decide expand-vs-amend.

## Workstream shape

| PR  | Title                                                              | Tasks | Findings closed                        | Size               |
| --- | ------------------------------------------------------------------ | ----- | -------------------------------------- | ------------------ |
| 0   | Docs + memory sync (direct to main)                                | 4     | Memory drift; decision-log honesty     | XS                 |
| 1   | i18n migration + legacy Dexie cleanup + branded hubId              | 6     | HIGH #3, #5 + LOW #18, #19, #20        | M                  |
| 2   | ADR-074 cleanup + L1 specLimits contract                           | 4     | HIGH #2 + MEDIUM #8                    | S–M                |
| 3   | Lens × level matrix — expand or amend (brainstorm first)           | 4–6   | HIGH #4                                | M (or XS if amend) |
| 4   | LOD polish (cross-fade + snap + deadband + warn) + dead-code sweep | 7     | MEDIUM #6, #7, #12, #13 + LOW #16, #17 | M                  |
| 5   | Azure Blob sync for canvasViewportStore (ADR-081 §2)               | 6     | HIGH #1                                | M                  |
| 6   | L3 CTAs + mobile step-list + selector scope + STORE_LAYER rename   | 5     | MEDIUM #9, #10, #11 + LOW #15          | M                  |

Finding numbers reference `docs/investigations.md` "8f followups" entry.

## PR 0 — Docs + memory sync

**Direct to main per CLAUDE.md** ("tooling / docs / config: direct commit to main is fine"). Already executed inline by the session that authored this plan; recorded here for traceability.

- [x] **0.1** `MEMORY.md` line 4: `8f IN FLIGHT` → `8f SHIPPED with 5 HIGH followups in flight`
- [x] **0.2** `MEMORY.md` line 6: topic entry summary updated to reflect SHIPPED + followups
- [x] **0.3** `project_canvas_viewport_8f.md` topic file: rewritten to SHIPPED state with 5 HIGH gaps inline
- [x] **0.4** `docs/decision-log.md`: Amendment 2026-05-13 block appended to pinned "8f canvas viewport SHIPPED" entry
- [x] **0.5** `docs/investigations.md`: new "8f followups" entry with all 20 findings + file:line
- [x] **0.6** `docs/roadmap.md` §2 In flight: this followup workstream promoted
- [x] **0.7** This plan file authored

## PR 1 — i18n migration + legacy Dexie cleanup + branded hubId

**Scope:** Highest-leverage cleanup. Closes 2 HIGH findings (#3 legacy Dexie, #5 i18n) plus 3 LOW (#18 stale doc strings, #19 sentinel hubId, #20 missing test). `STORE_LAYER` rename (#15) deferred to PR6 to keep PR1 scoped.

**Branch:** `canvas-viewport-8f-followups` (cut from `main` in `.worktrees/canvas-viewport-8f-followups/`).

### Task 1.1 — Brand `ProcessHubId` opaque type

**Files:** `packages/core/src/processHub.ts` (existing `ProcessHubId` alias), call sites across `packages/stores`, `packages/hooks`, `packages/ui`, `apps/*`.

**Steps:**

- Replace `export type ProcessHubId = string` with branded type: `export type ProcessHubId = string & { readonly __brand: 'ProcessHubId' }`
- Add `asProcessHubId(value: string): ProcessHubId` factory + `isProcessHubId` predicate
- Refactor call sites that construct hubIds (paste flow, repository reads) to route through the factory
- Replace `WallCanvas.tsx:248` sentinel `'__wall-canvas-unbound__'` with the proper "optional hubId" pattern (Task 1.5 below); remove the brand-violating literal
- Run `pnpm --filter @variscout/core build && pnpm --filter @variscout/stores build` — TS errors guide remaining refactors

### Task 1.2 — Drop legacy `variscout-wall-layout` Dexie

**Files:** `packages/stores/src/canvasViewportStore.ts`, `packages/stores/src/__tests__/canvasViewportStore.test.ts`.

**Steps:**

- In the canvasViewportStore module (or a dedicated init function called once on first store hydration), call `await Dexie.delete('variscout-wall-layout')` guarded by a `try/catch` (the DB may not exist).
- Mirror the existing `PwaHubRepository.ts:65` pattern for legacy-DB cleanup.
- Tighten the existing test at `canvasViewportStore.test.ts:297` — currently creates the legacy DB but never asserts deletion. Add: `expect((await Dexie.exists('variscout-wall-layout'))).toBe(false)` after the init runs.
- Add a second test that calling init when no legacy DB exists is a no-op (not an error).

### Task 1.3 — i18n inventory across canvas surfaces

**Files (read-only audit):** `SystemLevelView.tsx`, `useCanvasStepCards.ts:38-75` (`CANVAS_LENS_REGISTRY`), `CanvasLensPicker.tsx`, `NoFocalStepPrompt.tsx`, `MobileLevelPicker.tsx`, `AuthorL3View.tsx`, `LocalMechanismView.tsx`.

**Steps:**

- Grep + read each file; produce an inventory of UI strings (label, description, aria-label, placeholder, empty-state, error)
- Output: a markdown table in the plan's session memory listing `key | english | file:line | type (label/description/aria/etc.)`
- Confirm count matches the ~30+ from the retrospective; flag any missed

### Task 1.4 — i18n catalog migration

**Files to create:** `packages/core/src/i18n/messages/canvas.ts`.

Read `adding-i18n-messages` skill first. Mirror existing typed-catalog patterns from neighboring message files. Each string from Task 1.3 becomes a typed message ID.

### Task 1.5 — Wire `formatMessage` in canvas components

**Files:** every file from Task 1.3 inventory.

**Steps:**

- Import `useFormatMessage` or `formatMessage` hook
- Replace inline English with `formatMessage('canvas.<key>')` or `formatMessage('canvas.<key>', { param })` patterns
- Per-file TDD: existing tests should pass with English locale; add one locale-switch test per file (or a single sweep test that swaps locale + asserts a few representative strings re-render)
- While in `WallCanvas.tsx:248`, replace sentinel hubId with proper optional handling — `useCanvasViewportInput` accepts `hubId: ProcessHubId | null`; short-circuit when null instead of synthesizing

### Task 1.6 — Test coverage + stale doc strings

- Add `packages/ui/src/components/Canvas/internal/__tests__/CanvasLensPicker.test.tsx` covering: each lens button enabled/disabled state per `isCanvasLensValidAtLevel(level, mode)` × all level × lens combos; click handler fires; aria-label uses formatMessage
- Fix stale `wallLayoutStore` mentions in `viewStore.ts:140` + `preferencesStore.ts:178` doc comments → `canvasViewportStore`

### Task 1.7 — PR1 verification + open PR

- `bash scripts/pr-ready-check.sh` green
- `pnpm --filter @variscout/ui build` green per `feedback_ui_build_before_merge`
- Manual `--chrome` walk: open canvas at each level, switch lenses, verify English renders; if any locale toggle exists in dev, swap it and verify no inline-English leaks
- Open PR via `gh pr create`; final Opus code-reviewer pass

## PR 2 — ADR-074 cleanup + L1 specLimits contract

**Scope:** Closes HIGH #2 (AuthorL3View parallel-implements FRAME) + MEDIUM #8 (L1 specLimits trust-the-caller).

### Task 2.1 — Identify FRAME embed-ready export

**Files (read):** `packages/ui/src/components/Frame/` — find the column-assignment surface used by FRAME workspace today.

**Steps:**

- Locate the component that renders unassigned-columns + assigned-input/output + dnd-kit chip drag
- If it's already a single export, note the prop interface
- If it's inlined into a larger Frame component, extract a `<FrameColumnAssignment step={step} ... />` export in the same PR (mirror how `EvidenceMapBase` + `WallCanvas` are re-used in `LocalMechanismView`)

### Task 2.2 — Refactor AuthorL3View to embed

**Files:** `packages/ui/src/components/Canvas/internal/AuthorL3View.tsx`.

**Steps:**

- Replace the hand-rolled droppable + ChipRail + column-derivation logic with `<FrameColumnAssignment step={focalStep} />` (or whatever the actual prop shape is from Task 2.1)
- Remove the parallel `assigned/ctqColumn/tributaryColumns` derivation
- Existing AuthorL3View tests should now assert "AuthorL3View renders FrameColumnAssignment for the focal step" — adapt or replace

### Task 2.3 — Embedding-not-duplication regression test

**Files:** add to `AuthorL3View.test.tsx` (or create).

**Steps:**

- Mock `FrameColumnAssignment`; assert AuthorL3View renders it exactly once with `step={focalStep}` prop
- Negative test: AuthorL3View does NOT import dnd-kit or ChipRail directly (snapshot the imports list or use a static-grep utility)

### Task 2.4 — Tighten SystemLevelView specLimits contract

**Files:** `packages/ui/src/components/Canvas/internal/SystemLevelView.tsx`, related test files.

**Steps:**

- Read current `specLimits` prop wiring + `buildSystemOutcomeModel` consumer
- Derive `specLimits` internally from `measureSpecs[map.ctsColumn]` — props become advisory/debug-only
- Add ADR-073 regression test: passing a step-level spec object as `specLimits` prop must NOT cause the rendered Cpk to use it; the test must show the outcome-spec value wins
- Document the new contract in JSDoc on the prop (or remove the prop entirely if no caller needs it)

### Task 2.5 — PR2 verification + open PR

- Standard pr-ready-check + ui build
- `--chrome` walk: open a Hub with multi-step Process Flow + an outcome with its own spec; verify AuthorL3 mounts inside a step at L3 + L1 capability reads outcome spec
- Open PR; Opus final review

## PR 3 — Lens × level matrix expand-or-amend (BRAINSTORM FIRST)

**Pre-flight: brainstorm session.** Before touching code, resolve "expand or amend":

1. `git log --follow -p packages/hooks/src/useCanvasStepCards.ts | head -200` — find when `performance.enabled:false` + `yamazumi.enabled:false` were introduced. Was it the original 8f PR3 (intentional V1 deferral) or a later PR (perhaps a fix that overreached)?
2. Read what each lens computes today at L2 (where they ARE enabled in the underlying strategy). Do they have data shapes that translate to L1 outcome + L3 column-categories per spec §10's matrix?
3. Decision-log entry resolves: **EXPAND** (wire enabled at remaining levels per §10) or **AMEND** (update §10 to mark these cells deferred-V2 with rationale).

### Expand-path tasks (if chosen)

- T3.E.1: Wire `yamazumi` enabled at L2 + L3 (spec §10 cells: L2 = balance bars, L3 = per-step balance by column-category)
- T3.E.2: Wire `performance` enabled at L1 + L2 + L3 (L1 = throughput aggregate, L2 = per-step cycle time, L3 = cycle-time breakdown by column-category)
- T3.E.3: Verify empty-state copy for the 3 truly-disabled cells per spec §10 (yamazumi-L1, process-flow-L1, process-flow-L3); copy must read exactly `"<lens> isn't available at <level> — try <suggested level>."`
- T3.E.4: `--chrome` walk every newly-enabled cell + the 3 disabled-with-copy cells

### Amend-path tasks (if chosen)

- T3.A.1: Update spec §10 matrix in `docs/superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md` — mark the 6 additional cells deferred-V2 with rationale
- T3.A.2: If the disable rationale is irreversible (e.g., methodology blocks the data shape), add `## Amendment — 2026-05-13` block to ADR-081
- T3.A.3: Decision-log entry "lens × level matrix amended" with the chosen rationale

Either path completes with: `isCanvasLensValidAtLevel(level, mode)` returns the correct truthy set; empty-state copy verified for disabled cells.

### Task 3.X — PR3 verification + open PR

Standard checks. If amend-only, this is a docs-only PR landing direct to main per CLAUDE.md tier rules.

## PR 4 — LOD polish + dead-code sweep

**Scope:** Closes MEDIUM #6 (cross-fade), #7 (snap-to-LOD), #12 (setViewportLevel throw), #13 (6px deadband) + LOW #16 (worldToWallSvg identity), #17 (CanvasViewport.tsx primitive unused). LOW (Canvas/index.tsx 1122-line refactor) explicitly deferred to next viewport feature.

### Task 4.1 — Real LOD cross-fade

**Files:** `packages/ui/src/components/Canvas/internal/LODSwitcher.tsx`.

**Steps:**

- Today: `opacity: 1` constant. Implement actual cross-fade between two `<div>` layers — outgoing-level renderer fades 1→0 over 150ms while incoming-level renderer fades 0→1
- Approach: keep both renderers mounted during transition (using a `React.useTransition` or a 2-element `useState<{current, previous}>` pattern); after 150ms drop the previous
- Test: transition triggers on `currentLevel` change; both renderers visible during the 150ms window; only one after

### Task 4.2 — Snap-to-LOD on wheel-stop

**Files:** `packages/hooks/src/useCanvasViewportInput.ts`.

**Steps:**

- Add wheel-stop debounce (~150ms) — d3-zoom `'end'` event listener
- On end: if zoom is in dead zone (0.3–0.5), ease to 0.5; if in 1.8–2.0, ease to 1.8. Use d3-zoom's `transform.scaleBy` + `transition`
- Test: simulate wheel events ending in each dead zone; assert eventual zoom value matches the band edge

### Task 4.3 — 6px click-distance deadband

**Files:** `useCanvasViewportInput.ts`.

**Steps:**

- Set `zoom.clickDistance(6)` per d3-zoom API
- Test: pointer drag of 5px CSS pixels is treated as click (no pan); 7px triggers pan

### Task 4.4 — Replace `setViewportLevel` throw with warn

**Files:** `packages/stores/src/canvasViewportStore.ts`, related tests.

**Steps:**

- Change `throw new Error(...)` to `console.warn(...) + return`
- Update existing tests that asserted throw — switch to spy on `console.warn` + assert no state mutation
- Document the behavior in JSDoc

### Task 4.5 — Delete `worldToWallSvg` identity (or document)

**Files:** `packages/ui/src/components/Canvas/internal/coordSpace.ts` (or wherever it lives).

**Steps:**

- Grep call sites. If unused, delete + remove from barrel export
- If used, replace the identity body with a passthrough comment or document why the seam exists

### Task 4.6 — Audit `CanvasViewport.tsx` primitive

**Files:** `packages/ui/src/components/Canvas/internal/CanvasViewport.tsx`.

**Steps:**

- Grep call sites. The retrospective flagged L2 inlines the CSS transform via `lodInputSurfaceRef` instead of mounting this primitive
- If unused, delete the file + its tests + barrel export entry
- If used in unexpected places, decide whether to consolidate L2's inline transform onto the primitive (consistency) or delete the primitive (one-way)

### Task 4.7 — Co-locate magic numbers + PR4 verification

**Files:** `packages/stores/src/canvasViewportStore.ts:22-26`, `packages/core/src/canvas/viewport.ts`.

**Steps:**

- Move `FIT_TO_CONTENT_ZOOM_BY_LEVEL` constants from canvasViewportStore to canvas/viewport.ts adjacent to `LOD_THRESHOLDS` (single source of truth for level math)
- pr-ready-check + ui build + `--chrome` walk verifying cross-fade visible, snap-to-LOD works, click-vs-drag deadband honored

## PR 5 — Azure Blob sync for canvasViewportStore (ADR-081 §2)

**Scope:** Closes the single load-bearing HIGH #1. ADR-locked commitment unmet — most important PR in this workstream.

### Task 5.1 — Read existing Azure Blob sync pattern

**Files (read):** `apps/azure/src/persistence/AzureHubRepository.ts` (per-hub blob sync with ETag per ADR-079), the 8e wallLayoutStore precedent (look for whatever Azure layer handled wall-layout state before the rename), `apps/azure/src/features/investigation/useCanvasViewportLifecycle.ts`.

Inventory: SAS-token endpoint, ETag concurrency handling, conflict resolution, IndexedDB → Blob write path, Blob → IndexedDB read path, error handling.

### Task 5.2 — Split useCanvasViewportLifecycle PWA/Azure

**Files:** `apps/azure/src/features/investigation/useCanvasViewportLifecycle.ts` (Azure variant); confirm or add a PWA variant; ensure they share a thin shared interface from `packages/hooks`.

**Steps:**

- Azure variant: on hub-open, first rehydrate from local Dexie (instant), then `await` Blob fetch via `/api/storage-token`, reconcile via ETag, write back to Dexie + store
- On viewport mutation: debounced persist (1s? match existing wallLayoutStore precedent) to BOTH Dexie + Blob; ETag preserved
- Last-write-wins per spec §11 + wallLayoutStore precedent — no merge logic; ETag conflicts treated as last-write-wins with App Insights telemetry

### Task 5.3 — Per-hub viewport blob key

**Files:** existing per-hub blob key utility in `apps/azure/src/persistence/`.

**Steps:**

- Confirm key shape: e.g., `hubs/<hubId>/viewport.json` or whatever pattern existing per-hub blobs use
- Reuse the SAS-URL flow; do NOT introduce a new endpoint

### Task 5.4 — Tests: Azure round-trip + multi-device

**Files:** `apps/azure/src/features/investigation/__tests__/useCanvasViewportLifecycle.test.ts` (or new).

**Steps:**

- Round-trip test: write a viewport via the store → assert Dexie + (mocked) Blob both contain the new state → simulate a fresh load → assert state recovers from Blob
- Multi-device test: two store instances → first writes → second reads from Blob via SAS mock → both see same viewport
- ETag conflict test: store A holds ETag=v1; another writer updates blob to v2; A tries to persist; assert A re-fetches and overwrites (last-write-wins) without crash

### Task 5.5 — App Insights telemetry

- Add a low-priority custom event for ETag conflicts so we can monitor frequency; respect no-PII rule per `editing-azure-storage-auth` skill

### Task 5.6 — PR5 verification + open PR

- All standard checks
- `--chrome` walk on Azure dev: open hub A, pan/zoom, close, reload → state survives. Then open same hub from a second browser instance (incognito) — verify viewport state from first instance appears
- Open PR with detailed test plan; Opus final review

## PR 6 — L3 CTAs + mobile step-list + selector scope + STORE_LAYER rename

**Scope:** Closes MEDIUM #9 (L3 CTAs), #10 (mobile L3), #11 (d3-zoom selector scope) + LOW #15 (STORE_LAYER rename).

### Task 6.1 — Wire 4 remaining response-path CTAs at L3

**Files:** `packages/ui/src/components/Canvas/internal/LocalMechanismView.tsx`, RPS dispatch primitives in `packages/core/src/responsePath*` or `packages/ui/src/components/RPS/`.

**Steps:**

- Today: one Quick Action button per column. Add 4 more (Focused Investigation, IP, Sustainment, Handoff) at column-mechanism granularity
- Reuse existing RPS V1 dispatch primitives — do NOT reimplement
- Per spec §5.3.a Decision #6: factor-contribution rankings still require active investigation context; CTAs that imply attribution must respect that gate
- Test each CTA dispatches the correct HubAction

### Task 6.2 — Mobile L3 without focalStep → step-list

**Files:** `packages/ui/src/components/Canvas/internal/MobileLevelPicker.tsx`, `NoFocalStepPrompt.tsx`.

**Steps:**

- Today (`MobileLevelPicker.tsx:71-75`): tap "Step" without focal → redirects to L2 + zoom=2.5
- Change: tap "Step" without focal → setLevel('l3') and render the step-list (factor out a shared `StepListPicker` from `NoFocalStepPrompt` if desktop reuses)
- Tapping a step in the list sets `focalStepId` + stays at L3

### Task 6.3 — d3-zoom selector scope

**Files:** `packages/hooks/src/useCanvasViewportInput.ts`.

**Steps:**

- Replace `useCanvasViewportStore.subscribe(...)` (store-wide) with `subscribeWithSelector(state => state.viewports[hubId])` — only fire `syncElementToStoreViewport` on viewport-shape changes for THIS hub
- Test: trigger an unrelated mutation (e.g., selection change) → assert syncElement not called

### Task 6.4 — STORE_LAYER rename

**Files:** `packages/stores/src/canvasViewportStore.ts`, `packages/stores/src/__tests__/layerBoundary.test.ts`, `packages/stores/CLAUDE.md`.

**Steps:**

- Rename `'annotation-per-project'` → `'annotation-per-hub'` on the canvasViewportStore (state is per-Hub keyed; this label is now honest)
- Update layerBoundary enum + test assertions
- Update `packages/stores/CLAUDE.md` table row

### Task 6.5 — PR6 verification + close workstream

- Standard checks
- `--chrome` walk: every L3 CTA fires the right modal; mobile L3 step-list renders + tapping a step works; lens × level cells per PR3's outcome
- Open PR; Opus final review

**On merge:**

- Update decision-log Amendment block: change "5 HIGH findings tracked as followup workstream" → "all 20 followups complete; 8f vision §5.4 closure clean"
- Update `MEMORY.md` line 4: "SHIPPED with 5 HIGH followups in flight" → "SHIPPED + followups complete"
- Update `project_canvas_viewport_8f.md`: remove the followup caveat block
- Close `docs/investigations.md` "8f followups" entry; promote any unresolved items elsewhere
- Mark this plan `status: delivered`

## Critical files (read-first per PR)

- `packages/stores/src/canvasViewportStore.ts` — store + persistence (PRs 1, 5, 6)
- `packages/ui/src/components/Canvas/internal/{SystemLevelView,LODSwitcher,LocalMechanismView,AuthorL3View,MobileLevelPicker,NoFocalStepPrompt,CanvasLensPicker,CanvasViewport}.tsx`
- `packages/hooks/src/{useCanvasViewportInput,useCanvasStepCards,useCanvasViewportShortcuts}.ts`
- `packages/ui/src/components/Frame/` — embed source for PR2
- `apps/azure/src/features/investigation/useCanvasViewportLifecycle.ts` (PR5)
- `packages/core/src/canvas/viewport.ts` — thresholds + types
- `packages/core/src/i18n/messages/canvas.ts` — new (PR1)

## Verification (per PR + end-of-workstream)

Per PR:

- `bash scripts/pr-ready-check.sh` green
- `pnpm --filter @variscout/ui build` green per `feedback_ui_build_before_merge`
- Subagent code review per task (Sonnet implementer + Sonnet quality reviewer + Opus final reviewer per PR) per `feedback_subagent_driven_default`
- `--chrome` walk on touched surfaces per `feedback_verify_before_push`

End-of-workstream:

- All 20 findings closed (minus any explicitly deferred in PR3 amend path)
- Decision-log Amendment block retired
- `MEMORY.md` + topic memory updated
- `docs/investigations.md` "8f followups" closed
- Plan `status: active` → `delivered`

## Out of scope

- `Canvas/index.tsx` 1122-line refactor — defer to next viewport feature per slice-cap discipline
- Snap-to-LOD timing constants (chrome-walk-tunable, not ADR-locked)
- Multi-Hub portfolio (spec §11 explicit out-of-scope; Azure-tier named-future)
- New methodology levels beyond L1/L2/L3
