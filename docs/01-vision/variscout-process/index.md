---
title: 'VariScout Process — Named-Future Capture'
audience: [product, designer, engineer, business]
category: strategy
status: named-future
last-reviewed: 2026-05-17
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/decision-log.md
  - docs/archive/specs/2026-05-14-variscout-coherence-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/archive/specs/2026-04-29-multi-level-scout-design.md
  - docs/archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md
  - docs/superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md
layer: L1
---

# VariScout Process — named-future capture

> **Status: named-future.** This is preserved institutional knowledge, not a product commitment. VariScout Process is the second product on the two-product roadmap — gated on V1 (the specialist tool) reaching ~500 customers. Nothing in this directory is in active development; nothing here ships under the V1 SKU; nothing here changes the V1 codebase. Read this when designing for V1 and a question surfaces that sounds like a process-owner / team / enterprise need — the answer is almost certainly here, and the answer is almost certainly "later, in Process."

## §1 Why this directory exists

The 2026-05-16 wedge pivot was a deliberate narrowing. The pre-wedge design corpus (~10 specs, ~3000 lines, March–May 2026) had converged on a four-persona, multi-Hub, auto-pipeline, monitoring-shaped product. Validating it against the actual ICP — improvement specialists running structured investigations with their teams — revealed that the breadth was the problem, not the solution. V1 collapsed the surface area: one persona (Specialist), one container (Project wrapping an internal Hub), one ingestion path (manual paste + file upload), one SKU (€120/mo Azure tenant-wide), one positioning sentence ("structured investigation for process improvement").

But the design work behind the breadth was not wrong. It was early. The wedge spec §7 named eight specific capabilities as deferred — not "coming soon inside V1" but "a separate product on the roadmap when V1 validates." That product is **VariScout Process**.

The deferrals scattered across ~10 source specs. This directory consolidates them. The goal is one canonical capture per concept, so that a year from now — when V1 has 500 customers and the team starts asking "what do we build next?" — the answer doesn't have to be re-discovered from spec archaeology. The concepts are here, named, with the boundary clearly drawn.

## §2 The two-product roadmap

|                   | **VariScout V1** (today)                                 | **VariScout Process** (future)                                                                                  |
| ----------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Audience          | Improvement specialists running projects with their team | Enterprises with ongoing process ownership                                                                      |
| Foundational unit | Project (self-contained, invite-scoped)                  | Process Hub (multi-project orchestration; first-class noun)                                                     |
| Collaboration     | Project Lead invites org users _per project_             | Tenant-wide with persona-aware routing                                                                          |
| Data ingestion    | Manual paste + file upload                               | Auto pipelines feeding Hub-level storage                                                                        |
| Persona model     | One — Specialist (with member-roles within projects)     | Four — Process Owner / Process Engineer / Specialist / Leader                                                   |
| Pricing           | €120/month, single SKU, Azure-tenant-wide                | TBD — separate product, separate SKU                                                                            |
| Distribution      | Azure Marketplace Managed Application + project ACLs     | TBD                                                                                                             |
| Knowledge memory  | Per-project Findings + Hypotheses + Measurement Plans    | Knowledge Catalyst at Hub scale — cross-project pattern memory federated across an org's full process portfolio |

V1 is not a stripped-down VariScout Process. V1 is a self-contained tool whose product anatomy fits the specialist workflow. Process is not a tier upgrade of V1 — it is a different product for a different buyer and a different operating shape. The shared substrate (browser-only processing, customer-owned data, deterministic stats engine, canvas as map, three-level methodology, response paths as routing pattern) is preserved across both. Everything else is product-specific.

## §3 The activation threshold — 500 customers, honestly framed

VariScout Process activates when V1 reaches roughly **500 paying customers**. The number is a proxy, not a calendar date. It encodes three preconditions:

1. **Product-market fit at the V1 ICP.** 500 specialists paying €120/mo means a working acquisition + retention loop for the specialist persona. Without that, scaling into process-owner buyer-territory is premature.
2. **Engineering capacity for a second product.** Building Process while V1 still has known gaps (V2 measurement system additions, signoff workflows, multi-project coordination at specialist scope) starves both. 500 customers funds a second product team.
3. **Customer-pull evidence that process ownership is the next layer.** If specialist customers consistently ask for process-owner monitoring as their next purchase, the deferred design becomes a validated commitment. If they ask for something else, this capture stays preserved and the roadmap turns.

This is honest framing: VariScout Process is gated on V1 working. If V1 doesn't validate, the deferred design doesn't activate. Nothing in this directory entitles itself to a build slot.

## §4 V1-vs-Process boundary — one-paragraph summary

Several features are **shipped in V1 code today** but serve specialist use at V1's scope. The same features at process-owner / multi-hub / enterprise scope are deferred to Process: Hub Capability (V1: per-project capability snapshot; Process: persistent process-owner monitoring across snapshots), Layered Process View (V1: canvas substrate for one project's process; Process: Hub-scale orchestration across multiple projects sharing one canonical map), multi-level SCOUT (V1: L1/L2/L3 within one project's data; Process: portfolio-spanning multi-Hub navigation), Investigation Wall + Measurement Plans (V1: per-project Hypothesis evidence + planning; Process: cross-project pattern memory). The detailed scope-line for each feature lives in [scope-line.md](scope-line.md) — read that doc when "is this V1 or Process?" is the actual question.

## §5 What's inside

| File                                               | One sentence                                                                                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[scope-line.md](scope-line.md)**                 | The V1-vs-Process feature boundary, drawn for each shipped capability that lives in V1 today. **Start here when triaging a feature request.**                                                                            |
| **[four-personas.md](four-personas.md)**           | Process Owner / Process Engineer / Specialist / Leader — the four-persona model designed in Coherence Session A. Specialist is the V1 persona; the other three activate in Process.                                      |
| **[hub-portfolios.md](hub-portfolios.md)**         | Hub-of-hubs orchestration, multi-hub portfolios, the four drill semantics (Hub→Step / Step→Channels / Step→Sub-flow / Org Hub-of-Hubs).                                                                                  |
| **[measurement-system.md](measurement-system.md)** | The Process Measurement System (PMS) — stable measure definitions + Evidence Sources + Snapshots + cadence rules combining into Current Process State. The named-future surface that triggers response paths at cadence. |
| **[methodology.md](methodology.md)**               | The three-level methodology (Outcome / Process Flow / Local Mechanism), Watson-validated. Operates per-project in V1; spans the portfolio in Process.                                                                    |
| **[pipelines.md](pipelines.md)**                   | Auto-ingestion, multi-source profile join, sensor / SCADA / ERP feeds, scheduled refresh. The "automated data" half of process ownership.                                                                                |
| **[monitoring.md](monitoring.md)**                 | Drift detection, alerts, process-owner monitoring views, capability snapshots over time. The "ongoing watching" half of process ownership.                                                                               |

## §6 Reading order

For someone landing here without context:

1. **Start with §4 of this file + [scope-line.md](scope-line.md)** to understand which V1 features are also Process features (just at smaller scope) and which are Process-only.
2. **Then [four-personas.md](four-personas.md)** because the persona model is the largest single conceptual shift V1 → Process. Most of what comes next is anchored on which persona consumes it.
3. **Then [methodology.md](methodology.md)** — the methodology is shared across both products, but the spec gets clearer at Process scope because the three levels each have a different primary persona.
4. **Then [measurement-system.md](measurement-system.md) + [monitoring.md](monitoring.md)** as a pair — PMS produces Current Process State; monitoring is the cadence-review surface that consumes it.
5. **Then [hub-portfolios.md](hub-portfolios.md) + [pipelines.md](pipelines.md)** as a pair — the structural substrate (multi-hub) and the data substrate (auto-feeds) that Process operates on.

For someone working in V1 today and wanting to understand a single Process concept: jump to the file. Files cross-link to each other and to source specs. They do not chain.

## §7 What this directory is not

- **Not a product commitment.** Nothing here ships under the V1 SKU. Nothing here changes the V1 codebase. If V1 fails to validate, Process does not activate; this directory remains a preserved record of design work, not a guarantee of delivery.
- **Not agent-canonical.** Agents reading `docs/llms.txt` or the Phase A anchors (positioning, business-bible, roadmap) are explicitly not steered here. The breadcrumb is via [docs/decision-log.md](../../decision-log.md) only — future humans grepping for "VariScout Process" find this. Agents working on V1 should not be coloring V1 designs with Process concepts.
- **Not a spec.** This is institutional capture, not a buildable design. When VariScout Process activates, each file here becomes a starting point for design refinement, not the final spec. The decisions encoded here are concept-level, not implementation-level.
- **Not the wedge.** The word "wedge" is the internal engineering vocabulary for the 2026-05-16 pivot. Customer-facing language is "VariScout V1" (or simply "VariScout") for the current product and "VariScout Process" for the future one. This directory uses the customer-facing names throughout.

## §8 How this capture relates to source specs

The source design corpus is not deleted. Specs in `docs/superpowers/specs/` carry an Amendment block at the top (added 2026-05-16) marking which sections retire for V1 and which survive. The Process-shaped content in those specs is the original source; this directory is the consolidation.

When you want depth, click through to the source spec. When you want one canonical answer per concept, stay here. Each file in this directory cross-links to the source specs whose content it synthesizes.

The canonical statement of the V1-vs-Process split — the strategic decision that this directory preserves the deferred half of — lives in [wedge architecture spec §7](../../superpowers/specs/2026-05-16-wedge-architecture-design.md) and is recorded as item #8 of the 2026-05-16 entry in [docs/decision-log.md](../../decision-log.md).

## §9 If V1 succeeds — what activates first

Speculation, not commitment. If V1 reaches the 500-customer threshold and customer-pull confirms process-owner buyer interest, the natural activation sequence is:

1. **Process Owner persona + Process tab persona-aware default landing** ([four-personas.md](four-personas.md) §3). The smallest activation that introduces the new buyer without restructuring the data model.
2. **Hub-as-first-class-noun in the UI** ([hub-portfolios.md](hub-portfolios.md) §2). Today Hub is the internal data container; surfacing it as a navigable concept is the structural pivot that everything else hangs on.
3. **Process Measurement System surface** ([measurement-system.md](measurement-system.md) §2–3). The cadence-review surface that gives Process Owners their primary daily / weekly artifact.
4. **Auto-pipelines for one anchor data shape** ([pipelines.md](pipelines.md) §2–3). Not generalized ingestion — one well-documented profile (agent review log, or a comparable anchor) that proves the recurring-snapshot pattern.
5. **Drift detection + monitoring views** ([monitoring.md](monitoring.md) §2–3). The "ongoing watching" layer that earns the Process Owner's daily attention.
6. **Hub-of-hubs portfolio view** ([hub-portfolios.md](hub-portfolios.md) §3). The Leader persona's primary surface; activates when Process has enough installed base to make cross-process navigation valuable.

This sequence is not in any spec. It is a reading of which capabilities depend on which, given the architecture in [methodology.md](methodology.md) and [hub-portfolios.md](hub-portfolios.md). When activation actually happens, the team will re-plan from first principles against the customer-pull signal of the day.

---

> Process is not coming soon. Process is preserved. V1 is the bet; this directory is the long game.
