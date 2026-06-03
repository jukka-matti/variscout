---
tier: ephemeral
purpose: build
title: 'Connective Surface Model — Master Plan (PR sequencer)'
status: draft
date: 2026-06-02
layer: spec
---

# Connective Surface Model — Master Implementation Plan

> **For agentic workers:** this is a **master sequencer at PR granularity** (per `feedback_master_plan_for_multi_subsystem_specs`). Each PR below gets its **own bite-sized sub-plan** written via `superpowers:writing-plans` **at execution time** (plan-as-you-execute beats plan-all-then-discover-drift), then implemented via `superpowers:subagent-driven-development`. Do **not** treat this file as the task-level plan.

**Spec:** [`docs/superpowers/specs/2026-06-02-connective-surface-model-design.md`](../specs/2026-06-02-connective-surface-model-design.md)

**Goal:** Build the V1 connective surface model — the linked-panels spine (Model A) and the Analyze reasoning canvas (Model B, the centerpiece) — on cleared ground, with the analytical flow (tool assists, analyst decides), PWA↔Azure parity, and holistic doc propagation.

**Architecture:** Phase 1 clears the partial-implementation debt and lays the shared-scope spine + connective wires + parity (the runway). Phase 2 builds Model B to completion — the reasoning canvas, the best-subsets attention-guide, the per-factor stat flow, de-automated scoring, the crossing-back. Phase 3 refines framing-on-load and propagates docs. The process-as-operations extraction is a **separate follow-up spec**.

**Tech stack:** TypeScript monorepo (pnpm/turbo); React; Zustand (9 stores, ADR-078); Vitest; PWA + Azure apps sharing `packages/{core,hooks,ui,charts,stores}`.

**Owner bar:** **Model B is designed _and fully implemented_ before VariScout is shown to potential customers.** Phases 1 + 3 are its runway.

---

## How to read each PR entry

`Goal` · `Touches` (area, not exact lines — the sub-plan pins those) · `Depends on` · `Model` (right-sized per CLAUDE.md) · `Acceptance` · `Spec ref`. The **sub-plan** (written at execution) carries the bite-sized TDD steps, exact paths, and code.

---

## Architecture & refactor approach

**This initiative _is_ the refactor** — the cleanup PRs, the glue retirement, PR-CS-0's scope-lifecycle rewrite, the cadence extraction (follow-up), and the 3-representation reconciliation ARE the architectural-health work, sequenced, not big-bang. The codebase is structured (9 stores / 3 layers, ADR-078; `core → hooks → ui → apps` enforced by ESLint architecture tests; ADR-073/074 boundaries) and has accreted **named, bounded debts**, not rot.

**When to refactor (tiers):** ① _now_ — debt that BLOCKS (PR-CS-0); ② _with the feature_ — cheap cleanup that cuts confusion (PR-CS-1 orphans/glue — you're in the file anyway); ③ _its own pass_ — entangled extraction (the cadence loop → follow-up spec); ④ _defer until it bites_ — acknowledged non-blocking seams (the dual `projectStore`/`canvasStore` seam, spec §5.4).

**Validate architecture in the sub-plan, not upfront.** No standalone architecture-audit pass (the macro is ADR-governed + known). The one real architecture _decision_ — the **scope lifecycle** (where the durable, IP-keyed `ProblemStatementScope` lives; its interaction with the dual-store seam) — is grounded **as step zero of PR-CS-0's sub-plan**, against the code at build time. Escalate to a broader pass only if that grounding surfaces a deeper structural problem.

---

## Phase 1 — Clear the ground + lay the spine (the runway)

### PR-CS-0 · Make scope durable + IP-keyed (the connective prerequisite)

- **Goal:** the drill produces a first-class, **durable, IP-keyed `ProblemStatementScope`** — the foundation the connective spine (§4) + the orient→dive handoff assume. (The 2026-06-02 user-POV eval found this **unwired despite IM-4 reading "delivered."**)
- **Touches:** wire the drill→scope bridge (`buildConditionFromCategoricalFilters → createProblemStatementScope`/`analyzeStore.addScope` — **zero live callers today**); fix capture-as-Finding to snapshot the drill condition (not legacy `projectStore.filters`); key `analysisScopeStore` to `activeIPId` + clear on IP switch (the §4.1 bleed fix, supersedes PR-CS-4); seed scope from `projectStore.outcome` on every Process→Explore transition (the "See the data" scope-fix).
- **Depends on:** — (**FIRST — prerequisite**; verify what IM-4 actually delivered before building).
- **Model:** Opus (the scope lifecycle is the connective foundation; judgment-heavy).
- **Acceptance:** a drill becomes a persisted `ProblemStatementScope` that survives reload; switching IP resets drill state (no bleed); "See the data" lands in a scoped Explore; capture-as-Finding records the drill condition.
- **Spec ref:** §2A.1a, §4.1, §4.5.

> **§2A.1a coherence items fold into existing PRs:** the **b0→b1 transition affordance + the role-assignment/factor-screening terminology** → CS-15 (framing) + CS-P1; the **best-subsets-in-orient placement** (§12 Q6 resolved) → CS-8 / CS-P2 (the orient view's "which factor" signal). PR-CS-4 (IP-scope bleed) is **absorbed into PR-CS-0**.

### PR-CS-1 · Orphan cleanup + ADR-086 retraction

- **Goal:** delete the confirmed dead code so Model B builds on cleared ground.
- **Touches:** `questions`/`CanvasOverlayQuestionItem` cargo (`useCanvasAnalyzeOverlays.ts`, `CanvasStepOverlay.tsx`); `NarratorRail`, `DroppableGateBadge` (`AnalyzeWall/` + `index.ts` exports + tests); dead `kind:'factor'` edge emission (`wallLayout.ts`); amend `ADR-086` to **retract** the premature "superseded" language (drift-now); fix the stale `packages/stores/CLAUDE.md` "SuspectedCause" claim.
- **Depends on:** — (first).
- **Model:** Sonnet (mechanical deletion + one ADR edit; verify zero live callers via grep before each delete).
- **Acceptance:** grep proves each removed symbol has no production mount/caller; turbo test + both-app gate green; ADR-086 no longer claims an un-built state.
- **Spec ref:** §7.2, §7.1 (retraction only), §10 L4/L5.

### PR-CS-2 · Retire the decided-away response-path CTAs

- **Goal:** remove the canvas-drill 3-CTA response paths superseded by Click-to-Explore (2026-05-28 D4).
- **Touches:** `responsePathCta.ts` + the Canvas step-overlay CTA branch (verify current call-site reachability first — Explore at plan time).
- **Depends on:** PR-CS-1 (shares the step-overlay file).
- **Model:** Sonnet.
- **Acceptance:** no response-path CTA renders on canvas drill; Click-to-Explore + capture-as-Finding remain the canvas's affirmative actions; gate green.
- **Spec ref:** §7.3.

### PR-CS-3 · Model A — persistent shared-scope chip + highlight coordination

- **Goal:** the "all surfaces light up together" spine — a persistent scope chip in chrome, scope persistent across tab switches, **highlight-default (dim, no reflow)** coordination, per-surface Filter/Highlight/None.
- **Touches:** `analysisScopeStore` (extend subscription to Analyze/Wall); a new persistent `ScopeChip` chrome component; the highlight-vs-filter coordination layer; Process + Explore + Analyze read paths.
- **Depends on:** — (parallel with PR-CS-1/2).
- **Model:** Opus (store + coordination design; cross-surface).
- **Acceptance:** set a scope on Explore → Process + Analyze **highlight** the same subset with **no reflow**; scope survives tab switches; per-surface Filter/Highlight/None works; ADR-073 architecture test green (no cross-unit roll-up).
- **Spec ref:** §3 (Model A), §3.3 rules, §4.1.

### PR-CS-4 · Fix the IP-scope bleed

- **Goal:** clear/re-scope `analysisScopeStore` drill state on active-IP change (keyed by `activeIPId`).
- **Touches:** `useActiveIPContext` cascade; `analysisScopeStore.clearScope()` wiring on IP switch.
- **Depends on:** PR-CS-3.
- **Model:** Sonnet.
- **Acceptance:** switch active IP → `yColumn`/`boxplotFactor`/`stepId`/`categoricalFilters` reset (no bleed across projects); test covers the switch.
- **Spec ref:** §4.1.

### PR-CS-5 · Connective spine — findings-on-step + focus-on-arrival + origin stepId

- **Goal:** make "step → its findings → the focused hypothesis" real.
- **Touches:** add a **`findings` `ContextSurfaceType`** + a **step `FindingSource` variant** + a step capture affordance (`CanvasStepCard`/overlay); pass `CanvasAnalyzeFocus` so a badge click **focuses** the hypothesis on arrival; carry **origin `stepId`** on `ContextLinkItem`; drop the `quick-actions` stub.
- **Depends on:** PR-CS-1 (step-overlay), PR-CS-3 (scope).
- **Model:** Opus (data-model + cross-surface UI).
- **Acceptance:** from a step, see its **findings** in the badges → click a hypothesis badge → land in Analyze **with that hypothesis focused**; downstream shows "from step X"; both apps.
- **Spec ref:** §4.2.

### PR-CS-6 · Downstream where-from/where-to wires

- **Goal:** close the entity edges to the end of the spine.
- **Touches:** Finding→`IP.metadata.actions` promotion; populate `IP.sections.investigationLineage.findingIds`; Control-drift backlink to its hypothesis.
- **Depends on:** PR-CS-5.
- **Model:** Sonnet.
- **Acceptance:** a Finding can promote to an Action; lineage findingIds populate from a UI gesture; control-drift links back; Report reflects them.
- **Spec ref:** §4.6.

### PR-CS-7 · PWA↔Azure parity fixes

- **Goal:** close the four analysis-surface parity gaps. _(Sub-plan may split per gap.)_
- **Touches:** wire `onChipExploreJump`/click-to-Explore in PWA `FrameView`; wire `onRecordDisconfirmation` in PWA; mount the Evidence Map in PWA Analyze (Layer 1 always; Layers 2/3 under Azure's existing gate — §12 Q1); bring `ScopeRail` to PWA.
- **Depends on:** PR-CS-3 (scope), PR-CS-5 (for the click-to-Explore parity).
- **Model:** Sonnet (mostly wiring what Azure already has).
- **Acceptance:** PWA analysis surfaces match Azure for these four; only collaboration/CoScout/cloud/audit differ; mobile stays focus-only (device, not tier).
- **Spec ref:** §6.

---

## Phase 2 — Model B, the reasoning canvas, built to completion (the centerpiece)

> Opus-grade throughout. The reasoning-canvas PR (PR-CS-12) is the largest — its sub-plan will likely sub-slice (layout/Focus first, then glue retirement).

### PR-CS-8 · Best-subsets attention-guide — per-scope re-rank in Analyze

- **Goal:** "which factors matter inside this drilled scope?" — the per-scope re-rank (settled placement).
- **Touches:** `ModelBuilderBand` re-run on the active `ProblemStatementScope`; label ΔR² as **association strength** (not "which cause matters"); analyst-controlled (toggle/snap-back).
- **Depends on:** PR-CS-3 (scope).
- **Model:** ~~Opus~~ → **Sonnet** (re-sized after grounding — see sub-plan; design judgment pinned in the sub-plan).
- **Acceptance:** drilling a scope re-ranks the vital-few **for that scope**; no "cause" verdict language; analyst controls the model.
- **Spec ref:** §4.0, §4.0a. _(The **global** guide placement is **advanced design — §12 Q6**: write a short design note before its PR; do NOT build the global guide blind.)_
- **Sub-plan (grounded 2026-06-03):** [`2026-06-02-cs-8-association-strength.md`](2026-06-02-cs-8-association-strength.md). **Grounding (7-agent fan-out) re-sized this PR:** the per-scope re-rank + toggle/snap-back + capture-as-Finding **already ship** — the real delta is the **ΔR² association-strength magnitude + framing + the missing per-scope-re-rank integration test**. Design pinned: the magnitude = per-factor **semipartial R²** (`R²(kept) − R²(kept∖f)`, raw so ≥0, **non-summing per ADR-073**) — the effect size paired with the existing partial p; **refines LOCKED #2** (effect-size-with-p, still no Cp/BIC). **DELIVERED 2026-06-03 via PR #290** (merge `fc8aa55c`; 8 commits; pr-ready-check green; final adversarial Opus review approved — no Critical/Important). Build-record corrections: i18n was a **33-file** change (the closed `MessageCatalog` interface + all 32 locale catalogs, English placeholders per convention — the plan's "add to en.ts" under-counted), and the re-rank integration test was hardened to be **load-bearing** (a junk `Noise` candidate the engine must reject in the drilled scope, so it can't pass by merely showing the sole remaining factor).

### PR-CS-9 · The analytical flow — per-factor stat triad (finish FE-2)

- **Goal:** for a focused hypothesis's factors, summon the **right stat by data type** → see-the-chart → explicit support/counts-against call → typed Finding.
- **Touches:** `deriveMiniChartConfig`/test-plan triad → add scatter+regression and Cp/Cpk branches (today only i-chart/boxplot); the run-and-attach-as-typed-Finding wiring; the "try to break it" disconfirmation = same gesture.
- **Depends on:** PR-CS-8.
- **Model:** Opus.
- **Acceptance:** a categorical factor offers boxplot+2-sample, continuous offers scatter+regression, spread offers Cp/Cpk; running one attaches a typed Finding the analyst confirmed; charts ride the Focus lens/LOD (not always-on).
- **Spec ref:** §4.0 (convergent node).
- **Sub-plan (grounded 2026-06-03):** [`2026-06-03-cs-9-per-factor-stat-triad-chart.md`](2026-06-03-cs-9-per-factor-stat-triad-chart.md). **Grounding (7-agent fan-out) re-sized this PR** (same shape as CS-8): the triad engine, the regression/two-sample routing, the full "try to break it" disconfirmation (FE-2b, PRs #260–262), and the run-and-attach-as-typed-Finding wiring **already ship in both apps**. The master-plan "add scatter+regression/Cp-Cpk to `deriveMiniChartConfig`" over-states + mis-points (that's the always-on `HypothesisCard` chart-slot, **Surface A** — a red herring); spec §4.0's "sees the actual chart" is the test-plan **triad** in `HypothesisCardWithPlans` (**Surface B**), which renders no chart today. **Real delta:** render a focus-gated inline chart in the triad row — a new pure `deriveScatterFitData`/`groupOutcomeByFactor` (reusing the OLS engine, no new math) + a `MiniScatterFit` + an optional `TestPlanFactorView.chart` populated only for the focused hub. **Owner-locked scope:** **Cp/Cpk deferred** (no spread trigger in code); **keep run-and-attach** (the explicit analyst-owned call is CS-10's de-automation); **no new `FindingSource` variant**; no new i18n. Also corrected the stale `core/CLAUDE.md` "5 FindingSource variants" → 4 structural / 5 chart-discriminant values. **DELIVERED 2026-06-03 via PR #291** (merge `e8469b32`; 6 commits; pr-ready-check green; final adversarial Opus review approved). Build-record note: the final review caught a real **quadratic-fit misrepresentation** — `deriveScatterFitData` drew the fitted line as a straight min→max chord, but the OLS engine can select a quadratic term (`predictFromUnifiedModel` evaluates it), so a U-shaped fit rendered as a near-flat line; fixed in-branch by **sampling the fitted curve into a polyline** + a load-bearing curvature test (the midpoint dips below the chord — the old impl fails it).

### PR-CS-10 · De-automated scoring — analyst-owned status

- **Goal:** the analyst sets the 5-state status; the rule becomes a soft suggestion.
- **Touches:** re-introduce an analyst-set status (return `setHubStatus`, analyst-owned source of truth); demote `deriveHypothesisStatus` to a **suggestion chip** (never auto-applies); rename code value `'confirmed' → 'evidence-survived-test'` (typed-enum migration across readers/tests).
- **Depends on:** PR-CS-9.
- **Model:** Opus (judgment-heavy; touches the stored-vs-derived seam).
- **Acceptance:** status is analyst-set + never auto-changes on render; the suggestion chip surfaces the ≥2-types + survived-test readiness as guidance; no surface reads `'confirmed'` as proof.
- **Spec ref:** §4.0 (status analyst-owned).
- **Sub-plan (grounded 2026-06-03):** [`2026-06-03-cs-10-analyst-owned-status.md`](2026-06-03-cs-10-analyst-owned-status.md). **Grounding (7-agent fan-out) re-shaped this PR** (as with CS-8/CS-9). CS-10 = three moves: (1) an **atomic compiler-guided rename** `'confirmed' → 'evidence-survived-test'` (anchor `findings/types.ts:637`; ~15 typed readers + 5 exhaustive maps tsc-forced, **1 silent-break site** `charts/SynthesisLayer.tsx` loose-typed, serializer guard kept strict per D15, ~35 tests — ONE Opus dispatch per `feedback_atomic_sweep_one_dispatch`); (2) **re-introduce a named `setHubStatus`** over the _already-existing_ `updateHub` write-path, wired through `useHypotheses` + the UI exactly like `recordDisconfirmation`; (3) **flip the Wall display** (`WallCanvas:918`, `MobileCardList:83`) from `deriveHypothesisStatus(...)` to stored `hub.status`, derivation re-surfaced as a non-binding chip. **Corrections:** the setter was deleted in **IM-4a** (`84045c42`), not IM-4c (comment-only); `deriveHypothesisStatus` is already pure/render-only (no auto-write to remove); **no IDB migration** (DocumentSnapshot round-trips `hypotheses[]` wholesale); the value rename touches **zero i18n catalogs** (key independent of enum); flip **revives ~8 dead `h.status` readers** (behavior change to test). **Owner-locked scope:** **free analyst choice** (any of 5 states, no gate, chip suggests only); **leave + log** the PWA(3-way)/Azure(2-way) conclusion-categorizer divergence as a parity follow-up; re-ingest=CS-11, CoScout=CS-14 untouched. **DELIVERED 2026-06-03 via PR #292** (merge `e9f85d2c`; 15 commits across 4 tasks: rename cascade / analyst-owned `setHubStatus` / Wall stored-status flip + chip + control / docs; pr-ready-check green; final adversarial Opus review approved — no Critical/Important, precedence contract verified at every site, load-bearing negative controls confirmed to fail under revert). Build-record corrections to the spec: the setter was deleted in **IM-4a** (`84045c42`), not IM-4c; the one genuinely silent rename site was `charts/SynthesisLayer.tsx`'s loose-typed `getStatusColor` (hand-fixed); new chip/control i18n keys were a 32-catalog add (completeness-test-enforced) while the value rename itself touched zero catalogs.

### PR-CS-11 · Re-ingest auto-link → analyst-confirm prompt + cluster-grouping

- **Goal:** keep the mechanical column-matching; remove the silent writes.
- **Touches:** `useReingestAutoLink` → emit an **analyst-confirm prompt** ("factor arrived — link it? mark in-progress?") instead of auto-creating a source-less Finding + auto-bumping; the cluster detector → **grouping without R²-ranking**.
- **Depends on:** PR-CS-10.
- **Model:** Opus.
- **Acceptance:** re-ingest matches columns but **writes nothing without an analyst click**; no source-less "data arrived" Finding; the cluster prompt shows "share factor X" without implying a best cause.
- **Spec ref:** §4.5, §4.0 (boundary).
- **Sub-plan (grounded 2026-06-03):** [`2026-06-03-cs-11-reingest-confirm-prompt.md`](2026-06-03-cs-11-reingest-confirm-prompt.md). **Grounding (7-agent fan-out) re-shaped this PR:** there are **THREE silent writes, not two** (the source-less Finding is injected via direct `setState`, NOT a HubAction; + the `LINK_FINDING` dispatch; + the `'in-progress'` bump) — all become analyst-confirmed; the auto-Finding stamp is `validationStatus:'inconclusive'` (the spec conflated it with `status`); **the manual plan-status setter is NET-NEW** (`onEditPlan` is a V2 stub in both apps; the auto-bump was the sole producer of `in-progress`, and `complete`/`skipped` have NO producer — remove the bump without a setter and plans freeze at `planned`); re-ingest is LOCAL (both apps), not blob-only; the de-rank has two removal sites (the `helpers.ts:569` sort AND the `SynthesisPrompt` percent). **Owner-locked design:** prompt host = **"hints navigate, chips apply"** (the Wall `MeasurementPlanChip` is the single apply surface — context analysis: the match fires at import-time on another tab, the work happens on the Wall — plus a navigate-only Inbox breadcrumb; ingest match-summary line = logged polish); **full analyst-owned 4-state plan status** (the CS-10 pattern re-applied — closes the plans-can-never-complete dead-end before demos); cluster de-rank stays Azure-only (leave + log parity); `onPlansChanged` nonce relocates to the manual confirm path; §12 Q5 cascade stays deferred.

### PR-CS-12 · The reasoning canvas — Finding-link rendering + Focus lens + retire the glue

- **Goal:** the bipartite reasoning canvas, bounded by the Focus lens, with the glue retired. **The centerpiece.**
- **Touches:** draw **Finding-mediated links** (condition→hypothesis, signed) on the canvas consuming `wallLayout.factorPositions`; **domain-weighted** Focus/DOI (`contribution × graph-distance`) + minimap; **retire `CanvasWallOverlay` + `LocalMechanismView` embedded overlay** (finish the ADR-086 unification); the **optional `CausalLink` overlay** (or defer per §12 Q3); amend ADR-086 to the delivered state.
- **Depends on:** PR-CS-1 (glue cleanup retraction), PR-CS-8/9/10 (the content it renders).
- **Model:** Opus. _(Sub-plan WILL sub-slice: 12a layout + Finding-links + Focus lens; 12b retire the glue; 12c optional CausalLink overlay.)_
- **Acceptance:** the canvas renders factors + hypotheses + scope in one coordinate space with signed Finding-links + Focus-lens dimming on a laptop; `CanvasWallOverlay`/`LocalMechanismView` overlay gone; ADR-086 describes the delivered state.
- **Spec ref:** §3 (Model B), §4.3, §4.4, §7.1.

### PR-CS-13 · The crossing-back — Analyze → scoped Explore

- **Goal:** make the loop iterative.
- **Touches:** extend `navigateToExploreForChip`/click-to-Explore to fire **from a hypothesis/factor in Analyze**, carrying its scope.
- **Depends on:** PR-CS-3 (scope), PR-CS-12 (the canvas to fire from).
- **Model:** Sonnet.
- **Acceptance:** from a hypothesis/factor, "Explore this" lands in Explore scoped to it; the analyst can diverge again mid-investigation.
- **Spec ref:** §4.0a (crossing-back).

### PR-CS-14 · CoScout — the interpretation partner (Azure)

- **Goal:** CoScout helps _read_ a result; never makes the call.
- **Touches:** `CoScoutSection` interpretation prompts beside the stat result / on a hypothesis; minimal-nudge surfacing; explicit boundary (no status-set, no auto-conclude).
- **Depends on:** PR-CS-9 (the stat result it interprets), PR-CS-10 (status it must NOT set).
- **Model:** Opus (prompt design + boundary discipline).
- **Acceptance:** CoScout suggests an interpretation the analyst accepts/rejects; it cannot set status, link findings, or conclude; Azure-only.
- **Spec ref:** §4.0 (three layers).

---

## Phase 2P — The Process tab (§2A — the other half of the analytics centerpiece)

> The Process-tab per-step capability view is, with Model B, part of the customer-demo bar. CS-P1 is runway (Phase-1-adjacent); CS-P2…P5 are the bar.

### PR-CS-P1 · Process-tab orient foundation + shed the cadence accretion

- **Goal:** make the Process tab the coherent orient surface; remove the accretion.
- **Touches:** establish the L1/L2/L3 levels as the spine (retire the "3-band" term); **un-mount the cadence/Status rollup** (`ProcessHubReviewPanel` Active/Readiness/Verification/Overdue) → named-future and **collapse the Status/Capability two-tab**; **hide the empty Capability temporal row** (`cpkTrend`/`cpkGapTrend`); re-home the per-step capability spatial row (`CapabilityBoxplot` + `StepErrorPareto`).
- **Depends on:** — (Phase 1, runway). _(Coordinate with the §9 follow-up: this hides/collapses the Process-tab cadence UI; the follow-up does the full extraction + disentangles Control/Survey.)_
- **Model:** Sonnet (re-home + hide; verify the per-step row still renders).
- **Acceptance:** Process tab shows the canvas + per-step capability, no cadence rollup, no empty slots, single coherent surface; gate green.
- **Spec ref:** §2A.1, §2A.5.
- **Sub-plan:** [`2026-06-03-cs-p1-process-orient-foundation.md`](2026-06-03-cs-p1-process-orient-foundation.md). **Scope refined by grounding → foundation-only:** the cadence rollup / two-tab / per-step capability live in the portfolio Dashboard's `ProcessHubView`, not the editor canvas Process tab (which already has the L1/L2/L3 spine + L1 "are we capable?"); and per-step capability needs CS-P3 authoring to be non-empty. So CS-P1 sheds the cadence rollup (lifting Control out) + collapses the two-tab + gates the empty temporal row; the per-step-capability **lift onto the editor canvas moves to CS-P2** (which retires the Dashboard 2×2). See `decision-log.md` §3 + spec §2A grounding-correction.

### PR-CS-P2 · Connected per-step boxplot + own-values harmonized spec-aware scaling + Values⇄Capability

- **Goal:** the world-class per-step "which step" view.
- **Touches:** lay the per-step boxplot on the flow (each box at its node + light capability flag; aligned for linear, linked+coordinated-highlight for branching); the **Values⇄Capability toggle**; the **own-values harmonized, spec-aware scaling** with the **baseline rule** (two-sided → spec window; one-sided/ratio → 0; time → 0). **No leaderboard** — boxplot + eye; keep the error Pareto.
- **Depends on:** CS-P1; CS-3 (linked-panels pattern).
- **Model:** Opus (the distinctive viz; judgment-heavy; **verify on a 13–15″ viewport with `--chrome`**).
- **Acceptance:** heterogeneous steps compare on the spec-anchored scale while keeping real values; the worst step is visibly obvious without a rank; ADR-073 honored (per-context distribution when specs diverge — no forced Cpk rank).
- **Spec ref:** §2A.2, §2A.3.

### PR-CS-P3 · Per-step spec-authoring UI at framing

- **Goal:** "ask the specs" — author per-step LSL/USL/target by context (the deferred IM-0b-2 `capabilityScope` editor).
- **Touches:** a framing UI (canvasStore `setCapabilityScope`/`editCapabilityScope`) to author `ProcessMapNode.capabilityScope.specRules`; respect the canvasStore authoring boundary (ADR-087); the engine already consumes them.
- **Depends on:** CS-15 (framing refinement), CS-P2.
- **Model:** Opus (framing seam, delicate — §5 seams).
- **Acceptance:** analyst sets a step's spec (per context); `calculateNodeCapability` uses it; the per-step view reflects it. (§12 Q7 decision.)
- **Spec ref:** §2A.4.

### PR-CS-P4 · Cycle-time visualization + light bottleneck highlight

- **Goal:** surface the time axis (engine exists, viz deferred).
- **Touches:** render `computeOutputRate`/`computeBottleneck` results — a per-step time view + a light "this is the constraint" highlight on the bottleneck step; the `Values⇄Capability`-style axis switch to the time axis where framed data has `StepTimingBinding`.
- **Depends on:** CS-P2.
- **Model:** Sonnet (wiring the shipped engine to a viz).
- **Acceptance:** when timing data is framed, the per-step view shows the cycle-time bottleneck (the constraint highlighted), distinct from the worst-capability step (never conflated). (Per-step time _specs_ stay deferred per §12 Q8.)
- **Spec ref:** §2A.2, §2A.4.

### PR-CS-P5 · Per-step capability to PWA (parity)

- **Goal:** bring the Process-tab per-step view to PWA.
- **Touches:** mount the per-step capability view in PWA (PWA has the canvas but no `ProcessHubView`); the cadence/Status rollup does NOT come (named-future).
- **Depends on:** CS-P2.
- **Model:** Sonnet (parity wiring).
- **Acceptance:** PWA shows the per-step capability view at parity with Azure; only collaboration/CoScout/cloud/audit differ.
- **Spec ref:** §2A.6, §6.

---

## Phase 3 — Refinement + docs (parallelizable with late Phase 2)

### PR-CS-15 · Framing-on-load refinement (surgical)

- **Goal:** refine `CanvasWorkspace` framing without breaking the load-bearing seams.
- **Touches:** the b0/b1 surfaces; **preserve** the 6 seams (b0/b1 gate · dual-write persist seam + hydration guard · `projectStore.outcome/factors` as Explore Y/X · the two DndContexts · chip drag-vs-click · ProcessMap focal-step contract); retire deprecated `ProcessMapBase`.
- **Depends on:** Phase 1 (scope/chips it rides).
- **Model:** Opus (delicate; preserve-and-refine, not greenfield).
- **Acceptance:** framing + column-connection works end-to-end; all 6 seams intact (regression tests); `ProcessMapBase` gone.
- **Spec ref:** §5.

### PR-CS-16 · Holistic doc propagation (L1–L5 + anchors + journeys)

- **Goal:** docs move with the code (owner ask).
- **Touches:** the §10 doc-layer map — `ia-nav-model.md` stale lines; persona journeys' connective pathways; NEW `process-tab.md` + `connective-navigation.md` + the connective journey (each with ≥1 inbound link); `mental-model-hierarchy.md` zoom layers; `methodology.md`/`positioning.md`; `OVERVIEW`/`USER-JOURNEYS`/`DATA-FLOW`/`llms.txt`; `decision-log.md` (Decision 0 + parity + follow-up).
- **Depends on:** the apply-phase items land with their PRs; this PR sweeps the standalone + drift-now items.
- **Model:** Sonnet (doc work; grounded against shipped code — over-flagging risk per `feedback_subagent_grounding_catches_drift`).
- **Acceptance:** doc-validation hook clean; no orphan/stale refs; the connective pathways documented; new docs linked.
- **Spec ref:** §10.

---

## Follow-up (separate spec + master plan — NOT this plan)

**Process-as-operations extraction** — un-mount the named-future cadence layer + disentangle the V1-coupled Control region / Survey-Inbox / click-to-Explore wiring (one-way contract preserved; `onPlansChanged` nonce-bump preserved). Own holistic design (§9). Logged in `decision-log.md` + `investigations.md`.

## Tracked follow-ups (deferred _within_ this initiative — small, not their own spec)

Surfaced + deferred during PR delivery; durable home is `docs/ephemeral/investigations.md` (this list is the sequencer-visible pointer so they don't get lost). Each is non-blocking for the customer-demo bar; fold into a later CS-PR or a small standalone PR when convenient.

- **ΔR² → `Finding.modelContext`** (CS-8 deferral, cross-app) — when a Finding is captured from the best-subsets band, record the per-scope **semipartial-R² association-strength map** onto the captured Finding's `modelContext` so the magnitude travels with the Finding (not just the live band). Engine (`perFactorDeltaR2`) already ships from CS-8; this is the capture-time wiring. _Not yet in investigations.md — logged there alongside this entry._
- **PWA/Azure conclusion-categorizer parity** (CS-10) — PWA buckets conclusions 3-way (`suspected`/`contributing`/`ruledOut`), Azure 2-way (`suspected`/`ruledOut`); both read the same stored `hub.status`. Align (or consolidate into a shared hook) before the PWA `contributing` bucket becomes user-visible. See `investigations.md` "PWA/Azure conclusion-categorizer parity divergence [LOGGED 2026-06-03]".
- **Non-English status-label retranslation** — the 31 non-en locales still carry English placeholders for `wall.status.confirmed` (= "Confirmed") and the CS-10-added `wall.card.oneStepAway` / `wall.status.suggestSupported` / `wall.status.setLabel` copy. A locale-retranslation sweep is the existing tracked debt (`investigations.md`, 2026-05-31 entry). Catalog **keys** are complete (completeness test green); only **values** await translation.
- **Optional laptop-viewport visual glances** (CS-8 ΔR² bars · CS-9 triad chart · CS-10 status chip + control) — non-blocking `--chrome` QA on a 13–15″ viewport (laptop rule 12). Height/legibility math was reviewed clean in each PR; a human glance is the belt-and-suspenders.

---

## Sequencing summary

```
Phase 1 (runway):   CS-1 ─┬─ CS-2
                          ├─ CS-3 ─ CS-4
                          │        └─ CS-5 ─ CS-6
                          │        └─ CS-7 (parity)
Phase 2 (Model B):  CS-8 ─ CS-9 ─ CS-10 ─ CS-11
                          └────────────────┴─ CS-12 (canvas) ─ CS-13 (crossing-back)
                                              └─ CS-14 (CoScout)
Phase 3:            CS-15 (framing)  ·  CS-16 (docs)  — parallel with late Phase 2
```

CS-1/CS-3 start in parallel. **Model B (CS-8…CS-14) is the bar before customer demos.** The §12 Q6 global-best-subsets-guide placement gets a short design note before any PR builds it.

---

## Per-PR protocol (every PR)

1. `superpowers:writing-plans` → the bite-sized sub-plan for **this** PR (exact paths, TDD steps, code), saved to `docs/superpowers/plans/2026-06-02-cs-<n>-<slug>.md`.
2. Branch (product code → branch → PR, per CLAUDE.md); `superpowers:subagent-driven-development` (fresh implementer per task; spec + quality reviewer pair; right-sized model per task).
3. Each PR **amends its nearest docs in-PR** (apply-phase §10 items).
4. `bash scripts/pr-ready-check.sh` green → subagent code review → `gh pr merge --merge --delete-branch`.
5. Verify the chosen layout/surface **visually on a 13–15″ viewport with `--chrome`** before merge (laptop rule 12 / `feedback_verify_before_push`).
