---
tier: stable
purpose: orient
title: 'Hub portfolios — multi-hub orchestration + drill semantics'
audience: human
category: strategy
status: named-future
last-reviewed: 2026-05-17
parent: docs/01-vision/variscout-process/index.md
related:
  - docs/archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md
  - docs/archive/specs/2026-04-29-multi-level-scout-design.md
  - docs/superpowers/specs/2026-04-28-production-line-glance-design.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
layer: L1
---

# Hub portfolios — multi-hub orchestration + drill semantics

> **Status: named-future capture.** Hub-as-first-class-noun, multi-hub portfolios, and the four drill operations are the structural shape of VariScout Process. V1 keeps the Hub internal (data architecture only) and operates per-project; Process surfaces the Hub as a navigable concept and adds portfolio-spanning operations.

## §1 Why the Hub becomes first-class in Process

In V1, the Hub is internal data architecture. It backs paste data + outcome + process map + factors, and it persists across projects, but no UI surfaces it as a navigable concept. Users see "Project" and "Process tab" — not "Hub." The Project is the user-facing container; the Hub is what the Project wraps.

This works for V1 because the V1 ICP is the Specialist running one project at a time with their invited team. The Hub doesn't need to be visible because the team's mental model is the project.

In Process, the buyer is different. The Process Owner persona owns one or more processes that produce outcomes the business cares about over time — independent of any individual Improvement Project. Their mental model is the process, not the project. The Hub IS the process — its canonical map, its outcome history, its accumulated investigation memory, its persistent identity across the projects that come and go on it.

When the Process Owner persona activates ([four-personas.md §2.1](four-personas.md)), the Hub must become visible. This is the structural pivot that everything else in Process hangs on.

## §2 What a Hub holds (Process scope)

A Process Hub holds the **persistent logic map** of a process line and everything that derives from it.

| Component                       | What it holds                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Canonical map**               | DAG of process steps, sub-steps, branches, joins. Persistent across projects. Authored by Process Engineer; revised over time with `canonicalMapVersion` tracking.       |
| **Specs per column / per step** | Target, USL, LSL, cpkTarget, characteristic type. Per the `capabilityScope` lookup indexed by `(node × context-tuple)` — supports multi-product, multi-supplier reality. |
| **Named contexts**              | Context dimensions discovered through branch/join in the canonical map. Drive context-tuple stratification at L2 and L3.                                                 |
| **Cadence definition**          | Manual / hourly / shiftly / daily / weekly. Drives Evidence Source semantics ([measurement-system.md §2](measurement-system.md)).                                        |
| **Evidence Sources**            | Recurring evidence streams (Line 4 fill-weight export, claims queue weekly extract, supplier intake defects, agent review log).                                          |
| **Snapshot history**            | Every dataset matched to this Hub becomes a dated Snapshot in its history.                                                                                               |
| **Investigation history**       | Every Improvement Project that has run on this Hub is preserved. Cross-project pattern memory federates Findings + Hypotheses across them.                               |
| **Finding history**             | Findings that have crossed the evidence threshold are anchored to canonical-map nodes. Visible across projects on the same Hub.                                          |
| **Process Owner reference**     | `processHub.processOwner` field — single tenant user reference per Hub. Drives default landing routing + persona-aware signoff gating.                                   |

The Hub data model already supports most of this in V1's internal storage. What changes in Process is **the UI** — Hub becomes a user-visible noun with its own surfaces (Hub list, Hub detail, Hub Capability tab, Hub cadence review, Hub portfolio overview).

## §3 Hub-of-hubs portfolio view

Plant > Line > Station modeled as **nested hubs**, not as nested ProcessMaps. The plant hub renders line-hub cards side-by-side. The line hub renders station-hub cards side-by-side. Each child Hub computes locally; the parent renders adjacent.

**Aggregation rule.** Visual side-by-side only, never arithmetic. Each child Hub computes its own per-step boxplots locally against its own specs; the parent hub renders them adjacent. There is no `meanCpkAcrossHubs()` and never will be. ADR-073's no-rollup invariant holds by structural absence — the engine exposes no function that produces a single statistical metric across heterogeneous Hubs.

**Example.** A regional plant has four lines (A, B, C, D). The plant Hub view shows four cards, each card a miniature production-line-glance dashboard for that line. Lines A and B run a `Coke 12oz` SKU; lines C and D run a `Sprite 16oz` SKU. The plant manager (Leader persona) sees that A and B's `Cap` boxes sit visibly lower than C and D's, prompting a focused investigation on A's capping torque calibration. No arithmetic was performed; the visual side-by-side carries the signal.

**Cross-hub context filter chip strip.** When the user filters at the plant Hub level by `Shift=Night`, the chip propagates to each child Hub's local computation. The plant view re-renders with each child Hub re-computed under the shared filter. Each Hub still computes its own metrics locally; the filter is a parameter, not an aggregation.

**Status in V1.** Not built. The same dashboard primitive multiplies across child hubs trivially (the per-(node × context) Cpk engine doesn't need to know it's running inside a portfolio). The remaining work is the plant-hub layout, side-by-side card composition, cross-hub context filter chip strip, and Leader-persona default landing.

## §4 The four drill operations

The Hub's analytical surface supports four navigation operations. Three are drills (each moves analytical focus to a finer scope); one is the organizational hierarchy view (Hub-of-hubs, §3 above). Each has its own aggregation rule and visual shape. **The naming-and-rules contract:** any new analytical surface must fit into one of these operations or be added explicitly to the framework.

### §4.1 Drill A — Hub → Step (the production-line-glance dashboard)

Click a step node in the canonical map. The step's per-step capability detail panel renders, scoped to that node's data across all contributing investigations and context-tuples.

**Aggregation rule.** Per `(canonical-node × context-tuple)` Cpk computed locally; visualized as a distribution (per-step Cpk boxplot). Each context-tuple contributes a box (or a dot when N is small); the analyst's eye does the pattern recognition; no arithmetic spans heterogeneous specs.

**Example.** On a coffee-roasting Hub, click the `Roast` node. The detail panel shows a boxplot of per-context Cpks for `Roast_Color`, with boxes for each lot batch the data carries. A target line at the Hub's `targetCpk` runs across; n<30 badges decorate the boxes for batches with thin samples.

**Status.** Engine shipped in V1 via PRs #103/#105/#106/#107 (per the source spec). The Hub Capability tab is live in azure-app today. **In V1, Drill A operates per-project.** In Process, Drill A operates per-Hub — the same engine, aggregating investigations across the Hub's history.

### §4.2 Drill B — Step → Channels (existing Performance mode)

A step with replicated equipment — four cavities of a multi-cavity press, eight heads of a filling carousel, two parallel underwriting queues — has a within-step comparison surface. Each replica is a channel; the question is "which channel is weakest?"

**Aggregation rule.** Same physics, same measurement column — comparison across channels is methodologically valid because the channels share specs.

**Example.** Inside the `Fill` step's investigation, switch to Performance mode. The Cpk-per-head bar chart shows heads 5–8 running tighter than heads 1–4. The analyst opens an i-chart filtered to head 6 to see a downward drift over the last four hours.

**Status.** Shipped in V1 Performance mode. **No change between V1 and Process.** The within-step comparison axis works identically at project scope and Hub scope.

### §4.3 Drill C — Step → Sub-flow (recursive ProcessMap)

A step CAN reference a sub-ProcessMap when the step is itself a complex sub-process. `Underwriting_Review` opens into `Document_Verify → Risk_Score → Compliance_Check → Approve_or_Refer`.

**Aggregation rule.** Same as Drill A applied at the sub-flow scope. The sub-flow has its own canonical-node set, its own spec rules, its own per-step boxplot.

**Example.** A claims-processing flow has an `Adjudicate` step that hides a five-step sub-flow. Click `Adjudicate` to drill in; the production-line-glance dashboard re-anchors on the sub-flow; per-step boxplots reveal that the `Manual_Triage` sub-step is the contribution leader, not the `Auto_Triage` sub-step the team had been instrumenting.

**Status in V1.** Engine + data model support it (a node may reference a child ProcessMap), and the dashboard primitive can re-anchor. The remaining work is the Drill C navigation affordance, recursion guard (max 1 level in V1), and breadcrumb UX. The decision-log entry on V1 surface debt notes this as a deferred sequencing item; it remains deferred and migrates to Process unchanged.

### §4.4 Org Hub-of-Hubs view

Plant > Line > Station rendered as side-by-side child-Hub dashboards, plus a cross-hub context filter chip strip. Covered in §3 above as its own surface (not a drill in the strict sense — it's an organizational hierarchy view, not a navigation between analytical scopes).

## §5 Governance — versioned canonical map

The Hub's canonical map is **versioned**. Hub owner (Process Engineer or Process Owner depending on the org) edits canonical structure + specs. Investigations pin a `canonicalMapVersion`; can `pull-latest` explicitly when they want to inherit upstream changes.

| Operation                             | Behavior                                                                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hub owner edits canonical map**     | Increments `canonicalMapVersion`. Existing investigations remain pinned to their version.                                                                                    |
| **Investigation `pull-latest`**       | Investigation re-pins to the current `canonicalMapVersion`. Run automatic node-mapping diff; flag any unresolvable mappings for the Specialist to address.                   |
| **Investigation `specsOverride` set** | Local fork — investigation uses its own specs instead of inheriting the Hub's. Flagged in UI as "local fork"; visible to the Process Engineer maintaining the canonical map. |

The B0 migration banner shipped in V1 PR #106 is the first user-facing surface of this governance model. In Process, the governance UI expands — Hub Engineer surfaces show pending pulls + local forks + version diffs.

This governance discipline is what keeps the Hub's canonical map coherent over time across many projects. Without it, every project's investigation slowly forks its own version of the process, and cross-project pattern memory (the Knowledge Catalyst feature) becomes worthless.

## §6 Multi-investigation lifecycle on one Hub

Multiple investigations can run on the same Hub concurrently. The Hub's investigation history accumulates them. Cross-project pattern memory (Knowledge Catalyst) federates Findings + Hypotheses across them.

**Hub-of-investigations dashboard.** Process Engineer / Process Owner persona view: "what's currently being investigated on this Hub?" — list of active projects, their lifecycle stages, Hypotheses in flight, Measurement Plans awaiting collection. V1 has the equivalent view per-project; the Process version is per-Hub, listing projects within.

**Investigation cross-reference.** When a new Hypothesis is created on a Hub, the Wall surface checks the Hub's historical Hypotheses + Findings for matches on the same `(step, factor)` pair. Suggestions surface as "previously investigated" hints. Specialists can choose to inherit prior Findings as evidence or start fresh.

**Cadence-anchored Measurement Plans.** Plans on a Hub-level investigation can fire at recurring cadence intervals (not just one-shot). When the cadence fires, the Plan re-collects evidence — a new Finding is auto-suggested to link to the recurring Plan. This is the engine that makes Process Hubs durable monitoring surfaces, not just project-scoped one-shots.

## §7 Process Hub as the cadence-review surface

The Process tab in Process is the Process Owner's default daily / weekly artifact. It looks much like the V1 Process tab structurally — same canvas substrate, same State / Edit modes, same L1/L2/L3 navigation — but the State mode surfaces additional Process-scope content:

- **Hub-overview drift dashboard** (Process Owner monitoring multiple Hubs sees a portfolio shape — covered in [monitoring.md §3](monitoring.md))
- **Cadence prompts** in the decisions queue (PMS-triggered review prompts — [measurement-system.md §3](measurement-system.md))
- **Cross-project Hypothesis cross-reference** when reading any step (pattern memory)
- **Investigation history** linked off each step (which projects have investigated this step? what did they find?)

The Process Owner's primary daily action is scanning the Process tab State mode and routing items from the decisions queue. Investigation work happens inside the projects nested under the Hub; the Process tab is the orchestration layer, not the workspace.

## §8 Cross-references

- The four drill operations are originally specified in [Investigation Scope and Drill Semantics §3](../../archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md). The named-future portions (Drill C, Org Hub-of-Hubs) are captured here.
- The Hub-of-hubs aggregation rule is locked by [ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md) (no statistical rollup across heterogeneous units).
- The multi-level architecture that drills operate on lives in [methodology.md](methodology.md) and [Multi-level SCOUT spec](../../archive/specs/2026-04-29-multi-level-scout-design.md).
- The per-`(node × context)` Cpk engine that Drill A renders is the production-line-glance engine — see [Production Line Glance design](../../superpowers/specs/2026-04-28-production-line-glance-design.md).
