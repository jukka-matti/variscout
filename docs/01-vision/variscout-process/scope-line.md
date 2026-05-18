---
title: 'V1-vs-Process scope line — feature boundary'
audience: [product, designer, engineer]
category: strategy
status: named-future
last-reviewed: 2026-05-17
parent: docs/01-vision/variscout-process/index.md
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/specs/2026-04-28-production-line-glance-design.md
  - docs/archive/specs/2026-04-29-multi-level-scout-design.md
  - docs/archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md
layer: L1
---

# V1-vs-Process scope line — feature boundary

> **Status: named-future capture.** This is the cleanest doc in the directory. It answers one question: **"is this V1 or Process?"** for every shipped capability that could plausibly belong to either product.

## §1 How to read this doc

V1 (the specialist tool) ships today. VariScout Process is named-future. Most pre-wedge design work created **shared substrate** — code that ships in V1 but was originally designed for process-owner / multi-hub / enterprise scope. Drawing the line for each capability prevents two failure modes:

1. **Scope creep into V1.** A specialist asks "can I monitor capability across multiple processes?" — that sounds reasonable, but answering "yes" smuggles Process-scope behavior into V1 and breaks the V1 scope.
2. **Throwing away shipped value.** When Process activates, the team will benefit from extending capabilities already coded rather than rebuilding from scratch. Knowing which V1 capabilities have Process-shaped headroom guides Phase 1 of Process activation.

The table format below is the contract. For each capability: **V1 shape** (what ships today, at specialist scope) vs **Process shape** (what activates when Process activates).

## §2 Shipped V1 capabilities with Process headroom

These are the capabilities that exist in V1 code today and have explicit Process-scope extensions designed but deferred.

### §2.1 Hub Capability (`ProductionLineGlanceDashboard` + `ProcessHubCapabilityTab`)

**V1 shape.** Per-project capability snapshot rendered inside the Process tab's L2 view. The engine — per-`(node × context-tuple)` Cpk computation shipped via PRs #103/#105/#106/#107 — runs against the single project's data. The per-step Cpk boxplot honors ADR-073 (no statistical rollup across heterogeneous units) by visualizing distributions, never collapsing them. The four shipped slot variants (capability, performance, defect, yamazumi) all operate within one project's scope.

**Process shape.** Same engine, **persistent across snapshots**, owned by the Process Owner persona, rendered on the Process Hub's primary surface (not buried inside a per-project tab). Multiple projects on the same Hub contribute investigations; each investigation's `nodeMappings` adds to the Hub's per-step distribution. The Hub Capability tab in Process is the cadence-review surface that triggers response paths — see [measurement-system.md §3](measurement-system.md). The engine doesn't change; the scope changes from "this project's data" to "this Hub's history across all contributing investigations."

**Where the line falls.** Aggregation engine + boxplot primitive + capability badge UI: shared across V1 and Process. **Cadence prompts firing off snapshot history, Process Owner default landing on this surface, Hub-of-hubs side-by-side card composition: Process only.** V1 specialists don't see cadence prompts on the capability surface.

### §2.2 Layered Process View / Canvas substrate

**V1 shape.** Canvas IS the Process tab's architectural substrate. 8f viewport architecture (PRs #160–#168) wires `useCanvasViewportStore` to `ProjectId` when project-scoped. L1/L2/L3 navigation via pan/zoom within one project's process. Cards-per-step rendering with inline mini-charts and capability badges. State + Edit mode toggle (the latter being where the Frame step lives). Single Specialist persona uses both modes.

**Process shape.** Same canvas primitive, **keyed by `ProcessHubId` for free-roaming Hub navigation**. The Hub is the persistent map across multiple projects. Process Owner enters the canvas in State mode by default — read-only, monitoring shape. Process Engineer enters in Edit mode — authoring the canonical map that multiple projects then share. Specialists working on a Process-hosted Hub see the canvas just like in V1, but their changes operate _on top of_ a Hub map that persists beyond any one project.

**Where the line falls.** Canvas component + pan/zoom + cards-per-step + 8f viewport architecture: shared. **Hub as a first-class user-visible noun, multi-project navigation via the canvas, persona-aware default modes (Process Owner → State, Process Engineer → Edit), persistent canonical map separate from any one project: Process only.** In V1 the Hub is internal data architecture invisible to the user; in Process it surfaces as a navigable concept.

### §2.3 Multi-level SCOUT (L1 / L2 / L3 architecture)

**V1 shape.** Each project has L1 (outcome distribution + Cpk vs spec), L2 (process flow with step cards), and L3 (focal step / Local Mechanism detail) — navigated via canvas pan/zoom. The `AnalysisModeStrategy.dataRouter` pattern routes per-`(mode × scope × phase × window)` to existing chart slots without inventing new ones. `detectScope` reads `nodeMappings` cardinality to distinguish B0 (legacy) / B1 (multi-step) / B2 (single-step). The four-slot dashboard becomes polymorphic across levels.

**Process shape.** Same three-level architecture, **portfolio-spanning when navigating across multiple Hubs**. Drill A (Hub → Step) operates on the Hub's aggregated investigations rather than one project's data. Drill B (Step → Channels) and Drill C (Step → Sub-flow) unchanged in shape; they apply at Hub scope. The Org Hub-of-Hubs view ([hub-portfolios.md §3](hub-portfolios.md)) becomes the new top-level entry surface, side-by-side rendering child Hub miniatures. Timeline window primitive supports rolling / open-ended / cumulative modes for cadence-aware investigation.

**Where the line falls.** L1/L2/L3 levels + dataRouter pattern + timeline window primitive + drill A/B/C engine: shared. **Org Hub-of-Hubs view + portfolio-spanning navigation + cross-Hub context filter chip strip + cadence-anchored timeline window defaults: Process only.** V1 timeline windows operate within one project's data; Process timeline windows traverse Hub history.

### §2.4 Investigation Wall + Measurement Plans

**V1 shape.** The Wall (`WallCanvas` + lifecycle hooks) hosts Hypothesis-driven investigation per-project. PR-WV1-3b shipped Measurement Plans as a sub-entity per Hypothesis — Plan rows describing factor / method / sample size / owner / status. The Plan → Collection → Finding cycle integrates measurement planning, current-data analysis, and gemba / expert collection into one spatial surface. ADR-080's Sustainment auto-fire pattern preserved.

**Process shape.** Same Wall primitive + same Measurement Plan entity, **with cross-project pattern memory**. Hypotheses from prior projects on the same Hub surface as "previously investigated" hints when a new project touches the same step / factor. Knowledge Catalyst (the named-future pattern memory feature) federates Findings across projects. Cadence-anchored Measurement Plans — Plans that fire at recurring intervals as part of the Hub's PMS — extend the V1 Plan entity with a `cadence?` field. MSA / Gage R&R workflow that V1 explicitly defers belongs here; same for the statistical sample-size calculator.

**Where the line falls.** Wall canvas + Hypothesis card structure + Measurement Plan entity + Plan→Collection→Finding cycle: shared. **Knowledge Catalyst pattern memory, cadence-anchored Plans, MSA / Gage R&R workflow, statistical sample-size calculator: Process only.** V1 Measurement Plans are project-scoped one-shot artifacts.

### §2.5 Three-level methodology (Outcome / Process Flow / Local Mechanism)

**V1 shape.** The methodology is the substrate — [`docs/01-vision/methodology.md`](../methodology.md) lines 76-100. It operates per-project: the specialist works at all three levels within one project's scope, with one persona (themselves) playing all three methodological roles. No persona-routing of levels in V1.

**Process shape.** Same three levels, but each level has a **primary persona** ([four-personas.md §2](four-personas.md)) — Process Owner reads at L1 outcome scope, Specialist works at L3 mechanism scope, Process Engineer maintains L2 flow structure, Leader reads L1 across the portfolio. The level × persona mapping is the conceptual core of the Process product. Methodology rules (ADR-073, contribution-not-causation, observed-vs-expected, sample-size honesty, target-relative Cpk grading, geometric interaction language) unchanged across both products.

**Where the line falls.** Three-level methodology + ADR-073 + methodology rules: shared. **Persona-aware level routing, default landing per persona, persona-aware copy density, persona-adaptive Home variants: Process only.**

## §3 V1-only capabilities (Process inherits or transforms)

These capabilities are V1's anatomy. They don't survive into Process unchanged.

### §3.1 Project as foundational unit

**V1 shape.** Project (Charter / Approach / Sustainment, with Improve as a top-level verb tab) is the user-facing container. Internal Hub backs each project's data. Project membership ACLs (Lead / Member / Sponsor) scope access. Promotion path from quick analysis → Project via "+ New Project" CTA.

**Process inherits.** Projects survive in Process, but they wrap a **persistent Hub** rather than the Hub being internal-to-project. Multiple projects share one Hub. Project lifecycle (Charter ceremony, membership invites, formal artifacts) unchanged. The promotion path "quick analysis → Project" still works for analysts who want formal scoping inside Process tenancy. Project membership ACLs operate alongside (not in place of) persona-aware routing.

### §3.2 Project membership ACLs (Lead / Member / Sponsor)

**V1 shape.** Per-project membership ACLs. Project Lead invites org users from the buyer's Azure AD tenant. Lead / Member / Sponsor roles. Sponsor sees Report-only access. Cross-Azure-AD-tenant invites explicitly out of scope.

**Process inherits.** Project-scoped ACLs still operate. They layer on top of persona-aware tenant-wide routing. A Process Owner persona (tenant-wide read on their assigned Hubs) may or may not be a Lead / Member on a specific project running inside their Hub. The ACL model expands to support cross-Hub Sponsorship and Hub-level membership (the Process Owner of Hub X is implicitly Sponsor on all projects in Hub X). The Azure AD-tenant boundary tightens further or loosens; that's a Process-era distribution decision.

### §3.3 Single SKU pricing (€120/mo Azure-tenant-wide)

**V1 shape.** One price, one SKU, Azure Marketplace Managed Application. Honors the per-deployment hypothesis (ADR-033 H6).

**Process transforms.** Process is a separate product on a separate SKU. Pricing TBD. The V1 €120 SKU is preserved (specialists still buy V1; specialists working inside a Process-tenanted org buy through Process). No tier-gating returns to V1 surfaces — the tier philosophy as a public-facing concept retires at the V1 cutover and does not re-activate in Process. Access-gating in Process happens via project membership ACLs + persona-aware routing, not tier checks.

### §3.4 Six / seven-tab navigation

**V1 shape.** `[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]` — 7 tabs in workflow order, with Improve restored as a top-level verb tab (per the 2026-05-16 amendment). Active-IP cascade routes verb tabs to project-scoped defaults.

**Process inherits + adapts.** The nav primitives survive. **Process Owner persona's default landing is the Process tab in State mode** — not Home. Tenant-wide navigation reads Hub-first. Persona-adaptive Home variants ([four-personas.md §2.4](four-personas.md)) replace the V1 single-persona Home. Verb tabs (Analyze / Investigation / Improve) cascade off the active project as in V1; but the project may sit inside a Hub the user navigated to before they activated a project.

## §4 Process-only capabilities (no V1 shape)

These do not exist in V1 code and have no V1 surface. They activate only in Process.

| Capability                                                                   | Source spec                                                                                                                                                                                                                                                       | One sentence                                                                                                                    |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **4-persona model** (Process Owner / Process Engineer / Specialist / Leader) | [Coherence §3](../../archive/specs/2026-05-14-variscout-coherence-design.md), [four-personas.md](four-personas.md)                                                                                                                                                | Persona-aware tenant routing replaces the V1 single-Specialist model.                                                           |
| **Process Measurement System (PMS)**                                         | [Evidence Sources spec](../../superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md), [Consolidated method §4](../../archive/specs/2026-04-29-consolidated-method-and-surface-overview-design.md), [measurement-system.md](measurement-system.md) | Stable measure definitions + Evidence Sources + Snapshots + cadence rules combining into Current Process State.                 |
| **Auto-ingestion pipelines** (sensor / SCADA / ERP / hourly feeds)           | [Evidence Sources spec](../../superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md), [pipelines.md](pipelines.md)                                                                                                                                | Automated recurring evidence feeding Hub-level storage. V1 is paste / file only.                                                |
| **Multi-source profile join** at Hub scale                                   | [Framing Layer spec](../../archive/specs/2026-05-03-variscout-vision-design.md), [pipelines.md](pipelines.md)                                                                                                                                                     | Multiple sources contributing to one canonical map via Data Profiles. V1's MatchSummary primitives operate per-project.         |
| **Process Owner monitoring dashboard**                                       | [Vision spec §5](../../archive/specs/2026-05-03-variscout-vision-design.md), [monitoring.md](monitoring.md)                                                                                                                                                       | State-mode cadence-review surface separate from the per-project Process tab — Hub-overview shape, drift signals, alert routing. |
| **Hub-of-hubs portfolio view**                                               | [Investigation scope spec §6](../../archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md), [hub-portfolios.md §3](hub-portfolios.md)                                                                                                        | Plant > Line > Station rendered as side-by-side child Hub cards. Per-Hub local computation, never cross-Hub arithmetic.         |
| **Knowledge Catalyst at Hub scale**                                          | [Wedge spec §7](../../superpowers/specs/2026-05-16-wedge-architecture-design.md)                                                                                                                                                                                  | Cross-project pattern memory federated across an org's full process portfolio.                                                  |
| **Gage R&R / formal MSA workflow**                                           | [Wedge spec §3.6.5](../../superpowers/specs/2026-05-16-wedge-architecture-design.md)                                                                                                                                                                              | Measurement-system-assessment UI + MSA calculator. V1's `msaRequired?` flag is informational only.                              |
| **Statistical sample-size calculator**                                       | [Wedge spec §3.6.5](../../superpowers/specs/2026-05-16-wedge-architecture-design.md)                                                                                                                                                                              | Power-analysis helper for Measurement Plans. V1 sample size is manual entry.                                                    |
| **In-app Sponsor signoff workflow**                                          | [Wedge spec §4.1](../../superpowers/specs/2026-05-16-wedge-architecture-design.md)                                                                                                                                                                                | Signoff queue + audit trail. V1 handles Sponsor signoff out-of-band.                                                            |

## §5 The line in one sentence

V1 ships what one specialist needs to investigate one project with their invited team. Process ships what a process owner needs to monitor multiple projects on a persistent Hub, across an organization with multiple personas working at different methodological levels.

Anything that smells like "ongoing watching," "multi-project orchestration," "persona-aware default behavior," "cross-Hub anything," or "automation that runs while no one is looking" is a Process feature. Anything that's "this specialist, this project, this evidence, this team I invited" is V1.

When the smell-test fails: **default to V1 deferral, not Process backport.** If specialists are asking for it inside V1, the V1 architecture spec has likely already named the deferral path. Check [wedge spec §7 + §10](../../superpowers/specs/2026-05-16-wedge-architecture-design.md) before adding.
