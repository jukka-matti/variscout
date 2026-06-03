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

The wedge pivot (2026-05-16) set strategy + nav over ~6 weeks of pre-wedge accreted code; the IM/FE rebuild then rebuilt the investigation core. Neither went surface-by-surface deciding **what each surface _is_ in V1** and **how you move between them**. The result: "is this V1?" keeps recurring, several surfaces are partial old-model answers to an un-designed question, and a unification (ADR-086) was scoped but only partly built. This spec settles five things:

1. **The V1 boundary** — re-derived from the value prop, not inherited from "what was built minus the explicit cuts" (§2).
2. **The Process tab, holistically** — what the surface _is_ as one coherent **orient → dive** design, with the per-step capability view (§2A) — the original "what IS the Process tab?" question, finally answered.
3. **The connective surface model** — how Process, Explore, and Analyze coexist on a **laptop** (§3), and the **where-from / where-to navigation spine** that links every entity across Frame ↔ Explore ↔ Analyze ↔ Improve ↔ Control (§4).
4. **Framing-on-data-load** — the entry experience, treated surgically because it is V1-core and delicate (§5).
5. **Parity + cleanup + docs** — PWA↔Azure parity (§6), the partial-implementation debt (§7), and the holistic documentation propagation (§10).

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
| **Tool assists, analyst decides**                                                                                             | Deterministic stats = authority; CoScout (Azure) = interpretation assist; the analyst makes every support / counts-against / status call by explicit gesture. The tool tallies + suggests; it never concludes (§4.0).                                 |

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

## §2A · The Process tab — holistic V1 design

Decision 0 settled the Process tab's _identity_ (the map + framing); this section designs it as **one coherent surface**, finally answering "what IS the Process tab, holistically." Grounded by a complete mount-tree inventory (the Capability tab and band-structure were previously un-examined).

> **Grounding correction (CS-P1, 2026-06-03) — two surfaces, not one.** A full mount-tree sweep found this section conflates two distinct App views. The user-facing 7-tab **"Process" tab** is the editor canvas (`FrameView → CanvasWorkspace`, `App.tsx` view `editor`) and **already ships the L1/L2/L3 orient spine** — L1 `SystemLevelView` "are we capable?" renders Cp/Cpk/conformance/target from the outcome spec; "establish L1/L2/L3 as the spine" is ~90% a terminology change (the "3-band Layered Process View" is grep-confirmed never built). The cadence/Status rollup, the Status/Capability two-tab, the empty temporal row, and the per-step capability 2×2 all live in the **portfolio Dashboard's `ProcessHubView`** (`Dashboard.tsx:814`, `App.tsx` view `dashboard`) — a _different_ view, never co-rendered with the canvas. So §2A's "one coherent Process tab = canvas + per-step capability" describes a surface that does not exist today; unifying them is a cross-view lift. The per-step capability **distribution** also needs authored per-step specs (CS-P3), so it is empty for real users until then. **CS-P1 is therefore foundation-only** (Dashboard-side shed/collapse/hide + editor-side term affirmation); the per-step capability lands on the editor canvas in **CS-P2** (retiring the Dashboard 2×2) once **CS-P3** authoring makes it non-empty. Two more corrections: the "click-to-Explore chip" keep here is a misidentification — the V1-protected Click-to-Explore is the editor-canvas pattern (CS-5/CS-7), untouched; the Dashboard `ProcessHubReviewPanel.onChipClick` (→ evidence sheet) is part of the named-future current-state panel. And `ProcessHubControlRegion` is nested _inside_ `ProcessHubCadenceQueues:338`, so hiding the cadence rollup requires lifting Control out first (the one place CS-P1 brushes the §9 extraction). Logged in `decision-log.md` §3.

### §2A.1 · The job — orient → dive (each level answers one question)

The Process tab is **not a passive map** and **not** a copy of Explore. Its job is to **frame the investigation, orient (is there a problem · where), and launch the dive:**

```
FRAME (set up the map + connect columns) → L1 "are we capable?" → L2 "which step?" → drill a step → EXPLORE (the data) ⟷ ANALYZE (the causes)
```

- **L1 — "are we capable?"** the framed outcome vs target (Cpk vs target) — _is there a problem?_ First-class (the entry to the whole loop), not just a header pill.
- **L2 — "which step is the problem?"** the per-step view (§2A.3) — _where?_
- **drill → Explore** — the deep dive on that step's data; the Process tab _orients_, Explore _dives_. Clean handoff: which-step → its-data → its-causes.

**Spatial spine:** the **8f canvas L1/L2/L3 zoom** (Outcome → Process-flow → Local-mechanism) is the V1 spatial model. The "**3-band Layered Process View**" was **never built as a component** (grep-confirmed) — retire the term; do not resurrect a band concept.

### §2A.1a · The orient surface — coherence-hardening (from the 2026-06-02 user-POV pass)

A user-POV coherence walk found the forward path works but the Process tab fragments into stacked paradigms (edit-canvas · altitude-zoom · statistical-grid) with a few unannounced seams. This hardens it:

- **"Where do I look first?" has two signals, both in the orient view:** _which **step**_ (the per-step capability / weakest-link + cycle-time, §2A.2–3) **and** _which **factor**_ (the best-subsets guide). **Decision (resolves §12 Q6):** the **global best-subsets "watch these factors" guide lives in the orient view, surfaced right after framing** — "of your assigned factors, watch these first." The per-scope re-rank stays in Analyze (settled). This gives the framing moment its first-class attention guide.
- **Disambiguate the two "factor selections"** (they collide today): **(1) role assignment** — _which columns ARE my factors / steps / outcome_ (framing; `projectStore.setFactors` + the `canvasStore` map). **(2) factor screening / attention guide** — _which assigned factors statistically matter_ (best-subsets). Spec + UI say "**role assignment**" (framing) and "**factor screening**" (best-subsets) — never the bare "factor selection."
- **Make the b0→b1→orient transition explicit.** Adding the first step silently swaps `FrameViewB0` for the canvas — the mental model changes (pick-outcome → drag-onto-a-map → orient) unannounced. Add a **light transition affordance** ("your process is set — here it is at a glance"), so framing visibly hands off to the orient view.
- **One way out, always scoped.** The plain "**See the data**" path must carry scope (today only chip-clicks do — `FrameView.handleSeeData` calls `showExplore()` with no `analysisScopeStore` mutation). Seed the scope from `projectStore.outcome` on every Process→Explore transition (§4.1) so the user never lands in an unseeded Explore.

> **Coherence prerequisite — scope must become durable.** The connective story assumes the drill produces a first-class `ProblemStatementScope`, but grounding found **the drill never becomes one** (the `buildConditionFromCategoricalFilters → createProblemStatementScope` bridge has **zero live callers**; capture-as-Finding still snapshots legacy `projectStore.filters`) — even though IM-4 read as "delivered." Plus `analysisScopeStore` is **not IP-keyed** (bleeds across IPs, lost on reload). **Wiring the drill → a durable, IP-keyed scope is a prerequisite** the connective spine (§4) and the orient→dive handoff depend on (master plan **PR-CS-0**). _(The dual `projectStore` vs `canvasStore` assignment seam, §5.4, stays a known-acknowledged risk, preserved for V1.)_

### §2A.2 · "Which step is the problem?" — two honestly-different axes, no leaderboard

Same question, **two distinct concepts** — never conflated (the grounding confirmed they are separate analyses over a shared step spine):

| Axis                                     | What it is                                                                                                                             | Rankable?                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Cycle-time bottleneck**                | a _flow constraint_ — the slowest/lowest-throughput step caps the line (Theory of Constraints; relieve it → the whole flow speeds up). | always (`computeBottleneck` → lowest rate) |
| **Worst-capability step (weakest link)** | the _least-capable_ step (worst Cpk vs its own spec) — where the quality problem _concentrates_. Not a constraint; it does not "move." | **often not** (see below)                  |

**No ranking leaderboard.** The "which step" answer is **visual**: the per-step **boxplot** (§2A.3) — the worst step's box is visibly wide / off-center / spilling its spec — and the analyst's eye finds it (methodology.md: _"the analyst's eye does the pattern recognition"_). Forcing a Cpk rank fights ADR-073: when a step's contexts resolve to **different specs**, there is deliberately **no single sortable Cpk** (`nodeCapability.ts` leaves the node scalar undefined → show the per-context distribution). What _does_ rank legitimately: **counts** (the existing **step error Pareto** — keep as-is) and **time** (a light "this is the constraint" highlight, not a leaderboard).

### §2A.3 · The per-step view — connected boxplot, Values⇄Capability, own-values harmonized scale

**Connected to the flow, not a separate dashboard.** A per-step boxplot's x-axis _is_ the process steps — so the world-class layout puts the **process flow as the axis**: each step's box sits at/under its node; the worst is visibly loud. The map node carries a **light capability flag** (the at-a-glance pointer); the aligned box carries the **distribution**. For a **branching** map (tributaries), keep map + a capability strip as **two linked views with coordinated highlight** (the Model A linked-panels pattern, _inside_ the Process tab). This replaces the current decoupled Production-Line-Glance 2×2 panel (which re-creates the accretion feel).

**Values ⇄ Capability toggle** (the same toggle as Explore, for consistency):

- **Capability angle** — per-step **Cpk** vs each step's target. Unitless → the only honest _cross-step_ compare.
- **Values angle** — each step's **own real values** with its **spec/target drawn on the box** (readable: "498 g"). Made cross-step-comparable by **own-values harmonized scaling** (below).

**Own-values harmonized, spec-aware scaling (a distinctive VariScout viz — design principle):** keep each step's **real values** (readable — _not_ pure ±1 normalization, which hides the numbers), but make the y-scale **dynamic and harmonized relative to the others** so heterogeneous units (weight vs temperature) compare: the **spec window is drawn at a common visual height** across steps (the yardstick), so a box _filling and spilling_ its spec reads instantly as "too wide." The **baseline is spec-type-aware** (not "always 0"):

- **Two-sided spec (target ± limits)** → anchor to the **spec window** (0 would compress it to a sliver).
- **One-sided toward 0 / ratio quality** (impurity, defect rate) → **start at 0**.
- **Cycle-time** → **always 0** (ratio scale).

The exact tick/scale mechanic is tuned at build and **verified on a 13–15″ viewport with `--chrome`** (laptop rule 12).

### §2A.4 · Heterogeneous per-step data + specs at framing

Each step owns its **own CTQ + its own spec** — the data model is an **array of `ProcessMapNode`** (`frame/types.ts`), never one global measure:

- **`ctqColumn`** per node — the measure, assigned at framing via `canvasStore.setStepCtq` (built).
- **`capabilityScope.specRules`** — a sparse, **context-indexed** `SpecRule[]` (most-specific-match, `specRuleLookup.ts`); `calculateNodeCapability` computes per-`(node × context-tuple)` Cpk (the anti-aggregation engine — built). Cpk target cascades spec → hub → investigation → 1.33 (`resolveCpkTarget`, built; hub-level `CpkTargetInput` authorable today).
- **`StepTimingBinding`** per step (paired start/end or duration) for the time axis — built; `computeBottleneck`/`computeOutputRate` already run.

> **Net-new (the gap is authoring + viz, not engines):** the **per-step spec-authoring UI** does not exist (deferred IM-0b-2 — only fixtures populate `specRules`); tributary `contextColumns` authoring is unbuilt; the **cycle-time visualization** is deferred (the engine runs but renders nothing); and **per-step time _specs_ do not exist** (a net-new analog to `capabilityScope` if "Cpk-of-time / cycle-time targets" is wanted). So this section's build is mostly **UI on top of shipped engines**.

### §2A.5 · What V1-core / net-new / sheds

- **V1-core (keep):** the canvas (CanvasWorkspace + L1/L2/L3 + framing/column-connection) · the **per-step capability spatial row** (`CapabilityBoxplot` + `StepErrorPareto`, re-homed as the connected per-step view) · cross-surface badges (§4.2) · outcome pill.
- **Net-new (UI on shipped engines):** the connected per-step boxplot + harmonized scaling + Values⇄Capability toggle; the per-step **spec-authoring UI**; the **cycle-time viz** (per-step time view + light bottleneck highlight); the L1 "are we capable" first-class element.
- **Sheds → named-future:** the cadence/Status rollup (`ProcessHubReviewPanel`: Active/Readiness/Verification/Overdue) — a **portfolio dashboard, not a process-map surface** (strengthens Decision 0; the **Status/Capability two-tab collapses**); the empty Capability **temporal row** → hidden (don't ship blank slots, `feedback_hidden_vs_disabled_cta`).

### §2A.6 · Parity

The Process tab + per-step capability are **Azure-only today** (PWA has the canvas but no `ProcessHubView`). Per §6, the per-step capability **comes to PWA** (it is analysis; the learner should transfer). The cadence/Status rollup does not (it's named-future regardless).

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

### §4.0 · The analytical flow — tool assists, analyst decides (the heart of the product)

This is the product's centerpiece and the principle that governs the whole investigation surface: **the deterministic stats engine runs the analysis; CoScout assists interpretation; the analyst makes every judgment.** The tool tallies and _suggests_ — it never concludes.

**Three layers:**

| Layer                            | Role                                                                                                                                                   | Tier        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| **① Deterministic stats engine** | runs boxplot · 2-sample · scatter/regression · best-subsets · Cp/Cpk — reproducible, the authority                                                     | PWA + Azure |
| **② CoScout**                    | interpretation partner — helps _read_ a result, adds context, drafts finding wording, points to what to test next; minimal nudges, never interruptions | Azure-only  |
| **③ The analyst**                | makes the explicit _supports / counts-against / settled_ call and owns every conclusion                                                                | PWA + Azure |

CoScout **can** suggest an interpretation; it **cannot** make the call, set/bump status, or count data-arrival as evidence. This honors "deterministic stats engine is authority; CoScout adds context" and keeps the analyst's judgment sovereign.

**The unit + the layering (cause-vs-hypothesis, resolved).** The unit the analyst captures is a **Finding — a specific `{factors = levels + filters}` condition**, discovered through **Explore's variation + visuals** (the charts guide the analyst to _where_ the problem lives — night shift, Machine B ∩ Product X). The clean layering: **factor** (an associated observable — what the data surfaces) → **hypothesis / cause** (the analyst's _mechanism_: why does it matter?) → **evidence** (the test result). A factor is _associated_ with the outcome, never a proven cause (contribution, not causation); the analyst turns a factor into a cause by proposing the mechanism. factor↔hypothesis is therefore **Finding-mediated** (the condition involves factors and links to the hypothesis); `CausalLink` is an _optional richer layer_ (§4.3), not the primary edge.

**Best-subsets regression is the attention-guide.** `ModelBuilderBand` / `computeBestSubsets` + `selectVitalFew` (vital-few with adjusted R² · per-factor p · ΔR² · VIF; analyst-controlled — toggle, snap-back, capture-as-Finding) answers _"which factors should I watch?"_ It **directs where the analyst looks; it does not name causes.** Two placements: a **global guide** near Frame (_"watch these factors first"_ — placement/UX is **advanced design**, §12 Q6) and a **per-scope re-rank in Analyze** (_"now which factors matter inside this drilled scope?"_, fitting the recursive `y=f(x)` / Progressive Sharpening). It is generative + screening — a director of attention, never evidence-on-a-cause and never a verdict (the ΔR² ranking is _association strength_, not "which cause matters").

**Evaluating a cause (the convergent node).** For a hypothesis's relevant factors, the tool hands the analyst the **right stat by data type** (the FE-2 test triad): _categorical → boxplot + 2-sample · continuous → scatter + regression · spread → Cp/Cpk_. The analyst runs it, **sees the actual chart**, makes the explicit support/counts-against call → a **typed Finding**; the test is also the disconfirmation ("try to break it" = the same gesture). These charts live **in the reasoning flow** — summoned onto a focused hypothesis, riding the Focus lens / LOD so they're not always-on (laptop-friendly). _Same chart engine as Explore, summoned as evidence on a cause._ This is the **convergent node of the investigation loop (§4.0a)** — it is not, by itself, the whole Explore-vs-Analyze resolution; the loop is.

**Status is analyst-owned (decided 2026-06-02).** The 5-state lifecycle stays — `proposed → evidenced → needs-disconfirmation → Supported / refuted` — but the **analyst sets it**. `deriveHypothesisStatus` (`survey/wall.ts:24`) is **demoted from an auto-gate to a soft suggestion** ("2 evidence types + a survived test — mark Supported?"): it surfaces the triangulation + falsification readiness as _guidance_, never auto-applies, and never locks. Re-introduce an analyst-set status (the `setHubStatus` orphan deleted in IM-4c returns, now analyst-owned and the source of truth; the derivation is advisory). Rename the code value `'confirmed' → 'evidence-survived-test'` to match the shipped `'Supported'` label and kill the certainty overclaim. **Delivered 2026-06-03 (PR-CS-10):** analyst-owned `setHubStatus` is the source of truth; `deriveHypothesisStatus` demoted to an advisory suggestion chip (free analyst choice, no gate, never auto-applies); code value `'confirmed' → 'evidence-survived-test'`. Reload-durability free via the DocumentSnapshot round-trip (no IDB migration). The PWA(3-way)/Azure(2-way) conclusion-categorizer divergence is left + logged for a dedicated parity follow-up.

**The boundary, enforced everywhere** (the de-automation list): status is _suggested_, not set; the re-ingest auto-link becomes an **analyst-confirm prompt** keeping only the mechanical column-matching (§4.5); the cluster detector offers a **grouping** ("these findings share factor X") without an R²-ranking implying which cause is "best"; the FE-2 one-tap evaluate stays analyst-triggered with the analyst confirming the verdict; CoScout suggests interpretations the analyst accepts or rejects. _What stays automated is only the genuinely mechanical: the stats themselves, and column→plan matching._

### §4.0a · The investigation loop — Explore ⟷ Analyze (divergent ⟷ convergent)

Explore-vs-Analyze is not "which tab" — it is the **divergent ⟷ convergent rhythm of one cycle**:

```
frame → EXPLORE (divergent: scan · sharpen the WHERE) ⟷ ANALYZE (convergent: test causes, §4.0) → improve → control
```

- **Explore = divergent** — scan the charts openly ("what's going on?") and generate Findings (conditions). Drilling to a condition is the _convergent sub-move_ that sharpens the WHERE (a `ProblemStatementScope`). Best-subsets' global guide points the analyst here first (§4.0).
- **Analyze = convergent** — propose causes (mechanisms) for the scope; test each cause's factors (the §4.0 per-factor node); judge support / counts-against. Best-subsets re-ranks _per scope_ here.
- **The "when" is emergent** — the analyst never declares a phase; **the surface you are on _is_ the phase** (scanning in Explore, testing on a hypothesis card). The shared scope (§4.1) carries context across; CoScout may nudge ("you have a candidate — want to test it?") but never moves you. No wizard, no forced sequence — the analyst drives the rhythm.
- **The crossing-back (the one net-new transition).** Today the gestures run one way: click-to-Explore (Frame→Explore), capture-as-Finding, propose-hypothesis. Net-new: **extend click-to-Explore to fire _from a hypothesis/factor in Analyze_**, carrying its scope — so the analyst can diverge again mid-investigation ("this factor looks like it interacts with shift — let me go look"). That single addition turns the pipeline into a true loop; the re-ingest Measure⇄Analyze cycle (§4.5) is the other iteration.

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

### §4.3 · The factor↔cause connection — Finding-mediated, with `CausalLink` as an optional richer layer

**The typed, persisted factor↔cause edge already ships** — it was mis-recorded as deferred. `CausalLink` (`packages/core/src/findings/types.ts:734`) carries `fromFactor` / `toFactor` / `fromLevel?` / `toLevel?` / `direction` (drives/modulates/confounds) / `findingIds[]` / **`hypothesisId?`** / `strength (ΔR²)`. It is **analyst-creatable** (`addCausalLink`, `analyzeStore.ts:1130`, called from `FrameView.tsx:278/305` and `AnalyzeWorkspace.tsx:993`), persisted via `CAUSAL_LINK_*` HubActions, and rendered in the Evidence Map + Report.

The real issue is **three overlapping representations of "factor relates to cause," never reconciled**:

| Representation       | What it is                                                                                   | Status                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Finding-mediated** | `Finding` (sign: support/counts-against) ↔ `Hypothesis.findingIds[]` / `counterFindingIds[]` | live, primary                                                             |
| **`CausalLink`**     | typed factor edge with `hypothesisId` + sign + ΔR²                                           | live, analyst-creatable, but rendered only in the Evidence Map projection |
| **Derived band**     | best-subsets ranked factors for the scope (`ModelBuilderBand`)                               | heuristic, not cause-specific                                             |

**Decision (corrected per §4.0 — the Finding is the unit).** The **primary** factor↔cause connection is **Finding-mediated**: a `Finding` captures the `{factors + filters}` **condition** (found via Explore's variation + visuals) and links to the hypothesis with a sign — that is the spine, and the Model B canvas draws _those_ links. **`CausalLink` is demoted to an _optional richer layer_**: when an analyst wants to assert an explicit factor-relationship belonging to a cause (carrying ΔR² as _association strength_), it is available as an overlay on the canvas — but it is **not** required and **not** the canonical edge. The **best-subsets band stays the attention-guide / candidate set** (§4.0), never a cause assertion. Do **not** introduce a `Hypothesis.factorIds` reverse list (derive it). So the canonical traversal is `process step → Finding (condition) → hypothesis → its evidence → back`, with the `CausalLink` factor-graph as an optional overlay for analysts who want it. (The Model B build still consumes `wallLayout.factorPositions` to place factors and retires the `CanvasWallOverlay`/`LocalMechanismView` glue — §7 — it just draws Finding-links first, CausalLink edges optionally.)

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

- ✓ **Shipped (mechanical — keep automated):** Measurement Plan is hypothesis-bound; IM-3 (`useReingestAutoLink`) **matches** a new column to a plan via `matchColumnsToPlans` + the `processLocation` join key. Column-matching is genuine plumbing.
- ◐ **Over-reaches into judgment:** the same cascade also **auto-creates a source-less "data arrived" Finding** (stamped `inconclusive` so it doesn't credit evidence) and **auto-bumps plan status** — silent writes the analyst never authored, removing the data-quality checkpoint.
- ◐ **Partial:** the merge (`mergeRows` / `mergeColumns`) re-validates `rawData` but does **not** re-evaluate findings/hypotheses/conditions; append preserves without rematching; replace orphans.

**Decision (de-automated per §4.0):** keep the mechanical matching; **replace the silent writes with an analyst-confirm prompt** — _"the factor you needed for '&lt;hypothesis&gt;' arrived — link it? mark the plan in-progress?"_ The analyst then **runs the stat test on the new data** (the §4.0 per-factor triad), sees the chart, makes the support/counts-against call → a typed Finding → and **sets the hypothesis status** (now analyst-owned, §4.0). So re-ingest _invites_ the analyst to test; it never credits evidence for them. The broader replace-re-evaluate cascade across _all_ scopes/conditions stays a named follow-up (§12 Q5).

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

| Gap                                                 | Today                                                                  | Decision                                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA Analyze has **no Evidence Map**                 | `AnalyzeView.tsx` "Map" toggle renders `FindingsLog`                   | Bring the Evidence Map to PWA Analyze at parity — **Layer 1 (statistical) always**; **Layers 2/3 under the same gate Azure already uses** (not forced on PWA, not Azure-exclusive). |
| **click-to-Explore is a no-op in PWA**              | `onChipExploreJump` undefined in PWA `FrameView`                       | Wire it (mirror the Azure block) — the connective spine (§4.1) requires it in both.                                                                                                 |
| **disconfirmation omitted from PWA**                | `onRecordDisconfirmation` Azure-only → PWA can't reach top status tier | Wire it in PWA (the Measure⇄Analyze loop and the disconfirmation gate are V1-core, not paid).                                                                                       |
| **ScopeRail Azure-only**                            | multi-scope nav absent in PWA                                          | Bring to PWA (parity) — scope navigation is analysis, not collaboration.                                                                                                            |
| **Process tab + per-step capability is Azure-only** | PWA has the canvas but no `ProcessHubView`                             | Bring the per-step capability view (§2A) to PWA — it is analysis; the learner should transfer. The cadence/Status rollup does NOT come (named-future).                              |

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

| Area                             | Reused (shipped substrate)                                                                                             | Net-new                                                                                                                                                                                                                               | Deleted                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Shared scope (Model A)           | `analysisScopeStore`, Process↔Explore bridge                                                                           | persistent chip in chrome; highlight coordination; Analyze subscription; IP-scope reset                                                                                                                                               | —                                                                                                                        |
| Reasoning canvas (Model B)       | `WallCanvas`, `CausalLink`, Focus lens, `wallLayout`, `ModelBuilderBand`, `ScopeRail`                                  | Finding-link rendering on the canvas (+ optional CausalLink overlay); domain-weighted DOI; minimap polish; 3-representation reconcile                                                                                                 | `CanvasWallOverlay`; `LocalMechanismView` embedded overlay                                                               |
| Analytical flow + scoring (§4.0) | best-subsets model-builder; `deriveHypothesisStatus`; FE-2 evaluate; CoScout                                           | analyst-set status + soft-suggestion chip; finish the FE-2 per-factor stat triad; step `FindingSource` + capture affordance                                                                                                           | auto-status-gate-as-authority; R²-ranking on the cluster suggestion                                                      |
| Connective spine                 | cross-surface badges; `useActiveIPContext`                                                                             | findings-on-step (incl. the step `FindingSource` variant); focus-on-arrival; origin `stepId`; Finding→Action + lineage wires                                                                                                          | `quick-actions` stub                                                                                                     |
| Measure⇄Analyze                  | `useReingestAutoLink` (column-matching), Measurement-Plan DCP                                                          | analyst-confirm prompt for the link/plan-bump; analyst tests the new data + sets the status                                                                                                                                           | silent auto-Finding writes + auto-plan-status-bump                                                                       |
| Framing-on-load                  | `CanvasWorkspace`, `canvasStore`, b0/b1                                                                                | refine (preserve the 6 seams)                                                                                                                                                                                                         | `ProcessMapBase` (deprecated wrapper)                                                                                    |
| Process tab (§2A)                | CanvasWorkspace + L1/L2/L3; CapabilityBoxplot + StepErrorPareto; calculateNodeCapability / computeBottleneck (engines) | connected per-step boxplot + own-values harmonized spec-aware scaling + Values⇄Capability toggle; per-step spec-authoring UI; cycle-time viz + light bottleneck highlight; first-class L1 capable element; per-step capability to PWA | Status/Capability two-tab (collapses); empty Capability temporal row (hidden); cadence rollup → named-future (follow-up) |
| Parity                           | Azure Evidence Map / click-to-Explore / disconfirmation / ScopeRail; CoScout (Azure-only, §4.0)                        | wire the 4 analysis gaps into PWA                                                                                                                                                                                                     | —                                                                                                                        |
| Cleanup                          | —                                                                                                                      | —                                                                                                                                                                                                                                     | `questions` cargo; `NarratorRail`; `DroppableGateBadge`; dead factor edges; response-path CTAs                           |

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
3. **`CausalLink` overlay in V1** — is the optional factor-graph overlay (§4.3) worth surfacing in V1, or is Finding-mediated the whole V1 story? (lean: ship Finding-mediated; the `CausalLink` overlay is a candidate defer/cut.)
4. **Scope desync across the 3 satellite popouts** — adopt JMP's "selection changed" nudge + Reset + a serializable scope predicate (lean: yes).
5. **Re-evaluate cascade depth** — V1 has the analyst re-test the targeted hypothesis on re-ingest (§4.5, analyst-owned status); confirm the full replace-re-evaluate cascade across all scopes/conditions stays a named follow-up.
6. **Upstream best-subsets screening placement** — **RESOLVED 2026-06-02 (§2A.1a):** the global "watch these factors" guide lives in the **Process-tab orient view, surfaced after framing** (alongside per-step capability — the "which factor" + "which step" answer to "where do I look first"); the per-scope re-rank stays in Analyze. It directs attention as factor _screening_, never naming causes.
7. **Per-step spec-authoring UI (§2A.4)** — ship the deferred IM-0b-2 `capabilityScope` editor (per-step LSL/USL/target by context) at framing, or hub-default-only for V1? (lean: ship it — "ask the specs" is core to the per-step view.)
8. **Per-step time specs (§2A.4)** — model per-step cycle-time targets (a `StepTimingBinding` analog to `capabilityScope`) for a "Cpk-of-time" view, or keep cycle-time as a raw bottleneck/throughput view only? (lean: raw bottleneck view for V1; time-specs deferred.)

---

## §13 · Verification — how we'll know V1 works

- **Connective spine:** from a Process step, see its **findings** in the badges → click a hypothesis badge → land in Analyze **with that hypothesis focused**. End-to-end, both apps.
- **Shared scope:** set a scope on Explore → Process + Analyze **highlight** the same subset without reflow; switch active IP → drill state **resets** (no bleed).
- **Factor↔cause:** a Finding (condition) renders as a **drawn, signed link** to its hypothesis on the Analyze canvas (the optional `CausalLink` overlay draws when present); the `CanvasWallOverlay`/`LocalMechanismView` overlay is gone.
- **Measure⇄Analyze:** add data for a hypothesis's Measurement Plan → re-ingest → the tool **prompts** "needed factor arrived — link it?"; the analyst runs the stat test, makes the support/counts-against call, and **sets** the status. No auto-bump; no source-less "data arrived" Finding.
- **Parity:** the PWA analysis surfaces (Evidence Map, click-to-Explore, disconfirmation, ScopeRail) match Azure; only collaboration/CoScout/cloud/audit differ.
- **Laptop:** every layout verified on a 13–15″ viewport with `--chrome`; no scrunch/scrollbars; ≤3 co-visible surfaces.
- **Cleanup:** grep confirms `questions` cargo / `NarratorRail` / `DroppableGateBadge` / response-path CTAs are gone; ADR-086 no longer claims an un-built state.
- **ADR-073:** `architecture.noCrossInvestigationAggregation.test.ts` + `check-level-boundaries.sh` green; no inline chart rolls up across units.
- **Docs:** doc-validation hook clean; the L1–L5 + anchor amendments land with their PRs (no orphan/stale refs).

---

## §14 · Delivery sequencing (high level — master plan to follow)

**The analytics centerpiece — the Analyze reasoning canvas (Model B) AND the Process-tab per-step capability view (§2A) — is the destination.** The owner's bar: both are **designed _and fully implemented_ before VariScout is shown to potential customers** (they are the analytics VariScout promotes). Phases 1 + 3 are the runway; Phase 2 is the bar.

1. **Phase 1 — clear the ground + lay the spine (runway):** the §7.2 orphan cleanup + §7.3 response-path retirement + the §7.1 ADR-086 "superseded"-retraction; Model A shared-scope spine + chip + highlight + IP-scope fix; the connective-spine wires (findings-on-step incl. the step `FindingSource`, focus-on-arrival, origin `stepId`, Finding→Action + lineage); the PWA parity fixes; **the Process-tab orient foundation** — the L1/L2/L3 levels as the spine; **shed the cadence/Status rollup → named-future + collapse the Status/Capability two-tab; hide the empty Capability temporal row; re-home the per-step capability spatial row** (§2A.5).
2. **Phase 2 — the analytics centerpiece, built to completion (Opus-grade) — two bodies:**
   - **(a) Model B reasoning canvas:** bipartite `CausalLink` factor↔cause edges + best-subsets factor projection (§4.0/§4.3); **the analytical flow** (per-factor stat triad → see-the-chart → explicit call → typed Finding); **de-automated scoring** (analyst-owned status + soft-suggestion chip; auto-link → confirm prompt; cluster-grouping without ranking; `'confirmed' → 'evidence-survived-test'`); CoScout as interpretation partner; domain-weighted Focus lens + minimap; retire the `CanvasWallOverlay` / `LocalMechanismView` glue.
   - **(b) the Process-tab per-step view (§2A):** the **connected per-step boxplot** (flow = x-axis; light node flag + aligned/linked) + **own-values harmonized, spec-aware scaling** (incl. the baseline rule) + **Values⇄Capability toggle**; the **per-step spec-authoring UI** (§12 Q7); the **cycle-time viz + light bottleneck highlight** (engine exists); the first-class **L1 "are we capable"**; **per-step capability to PWA** (parity). No leaderboard — the boxplot + eye (§2A.2).
   - **Both (a) + (b) are the bar to hit before customer demos.**
3. **Phase 3 (parallelizable):** framing-on-load refinement (surgical, §5) · the holistic doc propagation (§10) per-PR.
4. **Follow-up (separate spec):** the process-as-operations extraction (§9).

Promoted via `superpowers:writing-plans` → the [**master plan** at PR granularity](../plans/2026-06-02-connective-surface-model-master-plan.md) → per-PR sub-plans (`feedback_master_plan_for_multi_subsystem_specs`); subagent-driven-development; each PR amends its nearest docs in-PR.
