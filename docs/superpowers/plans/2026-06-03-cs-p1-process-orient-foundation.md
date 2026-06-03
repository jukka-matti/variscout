---
tier: ephemeral
purpose: build
title: 'PR-CS-P1 — Process-tab orient foundation (sub-plan)'
status: active
date: 2026-06-03
layer: spec
related:
  - 2026-06-02-connective-surface-model-master-plan
  - 2026-06-02-connective-surface-model-design
---

# PR-CS-P1 · Process-tab orient foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax. TDD throughout. Scope each verification run to the touched package (`pnpm --filter <pkg> test -- <file>`); do NOT run the full `pr-ready-check` inside a task (the controller runs it at the end).

**Goal:** Make the Process surface coherent — shed the cadence/Status rollup on the portfolio Dashboard's `ProcessHubView` (preserving the V1 keeps), collapse the Status/Capability two-tab into one surface, and data-presence-gate the structurally-empty Capability temporal row.

**Architecture (grounding-corrected — see spec §2A grounding-correction callout + decision-log §3):** The user-facing 7-tab "Process" tab is the editor canvas (`FrameView → CanvasWorkspace`) and _already_ ships the L1/L2/L3 orient spine (L1 `SystemLevelView` "are we capable?"). The cadence rollup / two-tab / per-step capability live in the **portfolio Dashboard's `ProcessHubView`** (`apps/azure/src/pages/Dashboard.tsx:814`) — a _different_ App view. **This PR is foundation-only:** all code edits are Dashboard-side + the shared dashboard component; per-step capability stays where it is (CS-P2 lifts it onto the editor canvas, CS-P3 makes it authorable/non-empty). Hide-not-extract: keep engines + props intact; the full surgical extraction is the §9 follow-up.

**Tech Stack:** React 18 + TypeScript, Zustand, Tailwind v4, Vitest (happy-dom), `@variscout/{core,hooks,ui,charts}` + `@variscout/azure-app`.

**The three V1-keeps that must survive the cadence shed (verified):**

- **InboxDigest** (Survey/Inbox) — top-level sibling in `ProcessHubReviewPanel`, safe.
- **ProcessHubControlRegion** (Control) — **nested inside `ProcessHubCadenceQueues:338`**, so it must be **lifted out** to survive the shed (the one place this PR brushes §9). It is driven by `selectControlBuckets(rollup…)`; its `cadence` prop is ignored.
- **ProcessHubCurrentStatePanel** (the "Current Process State" review) — kept (hide-not-extract; its named-future response-path/chip status is a §9 call).

**NOT a keep (do not be confused):** the V1-protected "click-to-Explore" is the _editor canvas_ pattern (`FrameView.onChipExploreJump`, CS-5/CS-7) — untouched by this PR. The Dashboard `ProcessHubReviewPanel.onChipClick` (→ evidence sheet) is part of the named-future current-state panel and rides along under hide-not-extract.

**Out of scope (defer):** lifting per-step capability onto the editor canvas (CS-P2); per-step spec authoring (CS-P3); deleting cadence engines (`buildProcessHubCadence`/`buildCurrentProcessState`) or the now-unused `ProcessHubView` props (§9); `onPlansChanged` (lives in the re-ingest path, structurally disjoint — do not touch).

---

## File Structure

| File                                                                                                                         | Change                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceDashboard.tsx`                                 | Data-presence gate: render the temporal row only when it has data.                                                                                                                  |
| `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceDashboard.test.tsx`                  | Give the collapse tests temporal data; add an empty-gate test.                                                                                                                      |
| `apps/azure/src/components/ProcessHubReviewPanel.tsx`                                                                        | Remove the SnapshotCard grid + `ProcessHubCadenceQuestions` + `ProcessHubCadenceQueues`; render `ProcessHubControlRegion` directly (lift). Keep header + Inbox + CurrentStatePanel. |
| `apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx`                                                               | Trim the cadence-snapshot + cadence-questions + cadence-queue assertions; keep CurrentStatePanel + Control + Inbox.                                                                 |
| `apps/azure/src/components/ProcessHubView.tsx`                                                                               | Remove the Status/Capability tablist + tab state; stack the Capability content + the Review keeps in one scroll surface. Keep all shared chrome.                                    |
| `apps/azure/src/components/__tests__/ProcessHubView.test.tsx`                                                                | Rewrite the 4 tab tests → no-tabs, both panels present.                                                                                                                             |
| `packages/ui/src/components/Canvas/index.tsx` (comment) · `packages/hooks/src/useProductionLineGlanceOpsToggle.ts` (comment) | (Controller does inline) Retire the "3-band"/"operations band" comment language.                                                                                                    |

---

## Task 1: Data-presence gate the empty Capability temporal row

**Files:**

- Modify: `packages/ui/src/components/ProductionLineGlanceDashboard/ProductionLineGlanceDashboard.tsx`
- Test: `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/ProductionLineGlanceDashboard.test.tsx`

**Why:** The temporal row (`slot-cpk-trend` IChart + `slot-cpk-gap` `CapabilityGapTrendChart`) is **structurally empty in V1** — `useProductionLineGlanceData` hardcodes `cpkTrend.data = []` / `cpkGapTrend.series = []` to honor ADR-073 (no Cp/Cpk aggregation across heterogeneous nodes). `ProcessHubCapabilityTab` passes no `mode`, so it currently renders the empty row (a blank slot). Gate it on data presence so it self-hides when empty and re-appears if a future engine ever populates it. Keep the existing `mode='spatial'` collapse for the data-present case.

- [ ] **Step 1: Write the failing test** — temporal row absent when empty

In `ProductionLineGlanceDashboard.test.tsx`, add a test (the existing `baseProps` at ~line 40 has empty/near-empty `cpkTrend`; confirm by reading it):

```tsx
it('does not render the temporal row when cpkTrend and cpkGapTrend are empty', () => {
  const { container } = render(
    <ProductionLineGlanceDashboard
      {...baseProps}
      cpkTrend={{ data: [], stats: baseProps.cpkTrend.stats, specs: baseProps.cpkTrend.specs }}
      cpkGapTrend={{ series: [], stats: baseProps.cpkGapTrend.stats }}
    />
  );
  expect(container.querySelector('[data-testid="dashboard-temporal-row"]')).toBeNull();
  // spatial row still present
  expect(container.querySelector('[data-testid="slot-capability-boxplot"]')).not.toBeNull();
});
```

- [ ] **Step 2: Run it — verify it fails**

Run: `pnpm --filter @variscout/ui test -- ProductionLineGlanceDashboard`
Expected: FAIL (the temporal row currently always renders in `mode='full'`).

- [ ] **Step 3: Implement the gate**

In `ProductionLineGlanceDashboard.tsx`, after `const isSpatial = mode === 'spatial';` add:

```tsx
// V1: the temporal row (per-snapshot line-level Cp/Cpk) is structurally empty
// (ADR-073 — no Cp/Cpk aggregation across heterogeneous nodes). Don't ship a
// blank slot: render it only when a future engine actually populates it. The
// `mode='spatial'` collapse still applies for the data-present case.
const temporalHasData = cpkTrend.data.length > 0 || cpkGapTrend.series.length > 0;
```

Wrap the existing `dashboard-temporal-row` `<div>` (the block currently at lines ~54–72) in `{temporalHasData ? ( … ) : null}`. Leave the `aria-hidden`/`max-h-0` `isSpatial` logic exactly as-is _inside_ the guard.

- [ ] **Step 4: Fix the pre-existing collapse tests**

The existing tests "shows temporal row by default" (~line 118) and "collapses temporal row to aria-hidden when mode='spatial'" (~line 123) rely on `baseProps`. If `baseProps.cpkTrend.data` is empty they will now fail (row absent). Give those two tests **non-empty** `cpkTrend.data` (e.g. `cpkTrend={{ ...baseProps.cpkTrend, data: [{ /* one valid IChart point per the type */ }] }}`) so the `aria-hidden` collapse behavior stays load-bearing. Read the `IChart` data point type to build a valid literal; do not weaken the assertions.

- [ ] **Step 5: Run the suite green**

Run: `pnpm --filter @variscout/ui test -- ProductionLineGlanceDashboard`
Expected: PASS (new empty-gate test + the two collapse tests with data + all others).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ProductionLineGlanceDashboard/
git commit -m "feat(cs-p1): data-presence gate the empty Capability temporal row"
```

---

## Task 2: Shed the cadence rollup + lift the Control region

**Files:**

- Modify: `apps/azure/src/components/ProcessHubReviewPanel.tsx`
- Test: `apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx`

**Why:** `ProcessHubReviewPanel` is the "Status" tab content and the fused node. Remove the cadence apparatus while preserving the V1 keeps. **The trap:** `ProcessHubControlRegion` is rendered _inside_ `ProcessHubCadenceQueues` (`ProcessHubCadenceQueues.tsx:338`), so removing the queues naively orphans Control — lift it out first.

**Current render order (`ProcessHubReviewPanel.tsx:206–297`):** header (211–232) → `InboxDigest` (234–236) → `ProcessHubCurrentStatePanel` (238–257) → **5-card SnapshotCard grid** (259–287) → **`ProcessHubCadenceQuestions`** (289) → **`ProcessHubCadenceQueues`** (290–296, which nests `ProcessHubControlRegion`).

- [ ] **Step 1: Make the component change**

In `ProcessHubReviewPanel.tsx`:

- **Remove** the SnapshotCard grid (the `<div className="mt-4 grid … sm:grid-cols-5">` block, lines ~259–287).
- **Remove** `<ProcessHubCadenceQuestions rollup={rollup} />` (line 289).
- **Remove** `<ProcessHubCadenceQueues … />` (lines 290–296).
- **Add** `ProcessHubControlRegion` directly where the queues were, passing the props it had inside the queues (all already in scope in this component):

```tsx
<ProcessHubControlRegion
  cadence={cadence}
  rollup={rollup}
  onOpenInvestigation={onOpenInvestigation}
  onSetupControl={onSetupControl}
  onLogReview={onLogReview}
/>
```

- Add the import: `import ProcessHubControlRegion from './ProcessHubControlRegion';`
- **Remove now-unused imports/symbols:** `SnapshotCard`, `ProcessHubCadenceQuestions`, `ProcessHubCadenceQueues` (delete their imports; if `SnapshotCard` is a local component in this file, delete its definition too). Let `tsc`/ESLint surface any other now-unused symbol and remove it — **but KEEP** `cadence` (still used by the header's `formatLatestActivity(cadence.latestActivity)` at line 221 and passed to Control) and `buildCurrentProcessState`/`currentState` (still used by `ProcessHubCurrentStatePanel`).
- **Keep** the header, `InboxDigest`, and `ProcessHubCurrentStatePanel` exactly as they are. **Do NOT** delete props from `ProcessHubReviewPanelProps` or `ProcessHubView`/`Dashboard` (hide-not-extract; prop cleanup is §9).

- [ ] **Step 2: Run the editor regression suites for the panel**

Run: `pnpm --filter @variscout/azure-app test -- ProcessHubReviewPanel ProcessHubControlRegion`
Expected: `ProcessHubControlRegion.test.tsx` stays green (it mounts the region directly). Fix any `ProcessHubReviewPanel`-specific failures that are _regressions_ (keeps broken); a missing SnapshotCard/cadence assertion is _expected churn_ → handle in Step 3.

- [ ] **Step 3: Update `Dashboard.processHub.test.tsx` (the churn site)**

This suite renders the **real** Dashboard → real `ProcessHubView` → real `ProcessHubReviewPanel`. Run it and classify each failure:

Run: `pnpm --filter @variscout/azure-app test -- Dashboard.processHub`

- **Delete** assertions for the shed cadence UI:
  - the `cadence-snapshot-*` testids (lines ~315–319 and ~341) and the `'Decision Queues'` / `'+3 more'` assertions;
  - the cadence-questions text (`'Process State Questions'`, `'Daily huddle'`, `'Weekly process review'`, and the question strings — lines ~223–233);
  - the cadence-queue labels (`'Active Work'`, `'Quick'`, `'Focused'`, `'Chartered'`, `'Where to Focus'`, `'Verification'` _as a queue heading_, `'Post-action shift check'`, `'1 overdue action'` — lines ~235–249).
  - **Delete the whole `it('shows readiness queue reasons in the cadence review panel', …)` block (~260–278)** and **`it('renders a current process state board with snapshot metrics and truncated queues', …)` block (~280–321)** — both are entirely about the shed cadence rollup.
- **Keep** assertions for the V1 keeps: the `region` "Line 4 Current Process State" + `'Current Process State'` header, the CurrentStatePanel state-items (`'Capability below target'`, `'Focused investigation'`, `'Outcome'`, `'Measurement'`, etc.), and the **Control** assertions (`'Control'`, `'Nozzle replacement verified'`, `getByLabelText('Set up control cadence for Nozzle replacement verified')`, lines ~250–254) + the `onOpenProject` review-item click (256–257).
- In `it('keeps process hubs visible when search filters …')` (~323–343), replace the `cadence-snapshot-active` proxy (line 341) with a surviving panel marker, e.g. `expect(within(panel).getByText('Current Process State')).toBeInTheDocument();`.
- **Method:** classify by _which component rendered the text_ (read `ProcessHubCurrentStatePanel.tsx` vs `ProcessHubCadenceQuestions.tsx` vs `ProcessHubCadenceQueues.tsx` if a string's origin is ambiguous). When unsure whether a string is CurrentStatePanel (keep) or a cadence component (shed), grep the three component files for the literal. Do not delete a keep assertion to make the suite pass.

- [ ] **Step 4: Run both suites green**

Run: `pnpm --filter @variscout/azure-app test -- ProcessHubReviewPanel ProcessHubControlRegion Dashboard.processHub`
Expected: PASS. The Control region renders (lifted), Inbox + CurrentStatePanel intact, no cadence rollup.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/ProcessHubReviewPanel.tsx apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx
git commit -m "feat(cs-p1): shed the cadence rollup; lift ProcessHubControlRegion out of the queues"
```

---

## Task 3: Collapse the Status/Capability two-tab into one surface

**Files:**

- Modify: `apps/azure/src/components/ProcessHubView.tsx`
- Test: `apps/azure/src/components/__tests__/ProcessHubView.test.tsx`

**Why:** `ProcessHubView` is a two-tab container (`status` → `ProcessHubReviewPanel`, `capability` → `ProcessHubCapabilityTab`). Collapse to one coherent scrolling surface. The shared chrome above the tablist (`GoalBanner`, framing prompt, OutcomePin row, migration banner/modal) stays; only the tablist + tab-switching go.

- [ ] **Step 1: Rewrite the 4 tab tests (TDD-first)**

In `ProcessHubView.test.tsx`, replace the 4 tab tests (~lines 43–66 — "renders Status tab as default", "switches to Capability tab on click", "renders the Status tab panel by default", "renders the Capability tab panel when selected") with no-tabs assertions against the existing mocks (`mock-process-hub-review-panel`, `mock-process-hub-capability-tab`):

```tsx
it('renders both the review panel and the capability content with no tablist', () => {
  render(<ProcessHubView {...baseProps} />);
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(screen.getByTestId('mock-process-hub-review-panel')).toBeInTheDocument();
  expect(screen.getByTestId('mock-process-hub-capability-tab')).toBeInTheDocument();
});
```

Keep all the chrome tests (GoalBanner, framing prompt, OutcomePin — lines ~68–173) unchanged.

- [ ] **Step 2: Run it — verify it fails**

Run: `pnpm --filter @variscout/azure-app test -- ProcessHubView`
Expected: FAIL (tablist + tab roles still present).

- [ ] **Step 3: Collapse the component**

In `ProcessHubView.tsx`:

- **Remove** the `role="tablist"` `<div>` + its two tab `<button>`s (lines ~162–187).
- **Remove** the tab state + helpers: `activeTab`/`setActiveTab` (line ~73), the `tabClass` helper (~83–84), and the `TabKey` type (~63). Remove the `useState` import if it becomes unused.
- **Replace** the `activeTab === 'status' ? (…) : (…)` conditional (lines ~189–207) with **one scroll surface rendering both**, Capability first (the analytical orient content), then the Review keeps:

```tsx
<div className="flex-1 overflow-y-auto" data-testid="process-hub-surface">
  <ProcessHubCapabilityTab rollup={rollup} onHubCpkTargetCommit={onHubCpkTargetCommit} />
  <ProcessHubReviewPanel rollup={rollup} {...reviewProps} />
</div>
```

(`ProcessHubCapabilityTab` needs no change — Task 1's gate already self-hides its empty temporal row.) Keep the `id`/`data-testid` of the old panels only if other tests/e2e rely on them; otherwise the single `process-hub-surface` wrapper is enough. Verify no remaining reference to `process-hub-status-tab-panel` / `process-hub-capability-tab-panel` outside this file (grep) before removing those ids.

- [ ] **Step 4: Run green + check the e2e selector note**

Run: `pnpm --filter @variscout/azure-app test -- ProcessHubView`
Expected: PASS.
Also grep `apps/azure/e2e` for `hub tabs` / tab `role` / the panel testids (the spec flagged `modeB-framing.spec.ts` asserts GoalBanner "above the hub tabs"); if an e2e queries a tab role or the removed panel ids, update the selector to the new structure (or note it for the controller's pre-PR e2e check). Do **not** weaken a functional e2e assertion.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/ProcessHubView.tsx apps/azure/src/components/__tests__/ProcessHubView.test.tsx
git commit -m "feat(cs-p1): collapse the Status/Capability two-tab into one coherent surface"
```

---

## Self-Review (controller, after all tasks)

1. **Spec coverage:** cadence rollup shed ✓ (Task 2), Control/Inbox/CurrentStatePanel preserved ✓ (Task 2), two-tab collapsed ✓ (Task 3), empty temporal row hidden ✓ (Task 1), shared chrome intact ✓ (Task 3). Per-step capability NOT moved (foundation-only) ✓. Engines + props NOT deleted (hide-not-extract) ✓.
2. **Adversarial negative-control (controller-run):** temporarily revert the Control-lift in `ProcessHubReviewPanel` (render the queues again / drop the lifted `ProcessHubControlRegion`) → `Dashboard.processHub.test` Control assertions must go RED → confirms the lift is load-bearing. Revert the temporal gate → the new empty-gate test must go RED. Restore.
3. **Term cleanup (controller, inline):** retire "3-band"/"operations band" comment language in `packages/ui/src/components/Canvas/index.tsx` + `packages/hooks/src/useProductionLineGlanceOpsToggle.ts` (the spec §2A + decision-log doc work already landed on main).
4. Full gate: `bash scripts/pr-ready-check.sh` green; `pnpm --filter @variscout/ui build` + `pnpm --filter @variscout/azure-app build` (tsc catches literal-vs-type drift in tests).
