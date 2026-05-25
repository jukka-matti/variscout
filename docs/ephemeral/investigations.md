---
tier: ephemeral
purpose: decide
title: 'VariScout — Active Investigations (open)'
audience: human
status: active
last-reviewed: 2026-05-18
related:
  - 2026-05-16-docs-strategy-design
---

# VariScout — Active Investigations (open)

Code-level smells, UX follow-ups, and architectural questions surfaced during work that are **not yet decisions**. Closed investigations are archived as cards under [`docs/cards/investigations/`](../cards/investigations/).

**When to add an entry:** while shipping fix A you notice problem B that's adjacent / related / surfaced by the same change. B isn't blocking A and you don't want to inflate scope, but it's worth not losing.

**When to remove an entry:**

- It became a decision → move to `decision-log.md` (Open Questions or Replayed Decisions) OR card under `docs/cards/decisions/`.
- It became a spec → link to `docs/superpowers/specs/...` and add `[PROMOTED YYYY-MM-DD]` marker.
- It was fixed → add `[RESOLVED YYYY-MM-DD]` marker (next docs:rebuild moves it to cards).
- It was tried and rejected → move to `decision-log.md` Replayed Decisions with rationale.

---

## Active investigations

### `@variscout/ui` vitest full-suite hang (pr-ready-check blocker) [RESOLVED 2026-05-25]

**Surfaced by:** Lane B Phase 1 controller verification (PR #203), 2026-05-19.

**STATUS 2026-05-25 — RESOLVED:** Wholesale-rewrote `Canvas.test.tsx` (1500 lines → ~575 lines) on branch `fix/canvas-test-quarantine-vitest-hang`. **Actual root cause:** the legacy file imported the real `@variscout/hooks` package — its transitive graph (`useCanvasViewportInput`, `useCanvasHypothesisDrawing`, `useCanvasKeyboard`, `useChipDragAndDrop`, …) deadlocked vitest's mock-resolution during module init. The fresh file mirrors `CanvasWorkspace.test.tsx`'s full `vi.mock('@variscout/hooks', ...)` factory (~365 lines, the proven non-hang pattern), keeps the 4 component mocks (`@variscout/charts` via `importOriginal`, `../../InvestigationWall` synthetic, `@dnd-kit/core` synthetic, `../internal/LocalMechanismView` synthetic), and covers Canvas-direct concerns only: smoke render, L2 step cards, step-click → 3 wedge-V1 response-path CTAs render, Charter callback fires with stepId, Charter hides when handler absent (per `responsePathCta.ts` "hide, don't tease" rule), mobile Wall-shortcut visibility. Deeper response-path coverage stays in `internal/__tests__/CanvasStepOverlay.test.tsx` (unit) and `CanvasWorkspace.test.tsx:1093` (workspace integration). Earlier `importOriginal`-only hypothesis (from an Explore subagent on the same date) was insufficient — verified hung at 240s after that change; the `@variscout/hooks` mock was the missing piece.

**Verification:** isolated file 6/6 passing in 3.19s; full `@variscout/ui` suite 223 files / 2140 tests in 86.59s (down from 117s baseline with quarantine); `scripts/pr-ready-check.sh` green end-to-end.

**Bisect log (2026-05-25, controller: Opus):**

| Iter | Filter                                                                     | Files        | Result          | Outcome                |
| ---- | -------------------------------------------------------------------------- | ------------ | --------------- | ---------------------- |
| 0    | Sanity: `SystemLevelView`                                                  | 1            | passes 2.96s    | tooling OK             |
| 1    | `InvestigationWall ReportView ImprovementPlan IPDetail ImprovementProject` | 84           | passes 17.90s   | offender NOT in these  |
| 2    | `Canvas`                                                                   | ~28          | hangs (SIGKILL) | offender in Canvas fam |
| 3    | `Canvas/internal`                                                          | 22           | passes 8.93s    | offender NOT in here   |
| 4    | `Canvas/__tests__`                                                         | 3            | hangs (SIGKILL) | narrowed to 3 files    |
| 5a   | `Canvas.test`                                                              | 1+wallcanvas | hangs           | **offender**           |
| 5b   | `CanvasProcessMap`                                                         | 1            | passes 4.69s    | not it                 |
| 5c   | `CanvasWorkspace`                                                          | 1            | passes 6.16s    | not it                 |

Root-cause diagnosis deferred — likely candidates per stack signature: a `vi.mock` factory with `await import('react')` interacting with the heavy transitive import graph of `Canvas/index.tsx` (which pulls @variscout/charts + InvestigationWall + LocalMechanismView + the store family). 50 tests of Canvas integration coverage are dark until this is fixed.

**Promotion path:** CLOSED 2026-05-25 — entry retained as historical record; promotion path no longer applicable. If a _new_ heavy-mock test file is added with similar import shape (real `@variscout/hooks` + Canvas-like component graph) and starts hanging, the bisect playbook in `feedback_pr_ready_check_vitest_hang` still applies — but the structural lesson (mirror `CanvasWorkspace.test.tsx`'s hooks-mock pattern from the start) is now the durable answer.

**Description:** `bash scripts/pr-ready-check.sh` hangs indefinitely on its first step (`pnpm test` via turbo). Sampling the worker via macOS `sample(1)`:

- Under turbo: V8 hot in `Object.defineProperty` / `OrdinaryDefineOwnProperty` flood — vitest mock/spy installation loop. STAT=`R`, CPU=101%, observed 57+ minutes.
- Without turbo (direct `pnpm --filter @variscout/ui test -- --run`): different signature — V8 hot in `MicrotaskQueue::RunMicrotasks` → `PromiseFulfillReactionJob` → `AsyncFunctionAwaitResolveClosure` → deep `InterpreterEntryTrampoline` recursion. Promise reaction loop. Same STAT=`R`, CPU=102%, observed 3+ minutes before kill.

Other packages are clean: `@variscout/core` (3397 pass, 18s), `@variscout/hooks` (1203 pass, 87s), `@variscout/stores` (281 pass, 5s), `@variscout/charts` (170 pass, 30s). The implementer's targeted `pnpm --filter @variscout/ui test -- --run SystemLevelView` ran the affected Phase-1 file cleanly in **1.91s** on the same tree, ruling out the Pp/Ppk deletion as causal. The hang is in _some other_ ui test file the targeted filter doesn't load. _(2026-05-25: bisect confirmed offender = `Canvas/__tests__/Canvas.test.tsx` — see STATUS block above.)_

---

### Testing strategy — Tier 2 + Tier 3 deferred work

**Surfaced by:** Wedge V1 post-launch testing audit, 2026-05-17 (PR #197 + PR #198 + plan in `~/.claude/plans/`).

**Description:** Tier 1 testing improvements shipped as [PR #198](https://github.com/jukka-matti/variscout/pull/198) (Math.random retirement + ESLint guard + fake-indexeddb docs + local TDD cheatsheet). Tier 2 (Vitest Projects migration) and Tier 3 (branded-type architecture guards / Vitest pool profiling / scheduled nightly Playwright + optional CI coverage) are preserved as a planning artifact rather than scheduled. The full plan including triggers-for-execution, file-level scope, and sequencing lives at [`docs/superpowers/plans/2026-05-17-testing-strategy-tier2-3-deferred.md`](../superpowers/plans/2026-05-17-testing-strategy-tier2-3-deferred.md).

**Possible directions:** See the linked plan doc — each tier has its own trigger condition. CI work (Tier 3c) is explicitly user-deferred ("for ci, we want to keep it local for now"); revisit only if policy changes.

**Promotion path:** When any single tier item becomes worth scheduling, dispatch via `superpowers:subagent-driven-development` per the linked plan. The plan is intentionally written so any one item can ship independently.

---

### PR-WV1-1 — architecture-review follow-ups (project membership foundation)

**Surfaced by:** system-architect (Opus) review on `feat/wedge-pr-wv1-1-project-membership` 2026-05-16, after the 10-task implementation sub-plan completed. CRITICAL (app-side wiring gap) was fixed in commit `695091e3` before merge; 3 IMPORTANT items deferred to PR-WV1-2 via `decision-log.md` 2026-05-16 wedge-amendment; 2 items below are smaller follow-ups outside the wedge implementation sequence.

**Open items (post-merge):**

- **Admin view of pending invites per project (V2 deferral)** — `useProjectMembershipStore` is per-user only: each user sees their own `pendingInvites[]`, no surface today for a Lead to see "who else have I invited to project X who hasn't accepted yet?". Wedge spec §4 doesn't require this; track for V2 collaboration features. Promotion: spec amendment + new UI when collaboration tier work lands.

- **`useInvitationSync` Graph API wiring** — V1 ships a stub at `apps/azure/src/features/projectMembership/useInvitationSync.ts` that echoes the email as `{ userId, displayName: email.split('@')[0] }`. Real Microsoft Graph user-lookup wiring (with proper `displayName` resolution from AD, photo fetch optional) is post-V1 Azure-only follow-up. Today no caller invokes the stub — Task 8's Charter integration builds `displayName` inline. Promotion: separate Azure-only PR; trigger is the first call site that needs real AD lookup.

- **`displayName = email.split('@')[0]` truncation for dotted email locals** — Task 8's `IPDetailPage.handleMemberInvite` derives `displayName` from the email (e.g., `first.last@org` → `first.last`). V1-acceptable since the modal has no Name field, but produces awkward strings for users with dotted email locals. Promotion: gated on either (a) Name field added to `InviteModal`, or (b) `useInvitationSync` returning real Graph displayName.

---

### Durable cross-device invitation persistence

**Surfaced by:** PR-WV1-3a Implementation 2026-05-16.

**Description:** Invitations live transiently in `useProjectMembershipStore.pendingInvites[]` + localStorage. The inviter sees the invite locally; the invitee on a different browser does not. The wedge spec §4.2 "in-app + email notification" relies on the email half for cross-device delivery. For durable in-app multi-device delivery, invitations must persist somewhere tenant-scoped (`ImprovementProjectMetadata.invitations?: Invitation[]` field OR a tenant-wide invitation table).

**Possible directions:**

- Add `invitations?: Invitation[]` to `ImprovementProjectMetadata` (parallel to `members?`). Banner reads from a derived selector iterating all IPs for the current user. Cost: schema migration, .vrs round-trip, Dexie scheme bump.
- Tenant-wide invitation table in `azureHubRepository`. Cost: new repo path; PWA has no parallel.

**Promotion path:** Decision required if customer demand surfaces for multi-device invite UX. Track until PR-WV1-5 (tier-gating retirement + nav reorder, where auth-wiring refinement lands) — that PR is the natural place to revisit since per-user persistence keys (`useProjectMembershipStore`'s deferred item (c)) are also being addressed there.

---

### 8f canvas viewport — followup findings from 3-agent retrospective

**Surfaced by:** retrospective architecture / design / code-quality review on `main` 2026-05-13, after 8f's 6 PRs (#160–#165) shipped. Per-PR Opus reviews had passed; cross-PR drift was the gap.

**Description:** 20 findings total — 5 HIGH that qualify the "shipped" claim, 8 MEDIUM spec-vs-shipped drift, 7 LOW cleanups. Followup workstream plan at [`docs/superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md`](../superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md). Decision-log "8f canvas viewport SHIPPED" entry has been amended to reference these gaps. Roadmap continues to mark 8f shipped; the followups are a separate cleanup sequence.

**STATUS 2026-05-14 — RESOLVED:** 19 of 20 findings closed by PR #166 (squash-merged as `cd936915` after `--chrome` walk verification). HIGH #4 resolved via spec AMEND (intentional V2 placeholders); HIGH #1/#2/#3/#5 resolved via implementation; all 8 MEDIUM resolved (including the spec §10 amend); 6 of 7 LOW resolved. LOW #19 (brand `ProcessHubId`) closed by PR #168 (cleanup/setstate-appmain) — opaque type defined in `packages/core/src/processHub.ts`, sentinel `'__wall-canvas-unbound__'` replaced with `null` short-circuit, 25-file sweep across packages + apps + tests. **Remaining:** LOW #16 (`Canvas/index.tsx` 1122-line refactor, defer to next viewport feature). Entry retained as historical record; the diff is in `cd936915` + PR #168.

**HIGH (5):**

- **Azure Blob sync gap** — `apps/azure/src/features/investigation/useCanvasViewportLifecycle.ts:15-30` is byte-identical PWA/Azure; both call only `persistCanvasViewport` / `rehydrateCanvasViewport` against local Dexie. ADR-081 §2 locked "Azure = IndexedDB + Blob sync with ETag per ADR-079." Team-shared per-Hub viewport does not round-trip across devices on Azure.
- **AuthorL3View parallel-implements FRAME column-assignment** — `packages/ui/src/components/Canvas/internal/AuthorL3View.tsx` is a hand-rolled droppable + ChipRail wrapper re-deriving `assigned/ctqColumn/tributaryColumns`. Spec §5.3.b + ADR-074 amendment require embedding `packages/ui/src/components/Frame/`. The cleanest ADR-074-amendment violation in the shipped surface.
- **Legacy `variscout-wall-layout` IndexedDB never deleted in prod** — `packages/stores/src/canvasViewportStore.ts` has no `Dexie.delete('variscout-wall-layout')` call. The test at `canvasViewportStore.test.ts:297` titled "clean-breaks an existing v1 project-keyed Dexie database" creates the legacy DB but never asserts deletion. Silent storage leak for any user who touched the prior store.
- **Lens × level matrix narrower than spec §10** — `packages/hooks/src/useCanvasStepCards.ts:38-75` sets `performance.enabled:false` and `yamazumi.enabled:false`; `CanvasLensPicker.tsx:36` disables their buttons. Spec §10 only disables 3 cells (yamazumi-L1 + process-flow-L1 + process-flow-L3). Net: 6 of 13 enabled cells are unreachable because the lens is unselectable. **RESOLVED 2026-05-13 via AMEND path** — `performance` and `yamazumi` were intentional V2 placeholders at original ship (registry descriptions say "Future ... lens"). Spec §10 amended to mark these cells as deferred-V2 rather than expanding the registry. Original §10 over-promised; the as-shipped state is the right one.
- **~30+ hardcoded English UI strings** in `SystemLevelView.tsx` (~16 instances: outcome labels, capability metrics, Inbox, prompts), `useCanvasStepCards.ts:38-75` (lens labels + descriptions in `CANVAS_LENS_REGISTRY`), `CanvasLensPicker.tsx:26,37,51`, `NoFocalStepPrompt.tsx:24`, `MobileLevelPicker.tsx:55`, `AuthorL3View.tsx:31`, `LocalMechanismView.tsx` (~4 strings). None in `packages/core/src/i18n/messages/`.

**MEDIUM (8):**

- LOD cross-fade is cosmetic-only — `LODSwitcher.tsx:14-26` sets `opacity: 1` constant with a 150ms transition; nothing to interpolate. Spec §4.6 promised real cross-fade.
- Snap-to-LOD on wheel-stop missing — spec §4.6 commits to easing from 0.3–0.5 → 0.5 and 1.8–2.0 → 1.8.
- L1 `specLimits` not contractually tied to outcome's own spec — `SystemLevelView.tsx:89-100` trusts caller; latent ADR-073 risk if a step-level spec leaks in.
- L3 response-path CTAs collapsed to Quick Action only — `LocalMechanismView.tsx:207-214` renders one "Action" button per column. Spec §5.3.a lists 5 CTAs (Quick Action / Focused Investigation / IP / Sustainment / Handoff).
- Mobile L3 without focalStep redirects to L2 + `setZoom(2.5)` instead of step-list — `MobileLevelPicker.tsx:71-75`. Spec §7 promised "Pick a step to view" list.
- d3-zoom subscribes store-wide — `useCanvasViewportInput.ts:81` calls `useCanvasViewportStore.subscribe(...)` with no selector. Every store mutation fires `syncElementToStoreViewport()`. Diff-check makes it cheap, but should be selector-scoped via `subscribeWithSelector`.
- `setViewportLevel` throws on L3 without focalStepId — `canvasViewportStore.ts:114`. Zustand `set` inconsistency risk; prefer warn + no-op.
- Click-vs-drag deadband not explicitly set to 6px — `useCanvasViewportInput.ts` uses d3-zoom defaults; spec §6.3 contract not enforced.

**LOW (7):**

- `STORE_LAYER === 'annotation-per-project'` but state is per-Hub keyed — `'annotation-per-hub'` would be more honest (the test enum already allows it).
- `Canvas/index.tsx` now 1122 lines — refactor target before next viewport feature.
- `CanvasViewport.tsx` primitive appears unused — `Canvas/index.tsx` inlines the CSS transform via `lodInputSurfaceRef`. Verify and either adopt or delete.
- `worldToWallSvg(p, _viewport)` in `coordSpace.ts:22` is identity — delete or document.
- Stale `wallLayoutStore` references in `viewStore.ts:140` + `preferencesStore.ts:178` doc strings.
- ~~Sentinel hubId `'__wall-canvas-unbound__'` in `WallCanvas.tsx:248` — brand `ProcessHubId` to prevent leak into the store's `viewports` Record.~~ **CLOSED** — PR #168: `ProcessHubId` opaque type in core, `hubId ?? null` sentinel removed, full 25-file sweep.
- Missing test — `CanvasLensPicker.tsx` (the lens × level enabled predicate is load-bearing).

**Possible directions:** Execute the 6-PR followup plan via `superpowers:subagent-driven-development`. PR0 (docs sync) direct to main; PR1 (i18n + Dexie cleanup + branded hubId), PR2 (ADR-074 cleanup), PR3 (lens matrix — brainstorm first to decide expand-vs-amend), PR4 (LOD polish + dead-code), PR5 (Azure Blob sync — the ADR-081 §2 commitment), PR6 (L3 CTAs + mobile step-list + selector scope + STORE_LAYER rename).

**Promotion path:** entry closes when the 6 followup PRs ship; decision-log amendment block updates to note "followups complete"; `MEMORY.md` line 4 flips from "8f SHIPPED with followups in flight" to "8f SHIPPED + followups complete"; `project_canvas_viewport_8f.md` caveat block removed.

---

### Canvas journey clarity — designer-lens UX observations from PR #166 walk

**Surfaced by:** `--chrome` walk of PR #166 on 2026-05-14, requested as "designer classes on, think how logical and easy to use and understand is the whole analysis journey."

**Description:** PR #166 itself ships the followup fixes correctly; the broader Canvas journey has discoverability and labeling friction worth tracking separately from #166 scope:

1. **"Frame" tab label hides that this IS the canvas.** Top nav reads `Frame | Analysis | Investigation | Improvement | Report`. The vision spec (`project_canvas_replaces_tabs.md`, Q0 2026-05-03) commits to `[Hubs] [Canvas] [Investigation] [Improvement] [Report]`. A new user clicks "Frame" expecting "set up framing" and gets the L1/L2/L3 canvas surface with no breadcrumb signaling it. Nav rename to `Canvas` is the cheapest journey-clarity win.

2. **Desktop has no visible LODSwitcher.** Mobile has `MobileLevelPicker` pills (`System | Process | Step`); desktop users discover level changes only via wheel-zoom (no level chip, no breadcrumb, no "you are here" indicator). Desktop parity would be a small toolbar component.

3. **Mode toggle is mislabeled "Lock canvas."** The `CanvasModeToggle` button uses the lock/unlock icon + label "Lock canvas" / "Edit canvas" to flip between `author` mode (AuthorL3View column-assignment) and `read` mode (LocalMechanismView with 4 response-path CTAs). A user reading "Lock" thinks "prevent edits," not "switch to analysis view that exposes Investigate / Charter / Sustain / Handoff." The 4 column-granularity CTAs that PR #166 ships are gated behind a button no one will click to find them.

4. **L1 capability metrics row shows `--` despite specs detected on load.** Showcase opening modal said "Cpk 0.81 — Below target"; L1 SystemLevelView shows `Cp -- Cpk -- Pp -- Ppk -- Conformance 100.0%`. The gap is `outcome.ctsColumn` unbound until FRAME flow completes — but the L1 view doesn't tell the user this. No "Bind a CTS column to see capability" hint; just blank.

5. **L3 read mode renders 5 column cards × 4 CTAs = 20 flat-leveled actions.** No primary action signaled, no visual lead toward the suspected-contribution column. Every column reads as equally important. Designer instinct: rank-order cards by signal strength, demote weak contributors.

6. **L2 sub-tab vocabulary overlaps.** `Investigations | Hypotheses | Hypothesis hubs | Findings | Wall` reads as five near-synonyms to a learner. Expert-fluent, novice-hostile.

7. **L3 Investigate CTA whisks user to Investigation tab with no scope memory.** Clicking Investigate on `Fill_Weight_g` column lands on the hub composer showing 6 questions about `Does Line + Shift + Material_Batch together explain...` — none obviously scoped to the `Fill_Weight_g` selection that triggered the navigation.

8. **"Authoring model" caption (bottom-right of L2/L3)** is cryptic — neither label nor button; reads as orphan text.

9. **"Open SCOUT" button at L1** with no hover/tooltip; first-timer has no model for what SCOUT does.

**Why it matters:** PR #166 successfully ships the 19 of 20 followup fixes; the journey-around-them remains uneven. Each item above is a small-to-medium change; together they shift the canvas from "shipped, functional" to "explainable in 60 seconds to a first-time user."

**Possible directions:** Surface to brainstorming when the next canvas slice opens. Items 1, 2, 3 are small renames + a toolbar; 4 is an empty-state copy add; 5 is a sort + visual-weight change; 6 is a glossary-driven simplification; 7 is breadcrumb wiring; 8, 9 are caption/tooltip polish. Don't bundle into PR #166.

---

### Pre-existing tsc errors deferred from PR #168 (cleanup/setstate-appmain)

**Surfaced by:** PR3 implementer tsc run + controller verification on main, 2026-05-14.

**Description:** 3 categories of pre-existing tsc errors were not fixed in PR #168 because they require
either new dev-dependency installs or non-trivial test restructuring.

**Deferred items:**

1. **d3 module type resolution** — `packages/hooks/src/useCanvasViewportInput.ts:2-4` (`Cannot find
module 'd3-selection' / 'd3-transition' / 'd3-zoom'`) + cascading line 72, 73, 86 errors.
   Requires adding `@types/d3-selection`, `@types/d3-zoom`, `@types/d3-transition` to
   `packages/hooks/package.json`. (Note: `@types/d3-zoom` and `@types/d3-selection` are already
   in `devDependencies`; the issue may be a missing hoisting entry for `@types/d3-transition`.)
   Pickup: add/verify the three `@types/d3-*` entries in a follow-up dep-bump PR.
   **CLOSED in PR A (post-168-tsc-hygiene), commit `e2c584ec`** — NOTE: the original hypothesis
   (missing hoisting entry) was partially wrong. The actual contribution was `@types/d3-transition`
   mis-placed in `dependencies` rather than `devDependencies` in `packages/hooks/package.json`
   (introduced by commit `07add8a4`). Moving it to `devDependencies` resolved all 3 d3 type errors.
   Empirical `--prod`-install reproduction was NOT run; fix accepted on semantic grounds (type
   packages belong in `devDependencies`, never `dependencies`). `@types/d3-zoom` and
   `@types/d3-selection` were already correctly placed and required no change.

2. **Tuple-mock typing** — `packages/hooks/src/__tests__/useHubCommentStream.test.ts:274-277`.
   `vi.fn(() => Promise.resolve(...))` infers call signature as 0-arg, so `fetchMock.mock.calls[0]`
   is typed as an empty tuple `[]`. Fix requires restructuring the fetch mock to carry explicit args
   in the factory (`vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(...)`) or using
   `as unknown as MockedFunction<typeof fetch>`. Out of scope for a trivial-cast PR.
   Pickup: next test-quality pass on `useHubCommentStream.test.ts`.
   **CLOSED in PR A (post-168-tsc-hygiene), commit `35c34d83`** — used `vi.fn<typeof fetch>(...)`
   (vitest 4.x single-type-param form), updated 3 call sites in the test file. `@variscout/hooks`
   tsc now exits 0 with no tuple-inference errors.

3. **`beforeEach` globals in `core/src/ai/__tests__/responsesApi.test.ts:862`** — ~~vitest globals
   not declared in core tsconfig~~ **CLOSED in PR #168 commit `e73fca64`** by adding `beforeEach` to
   the explicit `import { ... } from 'vitest'` on line 1 (more targeted than the `///` reference
   directive used in `setup.ts`).

4. **Entity fixture-shape mismatches in core tests (surfaced post-fix; both sub-items now closed)** — once `responsesApi.test.ts`
   was unblocked, core tsc revealed 9 more pre-existing errors:
   - `packages/core/src/__tests__/processHub.test.ts:722, 732, 1164` + `processState.test.ts:180` +
     `sustainment.test.ts:546` — `SustainmentRecord` fixtures are missing required fields added since
     they were written: `status`, `title`, `consecutiveOnTargetTicks`, `hasOverride`, `lastEvaluatedSnapshotId`
     (the entity grew during RPS V1 work without test-fixture catch-up).
     **CLOSED in PR A (post-168-tsc-hygiene), commit `7685734d`** — added all 5 missing required fields
     to fixtures across 4 test files; `recordFor` builder improved in-place; no `as` casts.
   - `packages/core/src/canvas/__tests__/stampStepCapabilities.test.ts:9, 64, 70, 91` — `ProcessMap`
     fixtures missing `version`, `tributaries`, `createdAt`, `updatedAt`; plus two `null` vs `string | undefined`
     assignment errors.
     Pickup: a focused "fixture catch-up" PR that adds the missing required fields to each fixture (preferred
     over blanket `as` casts — the casts mask real schema-vs-fixture drift). Touches 4 files in `packages/core/src/__tests__/`
     and `packages/core/src/canvas/__tests__/`.
     **CLOSED in PR A (post-168-tsc-hygiene), commit `27027162`** — extracted local `makeMap` builder;
     added all 4 missing required fields; changed `null` → omit on `ctqColumn` to match `string | undefined`
     type. `@variscout/core` tsc now exits 0.

**Not a blocking concern** — tsc runs per-package in isolation; vitest runs under bundler transforms
that supply vite globals. Runtime behaviour is unaffected.

---

### Branded Cpk type as durable replacement for forbidden-name guard

**Surfaced by:** post-#168 architecture-test refactor workstream (branch `post-168-architecture-test-refactor`), 2026-05-14. Related to T2 refactor commit `06d2638a`.

**Description:** The architecture test at
`packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts` (enforcing
ADR-073, "no cross-investigation Cp/Cpk aggregation") is a tripwire: a denylist substring grep for
16 forbidden function names (`aggregateCpk`, `aggregateCapability`, `rollupCpk`, etc.). It catches
the obvious case where a contributor reaches for `aggregateCpk`, but it has real limits:

- A creative renaming (`unifiedQualityIndex()`, `combinedProcessMetric()`) passes cleanly — the rule
  degrades to a naming convention, not an architectural boundary.
- It is a substring grep, not AST analysis; semantics are invisible to it.
- Scope is narrow: the vitest guard scans only `@variscout/core`. Cross-investigation aggregation
  introduced in `packages/charts`, `packages/ui`, or apps is not caught.
- The denylist can never be complete; reality has more names than any human (or language model) will
  enumerate at design time.

The same architectural rule could be enforced TYPE-LEVEL by making `Cpk` an opaque branded type —
analogous to `ProcessHubId` in `packages/core/src/processHub.ts` (introduced in PR #168). That type
is defined as `type ProcessHubId = string & { readonly __brand: 'ProcessHubId' }` with a single
typed constructor `asProcessHubId()` that throws on empty input. With the same pattern applied to
`Cpk`, multi-spec arithmetic becomes a compile error, not a runtime denylist match.

**Possible directions:**

- **Branded `Cpk` type in `@variscout/core`.** Define `Cpk` as an opaque type (`type Cpk = number &
{ readonly __brand: 'Cpk' }`) whose only constructor takes a single-`SpecRule` context — i.e., one
  spec, one investigation, one step. Forbid helpers that return `Cpk[]` from mixed-investigation
  inputs; allow only `Map<ProcessHubId, Cpk>` or `Map<StepKey, Cpk>` where the map keys preserve
  the locality dimension and prevent arithmetic across keys. Apply the same pattern to `Cp`, `Pp`,
  and `Ppk` if they share the ADR-073 constraint.

- **Migrate consumers.** All ~30+ call sites that read or produce `Cpk` values become typed. The
  display layer already goes through `formatStatistic()` (in `@variscout/core/i18n`) — that boundary
  is already clean. The engine layer is the migration target: replace bare `number` returns with
  typed-constructor calls.

- **Delete the architecture-grep test** once the type-level enforcement is in place. The substring
  guard becomes redundant when the type system prevents the violation. Update ADR-073 with an
  amendment note: "enforced by branded `Cpk` type; the historical forbidden-name guard at
  `architecture.noCrossInvestigationAggregation.test.ts` is removed."

**Why it matters:** LLM-assisted development is especially good at "obvious" naming — and especially
good at picking novel-but-semantically-equivalent names when the obvious ones are blocked. A denylist
that a language model can route around in one creative step is a thin safety layer. Type-level
enforcement removes the routing option entirely.

**Estimated scope:** Real engineering effort, not hygiene. Probably 4–8 tasks across:
`@variscout/core` (type definition + typed constructor + engine-layer consumer migration),
`@variscout/ui` + apps (display-layer migration via the existing `formatStatistic` pathway),
and tests (fixture + assertion updates). Not a single-PR cleanup.

**Promotion path:** When the engineering budget appears — likely as part of a broader stats-engine
type-cleanup pass — this becomes an ADR-073 amendment + a small design spec + a multi-PR migration.
Until then: stays as a logged investigation. The current tripwire remains the enforcement mechanism.

---

### Stats-bar "Set specs →" link reads project-wide specs only

**Surfaced by:** FRAME b0 spec wiring fixes, 2026-05-03 (branch `feature/full-vision-frame-b0`).

**Description:** The Analysis tab's stats-bar shows a "Set specs →" link even after the user has saved per-column specs via FRAME b0's `+ add spec` editor. Same root cause as the I-Chart bug fixed in this batch: the link reads `useProjectStore(s => s.specs)` (project-wide) rather than `measureSpecs[outcome]` (per-column).

**Possible directions:**

- Mirror the I-Chart fix locally: derive an effective spec object from `measureSpecs[outcome] ?? specs` at the consumer.
- Sweep all consumers of `s.specs` and apply the same fallback uniformly.
- Address the root cause via the parallel-stores investigation below.

**Promotion path:** trivial fix (one consumer) → ship in a follow-up PR. Wide sweep → audit task in `decision-log.md` Open Questions.

---

### Cpk badge in standard (Measurements) I-Chart mode

**Surfaced by:** FRAME b0 walkthrough, 2026-05-03.

**Description:** Once a spec is saved, the I-Chart in Measurements mode draws USL/LSL/target lines but shows no Cpk readout. Cpk is only surfaced when the user flips to "Cpk stability" / capability mode. Natural user expectation after spec save: a Cpk number visible somewhere alongside the trend chart.

**Possible directions:**

- Cpk badge in the stats-bar next to `x̄ | σ | n | Set specs →`.
- Cpk readout on the I-Chart's right-edge labels (alongside USL / Mean / LSL).
- Per-mode placement: Performance mode already has a `ProcessHealthBar` chip — generalize for the standard I-Chart.

**Promotion path:** UX decision → design slice → ADR if it changes Cpk presentation policy across modes; otherwise spec + implementation.

---

### Parallel spec sources of truth: `specs` vs `measureSpecs[outcome]`

**Surfaced by:** FRAME b0 spec wiring fixes, 2026-05-03.

**Description:** `projectStore` exposes two distinct spec fields: `specs: SpecLimits` (legacy project-wide single spec) and `measureSpecs: Record<string, SpecLimits>` (per-column, the newer Phase B model per `packages/ui/CLAUDE.md`). Writers branch on whether an outcome is set: with outcome → `setMeasureSpec(outcome, ...)`; without → `setSpecs(...)`. Readers are inconsistent: `resolveCpkTarget` already prefers per-column, but several other consumers read `specs` directly (the I-Chart wrapper was one — fixed locally; the stats-bar link, see above, is another). The asymmetry guarantees drift between "spec is set" indicators and the chart actually drawing the spec lines.

**Possible directions:**

- **Status quo + sweep:** keep both fields, sweep all consumers to use the per-column-first fallback. Cheapest now, leaves the smell.
- **Make `specs` derived:** treat `specs` as a computed view (`specs = outcome ? (measureSpecs[outcome] ?? {}) : projectWideFallback`). Eliminates the asymmetry without removing the field; readers don't change.
- **Unify on `measureSpecs`:** retire `specs`, route all reads / writes through `measureSpecs[outcome]`. Cleanest, biggest blast radius (legacy consumers, persistence shape, possibly Azure app).
- **ADR:** if the issue keeps biting, write an ADR that picks one of the above and locks it.

**Promotion path:** ADR-worthy if it bites again. Could also be folded into a Phase B follow-up spec, since per-characteristic specs (`SpecEditor`, `setMeasureSpec`) are the documented intent.

---

### P2.5 deferral: per-step mini-Pareto chips on LayeredProcessView step cards

**Surfaced by:** slice 4 task P2.5, 2026-05-04 (branch `framing-layer-v1-slice-4`).

**Description:** Slice 4 ships `useStepDefectPareto` (data hook) and `StepDefectIndicator` (visual primitive) but defers visual mounting onto `ProcessMapBase` nodes / tributary chips. The Operations band currently shows `ProductionLineGlanceDashboard` (a 2×2 grid with a `StepErrorPareto` slot) — feeding `useStepDefectPareto` output into `errorSteps` is the simplest mounting path and can be done without node-rendering surgery. Per-node-card chip mounting requires `ProcessMapBase` to expose an injectable slot per node, which is out of slice 4 budget. Spec acceptance §9.2 "per-step mini-Pareto" is considered partially met by the data + primitive availability.

**Possible directions:**

- **Operations-band slot wiring (low cost):** pass `useStepDefectPareto(perStep).data` as the `errorSteps` prop on the existing `StepErrorPareto` chart inside `ProductionLineGlanceDashboard`. No node-card surgery needed.
- **Per-node chip (higher cost):** extend `ProcessMapBase` to accept a `nodeDecorator?: (stepKey: string) => ReactNode` slot; mount `StepDefectIndicator` from there. Gives inline-per-step chips as originally envisioned.
- **Hybrid:** wire the Operations-band slot first (quick win), then layer the per-node chip in a dedicated follow-up task.

**Promotion path:** Operations-band slot wiring → carry into a P3.x or standalone follow-up task. Per-node chip → design task + ADR-check on ProcessMapBase extension if the slot pattern is reused for other decorators.

---

### Canvas-filter app-level integration + E2E (slice 4 P3.6 / P4.2 / P4.3 follow-up)

**Surfaced by:** slice 4 tasks P3.6, P4.2, P4.3, 2026-05-04 (branch `framing-layer-v1-slice-4`).

**Description:** Slice 4 shipped the canvas-filter primitives end-to-end at the package level: `ScopeFilter` type on `ProcessHubInvestigationMetadata`, `useCanvasFilters` hook (`@variscout/hooks`), `CanvasFilterChips` component, `LayeredProcessView.canvasFilterChips` slot, Pareto bar-click `onScopeFilterClick` propagation through `ParetoChartWrapperBase`, `ParetoMakeScopeButton` component, and the `onMakeInvestigationScope` prop. App-level integration is partial:

- **PWA + Azure FrameView mount (P3.6):** uses session-local `useState<ProcessHubInvestigationMetadata>` rather than a real `ProcessHubInvestigation` because FrameView is the canonical-map authoring surface and has no investigation entity in scope. Chips render correctly when state is set programmatically (verified in tests) but state does not roundtrip through any real persistence path. Reload clears.
- **Pareto bar-click → scopeFilter writers:** the `onScopeFilterClick` prop on `ParetoChartWrapperBase` is wired (P3.5) but no production consumer in the Operations band passes a writer. The `ProductionLineGlanceDashboard`'s `StepErrorPareto` is mounted directly (not via `ParetoChartWrapper`), so bar clicks there don't currently route through the wrapper. PerformancePareto's migration via P1.4 left the picker but didn't surface a make-scope wiring there either.
- **`ParetoMakeScopeButton` → `StageFiveModal` opener (P4.2):** the wrapper-level wiring exists (`onMakeInvestigationScope` prop), but no app currently passes a callback that opens StageFiveModal with the brief. Investigation creation requires app-state plumbing (modal `open` state + investigation-store writer).
- **E2E coverage (P4.3):** deferred. With production writers absent, an E2E test would primarily exercise the test-only programmatic-state path. Postpone E2E until the writers above are wired.

**Possible directions:**

- **Investigation-bound mount:** identify where the active `ProcessHubInvestigation` entity is reachable in PWA / Azure (probably the Dashboard or PI Panel after Mode B confirms — not FrameView), and move the `useCanvasFilters` mount there. Wire `onChange` to whatever existing `persistInvestigationMetadata` flow already supports `timelineWindow` updates.
- **Operations-band Pareto bar-click writer:** route `StepErrorPareto`'s bar-click in `ProductionLineGlanceDashboard` through a thin adapter that calls `setScopeFilter` from `useCanvasFilters`. Either pass the setter as a prop or use a small store.
- **StageFiveModal opener:** add a small app-level state slice (e.g., `useState<AnalysisBrief | null>` for "brief pending Stage 5") that the `onMakeInvestigationScope` prop writes to; the modal opens when non-null.
- **E2E spec:** once any one writer above is wired, add a Playwright spec covering: paste defect data → click Pareto bar → assert blue scope chip appears → click "Make this the investigation scope" → assert StageFiveModal opens with pre-filled `issueStatement`.

**Promotion path:** when the writers land (likely as a single focused follow-up PR titled "wire canvas-filter writers in PWA + Azure" or similar), close this entry, ship the E2E in the same PR, and update the framing-layer spec verification §16 with the green checkboxes.

---

### Sustainment workflow V1

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** PR8-8a ships a Sustainment stub destination only. The CTA's prerequisite signal (`hasIntervention`) is hardcoded `false` in FrameView until the data model lands. The full surface — continuous monitoring of a confirmed process change to verify the gain holds — is deferred.

**Possible directions:**

- "Intervention exists" signal: needs concrete definition. Likely tied to a future `Intervention` entity OR derived from existing `ImprovementIdea` + `ActionItem` data with status `implemented`.
- Monitoring infrastructure: schedule, alerts, control charts post-change; review-marked / auto-verified states.
- Free-tier vs paid-tier split: free can record sustainment manually; paid gets continuous monitoring + alerts.

**Promotion path:** Standalone slice when prioritized. Sequence after Charter authoring (charter formalizes the change being monitored).

---

### Canvas hypothesis-arrows visually obscured under Wall overlay when both active

**Surfaced by:** PR #141 (sub-PR 8e) final code review, 2026-05-08.

**Description:** Spec 4 ext §6 z-stack puts the Wall overlay (`z-[15]`) above per-step badge overlays (`z-10`). When a user activates both the `'hypotheses'` overlay and the `'wall'` overlay simultaneously, the persistent `<HypothesisArrowsLayer>` connector arrows render below the Wall SVG and are visually hidden. Behavior is correct per spec — the Wall is a richer view of the same causal data — but the side effect is undocumented in the spec and may surprise users who expect both overlays' visuals to compose.

**Possible directions:**

- Status quo: accept that Wall-on supersedes per-step arrows; rely on Wall's own arrow rendering for causal context. Document in the spec.
- Auto-toggle: when `'wall'` activates, suppress the `'hypotheses'` toggle in `CanvasOverlayPicker` (mutual exclusion in the picker) since Wall already encodes that data.
- Z-axis re-stack: hoist the per-step arrow layer above the Wall (`z-20`+) so arrows draw on top — but Wall pointer-events would still gate clicks, and the resulting visual is busy.

**Promotion path:** Spec 4 retroactive consolidation (Tier 3 followup) is the natural home for documenting the z-stack semantics. Promote to a decision-log Open Question only if user research surfaces confusion about the dual-overlay state.

**Resolution [2026-05-08]:** Status-quo + doc per the listed promotion path. Spec 4 ext (`2026-05-08-canvas-wall-overlay-design.md`) §6 now carries a §6.1 "Rendering z-stack" subsection documenting that Wall (`z-[15]`) supersedes per-step arrows (`z-10`) by design — the Wall is a richer projection of the same causal data. No code change; auto-mutual-exclusion in `CanvasOverlayPicker` was rejected (would imply the dual-active state is illegal — it isn't, just superseded). Promote to a decision-log Open Question only if user research surfaces confusion about the dual-overlay state.

---

### Canvas levels-as-pan/zoom architecture deferred without note (vision §5.4)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06.

**Description:** Vision §5.4 says levels (System / Process Flow / Local Mechanism) are _"expressed as a canvas pan/zoom, not a separate picker"_ — orthogonal to mode lenses. Codex shipped the lens picker correctly as a discrete control but **levels-as-pan/zoom is entirely deferred** — there is no canvas viewport at all (flat vertical scroll). This is a fundamental canvas architecture gap, not a feature gap.

**Possible directions:**

- Pan/zoom viewport: introduce a `react-flow`-style or hand-rolled SVG/CSS-transform viewport. Levels computed from zoom level.
- Discrete level picker (spec deviation): if pan/zoom too costly, ship a discrete picker; document the deviation in a retroactive ADR.
- Defer to V2: acknowledge the V1 canvas is single-level (Process Flow); revisit when use cases surface (e.g., 50+ nodes makes flat layout unscannable).

**Promotion path:** PR8f of the canvas migration sequence — but **large**; canvas viewport architecture is a multi-week effort and may warrant its own design spec rather than a sub-PR. Recommendation: defer to V2 with an explicit decision-log entry; revisit when triggered.

---

### `'general-unassigned'` sentinel as investigationId placeholder in test fixtures

**Surfaced by:** P1.4 review fixes, 2026-05-06 (branch `data-flow-foundation-f1-f2`).

**Description:** Several test fixtures inside `packages/stores/` and `packages/hooks/` that create `Question`, `Finding`, or `SuspectedCause` objects use `investigationId: 'inv-test-001'` (correct, deterministic) or similar per-test sentinels. However, the codebase also includes patterns where no investigation context is available at construction time — for example, `createQuestion` callers in pre-P1.4 code sometimes passed no `investigationId` at all (now a required arg). A related smell is that some places in production code (not tests) construct entities with a placeholder string like `'general-unassigned'` to satisfy the type when no real investigation FK is in scope. This deferred FK is an architectural liability: it bypasses cascade safety guarantees (a tombstoned investigation should stop queries against its entities, but entities with a placeholder FK are orphaned from that safety net).

**Possible directions:**

- Audit all production call sites of `createQuestion`, `createFinding`, and `createSuspectedCause` for non-real `investigationId` values (empty string, `'general-unassigned'`, `'unknown'`, etc.).
- Where a real investigationId is not in scope at construction time, either defer construction until it is (pass investigationId as a runtime param) or use a branded nominal type (`InvestigationId`) that prevents silent placeholder injection.
- Document any legitimately un-scoped entities (e.g., global template questions) as a typed variant rather than a placeholder string.

**Promotion path:** Low priority while investigations are single-tenant and not aggregated cross-investigation. Becomes a safety gap if multi-investigation queries or cascade deletes are added (see ADR-073 boundary policy). Log in `decision-log.md` as a named-future item when cascade-delete scope is tackled.

---

### Per-app feature-store overlap with `usePreferencesStore`

**Surfaced by:** F4 spec D7, 2026-05-07 (branch `worktree-f4-three-layer-state`).

**Description:** `apps/azure/src/features/panelsStore.ts` and `apps/pwa/src/features/panelsStore.ts` semantically duplicate `usePreferencesStore` on workspace tab selection + panel open/close toggles. F4 now owns those fields in `usePreferencesStore` (persisted, `'variscout-preferences'` key), but the per-app feature stores keep their own copies of analogous per-workspace toggle state. A decision is needed: either the per-app feature stores re-export their relevant slices from `usePreferencesStore`, or they remain independent (accepting duplication). Keeping them independent risks a user-visible inconsistency — reloading the app could restore `usePreferencesStore` fields but not the feature-store toggles if the two sets diverge.

**Possible directions:**

- **Unify:** move per-app feature-store panel state into `usePreferencesStore` as named sub-slices. Clean boundary; single persistence key.
- **Re-export shim:** feature stores expose getters that delegate to `usePreferencesStore`. Avoids consumer API change.
- **Status quo + audit:** accept duplication for now; document the divergence risk; revisit when a concrete user-reported inconsistency emerges.

**Promotion path:** revisit when feature-store unification becomes a priority (likely during the Canvas/Hub surface build-out, where panel state proliferates). Out of F4 scope.

---

### `wallLayoutStore.selection` Set/JSON Dexie round-trip

**Surfaced by:** F4 audit, 2026-05-07 (branch `worktree-f4-three-layer-state`).

**Description:** `wallLayoutStore.selection` is typed as `Set<NodeId>`. The store uses idb-keyval for persistence. JavaScript `Set` objects do not survive `JSON.stringify` / `JSON.parse` round-trips cleanly — `JSON.stringify(new Set([1,2]))` returns `'{}'`, meaning the persisted value will always be an empty object on reload. The `wallLayoutStore` `partialize` block should either convert to `string[]` before persist and back to `Set` on rehydration, or the `selection` field should be excluded from persistence entirely (treating selection as transient View state per F4's layer rule). F4 does not touch `wallLayoutStore` selection logic (wallLayoutStore is `STORE_LAYER = 'view'` per F4 — selection is correctly in the view layer) but the Dexie round-trip hazard remains if anything else tries to persist the store.

**Possible directions:**

- **Convert at partialize boundary:** `partialize: (s) => ({ ...s, selection: [...s.selection] })` and rehydrate with `new Set(raw.selection)` using a custom `merge` or `onRehydrateStorage` callback. Standard Zustand/idb-keyval pattern.
- **Exclude from persist:** confirm `selection` is pure View state (already labeled so by F4) and remove it from any persist `include` list.
- **Type change:** switch `selection: string[]` everywhere; simpler, loses Set lookup semantics.

**Promotion path:** low urgency (wallLayoutStore `STORE_LAYER = 'view'` per F4, so no persist middleware is expected). Becomes blocking if a future slice adds persist middleware to wallLayoutStore or reads selection from a persisted snapshot. Check before adding any persist to wallLayoutStore.

**Resolution [2026-05-08]:** Audit confirmed — `selection` was never in `WallLayoutSnapshot`; `persistWallLayout` and `rehydrateWallLayout` skip it intentionally. Locked with a regression test in `packages/stores/src/__tests__/wallLayoutStore.test.ts` (`selection persistence boundary` describe) and a clarifying docstring on `WallLayoutSnapshot` in `packages/stores/src/wallLayoutStore.ts` documenting the boundary + the Set→string[] conversion pattern any future author should use if persistent multi-select recall ever becomes a spec requirement. Note the original entry's "STORE_LAYER = 'view'" claim is slightly off — `wallLayoutStore` is `STORE_LAYER = 'annotation-per-project'` per F4; selection is the per-session view-state field within that store, and the persist boundary excludes it correctly.

---

### Producer-side stamping of EvidenceSnapshot.stepCapabilities

**Surfaced by:** Canvas PR8-8b plan, 2026-05-07 — partial-integration policy.

**Description:** PR8-8b shipped the consumer surface for canvas drift (engine + hook + UI + app read path). The producer side — stamping `EvidenceSnapshot.stepCapabilities` at snapshot-create time so prior values are available for drift comparison — is deferred. Today snapshots can still land with `stepCapabilities === undefined`, so `priorStepStats` can be an empty Map and the drift indicator stays inert.

**Possible directions:**

- Identify the right call site: snapshot creation lives in `apps/pwa/src/hooks/usePasteImportFlow.ts` and the Azure equivalent, but the canvas process map + `measureSpecs` are not necessarily complete at paste time.
- Add a pure helper: `stampStepCapabilities({ map, rows, measureSpecs }) -> StepCapabilityStamp[]` in `@variscout/core/canvas`.
- Trigger a domain action after canvas authoring reaches a complete map for a snapshot, e.g. `EVIDENCE_STAMP_STEP_CAPABILITIES`.

**Promotion path:** small follow-up PR after PR8-8b merges. About 3 tasks.

**Resolution [2026-05-08]:** `stampStepCapabilities({ map, rows, measureSpecs })` helper added in `@variscout/core/canvas`; called inside the existing `EVIDENCE_ADD_SNAPSHOT` snapshot-construction sites in `apps/pwa/src/hooks/usePasteImportFlow.ts` and `apps/azure/src/features/data-flow/useEditorDataFlow.ts` so each new snapshot ships with `stepCapabilities` populated. No new action kind, no handler change. Empty maps at paste-time emit `[]` per the partial-integration policy in `docs/superpowers/plans/2026-05-08-canvas-polish-v1.md` — the drift indicator self-heals on the snapshot-after-canvas-authoring without further producer changes. Stamping uses the same rows variable that feeds `_proceedWithParsedData` (mirrors the existing `rowCount` source-of-truth per site).

---

### CanvasStepMiniChart histogram still uses first-12-raw-values pseudo-binning (vision §5.2)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06; carried forward to PR8-8b.

**Description:** The histogram branch in `CanvasStepMiniChart.tsx` plots the first 12 raw values normalized to the local min/max, not a true histogram. PR8-8b intentionally left this as-is to keep the slice scoped to drift + time-series.

**Possible directions:**

- Sturges' rule: `bins = ceil(log2(n) + 1)`. Cheap and well-known.
- Scott's rule: `binWidth = 3.49 * sigma * n^(-1/3)`. More statistically grounded.
- Add a small helper in `@variscout/core/stats`, e.g. `computeHistogramBins(values, rule)`, returning `{ x0, x1, count }[]`; bind `CanvasStepMiniChart` to bin counts.

**Promotion path:** small follow-up PR. About 2 tasks: helper + UI swap.

**Resolution [2026-05-08]:** `computeHistogramBins(values, rule?)` helper added in `@variscout/core/stats` (Sturges default, Scott option). `CanvasStepMiniChart` histogram branch now renders one bar per bin with bin counts as heights, replacing the first-12-raw-values normalization. Empty bins floor at 8% height so the bin axis stays legible — this replaces the prior 15% floor (which was tuned for 12 raw-value pseudo-bars; 8% reads more honestly when bin counts can legitimately be zero).
