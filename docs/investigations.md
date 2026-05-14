---
title: VariScout — Things to Investigate
audience: [engineer, designer, analyst]
category: living-index
status: living
last-reviewed: 2026-05-03
---

# VariScout — Things to Investigate

Code-level smells, UX follow-ups, and architectural questions surfaced during work that are **not yet decisions**. Lighter than `decision-log.md` (Open Questions are decisions waiting to happen); heavier than a TODO comment (these deserve to outlive a single PR).

**When to add an entry:** while shipping fix A you notice problem B that's adjacent / related / surfaced by the same change. B isn't blocking A and you don't want to inflate scope, but it's worth not losing.

**When to remove an entry:**

- It became a decision → move to `decision-log.md` (Open Questions or Replayed Decisions).
- It became a spec → link to `docs/superpowers/specs/...` and remove.
- It became an ADR → link and remove.
- It was fixed → remove (the diff is the record).
- It was tried and rejected → move to `decision-log.md` Replayed Decisions with rationale.

**Each entry:** short title; one-paragraph description; surfaced-by (date / PR / session); possible directions; promotion path.

---

## Active investigations

### 8f canvas viewport — followup findings from 3-agent retrospective

**Surfaced by:** retrospective architecture / design / code-quality review on `main` 2026-05-13, after 8f's 6 PRs (#160–#165) shipped. Per-PR Opus reviews had passed; cross-PR drift was the gap.

**Description:** 20 findings total — 5 HIGH that qualify the "shipped" claim, 8 MEDIUM spec-vs-shipped drift, 7 LOW cleanups. Followup workstream plan at [`docs/superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md`](superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md). Decision-log "8f canvas viewport SHIPPED" entry has been amended to reference these gaps. Roadmap continues to mark 8f shipped; the followups are a separate cleanup sequence.

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

### [RESOLVED 2026-05-14] React `setState-in-render` warning fires from `AppMain` across canvas transitions

**Surfaced by:** `--chrome` walk of PR #166 (canvas-viewport-8f-followups) on 2026-05-14.

**Description:** Console error repeats on every Frame-tab activation, LOD transition (L1↔L2↔L3 via wheel-zoom), and `Lock canvas` mode toggle: `Cannot update a component (AppMain) while rendering a different component (AppMain). To locate the bad setState() call inside AppMain, follow the stack trace as described in https://react.dev/link/setstate-in-render`. Fires multiple times per interaction (8+ instances captured during a 9-minute walk). `apps/pwa/src/App.tsx` is NOT touched on the `canvas-viewport-8f-followups` branch (`git log origin/main..HEAD -- apps/pwa/src/App.tsx` empty), so this is pre-existing — likely predates 8f or was introduced by `feat(8f): PR1 Foundation` (commit `57c48a26`). `AppMain` has 70+ Zustand selectors and several derived-data hooks (`useFilteredData`, `useStatsWorker`, `useAnalysisStats`, `useDefectTransform`, `useDefectSummary`); one of them is calling `setState` during render of another.

**Suspected mechanism:** A derived-data hook (likely `useStatsWorker` or `useAnalysisStats`) computes a result during render and writes it back to a store, triggering a re-render mid-render. Or a `useCanvasViewportStore` selector returns a new reference each render. Strict-mode escalates the warning to an error in dev.

**Why it matters:** noisy console drowns out real errors; possible silent state desync; potential infinite-loop risk if a future change adds another store-driven derivation. Not user-visible today but a real React-correctness violation.

**Possible directions:** Open in React DevTools profiler during a canvas transition; identify which component logs the violation; replace render-time setState with a `useEffect`, or memoize the selector return reference.

**Resolution (2026-05-14, PR cleanup/setstate-appmain, commit `6c5bc1a7`):** Static analysis of all five named suspects (`useFilteredData`, `useStatsWorker`, `useAnalysisStats`, `useDefectTransform`, `useDefectSummary`) confirmed they are clean (pure `useMemo` or `useEffect`-gated). The actual violation was a bare `const store = usePanelsStore()` whole-store subscription in `apps/pwa/src/hooks/useAppPanels.ts` — directly violating the `packages/stores/CLAUDE.md:18` rule "Never bare `useStore()`" (cites ADR-041). In React 19 Strict Mode + Zustand 5 (`useSyncExternalStore`), a whole-store subscription causes tearing detection to re-invoke the snapshot function, which in turn re-processes the store reference, triggering the warning on every `panelsStore` update (including panel-state transitions co-incident with LOD switches and frame-tab activation). Fix: rewrote `useAppPanels.ts` to use 24 individual `usePanelsStore(s => s.field)` selectors — one per state field and action. `useEffect` dependency arrays cleaned accordingly. Regression test added in `apps/pwa/src/__tests__/App.test.tsx`.

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

### Canvas mini-chart: time-series for high-cardinality columns missing (vision §5.2) [RESOLVED 2026-05-07]

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (commits `2c010f29` / `36727ad0` / `2820afb1`).

**Description:** Vision §5.2 commits to **three mini-chart types per step card**: histogram for measurements, distribution for categoricals, and **time-series for high-cardinality columns**. `CanvasStepMiniChart` (`packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx`) implements only two — the time-series branch is absent. For process data ordered by run number / batch, the mini-time-series is methodologically meaningful (trend vs distributional shape).

**Possible directions:**

- Add a time-series branch with a cardinality threshold (e.g. `column.type === 'numeric' && distinct > 30`).
- Use the column-detection time column (per `parser/detection.ts`) when present; fall back to row-index ordering. Document the fallback explicitly.
- Algorithm: sparkline / mini-line; LTTB downsampling for >100 points (existing `@variscout/charts` convention).
- Bonus: replace the current "first-12-raw-values" pseudo-histogram with proper Sturges/Scott binning.

**Promotion path:** PR8b of the canvas migration sequence (Vision Alignment phase). Bundles into a small `CanvasStepMiniChart` extension PR.

**Resolution:** PR8-8b — `useCanvasStepCards` adds `numericRenderHint` (`'histogram' | 'time-series'`) based on `NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD = 30`. New sparkline branch in `CanvasStepMiniChart`; LTTB-downsampled to at most 100 points via existing `@variscout/core/stats#lttb`; ordered by parser-detected `timeColumn` only when all metric rows parse, otherwise row-index fallback. Sturges/Scott histogram improvement deferred to its own follow-up entry below.

---

### Canvas drift indicator missing (vision §5.2) [RESOLVED 2026-05-07]

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06.

**Description:** Vision §5.2 commits each step card to display a **drift indicator** — recent vs prior, when snapshot history exists. `CanvasStepCardModel` (`packages/hooks/src/useCanvasStepCards.ts`) has no `drift` or `priorStats` field, and the card UI has no drift rendering. Drift is methodologically core (Watson's "did this process change?"); shipping cards without it leaves the cadence-read flow incomplete.

**Possible directions:**

- Data model extension: `drift?: { direction: 'up' | 'down' | 'flat'; magnitude: number; threshold: number }` on `CanvasStepCardModel`.
- Snapshot reference: read prior `EvidenceSnapshot` per-step capability (slice 3 shipped per-row provenance + snapshot stamping).
- UI: small ↑ / ↓ / → arrow + magnitude % near the capability badge; arrow shape avoids H6 color-only signaling.
- Threshold: ±5% default (rule TBD); user-configurable later.

**Promotion path:** PR8b of the canvas migration sequence. Requires `EvidenceSnapshot` history reader (mostly shipped); UI + model extension lands in one ~6-task PR.

**Resolution:** PR8-8b — `computeStepDrift` engine in `@variscout/core/canvas`, direction-of-improvement-aware (Cpk first, then mean per `MeasureSpec.characteristicType`), default 5% threshold. `CanvasStepCardModel.drift?` populates when a `priorStepStats` Map is supplied. PWA + Azure FrameView read `evidenceSnapshots.listByHub`, pick the most-recent live snapshot's `stepCapabilities`, and pass through. Producer-side stamping of `EvidenceSnapshot.stepCapabilities` at snapshot-create time is deferred to a separate slice; until that lands, the indicator stays inert.

---

### Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4) [RESOLVED 2026-05-07]

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (`packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx:276-294`).

**Description:** Vision §5.3 and §2.4 prescribe **five mode-aware response-path CTAs**: Quick action / Focused investigation / Charter / Sustainment / Handoff. Cadence-mode (mature Hub) shows all five active; first-time/no-Hub mode (PWA free tier) shows Quick action + Focused investigation active and dims the rest with a tier-upgrade hint. Codex hardcoded Charter / Sustainment / Handoff as **permanently `disabled`** — wrong UX signal: users see "permanently broken" instead of "tier-gated, here's why."

**Possible directions:**

- Hub-maturity signal: thread `mode: 'cadence' | 'first-time' | 'demo'` through `CanvasWorkspace` → `Canvas` → `CanvasStepOverlay`. Compute from `assignmentsComplete && stepsAuthored && hasPriorSnapshot`.
- Tier gate: check `isPaidTier()` per ADR-078 D5 for Charter / Sustainment / Handoff. Render with a tier-upgrade hint instead of `disabled` when free tier.
- First-time-Hub copy: dimmed CTAs with tooltip "Available once your Hub has cadence" (or similar).
- Mode boundary: separate "mode" (drill-down content) from "tier" (paid feature gating); they are conflated in the current code.

**Promotion path:** PR8a of the canvas migration sequence. ~5 tasks: thread mode signal, compute hub-maturity, replace `disabled` with tier-aware affordances + copy.

**Resolution:** PR8-8a — `computeCtaState` helper + 2-state CTA rendering (`active` / `prerequisite-locked`). All five paths free-tier-active per Q2 (tier reframe). Charter has no workflow prerequisite per DMAIC Define-phase research. Stub destinations ship for Charter / Sustainment / Handoff; full surfaces deferred to per-path slices listed below.

---

### Charter authoring V1 → Improvement Project V1 [PROMOTED 2026-05-08]

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** PR8-8a ships a Charter stub destination only. The full surface — hub-level entity (multiple per Hub per Q1), problem statement / goals / scope / team / timeline form, `.vrs` round-trip — is deferred. Free-tier-active per Q2 (PWA can author + export `.vrs`); team signoff features paid-only inside the surface.

**Resolution (2026-05-08, SUPERSEDED 2026-05-09):** Initial design spec [`docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md`](superpowers/specs/2026-05-08-improvement-project-v1-design.md) + plan [`docs/superpowers/plans/2026-05-08-improvement-project-v1.md`](superpowers/plans/2026-05-08-improvement-project-v1.md) — both **SUPERSEDED 2026-05-09** by the unified Response Path System V1 design ([`docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md`](superpowers/specs/2026-05-09-response-path-system-v1-design.md)) + plan ([`docs/superpowers/plans/2026-05-09-response-path-system-v1.md`](superpowers/plans/2026-05-09-response-path-system-v1.md), 54 tasks across 10 PRs). The superseding spec covers all 5 response paths (Quick Action / Focused Investigation / Improvement Project / Sustainment / Handoff) as a unified system + naming reconciliation (SuspectedCause → Hypothesis) + Wall package re-home + Wall vision Detective-pack + Survey UI dual-surface + Quick Action surface; ~8–10 PRs across ~6–8 weeks off branch `response-path-system-v1`. Brainstorm resulted in two key reframings beyond the original Q1/Q2 scope:

- **Methodology pivot — DMAIC dropped for QC Story / Toyota TBP.** VariScout's existing investigation spine (Issue Statement, SuspectedCause, Findings, ImprovementIdea, Sustainment) maps 1:1 to QC Story's 8-section narrative. The artifact reuses VariScout primitives via FK rather than duplicating in DMAIC vocabulary; methodology lineage is acknowledged in design docs but absent from UI copy.
- **Rename "Charter" → "Improvement Project."** Avoids DMAIC-coding the vocabulary, communicates living-document semantics, avoids `useProjectStore` collision while staying qualified. Vision §2.4 + §5.3 amended.
- **Audit trail dropped from V1 paid-tier scope.** Azure tenant logging (App Insights, Activity Log) handles compliance audit at platform level; V1 paid ships _only_ signoff workflow.

**Promotion path:** Implementation plan to follow per `superpowers:writing-plans` flow. Likely sequence: spec → plan → 6–8 tasks across `@variscout/core` (types + actions + .vrs serialization) + `@variscout/ui` (form + sections) + per-app shells (PWA + Azure) + persistence handlers.

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

### Handoff workflow V1

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** PR8-8a ships a Handoff stub destination only. The CTA's prerequisite signal (`sustainmentConfirmed`) is hardcoded `false` in FrameView until the data model lands. The full surface — transferring ownership of a confirmed-sustained improvement to the process owner with a control plan — is deferred.

**Possible directions:**

- "Sustainment confirmed" signal: needs concrete definition. Likely `SustainmentRecord.latestReviewId` populated AND review marked `confirmed-sustained`.
- Control plan: who owns the process post-handoff; what triggers escalation; reaction plan if metrics drift.
- Free-tier vs paid-tier split: free can document the handoff; paid gets RACI / signoff / change-notification flow.

**Promotion path:** Standalone slice when prioritized. Sequence after Sustainment workflow (handoff requires confirmed sustainment).

---

### Team-collaboration features inside Charter / Sustainment / Handoff surfaces

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** Per Q2 (tier reframe), the five response-path CTAs are tier-active in PWA + Azure. The team-collaboration tier-gate that DOES apply lives **inside** each surface: signoff buttons, audit trail, alerts setup, RACI, change notifications. PR8-8a defers wiring this layer until the surface forms ship.

**Possible directions:**

- Each surface component reads `useTier()` directly and renders team-features as paid-only controls (button-level gating, not surface-level).
- Shared pattern: a `<TeamFeatureGate feature="signoff">` wrapper component in `@variscout/ui` so the gating contract is uniform across surfaces.
- Telemetry: track tier-feature impressions to inform pricing.

**Promotion path:** Per-surface, ride along with each response-path's V1 form slice.

---

### Canvas hypothesis-arrow drawing affordance absent (vision §3.4) [RESOLVED 2026-05-08]

**Surfaced by:** Canvas PR6 retrospective design review, 2026-05-06.

**Description:** Vision §3.4 commits to user-authored hypothesis arrows: _"users may **optionally draw a hypothesis arrow** from one column (or one step) to another."_ Hypothesis arrows are first-class authoring; promoted (evidence-crossed-threshold) → node markers; draft → faint arrows. `useCanvasInvestigationOverlays` projects pre-existing `CausalLink` entities as faint dashed SVG arrows (read-side only). The user-facing **drawing gesture** does not exist anywhere on the canvas.

**Possible directions:**

- Drawing gesture: Mode 2 (structural authoring) toolbar gains a "Draw hypothesis" tool. Click source step/column → drag → release on target → opens a tiny inline form ("I suspect [X] affects [Y]" + free-text `because...`).
- Promoted vs draft visual distinction: drafts = faint dashed arrows (current); promoted = node markers ON the affected step (separate visual primitive — needs design).
- Suspected causes as node markers: Codex renders as inline badges inside step cards; spec calls for node markers. Either accept the badge pattern (document deviation) or rework.
- Storage: new draft hypotheses → `CausalLink` entities in `useInvestigationStore` (existing graph).

**Promotion path:** PR8d of the canvas migration sequence. Requires Spec 4 brainstorm extension covering the drawing-mode gesture (overlap with structural-arrow drawing — same primitive, different semantic), promoted-vs-draft visual, and column-vs-step source/target. ~8 tasks.

**Resolution:** PR8-8d ([PR #140](https://github.com/jukka-matti/variscout/pull/140)) — Canvas gains a dedicated draw-hypothesis tool, step/column endpoints, drag and keyboard authoring flows, a focused draft popover with optional question linking, causal-link store wiring in PWA/Azure shells, remove affordances on hypothesis links, and promoted suspected-cause node markers.

---

### Canvas Wall overlay is badge projection, not "same data, two views" mirror (vision §5.6) [RESOLVED 2026-05-08 — sub-PR 8e]

**Surfaced by:** Canvas PR6 retrospective design review, 2026-05-06.

**Description:** Vision §5.6 commits the Wall to be **dual-home**: _"It remains the canonical destination in the Investigation tab AND becomes one of the canvas overlays. **Same data, two views**."_ §5.4 even says: _"With overlays on, the canvas IS the Wall view."_ Codex's implementation is a lighter projection — per-step badge counts + linked item lists in the step overlay — not a mirror of the Wall's full graph. Defensible V1 (read-only cadence-scan) but unmet spec commitment.

**Possible directions:**

- Embed the Wall viewport: render `WallCanvas` (`packages/charts/src/InvestigationWall/`) inline as the canvas overlay layer. Same data, lighter chrome.
- Hybrid: keep badge-projection as cadence-scan; add an "expand to wall view" button in canvas chrome lifting the wall into a modal / right-rail.
- Status quo + spec amendment: accept badge-projection as V1 dual-home; amend §5.6 to say "destination = full graph; overlay = projected badges."

**Promotion path:** PR8e of the canvas migration sequence. Requires Spec 4 brainstorm extension to pick between embedded-wall vs badge-projection-as-canonical. ~6 tasks if embedded-wall is chosen; ~2 (just the spec amendment) if status quo.

**Resolution:** Sub-PR 8e embeds `WallCanvas` as the canvas Wall overlay with shared Wall viewport state and click-to-drill to the Investigation Wall destination; see `docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md`.

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

### Azure `rowProvenance` Dexie table — deferred [RESOLVED 2026-05-07 — see decision-log F3.6-β SHIPPED entry]

**Status:** RESOLVED via F3.6-β (PR #135). Provenance now persists on Azure as an envelope facet on `EvidenceSnapshot` (D1; no separate `rowProvenance` table — `RowProvenanceTag[]` rides the snapshot record). Cloud-sync round-trips the facet through Blob Storage; ETag optimistic concurrency on `_snapshots.json` catalog handles concurrent-paste races. F3.5 D3 asymmetry closed.

**Surfaced by:** Data-Flow Foundation F3.5 plan + P2 implementation, 2026-05-06.

**Description:** F3.5's `EVIDENCE_ADD_SNAPSHOT` handler in Azure (`apps/azure/src/persistence/applyAction.ts`) persists snapshot only; provenance tracking stays session-only via the existing `setRowProvenance` prop callback in `apps/azure/src/features/data-flow/useEditorDataFlow.ts`. Asymmetric persistence vs PWA (which atomically writes provenance inside `db.transaction('rw', [evidenceSnapshots, rowProvenance], ...)`) is accepted for the F3.5 scope per locked decision D3. Adding a `rowProvenance` table to Azure requires:

- Azure Dexie schema bump (new table declaration with `&id, snapshotId` index)
- New cascade rule consumer (mirror PWA's bulkUpdate-on-archive pattern)
- Migration of any existing session-only provenance tracking surface to dispatch through the action layer
- Updates to `apps/azure/src/persistence/applyAction.ts` for both `EVIDENCE_ADD_SNAPSHOT` (atomic write) and `EVIDENCE_ARCHIVE_SNAPSHOT` (cascade soft-delete)

**Possible directions:**

- F3.6 (Azure normalization parity): A dedicated slice immediately after F3.5 — adds the table + atomic handler + cascade rule. Estimated 6-8 tasks.
- F4 (three-layer state codification): Folded into the broader Document/Annotation/View boundary work; provenance becomes part of the Annotation layer.
- Status quo: Accept asymmetric persistence indefinitely until cross-app provenance reconciliation becomes a feature need.

**Promotion path:** Recommendation is F3.6 if cloud-tier provenance becomes a paid-tier requirement (e.g., audit trail compliance for Six Sigma sessions); otherwise defer to F4 absorption. Logged 2026-05-06.

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

---
