---
title: 'investigation-model-design'
description: 'Settled investigation-model spine from the 2026-05-29 holistic design session (Clusters A→C). The unified canvas, drill-to-condition, level-native contribution, the iterative collect-data loop, and the Measurement-Plan-as-DCP. Decision-log CANDIDATES + investigation entries — not yet a spec. Supersedes the Cluster A + Cluster C portions of [[open-design-threads]].'
purpose: remember
tier: card
status: active
date: 2026-06-01
topic: [memory, project]
related: []
verified-against-commit: fe1b0755
last-verified: 2026-06-01
source-hash: 0f95b45602777516
origin-session-id: 8b67fcc2-5a67-481c-ab1d-114c6ebabe8e
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_investigation_model_design.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Holistic design conversation 2026-05-29 (visual-companion brainstorm, opus) settled the V1 investigation-model spine. **GRADUATED 2026-05-29 → spec `docs/superpowers/specs/2026-05-29-investigation-surface-design.md` + ADRs 085–089 + master plan IM-0…IM-7 (committed to main `04854150`; plan-ready, halts for ADR review before IM-0). The detail below is the settled design now captured canonically in the spec/ADRs.** Full blow-by-blow + grounding citations in plan file `~/.claude/plans/i-m-coming-off-linked-serialized-sparkle.md`.

## Settled decisions (decision-log candidates)

1. **Project = the collaboration container.** Collapse the quick-analysis/Project duality into one continuous investigation; **inviting people is the trigger that makes it a Project** (collaboration constitutes it → inherently Azure). Solo = a (savable, closeable, reportable) *investigation*; PWA does the full solo flow incl. lifecycle/Report; only collaboration + cloud + AI + audit are Azure. Resolves Cluster A seam (#12, convergence, #37). No formal Charter ceremony (already gone — decision-log #42).
2. **Closure (#12):** optional, non-blocking signoff = an Azure collaboration affordance, hidden solo. Reconcile spec (out-of-band) vs shipped code (processOwner-gated in-app signoff) toward optional. Personas/ia-nav Sponsor-gatekeeper wording is stale drift to fix.
3. **Drop `Question` as a tracked entity.** The Wall (Findings + Hypotheses) is the centerpiece. Question's value re-homed: generative → Factor Intelligence; completeness → un-examined factors; interpretive → Finding/Hypothesis. Retires legacy `Question.causeRole` duplication + phantom `SuspectedCause` naming (it's `Hypothesis` in code).
4. **One graph `y = f(x)`, projected:** Evidence Map = factor-centric (**= the muuttuja kartta**, X→x→smaller x's, recursive) ; Wall = hypothesis-centric. Anti-bias migrates from "neutral questions" to the **disconfirmation gate** (≥2 evidence types + survived disconfirmation before confirmed — typed-but-unwired today; must build the UX).
5. **Unified surface (one canvas, not two views).** Bipartite factor↔hypothesis canvas + **Focus lens + semantic-zoom LOD** (Kumu/Bloom/Furnas — NOT a global force-graph hairball). Both research tracks (analyst: JMP/ACH/Apollo; UX: Kumu/Bloom) converged on this independently. Mostly assembles existing primitives.
6. **Drill-to-condition is the spine — but WHERE (scope) ≠ WHY (cause)** (corrected 2026-05-29 vs Turtiainen thesis). Layering: **Issue Statement (1)** → **Outcome Y (1)** → **Problem-Statement SCOPE(s) = the WHERE** (drilled `{factor=level}` condition, e.g. Machine X; MANY scopes possible; Progressive Sharpening refines it) → **Suspected Causes = the WHY** (mechanisms; MANY per scope; η²/contribution + Measurement Plans). methodology.md:34 "VariScout finds WHERE; apply Lean to find WHY." The drilled condition = the **Problem-Statement scope**, NOT the hypothesis; hypotheses are causes *within* the scope. **Code tangles this** (`Hypothesis.condition` puts a where on the cause; Problem Statement not first-class — synthesized string in `buildProblemStatement`; "with-causes" maturity a comment) → BUILD: make Problem-Statement-scope first-class w/ multiple causes nested (`GateNode`/`problemContributionTree` already composes causes; `Finding.context.activeFilters` already holds scope).
7. **Contribution is level-native, NOT a custom SS-share.** Grounded in user's own GB Measure decks (144pp): no SS/F-ratio anywhere → a bespoke SS-% would be more formal than the user's course. Use the per-lens native share (Cpk-per-group / Pareto count / regression slope / VA% / bottleneck-sec) + **What-If** as the actionable cross-lens number. Routed by the **three process-learning levels Y/X/x** (Outcome/Flow/Local) — NOT Lean-vs-Six-Sigma labels. "Level before mode."
8. **Trust = soft caveat, not a gate.** Op-def + MSA/Gage-R&R are **optional free-text notes** on the plan, surfaced beside the contribution; **no stability gate** (instability is the signal you drill). Per `feedback_prefer_pragmatic_over_formal`.
9. **Iterative Measure⇄Analyze loop is first-class.** A drilled condition opens a new local `y=f(x)`; new hypotheses may need new data → **Measurement Plan = a DCP**. Final shape: `{ outcome(Y), primaryFactor, neededFactors[] (stratifiers — capture alongside, not one), sampleSize, method, owner, status, scope, processLocation, opDef?, msaNote?, linkedFindingIds[] }`. **No randomized-order field; MSA = optional comment.**
10. **All three surfaces (Process tab / Evidence Map / Wall) deepen together on re-ingest** because they're projections of one graph; binding is **derived from column overlap** (`conditionReferencesStep`), so once a factor lands on a step the local map/Wall/η² populate automatically.

## Grounded code reality (what's built vs net-new)

- **Built + reusable:** MeasurementPlan primitive (`packages/core/src/measurementPlan/`, WIRED: AddPlanForm/HypothesisCardWithPlans/LINK_FINDING/HubRepository); the per-step local `y=f(x)` (`LocalMechanismView` L3 = local Evidence Map + local Wall + η²); column→step assignment; HypothesisCondition predicate tree + HOLDS evaluator; `computeMainEffects`/`bestSubsets`; drill chips (`analysisScopeStore`); the river/Wall (`AnalyzeWall/`, canonical `docs/superpowers/specs/2026-04-19-investigation-wall-design.md`).
- **Net-new (the build list):** scope/outcome/**processLocation**/opDef/msaNote fields + neededFactors[] on MeasurementPlan; **auto-link engine** (re-ingest → detect new column → generate Finding → match by factor → link → progress status — aspirational today, manual 3-step picker); re-load cascade (append preserves but doesn't re-match; replace orphans); the disconfirmation UX (`setHubStatus` orphaned, `disconfirmationAttempts` zero UI); contribution-by-condition compute.
- **Architectural prereq:** reconcile the **two unreconciled step models** — rich `ProcessMap`/`ProcessMapNode` (canvas L2/L3) vs flat `IP.processSteps {id,name,order}` (E1) — before growth logic. Also: tributary authoring lives only on deprecated `ProcessMapBase`; E1 factor-scope handlers stubbed.

## Open questions (investigation entries)

- Overlap apportionment when two hypothesis conditions share rows (coverage double-counts).
- Confirm Measurement-Plan hypothesis-exclusivity (requires a hypothesisId; no plan on a bare condition) is the intent.
- Freeze-vs-auto-sync a hypothesis's condition at capture (lean: freeze, allow refine).
- **Cluster B — SETTLED (analysis surfaces, #50):** retire "mode" + "lens" as user axes — lenses = pedagogy (no UI picker; 4 charts always-on, `mental-model-hierarchy.md:118`); the 3 code modes (`standard`/`performance`/`defect`, capability derived) dissolve into the **Frame** (data shape) + measure selection. Model = **measure (Y) + factor(s) → always-on charts + drill**; "Level" = which measure (global vs step-local). ONE survivor = **Values ⇄ Capability** (specs-gated; per-subgroup Cp/Cpk **stability** — `subgroupCapability.ts` / ADR-038 / `subgroup-capability.md`; the "don't Pp on my Cp" apparatus — a distinct VIEW, not a lens). Plus a **Frame-aware outcome+decomposition pairing** (I-Chart=framed outcome / Boxplot=per-step measures by step = the L1+L2 **bottleneck/process-flow view**; part-whole only, NOT unrelated Ys — ADR-073). #11 (Analyze-tab) + #51 (Phase-2) fall out of Cluster C. Residual Qs: per-chart measure binding for outcome+decomposition (today one shared Y); multi-outcome + step-scope picker partial.

## Capture path (SDD graduation)

Anchored NOW in `docs/ephemeral/investigations.md` ("Investigation-model design direction (Clusters A+B+C)"). Graduates → a combined **investigation-surface spec** (`docs/superpowers/specs/`) + **ADRs**, whose `implements:` must **amend the doc layers**: L1 vision (methodology/eda-mental-model drop-Question + One-Graph line; positioning Project=collaboration) · L2 journeys (ia-nav-model; personas Sponsor-non-gating; new #37 Mode-1 solo journey) · L3 features (analyze-wall; Evidence-Map/muuttuja-kartta; Measurement-Plan-as-DCP; control.md #12). Settled calls → `decision-log.md` on ship. **Capture = code + ALL doc layers, not just code.** Pre-existing drift safe to fix anytime: Sponsor-gatekeeper wording + Control-vs-Sustainment naming.

## Related
[[open-design-threads]] (Clusters A + B + C all designed 2026-05-29) · [[findings-hypotheses-implementation-reality]] · [[wedge-v1]] · [[linked-views-phase-1]] · [[feedback_drop_methodology_bridges]] · [[feedback_prefer_pragmatic_over_formal]].
