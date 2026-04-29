---
title: 'Process Hub Capability Tab'
audience: [analyst, engineer, product]
category: analysis
status: stable
last-reviewed: 2026-04-29
related: [production-line-glance, process-hub, capability, hub-cadence-review]
---

# Process Hub Capability Tab

The Process Hub Capability tab is the process-owner cadence-review surface for hub-level capability. Olivia (OpEx) and Gary (Green Belt) use it to answer "is this hub meeting its capability target across its steps, where is the gap widening, and which step deserves attention this week?" without leaving the Hub view.

## Where it lives

Azure-only, mounted under the Process Hub view as a workspace tab (route: `/hub/:hubId/capability`). The PWA does not have Hub IA today; this tab is part of the Azure-tier hub-first operating spine. Shipped via PR #106 (Plan C1).

## Four chart slots

The tab embeds the [`ProductionLineGlanceDashboard`](../../superpowers/specs/2026-04-28-production-line-glance-design.md) primitive in a fixed 2x2 grid:

| Slot         | Chart                     | Reads                                                               |
| ------------ | ------------------------- | ------------------------------------------------------------------- |
| Top-left     | **Cpk vs target i-chart** | Per-step Cpk trend with target overlay; "are we hitting the bar?"   |
| Top-right    | **Cp-Cpk gap trend**      | Centering loss over time; "is the gap widening or closing?"         |
| Bottom-left  | **Per-step Cpk boxplot**  | Distribution of Cpk across steps; reveals heterogeneity at a glance |
| Bottom-right | **Per-step error Pareto** | Which steps contribute most to defect/error volume                  |

The boxplot is the load-bearing visualization: it shows the per-step Cpk _distribution_ without collapsing it into a mean. See [ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md).

## Filter strip

A hub-level context-filter strip sits above the grid. Filter state is URL-serialized so cadence reviews can share the exact lens. The filter limits which (canonical-node × context-tuple) cells the dashboard reads; it never aggregates across heterogeneous spec contexts.

## B0 migration banner

When the hub contains investigations whose nodes are not yet mapped to canonical steps (B0 unmapped scope), a non-blocking banner appears above the dashboard pointing at the FRAME mapper. The dashboard still renders for the mapped portion.

## Drill A semantics

Clicking a step in any of the four charts opens the investigation that maps that step (Drill A: Hub → Step → Investigation). If no investigation maps the step, the drill becomes a "create investigation here" affordance. Drill A semantics are normative across all production-line-glance surfaces; see the [investigation-scope-and-drill-semantics design](../../superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md).

## Coexistence with Performance mode

Performance mode (per-channel Cpk inside one investigation) is _within-step_: how do the cavities/heads/lanes of a single station compare? The Hub Capability tab is _across-step_: how do the steps of a hub compare? Both can be open at once for the same hub; they answer different questions.

## No-aggregation principle

The tab never displays a single hub-level Cpk number. Per-step Cpks come from heterogeneous spec contexts and are not arithmetic-combinable; the boxplot shows their distribution and the analyst's eye does the pattern recognition. The engine exposes no `meanCapability` / `aggregateCpk` primitive. This is the structural enforcement described in [ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md).

## See also

- [Production-Line-Glance design](../../superpowers/specs/2026-04-28-production-line-glance-design.md) — the dashboard primitive.
- [Investigation Scope and Drill Semantics](../../superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md) — B0/B1/B2 scope, Drill A/B/C.
- [ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md) — no statistical roll-up across heterogeneous units.
- [Process Hub design](../../superpowers/specs/2026-04-25-process-hub-design.md) — the operating spine the tab plugs into.
