---
title: 'ADR-086: Unified investigation canvas — bipartite factor↔hypothesis with Focus lens'
status: active
date: 2026-05-29
purpose: decide
tier: living
audience: both
topic: [investigation, canvas, ux, evidence-map, wedge-v1]
related:
  - adr-085-drop-question-problem-statement-scope
  - adr-074-scout-level-spanning-surface-boundary-policy
  - adr-081-canvas-viewport-architecture
  - 2026-05-29-investigation-surface-design
  - 2026-04-19-investigation-wall-design
layer: L5
last-verified: 2026-05-29
---

# ADR-086: Unified investigation canvas — bipartite factor↔hypothesis with Focus lens

**Status:** Accepted
**Date:** 2026-05-29

> **Amended 2026-05-31** (after the [2026-05-30 Wall-centric spec](../superpowers/specs/2026-05-30-investigation-wall-unified-canvas-design.md) + a 5-lens factor-model exploration): a cause's factors are a **derived projection, not a stored edge**; the typed factor↔hypothesis bipartite edge is **deferred**; the factor band's model-simplification UX (vital-few + full analyst control, R²adj + p) is a **V-next increment** over an engine that already exists. See the **Amendment** section after the Decision. The §Decision/§Consequences below record the original (heavier) reading; where they differ, the Amendment + the 2026-05-30 spec win.

## Context

The 2026-05-29 holistic investigation-surface brainstorm (Clusters A/B/C) settled the V1 investigation spine on a single graph: `y = f(x)` — an outcome decomposed into factors, with named explanations (Hypotheses) connected to the factors that support or refute them. Today that one graph is rendered by **two separate components** that the user experiences as two screens:

- **Evidence Map** — factor-centric (the "muuttuja kartta"). `EvidenceMapBase` (`packages/charts/src/EvidenceMap/EvidenceMapBase.tsx:23`) draws factor nodes sized by R²adj per ADR-074's level-spanning network, with `CausalLink` edges and evidence badges as Azure-only overlay layers.
- **Investigation Wall** — hypothesis-centric. `WallCanvas` (`packages/ui/src/components/AnalyzeWall/WallCanvas.tsx:80`) draws a hypothesis "river" of mechanism-branch cards with `HOLDS X/Y` and missing-evidence rules.

The two projections are **glued, not unified**: `LocalMechanismView` stacks them vertically and `CanvasWallOverlay` paints the Wall absolutely over the L2 grid. They share no layout. The user pays a navigation tax to reconcile "which factors support this hypothesis?" by eye, across two surfaces, when the answer is a single edge in one graph.

Two further frictions block treating them as one surface:

1. **Naming collision.** There are two distinct "Evidence Map" components in code. `EvidenceMapBase` is the factor-network projection this ADR unifies. A second, unrelated component — `CrossTypeEvidenceMap` (`packages/ui/src/components/EvidenceMap/CrossTypeEvidenceMap.tsx:20`) — is a **radial defect-mode map**, consumed only by `AnalyzeMapView` + `MobileDashboard`. It is not part of this decision.
2. **The hairball.** A naive "just merge them into one force-directed graph" produces an unreadable hairball once factor and hypothesis counts grow — the well-documented failure mode of unfiltered node-link layouts.

This ADR depends on [ADR-085](adr-085-drop-question-problem-statement-scope.md), which fixes the entity model (Finding + Hypothesis + `CausalLink`, and drops `Question` as a first-class entity). The canvas is a _projection_ of that graph; it does not redefine it.

## Decision

**The Evidence Map and the Investigation Wall are two projections of ONE bipartite canvas, not two components.**

The unified surface is a bipartite layout:

- **Left:** ranked **factors** (contribution bars, level-native — see [ADR-085](adr-085-drop-question-problem-statement-scope.md) and ADR-073).
- **Right:** named **hypothesis** cards (status-colored, mini-chart, evidence chips, `HOLDS X/Y`).
- **Between them:** typed support/refute **links** (`CausalLink`). **Refute is rendered LOUD** — the surface counts what is _inconsistent_ with a hypothesis, not what merely piles on. The Evidence Map ("muuttuja kartta", factor-centric) and the Investigation Wall (hypothesis-centric) are the same data read from either side.

Clutter is solved by a **Focus lens, not a global force-graph.** Visible detail is proportional to `contribution × graph-distance from the focused hypothesis` (Furnas degree-of-interest dimming + Kumu focus-by-degree). The focused entity is the center of attention; everything else dims by relevance.

**Semantic-zoom LOD on the factor projection:** when zoomed out, cluster **factors** into families (with edge bundling) while keeping **hypotheses** individual. This is a _new factor-projection coarsening_, distinct from the 8f renderer-altitude LOD ([ADR-081](adr-081-canvas-viewport-architecture.md)).

**Optional ACH matrix lens** (evidence × hypotheses grid) is a toggle on the same data. **Mobile** is focus-only: one entity plus its ranked linked list.

**Disconfirmation recording is in scope.** A Hypothesis is not "confirmed" until it has ≥2 evidence types **and** a survived disconfirmation attempt. Recording a disconfirmation attempt is a first-class write, not a derived state.

## Amendment (2026-05-31) — factors are a derived projection; the model-builder is V-next

A 5-lens factor-model exploration (grounded against the shipped engine) + the [2026-05-30 Wall-centric spec](../superpowers/specs/2026-05-30-investigation-wall-unified-canvas-design.md) refine the bipartite reading above. These are binding where they differ from the original §Decision/§Consequences:

1. **A cause's factors are a DERIVED projection, NOT a stored edge.** "Its factors" (the Focus-lens possessive in §Decision) = `deriveBranchColumns(hub, findings)` (`packages/core/src/findings/mechanismBranch.ts:93`) ∪ the cause's findings' `activeFilters` columns ∪ any `CausalLink` naming it — intersected with the scope's ranked factor band. **Do NOT add a `Hypothesis.factorIds[]` (or `factorNames[]`) field.** A stored factor set would (a) freeze a ranking that _must_ recompute on every drill (`useScopedModels.filteredScope` drops the drilled-constant factor), (b) let a human assert factor-relevance over the deterministic engine (breaks engine-is-authority), and (c) re-couple WHERE and WHY (the one separation the model rests on). This dissolves the apparent §Decision tension between "factors feed the scope" (band) and "focus a cause → _its_ factors" (possessive): both hold once "its factors" is a _computed subset of the scope band_, not a stored ownership.

2. **The typed, persisted factor↔hypothesis support/refute edge is DEFERRED.** §Decision line 48 + §Consequences "re-lay-out factor x/y in `useEvidenceMapData` + restructure WallCanvas into one bipartite coordinate space" describe a heavier surface than V1 needs. `CausalLink` stays a factor→factor DAG edge (with its optional `hypothesisId`); a real typed factor→cause edge + a "promote factor onto a cause" gesture are built **only if the derivation proves insufficient in practice**. The Evidence Map remains the **separate cross-scope overview** (muuttuja kartta); it is not ported into the Wall.

3. **Factors render as the scope-level CONTRIBUTING-FACTORS band; the model-simplification UX is a V-next increment.** The parsimony engine **already exists** — `computeBestSubsets` (`packages/core/src/stats/bestSubsets.ts`) enumerates all 2^k−1 subsets sorted by adjusted R²; the overfit gap, obs/predictor ratio, VIF, and ordinal/disordinal interaction classification are all computed today but winner-only and unread by the UI. The V-next "vital-few model-builder" is **~90% UI over the existing engine**: a pre-selected simplest-adequate model the analyst can fully override (with a loud "↩ Use suggested model" snap-back — full control, never silent), surfacing only **adjusted R² + per-factor p** (no Mallows Cp/BIC on the surface — Cp may be an _internal_ picker metric only; "keep it simple and meaningful"). Toggling a factor off is a disconfirmation finding; a suspected-but-unmeasured factor routes to a Measurement Plan; a human override persists as a recorded **Finding** (an interpretation), never a stored factor field. The one genuinely net-new statistical primitive — a **selection-stability bootstrap** ("in 92% of resamples") — is deferred exactly one increment after the band ships.

4. **Focus lens never moves the model metrics.** Focusing a cause dims the band to that cause's _derived_ factors but does NOT recompute the R²adj/p header — there is no per-cause model. This keeps "in the model" (association/parsimony) from ever reading as "is the cause" (endorsement lives only in the evidence gate: ≥2 types + survived disconfirmation).

**Delivery:** IM-4a (spine wiring, PR #256) + IM-4b (collaboration + multi-scope + detached flows, PR #257) shipped. IM-4c ships the positioned scope band + Focus-lens dimming + orphan-finding lane + `createHubFromFinding` CTA (factors-as-band is correct for V1). The model-builder is a clean **V-next initiative** that upgrades the same band component in place. Deferred per spec §9: factor-family LOD + edge bundling, child-scope recursion, the ACH matrix (dropped). See [[investigation-surface-build]] and the decision-log entry of 2026-05-31.

## Rationale

- **One graph, one mental model.** `y = f(x)` is a single object. Surfacing it as two screens forces the user to be the join. A bipartite layout makes "which factors refute this explanation?" a glance, not a cross-screen reconciliation. The Focus lens is what makes a single canvas legible at scale — it is the load-bearing part of "unify them", not a nice-to-have.
- **WHERE ≠ WHY is preserved by the bipartite split, not erased by it.** The factor side carries the **scope** — the `{factor = level}` condition the analyst drilled to. The hypothesis side carries candidate **mechanisms** (suspected contributions) nested _within_ that scope. Putting them on one canvas with explicit links makes the distinction _more_ visible, not less: an edge is literally "this evidence, under this scope, bears on this mechanism." The two axes never collapse into each other.
- **Refute-loud is the methodological point.** A surface that only counts confirming evidence rewards confirmation bias. Counting and visually foregrounding inconsistent evidence is what makes the disconfirmation requirement (≥2 types + survived attempt) honest rather than decorative.
- **Focus lens beats force-graph because relevance is known.** We are not laying out an arbitrary network; we know contribution and graph-distance, so degree-of-interest dimming is computable and stable. A force simulation throws that structure away and reintroduces the hairball.
- **Factor-family LOD ≠ renderer-altitude LOD.** The 8f `CanvasLevel` swaps whole renderers by zoom; coarsening _factors into families_ is a content transform on one renderer's data. Conflating them would overload `CanvasLevel` with a semantic it was not designed for.

## Consequences

### Code-level

- **A true bipartite layout is net-new, not an assembly of existing primitives.** It requires re-laying-out factor x/y in `useEvidenceMapData` **and** restructuring `WallCanvas`'s river layout into the right column of one shared coordinate space. `LocalMechanismView` (vertical stack) and `CanvasWallOverlay` (absolute overlay) are superseded by the unified layout, not extended.
- **`EvidenceMapBase` vs `CrossTypeEvidenceMap` must be disambiguated in code and docs.** `EvidenceMapBase` (`packages/charts/src/EvidenceMap/EvidenceMapBase.tsx:23`) is the factor projection of this canvas. `CrossTypeEvidenceMap` (`packages/ui/src/components/EvidenceMap/CrossTypeEvidenceMap.tsx:20`) is **not** this surface — it is the radial defect-mode map. Its fate: **keep it as a defect-frame view** (it serves `AnalyzeMapView` + `MobileDashboard`) under a clearly separate name, or retire it if the defect frame absorbs it; do not let "Evidence Map" ambiguously name both.
- **`FactorNode` gains a `ruledOut` flag.** `FactorNode` (`packages/charts/src/EvidenceMap/FactorNode.tsx`) already sizes by contribution and dims two states: _weak_ (grey, R²adj < 0.10 — a statistical fact) and _un-examined_ (`explored === false`). There is **no `ruledOut` state** — add one. **Ruled-out is an analyst decision (a deliberate strike), distinct from weak/low-contribution (a statistic).** A 9% factor is weak; a factor the analyst examined and dismissed is ruled-out. They must render differently and never be conflated.
- **`WallCanvas`'s `questions: Question[]` prop is redefined by [ADR-085](adr-085-drop-question-problem-statement-scope.md), not merely deleted.** `WallCanvas` (`packages/ui/src/components/AnalyzeWall/WallCanvas.tsx:84`) requires a `questions` prop today; `CausalLink` (`packages/core/src/findings/types.ts:790`) carries `questionIds`. Dropping `Question` as an entity (ADR-085) means this prop and field are re-specified as part of that cascade — coordinate the change, do not delete `Question` in one place and leave `WallCanvas` requiring it.
- **Factor-family LOD + edge bundling do NOT ride `CanvasLevel`.** The 8f viewport LOD is renderer altitude only: `CanvasLevel = 'l1' | 'l2' | 'l3'` + `inferLevel(zoom)` (`packages/core/src/canvas/viewport.ts:1`) swaps whole renderers by zoom. Factor-family coarsening and edge bundling are fully net-new content transforms on the factor projection and must not be threaded through `CanvasLevel`.
- **Disconfirmation needs a write-path, not new derivation.** Derivation is already wired and tested: `hasUnresolvedDisconfirmation` + `evidenceTypesForHypothesis` (`packages/core/src/findings/hypothesisEvidence.ts:14-30`) and `deriveHypothesisStatus` (`packages/core/src/survey/wall.ts:24-45`). What is absent is the **record UI** + a **new HubAction** (e.g. `HYPOTHESIS_RECORD_DISCONFIRMATION`) — today `HypothesisAction` carries only ADD / UPDATE / ARCHIVE.
- **`setHubStatus` (manual status override) is orphaned** — zero component callers. Decide as part of this work: wire a manual-override affordance to it, or delete it. Do not leave dead override surface alongside the new disconfirmation write-path.
- **Pin the focused-entity id to a store.** The Focus lens needs a single source of truth for the focused entity. Either extend `useViewStore` highlights or add a dedicated field; do not let each renderer hold its own focus state (mirrors the [ADR-081](adr-081-canvas-viewport-architecture.md) "don't fork viewport state per renderer" principle).

### Methodological

- **Confirmation requires ≥2 evidence types + a survived disconfirmation attempt.** This is a soft _threshold for the "confirmed" label_, surfaced as caveats and `HOLDS X/Y`, not a hard gate that blocks the analyst from proceeding (prefer-pragmatic-over-formal). The point is to make weak support visible, not to lock the workflow.
- **Refute is counted, not just confirm.** The "LOUD refute" rule is methodological: the surface must make inconsistent evidence at least as visible as supporting evidence, so a hypothesis cannot quietly accumulate only its friends.
- **Contribution stays level-native.** Factor bars show level-native contribution per ADR-073 / [ADR-085](adr-085-drop-question-problem-statement-scope.md); no Cpk roll-up across heterogeneous units, no Pp/Ppk anywhere (Cp/Cpk only per [ADR-084](adr-084-capability-indices-cp-cpk-only.md)). Mechanisms are _suspected contributions_, never "root causes."

### Forward implication

- The net-new build is concentrated in: the **bipartite layout** (factor x/y in `useEvidenceMapData` + restructured Wall column), the **Focus-lens dimming**, the **factor-family LOD + edge bundling**, the **ACH matrix toggle**, and the **disconfirmation-recording write-path** (new HubAction + record UI). The underlying graph and the derivation helpers already exist — the work is projection and write, not new domain math.
- This ADR is downstream of [ADR-085](adr-085-drop-question-problem-statement-scope.md): the canvas projects whatever entity graph that ADR locks. Sequence ADR-085's cascade first; the `Question`-prop redefinition above is the seam between them.

### Documentation

- The [2026-05-29 investigation-surface design spec](../superpowers/specs/2026-05-29-investigation-surface-design.md) is the canonical "what" for this canvas; this ADR is the "why/that-we-decided." The [2026-04-19 Investigation Wall design](../superpowers/specs/2026-04-19-investigation-wall-design.md) describes the hypothesis-centric projection and is now framed as one face of this unified surface, not a standalone component.
- `packages/charts/CLAUDE.md` and `packages/ui/CLAUDE.md` should note the `EvidenceMapBase` vs `CrossTypeEvidenceMap` disambiguation so future agents do not treat the radial defect map as the unified canvas.

## Alternatives considered

1. **Keep two separate surfaces (status quo), improve cross-linking.** Rejected: the user remains the join between factor-side and hypothesis-side. Better cross-links are a patch on a structural split; the brainstorm settled on one graph, so the surface should be one canvas.
2. **Merge into a single global force-directed graph.** Rejected: this is the hairball failure mode. Force layout discards the contribution + graph-distance structure we already have and produces an unreadable tangle at scale. The Focus lens uses that structure instead of throwing it away.
3. **Reuse 8f `CanvasLevel` for factor-family coarsening.** Rejected: `CanvasLevel` swaps renderers by altitude; factor-family clustering is a content transform on one renderer's data. Overloading `CanvasLevel` couples two unrelated LOD concepts and would break the clean altitude semantics of [ADR-081](adr-081-canvas-viewport-architecture.md).
4. **Derive "confirmed" purely from evidence count, no recorded disconfirmation.** Rejected: a count-only rule rewards confirmation bias. Requiring a _recorded, survived_ disconfirmation attempt — a first-class write — is what makes the confirmed label trustworthy, and it is cheap given the derivation helpers already exist.
5. **Hard-gate the workflow on the ≥2-types + disconfirmation rule.** Rejected per prefer-pragmatic-over-formal: the threshold governs a _label and caveat_, not the analyst's ability to proceed. Soft signal catches the real risk (over-claimed confirmation) without ceremony.
