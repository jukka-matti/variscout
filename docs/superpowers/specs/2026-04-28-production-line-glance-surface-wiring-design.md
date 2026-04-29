---
title: Production-Line-Glance Surface Wiring (Plan C) — One Dashboard, Three Surfaces
audience: [product, designer, engineer, analyst, manager]
category: design-spec
status: draft
related:
  [
    production-line-glance-design,
    production-line-glance-engine,
    production-line-glance-charts,
    layered-process-view,
    process-hub,
    frame-process-map,
    process-learning-operating-model,
    adr-059,
  ]
date: 2026-04-28
---

# Production-Line-Glance Surface Wiring (Plan C)

## Scope

Surface wiring (Plans A/B/C) implements [Investigation Scope and Drill Semantics](./2026-04-29-investigation-scope-and-drill-semantics-design.md). Plan D (Org Hub-of-Hubs) cross-hub view is designed there.

This is a **design spec**, not an implementation plan. It defines how the production-line-glance dashboard primitives (delivered in Plan A engine + Plan B charts) are wired into three live surfaces — LayeredProcessView Operations band, Process Hub view, and FRAME workspace — together with the data layer, filter semantics, and B0 migration UX.

The cross-hub context-filtered view at the Org Hub-of-Hubs is **out of scope** for this surface-wiring spec (Plan D); its design lives in [Investigation Scope and Drill Semantics](./2026-04-29-investigation-scope-and-drill-semantics-design.md) §6 Cross-hub context analysis. LayeredProcessView snapshot mode (deferred to H3 per `project_phase_2_v2_closure.md`) is **out of scope**. Plan C operates on live single-hub data only.

## Summary

Plan C is built on one principle: **the same `ProductionLineGlanceDashboard` component is the constant; what differs across surfaces is how much of it the user currently sees and what context anchors it**. There is no separate "OperationsBand" component, no separate "Hub capability panel", no separate "FRAME live-preview" — there is one dashboard, three surfaces, one progressive-reveal interaction.

The data layer is split cleanly: pure derivation (hub + investigations + filter → slot inputs) lives in `@variscout/hooks`; pure stat-like computations (distinct-value enumeration for filter context options) live in `@variscout/core/stats`; fetching and persistence remain the apps' concern. Each app composes app-store → hooks → dashboard.

## Why this design exists

Plan B delivered a complete props-based 2×2 dashboard primitive in `@variscout/ui` and three new chart primitives in `@variscout/charts`. It was deliberately surface-agnostic so the surface-wiring decisions could be made once, after the primitive's shape was proven. Three forces converge here:

1. The design spec ([`2026-04-28-production-line-glance-design.md`](./2026-04-28-production-line-glance-design.md)) names the LayeredProcessView Operations band the **architectural primary** (line 320: _"Operations band is exactly the bottom row of the 2×2 dashboard"_). Treating the band as a separate component would break that invariant.
2. The Process Hub view is the most-frequented surface in steady state — process owners land there for cadence reviews. The dashboard belongs there as a first-class section, not as a hidden affordance.
3. FRAME authoring needs live feedback as canonical-map mappings are made. Building a separate live-preview component would mean two things to maintain and two opportunities for visual drift.

The unified design — one component, progressive reveal, shared data layer — gives one component to maintain, one mental model for the user, and one regression surface for tests.

## The dashboard's three forms

`ProductionLineGlanceDashboard` (from Plan B) gains one new prop: `mode: 'spatial' | 'full'` (default `'full'`). The render is always the full 2×2 in DOM; `mode='spatial'` simply collapses the temporal row's container to `max-height: 0` with a CSS transition to natural height on toggle. The chart components never re-mount.

| Surface                            | Default mode                | Toggle                                     | Anchor / context                             |
| ---------------------------------- | --------------------------- | ------------------------------------------ | -------------------------------------------- |
| LayeredProcessView Operations band | `spatial`                   | inline "Show temporal trends ↑" affordance | the canonical map's process flow above       |
| Process Hub view (Capability tab)  | `full`                      | none — always full                         | the hub's status snapshot in adjacent tabs   |
| FRAME workspace right-hand drawer  | `full` (collapsible drawer) | drawer collapse, not mode toggle           | the canonical-map-being-authored on the left |

Progressive reveal in LayeredProcessView is the only place `mode` toggles dynamically. The other two surfaces pin `mode='full'`.

## Three surfaces

### 1. LayeredProcessView Operations band

The current Operations band (`packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx:87-109`) renders tributary chips. That content moves to the Outcome band's metadata section (it answers "what factors are mapped?", a setup question, not an operations question).

The Operations band's new content is the dashboard rendered with `mode='spatial'` — the bottom row only (CapabilityBoxplot + StepErrorPareto). Above the band's title, a single text affordance reads `Show temporal trends ↑`. Click it, and the dashboard's `mode` becomes `'full'`; the temporal row expands above the spatial row with a 240ms `max-height` transition; the affordance text becomes `Hide temporal trends ↓`. The Process Flow band remains in place above; the operations band simply grows. State persists in URL search params (`?ops=full`).

Why progressive reveal instead of a separate component: the dashboard's identity is the 2×2; the spatial row is a partial view of it, not its own thing. When the user expands, no chart re-mounts (the dashboard was always rendered, just visually clipped) — visx scales remain stable, no flicker.

The filter strip at the top of the dashboard is hoisted to the top of the LayeredProcessView (above the Outcome band) when the dashboard renders inside it — so the filter is a single source of truth for the entire layered view, not an Operations-band-only chip strip.

The "tributary chips" that currently occupy the Operations band move to the Outcome band as a small "Mapped factors" section. This is a documented behavioral change; the V1 LayeredProcessView spec at `2026-04-27-layered-process-view-design.md` is amended in C1's plan.

### 2. Process Hub view (Capability tab)

The existing `ProcessHubReviewPanel` (`apps/azure/src/components/ProcessHubReviewPanel.tsx`) is a flat composition of `ProcessHubCurrentStatePanel` + cadence questions + queues. Plan C inserts the dashboard as a **new sibling tab next to the existing flat sections**. Concretely: `ProcessHubReviewPanel` is wrapped in a tab container with two tabs — "Status" (the existing flat layout, default) and "Capability" (the dashboard).

A tab placement (not adjacent panel, not drawer) wins because:

- The existing Hub view is dense; an adjacent panel would compete with `ProcessHubCurrentStatePanel` for vertical attention.
- Drawer breaks the user's spatial memory between visits.
- A "Capability" tab matches the rest of the platform's IA pattern (PI Panel uses tab navigation per ADR-056).

The Capability tab renders `ProductionLineGlanceDashboard` with `mode='full'`. The tab is initially silent (no badge); a future enhancement (out of scope for V1) could show a confidence-weighted health indicator.

**PWA scope clarification:** Plan C's Hub Capability tab ships in **azure-app only**. PWA does not currently have a Process Hub view; introducing one is a larger IA decision than Plan C should absorb. The dashboard component itself remains app-agnostic — once a PWA Hub IA exists (separate plan), the same dashboard mounts unchanged.

### 3. FRAME workspace right-hand drawer

When the analyst is in FRAME's canonical-map authoring mode, a right-hand drawer is collapsed to a 32 px sliver with the affordance "Capability preview". Click to expand to ~480 px wide; the drawer hosts the dashboard at `mode='full'`. As the analyst maps columns to nodes (or edits specs), the dashboard's slot inputs update reactively because the data hooks subscribe to the same authoring state Zustand stores.

The drawer is collapsed by default — analysts new to canonical-map authoring don't need it; the visual feedback is opt-in. State persists per-workspace in `localStorage` (not URL) because it's a workspace-layout preference, not a shareable analytical state.

When `nodeMappings.length === 0` (no mappings yet), the dashboard shows the existing Plan B empty-state hint ("No mapped nodes — per-step capability unavailable"). The first mapping a user makes immediately populates the boxplot — that visceral feedback is the point.

## Data layer

### Pure derivation utilities — `@variscout/core/stats`

Two new functions:

```typescript
// packages/core/src/stats/contextValueOptions.ts
export function distinctContextValues(rows: readonly DataRow[], column: string): string[];

// packages/core/src/stats/stepErrorAggregation.ts
export interface StepErrorRollupInput {
  hub: ProcessHub;
  members: readonly ProcessHubInvestigation[];
  defectColumns?: readonly string[]; // app-supplied, e.g. ['DefectType']
  contextFilter?: SpecLookupContext;
}
export function rollupStepErrors(input: StepErrorRollupInput): StepErrorParetoStep[];
```

Both are pure (no I/O), deterministic, return `number | undefined` for any stat-shaped result per ADR-069.

`distinctContextValues` enumerates the distinct values present in a column across rows — used by the filter strip to populate chip options. Sorted lexicographically; null/empty rows excluded; cardinality capped at 50 (a hub with >50 distinct products is misusing the model).

`rollupStepErrors` walks each member investigation, applies its `nodeMappings`, counts non-pass values from the configured defect columns per node, optionally narrowed by `contextFilter`. Returns `StepErrorParetoStep[]` directly consumable by Plan B's bottom-right slot. The "non-pass" semantics reuse the existing `mapDefectColumnRows` from `@variscout/core/defect`.

### React derivation hooks — `@variscout/hooks`

Three new hooks compose the slot inputs:

```typescript
// packages/hooks/src/useProductionLineGlanceData.ts
export function useProductionLineGlanceData(args: {
  hub: ProcessHub;
  members: readonly ProcessHubInvestigation[];
  rowsByInvestigation: ReadonlyMap<string, readonly DataRow[]>;
  contextFilter: SpecLookupContext;
  defectColumns?: readonly string[];
}): {
  cpkTrend: ProductionLineGlanceDashboardProps['cpkTrend'];
  cpkGapTrend: ProductionLineGlanceDashboardProps['cpkGapTrend'];
  capabilityNodes: ProductionLineGlanceDashboardProps['capabilityNodes'];
  errorSteps: ProductionLineGlanceDashboardProps['errorSteps'];
  availableContext: {
    hubColumns: string[];
    tributaryGroups?: Array<{ tributaryLabel: string; columns: string[] }>;
  };
  contextValueOptions: Record<string, string[]>;
};

// packages/hooks/src/useProductionLineGlanceFilter.ts
// URL-search-param state synchronization for the filter strip.
export function useProductionLineGlanceFilter(): {
  value: SpecLookupContext;
  onChange: (next: SpecLookupContext) => void;
};
```

The first hook is **pure given inputs** — it does not fetch. It calls `calculateNodeCapability()` for each node × source, computes the gap series and the cpk trend over snapshots, and rolls up step errors. Memoized at the slot-input level so re-renders are cheap.

The second hook owns URL serialization for filter state. Read on mount, write on change (replace, not push). Per-hub scoping is via the URL itself (each hub has its own route).

A third small hook — `useB0InvestigationsInHub` — surfaces the count of unmapped (B0) investigations in the hub. Drives the migration banner.

### Fetching boundary — apps

Apps own fetching:

- **Azure app** reads from Dexie + Blob (sync via `BlobSyncService`). A thin app-side hook (`useHubProvision`) selects `hub`, `members`, `rowsByInvestigation` from stores and forwards to `useProductionLineGlanceData`.
- **PWA** consumes the same data hook contract once a PWA Hub IA exists (out of Plan C scope). The `useProductionLineGlanceData` API stays identical so the future PWA wrapper drops in without core/hooks changes.

This split honors `core → hooks → ui → apps` (ADR-045) and the customer-owned-data principle (ADR-059): nothing leaves the tenant.

## Filter strip semantics

- **State location**: URL search params (`?product=Coke12oz&supplier=TightCorp`). Per-hub by virtue of the URL route.
- **Persistence**: not persisted to localStorage. Filter is ephemeral analyst intent; reload-with-URL is the only persistence path.
- **Empty state**: empty `?…` → `value = {}` → no filter active.
- **Cross-surface**: when the dashboard sits inside LayeredProcessView, the filter strip floats above the Outcome band; in Process Hub Capability tab, above the dashboard panel; in FRAME drawer, above the dashboard inside the drawer. Same component, three host positions.
- **Compatibility with existing filters**: the dashboard's filter does NOT couple to existing investigation-level FilterContextBar or PI Panel filters. A hub can have multiple investigations with their own per-investigation filters; the hub-level filter scopes only the dashboard's data derivation.

## B0 migration UX

When a hub contains ≥1 investigation with `nodeMappings = []` (B0 — legacy specs only):

- **Banner** above the Process Hub Capability tab content (and above the dashboard inside LayeredProcessView when the user is on a Hub-anchored route): _"N investigations are not yet mapped to canonical map nodes. They won't appear in capability views until mapped."_
- Primary action: **Map columns** — opens a focused modal listing each B0 investigation, showing its current measurement column(s), and offering a guided mapping to canonical-map nodes (suggestion engine: `suggestNodeMappings()` from `@variscout/core/stats`, already shipped in PR #103).
- Decline / dismiss persists per-investigation in the investigation's metadata (`migrationDeclinedAt: ISO-string`). Dismissed investigations remain B0; the banner counts only un-dismissed unmapped investigations.

The banner is a sticky-style notification (appears under the page header, not blocking), so it does not interrupt cadence-review flow. The mapping modal is focused but non-blocking — close-without-mapping leaves things as they were.

## Performance mode coexistence

Performance mode (`packages/core/src/analysisStrategy.ts:81`) operates inside investigation editor — within-step channel comparison (cavity, head, press number). Plan C's dashboard operates at the line/hub level — across-step capability. They are complementary axes:

- **In Hub Capability tab**: dashboard. Click a step (CapabilityBoxplot box, or StepErrorPareto bar) → drill into the investigation that maps that step → opens in investigation editor with Performance mode pre-selected.
- **Inside investigation editor**: Performance mode unchanged. The new dashboard does not appear here; the investigation editor remains a per-investigation surface.

The drill from Hub → step → investigation editor uses the existing investigation-routing infrastructure (`apps/azure/src/lib/processHubRoutes.ts:resolveInvestigationForNode`).

## Component API additions (Plan B revisions)

Plan B's `ProductionLineGlanceDashboardProps` is extended with:

```typescript
export interface ProductionLineGlanceDashboardProps {
  // ...existing props...

  /** Reveal mode. Default 'full'. LayeredProcessView passes 'spatial'. */
  mode?: 'spatial' | 'full';

  /** Click handler when the user toggles between spatial and full. */
  onModeChange?: (next: 'spatial' | 'full') => void;
}
```

The dashboard renders the temporal row inside a wrapper with `max-height: 0; overflow: hidden;` when `mode === 'spatial'`, with a 240ms `max-height` transition on change. The wrapper's `aria-hidden` reflects mode. No chart re-mounts.

Three new exports from `@variscout/ui`:

```typescript
export { useProductionLineGlanceFilter } from '...'; // re-export from @variscout/hooks
export { ProductionLineGlanceMigrationBanner } from '...';
```

(The hook is re-exported at the @variscout/ui boundary because the Capability tab needs it; also a candidate for direct hooks-layer import depending on consumer.)

## Verification

- **Engine has no new aggregator across investigations or hubs** — `rg -n "meanCapability|aggregateCpk|sumCpk|portfolioCpk" packages/core/` returns zero hits.
- **Single dashboard component, three surfaces** — `grep -rn "<ProductionLineGlanceDashboard" packages/ apps/` shows mounts in (a) LayeredProcessView Operations band path, (b) ProcessHubReviewPanel Capability tab, (c) FRAME workspace right-hand drawer. No `OperationsBand`, `HubCapabilityPanel`, or `FrameLivePreview` components exist.
- **Progressive reveal**: chrome walk in LayeredProcessView surface verifies that toggling "Show temporal trends" does not re-mount visx charts (use React DevTools or component-level instance assertion in test).
- **Filter strip URL state**: load page with `?product=Coke12oz&supplier=TightCorp` → filter strip reflects pre-selected chips; data derivation reflects the filter.
- **B0 banner**: hub with one B0 investigation shows banner with count "1"; clicking primary action opens mapping modal; dismissing the only B0 hides the banner.
- **PWA + Azure parity**: same dashboard renders identical chart shapes given the same hub data, regardless of which app's data layer feeds it.
- **No regression** in Performance mode, FRAME river-SIPOC editor, or LayeredProcessView Outcome band beyond the documented Operations-band content move.
- **PR-ready check** — `bash scripts/pr-ready-check.sh` green for each sub-plan PR.

## Out of scope (named, deferred)

- **Plan D** — cross-hub context-filtered view at the Org Hub-of-Hubs (Plant > Line > Station). Same dashboard primitive multiplied across child hubs filtered by a context value.
- **LayeredProcessView snapshot mode** — frozen-in-time hub view for cadence review archives. Deferred to H3 per `project_phase_2_v2_closure.md`.
- **Sustained Portfolio Investigation lifecycle** — H3+. Plan C's "drill from step → investigation" supports the workflow but does not introduce Portfolio Investigation as a first-class entity.
- **Real-time collaborative editing** of canonical map. Versioned-pull model from the spec is sufficient.
- **Mobile-specific responsive treatment** of the LayeredProcessView Operations band's progressive-reveal interaction. The dashboard component is responsive; the Operations-band-specific affordance and animation handle small viewports as a future polish task.
- **i18n strings for new copy** ("Show temporal trends", banner text, etc.) — strings ship in English; i18n catalog entries are folded in once strings stabilize per the project's `adding-i18n-messages` pattern.
- **CapabilityBoxplot pixel-perfect overlay alignment validation** — chrome walk in C1 closes the visual deferred from Plan B T3.

## Sequencing (delivery order — design is one whole)

The design above covers all three surfaces and the data layer as a single coherent vision. Implementation is delivered in three sub-plans, each its own PR, sharing the same data layer landed in the first sub-plan:

1. **C1 — Data layer + Process Hub Capability tab.** Lands the `@variscout/core/stats` derivation utilities, the `@variscout/hooks` data hooks, the URL-state filter hook, and the dashboard wired into the Process Hub Capability tab in azure-app. Includes the B0 migration banner + mapping modal. Chrome walk validates the full data-to-render path on the highest-traffic surface first; this also closes the Plan B T3 overlay-alignment deferred check.

2. **C2 — LayeredProcessView Operations band.** Adds `mode: 'spatial' | 'full'` to `ProductionLineGlanceDashboard`, replaces the Operations band content with `<ProductionLineGlanceDashboard mode='spatial' />`, adds the progressive-reveal affordance, hoists the filter strip to the top of LayeredProcessView, moves tributary chips to the Outcome band's "Mapped factors" section, amends the V1 LayeredProcessView spec. Plan: [`docs/superpowers/plans/2026-04-28-production-line-glance-c2-layered-view.md`](../plans/2026-04-28-production-line-glance-c2-layered-view.md).

3. **C3 — FRAME workspace right-hand drawer.** Adds a collapsible right-hand drawer to FRAME's canonical-map authoring mode that hosts the dashboard live-bound to authoring-state stores. Drawer collapse persists per-workspace in localStorage.

Each sub-plan ships as its own PR per `feedback_no_backcompat_clean_architecture.md`. Subagent code review per PR. Cross-hub view (Plan D) is the next natural follow-up after C3.

## References

- Production-line-glance design: `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
- Engine plan (Plan A): `docs/superpowers/plans/2026-04-28-production-line-glance-engine.md` (merged as PR #103)
- Charts plan (Plan B): `docs/superpowers/plans/2026-04-28-production-line-glance-charts.md` (merged as PR #105)
- Data layer + Hub Capability tab plan (Plan C1): `docs/superpowers/plans/2026-04-28-production-line-glance-c1-data-and-hub-tab.md`
- LayeredProcessView V1: `docs/superpowers/specs/2026-04-27-layered-process-view-design.md`
- Operating model: `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md`
- ADR-045 modular architecture (downward dependency flow)
- ADR-056 PI Panel redesign (tab-based IA pattern)
- ADR-059 customer-owned data
- ADR-069 three-boundary numeric safety
