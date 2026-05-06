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

### Canvas mini-chart: time-series for high-cardinality columns missing (vision §5.2)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (commits `2c010f29` / `36727ad0` / `2820afb1`).

**Description:** Vision §5.2 commits to **three mini-chart types per step card**: histogram for measurements, distribution for categoricals, and **time-series for high-cardinality columns**. `CanvasStepMiniChart` (`packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx`) implements only two — the time-series branch is absent. For process data ordered by run number / batch, the mini-time-series is methodologically meaningful (trend vs distributional shape).

**Possible directions:**

- Add a time-series branch with a cardinality threshold (e.g. `column.type === 'numeric' && distinct > 30`).
- Use the column-detection time column (per `parser/detection.ts`) when present; fall back to row-index ordering. Document the fallback explicitly.
- Algorithm: sparkline / mini-line; LTTB downsampling for >100 points (existing `@variscout/charts` convention).
- Bonus: replace the current "first-12-raw-values" pseudo-histogram with proper Sturges/Scott binning.

**Promotion path:** PR8b of the canvas migration sequence (Vision Alignment phase). Bundles into a small `CanvasStepMiniChart` extension PR.

---

### Canvas drift indicator missing (vision §5.2)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06.

**Description:** Vision §5.2 commits each step card to display a **drift indicator** — recent vs prior, when snapshot history exists. `CanvasStepCardModel` (`packages/hooks/src/useCanvasStepCards.ts`) has no `drift` or `priorStats` field, and the card UI has no drift rendering. Drift is methodologically core (Watson's "did this process change?"); shipping cards without it leaves the cadence-read flow incomplete.

**Possible directions:**

- Data model extension: `drift?: { direction: 'up' | 'down' | 'flat'; magnitude: number; threshold: number }` on `CanvasStepCardModel`.
- Snapshot reference: read prior `EvidenceSnapshot` per-step capability (slice 3 shipped per-row provenance + snapshot stamping).
- UI: small ↑ / ↓ / → arrow + magnitude % near the capability badge; arrow shape avoids H6 color-only signaling.
- Threshold: ±5% default (rule TBD); user-configurable later.

**Promotion path:** PR8b of the canvas migration sequence. Requires `EvidenceSnapshot` history reader (mostly shipped); UI + model extension lands in one ~6-task PR.

---

### Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (`packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx:276-294`).

**Description:** Vision §5.3 and §2.4 prescribe **five mode-aware response-path CTAs**: Quick action / Focused investigation / Charter / Sustainment / Handoff. Cadence-mode (mature Hub) shows all five active; first-time/no-Hub mode (PWA free tier) shows Quick action + Focused investigation active and dims the rest with a tier-upgrade hint. Codex hardcoded Charter / Sustainment / Handoff as **permanently `disabled`** — wrong UX signal: users see "permanently broken" instead of "tier-gated, here's why."

**Possible directions:**

- Hub-maturity signal: thread `mode: 'cadence' | 'first-time' | 'demo'` through `CanvasWorkspace` → `Canvas` → `CanvasStepOverlay`. Compute from `assignmentsComplete && stepsAuthored && hasPriorSnapshot`.
- Tier gate: check `isPaidTier()` per ADR-078 D5 for Charter / Sustainment / Handoff. Render with a tier-upgrade hint instead of `disabled` when free tier.
- First-time-Hub copy: dimmed CTAs with tooltip "Available once your Hub has cadence" (or similar).
- Mode boundary: separate "mode" (drill-down content) from "tier" (paid feature gating); they are conflated in the current code.

**Promotion path:** PR8a of the canvas migration sequence. ~5 tasks: thread mode signal, compute hub-maturity, replace `disabled` with tier-aware affordances + copy.

---

### Canvas hypothesis-arrow drawing affordance absent (vision §3.4)

**Surfaced by:** Canvas PR6 retrospective design review, 2026-05-06.

**Description:** Vision §3.4 commits to user-authored hypothesis arrows: _"users may **optionally draw a hypothesis arrow** from one column (or one step) to another."_ Hypothesis arrows are first-class authoring; promoted (evidence-crossed-threshold) → node markers; draft → faint arrows. `useCanvasInvestigationOverlays` projects pre-existing `CausalLink` entities as faint dashed SVG arrows (read-side only). The user-facing **drawing gesture** does not exist anywhere on the canvas.

**Possible directions:**

- Drawing gesture: Mode 2 (structural authoring) toolbar gains a "Draw hypothesis" tool. Click source step/column → drag → release on target → opens a tiny inline form ("I suspect [X] affects [Y]" + free-text `because...`).
- Promoted vs draft visual distinction: drafts = faint dashed arrows (current); promoted = node markers ON the affected step (separate visual primitive — needs design).
- Suspected causes as node markers: Codex renders as inline badges inside step cards; spec calls for node markers. Either accept the badge pattern (document deviation) or rework.
- Storage: new draft hypotheses → `CausalLink` entities in `useInvestigationStore` (existing graph).

**Promotion path:** PR8d of the canvas migration sequence. Requires Spec 4 brainstorm extension covering the drawing-mode gesture (overlap with structural-arrow drawing — same primitive, different semantic), promoted-vs-draft visual, and column-vs-step source/target. ~8 tasks.

---

### Canvas Wall overlay is badge projection, not "same data, two views" mirror (vision §5.6)

**Surfaced by:** Canvas PR6 retrospective design review, 2026-05-06.

**Description:** Vision §5.6 commits the Wall to be **dual-home**: _"It remains the canonical destination in the Investigation tab AND becomes one of the canvas overlays. **Same data, two views**."_ §5.4 even says: _"With overlays on, the canvas IS the Wall view."_ Codex's implementation is a lighter projection — per-step badge counts + linked item lists in the step overlay — not a mirror of the Wall's full graph. Defensible V1 (read-only cadence-scan) but unmet spec commitment.

**Possible directions:**

- Embed the Wall viewport: render `WallCanvas` (`packages/charts/src/InvestigationWall/`) inline as the canvas overlay layer. Same data, lighter chrome.
- Hybrid: keep badge-projection as cadence-scan; add an "expand to wall view" button in canvas chrome lifting the wall into a modal / right-rail.
- Status quo + spec amendment: accept badge-projection as V1 dual-home; amend §5.6 to say "destination = full graph; overlay = projected badges."

**Promotion path:** PR8e of the canvas migration sequence. Requires Spec 4 brainstorm extension to pick between embedded-wall vs badge-projection-as-canonical. ~6 tasks if embedded-wall is chosen; ~2 (just the spec amendment) if status quo.

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
