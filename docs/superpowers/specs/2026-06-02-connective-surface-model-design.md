---
tier: living
purpose: design
title: 'Connective Surface Model — V1 boundary, linked-panels spine, the Analyze reasoning canvas, and PWA↔Azure parity'
audience: human
status: draft
date: 2026-06-02
last-reviewed: 2026-06-02
layer: spec
topic:
  [
    connective-navigation,
    surface-model,
    process-tab,
    analyze-wall,
    framing,
    parity,
    wedge-v1,
    laptop-ergonomics,
  ]
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md
  - docs/superpowers/specs/2026-05-29-investigation-surface-design.md
  - docs/superpowers/specs/2026-05-30-investigation-wall-unified-canvas-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/07-decisions/adr-086-unified-investigation-canvas.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
implements:
  - docs/01-vision/positioning.md
  - docs/01-vision/methodology.md
  - docs/02-journeys/ia-nav-model.md
  - docs/02-journeys/personas/lead.md
  - docs/03-features/workflows/investigation-surface.md
---

# Connective Surface Model

> **Draft · 2026-06-02.** Designs the **connective navigation + V1 surface model** that the IM/FE investigation rebuild (IM-0…IM-7) never holistically settled. The IM/FE work built the investigation _core_ (scope=`ProblemStatementScope` / cause=`Hypothesis`, the unified Wall layout, always-on charts, Measurement-Plan-as-DCP); this spec designs the _connective tissue between surfaces_, re-derives the V1 boundary, and resolves a layer of partial-implementation debt. **Grounded against shipped code by 8 code-grounding agents + a 5-cluster laptop-ergonomics benchmark (citations inline).** This is full-vision (PWA + Azure); the companion master plan sequences V1 delivery so the quick wins ship before the one big rock (the Analyze reasoning canvas).

---

## §1 · Context

### What this spec resolves

The wedge pivot (2026-05-16) set strategy + nav over ~6 weeks of pre-wedge accreted code; the IM/FE rebuild then rebuilt the investigation core. Neither went surface-by-surface deciding **what each surface _is_ in V1** and **how you move between them**. The result: "is this V1?" keeps recurring, several surfaces are partial old-model answers to an un-designed question, and a unification (ADR-086) was scoped but only partly built. This spec settles four things:

1. **The V1 boundary** — re-derived from the value prop, not inherited from "what was built minus the explicit cuts" (§2).
2. **The connective surface model** — how Process, Explore, and Analyze coexist on a **laptop** (§3), and the **where-from / where-to navigation spine** that links every entity across Frame ↔ Explore ↔ Analyze ↔ Improve ↔ Control (§4).
3. **Framing-on-data-load** — the entry experience, treated surgically because it is V1-core and delicate (§5).
4. **Parity + cleanup + docs** — PWA↔Azure parity (§6), the partial-implementation debt (§7), and the holistic documentation propagation (§10).

### Grounding method + the over-classification guard

Every claim below was verified against shipped source before assertion. A prior surface triage **over-classified** what was built; this spec records the corrections it found, because designing on top of a mis-described surface is how the recurring "is this V1?" confusion started. Key corrections surfaced during grounding:

- The Analyze card **"i-chart" is a sparkline of the _factor_ column (no control limits), not an Individuals chart** (`packages/core/src/findings/miniChart.ts`).
- **PWA Analyze mounts no Evidence Map at all** (`apps/pwa/src/components/views/AnalyzeView.tsx` — its "Map" toggle is a `FindingsLog` list/board).
- The **unified bipartite canvas (ADR-086) is partly unbuilt**: `CanvasWallOverlay` + `LocalMechanismView` are **still mounted** despite ADR-086 claiming them "superseded" (§7).
- The **typed factor↔cause edge already exists** (`CausalLink`, with `hypothesisId`) — it was mis-recorded as "deferred" (§4.3).
- The **cadence loop is live + mounted** (`ProcessHubReviewPanel`, mounted in `ProcessHubView.tsx:196`), so the V1-boundary call un-mounts a shipped surface, not a paper one (§2).

### Invariants this spec is bound by

| Invariant                                                                                                                     | How it binds                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Distribution, not aggregation** ([ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md)) | Shared-scope coordination operates on **one unit-homogeneous scope**; each linked view distributes _within_ it. No inline/coordinated chart may roll up across heterogeneous units. This is the **highest-risk** place to violate by accident (§3.4). |
| **Surface-boundary policy** ([ADR-074](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md))           | The Analyze reasoning canvas is the only genuinely spatial surface; Process/Explore stay panels. Respect `scripts/check-level-boundaries.sh`.                                                                                                         |
| **Contribution, not causation**                                                                                               | The factor↔cause edges and contribution numbers say _support / counts-against_ and _contribution / suspected cause_, never _causes / proves_.                                                                                                         |
| **Prefer pragmatic**                                                                                                          | Trust is a soft caveat; no new gates. The laptop rules below favor the minimum that catches the real ergonomic risk.                                                                                                                                  |
| **Same analysis everywhere** ([PWA philosophy](../../01-vision/positioning.md))                                               | The analysis surfaces target PWA↔Azure parity; Azure adds only collaboration / CoScout / cloud / audit (§6).                                                                                                                                          |

---

## §2 · The re-derived V1 boundary (Decision 0)

**Value prop:** _one improvement specialist runs ONE investigation → improvement → control, optionally with a small team, worth €120/mo._ Derived from that — not from the code that happens to exist — the murky layer is exactly one thing: **"Process-as-ongoing-operations."**

### §2.1 · Decision

| Surface                                                                                                                                                                                          | V1?              | Disposition                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------ |
| Process **map** + **framing / column-connection** authoring (Frame)                                                                                                                              | **V1-core**      | The Process tab _is_ this. Kept, redesigned (§5).                  |
| Cadence-review loop · monitoring queues · state-items · current-state panel (`ProcessHubReviewPanel`, `buildProcessHubCadence`, `buildCurrentProcessState`, `ProcessHubCadenceQuestions/Queues`) | **named-future** | "VariScout Process." **Un-mounted from V1** by the follow-up (§9). |
| Control-as-closure (Cpk delta + drift since closure at the _end_ of the single investigation)                                                                                                    | **V1**           | Stays. Distinct from cadence-monitoring.                           |
| Free PWA                                                                                                                                                                                         | **V1 funnel**    | Separable bet; unchanged.                                          |

### §2.2 · Why this is safe (grounded)

Two independent traces proved the named-future cadence loop is **purely downstream and read-only** from analysis state — un-mounting it cannot break the V1 investigation:

- **Re-ingest → analysis is independent of cadence.** Adding data flows `rawData → useFilteredData (packages/hooks/src/useFilteredData.ts:78) → useAnalysisStats` → charts/Wall, plus the IM-3 auto-link cascade (`packages/hooks/src/useReingestAutoLink.ts`). **No analysis surface imports** `buildProcessHubCadence` / `buildCurrentProcessState` (grep-empty). Cadence reads analysis _outputs_ (`rollup.analyzes[].metadata`, `processHub.ts:866`) and produces monitoring snapshots only.
- **Framing is independent of cadence.** `buildCurrentProcessState` (`packages/core/src/processState.ts`) never reads `processMap` / `assignments` / `tributaries` / `ctqColumn`; `ProcessHubReviewPanel` never imports `CanvasWorkspace` / `canvasStore`.

So the only thing lost on un-mount is the monitoring-queue UI — which is named-future scope by definition.

### §2.3 · This spec records the decision; the follow-up executes it

Analysis does not _depend_ on the cadence loop (read-only, §2.2) — but the cadence _UI_ is **code-fused** with three things V1 keeps: the Control region (`ProcessHubControlRegion`, nested in `ProcessHubCadenceQueues`), Survey/Inbox (`InboxDigest`), and the click-to-Explore chip wiring. So un-mounting is safe in principle yet requires **surgical disentanglement**, not a simple delete — its own holistic design (§9). **This spec declares the boundary** (so the Process tab is designable as "the map"); **the follow-up performs the surgical extraction.** Decision 0 + the follow-up are logged in `decision-log.md` and `investigations.md` (§10).

---

## §3 · The connective surface model — laptop-first

**Canonical question:** coordinate a process-map index + EDA charts + a reasoning surface (the `y = f(x)` of hypotheses + evidence) + **one shared scope**, on a 13–15″ laptop, without cramping. A 5-cluster benchmark (SPC incumbents · canvas data tools · Coordinated-Multiple-Views literature · investigation/link-analysis tools · panel ergonomics) ranked four candidate models.

### §3.1 · The models

- **Model A — Linked-Panels Spine (ship now).** Keep the tabs; bind them with a **persistent, always-visible shared-scope chip** + an overview→detail spine; default cross-view coordination to **highlight (dim, no reflow)**, not full cross-filter. Smallest delta from shipped reality — `analysisScopeStore` (`packages/stores/src/analysisScopeStore.ts:46`) already bridges Process↔Explore. **Laptop fit: high.** Precedents: JMP global Data Filter (row-state-on-one-table), Power BI cross-highlight + per-pair Filter/Highlight/None, Looker persistent cross-filter chip.
- **Model B — Focus-Lens Evidence Canvas, confined to the Analyze tab (next increment).** Reserve the genuinely spatial, zoomable, Focus-lensed canvas **only** for the reasoning surface — the bipartite factor↔hypothesis `y = f(x)` where 2D placement carries causal meaning. Process and Explore stay panels. **This is what [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md) already commits to** ("unified bipartite canvas with a Focus lens; DOI dimming + focus-by-degree; clutter solved by Focus lens, never a global force-graph"). **Laptop fit: medium-high.** Precedents: Kumu focus-by-degree, van Ham & Perer DOI (explicitly motivated by low-power hardware), Observable Canvases port-discipline + minimap.
- **Model C — Adaptive whole-app Process-canvas (inline Explore + inline `y=f(x)`). REJECTED.** The radical "everything on one canvas" idea. **Laptop fit: low** — the benchmark warns against it hardest. Three independent sources converge on a **~2–3 co-visible-surface ceiling** on a laptop (Baldonado Parsimony; Tableau "two or three views"; Plumlee & Ware ~1-object working memory). The strongest counter-data-points: **Hex A/B-tested a free canvas and abandoned it for grid-snap**; **Figma shipped floating panels then reversed them** ("cramped the canvas on small screens"). Kept here only as the cautionary anti-pattern to cite when "one infinite canvas" resurfaces.
- **Model D — Time-multiplexed tabs + persistent scope.** The guaranteed-shippable floor; Model A strictly dominates it for slightly more work. Not a destination.

### §3.2 · The decision

**Model A is the spine. Model B is the Analyze tab living inside that spine. Drop Model C.** The bold "one canvas" instinct is not wrong — it belongs **contained** to the one surface where 2D placement earns its keep (the reasoning canvas), exactly per ADR-086.

**Division of concerns (so the two models don't blur):** Model A surfaces the **shared scope + highlight coordination** across Process/Explore/Analyze; Model B surfaces the **typed factor↔cause edges as _drawn_ connections** on the Analyze reasoning canvas (§4.3). Model A coordinates; Model B draws.

### §3.3 · Laptop ergonomic rules (distilled from the benchmark)

1. **Cap co-visible surfaces at 2–3** — one thin structural index + one primary surface + at most one detail-on-demand peek. Never 4 co-equal panels.
2. **A persistent third column is a large-screen luxury** — default reasoning/findings detail to a transient peek/modal on a laptop.
3. **Default coordination to HIGHLIGHT** (dim, keep visible, no reflow); reserve full cross-filter for deliberate scope changes; expose a per-surface Filter/Highlight/None choice.
4. **One always-visible "current scope" chip** in chrome; keep scope **persistent across tab/view switches**.
5. **Every non-primary region collapsible**, plus a one-keystroke "maximize this surface / minimize UI" focus mode (Figma Minimize-UI, VS Code Maximize).
6. **Docked-but-collapsible beats floating beats N windows.** **Pop-out stays OPTIONAL, never the model** — which matches shipped reality (only the 3 satellite surfaces pop out; never Process/Explore/Wall).
7. **One structural-index slot that swaps contents**, not a row of parallel tabs.
8. **Bound the spatial reasoning canvas with a Focus/DOI lens** (tens of nodes, never a hairball) + minimap + port-discipline. Relevance must be **domain-weighted** (`contribution × graph-distance`), not the textbook topological-only DOI.
9. **One-way sync** — browsing the overview must not mutate the detail; detail changes immediately reflect in the overview.
10. **Time-multiplex heavy views rather than tiling** (perspective switch between charts vs results vs reasoning).
11. **Evacuate low-frequency actions into a Cmd-K palette**; keep the high-frequency verbs (apply scope, capture finding, drill) as **visible** affordances — the single specialist is not a power user.
12. **Verify on a real 13–15″ viewport with `--chrome`** before shipping (fixed large-canvas layouts "scrunch" on a laptop — Tableau's warning; matches the standing verify-visually feedback).

### §3.4 · The ADR-073 guardrail

The shared scope is a **filter on one homogeneous outcome/spec context**; each linked view distributes within it. **No coordinated or inline chart may surface a roll-up across heterogeneous units.** This is the single highest-risk failure mode of any linked-views design; the architecture test `architecture.noCrossInvestigationAggregation.test.ts` and `scripts/check-level-boundaries.sh` guard it.

---

## §4 · The connective navigation spine (where-from / where-to)

The owner's concrete ask: _"from a process step, see its linked findings → jump to Analyze to see the hypothesis,"_ generalized to a **where-from / where-to** path for every entity across Frame ↔ Explore ↔ Analyze ↔ Improve ↔ Control.

### §4.1 · The shared scope is the connecting substrate (Model A)

The persistent scope (`analysisScopeStore`: `yColumn` / `boxplotFactor` / `stepId` / `categoricalFilters`) is the "all surfaces light up together" mechanism. Net-new on top of the shipped store:

- A **persistent scope chip in chrome**, legible without spending a panel; **persistent across tab switches**.
- **Extend the scope subscription to Analyze/Wall** (today it bridges Process↔Explore; the Wall reads `activeScope` separately).
- **Highlight-default coordination** (dim out-of-scope, no reflow) with a per-surface Filter/Highlight/None choice.
- **Fix the IP-scope bleed (grounded):** `analysisScopeStore` has **no IP-scoping mechanism and is never cleared on active-IP change** — upstream consumers don't call `clearScope()` on IP switch, so old drill state (`yColumn` / `boxplotFactor` / `stepId` / `categoricalFilters`) bleeds across projects (`useActiveIPContext` cascades findings/hypotheses but not scope state). The cascade must clear/re-scope drill state — keyed by `activeIPId` — on IP change. (The bug is an absent guard, not a failed reset.)

### §4.2 · The step → findings → hypothesis path (the cross-surface badges)

The badges (`packages/ui/src/components/CrossSurface/ContextBadgesRow.tsx`, wired via `CanvasStepOverlay`) implement wedge §3.3.2 "in-flight references." Grounding found the spine **scaffolded but incomplete**:

- **`ContextSurfaceType` = `improvement-projects | wall-threads | quick-actions | sustainment`** — a step links to IPs, hypotheses (`wall-threads`), and control records, and clicking navigates (`handleNavigateContextLink` → `showCharter` / `showControl` / `showAnalyze`).
- **Gaps to close (net-new):**
  - **Findings are not exposed in the step badges** — `ContextSurfaceType` (`ContextBadgesRow.tsx`) has only `improvement-projects | wall-threads | quick-actions | sustainment`; there is **no `findings` variant**. Adding a `findings` badge surface so the literal "step → its findings" works is **net-new design** (not a re-wire of an existing list).
  - **No focus-on-arrival** — clicking a hypothesis badge calls `showAnalyze()` without focus context; the analyst lands in Analyze without the hypothesis focused. Pass a `CanvasAnalyzeFocus { kind:'suspected-cause', id }` so arrival focuses the target (the Focus lens already exists — §4.4).
  - **No origin-step breadcrumb** — `ContextLinkItem` is `{id,label,description}`; carry the **origin `stepId`** so downstream surfaces can show "this came from step X" (the where-from half).
  - `quick-actions` is always `items:[]` (stub) — drop it (response paths are retired, §7.3).

### §4.3 · Surface the factor↔cause edge — `CausalLink` is the connective primitive

**The typed, persisted factor↔cause edge already ships** — it was mis-recorded as deferred. `CausalLink` (`packages/core/src/findings/types.ts:734`) carries `fromFactor` / `toFactor` / `fromLevel?` / `toLevel?` / `direction` (drives/modulates/confounds) / `findingIds[]` / **`hypothesisId?`** / `strength (ΔR²)`. It is **analyst-creatable** (`addCausalLink`, `analyzeStore.ts:1130`, called from `FrameView.tsx:278/305` and `AnalyzeWorkspace.tsx:993`), persisted via `CAUSAL_LINK_*` HubActions, and rendered in the Evidence Map + Report.

The real issue is **three overlapping representations of "factor relates to cause," never reconciled**:

| Representation       | What it is                                                                                   | Status                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Finding-mediated** | `Finding` (sign: support/counts-against) ↔ `Hypothesis.findingIds[]` / `counterFindingIds[]` | live, primary                                                             |
| **`CausalLink`**     | typed factor edge with `hypothesisId` + sign + ΔR²                                           | live, analyst-creatable, but rendered only in the Evidence Map projection |
| **Derived band**     | best-subsets ranked factors for the scope (`ModelBuilderBand`)                               | heuristic, not cause-specific                                             |

**Decision:** make the persisted edge the **surfaced, canonical connective primitive on the Analyze reasoning canvas (Model B)** — draw factor→cause edges (from `CausalLink` + the finding's sign), consume `wallLayout.factorPositions` (today a half-wired forward hook, §7), so the band's relevant factors become **asserted, signed, traversable** edges. Reconcile the three: the **Finding remains the persisted evidence-with-sign**; `CausalLink` is the **typed mechanism edge** that belongs to a hypothesis; the band stays the **statistical candidate set**. Do **not** introduce a fourth representation (no `Hypothesis.factorIds` reverse list — derive it). The connective traversal then becomes literal: `process step → factor (ctqColumn) → CausalLink(hypothesisId) → hypothesis → its evidence → back`.

### §4.4 · Zoom + Focus as the navigation + density mechanism

Four distinct, already-shipped (except one) zoom/focus layers carry the navigation:

| Layer                                             | Role                                                                                 | Status                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Altitude zoom L1→L2→L3 (8f viewport)              | Outcome → Process flow → Local mechanism (a step's local `y=f(x)`)                   | shipped                                           |
| LOD-by-zoom on Wall cards                         | zoom out → glyph (`<0.3`) → header (`<0.6`) → full; drops the chart slot at low zoom | shipped (`HypothesisCard.tsx`)                    |
| Focus lens (DOI dimming)                          | click a cause → it + its factors + edges stay vivid, siblings dim                    | shipped (`wallFocus.ts`)                          |
| Semantic factor-family clustering + edge bundling | zoom out → factors collapse into families                                            | **deferred** (keep deferred; not required for V1) |

Zoom is the laptop density valve (rule 8): zoom out for the overview (glyphs, no charts), zoom in to one cause/step for full detail. The Model B canvas tunes the Focus lens to **domain-weighted** relevance.

### §4.5 · The hypothesis-targeted Measure⇄Analyze loop

New data is collected **to test a specific hypothesis** and must **join onto existing data** — the DCP loop. The model encodes the first half (`MeasurementPlan.hypothesisId` is required; `packages/core/src/measurementPlan/types.ts`); grounding found the closure partially deferred:

- ✓ **Shipped:** Measurement Plan is hypothesis-bound; IM-3 auto-link (`useReingestAutoLink`) matches a new column → Finding → advances the **Plan** status; `processLocation` join key.
- ◐ **Partial:** the merge (`mergeRows` / `mergeColumns`) mutates `rawData` + re-validates but does **not** re-evaluate findings/hypotheses/conditions; append preserves without rematching; replace orphans (the IM-3 cascade is **plans-only**).
- ✗ **The gap:** the new evidence does not **re-score the hypothesis it was collected for**. "Data arrived but the cause didn't update" reads as a trust bug to an MBB.

**Decision:** V1 closes the loop **narrowly** — on re-ingest, the auto-linked typed Finding (support/counts-against) re-scores **only the plan's hypothesis** via `deriveHypothesisStatus`. This is deliberately _not_ the full re-evaluation: the broader replace-re-evaluate cascade across _all_ scopes/conditions/findings (the "Partial" gap above) stays a named follow-up (§12 Q5), not silently dropped. New columns surfacing in the framing ChipRail (§5) is the manual fallback when auto-match misses.

### §4.6 · The downstream where-from / where-to (Improve · Control · Report)

The active-IP cascade is shipped and functional (`useActiveIPContext`, `Editor.tsx:633`). Grounded gaps to close so the spine reaches the end:

- **No Finding→Action linkage** — `Finding.actions[]` exist but don't feed `IP.metadata.actions`; wire the promotion.
- **`IP.sections.investigationLineage.findingIds` is never populated by any UI gesture** — only hypothesis-derived findings project to the Report; wire the lineage write.
- **Control-drift has no backlink to its hypothesis** (`Control.escalatedInvestigationId` creates a new hub without linking back).
- **Thread the origin `stepId` (§4.2) through badge navigation** so downstream surfaces render the where-from breadcrumb ("this came from step X") — the counterpart to the focus-on-arrival where-to.

These are the entity-level where-from/where-to edges; each is a small, targeted wire-up, not greenfield — with per-edge acceptance criteria detailed in the PR sub-plans (§14).

---

## §5 · Framing-on-data-load — surgical

The Process tab's load-bearing core is the **framing / column-connection** view, owned by `CanvasWorkspace.tsx` (the `FrameView`s are ~40-LOC shells). It is V1-core and **everything downstream depends on it**, so it is refined, not rebuilt.

### §5.1 · The two surfaces + the assignment machinery

- **`scope` gate** (`detectScopeFromMap`, `scopeDetection.ts`): **b0** (0 nodes) → `FrameViewB0` (the "what's your Y?" Y/X picker); **b1/b2** (1+ nodes) → the inline EditMode shell (Palette ChipRail + Outcome/Factor/Process zones). Adding the first step auto-flips b0→b2.
- **Two assignment stores, bridged by the chips:** Y/X roles → `projectStore.outcome / factors` (`projectStore.ts:116-117`, what Explore reads); rich-map roles → `canvasStore.canonicalMap` (`assignments` / `tributaries` / `ctqColumn`, `canvasStore.ts`); factor controls → `IP.goal.factorControls`.
- **The dual-write persist seam:** `canvasStore.canonicalMap → persistCanvasStoreMap (CanvasWorkspace.tsx:1037) → processContext.processMap` (live) **and** `→ buildCanvasSnapshot → hub.canonicalProcessMap` (`documentSnapshot.ts:223`, durable). A hydration-signature guard prevents a clobber loop.

### §5.2 · Re-ingestion handling

New columns appear **silently in the ChipRail** (`deriveUnassignedChips` excludes anything already in `map.assignments`); there is no re-framing modal. The IM-3 auto-link cascade (§4.5) is a **separate** reaction to the same `rawData` change — it matches new columns **against Measurement Plans only** (`matchColumnsToPlans`) and never reads or writes `map.assignments` / the ChipRail. (This is distinct from the Wall's _focal-step filtering_, which **reads** the ProcessMap — seam 6 below; the two never feed back.) V1 keeps this clean separation; a ChipRail redesign must not entangle them.

### §5.3 · The six load-bearing seams (do not break)

1. The **b0/b1 scope gate** (`CanvasWorkspace.tsx:1327`).
2. The **dual-write persist seam** + hydration-signature guard (§5.1).
3. **`projectStore.outcome/factors` as Explore's Y/X** (`EditorDashboardView.tsx:121`) — the b0 picker is the only writer; moving it without rewiring nulls Explore regression.
4. The **two DndContexts** (column→zone drops vs chip→step drops) — merging them risks dropped/double events.
5. **Chip drag-vs-click coexistence** — the same chips carry drag-to-assign (writes the map) and click-to-Explore (`onChipExploreJump` → `analysisScopeStore`). Preserve both gestures on one element.
6. **ProcessMap as the focal-step filtering contract** (`getStepColumnAssignments`, `conditionReferencesStep`) — **read** by the Wall + L3 focal views (one-way; they never write the map). _Note:_ the IM-3 auto-link does **not** read the map — it matches Measurement Plans (§5.2); only the focal filtering reads ProcessMap.

### §5.4 · The architectural seam to note (not fix in V1)

Explore's Y/X (`projectStore`) and step-filtering/auto-link (`ProcessMap`) live in **different stores**, bridged only by the chips. This duplication is a known seam. V1 **preserves** it (reconciling it is high-risk and out of scope); the design records it so a future store-consolidation has a starting point.

---

## §6 · PWA ↔ Azure parity

**Principle:** the _analysis_ surfaces are identical in PWA and Azure, so a free-PWA learner upgrades seamlessly. Azure adds **only** collaboration · CoScout · cloud persistence + SSE sync · audit/sign-off. **Mobile = focus-only (ADR-086) is a _device_ distinction, not a tier one** — PWA-on-laptop targets full parity.

**Parity gaps grounding found (accidental drift — this spec must decide each):**

| Gap                                    | Today                                                                  | Decision                                                                                                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA Analyze has **no Evidence Map**    | `AnalyzeView.tsx` "Map" toggle renders `FindingsLog`                   | Bring the Evidence Map to PWA Analyze at parity — **Layer 1 (statistical) always**; **Layers 2/3 under the same gate Azure already uses** (not forced on PWA, not Azure-exclusive). |
| **click-to-Explore is a no-op in PWA** | `onChipExploreJump` undefined in PWA `FrameView`                       | Wire it (mirror the Azure block) — the connective spine (§4.1) requires it in both.                                                                                                 |
| **disconfirmation omitted from PWA**   | `onRecordDisconfirmation` Azure-only → PWA can't reach top status tier | Wire it in PWA (the Measure⇄Analyze loop and the disconfirmation gate are V1-core, not paid).                                                                                       |
| **ScopeRail Azure-only**               | multi-scope nav absent in PWA                                          | Bring to PWA (parity) — scope navigation is analysis, not collaboration.                                                                                                            |

Each parity fix is **targeted wiring of what Azure already has**, not new design. Where a surface is genuinely Azure-only, the spec states it explicitly (collaboration roster, CoScout panel, signoff) so "Azure-only" is never accidental again.

---

## §7 · Cleanup — resolve the partial-implementation debt

A dead-code audit (grep-backed) confirmed a **focused** debt (not rot): the ADR-086 unification was scoped but only partly built, so the old "glued" surfaces stayed live while the ADR claims them superseded.

### §7.1 · Resolve the ADR-086 unification debt (the core)

- `CanvasWallOverlay` (`Canvas/internal/CanvasWallOverlay.tsx`, mounted `Canvas/index.tsx:661`) and `LocalMechanismView` (`Canvas/internal/LocalMechanismView.tsx:280`, mounted `CanvasLevelRouter.tsx:173`) are the "glued, not unified" surfaces ADR-086 §Consequences claims were superseded. **They are still mounted and reachable** because the replacement was never finished (`wallLayout.factorPositions` empty in production; `kind:'factor'` edges never drawn).
- **Decision:** Model B **finishes the unification** — draw the factor↔hypothesis edges (§4.3, consuming `factorPositions`), then **retire `CanvasWallOverlay` + the `LocalMechanismView` embedded overlay**, and **amend ADR-086** to describe the delivered state (see §11). **Phasing:** this retirement is **Phase 2** (it rides Model B), _not_ Phase 1 — only the §7.2 zero-risk orphans are Phase 1. Until Model B lands, the ADR's "superseded" language is **retracted now** (drift-now) so docs stop claiming a state the code lacks.

### §7.2 · Delete the orphans (zero-risk)

- **`questions` / `CanvasOverlayQuestionItem`** — always-empty post-ADR-085 cargo that renders dead "Question:" buttons (`useCanvasAnalyzeOverlays.ts:106`; `CanvasStepOverlay.tsx:259,284`). Delete the field, type, re-export, and dead branches.
- **`NarratorRail`** (`AnalyzeWall/NarratorRail.tsx`) and **`DroppableGateBadge`** (`AnalyzeWall/DroppableGateBadge.tsx`) — built, exported, tested, **never mounted**. Delete (component + export + test).
- **Dead `kind:'factor'` edge emission** (`wallLayout.ts:253`) — either consume it (Model B draws the edges) or trim it; do not leave it implying a wired feature.

### §7.3 · Retire the decided-away response-path CTAs

The 3-CTA canvas-drill "response paths" (wedge §3.3.4) were **superseded by Click-to-Explore** (2026-05-28 spec D4). Like the glue, they may still be in code undeleted (`responsePathCta.ts` + Canvas step-overlay CTAs, tested 2026-05-25, before the supersession). **Decision:** retire the leftover response-path CTAs; the canvas's affirmative purpose is **Click-to-Explore + inline capture-as-Finding**, not a branching CTA menu. (The `ProcessHubCurrentStatePanel` response-path actions go named-future with the current-state panel, §2/§9.)

---

## §8 · Net-new vs reused vs deleted

| Area                       | Reused (shipped substrate)                                                            | Net-new                                                                                       | Deleted                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Shared scope (Model A)     | `analysisScopeStore`, Process↔Explore bridge                                          | persistent chip in chrome; highlight coordination; Analyze subscription; IP-scope reset       | —                                                                                              |
| Reasoning canvas (Model B) | `WallCanvas`, `CausalLink`, Focus lens, `wallLayout`, `ModelBuilderBand`, `ScopeRail` | bipartite factor↔cause edges; domain-weighted DOI; minimap polish; 3-representation reconcile | `CanvasWallOverlay`; `LocalMechanismView` embedded overlay                                     |
| Connective spine           | cross-surface badges; `useActiveIPContext`                                            | findings-on-step; focus-on-arrival; origin `stepId`; Finding→Action + lineage wires           | `quick-actions` stub                                                                           |
| Measure⇄Analyze            | `useReingestAutoLink`, Measurement-Plan DCP                                           | re-evaluate the targeted hypothesis on re-ingest                                              | —                                                                                              |
| Framing-on-load            | `CanvasWorkspace`, `canvasStore`, b0/b1                                               | refine (preserve the 6 seams)                                                                 | `ProcessMapBase` (deprecated wrapper)                                                          |
| Parity                     | Azure Evidence Map / click-to-Explore / disconfirmation / ScopeRail                   | wire each into PWA                                                                            | —                                                                                              |
| Cleanup                    | —                                                                                     | —                                                                                             | `questions` cargo; `NarratorRail`; `DroppableGateBadge`; dead factor edges; response-path CTAs |

---

## §9 · The follow-up — Process-as-operations extraction (separate spec)

A separate, holistic design owns un-mounting the named-future cadence layer (`ProcessHubReviewPanel` + cadence questions/queues + state-items + current-state panel) and **disentangling the V1-coupled bits fused into it** — the **Control region**, **Survey/Inbox**, and the **click-to-Explore wiring**. Two guardrails carried from grounding: keep the cadence→analysis direction **one-way** (the new monitoring surface must not push state back into the analysis stores), and **preserve the `onPlansChanged` nonce-bump** (a UI-refresh hook, load-bearing for plan-status advance, not a cadence dependency). Logged in `decision-log.md` + `investigations.md` so it stays in main.

---

## §10 · Holistic doc-layer propagation (first-class scope)

Per SDD, this spec's `implements:` obliges amending the doc layers. Documentation moves **with** the code, not as an afterthought. Each site is **drift-now** (safe on main independent of the build) or **apply-phase** (lands with its PR).

### L1 · Vision

| Doc              | Change                                                        | When        |
| ---------------- | ------------------------------------------------------------- | ----------- |
| `positioning.md` | the connective surface model + the PWA↔Azure parity principle | apply-phase |
| `methodology.md` | the where-from/where-to spine; factor↔cause via `CausalLink`  | apply-phase |

### L2 · Journeys

| Doc                                           | Change                                                                                                                                                                                                                                   | When                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `ia-nav-model.md`                             | §56 "Explore scopes canvas to the IP's source hypothesis" is **stale** → document Click-to-Explore + shared scope; §123 Process-tab description ("State mode panels") is **anachronistic** → "map-as-index + framing + connective links" | drift-now (stale) / apply-phase (new) |
| `personas/lead.md`, `member.md`, `sponsor.md` | weave in the connective pathways (step→finding→hypothesis), the disconfirmation gate, the Measurement-Plan loop — **silent today**                                                                                                       | apply-phase                           |
| **NEW** journey                               | the connective-navigation walkthrough (the where-from/where-to story end-to-end)                                                                                                                                                         | apply-phase                           |

### L3 · Features

| Doc                                                | Change                                                                                   | When        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------- |
| `workflows/investigation-surface.md`               | the bipartite reasoning canvas (Model B), the surfaced `CausalLink` edge, the Focus lens | apply-phase |
| **NEW** `03-features/.../process-tab.md`           | the Process tab = map-as-index + framing + connective links (post-Decision-0 identity)   | apply-phase |
| **NEW** `03-features/.../connective-navigation.md` | the shared-scope spine + the where-from/where-to paths + the parity matrix               | apply-phase |

_Inbound links (doc-gate ≥1 each, added on the same apply-phase PR):_ `process-tab.md` ← `ia-nav-model.md` (Process-tab section); `connective-navigation.md` ← `ia-nav-model.md` + `USER-JOURNEYS.md`; the new connective journey ← `02-journeys/index.md`.

### L4 · Engineering

| Doc                         | Change                                                                                                                                     | When        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `packages/stores/CLAUDE.md` | correct the stale "SuspectedCause is a first-class entity" claim (it is `Hypothesis`); document the `analysisScopeStore` IP-scope contract | drift-now   |
| `mental-model-hierarchy.md` | the four zoom/focus layers (§4.4)                                                                                                          | apply-phase |

### L5 · ADRs

- **Amend [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md)** — retract the "superseded `CanvasWallOverlay`/`LocalMechanismView`" language now (drift-now), and describe the delivered bipartite state when Model B lands (apply-phase). See §11.
- **Consider a new ADR** for the connective surface model (Model A spine + Model B contained canvas + the laptop rules) if it warrants a durable decision record beyond this spec.

### Canonical anchors + logs

`OVERVIEW.md`, `USER-JOURNEYS.md`, `DATA-FLOW.md`, `llms.txt` refreshed for the connective model + Decision 0; `decision-log.md` gets Decision 0 + the parity principle + the follow-up; the `connective-surface-redesign` `investigations.md` entry is closed (promoted to this spec) and the follow-up logged.

---

## §11 · ADR touchpoints

| ADR                                                                                                                                                                               | Action                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md)                                                                                                             | Amend: retract premature "superseded" language; record Model B as the delivered unification (Wall-as-bipartite-canvas, Focus lens, `CausalLink` edges; ACH matrix dropped; flat scopes). |
| [ADR-082](../../07-decisions/adr-082-wedge-architecture.md)                                                                                                                       | Reference for Decision 0 (process-as-operations → named-future is the wedge's stated deferral).                                                                                          |
| [ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md) / [ADR-074](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md) | Binding (§3.4); no amendment.                                                                                                                                                            |
| **(maybe) new ADR**                                                                                                                                                               | The connective surface model + laptop rules, if a durable record is warranted.                                                                                                           |

---

## §12 · Open questions (resolved per-PR; graduate to decision-log when locked)

1. **Evidence Map on PWA-laptop** — confirm §6's resolution (Layer 1 always + Layers 2/3 under Azure's existing gate, rather than forcing full 3-layer on PWA).
2. **Highlight vs filter default per surface** — confirm the per-surface Filter/Highlight/None set and the default (lean: highlight-default everywhere).
3. **`CausalLink` edge authoring gesture** — "promote a band factor onto a cause" creates a `CausalLink`, or routes through capture-as-Finding? (lean: a `CausalLink` with `findingIds` so the sign still lives on a Finding — single source of truth.)
4. **Scope desync across the 3 satellite popouts** — adopt JMP's "selection changed" nudge + Reset + a serializable scope predicate (lean: yes).
5. **Re-evaluate cascade depth** — V1 re-scores only the targeted hypothesis (§4.5); confirm the full replace-re-evaluate cascade stays a named follow-up.

---

## §13 · Verification — how we'll know V1 works

- **Connective spine:** from a Process step, see its **findings** in the badges → click a hypothesis badge → land in Analyze **with that hypothesis focused**. End-to-end, both apps.
- **Shared scope:** set a scope on Explore → Process + Analyze **highlight** the same subset without reflow; switch active IP → drill state **resets** (no bleed).
- **Factor↔cause edge:** a `CausalLink` with `hypothesisId` renders as a **drawn, signed edge** on the Analyze canvas; `CanvasWallOverlay`/`LocalMechanismView` overlay is gone.
- **Measure⇄Analyze:** add data for a hypothesis's Measurement Plan → re-ingest → the auto-linked Finding **re-scores that hypothesis** (status advances), not just the plan.
- **Parity:** the PWA analysis surfaces (Evidence Map, click-to-Explore, disconfirmation, ScopeRail) match Azure; only collaboration/CoScout/cloud/audit differ.
- **Laptop:** every layout verified on a 13–15″ viewport with `--chrome`; no scrunch/scrollbars; ≤3 co-visible surfaces.
- **Cleanup:** grep confirms `questions` cargo / `NarratorRail` / `DroppableGateBadge` / response-path CTAs are gone; ADR-086 no longer claims an un-built state.
- **ADR-073:** `architecture.noCrossInvestigationAggregation.test.ts` + `check-level-boundaries.sh` green; no inline chart rolls up across units.
- **Docs:** doc-validation hook clean; the L1–L5 + anchor amendments land with their PRs (no orphan/stale refs).

---

## §14 · Delivery sequencing (high level — master plan to follow)

Phased so the quick wins ship before the one big rock:

1. **Phase 1 (ship value, lower risk):** Model A shared-scope spine + chip + highlight + IP-scope fix · the connective-spine wires (findings-on-step, focus-on-arrival, origin stepId, Finding→Action + lineage) · the PWA parity fixes · the §7.2 orphan cleanup + §7.3 response-path retirement.
2. **Phase 2 (the big rock — Opus-grade):** Model B reasoning canvas — bipartite `CausalLink` edges, domain-weighted Focus lens, retire the `CanvasWallOverlay`/`LocalMechanismView` glue, reconcile the 3 representations + the §7.1 ADR-086 finish.
3. **Phase 3 (parallelizable):** framing-on-load refinement (surgical) · the Measure⇄Analyze hypothesis re-score · the holistic doc propagation (§10) per-PR.
4. **Follow-up (separate spec):** the process-as-operations extraction (§9).

Promoted via `superpowers:writing-plans` → a master plan at PR granularity → per-PR sub-plans (`feedback_master_plan_for_multi_subsystem_specs`); subagent-driven-development; each PR amends its nearest docs in-PR.
