---
title: '8f-canvas-viewport-shipped-followups-and-cleanup-cluster-complete-2026-05-14'
description: 'Levels-as-pan/zoom shipped 2026-05-13 across PRs #160-#165; PR #166 closed 19/20 retro findings; PR #168 (7c7dfd68) bundled cleanup cluster closes setState-in-render bug + LOW #19 (brand ProcessHubId) + LOW #16 (Canvas 1135→845 via 3 extractions) + opportunistic tsc hygiene. All canvas-viewport carry-forward work CLOSED 2026-05-14.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 0bd8bf7b-cd60-4ddd-8a60-5b0b0ac8bf40
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_canvas_viewport_8f.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Closes vision §5.4 — the last unmet vision-spec commitment after PR8 sub-PRs 8a–8e. Canvas is now a navigable three-level viewport (System / Process Flow / Local Mechanism); zoom infers level; no separate picker. **Vision §5.4 + ADR-081 §2 commitment + spec §10 lens matrix are now fully honored after PR #166 (squash-merged `cd936915` 2026-05-14).**

## Status (2026-05-13)

- **Spec** (`status: delivered`): `docs/superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md`.
- **Plan** (`status: delivered`): `docs/superpowers/plans/2026-05-13-canvas-viewport-architecture.md`.
- **ADR-081** (`status: accepted`): `docs/07-decisions/adr-081-canvas-viewport-architecture.md`. 5 irreversible commitments.
- **ADR-074 Amendment 2026-05-13**: Canvas-as-viewport-surface — may embed owner-surface components, may not reimplement.
- **Shipped PRs**: #160 PR1 Foundation · #161 PR2 d3-zoom · #162 PR3 LODSwitcher + mobile picker · #163 PR4 L3 investigator · #164 PR5 L3 author · #165 PR6 L1 outcome panel + lens × level matrix.
- **Decision-log entry**: pinned 2026-05-13 "8f canvas viewport SHIPPED — levels-as-pan/zoom live"; **followup amendment block appended** acknowledging the 5 HIGH gaps below.
- **Followup plan** (`status: active`): `docs/superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md` — 6 PRs to close all 20 findings.
- **Followup tracking**: `docs/investigations.md` entry "8f followups".

## What actually shipped (lock-in clarity)

- **Per-Hub keyed `useCanvasViewportStore`** — `viewports: Record<ProcessHubId, CanvasViewportSnapshot>` (`packages/stores/src/canvasViewportStore.ts:67`). Persistence via Dexie DB `variscout-canvas-viewport`. Per-Hub rehydrate/persist lifecycle.
- **d3-zoom 3 KB gz** — `useCanvasViewportInput` hook drives wheel + drag input math.
- **`LODSwitcher` React primitive** — reads `currentLevel`, mounts the right per-level renderer.
- **L1/L2/L3 renderers** — `SystemLevelView` (L1), Canvas DOM grid (L2), `LocalMechanismView` (L3 investigator, embeds `EvidenceMapBase` + `WallCanvas` filtered by step), `AuthorL3View` (L3 author).
- **URL deep-link** `?level=l1|l2|l3` + L3 `?focalStep=<id>`.
- **Mobile sequential picker `[System | Process | Step]`** at <768px.
- **ADR-074 boundary enforcement** in `scripts/pr-ready-check.sh`.

## Followup workstream — `canvas-viewport-8f-followups`

3-agent retrospective (architecture / design / code-quality) on `main` after 8f merge surfaced 20 findings (5 HIGH / 8 MEDIUM / 7 LOW). 19 of 20 closed across 23 commits. Single-PR-at-end mode via `superpowers:subagent-driven-development` (see `feedback_single_pr_at_end_cleanup`). Deferred: branding `ProcessHubId` (LOW #19, 18-file refactor, own future micro-PR). Delivery state in `gh pr list`.

### Durable architectural changes from the workstream

- **`getStepColumnAssignments(map, focalStepId)`** in `@variscout/core/frame/stepColumns.ts` — shared helper replacing private `focalStepColumns` duplicates in AuthorL3View + LocalMechanismView. Returns `{ assigned, stepName, ctqColumn, tributaryColumns }` with dedup. Future per-step column lookups should reuse this.
- **`loadBlobCanvasViewport` / `saveBlobCanvasViewport`** in `apps/azure/src/services/blobClient.ts` — per-Hub viewport blob at path `hubs/<hubId>/viewport.json` with ETag-conditional PUT mirroring `updateBlobEvidenceSnapshotsConditional`. Azure tier honors ADR-081 §2 + ADR-079.
- **`getLocalViewportUpdatedAt(hubId)`** in `@variscout/stores/canvasViewportStore` — pure Dexie read used by Azure lifecycle hook to reconcile Blob ↔ local Dexie timestamps.
- **STORE_LAYER for canvasViewportStore** is `'annotation-per-hub'` (was `'annotation-per-project'`; state is hub-keyed).
- **`LOD_SNAP_BOUNDARIES`** + **`FIT_TO_CONTENT_ZOOM_BY_LEVEL`** co-located with `LOD_THRESHOLDS` in `@variscout/core/canvas/viewport.ts` — single source of truth for level math.
- **Spec §10 lens × level matrix amended**: 6 cells marked deferred-V2 (performance + yamazumi × 3 levels each). Registry's `enabled:false` + "Future ... lens" descriptions were intentional placeholders, not bugs. See `feedback_check_registry_placeholders_first`.
- **LODSwitcher cross-fade is real now** — `useState<{incoming,outgoing}>` + `setTimeout(150)`. Both renderers stacked absolute during the window; outgoing unmounts at 150ms.
- **d3-zoom `clickDistance(6)`** in `useCanvasViewportInput` honors spec §6.3.
- **`setViewportLevel` returns `viewport` unchanged + warns** when L3 requested without focalStepId (was throw — Zustand `set` consistency risk).
- **Mobile L3 was already correct** — `setLevel('l2') + setZoom(2.5)` runs atomically; the final state is L3 with no focalStepId; NoFocalStepPrompt renders the step-list. Retrospective MEDIUM #10 was a code misread. See `feedback_verify_review_claims_against_code`.

## What didn't ship (followups — 5 HIGH gaps, now mostly resolved)

1. **Azure Blob sync gap.** `useCanvasViewportLifecycle.ts` is byte-identical PWA/Azure; writes only to local Dexie. ADR-081 §2 locked "Azure = IndexedDB + Blob sync with ETag per ADR-079." Team-shared per-Hub viewport does not round-trip across devices. → **PR5 of followup workstream.**
2. **AuthorL3View parallel-implements FRAME column-assignment** — `packages/ui/src/components/Canvas/internal/AuthorL3View.tsx` hand-rolls a droppable + ChipRail instead of embedding `packages/ui/src/components/Frame/`. ADR-074 amendment violation. → **PR2 of followup workstream.**
3. **Legacy `variscout-wall-layout` Dexie never deleted.** `canvasViewportStore` has no `Dexie.delete()` call; test that purports to verify deletion doesn't actually assert it. Silent storage leak for pre-8f users. → **PR1 of followup workstream.**
4. **Lens × level matrix narrower than spec §10.** `useCanvasStepCards.ts:38-75` sets `performance.enabled:false` and `yamazumi.enabled:false` globally. Spec disables 3 cells; shipped surface disables 9. 6 promised enabled cells are unreachable. → **PR3 of followup workstream (brainstorm first: expand or amend?).**
5. **~30+ hardcoded English UI strings** in `SystemLevelView`, `CANVAS_LENS_REGISTRY`, `MobileLevelPicker`, `NoFocalStepPrompt`, `AuthorL3View`, `LocalMechanismView`, `CanvasLensPicker aria-label`. None in `packages/core/src/i18n/messages/`. → **PR1 of followup workstream.**

Plus 8 MEDIUM + 7 LOW findings (LOD cross-fade is cosmetic-only, snap-to-LOD missing, L3 CTAs collapsed to Quick Action only, mobile L3 redirects instead of step-list, d3-zoom subscribes store-wide, `setViewportLevel` throws, missing `CanvasLensPicker` test, `STORE_LAYER` mislabel, dead `CanvasViewport.tsx` primitive, `worldToWallSvg` identity, stale doc strings, sentinel hubId smell, etc.) — all enumerated in `docs/investigations.md` and the followup plan.

## Methodology clarification (still binds)

Three levels = three slices of one Hub's data:
- **A Process Hub IS the L2 artifact.** "The map IS the Hub" (vision §3.1).
- L1 is the outcome reading of one Hub (within-Hub scope; multi-Hub portfolio = Azure-tier named-future).
- L3 is the columns feeding one step plus the investigation graph for that step.

ADR-073 (no statistical roll-up) constrains L1 to render the outcome series against the outcome's own spec — never aggregated step capability. SystemLevelView complies, but the `specLimits` prop is not contractually tied to the outcome's own spec — latent risk tracked as followup #8.

## Post-8f cleanup cluster — PR #168 (squash-merged `7c7dfd68` 2026-05-14)

Bundled cleanup of three carry-forward items + opportunistic tsc hygiene, executed via `superpowers:subagent-driven-development` over 15 commits squashed into one. Closes:

- **setState-in-render warning in AppMain** (post-walk discovery 2026-05-14): bare `usePanelsStore()` whole-store sub replaced with 24 individual `usePanelsStore(s => s.field)` selectors in `apps/pwa/src/hooks/useAppPanels.ts`. Also lifted two remaining bare `usePanelsStore.setState()` calls into a compound store action `openDataTableAtRow(index, isDesktop)`. Regression test in `apps/pwa/src/__tests__/App.test.tsx`. Root cause: React 19 Strict Mode + Zustand 5 `useSyncExternalStore` tearing detection fires on every panelsStore update when a whole-store snapshot is in scope. Honors `packages/stores/CLAUDE.md:18` "Never bare useStore()" (ADR-041).
- **LOW #19 — brand ProcessHubId**: opaque type `ProcessHubId = string & { readonly __brand: 'ProcessHubId' }` defined in `packages/core/src/processHub.ts` (single source of truth). `asProcessHubId()` factory throws on empty/blank per `feedback_strict_assert_over_silent_migration`; `isProcessHubId()` predicate. `normalizeProcessHubId` returns the branded type. `__wall-canvas-unbound__` sentinel literal removed from `packages/ui/src/components/InvestigationWall/WallCanvas.tsx:248`; replaced with `hubId ?? null` + null short-circuit in `useCanvasViewportInput`. 25-file sweep migrates all consumers to import directly from `@variscout/core/processHub`. No re-export shims in `@variscout/stores`.
- **LOW #16 partial — Canvas/index.tsx decomposition** (1135 → 845 lines via 3 extractions):
  - `useCanvasHypothesisDrawing` hook (~120 LOC) in `packages/hooks/src/` — pointer/keyboard handlers + endpoint parsing + reset effect; 12 tests.
  - `useCanvasHypothesisArrows` hook (~100 LOC) — arrowSegments state + ResizeObserver + DOM measurement layout effects; 8 tests.
  - `<CanvasLevelRouter>` sub-component (~100 LOC) in `packages/ui/src/components/Canvas/internal/` — lens-validity gate + L1/L2/L3 content composition + mode-toggle visibility; 10 tests. `CanvasAuthoringMode` + `CanvasL3Archetype` types moved here, re-exported from `Canvas/index.tsx` to avoid circular import.
  - 4 remaining seams (viewport fit / step card grid / content L2 / mobile picker) explicitly deferred to next viewport feature.
- **Opportunistic tsc hygiene**: 16 pre-existing tsc errors closed across `@variscout/core` + `@variscout/hooks` (Vite ImportMeta env/glob types via `vite-env.d.ts` files, DataRow fixture casts in 2 test files, missing `beforeEach` import in `responsesApi.test.ts`, dead `_vi` import, `findingSourceLensCapture` mock-arg). NOT bundled: d3 type-package hoisting in `useCanvasViewportInput.ts`, tuple-mock typing in `useHubCommentStream.test.ts`, vitest worker timeouts under turbo, 9 SustainmentRecord + ProcessMap fixture-shape mismatches in core tests (newly surfaced). All deferred items logged in `docs/investigations.md` with file:line + pickup criteria.

**Pattern lessons reaffirmed:** `feedback_single_pr_at_end_cleanup` (bundle, don't fragment), `feedback_no_backcompat_clean_architecture` (sweep imports — don't shim), `feedback_strict_assert_over_silent_migration` (factory throws — don't fall back silently), `feedback_verify_preexisting_failure_claims` (controller verified each implementer "pre-existing" claim against main HEAD), `feedback_fix_absorbed_violations_at_seam` (lifted bare setState calls in the same PR as the surrounding refactor).

## Next session

All canvas-viewport carry-forward work is closed. Next vision-advancing target per MEMORY.md: FRAME canvas detail brainstorming. Open deferred items in `docs/investigations.md`:
1. d3 types in `useCanvasViewportInput.ts` — one-PR dep bump
2. Tuple-mock typing in `useHubCommentStream.test.ts` — test-quality pass
3. 9 SustainmentRecord + ProcessMap fixture-shape mismatches — fixture catch-up PR
4. Vitest worker timeouts under turbo — separate infra diagnostic
5. 4 remaining Canvas/index.tsx seams — defer to next viewport feature

## Cross-references

- Methodology: `docs/01-vision/methodology.md` §2.1
- Vision §5.4 commitment: `docs/superpowers/specs/2026-05-03-variscout-vision-design.md`
- [[project_canvas_replaces_tabs]] — Canvas + Investigation tabs nav
- [[project_pr8_canvas_vision_alignment]] — closed by 8f (plus followup workstream)
- [[feedback_viewport_state_not_mechanism]] — the architectural insight
- [[feedback_check_shipped_patterns_first]] — applied throughout
- [[feedback_retrospective_review_pattern]] — 3-reviewer pattern that surfaced these 20 findings even though workflow wasn't bypassed
