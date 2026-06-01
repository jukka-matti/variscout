---
title: 'open-design-threads'
description: 'Open design threads for the next session post-LV1-Phase-1 closeout (2026-05-29). Two clusters that share wedge V1 fabric but address different concerns: Cluster A (PWA/Azure closure model + SKU positioning), Cluster B (analysis surface architecture). Cluster B depends on Cluster A''s closure decision.'
purpose: remember
tier: card
status: active
date: 2026-06-01
topic: [memory, project]
related: []
verified-against-commit: fe1b0755
last-verified: 2026-06-01
source-hash: 20234e8fef2e49bc
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_open_design_threads.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

After LV1 Phase 1 shipped + closeout PR #241 + Task #40 (PR #242), the following open threads were left for a dedicated design session.

## Cluster A — Where does Azure end and PWA begin?

**Linked because all three depend on the same closure-model + SKU-positioning decision:**

- **#12 ControlHandoff design (wedge V1 closure model)** — Pending. User indicated 2026-05-29 that Sponsor signoff was simplified out of the design, but the simplified model never made it into canonical docs. Personas/index.md + lead.md + the wedge spec still describe Sponsor as a gatekeeper ("reviews Control + signs off Report"). Code still has `onRequestSignoff` / `onApproveSignoff` props in `ProjectsTabView.tsx`. The actual current closure model is uncaptured. #12 needs to settle it.
- **PWA ↔ Azure convergence (raised 2026-05-29 by user)** — User wants PWA to gain Frame + Process. Currently PWA = "paste + Explore + Analyze stub" (pre-Project Mode 1); Azure = full Project lifecycle. If Frame + Process land in PWA: LV1-G canvas viz works there, LV1-F/G PWA TODOs close, Mode 1 grows from "paste + explore" to "structured solo investigation." The natural seam shifts from "PWA = pre-Project / Azure = in-Project" to "PWA = solo flow / Azure = collaboration + cloud + audit." Depends on what #12 settles: if signoff is gone, Azure's distinguishing value collapses to collab/persistence/audit.
- **#37 Mode 1 journey doc** — pre-Project journey doc to add to `docs/02-journeys/`. If PWA gains Frame + Process, this doc's content changes dramatically.

**Why Cluster A is upstream of Cluster B:** the closure-model decision affects which Project lifecycle pieces are in scope at all — which in turn affects whether the analysis surfaces (Analyze tab, Explore modes) need to support Sponsor-readable views, audit-trail surfaces, etc.

## Cluster B — Analysis surface architecture

**Linked because Explore + Analyze tabs share the analysisScopeStore + chart wrappers + user moves between them inside a Project:**

- **#11 Analyze-tab design (Pareto + lens model)** — Pending. The Analyze tab (Wall + Evidence Map + hypotheses). Specifically: how does Pareto from Explore land in Analyze as a hypothesis-generating affordance? What's the lens model that ties chart artifacts (from Explore) to hypotheses (in Analyze)?
- **#50 T-NEW-3 Explore mode/lens system rethink** — Pending. The Explore tab has 5 modes today (`standard` / `capability` / `performance` / `defect` / `process-flow`) per `AnalysisMode` union. Question is whether modes should consolidate to fewer/different "lenses" or stay as-is. Companion to #11.
- **#51 T-NEW-4 Linked Views Phase 2** — Pending. Bidirectional cross-filtering: I-Chart point click / Histogram bucket click / Capability annotation click → scope mutation. Plus pop-out window for Process+Explore side-by-side. Phase 1 (just shipped) is unidirectional (canvas → Explore + chart-click categorical accumulate). Phase 2 closes the loop.

## Cluster C — Findings / Hypotheses domain + UI views

**Linked because the Investigation-domain entities are the connective tissue across all the analysis surfaces in Cluster B:**

- **Implementation reality:** NOT aspirational. Full type system in `packages/core/src/findings/` (Finding + Hypothesis types, `FindingSource` discriminated union with 6 variants, status workflows, factories, persistence boundary). Hub has top-level `findings` collection; IP has `sections.investigationLineage.{findingIds, hypothesisIds}`. UI surfaces `FindingsPanel`/`FindingsWindow`/`FindingsLog` shipped. See [[findings-hypotheses-implementation-reality]] — grep before claiming "not built yet."
- **Wedge V1 anchor:** "3 canvas response paths" per [[wedge-v1]] are `Capture as Finding / Investigate / Charter`. Findings are first-class in the response-path system.
- **Cross-tab span:** Created from Explore charts (breadcrumb-pinned + chart-attached via `FindingSource` variants), surfaced in Analyze tab (Investigation Wall), referenced on Process canvas chips (lineage badges from LV1-D affordances), drive Improvement actions in Improve tab.

**Open design questions:**

- **UI views:** how do Findings render in the Analyze Wall vs. as chart-attached annotations in Explore vs. as lineage badges on canvas chips?
- **Handling / lifecycle:** how does a user create a Finding (chart drag, drop, command palette)? Promote Finding → Hypothesis? Mark Hypothesis confirmed / ruled-out / contributing-cause? Status workflow today is `'observed' | 'investigating' | 'analyzed' | 'improving' | 'resolved'` (per `FindingStatus`) — does the shape still hold?
- **Linkage chain:** Finding → Hypothesis → `SuspectedCause` → `CausalLink` → Outcome/Factor — what's the canonical visual representation on the Wall? Evidence Map (per ADR-074) is the L2-flow factor-network rendering; how does it interact with hypothesis tiles?
- **Cross-Project memory:** Findings live on Hub (cross-Project investigation memory per `project_wedge_v1`). When PWA gains Frame + Process (Cluster A), does PWA get the Hub-scoped findings collection? Or is Hub-scope strictly Azure?
- **Phase 2 overlap:** does clicking a hypothesis tile on the Wall set `analysisScopeStore`? Does Pareto bar click in Explore offer a "Capture as Finding" affordance alongside the LV1-F categorical accumulate? Where's the seam between scope mutation (Phase 2 / #51) and finding capture?

**Why this matters now:** #11 and #50 both depend on how Findings + Hypotheses thread through the analysis surfaces. Skipping this from the design conversation would leave a hole. Cluster C is downstream of Cluster A (closure model affects what "lineage" means at the end of a Project) and overlaps Cluster B (Findings ARE the artifacts the Explore/Analyze tabs surface).

## Drift surfaced (deferred to next session)

- **Sponsor / closure-model doc drift** — discovered 2026-05-29 during PWA convergence conversation. Personas/index.md says "Sponsor — reviews Control + signs off Report"; user says that's stale. The actual current Sponsor model + closure flow needs to be (a) settled if not yet (likely #12 territory), then (b) propagated to docs (glossary, personas, wedge spec, ADR-082, decision-log).

## How to approach in the next session

Run **Cluster A** as a brainstorming session FIRST — it gates Cluster B+C. The PWA/Azure boundary + #12 closure model + Sponsor disposition are entangled and should be settled together. Then Cluster C (Findings/Hypotheses domain), then Cluster B (surfaces that handle them).

**Methodology grounding is mandatory** — these threads are methodology-driven decisions, not surface tweaks. Before opening any cluster, read:

- `docs/01-vision/methodology.md` — V1 canonical methodology (3-evidence types, question-driven EDA, journey spine)
- `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` — three-level methodology + Process Measurement System + response paths
- `docs/01-vision/eda-mental-model.md` — Issue Statement vs Problem Statement (matters for Cluster B Analyze tab)
- `docs/01-vision/four-lenses/` — four lenses of variation (matters for Cluster B #50 mode/lens rethink)
- `docs/01-vision/positioning.md` — V1 audience + buyer-persona positioning (matters for Cluster A SKU question)

Cross-check: the methodology docs may themselves carry drift if the closure model was simplified post-T-NEW-1 — flag any methodology-doc statements that contradict the simplified Sponsor/closure model the user describes, and treat those as additional Sponsor-drift surface to address.

Related: [[wedge-v1]] · [[linked-views-phase-1]] · [[docs-closeout-lifecycle]] · [[findings-hypotheses-implementation-reality]] · [[variscout-vision]].
