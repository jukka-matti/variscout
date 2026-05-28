---
tier: ephemeral
purpose: build
title: 'PR-CCJ-F1 — → Explore exit with Y soft-gate + smart routing'
audience: human
category: implementation-plan
status: active
layer: spec
date: 2026-05-28
related:
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
  - docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md
  - docs/superpowers/plans/2026-05-28-canvas-connection-journey-e-1-create-project.md
  - docs/decision-log.md
implements:
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
---

# PR-CCJ-F1 — → Explore exit with Y soft-gate + smart routing

**Goal:** Ship the `→ Explore` button in EditMode toolbar. The button is disabled until at least one OutcomeSpec exists (Y soft-gate). On click, a pure routing function derives the Explore landing view from the active IP's canvas state and fires `panelsStore.showExplore(intent)` with a `PendingExploreIntent` payload. The Explore tab consumes the intent on mount to pre-select the right chart + factor.

**Branch:** `worktree-feat+wedge-v1-ccj-f-1-explore-exit`

---

## Context

E1 (PR #228) shipped IP-blob persistence for Canvas state + the `NoActiveProjectGuidance` empty state. The Process tab now has a fully wired activeIP cascade. F1 adds the exit arrow: once the user has configured their Y (and optionally their X factors / process structure), they should be able to navigate directly to Explore with the right view pre-selected.

**Spec §4.5 amended (decision-log 2026-05-28):**

The original §4.5 had 6 routing rows. Two required Explore UI that doesn't exist yet:

- Row 5: multi-outcome Y-selector tabs (Explore has no outcome-selector strip).
- Row 6: per-step I-Chart vs stacked Boxplot switcher (no step-aware view component).

F1 ships 4 rows via existing Explore primitives. Rows 5–6 deferred to H1.

**Two design discoveries during implementation:**

1. **`onExploreExit` must be a prop on `CanvasWorkspace`** — `packages/ui` cannot import `usePanelsStore` from `apps/`. The callback-prop pattern is the correct dependency-direction fix. Azure FrameView wires it; PWA FrameView mirrors it (bare navigation in F1).

2. **`outcomeSpecs` threaded from Editor.tsx via hub** — Azure `Editor.tsx` has `activeHub.outcomes`; it now passes `(activeHub?.outcomes ?? []).filter(o => o.deletedAt === null)` as `outcomeSpecs` to `FrameView`. PWA reads it from `activeHub?.outcomes` similarly. This closes the §4.5 gate: button disabled when no spec, enabled when ≥1.

---

## Approach

6 tasks executed sequentially (all inline — no subagent dispatch for this scope):

| #   | Description                                                                                 | Key files                                                          |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | `deriveExploreLandingView()` pure function + `@variscout/core/exploreRouting` sub-path      | `packages/core/src/exploreRouting/`                                |
| 2   | `<ExploreExitButton>` component — soft-gate, subtitle preview, Enter key                    | `packages/ui/src/components/Canvas/EditMode/ExploreExitButton.tsx` |
| 3   | Wire `ExploreExitButton` into `EditModeToolbar` (stubbed handler)                           | `EditModeToolbar.tsx`, `EditModeShell.tsx`                         |
| 4   | `panelsStore.showExplore()` optional `PendingExploreIntent` payload                         | `apps/azure/src/features/panels/panelsStore.ts`                    |
| 5a  | Dashboard / EditorDashboardView consumes `pendingExploreIntent` on mount                    | `apps/azure/src/components/editor/EditorDashboardView.tsx`         |
| 5b  | (CARVED) Boxplot factor picker D3-derived categorical column support                        | → Task #46                                                         |
| 6   | Real wiring: `CanvasWorkspace.onExploreExit` prop + Azure + PWA FrameView + e2e test + docs | This sub-plan                                                      |

---

## Implementation notes

**Routing function (`deriveExploreLandingView`):**

- Pure function: same input → same output; no side effects; `@variscout/core` hard rule compliance.
- Route precedence: disabled → y-plus-process → y-only → y-plus-one-factor → y-plus-multi-factor.
- Process structure beats raw factor count (route 2 fires before route 3/4/5).
- The `previewText` is used both for the button subtitle and as a diagnostic in tests.
- `routeKey` discriminant enables exhaustive tests against each §4.5 row.

**Intent flow:**

1. `CanvasWorkspace` receives `onExploreExit?: (landing: ExploreLandingView) => void` as a prop.
2. `EditModeShell` → `EditModeToolbar` → `ExploreExitButton` passes the callback down as `onExit`.
3. `ExploreExitButton` calls `onExit(landing)` on button click (only when `landing.isEnabled`).
4. Azure `FrameView.handleExploreExit` checks `landing.isEnabled`, then calls `usePanelsStore.getState().showExplore({ focusedChart: landing.focusedChart!, boxplotFactor: landing.boxplotFactor })`.
5. `panelsStore` sets `activeView: 'explore'` + `pendingExploreIntent`.
6. `EditorDashboardView` (Explore tab mount) reads `pendingExploreIntent` in a `useEffect`, applies the intent, and calls `clearPendingExploreIntent()`.

**PWA decision — bare navigation:**
PWA's `panelsStore.showExplore` takes no intent parameter in F1. The PWA `handleExploreExit` ignores the landing and calls `usePanelsStore.getState().showExplore()`. Smart landing (with intent) is deferred to a PWA-parity task.

**State-machine note:**
`panelsStore.showExplore(intent)` returns `intent ?? null` — the single-param update keeps all 32 existing callsites working with no args. No back-compat shim needed.

---

## Verification

**Targeted test runs (all green):**

```bash
pnpm --filter @variscout/core test -- exploreRouting --run
pnpm --filter @variscout/ui test -- ExploreExitButton EditModeToolbar EditModeShell CanvasWorkspace --run
pnpm --filter @variscout/azure-app test -- panelsStore Dashboard.test f1-explore-exit-flow --run
pnpm --filter @variscout/ui build
pnpm --filter @variscout/azure-app build
```

**E2E test scope (`apps/azure/src/__tests__/f1-explore-exit-flow.test.tsx`):**

Steps 1–6 of the §10.1 acceptance criteria (intent emission verified):

1. Render `FrameView` with seeded IP (Yield outcomeSpec + Vessel factorControl).
2. CanvasWorkspace receives `onExploreExit` + `outcomeSpecs` props (wiring verified).
3. Simulate → Explore button click (mocked CanvasWorkspace; avoids visx/DnD-kit).
4. Assert `showExplore` called with `{ focusedChart: 'boxplot', boxplotFactor: 'Vessel' }`.
5. Assert `panelsStateRef.activeView === 'explore'` + `pendingExploreIntent` set.

Steps 7–8 (consume + clear intent on Explore mount) are covered by `EditorDashboardView.test.tsx` / Dashboard.test.tsx (Task 5a tests).

**Spec §10.1 acceptance row covered:**

> "§4.5 routing table: 4 of 6 rows fire correctly on button click — verified by unit + e2e tests."

---

## Out of scope / deferred

| Item                                                         | Where                   |
| ------------------------------------------------------------ | ----------------------- |
| §4.5 rows 5–6 (multi-outcome Y-tabs, per-step view switcher) | H1                      |
| Task 5b — D3-derived categorical Boxplot factor wiring       | Task #46                |
| PWA smart landing with `pendingExploreIntent`                | Future parity task      |
| `Done` button removal / State/Edit mode redesign             | Task #45 design session |
| Multi-PR structure for large Explore surface changes         | H1 sequencing           |

---

## Related

- Master plan entry: `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` §F1 (amended 2026-05-28)
- E1 sub-plan: `docs/superpowers/plans/2026-05-28-canvas-connection-journey-e-1-create-project.md`
- D3 sub-plan: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-3-time-as-factors.md`
- Decision log: `docs/decision-log.md` (2026-05-28 §4.5 amendment)
- Spec: `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` §4.5
